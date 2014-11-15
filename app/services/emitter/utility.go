package emitter

var broker *Broker

// Initialize a new Broker
func New() *Broker {
	broker = &Broker{
		make(map[string]chan string),
		make(chan struct {
			Channel chan string
			Id      string
		}),
		make(chan string),
	}

	broker.Start()

	return broker
}

// Emit an event
func Emit(message struct{ Content, Id string }) {
	broker.clients[message.Id] <- message.Content
}

func CloseChannel(channelid string) {
	broker.defunctClients <- channelid
}
