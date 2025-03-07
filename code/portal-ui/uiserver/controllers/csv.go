package controllers

import (
	"bufio"
	"context"
	"encoding/base64"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"crypto/tls"

	"golang.org/x/text/encoding/korean"
	"golang.org/x/text/transform"

	"compress/gzip"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"ktml.io/csvpreview/config"
)

type CsvController struct{}

var CWD string
var minioClient *minio.Client

var maxLines int
var encoding string

func RouteCsv(g *gin.RouterGroup) {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	CWD = filepath.Join(cwd, "workspace")
	os.MkdirAll(CWD, os.ModePerm)

	h := g.Group("csv")
	{
		doc := new(CsvController)
		h.GET("/preview", doc.Preview)
	}

	c := config.GetConfig()
	encoding = c.CsvEncoding
	maxLines = c.CsvMaxLines
	endpoint := c.S3Endpoint
	accessKeyID := c.S3AccessKey
	secretAccessKey := c.S3SecretKey
	useSSL := c.S3Ssl

	transport, _ := minio.DefaultTransport(useSSL)
	if useSSL {
		transport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	}

	minioClient, err = minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
		Transport: transport,
	})
	if err != nil {
		log.Fatalln(err)
	}
}

func (cc CsvController) Preview(c *gin.Context) {
	bucket := c.Query("bucket")
	prefix := c.Query("prefix")
	format := c.Query("format")

	objectName, err := base64.StdEncoding.DecodeString(prefix)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		c.Abort()
		return
	}

	reader, err := minioClient.GetObject(context.Background(), bucket, string(objectName), minio.GetObjectOptions{})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		c.Abort()
		return
	}
	defer reader.Close()

	stat, err := reader.Stat()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		c.Abort()
		return
	}

	contentType := stat.ContentType
	br := bufio.NewReader(reader)
	r, _, err := br.ReadRune()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		c.Abort()
		return
	}
	var e = korean.EUCKR
	if r != '\uFEFF' {
		br.UnreadRune()
	} else {
		e = nil
	}

	fmt.Println("- contentType: ", contentType)

	lines := make([]string, 0)
	scanner := bufio.NewScanner(br)
	for scanner.Scan() {
		if len(lines) >= maxLines {
			break
		}
		lines = append(lines, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		c.Abort()
		return
	}

	fmt.Println("- lines: ", len(lines))

	if format == "lucky" {
		fmt.Println("- writing(json gzip)...")

		c.Writer.Header().Set("Content-Type", "application/json")
		c.Writer.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(c.Writer)
		defer gz.Close()

		gz.Write([]byte(`{ "celldata": [
		`))

		var row = 0
		var col = 0
		var needcomma = false
		for _, line := range lines {
			if e != nil {
				decoder := transform.NewReader(strings.NewReader(line), e.NewDecoder())
				decoded, err := ioutil.ReadAll(decoder)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
					c.Abort()
					return
				}
				line = string(decoded)
			}

			r := csv.NewReader(strings.NewReader(line))
			record, err := r.Read()
			if err != nil && err != io.EOF {
				c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
				c.Abort()
				return
			}

			for c, val := range record {
				if len(val) <= 0 {
					return
				}
				if needcomma {
					gz.Write([]byte(","))
				}
				cell := map[string]interface{}{
					"r": row, "c": c,
					"v": map[string]interface{}{
						"m": val, "v": val,
						"ct": map[string]interface{}{
							"fa": "@", "t": "s",
						},
					},
				}
				json.NewEncoder(gz).Encode(cell)
				if c > col {
					col = c
				}
				needcomma = true
			}
			row++
		}

		gz.Write([]byte(fmt.Sprintf(`],
			"nrows": %d, "ncols": %d
		}`, row, col)))

		fmt.Println("- ok")
		return
	}

	fmt.Println("- writing(gzip)...")

	c.Writer.Header().Set("Content-Description", "File Transfer")
	c.Writer.Header().Set("Content-Transfer-Encoding", "binary")
	c.Writer.Header().Set("Content-Disposition", "attachment; filename="+string(objectName))
	c.Writer.Header().Set("Content-Type", "application/octet-stream")
	c.Writer.Header().Set("Content-Encoding", "gzip")

	gz := gzip.NewWriter(c.Writer)
	defer gz.Close()

	gz.Write([]byte(string('\uFEFF')))

	var celldata = make([]interface{}, 0)
	var row = 0
	var col = 0
	_ = celldata

	for _, line := range lines {
		if e == nil {
			continue
		}
		decoder := transform.NewReader(strings.NewReader(line), e.NewDecoder())
		decoded, err := ioutil.ReadAll(decoder)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			c.Abort()
			return
		}
		gz.Write(decoded)
	}

	fmt.Println("- rows", row, "cols", col)

	fmt.Println("- ok")
}
