package emitter

var broker *Broker

// Initialize a new Broker
func New() *Broker {
	broker = &Broker{
		make(map[string]chan string),
		make(chan struct {
			A chan string
			B string
		}),
		make(chan (chan string)),
		make(chan string),
	}

	broker.Start()

	return broker
}

// Emit an event
func Emit(message string) {
	broker.Messages <- message
}
