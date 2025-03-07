package config

import (
	"fmt"
	"os"
	"strconv"
)

type ConfigStruct struct {
	ListenAddr  string
	Proxy       string
	CsvApi			string
	CsvEncoding string
	CsvMaxLines int
	S3Endpoint  string
	S3AccessKey string
	S3SecretKey string
	S3Ssl       bool
}

var Config ConfigStruct = ConfigStruct{
	ListenAddr:  ":9009",
	Proxy:       "http://127.0.0.1:9090",
	CsvApi:      "http://127.0.0.1:9080",
	CsvEncoding: "euc-kr",
	CsvMaxLines: 20000,
	S3Endpoint:  "127.0.0.1:9000",
	S3AccessKey: "CiJkleH9J414Cno0QTxS",
	S3SecretKey: "gnb31k6WmkWSy7iXMYwJ7g478mMiRNfWplDYVmYA",
	S3Ssl:       false,
}

func Init(env string) {
	KTIU_LISTEN_ADDR := os.Getenv("KTIU_LISTEN_ADDR")
	KTIU_PROXY := os.Getenv("KTIU_PROXY")
	KTIU_CSV_API := os.Getenv("KTIU_CSV_API")
	KTIU_CSV_ENCODING := os.Getenv("KTIU_CSV_ENCODING")
	KTIU_CSV_MAXLINES := os.Getenv("KTIU_CSV_MAXLINES")
	KTIU_S3_ENDPOINT := os.Getenv("KTIU_S3_ENDPOINT")
	KTIU_S3_ACCESSKEY := os.Getenv("KTIU_S3_ACCESSKEY")
	KTIU_S3_SECRETKEY := os.Getenv("KTIU_S3_SECRETKEY")
	KTIU_S3_SSL := os.Getenv("KTIU_S3_SSL")

	if len(KTIU_LISTEN_ADDR) > 0 {
		Config.ListenAddr = KTIU_LISTEN_ADDR
	}
	if len(KTIU_PROXY) > 0 {
		Config.Proxy = KTIU_PROXY
	}
	if len(KTIU_CSV_API) > 0 {
		Config.CsvApi = KTIU_CSV_API
	}
	if len(KTIU_CSV_ENCODING) > 0 {
		Config.CsvEncoding = KTIU_CSV_ENCODING
	}
	if len(KTIU_CSV_MAXLINES) > 0 {
		n, err := strconv.Atoi(KTIU_CSV_MAXLINES)
		if err == nil {
			Config.CsvMaxLines = n
		}
	}
	if len(KTIU_S3_ENDPOINT) > 0 {
		Config.S3Endpoint = KTIU_S3_ENDPOINT
	}
	if len(KTIU_S3_ACCESSKEY) > 0 {
		Config.S3AccessKey = KTIU_S3_ACCESSKEY
	}
	if len(KTIU_S3_SECRETKEY) > 0 {
		Config.S3SecretKey = KTIU_S3_SECRETKEY
	}
	if len(KTIU_S3_SSL) > 0 {
		b, err := strconv.ParseBool(KTIU_S3_SSL)
		if err == nil {
			Config.S3Ssl = b
		}
	}
	fmt.Println("ListenAddr", Config.ListenAddr)
	fmt.Println("Proxy", Config.Proxy)
	fmt.Println("CsvApi", Config.CsvApi)
	fmt.Println("CsvEncoding", Config.CsvEncoding)
	fmt.Println("CsvMaxLines", Config.CsvMaxLines)
	fmt.Println("S3Endpoint", Config.S3Endpoint)
	fmt.Println("S3AccessKey", Config.S3AccessKey)
	fmt.Println("S3SecretKey", Config.S3SecretKey)
	fmt.Println("S3Ssl", Config.S3Ssl)
}

func GetConfig() *ConfigStruct {
	return &Config
}
