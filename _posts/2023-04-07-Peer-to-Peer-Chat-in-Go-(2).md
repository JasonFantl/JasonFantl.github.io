---
title: Peer to Peer Chat Network in Go (2)
categories: [Peer To Peer Chat Application]
img_path: https:///bloag-assets.netlify.app/gifs/PeerToPeer/2
math: true
---

## Concept
Time to add flood filling to the network! So how will this work? Well, when a node wants to send a message, their only option is to send it out to all their connected nodes, which of course is not enough, the message needs to continue out and fill the network. This means that when we as a node receive a message, we should pass it on to all of our connections so the message can pass on to more people. A small issue arises: whenever we have a cycle (A sends to B, then B to C, and C to A) we end up in an endless loop where the message gets passed around forever. In order to avoid this, we have each node "remember" any recent messages so that if they receive a message twice, they can just ignore it.

One potential issue with ignoring repeated messages is that people can't send the same message twice, which they may want to do. In order to avoid this we will use a unique identifier for each message. Now we only avoid re-sending a message with the same ID, this way we can send the same text multiple times and avoid cycles.

![Passing messages between nodes](pass_on.gif){: .center w="400" h="400" }

### How much wasted bandwidth?
It can be interesting to consider how much bandwidth our network is wasting. Let's consider a network of $$ N $$ nodes, each with $$ D $$ connections, and we don't care how they're connected (except that there exists a path between every node). A person sends out a message over D connections, each node that receives the message sends it to everyone they know (including the person they just received it from, inefficient, but simplifies calculation with minimal impact), and so on. This means every node receives the same message $$ D $$ times (think through why). Each person (except the original sender) only needed to receive it once, a total of N-1 transmits of the message. We are transmitting the message $$ ND $$ times in the network, that's a waste of $$ ND-N = N(D-1) $$. If we could coordinate between everyone, we could calculate a minimum spanning tree and send the message only $$ N-1 $$ times, that would mean zero bandwidth waste! But we want a flexible network, so we won't be tracking the network topology and calculating the minimum spanning tree. But it is interesting to consider how you might structure a network such that you can minimize bandwidth waste.

## Code
We will modify the node.go file we used in the previous post. There are a few differences: Instead of just sending text we now send a 'Message' object containing both the message text and a unique identifier. We keep track of our previously announced messages, which then determine if we should announce a newly received messages.

```go
package main

import (
	"bufio"
	"encoding/gob"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net"
	"os"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// we need to track connections in order to send out messages over them
var connections map[net.Conn]bool

type Message struct {
	Text     string
	UniqueID int
}

// we need to remember messages in order to avoid resending them
// right now we'll just track if we've seen the uniqueID before
var announcedMessages map[int]bool

func main() {
	rand.Seed(time.Now().UnixNano())

	connections = make(map[net.Conn]bool)
	announcedMessages = make(map[int]bool)

	go listenForConnections()

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

		// check if the user wants to quit or try to connect to another node, otherwise send out a message
		if text == "exit" || text == "quit" {
			running = false
		} else if arguments := strings.Split(text, " "); arguments[0] == "connect" {
			requestConnection(arguments[1])
		} else {
			// make sure to attach a unique identifier to the message
			announce(Message{Text: text, UniqueID: rand.Int()})
		}
	}
}

func requestConnection(address string) {
	fmt.Printf("Requesting connection: %s\n", address)

	connection, err := net.Dial("tcp", address)
	if err != nil {
		fmt.Println(err)
		return
	}

	go handleConnection(connection)
}

func announce(message Message) {
	// store message so we don't repeat it
	announcedMessages[message.UniqueID] = true

	for connection := range connections {
		// send the message
		encoder := gob.NewEncoder(connection)
		err := encoder.Encode(message) // writes to tcp connection

		if err != nil {
			fmt.Println(err)
		}
	}
}

func listenForConnections() {

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

	// listen for incoming connection requests
	fmt.Printf("Listening for connection requests at %s\n", listener.Addr().String())
	for {
		connection, err := listener.Accept()
		if err != nil {
			fmt.Println(err)
			continue
		}

		// each connection is handled by its own process
		go handleConnection(connection)
	}
}

func handleConnection(connection net.Conn) {
	connectionName := connection.RemoteAddr().String()
	fmt.Printf("Handling connection: %s\n", connectionName)

	// add connection to our list so we can keep track of it
	connections[connection] = true

	for {
		// listen for a message
		dec := gob.NewDecoder(connection)
		message := Message{}
		err := dec.Decode(&message) // blocking until we receive a message

		if err != nil {
			// check if client disconnected
			if err == io.EOF {
				fmt.Printf("Connection disconnected: %s\n", connectionName)
			} else {
				fmt.Println(err)
			}
			break
		}

		// received message
		// only consider if we have a new message
		if !announcedMessages[message.UniqueID] {
			fmt.Printf("%s -> %s\n", connectionName, message.Text)

			// pass on
			announce(message)
		}
	}

	fmt.Printf("Stopped handling connection: %s\n", connectionName)

	// remove from slice of connections
	delete(connections, connection)

	connection.Close()
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
{: file='node.go'}

Now open up three terminals and run node.go with `go run node.go`. Then connect the first to the second, and second to the third. Send a message on the first, it should appear on the second and third as well. That means the message was passed on to fill the network.

### Clean up
Our file is getting a bit large, so I'm going to try and organize the code across different files. None of the code is changing, we're just trying to make it more manageable. For now, I best understand the code as split between main.go, connections.go, and messages.go.

```go
package main

import (
	"bufio"
	"fmt"
	"math/rand"
	"net"
	"os"
	"strings"
	"time"
)

// we need to track connections in order to send out messages over them
var connections map[net.Conn]bool

// we need to remember messages in order to avoid resending them
// right now we'll just track if we've seen the uniqueID before
var announcedMessages map[int]bool

func main() {
	rand.Seed(time.Now().UnixNano())

	connections = make(map[net.Conn]bool)
	announcedMessages = make(map[int]bool)

	go listenForConnections()

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

		// check if the user wants to quit or try to connect to another node, otherwise send out a message
		if text == "exit" || text == "quit" {
			running = false
		} else if arguments := strings.Split(text, " "); arguments[0] == "connect" {
			requestConnection(arguments[1])
		} else {
			// make sure to attach a unique identifier to the message
			announce(Message{Text: text, UniqueID: rand.Int()})
		}
	}
}
```
{: file='main.go'}

```go
package main

import (
	"encoding/gob"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"runtime"
	"strconv"
	"syscall"
)

func requestConnection(address string) {
	fmt.Printf("Requesting connection: %s\n", address)

	connection, err := net.Dial("tcp", address)
	if err != nil {
		fmt.Println(err)
		return
	}

	go handleConnection(connection)
}

func listenForConnections() {

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

	// listen for incoming connection requests
	fmt.Printf("Listening for connection requests at %s\n", listener.Addr().String())
	for {
		connection, err := listener.Accept()
		if err != nil {
			fmt.Println(err)
			continue
		}

		// each connection is handled by its own process
		go handleConnection(connection)
	}
}

func handleConnection(connection net.Conn) {
	connectionName := connection.RemoteAddr().String()
	fmt.Printf("Handling connection: %s\n", connectionName)

	// add connection to our list so we can keep track of it
	connections[connection] = true

	for {
		// listen for a message
		dec := gob.NewDecoder(connection)
		message := Message{}
		err := dec.Decode(&message) // blocking until we receive a message

		if err != nil {
			// check if client disconnected
			if err == io.EOF {
				fmt.Printf("Connection disconnected: %s\n", connectionName)
			} else {
				fmt.Println(err)
			}
			break
		}

		// received message
		// only consider if we have a new message
		if !announcedMessages[message.UniqueID] {
			receiveMessage(message.Text, connectionName)

			// pass on
			announce(message)
		}
	}

	fmt.Printf("Stopped handling connection: %s\n", connectionName)

	// remove from slice of connections
	delete(connections, connection)

	connection.Close()
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
{: file='connections.go'}

```go
package main

import (
	"encoding/gob"
	"fmt"
)

type Message struct {
	Text     string
	UniqueID int
}

func receiveMessage(text string, from string) {
	fmt.Printf("%s -> %s\n", from, text)
}

func announce(message Message) {
	// store message so we don't repeat it
	announcedMessages[message.UniqueID] = true

	for connection := range connections {
		// send the message
		encoder := gob.NewEncoder(connection)
		err := encoder.Encode(message) // writes to tcp connection

		if err != nil {
			fmt.Println(err)
		}
	}
}
```
{: file='messages.go'}


Now when we want to run the code we need to tell Go which files to use, so we run it with

`go run main.go connections.go messaging.go`

## Next
We want people to automatically join the network and preferably have multiple connections at once in case one or two disconnect. 
