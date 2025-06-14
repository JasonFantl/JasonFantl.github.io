---
title: Peer to Peer Chat Network in Go (5)
categories: [Peer To Peer Chat Application]
img_path: https:///684cd055bb4956d0e4cc98c5--bloag-assets.netlify.app/gifs/PeerToPeer/5
math: true
---

## Concept
The first thing we should do is create an identity for each user, that way people know who the messages are coming from (this is separate from NodeID, but had we not hidden NodeID under abstraction, we could have used it instead). Once we have usernames, we will want to be able to directly talk to someone. All this will take is sending messages along with who they are intended for, and trust no one else reads them if its not their name, kind of like physical mail.

Then that's it, we have a dynamic peer to peer network! People joining and leaving, messages being propagated through the entire network, and even a small chat application on top of the network. 

![Expanding graph](growing.gif){: .center w="400" h="400" }

Unlike the animation above, our network is designed so that it shouldn't separate itself. A more realistic animation would have nodes connecting to each other at random, regardless of geometric distance, but that would make the visualization less intuitive.

## Code
All the printing done by the network code will be put into a log file instead (easy as replacing fmt.Print with log.Print), that leaves the terminal just for messaging.

We will use a struct to send our messages along with the sender, but the network only accepts byte arrays. This means using an encoder to turn our struct into a byte array and back, which JSON is great at (not gob, since gob requires sending an initial framing packet to establish a connection between an encoding/decoding pair, which doesn't match our multi-connected network). 

```go
package floodnet

import (
	"encoding/gob"
	"io"
	"log"
	"math/rand"
	"net"
	"os"
	"strconv"
)

type Network struct {
	address string
	nodeID  string

	// we need to track connections in order to send out messages over them
	// map to strings so we can store their listening address
	connections map[string]net.Conn

	desiredConnectionCount int
	// we need to remember messages in order to avoid resending them
	// right now we'll just track if we've seen the uniqueID before
	seenPackets map[int]bool

	// we store received messages in a queue to pass up to the user
	receivedPayloads chan []byte

	incomingPackets chan Packet
}

func NewNetwork(entryNodeAddress string) *Network {
	network := &Network{
		nodeID:                 strconv.Itoa(rand.Int()),
		connections:            make(map[string]net.Conn),
		desiredConnectionCount: 3, // 5 seems like a good number
		seenPackets:            make(map[int]bool),
		receivedPayloads:       make(chan []byte, 512), // 512 is the max number of messages we will store before packets start being dropped, user will be warned
		incomingPackets:        make(chan Packet, 512), // some buffer so that packets can be quickly sent, but we should never get close to using the entire buffer
	}

	// If the file doesn't exist, create it or append to the file
	file, err := os.OpenFile("floodnet.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		log.Fatal(err)
	}

	log.SetOutput(file)

	log.Printf("Hello world!")

	network.listenForConnections()
	go network.processPackets()

	// send out connection requests
	for i := 0; i < network.desiredConnectionCount; i++ {
		network.sendJoinRequest(entryNodeAddress)
	}
	return network
}

type PacketType byte

const (
	MESSAGE PacketType = iota
	JOIN_REQ
	JOIN_ACK
)

type Packet struct {
	Type     PacketType
	Payload  []byte // arbitrary data
	NodeID   string // original sender
	UniqueID int    // so we can send the same data twice and not have it rejected
	HopsLeft int
}

func (network *Network) Read() []byte {
	return <-network.receivedPayloads
}

func (network *Network) Write(buf []byte) {
	for nodeID := range network.connections {
		log.Println(nodeID)
	}
	network.announce(Packet{Type: MESSAGE, Payload: buf, NodeID: network.nodeID, UniqueID: rand.Int()})
}

func (network *Network) processPackets() {
	for packet := range network.incomingPackets {
		if !network.seenPackets[packet.UniqueID] {
			network.seenPackets[packet.UniqueID] = true
			switch packet.Type {
			case MESSAGE:
				network.receivePayload(packet.Payload) // do something with the message
				network.announce(packet)               // pass on
			case JOIN_REQ:
				network.handleJoinRequest(packet)
			case JOIN_ACK:
				// ignore
			}
		}
	}
}

// non-blocking
func (network *Network) handleConnection(connection net.Conn, nodeID string) {
	log.Printf("Handling connection: %s\n", nodeID)

	// add connection to our list so we can keep track of it
	network.connections[nodeID] = connection

	go func() {
		for {
			// listen for a message
			dec := gob.NewDecoder(connection)
			packet := Packet{}
			err := dec.Decode(&packet) // blocking until we receive a message

			if err != nil {
				// check if client disconnected
				if err == io.EOF {
					log.Printf("Connection disconnected: %s\n", nodeID)
				} else {
					log.Println(err)
					log.Println(packet)
				}
				break
			}

			network.incomingPackets <- packet
		}

		log.Printf("Stopped handling connection: %s\n", nodeID)

		// remove from slice of connections
		delete(network.connections, nodeID)

		// if we no longer have enough connections, try to replace the lost connection
		network.incomingPackets <- Packet{Type: JOIN_REQ, Payload: []byte(network.address), NodeID: network.nodeID, UniqueID: rand.Int(), HopsLeft: 5}

		connection.Close()
	}()
}

func (network *Network) receivePayload(payload []byte) {
	if len(network.receivedPayloads) == cap(network.receivedPayloads) {
		log.Println("Warning: Max payloads stored, payloads will be dropped until memory is freed")
	} else {
		network.receivedPayloads <- payload
	}
}

func (network *Network) announce(packet Packet) {

	// store packet so we don't repeat it
	network.seenPackets[packet.UniqueID] = true

	for _, connection := range network.connections {
		send(connection, packet)
	}
}

func send(connection net.Conn, packet Packet) {
	encoder := gob.NewEncoder(connection)
	err := encoder.Encode(packet) // writes to tcp connection

	if err != nil {
		log.Println(err)
	}
}
```
{: file='floodnet/network.go'}

```go
package floodnet

import (
	"encoding/gob"
	"errors"
	"io"
	"log"
	"math/rand"
	"net"
	"os"
	"runtime"
	"strconv"
	"syscall"
)

func (network *Network) sendJoinRequest(address string) {
	if address == network.address {
		// don't connect to yourself
		return
	}
	log.Printf("Sending JOIN_REQ to: %s\n", address)

	connection, err := net.Dial("tcp", address)
	if err != nil {
		log.Println(err)
		return
	}

	send(connection, Packet{Type: JOIN_REQ, Payload: []byte(network.address), NodeID: network.nodeID, UniqueID: rand.Int(), HopsLeft: 5})

	connection.Close()
}

func (network *Network) sendJoinAcknowledge(address string, nodeID string) {
	log.Printf("Sending JOIN_ACK to accept request from: %s\n", address)

	connection, err := net.Dial("tcp", address)
	if err != nil {
		log.Println(err)
		return
	}

	send(connection, Packet{Type: JOIN_ACK, Payload: []byte(network.address), NodeID: network.nodeID, UniqueID: rand.Int()})

	network.handleConnection(connection, nodeID)
}

// listenForConnections is non-blocking, it spawns a new routine that listens for the connections
func (network *Network) listenForConnections() {

	// start a TCP server to listen for requests on.
	// may need to try different ports to find one thats not being used
	port := 55555
	listener, err := net.Listen("tcp", ":"+strconv.Itoa(port))
	for isErrorAddressAlreadyInUse(err) {
		port++
		listener, err = net.Listen("tcp", ":"+strconv.Itoa(port))
	}
	if err != nil && !isErrorAddressAlreadyInUse(err) {
		log.Println(err)
		return
	}

	network.address = listener.Addr().String()
	log.Printf("Listening for connection requests at %s\n", network.address)

	go func() {
		// listen for incoming connection requests
		for {
			connection, err := listener.Accept()
			if err != nil {
				log.Println(err)
				continue
			}

			// each connection is handled by its own process
			go network.handleNewConnection(connection)
		}
	}()
}

func (network *Network) handleNewConnection(connection net.Conn) {
	connectionName := connection.RemoteAddr().String()
	log.Printf("Handling new connection: %s\n", connectionName)

	// listen for a packet
	dec := gob.NewDecoder(connection)
	packet := Packet{}
	err := dec.Decode(&packet) // blocking until we receive a packet

	if err != nil {
		// check if client disconnected
		if err == io.EOF {
			log.Printf("New connection disconnected: %s\n", connectionName)
		} else {
			log.Println(err)
		}
		return
	}

	// received packet
	switch packet.Type {
	case JOIN_REQ:
		network.incomingPackets <- packet
	case JOIN_ACK:
		network.handleJoinAcknowledge(connection, packet)
		return // we don't want to close this connection since we may keep it, so return early
	default:
		// ignore
	}

	log.Printf("Stopped handling new connection: %s\n", connectionName)

	connection.Close()
}

func (network *Network) handleJoinRequest(packet Packet) {
	address := string(packet.Payload)

	// throw out packets that are out of hops
	if packet.HopsLeft <= 0 {
		return
	}

	// don't connect to self
	accepting := packet.NodeID != network.nodeID

	// and don't connect to someone your already connected to
	if _, connected := network.connections[packet.NodeID]; connected {
		accepting = false
	}

	// if previous checks pass, chance of accepting request is inversely proportional to connection count
	if accepting && len(network.connections) >= network.desiredConnectionCount {
		accepting = rand.Float64() < 1.0/float64(len(network.connections)+1)
	}

	if accepting {
		network.sendJoinAcknowledge(address, packet.NodeID)
	} else {
		// change the unique ID so that we could potentially accept the same request if it comes back
		packet.UniqueID = rand.Int()

		// decrement HopsLeft
		packet.HopsLeft--

		// pass JOIN_REQ to a random connection
		for nodeID, connection := range network.connections { // ranging over a map is random each time
			// dont send JOIN_REQ to person who created it
			if nodeID == packet.NodeID {
				continue
			}
			log.Printf("Received JOIN_REQ, passing on to: %s\n", nodeID)
			send(connection, packet)
			return
		}
		log.Println("Received JOIN_REQ, no valid connections to send to, dropping")

	}
}

func (network *Network) handleJoinAcknowledge(connection net.Conn, packet Packet) {
	// don't accept from people we are already connected to
	if _, connected := network.connections[packet.NodeID]; connected {
		connection.Close()
	} else {
		network.handleConnection(connection, packet.NodeID)
	}
}

// helper function from https://stackoverflow.com/a/65865898
func isErrorAddressAlreadyInUse(err error) bool {
	var eOsSyscall *os.SyscallError
	if !errors.As(err, &eOsSyscall) {
		return false
	}
	var errErrno syscall.Errno // doesn't need a "*" (ptr) because it's already a ptr (uintptr)
	if !errors.As(eOsSyscall, &errErrno) {
		return false
	}
	if errErrno == syscall.EADDRINUSE {
		return true
	}
	const WSAEADDRINUSE = 10048
	if runtime.GOOS == "windows" && errErrno == WSAEADDRINUSE {
		return true
	}
	return false
}
```
{: file='floodnet/joining.go'}

```go
package main

import (
	"P2PChatTutorial5/floodnet"
	"bufio"
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"
)

var username string

type Message struct {
	Text string
	From string
	To   string
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// use default network address, or get network address from command line arguments
	entryAddress := "[::]:55555"
	if len(os.Args) > 1 {
		entryAddress = os.Args[1]
	}

	network := floodnet.NewNetwork(entryAddress)

	go handleNetwork(network)

	reader := bufio.NewReader(os.Stdin)
	running := true
	for running {
		// get text from terminal input
		text, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println(err)
			break
		}
		text = strings.TrimSpace(text)

		// check if the user wants to quit, otherwise send out a message
		if text == "exit" || text == "quit" {
			running = false
		} else if text == "set username" {
			fmt.Print("New username: ")
			// get next line just to set username
			text, err := reader.ReadString('\n')
			if err != nil {
				fmt.Println(err)
				break
			}
			username = strings.TrimSpace(text)
		} else {
			// send the message out
			message := &Message{Text: text, From: username}

			// check if this is a direct message
			if text[0] == '@' {
				args := strings.Split(text, " ")
				if len(args[0]) == 1 {
					fmt.Println("No address, will not send")
					continue
				}
				if len(args) == 1 {
					fmt.Println("No content, will not send to " + args[0])
					continue
				}
				message.To = args[0][1:]
				message.Text = text[len(args[0]):] // make sure to chop off receivers username from the message
			}
			encoded, err := json.Marshal(message) // message struct to byte array
			if err != nil {
				fmt.Println(err)
				continue
			}
			network.Write(encoded)
		}
	}
}

func handleNetwork(network *floodnet.Network) {
	running := true
	for running {
		encoded := network.Read() // blocking until we receive a message
		message := Message{}
		err := json.Unmarshal(encoded, &message) // byte array to message struct
		if err != nil {
			fmt.Println(err)
			continue
		}

		// check if its a direct message to us, a message for everyone, or a message to someone else (which we ignore)
		if message.To == username && username != "" {
			fmt.Printf("(direct) %s -> %s\n", message.From, message.Text)
		} else if message.To == "" {
			fmt.Printf("%s -> %s\n", message.From, message.Text)
		}
	}
}
```
{: file='main.go'}

We have a few commands now. `exit` or `quit` will close the program, `set username` will prompt you to change your username, and `@friends_username a personal message` will send a personal message to the person with username `friends_username`.

In a few terminals run the code we've written so far. Then set some usernames and try sending both undirected and direct messages.

```bash
go build -o chat && ./chat
```
{: .nolineno }

## Next
The project is essentially finished here. Now you can see how easily we can build on top of this flood-fill network. Of course, different applications can be built on top of this: a blockchain, sensor network, or anything else that requires a dynamic network which doesn't use pre-existing architecture. The next post will be a list of security related modifications, they will be a bit complicated, and not necessary, so feel free to stop here. You now have a peer to peer network!