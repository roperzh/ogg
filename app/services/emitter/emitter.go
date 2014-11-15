// Golang HTML5 Server Side Events
//
// Based on https://github.com/kljensen/golang-html5-sse-example

package emitter

import (
	"fmt"
	"log"
	"net/http"
)

type Broker struct {
	clients    map[string]chan string
	newClients chan struct {
		Channel chan string
		Id      string
	}
	defunctClients chan string
}

// This Broker method starts a new goroutine.  It handles
// the addition & removal of clients, as well as the broadcasting
// of messages out to clients that are currently attached.
//
func (b *Broker) Start() {

	go func() {

		for {

			// Block until we receive from one of the
			// three following channels.
			select {

			case s := <-b.newClients:

				// There is a new client attached and we
				// want to start sending them messages.
				b.clients[s.Id] = s.Channel
				log.Println("===== Added new client with id: ", b.clients[s.Id])

			case s := <-b.defunctClients:

				// A client has dettached and we want to
				// stop sending them messages.
				close(b.clients[s])
				delete(b.clients, s)
				log.Println("===== Removed client with id:", s)
			}
		}
	}()
}

// This Broker method handles an HTTP request
//
func (b *Broker) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get(":id")

	// Make sure that the writer supports flushing.
	//
	f, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	// Create a new channel, over which the broker can
	// send this client messages.
	messageChan := make(chan string)

	// Add this client to the map of those that should
	// receive updates
	b.newClients <- struct {
		Channel chan string
		Id      string
	}{messageChan, id}

	// Set the headers related to event streaming.
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// Don't close the connection, instead loop until the worker emit
	// the finished event
	//
	for {

		// Read from our messageChan.
		msg, more := <-messageChan

		if more {
			// Write to the ResponseWriter, `w`.
			fmt.Fprintf(w, "data: %s\n\n", msg)

			// Flush the response.  This is only possible if
			// the repsonse supports streaming.
			f.Flush()

		} else {
			fmt.Println("=========== Closing connection")
			return
		}
	}

}
