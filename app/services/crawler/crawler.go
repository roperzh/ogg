package crawler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/PuerkitoBio/gocrawl"
	"github.com/PuerkitoBio/goquery"
	"github.com/roperzh/gopengraph"
	"github.com/roperzh/ogg/app/services/emitter"
)

const (
	DEPTH = 2
)

type ExampleExtender struct {
	gocrawl.DefaultExtender
	Id string
}

func (this *ExampleExtender) Visit(ctx *gocrawl.URLContext, res *http.Response, doc *goquery.Document) (interface{}, bool) {
	mg, _ := json.Marshal(gopengraph.New(doc))
	emitter.Emit(struct{ Content, Id string }{string(mg), this.Id})

	fmt.Println("<<<<<<<<< Crawling...")

	urls := processLinks(doc)
	links := make(map[*url.URL]interface{})
	i, _ := ctx.State.(int)
	nextDepth := i - 1
	if nextDepth <= 0 {
		return nil, false
	}
	for _, u := range urls {
		links[u] = nextDepth
	}
	return links, false
}

func (this *ExampleExtender) Filter(ctx *gocrawl.URLContext, isVisited bool) bool {
	if ctx.SourceURL() == nil {
		ctx.State = DEPTH
		return !isVisited
	}
	if ctx.State != nil {
		i, ok := ctx.State.(int)
		if ok && i > 0 {
			return !isVisited
		}
	} else {
		fmt.Println("ctx.state nil, ctx.sourceURL: ", ctx.SourceURL())
	}
	return false
}

func processLinks(doc *goquery.Document) (result []*url.URL) {
	urls := doc.Find("a[href]").Map(func(_ int, s *goquery.Selection) string {
		val, _ := s.Attr("href")
		return val
	})
	for _, s := range urls {
		if len(s) > 0 && !strings.HasPrefix(s, "#") {
			if parsed, e := url.Parse(s); e == nil {
				parsed = doc.Url.ResolveReference(parsed)
				result = append(result, parsed)
			}
		}
	}
	return
}

func Crawl(args map[string]interface{}) {
	e := new(ExampleExtender)
	e.Id = args["id"].(string)

	opts := gocrawl.NewOptions(e)
	opts.CrawlDelay = 0
	opts.LogFlags = gocrawl.LogNone
	opts.SameHostOnly = true

	c := gocrawl.NewCrawlerWithOptions(opts)
	c.Run(gocrawl.S{args["site"].(string): DEPTH})
}
