package main

import (
	"flag"

	"ktml.io/csvpreview/config"
	"ktml.io/csvpreview/server"
)

func main() {
	environment := flag.String("e", "development", "")
	flag.Parse()
	config.Init(*environment)
	server.Init()
}
