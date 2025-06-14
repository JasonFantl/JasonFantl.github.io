---
title: Simulated Economy (7)
categories: [Simulated Economy]
img_path: https:///684cd055bb4956d0e4cc98c5--bloag-assets.netlify.app/gifs/SimulatedEconomy/7
math: true
image: cover.png
---

## Scaling Up
Currently, the economies are restricted to a single computer, but if we had trade routes that could travel over the internet, then we could have economies in literal different parts of the world trading with each other. None of the behavior in the economy will change, but its scale will. 

It will also give us a simple interface we can later connect other systems to. Some potential ideas are
* A predator prey simulation, which on its own is complex, but becomes even more so when one of its factors is the economy.
* We can implement economy simulators in other languages and devices. For example, microprocessors with economies that are effected by environmental factors, those factors being determined by sensors on the processor. The real world suddenly influences our economy.
* Take it even farther, could you make an economic simulator that interacts with a real world stock market API so that the real economy influences our simulated one?

But for now we will just have merchants travel between our simple economies, exactly like before, except now they can travel over the internet. We are going to look at a lot of code since the meat of this step is the implementation, not conceptualization.

## Across Routines
A simple first step is to allow merchants to travel across Go routines (think traveling between CPU cores).

Lets create a `City` object that will handle all the previous logic and allow us to easily separate the different economies.

```go
type cityName string

// City separates economies from each other and manages all of its residents
type City struct {
	name      cityName
	color     color.Color
	
	locals    map[*Local]bool
	merchants map[*Merchant]bool

	inboundTravelWays  map[cityName]chan *Merchant
	outboundTravelWays map[cityName]chan *Merchant
}
```

So a city has some metadata like a name and color (color is for graphing). Then it has all of its residents. And finally we have the `TravelWay`s, which are channels that connect cities to each other. Lets look at how they are used.

In each frame, the city checks the incoming channels to see if an immigrant has arrived. When an immigrant arrives, the city adds it to its merchants (for now we only allow merchants to travel), and taxes the rich merchants (remember, merchants will eventually take all the money in the system, need a way to redistribute it).

```go
func (city *City) Update() {
    ...
    // check for new merchants
    for _, channel := range city.inboundTravelWays {
        if existNewMerchant, newMerchant := city.receiveImmigrant(channel); existNewMerchant {
            city.merchants[newMerchant] = true
            newMerchant.City = city // let the merchant know they arrived

            // if the merchant is rich, tax them and distribute amongst the locals
            if newMerchant.Money > 1000.0 {
                tax := (newMerchant.Money - 1000) / 10
                newMerchant.Money -= tax
                for local := range city.locals {
                    local.money += tax / float64(len(city.locals))
                }
            }
        }
    }
    ...
}

...

func (city *City) receiveImmigrant(channel chan *Merchant) (bool, *Merchant) {
	select { // makes this non-blocking
	case merchant := <-channel:
		return true, merchant
	default:
		return false, nil
	}
}
```

The merchants handle leaving a city on their own.

```go
func (merchant *Merchant) leaveCity(city *City, toCity cityName) {
	// remove self from city is being placed onto a new path every time a hunter kills a fox, redirecting the future of the populations
	delete(city.merchants, merchant)
	// enter travelWay
	merchant.city = "traveling..." // not necessary, gets ignored by JSON serializer
	city.outboundTravelWays[toCity] <- merchant
}
```

Note that we need a new TravelWay for each city and for both entering and leaving a city. This also means it's still up to us to connect cities by linking their travelWays. Here is how we connect one city to another (unidirectional) in the same process. We use the same channel for each city, so when one city send out an immigrant, it travels onto the shared channel, and the other city can receive it. Assumedly the buffer never has more then a few merchants on it at once, but to be safe we make the channel with size 100 (think about how this assumption might fail, such as when a city has lots of merchants that try to leave at once, or the receiving city is not taking merchants off the channel for some reason).

```go
// RegisterTravelWay connects cities using channels
func RegisterTravelWay(fromCity *City, toCity *City) {
	channel := make(chan *Merchant, 100)
	toCity.inboundTravelWays[fromCity.name] = channel
	fromCity.outboundTravelWays[toCity.name] = channel
}
```

And now we have cities that are connected through channels, allowing the economies to reside on separate threads. Here we see Two cities connected by a travelWay, where the green city can manufacture beds with fewer resources.

![Two economies](two_economies.gif){: .center w="600" }

## Across Computers
Now that we have the infrastructure for merchants to travel between cities, we just need to add a bridge between TravelWays over the internet.

First we need each city to start a TCP server to listen for incoming requests. On the city side we have

```go
type City struct {
    ...
	networkPorts *networkedTravelWays
}

func NewCity(name string, col color.Color, size int) *City {
    ...
	city.networkPorts = setupNetworkedTravelWay(55555, city)

    return city
}
```

The real logic is handled by `networkedTravelWays`. Here we see the setup of a TCP server that listens for any incoming requests, the listener is being run in a separate Go routine since it is blocking.

```go
type networkedTravelWays struct {
	city   *City
	server net.Listener
}

// setupNetworkedTravelWay will listen for incoming connections and add them to the cities travelWays. It can also connect to another networkTravelWay
func setupNetworkedTravelWay(portNumber int, city *City) *networkedTravelWays {

	// start a TCP server to listen for requests on
	listener, err := net.Listen("tcp", "localhost:"+strconv.Itoa(portNumber))
	for isErrorAddressAlreadyInUse(err) {
		portNumber++
		listener, err = net.Listen("tcp", "localhost:"+strconv.Itoa(portNumber))
	}
	if err != nil && !isErrorAddressAlreadyInUse(err) {
		fmt.Println(err)
		return nil
	}

	travelWays := &networkedTravelWays{
		city:   city,
		server: listener,
	}

	// listen for incoming connection requests in the background
	fmt.Printf("%s is listening for tcp connection requests at %s\n", city.name, listener.Addr().String())
	go func() {
		for {
			connection, err := listener.Accept() // blocking call here
			if err != nil {
				fmt.Println(err)
				continue
			}

			// each connection is handled by its own process
			go travelWays.handleConnection(connection)
		}
	}()

	return travelWays
}
```

A `networkedTravelWays` connection handles both incoming and outgoing connection requests. Our very basic protocol for establishing a travelWay between cities is 

 1. Send or receive connection request.
 2. Send and receive our cities name.
 3. Send and receive merchants.

I'll cut out some of the code here since a lot of it is boilerplate, even then it's pretty long. Essentially this code moves merchants from a channel onto a TCP connection encoded as JSON. It does the reverse too, receiving JSON objects over a TCP connection that get turned into merchants and placed onto the channel.

```go
func (travelWays *networkedTravelWays) requestConnection(address string) {
	fmt.Printf("Requesting connection: %s...\n", address)
	connection, err := net.Dial("tcp", address)

	go travelWays.handleConnection(connection)
}

// blocking, must be handled as a new routine
func (travelWays *networkedTravelWays) handleConnection(connection net.Conn) {
	done := make(chan bool)
	outboundChannel := make(chan *Merchant, 100)
	inboundChannel := make(chan *Merchant, 100)

	// send our city's name. Blocking, so run in separate routine
	go func() {
		_, err := connection.Write([]byte(travelWays.city.name))
		if err != nil {
			fmt.Println(err)
			done <- true
		}
	}()

	// get the city name
	initializationPacketBytes := make([]byte, 1024)
	n, err := connection.Read(initializationPacketBytes)
	remoteCityName := cityName(initializationPacketBytes[:n])

	// add travelWay to city
	travelWays.city.inboundTravelWays.Store(remoteCityName, inboundChannel)
	travelWays.city.outboundTravelWays.Store(remoteCityName, outboundChannel)

	fmt.Printf("Successfully added city %s as a network connection, sending and receiving merchants...\n", remoteCityName)

	go travelWays.handleIncomingMessages(connection, inboundChannel, done)
	go travelWays.handleOutgoingMessages(connection, outboundChannel, done)

	// wait for connection to close
	<-done
	travelWays.city.outboundTravelWays.Delete(remoteCityName)
	travelWays.city.inboundTravelWays.Delete(remoteCityName)

	fmt.Printf("Connection to %s closed\n", remoteCityName)
	connection.Close()
}

// blocking, must be handled as a new routine
func (travelWays *networkedTravelWays) handleIncomingMessages(connection net.Conn, channel chan *Merchant, done chan bool) {

	// pass merchants from connection to channel
	reader := bufio.NewReader(connection)
	for {
		line, err := reader.ReadString('\n')

		// Deserialize the merchant object
		merchant := &Merchant{}
		err = json.Unmarshal([]byte(line), merchant)

		channel <- merchant
	}
}

// blocking, must be handled as a new routine
func (travelWays *networkedTravelWays) handleOutgoingMessages(connection net.Conn, channel chan *Merchant, done chan bool) {

	// pass merchants from channel into connection
	writer := bufio.NewWriter(connection)

	for {
		merchant := <-channel

		// Serialize the merchant object
		merchantBytes, err := json.Marshal(merchant)
		err = writeAndFlush(writer, merchantBytes)
	}
}
```

And the final change is to modify the merchants behavior. Now they can only make decisions based on the cities they can immediately get to. They are fairly dumb for now, using their expected values from other cities to guess what the best possible arbitrage strategy is.

```go
// find the best location to travel to and how much you would make selling a good there minus the travel expense.
// returns sell location, expected sell price
func (merchant *Merchant) bestDeal(good Good, city *City) (cityName, float64) {

	// considers nearby (connected) cities. Later, merchants can be more intelligent
	bestSellLocation := merchant.city
	bestProfit := 0.0
	possibleCities := []cityName{merchant.city}
	for name := range city.outboundTravelWays {
		possibleCities = append(possibleCities, name)
	}
	for _, buyLocation := range possibleCities {
		buyPrice := merchant.ExpectedPrices[good][buyLocation]
		for _, sellLocation := range possibleCities {
			sellPrice := merchant.ExpectedPrices[good][sellLocation]
			// get moving costs, pretend it's 1 for now
			movingCost := 1.0

			potentialProfit := sellPrice - (buyPrice + movingCost)
			if potentialProfit > bestProfit {
				bestSellLocation = sellLocation
				bestProfit = potentialProfit
			}
		}
	}

	return bestSellLocation, bestProfit
}
```

And thats everything, now merchants can travel between cities located on different computers. As long as the sender and receiver follow our basic protocol, we can move merchants anywhere. The JSON looks like (but ignore the newlines. You can see that we use new lines to indicate end of message, so the JSON being sent can't contain newlines, except the one at the end of the string)

```json
{
        "Money": 1211.4803370633176,
        "BuysSells": "chair",
        "CarryingCapacity": 20,
        "Owned": 3,
        "ExpectedPrices": {
                "bed": {
                        "PORTSVILLE": 31.896729121741835,
                        "RIVERWOOD": 16.95381916897244,
                        "SEASIDE": 30.22688570620929,
                        "WINTERHOLD": 32.65932633911733
                },
                "chair": {
                        "PORTSVILLE": 11.045778022141988,
                        "RIVERWOOD": 20.342182353944178,
                        "SEASIDE": 10.709200882363625,
                        "WINTERHOLD": 11.756341277296725
                },
                "thread": {
                        "PORTSVILLE": 2.421718986326459,
                        "RIVERWOOD": 4.585140611165299,
                        "SEASIDE": 2.301383393344175,
                        "WINTERHOLD": 2.4909610238149353
                },
                "wood": {
                        "PORTSVILLE": 2.371161055748651,
                        "RIVERWOOD": 4.541456107859949,
                        "SEASIDE": 2.288907176392255,
                        "WINTERHOLD": 2.4714546798485775
                }
        }
}
```

Here we see four economies (and again, only the green one can manufacture beds with fewer resources), each pair is in a separate process. Initially each economy is only connected to the other economy in its process, but part-way through we connect the green economy and the red economy through the loopback network interface. We are actually seeing the economies talk over IP, they might as well be on opposite sides of the earth for all they know.

![Four economies](networked_economies.gif){: .center w="800" }

Notice that halfway through almost all the merchants are with the left-side economies, all selling beds, so the price of beds is slowly dropping to match the price of the green economy.

The full repository can be found [here](https://github.com/JasonFantl/Simulated-Economy-Tutorial/tree/master/7). A small change has been made from this tutorial to make the travelWays thread safe. To run the binary, you need to provide the cities you want to run, like `/SimulatedEconomy7 Riverwood Seaside`, and run another application with `/SimulatedEconomy7 Portsville Winterhold`. On the second application hit the `Alt` key, it will attempt to connect to `localhost:55555`, which is what one of the cities from your first application should be listening on.

Here is a functioning example of another application that can interface with a cities server. We have a "Merchant School" that sends 10 new merchants into a city.

```python
import socket
import json
import time

# Replace with your server address and port
server_address = "localhost"
server_port = 55555

def send_message(sock, message):
    sock.sendall(message)

def receive_message(sock, buffer_size=1024):
    try:
        data = sock.recv(buffer_size)
    except BlockingIOError:
        print("No data available to read.")
        return None

    return data

def main():
    # Create a TCP/IP socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        # Connect to the Go server
        sock.connect((server_address, server_port))

        # Send our city name
        send_message(sock, "PythonCity".encode())

        # Receive the remote city name
        response = receive_message(sock).decode()
        remote_city_name = response.strip()
        print(f"Connected to city {remote_city_name}")
        
        # make sure they add us to their city before sending any other messages
        time.sleep(1.00)

        for i in range(10):
            time.sleep(0.01)
            print("Sending merchant...")

            merchant_data = {
                "Money": 1211.4803370633176,
                "BuysSells": "chair",
                "CarryingCapacity": 20,
                "Owned": 3,
                "ExpectedPrices": {
                    "bed": {
                            "PORTSVILLE": 31.896729121741835,
                            "RIVERWOOD": 16.95381916897244,
                            "SEASIDE": 30.22688570620929,
                            "WINTERHOLD": 32.65932633911733,
                    },
                    "chair": {
                            "PORTSVILLE": 11.045778022141988,
                            "RIVERWOOD": 20.342182353944178,
                            "SEASIDE": 10.709200882363625,
                            "WINTERHOLD": 11.756341277296725,
                    },
                    "thread": {
                            "PORTSVILLE": 2.421718986326459,
                            "RIVERWOOD": 4.585140611165299,
                            "SEASIDE": 2.301383393344175,
                            "WINTERHOLD": 2.4909610238149353,
                    },
                    "wood": {
                            "PORTSVILLE": 2.371161055748651,
                            "RIVERWOOD": 4.541456107859949,
                            "SEASIDE": 2.288907176392255,
                            "WINTERHOLD": 2.4714546798485775,
                    }
                }
            }
            print(len(json.dumps(merchant_data).encode()))
            message = json.dumps(merchant_data) + "\n"
            send_message(sock, message.encode())

        # send back any received merchants
        sock.setblocking(False)
        received_count = 0
        while True:
            message = receive_message(sock)
            if message:
                received_count += 1
            else:
                break

        # Close the connection
        sock.close()

        print("Sent 10 merchants and received", received_count)

if __name__ == "__main__":
    main()
```

## [Next]({% post_url 2023-05-7-Simulated-Economy-(8) %})

I play with connecting the economy to other complex systems by simulating population dynamics, where population counts impact the price of goods in the market (Foxes eat rabbits, the number of rabbits impacts the supply of furs).