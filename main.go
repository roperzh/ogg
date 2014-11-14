package main

import (
	"html/template"
	"net/http"

	"github.com/codegangsta/negroni"

	"github.com/bmizerany/pat"
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
	mux := pat.New()
	b := emitter.New()

	// Routes
	mux.Get("/", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		r.HTML(w, http.StatusOK, "home/index", nil)
	}))

	mux.Get("/results", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		tst := make(map[string]interface{})
		tst["site"] = req.FormValue("site")
		tst["id"] = req.FormValue("id")

		workers.Enqueue("render:page", "Add", tst)

		r.HTML(w, http.StatusOK, "results/show", nil)
	}))

	mux.Get("/events/:id", http.HandlerFunc(b.ServeHTTP))

	train.SetFileServer()

	mux.Get(train.Config.AssetsUrl, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		train.ServeRequest(w, r)
	}))

	n.UseHandler(mux)

	// Fire up the application!
	enqueuer.Run()
	n.Run(":8080")
}
