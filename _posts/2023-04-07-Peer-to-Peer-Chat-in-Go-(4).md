---
title: Peer to Peer Chat Network in Go (4)
categories: [Peer To Peer Chat Application]
img_path: https://684cd055bb4956d0e4cc98c5--bloag-assets.netlify.app/gifs/PeerToPeer/4
math: true
---

## Concept
Keeping track of all the code in your head can become very difficult very quickly. Let us abstract away everything our flood fill network is doing, and just make it easy to build on top of. We will end up with an interface of only two functions, Read and Write. Below we see the complex network, but from the individual nodes perspective working through the interface, they only see messages entering and leaving the network.

![API to cluster](api.gif){: .center w="400" h="400" }

Along with this cosmetic changes, lets add a tiny more functionality. We want to maintain a minimum number of connections at all times so that even if we lose a connection, we can quickly find another and not lose the network. A good number might be five, since the chances of all five people disconnecting at once are essentially zero. There is a consequence to this addition though.

Now people can connect to each other twice, once from A to B, and another from B to A. Since the ports used on a computer are different when receiving a connection and sending one out, A and B don't recognize the others second request since its coming from a different port. We have an issue of identity. We could just use IP instead of IP:port, but that would make development harder and probably lead to unknown consequences in the future. Instead lets just include our listening address when we send out a join acknowledgment, then people can store peoples listening addresses and make sure not to connect to the same person twice.

Once we fix that, we have a new issue. Right now a join request will be bounced between a network of two nodes forever. In a fully connected network, no one will accept a JOIN_REQ, because they're already connected. In order to fix this, we will add a counter to each packet. The counter will decrement on every hop, then, after too many hops the packet will be dropped.

## Code
We will create a 'Network' object which can contain all of our data, and all our methods can be attached too. This will make it easier to work with later, and will even allow us later on to interact with multiple networks at once within a single program. 

We will also change our packet to transmit arbitrary data. We will regress for a moment, so now our packets don't contain 'Origin' or 'Message', they just have a byte array called 'Payload'. Then on top of this network we will add back the chat application which has a message and origin.

The network needs an interface that is as abstract as possible so we can forget everything that's happening beneath. All we want from our network is the ability to read and write from it. The user will be oblivious to the joining mechanism or the flooding, they will only see that they can send and receive messages.

In a new folder I have called 'floodnet', we will place our more general flood network. Then in the root folder we have a main file which reads users input and passes it into the network, oblivious as to how it is being done. I have my module named 'P2PChatTutorial4', which will be apart of the path we use to import the floodnet module we are making, so make sure to change it to whatever you've named your package as.

We will also use a Go channel to track incoming and outgoing connection requests through a single routine, this way we don't accidentally have two routines accept a request from the same individual. 

```go
package floodnet

import (
	"encoding/gob"
	"fmt"
	"io"
	"math/rand"
	"net"
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
		fmt.Println(nodeID)
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
	fmt.Printf("Handling connection: %s\n", nodeID)

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
					fmt.Printf("Connection disconnected: %s\n", nodeID)
				} else {
					fmt.Println(err)
					fmt.Println(packet)
				}
				break
			}

			network.incomingPackets <- packet
		}

		fmt.Printf("Stopped handling connection: %s\n", nodeID)

		// remove from slice of connections
		delete(network.connections, nodeID)

		// if we no longer have enough connections, try to replace the lost connection
		network.incomingPackets <- Packet{Type: JOIN_REQ, Payload: []byte(network.address), NodeID: network.nodeID, UniqueID: rand.Int(), HopsLeft: 5}

		connection.Close()
	}()
}

func (network *Network) receivePayload(payload []byte) {
	if len(network.receivedPayloads) == cap(network.receivedPayloads) {
		fmt.Println("Warning: Max payloads stored, payloads will be dropped until memory is freed")
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
		fmt.Println(err)
	}
}
```
{: file='floodnet/network.go'}

```go
package floodnet

import (
	"encoding/gob"
	"errors"
	"fmt"
	"io"
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
	fmt.Printf("Sending JOIN_REQ to: %s\n", address)

	connection, err := net.Dial("tcp", address)
	if err != nil {
		fmt.Println(err)
		return
	}

	send(connection, Packet{Type: JOIN_REQ, Payload: []byte(network.address), NodeID: network.nodeID, UniqueID: rand.Int(), HopsLeft: 5})

	connection.Close()
}

func (network *Network) sendJoinAcknowledge(address string, nodeID string) {
	fmt.Printf("Sending JOIN_ACK to accept request from: %s\n", address)

	connection, err := net.Dial("tcp", address)
	if err != nil {
		fmt.Println(err)
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
		fmt.Println(err)
		return
	}

	network.address = listener.Addr().String()
	fmt.Printf("Listening for connection requests at %s\n", network.address)

	go func() {
		// listen for incoming connection requests
		for {
			connection, err := listener.Accept()
			if err != nil {
				fmt.Println(err)
				continue
			}

			// each connection is handled by its own process
			go network.handleNewConnection(connection)
		}
	}()
}

func (network *Network) handleNewConnection(connection net.Conn) {
	connectionName := connection.RemoteAddr().String()
	fmt.Printf("Handling new connection: %s\n", connectionName)

	// listen for a packet
	dec := gob.NewDecoder(connection)
	packet := Packet{}
	err := dec.Decode(&packet) // blocking until we receive a packet

	if err != nil {
		// check if client disconnected
		if err == io.EOF {
			fmt.Printf("New connection disconnected: %s\n", connectionName)
		} else {
			fmt.Println(err)
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

	fmt.Printf("Stopped handling new connection: %s\n", connectionName)

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
			fmt.Printf("Received JOIN_REQ, passing on to: %s\n", nodeID)
			send(connection, packet)
			return
		}
		fmt.Println("Received JOIN_REQ, no valid connections to send to, dropping")

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
	"P2PChatTutorial4/floodnet"
	"bufio"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	// get network address
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
		} else {
			network.Write([]byte(text))
		}
	}
}

func handleNetwork(network *floodnet.Network) {
	running := true
	for running {
		message := network.Read() // blocks until a message is received
		fmt.Println(string(message))
	}
}
```
{: file='main.go'}


Now try running as many terminals as you wish. For debugging you will see every connection you have after you send a message. For the moment we actually seem to have regressed since we no longer printing the senders address. But now we can have an arbitrary number of connections, and most importantly, the flood network can be forgotten about (until we want more features), and new applications built easily on top of.

```bash
go build -o chat && ./chat
```
{: .nolineno }

## Next
We want to turn it back into a chat application, and add direct messaging. Following the next post we will add some security to direct messaging.