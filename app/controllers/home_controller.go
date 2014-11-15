package controllers

import (
	"net/http"

	"github.com/roperzh/ogg/app/services/renderer"
)

func HomeIndex(w http.ResponseWriter, req *http.Request) {
	renderer.Render.HTML(w, http.StatusOK, "home/index", nil)
}
