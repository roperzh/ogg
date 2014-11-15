package main

import (
	"net/http"
	"os"

	"github.com/bmizerany/pat"
	"github.com/codegangsta/negroni"
	"github.com/joho/godotenv"
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
	godotenv.Load()

	// Routes
	mux.Get("/", http.HandlerFunc(controllers.HomeIndex))

	mux.Get("/results", http.HandlerFunc(controllers.ResultsShow))

	mux.Get("/events/:id", http.HandlerFunc(b.ServeHTTP))

	train.Config.Mode = os.Getenv("APP_ENV")
	train.SetFileServer()

	mux.Get(train.Config.AssetsUrl, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		train.ServeRequest(w, r)
	}))

	n.UseHandler(mux)

	// Fire up the application!
	renderer.Run()
	enqueuer.Run()
	n.Run(":" + os.Getenv("PORT"))
}
