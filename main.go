package main

import (
	"net/http"

	"github.com/codegangsta/negroni"

	"github.com/bmizerany/pat"
	"github.com/shaoshing/train"

	"github.com/roperzh/ogg/app/controllers"
	"github.com/roperzh/ogg/app/services/emitter"
	"github.com/roperzh/ogg/app/services/enqueuer"
	"github.com/roperzh/ogg/app/services/renderer"
)

func main() {
	// Variables
	n := negroni.Classic()
	mux := pat.New()
	b := emitter.New()

	// Routes
	mux.Get("/", http.HandlerFunc(controllers.HomeIndex))

	mux.Get("/results", http.HandlerFunc(controllers.ResultsShow))

	mux.Get("/events/:id", http.HandlerFunc(b.ServeHTTP))

	train.SetFileServer()

	mux.Get(train.Config.AssetsUrl, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		train.ServeRequest(w, r)
	}))

	n.UseHandler(mux)

	// Fire up the application!
	renderer.Run()
	enqueuer.Run()
	n.Run(":8080")
}
