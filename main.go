package main

import (
	"net/http"

	"github.com/codegangsta/negroni"
	"github.com/roperzh/ogg/app/services/crawler"
	"github.com/shaoshing/train"
	"gopkg.in/unrolled/render.v1"
	"html/template"
)

func main() {
	r := render.New(render.Options{
		Directory:  "app/views",
		Layout:     "application",
		Funcs:      []template.FuncMap{train.HelperFuncs},
		Extensions: []string{".html"},
	})

	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		r.HTML(w, http.StatusOK, "home/index", nil)
	})

	mux.HandleFunc("/results", func(w http.ResponseWriter, req *http.Request) {
		crawler.Crawl(req.FormValue("site"))
		r.HTML(w, http.StatusOK, "results/show", nil)
	})

	train.ConfigureHttpHandler(mux)

	n := negroni.Classic()
	n.UseHandler(mux)
	n.Run(":8080")
}
