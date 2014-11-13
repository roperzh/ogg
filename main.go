package main

import (
	"html/template"
	"net/http"

	"github.com/codegangsta/negroni"
	"github.com/jrallison/go-workers"
	"github.com/shaoshing/train"
	"gopkg.in/unrolled/render.v1"

	"github.com/roperzh/ogg/app/services/emitter"
	"github.com/roperzh/ogg/app/services/enqueuer"
)

func main() {
	// Initialize the template engine, include train helpers
	r := render.New(render.Options{
		Directory:  "app/views",
		Layout:     "application",
		Funcs:      []template.FuncMap{train.HelperFuncs},
		Extensions: []string{".html"},
	})

	// Variables
	n := negroni.Classic()
	mux := http.NewServeMux()
	b := emitter.New()

	// Routes
	mux.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		r.HTML(w, http.StatusOK, "home/index", nil)
	})

	mux.HandleFunc("/results", func(w http.ResponseWriter, req *http.Request) {
		workers.Enqueue("render:page", "Add", req.FormValue("site"))
		r.HTML(w, http.StatusOK, "results/show", nil)
	})

	mux.HandleFunc("/events", b.ServeHTTP)

	// Initialize train to serve assets
	train.ConfigureHttpHandler(mux)

	n.UseHandler(mux)

	// Fire up the application!
	enqueuer.Run()
	n.Run(":8080")
}
