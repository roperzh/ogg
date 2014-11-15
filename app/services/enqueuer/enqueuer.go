package enqueuer

import (
	"github.com/jrallison/go-workers"
	"github.com/roperzh/ogg/app/services/crawler"
)

// Jobs
func RenderPage(message *workers.Msg) {
	crawler.Crawl(message.Args().MustMap())
}

// Public Methods
func Run() {

	workers.Configure(map[string]string{
		"server":   "localhost:6379",
		"database": "0",
		"pool":     "30",
		"process":  "1",
	})

	// Queues definitions
	workers.Process("render:page", RenderPage, 50)

	go workers.Run()
}
