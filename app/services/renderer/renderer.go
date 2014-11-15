package renderer

import (
	"html/template"

	"github.com/shaoshing/train"
	"gopkg.in/unrolled/render.v1"
)

var Render *render.Render

func Run() {
	// Initialize the template engine, include train helpers
	Render = render.New(render.Options{
		Directory:  "app/views",
		Layout:     "application",
		Funcs:      []template.FuncMap{train.HelperFuncs},
		Extensions: []string{".html"},
	})
}
