package controllers

import (
	"net/http"

	"github.com/jrallison/go-workers"

	"github.com/roperzh/ogg/app/services/renderer"
)

func ResultsShow(w http.ResponseWriter, req *http.Request) {
	message := make(map[string]interface{})
	message["site"] = req.FormValue("site")
	message["id"] = req.FormValue("id")

	workers.Enqueue("render:page", "Add", message)

	renderer.Render.HTML(w, http.StatusOK, "results/show", nil)
}
