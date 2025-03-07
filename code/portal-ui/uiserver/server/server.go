package server

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"
	"net"
	"crypto/tls"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/contrib/secure"
	"github.com/gin-gonic/gin"
	"ktml.io/csvpreview/config"
	"ktml.io/csvpreview/controllers"
)

func Init() {
	c := config.GetConfig()
	r := NewRouter()
	r.MaxMultipartMemory = 8 << 20
	r.RunTLS(c.ListenAddr, "./certs/ca.crt", "./certs/ca.key")
}

func NewRouter() *gin.Engine {
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(cors.Default())
	router.Use(secure.Secure(secure.Options{
		CustomFrameOptionsValue: "sameorigin",
	}))

	//router.Use(middlewares.AuthMiddleware())
	c := config.GetConfig()
	remote, err := url.Parse(c.Proxy)
	if err != nil {
		panic(err)
	}
	csvapi, err := url.Parse(c.CsvApi)
	if err != nil {
		panic(err)
	}
	var proxyHandleContext = func(c *gin.Context) {
		proxy := httputil.NewSingleHostReverseProxy(remote)
     var InsecureTransport http.RoundTripper = &http.Transport{
	        Dial: (&net.Dialer{
	                Timeout:   30 * time.Second,
	                KeepAlive: 30 * time.Second,
	        }).Dial,
	        TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	        TLSHandshakeTimeout: 10 * time.Second,
		}
		proxy.Transport = InsecureTransport
		originalDirector := proxy.Director
		proxy.Director = func(req *http.Request) {
			originalDirector(req)

			origin := remote.Scheme + "://" + remote.Host

			if strings.HasPrefix(req.RequestURI, "/ws/") {
				req.Header.Set("Origin", origin)
			}
			req.Host = remote.Host
			req.URL.Host = remote.Host
		}
		proxy.ServeHTTP(c.Writer, c.Request)
	}

	var csvapiProxyHandleContext = func(c *gin.Context) {
		proxy := httputil.NewSingleHostReverseProxy(csvapi)
     var InsecureTransport http.RoundTripper = &http.Transport{
	        Dial: (&net.Dialer{
	                Timeout:   30 * time.Second,
	                KeepAlive: 30 * time.Second,
	        }).Dial,
	        TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	        TLSHandshakeTimeout: 10 * time.Second,
		}
		proxy.Transport = InsecureTransport
		originalDirector := proxy.Director
		proxy.Director = func(req *http.Request) {
			originalDirector(req)

			origin := csvapi.Scheme + "://" + csvapi.Host

			if strings.HasPrefix(req.RequestURI, "/ws/") {
				req.Header.Set("Origin", origin)
			}
			req.Host = csvapi.Host
			req.URL.Host = csvapi.Host
		}
		proxy.ServeHTTP(c.Writer, c.Request)
	}

	apiEngine := gin.New()
	api := apiEngine.Group("/_api")
	{
		health := new(controllers.HealthController)
		api.GET("/", health.Status)
		controllers.RouteCsv(api)
	}
	apiEngine.NoRoute(func(c *gin.Context) {
		proxyHandleContext(c)
	})

	appEngine := gin.New()
	appEngine.Use(static.Serve("/", static.LocalFile("./public", true)))
	appEngine.NoRoute(func(c *gin.Context) {
		if !strings.HasPrefix(c.Request.RequestURI, "/api/") && !strings.HasPrefix(c.Request.RequestURI, "/ws/") {
			c.File("./public/index.html")
			return
		}
		fmt.Println("proxying", c.Request.URL.Path)
		proxyHandleContext(c)
	})

	router.Any("/*path", func(c *gin.Context) {
		path := c.Param("path")
		if strings.HasPrefix(path, "/_api") {
			apiEngine.HandleContext(c)
		} else if strings.HasPrefix(path, "/ktsearch") {
			csvapiProxyHandleContext(c)
		} else {
			appEngine.HandleContext(c)
		}
	})

	return router
}
