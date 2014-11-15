package enqueuer

import (
	"os"
	"time"

	"github.com/jrallison/go-workers"
	"github.com/roperzh/ogg/app/services/crawler"
)

// Jobs
func RenderPage(message *workers.Msg) {
	time.Sleep(10 * time.Second)
	crawler.Crawl(message.Args().MustMap())
}

// Public Methods
func Run() {

	workers.Configure(map[string]string{
		"server":   os.Getenv("REDIS_URL"),
		"password": os.Getenv("REDIS_PASS"),
		"database": "0",
		"pool":     "30",
		"process":  "1",
	})

	// Queues definitions
	workers.Process("render:page", RenderPage, 50)

	go workers.Run()
}
