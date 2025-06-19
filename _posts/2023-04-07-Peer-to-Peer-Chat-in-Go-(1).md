---
title: Peer to Peer Chat Network in Go (1)
categories: [Peer To Peer Chat Application]
img_path: https:///bloag-assets.netlify.app/gifs/PeerToPeer/1
math: true
image: export.gif

---

## Concept

### Overview
We want a network that doesn't have a single point of failure, that can grow and shrink, a network where the users are themselves the architecture, where we depend on nothing but our own machines, and we have complete control over its rules. Introducing Peer To Peer networks!

We will take progressive steps to build a complete P2P network we can send text over, but first lets go over the main concepts that will drive our design decisions.

### Distributed
There will be no central server or manager servers, ideally every node in the network is totally equal. We will adhere to this rule by writing one program which runs on every node, no special implementations for a client versus server, just one implementation shared by everyone.

### Communication
How do we send data through this network? We'll operate under the assumption that our network topology is constantly changing, unstructured, and nobody tracks the entire topology, so no using minimum spanning trees or shortest paths. This is by far the most flexible network design, although not very efficient for communication. We also want to guarantee everyone in the network receives all broadcast messages (well look at sending to an individual later). These two requirements lead us to a single solution, flood filling.

<details markdown=1><summary markdown="span">
	We won't use state, click here to see why, but essentially its too unreliable or too complicated. 
  </summary>

By storing state we mean that everyone knows and agrees on the value of some variable. Storing state is a hard problem to solve, lets see why. Perhaps we want to store the state of a chat log, that way we could see the order in which texts occur and maybe share the text history with newcomers. There are multiple issues, the first is a race condition. Two nodes may announce a message at nearly the same time (or even seconds apart if the network is large), and since it takes time for the message to travel through the network, some of the network will receive a message from A before B, while others will receive the message from A after B. Which is the correct state?

Another issue is separate histories (in a sense it's the extreme version of the above problem). Imagine two friend groups, each communicating on their own network. Then one person makes a connection between the two networks, merging them into one. You would need to have a way to merge these two states, states which could potentially be very large and different. And even if you could merge the states, our example of chat logs illuminates a limitation of this solution, the supposed "history" can now change at any point in time.

Another problem is one of scale. If everyone has to store everything that happens on the network, people could quickly run out of memory on a large network. Perhaps we could shard the information so the memory is split between nodes, but what happens to the data when a node leaves the network? Perhaps you could shard across the network with the shard copied onto multiple nodes, monitor when a node leaves the network and ask the copied shards to make a new copy since they just lost one, but then you need a distributed way to monitor all the shards, and now its getting too complicated.
</details>

## Code

### Starting simple
First we will create a simple TCP server that listens for incoming connections, then each connection will print out any messages they receive. Each connection will be handled by its own Go routine, explained in more depth at the bottom of this page. Be aware we are not using best practices, for a real server you would want to be more careful.

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"strings"
)

func main() {
	// start a TCP server to listen for requests on
	listener, err := net.Listen("tcp", ":55555")
	if err != nil {
		fmt.Println(err)
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

	for {
		// receive a message and print it
		message, err := bufio.NewReader(connection).ReadString('\n')
		message = strings.TrimSpace(message)

		if err != nil {
			// check if client disconnected
			if err == io.EOF {
				fmt.Printf("Connection disconnected: %s\n", connectionName)
			} else {
				fmt.Println(err)
			}
			break
		}

		fmt.Printf("%s -> %s\n", connectionName, message)
	}

	fmt.Printf("Stopped handling connection: %s\n", connectionName)
	connection.Close()
}
```
{: file='server.go'}

Now we need a client to connect from and send messages.

```go
package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strings"
)

func main() {
	makeConnection("[::]:55555")
}

func makeConnection(address string) {
	connection, err := net.Dial("tcp", address)
	if err != nil {
		fmt.Println(err.Error())
		return
	}

	fmt.Printf("Made connection: %s\n", connection.RemoteAddr().String())

	// get messages from terminal input
	reader := bufio.NewReader(os.Stdin)
	running := true
	for running {
		message, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println(err)
			break
		}
		message = strings.TrimSpace(message)

		// check if the user wants to quit
		if message == "exit" || message == "quit" {
			running = false
		} else {
			// send the message
			fmt.Fprintln(connection, message)
		}
	}

	fmt.Printf("Terminating connection: %s\n", connection.RemoteAddr().String())
	connection.Close()
}
```
{: file='client.go'}

Run the server in one terminal with `go run server.go`, and then run the client in another with `go run client.go`. You should see the server receive a connection. You can then send a message from the client by typing a message in the terminal and pressing enter. Try connecting multiple clients to the server at once.

![Message between nodes](message.gif){: .center w="400" }

### Server and client together
Now we want every individual to be both server and client, able to request connections, receive connections, and send out messages. Essentially we copy the code for server and client from above and have it run at the same time in the same process. Using Go routines we can easily spin up a routine that listens for connection requests, another that listens for user input, and a routine for each connection to listen for incoming messages. We will also store (it's a local state, so not an issue) all the connections we have, both requested and received. Now messages broadcast by the user can be sent to every node we're connected to.

```go
package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"runtime"
	"strconv"
	"strings"
	"syscall"
)

// we need to track connections in order to send out messages over them
var connections map[net.Conn]bool

func main() {
	connections = make(map[net.Conn]bool)
	go listenForConnections()

	reader := bufio.NewReader(os.Stdin)
	running := true
	for running {
		// get message from terminal input
		message, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println(err)
			break
		}
		message = strings.TrimSpace(message)

		// check if the user wants to quit or try to connect to another node, otherwise send out a message
		if message == "exit" || message == "quit" {
			running = false
		} else if arguments := strings.Split(message, " "); arguments[0] == "connect" {
			requestConnection(arguments[1])
		} else {
			announce(message)
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

func announce(message string) {
	fmt.Printf("Announcing: %s\n", message)
	for connection := range connections {
		// send the message
		fmt.Fprintln(connection, message)
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
		// receive a message and print it
		message, err := bufio.NewReader(connection).ReadString('\n')
		message = strings.TrimSpace(message)

		if err != nil {
			// check if client disconnected
			if err == io.EOF {
				fmt.Printf("Connection disconnected: %s\n", connectionName)
			} else {
				fmt.Println(err)
			}
			break
		}

		fmt.Printf("%s -> %s\n", connectionName, message)
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
{: file='node.go' }

In two or more terminals run the above code with `go run node.go`. Now connect one node to another by typing `connect [::]:55555` and pressing enter. Make sure you replace 55555 with whatever node your trying to connect to. Your terminal should look similar to the below
```bash
$ go run node.go
Listening for connection requests at [::]:55556
connect [::]:55555
Requesting connection: [::]:55555
Handling connection: [::1]:55555
```
{: .nolineno }

And now if you send a message on either of the two connected nodes, the message will be printed on the other. 

### Go Routines
Go provides the very helpful ability to create routines. Routines run there own code separately from our main code. Without routines our code would get stuck waiting for a connection and not be able to do anything else. By using the keyword 'go', the specified function is run in its own routine. Below you can see how our listener routine creates new handling routines for each new request. Now we have code that is listening for new connections (listenForConnections), listening for messages on each connection (handleConnection), and reading user input (main) all at once.

![Go Routines](go_routines.gif){: .center }

## Next
We have the beginnings of a Peer To Peer network. We still need to have messages flood the network and create an automatic joining mechanism. Eventually we will also look at all the interesting modifications one can make to the network, such as adding security and identity.

