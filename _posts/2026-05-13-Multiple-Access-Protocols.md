---
title: Medium Access Control Protocols
categories: []
img_path: https:///blog-assets.jasonemerald.workers.dev/MAC
image: hawaii-map.png
math: true
---

## Introduction

A medieval General is using messengers to communicate with his regiments, but he finds that using people to end messages is slow. After thinking, he realizes he could use drums for communication. Every regiment learns their distinct drum patterns to send reports and to listen for commands. But in practice, the General finds that two regiments will often start drumming over each other and he is unable to decipher the message. This is because the regiments might start at the same time, or one regiment can't hear that the other is already drumming when they start. This means the General doesn't always understand the message, and the regiments can't know if the General heard their message. How can the General prevent such costly communication failures?

<!-- One day an innovative General in a medieval army discovers he can speed up communication with his regiments by sending messages back and forth using drums. But on their first day of battle, they discover a critical issue: interference. Sometimes two regiments start drumming at the same time and the General cannot decipher the message from either one. How can the General prevent such costly communication failures? -->

Solutions to this type of problem are known as [Medium Access Control](https://en.wikipedia.org/wiki/Channel_access_method) (MAC) protocols, and are critical to the function of all modern digital communications. Instead of drums, we use radio waves, but the idea is the same. Our wifi, cellular, and Bluetooth devices must all solve this problem. Because they operate under different constraints, they each solve it in a slightly different way.

Before we look at modern communications, let us travel back to 1969 to the islands of Hawaii and discover how the first wireless computer network solved this issue.

## ALOHA

On the island of Oʻahu, the main campus of the University of Hawaii hosted a powerful IBM computer. Nearby community colleges wanted to connect to this powerful computer, but unfortunately these colleges sat on separate islands. Laying down a cable to create a point-to-point network, like the [experimental ARPANet](https://historyofcomputercommunications.info/section/4.0/Overview/) of the time, would have been expensive. So, they decided to use this as the perfect excuse to research implementing a wireless computer network.

Thus was born the [ALOHAnet](https://www.eng.hawaii.edu/wp-content/uploads/2020/06/THE-ALOHANET-%E2%80%94-SURFING-FOR-WIRELESS-DATA.pdf).

The goal was fairly simple: enable all the islands to communicate with the IBM machine at the same time. This meant a radio on every island, each trying to communicate with the base station.

![](hawaii-map.png){: .center w="400" }

One big issue presented itself: If two islands tried to communicate with the base station at the same time, their radio signals would overlap and become indecipherable, exactly the issue our General struggled with when listening to multiple regiments at once.

This is where we introduce the first Multiple Access COntrol protocol, today known as [Pure ALOHA](https://en.wikipedia.org/wiki/ALOHAnet#Pure_ALOHA).

Take a moment to try and solve the problem yourself. How could the regiments minimize collisions, or at least make sure their message was heard by the General? Later we will see how WiFi solves this issue using a single communication channel, but ALOHA had it easier since it used two frequencies for its protocol. In our army metaphor this can be represented as being able to use both drums and horns, where different instruments can each communicate without interfering with the other instruments.

Below is the algorithm for Pure ALOHA, the first-ever random-access Multiple Access protocol for a wireless computer network.

### Pure ALOHA

When you have a message to send, immediately send it. This may collide with someone else, so you need to get back a acknowledgement from the base station (the General) confirming they got our message. We might worry that the acknowledgement message could collide with another message, but ALOHA uses the second frequency for any messages sent out from the base station, which means there cannot be interference from other stations. This also means that when the base station sends you information, it doesn't need a acknowledgement back.

If a user doesn't get back the acknowledgment (called an ACK) in a short timeframe, then they should resend their message. But we need to be careful here. Imagine everyone immediately tries to resend after they fail; what would happen? Two users who just interfered with each other would immediately resend and interfere again! And this would repeat forever. To solve this, users will wait a random amount of time before resending their message. Eventually their messages won't collide, and all the packets will be acknowledged. In the [original paper](https://www.clear.rice.edu/comp551/papers/Abramson-Aloha.pdf) they sample their random delay from an exponential distribution, but later we will see how this can be improved. 

Below is a simulation of Pure ALOHA with 3 stations talking to a base station. The stations randomly have data to send. They also use a sample from an exponential to determine how long to wait before trying again. Initially the traffic is infrequent, so everything functions smoothly. Once multiple stations attempt to send data at the same time, we see more collisions and longer wait times for each message. In the original paper they calculate that at 324 users, not a single message would get through. But typical ALOHA traffic was small enough that this protocol was sufficient.

<div style="text-align: center;">
  <video controls autoplay muted loop playsinline width="75%">
    <source src="https:///blog-assets.jasonemerald.workers.dev/MAC/aloha.webm" type="video/webm">
  </video>
</div>

Code for the animation is [here](https://github.com/JasonFantl/MAC-animations/tree/main/ALOHA/sketch).

This worked! Although, it's not very efficient. You can again look at the [original paper](https://www.eng.hawaii.edu/wp-content/uploads/2020/06/abramson19xx-THE-ALOHA-SYSTEM%E2%80%94Another-alternative-for-computer-communications.pdf) to see where they calculate the efficiency of this algorithm to be 18.6% of the theoretical optimal throughput.

This was followed by many improvements, such as using [slotted ALOHA](https://dl.acm.org/doi/pdf/10.1145/1024916.1024920), which increased the throughput to 36.8% efficiency by using time slots. And these improvements only [continued](https://en.wikipedia.org/wiki/ALOHAnet#Protocol). But more interesting was the development that ALOHA inspired in other mediums.

## Ethernet

Immediately after the success of ALOHAnet, it was recognized that a similar protocol could be created for wired networks. In fact, it should be adaptable to any medium that can carry a signal. This new protocol was called Ethernet, inspired by the historical concept of the luminiferous ether, used metaphorically as a passive signal-carrying medium. This protocol would allow any number of computers to talk to each other over any medium, such as a single wire.

This protocol is notably different from both ARPAnet and ALOHAnet. ARPAnet used a directional wired point-to-point connection between devices, so collisions were not possible. ALOHAnet used a wireless connection to a central base station, so it could rely on acknowledgments from that base station. Ethernet uses a single wire that every computer connects over, and instead of a base station, every computer would be treated the same.

Here's how you would set up an Ethernet network: Lay a cable around the room, then [clamp](https://en.wikipedia.org/wiki/Vampire_tap) each computer onto the cable. That's it; you now have a functioning network. Unfortunately, we must again solve the issue of coordinating all the computers so they don't talk over each other. Fortunately, the wired environment is easier than the wireless environment. 

Computers on the wire can listen to the cable at the same time as they transmit over it. This is quite powerful. Before, in the wired setting, the transmitter had to be as loud as possible to reach the far-away radio, meaning, if a radio tried to listen while it transmitted, all it would hear would be its own transmission. Imagine in our regiments analogy, the drummers need to be as loud as possible to be heard, but that means they can't hear other drums. But on a wire, this problem doesn't exist. It takes almost no power to transmit a signal to everyone else, so a computer won't drown out its receiver. And since we know everyone is listening on the same wire, we know that everyone will hear the same thing (up to a very small propagation delay). These two useful facts allow us to build a much more powerful Multiple Access protocol.

### Ethernet Protocol

Because we know everyone is hearing the same thing, we can wait until the wire is quiet before we talk (this wouldn't be as useful in ALOHAnet since we don't know what the base station is hearing). This listening before transmitting is known as [Carrier Sense Multiple Access](https://en.wikipedia.org/wiki/Carrier-sense_multiple_access) (CSMA) and reduces the likelihood of collisions in Ethernet. It does not eliminate them though.

Just like ALOHAnet, users need to wait a random amount of time after the wire becomes free in order to avoid all talking at once. Sampling that delay from an exponential distribution like ALOHANet would be sub-optimal. Imagine if we had a million computers on the network; it would grind to a halt. The likelihood that at least two computers would pick roughly the same delay every time would be extremely high and the collisions would never end. Ideally, we scale our delay by the size of the network. We could make a complicated protocol to track the number of people on the network to do this, but there is a much more elegant solution.

Ethernet developed [exponential random backoff](http://en.wikipedia.org/wiki/Exponential_backoff#Collision_avoidance), where instead of sampling from a static distribution, it samples from a uniform interval that doubles each time a collision occurs, and then resetting after a successful send. This allows the interval to scale to the size of the network dynamically, adapting to computers being silently added and removed from the network.

One final improvement was to detect collisions immediately. If we listen to the wire while we are transmitting, we can compare what we are sending to what we are hearing. If they are different, then we immediately know a collision just occurred. This is necessary since there isn't a base station anymore to tell us if a collision occurred. With the ability for immediate detection, the protocol is appended to be called [Carrier-sense Multiple Access with Collision Detection](https://en.wikipedia.org/wiki/Carrier-sense_multiple_access_with_collision_detection) (CSMA/CD).

The Ethernet cable did have a small delay, so it would be possible for a node to transmit a short message and not hear that a collision occurred until after they finished transmitting, which would not be caught by CSMA/CD. So Ethernet requires that a message must be broadcast for at least as long as a packet takes to make a round-trip along the wire. This message size is typically called the Minimum Ethernet Frame Size.

Here we see a simulation of Ethernet with three computers. We exaggerate the delay of the signal traveling over the wire. When two computers try to send at around the same time, they will detect that the signal on the wire is not what they are expecting and start a random backoff.

<div style="text-align: center;">
  <video controls autoplay muted loop playsinline width="75%">
    <source src="https:///blog-assets.jasonemerald.workers.dev/MAC/ethernet.webm" type="video/webm">
  </video>
</div>

Code for the animation is [here](https://github.com/JasonFantl/MAC-animations/tree/main/Ethernet/sketch).

We see how quickly collisions are recovered from and how they are avoided, allowing for an arbitrary number of computers to be on the network.

It is important to note that what we call Ethernet today has gone through many changes and is unrecognizable form what we described above, so we should mentally separate modern Ethernet as a completely different protocol.

As powerful as Ethernet was, it didn't solve every problem, and some people moved onto building new networks such as WiFi. 

## WiFi

It took a while to get WiFi as fast as Ethernet, but after some deregulation and hardware improvements, WiFi went commercial in 1999. If you consider the WiFi network in your home, you may realize that this is a return to the scenario of a central base station wirelessly communicating with users, exactly like we had in Hawaii's ALOHANet.

If we wanted to, we could just reuse the ALOHA protocol for WiFi. But because of hardware advances, regulatory constraints, and the intended use case for WiFi, it would benefit from a whole new protocol. The largest constraint is that WiFi only uses a single frequency at a time for each router.

WiFi is going to be in apartments and stadiums, which means nearby WiFi routers may interfere. So while a single router will only use one frequency, we need nearby routers to use different frequencies. The hardware in WiFi routers uses a channel 22 MHz wide, and regulation only provided 83.5 MHz of the spectrum to use, meaning we can only fit up to 3 non-overlapping channels in the allowed space (recall that having different channels is helpful since each channel can communicate without interfering with the other). We will use these 3 channels to avoid interference between nearby WiFi networks, which means we only get a single channel for a router in a home (it is technically possible to create a router that can listen over all the channels at once, but it is more expensive and complex). This is harder than ALOHA, where we had the two channels.

Take a moment to consider how you might solve this. Think back to the General and his regiments; now that they only have drums, how can they send commands back and forth?

### WiFi Protocol

Users will send messages to the router and wait for an ACK, and if an ACK is not received shortly we assume a collision occured. Instead of using a second channel for ACKs like in ALOHA, the ACK will be sent over the same channel and rely on the network being quiet while the ACK is sent. If there is ever a collision, either the data or the ACK, the node will just re-transmit the packet a few moments later. This works, but there are a few additional improvements that can be made.

We can dramatically reduce collisions by using CSMA, which, as a reminder, means a node will listen to make sure the channel is free before transmitting, then wait a random delay using exponential backoff. Because of self-interference, we can't tell if our transmission had a collision, so we must wait for an ACK from the base station to determine if a collision happened or not. This is called [Carrier-sense Multiple Access with Collision Avoidance](https://en.wikipedia.org/wiki/Carrier-sense_multiple_access_with_collision_avoidance) (CSMA/CA).

This collision avoidance has room for a further improvement. If nodes wait a small delay after the channel is free, in addition to the exponential backoff, this gives the base station some time to reply without interference. This delay time is called the [Distributed Coordination Function Interframe Space](https://en.wikipedia.org/wiki/DCF_Interframe_Space) (DIFS). Since the ACK is sent immediately from the router (it does not use this additional delay), DIFS essentially gives the ACK priority in the network and guarantees that no one else will transmit over it.

This is how WiFi operates in most of our homes today.

<div style="text-align: center;">
  <video controls autoplay muted loop playsinline width="75%">
    <source src="https:///blog-assets.jasonemerald.workers.dev/MAC/wifi.webm" type="video/webm">
  </video>
</div>

Code for the animation is [here](https://github.com/JasonFantl/MAC-animations/tree/main/WiFi/sketch).

We see how B and C can hear each other, so when B has a message to send, it knows to wait until C is done. But we can see how there is a collision between A and B since they can't hear each other. WiFi works better when all the devices can hear all the other devices. There is an additional setting on your router you can try switching on/off if you find yourself running slow due to this issue, known as the Hidden Node problem. 

### Hidden nodes

Imagine two regiments are on different mountains, one to the east of the General, and one to the west. They can communicate with the General, but are too far apart from each other to hear the other regiment. Even if they used CSMA/CA, the messages would still end up colliding at the General.

This is a nasty problem known as the [Hidden Node Problem](https://en.wikipedia.org/wiki/Hidden_node_problem). We saw this above between computers A and B.

We see that B starts sending a message to the base station and A has no idea. In the middle of B's transmission, A begins transmitting, as it believes the airwaves are free, so both messages are corrupted in the middle. 

This problem shows up in many communication scenarios, not just packet-based networks like WiFi. Here are two examples of where the hidden node problem causes very serious problems in analog networks.

* Pilots talk to the command tower over shared analog channels, so sometimes pilots may interfere with each other. You can tell when this happens because the audio becomes a squeal. This can cause critical information to be lost, such as we saw in the [deadliest accident in aviation history](https://en.wikipedia.org/wiki/Tenerife_airport_disaster), where one contributing factor to the disaster was the interference from two pilots trying to talk over the channel at the same time. This is still a problem [today](https://aviationweek.com/business-aviation/safety-ops-regulation/crosscheck-stepped-radio-transmissions).
* Walkie-talkies use a single analog channel and are also prone to the hidden node problem. Again, this is a technology used in high-stakes scenarios such as firefighting and search and rescue. Unfortunately, in these scenarios, mountains and buildings are a common obstacle, increasing the likelihood of the hidden-node problem.

Now back to WiFi. Our CSMA/CA protocol does not account for collisions due to the hidden node problem. To solve this, the base station (who can hear and talk to all the nodes) will pick one node at a time and tell all the other nodes to be quiet. The node can talk for a few moments, then the router picks the next node. In order to choose which node to select, the router picks the first node that sends it a request (read as the first request that didn't collide). Here's how that looks in more detail.

Nodes wait for the channel to be free (CSMA), wait a tiny window (DIFS) to let ACKs take priority, wait some random time to avoid all talking at once (exponential random backoff), then finally send a tiny Request-To-Send (RTS) packet. The base station will accept the first valid RTS packet it receives, then send back a Clear-To-Send (CTS) packet immediately. When nodes hear a CTS or RTS packet, they will know they were not the first node to make a request and will wait until the next time they can make a request, determined by a time specified in the packet (this is called [Network Allocation Vector](https://en.wikipedia.org/wiki/Network_allocation_vector) (NAV)). When the node that sent the RTS gets the CTS, they will transmit their data for the allotted time.

Below is a simulation of WiFi with RTS/CTS. The nodes are trying to send messages at the same time as the simulation above, so the hidden nodes that previously collided, nodes A and B, no longer collide. Watch how node A uses a CTS+NAV backoff to track when the router is occupied, even though node A can't hear node Bs transmission. 

<div style="text-align: center;">
  <video controls autoplay muted loop playsinline width="75%">
    <source src="https:///blog-assets.jasonemerald.workers.dev/MAC/wifi-rts.webm" type="video/webm">
  </video>
</div>

Code for the animation is [here](https://github.com/JasonFantl/MAC-animations/tree/main/WiFi-RTS/sketch).

Note that this reduces but does not eliminate the Hidden Node problem, the RTS and CTS packets can still collide. Throughput may increase since the large packets are no longer colliding, just the small RTS/CTS packets. Small packets are less likely to collide and can recover faster.

But oftentimes RTS/CTS is turned off on your router, as plain old CSMA/CA does well enough, and the overhead of RTS/CTS can sometimes outweigh the benefits it provides.

We've been looking at WiFi in a house with a few devices, but let's see how it scales. An interesting case study is the use of WiFi in stadiums.

### Getting WiFi to work in a stadium

Some stadiums can have over 100,000 people packed into dense seating, where each person is carrying a phone that's transmitting data, such as streaming video of the halftime show. That's a lot of communication; this is much more difficult than the WiFi in a home. Well, let's see how you might solve some of these issues and supply WiFi to a stadium like this one.

Give it a thought and see if you can predict the issues we run into and how we might solve them.

Stadiums are quite large, so our first guess might be to place a super powerful router in the center of the stadium so it can reach everyone. Technically this would work, but it faces some issues. If there are 10,000 people all trying to talk to a single WiFi router at once, then most of the time will be spent trying to recover from collisions. Even if we could magically remove the collisions, everyone would only get 1 / 10,000 of the airtime to send their message, meaning they have to wait minutes at a time to send a picture.

So now let's place hundreds of routers throughout the stadium. We'll also lower the routers' power so each one only has to communicate with at most a few hundred people at a time. Note that the smaller we can make the communication radius the better, although the more routers (and money) we will need. But now these routers are all interfering with their neighbors. Recall that the WiFi protocol reserved a few frequencies for just this purpose. We can carefully assign the 3 channels such that neighbors don't interfere with each other. 

![](3color.png){: .center w="300" }

This is sufficient, but there is still some interference from the phones in one cell transmitting loud enough to interfere with far-away cells of the same frequency. We turned down the routers power to avoid the interference, but peoples cell phones don't do this. The more recent 5 GHz WiFi has 19 non-overlapping channels, which means we can be more clever with our channel assignments, maximizing the distance between cells of the same color. We could also assign those 19 channels to load balance the cells or to avoid environmental interference; there are a lot of ways you might assign these frequencies. This is called the Frequency Assignment Problem, and there [are](https://www.researchgate.net/publication/377181699_Towards_Optimal_Frequency_Plans_A_Survey_of_Frequency_Assignment_Strategies_Models_and_Methods) [many](https://www.sciencedirect.com/science/article/pii/0012365X9500225L) [solutions](https://webdoc.sub.gwdg.de/ebook/e/2003/zib_2/reports/ZR-01-40.pdf). You could pretty easily invent some for yourself (I recommend looking into the related problem of the [Four Color Theorem](https://en.wikipedia.org/wiki/Four_color_theorem) if you do). More sophisticated assignment algorithms might even dynamically assign channels to do load balancing and avoid interference in real time.

Even with the additional channels and sophisticated assignment algorithms, stadiums can still suffer from users' devices interfering with the other routers in the stadium on the same channel. So people developed a more practical solution. They decided to place the routers underneath the seats, using human bodies to dampen the signals. This is quite clever. Interference grows with the number of people in the stadium, and now the dampening mechanism also scales with the number of people in the stadium. With this knowledge, now you know if you need a better signal in a stadium, you should probably bring your phone as low as possible.

But even stadiums are far from the largest networks we need to manage. Moving onto cellular networks.

## Cellular

Once wireless networks had been proven out, it was time to replace the outdated rotary phones with wireless ones. 

The first wireless phone network was the [Mobile Telephone Service](https://en.wikipedia.org/wiki/Mobile_Telephone_Service) (MTS), which used a single tower to relay calls. It was a [circuit-switched](https://en.wikipedia.org/wiki/Circuit_switching) network that assigned two dedicated frequencies for each call (one for each direction) and relied on people retrying their call if they heard interference. This is similar to the CSMA/CD protocol, but people are executing it instead of machines. Because this single tower lacked the ability to reuse frequencies, the capacity was incredibly low. In a city like New York, only a few dozen people could be on the phone at the same time. If the channels were full, you simply had to wait and try again later.

The first scalable wireless cellular phone network was the [Advanced Mobile Phone System](https://en.wikipedia.org/wiki/Advanced_Mobile_Phone_System) (AMPS), built by Bell Labs in 1983. It placed towers in a hexagonal grid pattern, forming cells in which frequencies could be reused for distant users. This is why it's called a cellular network. It was able to seamlessly reassign users to new towers and frequencies as they moved between cells. A charming and highly informative commercial explaining AMPS can be seen [here](https://www.youtube.com/watch?v=d6X_1PcR_gs). But this is still a circuit-switched (dedicated frequency to each user) network, so it was still limited in its scalability.

AMPS was a first-generation (1G) cellular network, and it wasn't until the 3G cellular networks that we introduced a [packet-switched](https://en.wikipedia.org/wiki/Packet_switching) network where channels can be shared across all users sending small packets of data. These packets allow us to have more control over how we distribute traffic across available resources.

Cellular networks use a large number of frequencies within a cell, where a different packet can be sent over each frequency, which is known as [frequency-division multiple access](https://en.wikipedia.org/wiki/Frequency-division_multiple_access) (FDMA). Each frequency can be broken into time slots so messages can be spread across time, which is known as [time-division multiple access](https://en.wikipedia.org/wiki/Time-division_multiple_access) (TDMA). We can also reuse these frequency-time blocks across different regions of a cell by using directional antennas, so different regions in the cell will not interfere, sometimes called [space-division multiple access](https://en.wikipedia.org/wiki/Space-division_multiple_access) (SDMA). These resource blocks of frequency-time-space do not interfere with each other and so allow a huge number of packets to be sent from different devices in the same cell.


![](cell-resource.svg){: .center w="500" }

Another clever multiple access modulation scheme is called [Code-division multiple access](https://en.wikipedia.org/wiki/Code-division_multiple_access) (CDMA), which spreads data over a long period of time and modulates it with a "spreading code". When multiple devices transmit over the same frequency at the same time with CDMA, a cell tower can use the known spreading codes to mathematically disentangle the different data streams.

All these schemes are known as orthogonal Multiple Access schemes (CDMA is nearly orthogonal), and they allow for a combinatorial explosion of packets to be sent. For the future 6G cellular networks, people are [looking into](https://www.researchgate.net/publication/323141497_Toward_the_Standardization_of_Non-Orthogonal_Multiple_Access_for_Next_Generation_Wireless_Networks) the even more flexible [non-orthogonal Multiple Access](https://ieeexplore.ieee.org/document/7381343) schemes. If you find this interesting, there are many areas of research in this area you can [dive deeper into](https://arxiv.org/pdf/2403.00189v2).

Each cell does still have a finite number of resource blocks to allocate, so as a cell begins to saturate (maybe because a city gets denser, or a spot becomes a tourist location, or a stadium is built), the large tower making up a cell can be replaced by multiple smaller towers, allowing for more resource reuse in the same area.

Collisions almost never occur in cellular networks because cell towers provide their devices a schedule for what frequency-time-space(-code) resource blocks each device can send over. One place we need to be very careful when building schedules is for devices that are moving between cells, making sure they do not use resources used by anyone in the neighboring cell they are moving into.

The only time we have a chance for collisions is when a device first joins the network. There is a dedicated channel that is called the [random-access channel](https://en.wikipedia.org/wiki/Random-access_channel), where devices randomly attempt to register themselves into the network, retrying when they fail to hear back an acknowledgment after a short period of time. Because this only needs to happen once, it is ok if it takes a few tries. This is ALOHA where you can add FDMA or other Multiple Access techniques to decrease the chance two messages collide.

Because of the infrastructure of cell towers and the huge number of orthogonal modulation schemes, we are able to efficiently schedule resources for millions of devices across a country, maximizing throughput with minimal collisions. 

We now look at a far more difficult environment, that of ad-hoc (no infrastructure) mesh networks. 

## Mesh

Mesh networks are the most difficult networks to design for as they are the most general. If you don't have any infrastructure, such as cell towers or fiber optic cables or WiFi routers, then the devices themselves manage the network. Often times, devices will move, or join or leave the network at anytime. Since mesh networks are built to operate under these harsh constraints, they are often very useful in harsh environments such as outerspace or battlefields.

Imagine a space mission to a new planet, infrastructure would be hard to set up initially, so a mesh network would be helpful. Or if you want a backup network in case the primary one fails in a natural disaster or gets shutdown by a government, a mesh network can be spun up anywhere at anytime. If you need to suddenly perform a search-and-rescue mission for people stuck in a cave system, then an ad-hoc network is essentially the only option you have. Or maybe you just want a quick network for your music festival in the middle of the desert.

In our regiment metaphor this would look like we removed the General and now regiments have to communicate among themselves.

The largest issues in mesh networks are: the Hidden Node Problem, that nodes can join and leave, and that nodes can be dynamic. Another issue, small, but still important, is the [Exposed Node Problem](https://en.wikipedia.org/wiki/Exposed_node_problem), where nodes hearing traffic avoid transmission themselves, but the receiver of their transmission is out of range of the traffic and would have been able to receive the packet if the node had sent it. As networks get larger, this becomes a major bottleneck.

Let's start at the beginning, which as usual, is with DARPA.

### DARPA SURAN Project

in 1973, DARPA funded its first mesh networking project, called The Packet Radio Network (PRNET), followed by the [Survivable, Adaptive Networks](https://en.wikipedia.org/wiki/SURAN) (SURAN) Program, which then branched into [a number of different programs](https://thelastmile.forterra.com/how-the-u-s-military-helped-develop-mobile-mesh-networking/). SURAN was an ambitious program to create mesh networks for the battlefield for a large number of nodes. Its purpose is well stated in [its paper](https://ieeexplore.ieee.org/document/117536), which said

> DARPA sponsored the Survivable, Adaptive Networks (SURAN) Program to research and develop network technology capable of supporting communication between computers and their users in the modern battlefield. This environment possesses characteristics that in the past have been incompatible with reliable communication, such as large numbers (thousands) of nodes, dynamics (mobile nodes, node failures, changing traffic demands), and sophisticated attempts to disrupt the network (intelligent jamming, message modification).

But how did they do this?

SURAN is what we would today call a cross-layer program, managing both the routing of messages and the multiple access protocol together. It would track the health of a link (might be jammed, overly congested, or the environment is just bad), re-route messages through healthier paths in the network, adjust the radio power of a node to adapt to changes in density of the network, and manage the rate of sending messages based on the network health. All together this made a highly dynamic and survivable network.

Collision avoidance is a small component of this interconnected system, but if we were to isolate it, it would be random-access using spread-spectrum. Nodes send their packet, and if they don't hear an ACK after a short period, they update their view of network health and re-send (they might send to a new neighbor or wait longer, depends on how the rest of the SURAN system responds to the update of the network health). Collisions are minimized using CDMA (recall this means spreading messages across time using a spreading code), meaning almost no coordination is needed. 

As networks become denser, interference rather than coordination becomes the limiting factor (again, a consequence of using CDMA). SURAN addressed this by combining the spread-spectrum access with adaptive transmission power and dynamic routing, allowing the network to maintain connectivity and performance while reshaping its topology and traffic patterns.

SURAN was powerful, but overly complex for the widespread needs of commercial products, which were typically smaller in scale and more domain-specific.

### Bluetooth, Zigbee, LoRa

There are a few different commercial protocols that are used today, with slight variation between them.

#### Bluetooth

It turns out that people love to be covered in tiny networks. People like to have their phone connected to wireless earbuds, smart watches, and computers all at once. [Bluetooth](https://en.wikipedia.org/wiki/Bluetooth#) was invented to optimize communication for these types of networks, often called [personal area networks](https://en.wikipedia.org/wiki/Personal_area_network), which is where small devices are all sitting near each other.

In these networks there is one device which is the "main" device, such as the cell phone connecting to everything else. Because of this, Bluetooth uses a master-slave architecture where one device is in charge of all the other devices. People also usually don't have that many devices, so classic Bluetooth only allows up to 8 nodes (including the master node) in the network. These small bluetooth networks are usually called [piconets](https://en.wikipedia.org/wiki/Piconet).

This is classic Bluetooth, and it is not actually a mesh network. You can see that it has the same structure as WiFi. It does differ from WiFi by exchanging complexity for power efficiency, as we'll see below. 

Whoever initiates the Bluetooth connection is the master device, although the role can be re-negotiated later. New nodes can be added by pausing the piconet and having the master send out connection requests, which potential nodes will respond to using random backoff. This means for establishing links Pure ALOHA is used by uer request.

For typical communication, Bluetooth devices use very small frames where the master will send a packet to a slave, then the slave can send a packet back. The schedule for who to talk to is determined by the master ID and a sequence number, which means all the nodes in the network can deterministically generate the schedule. Just like with the cell towers, a schedule removes the possibility of collisions. The master can schedule devices however it likes, but commonly it will use round-robin. This is the power-intensive component of a Bluetooth network.

Bluetooth does have one funny feature, where [each frame is sent over a different channel](https://en.wikipedia.org/wiki/Frequency-hopping_spread_spectrum). The master chooses one out of 79 channels 1600 times a second, sending out the channel schedule so slaves know what channels to listen on. This is called [frequency-hopping spread spectrum](https://en.wikipedia.org/wiki/Frequency-hopping_spread_spectrum). The reason it does this is to avoid interference. Bluetooth operates on the same frequencies as WiFi, so your earbuds might be interfering with your WiFi connection. But with adaptive frequencies hopping, Bluetooth will monitor each channel and dynamically avoid the noisy ones.

Let's look at a real mesh Multiple Access protocol.

#### Zigbee

Sensor networks are common in warehouses or smart homes or smart cities, and they also have unique network characteristics. [Many protocols](https://www.eecs.northwestern.edu/~peters/references/MACSurveryNaik04.pdf) have been developed for this environment, Zigbee being one commercial example.

Zigbee uses CSMA/CA, nearly identical to WiFi. Sending from one node to another matches the behavior we saw with WiFi, but it differs in that nodes in Zigbee can also send out a broadcast to all neighbors, which unfortunately means it can't tell if there was a collision, as some may have collided while other did not. This means that we can confirm messages from point-to-point, but not for broadcasts.

Zigbee also has additional features built on top of the Multiple Access protocol to allow devices to save energy by putting the device to sleep. You can imagine this means that the network is fairly dynamic, with nodes turning on and off fairly consistently. 

And now let's look at an example of a more extreme environment.

#### LoRa

Some radios are long-range (LoRa) and extremely low power, often used for sending short texts in natural disasters. This means that traffic is highly infrequent and small.

Because of the heavy emphasis on power management, devices will often turn off for long periods of time in between transmissions. This means managing a complex protocol is not feasible. Fortunately, because of the slow traffic, you often will not get collisions, even if you send at random.

LoRa-based networks will almost always use an ALOHA channel, just sending when there is data to send and waiting for an ACK, resending on a timeout. Sometimes the ACk is optional, such as in one of the more popular LoRa protocols: LoRaWAN.

Often in these extreme situations, simplicity is the best answer.

### Trucker Radios

Trucker radios typically communicate over a single analog channel, so collisions are common. Because it's analog, people have to run the Multiple Access protocols verbally.

Before people talk over the channel, they listen to make sure no one else is already talking (CSMA), and then they will talk. Responses are expected to be immediate so the conversation can be easily detected as over by others. Collisions are common, so there are common phrases to let a person know that they were "stepped on" or "doubled". One helpful rule truckers use to minimize the chance of collisions is to keep messages as short and dense as possible.

Can you design a better protocol for talking over trucking radios, or justify why the current protocol is the best? Note that we have one channel, it's wireless, and traffic is infrequent and bursty. It is also worth looking into the benefits of an analog network over a packet-based one.

### VANETs

Vehicular ad-hoc networks (VANETs) typically use a MAC protocol nearly identical to Wifi, where CSMA/CA is used with RTS/CTS packets. This does not handle the Hidden Node problem well since it is using the WiFi protocol in a dense mesh environment. This is a known limitation of the current implementation, but TDMA-based solutions are now [being explored](https://www.mdpi.com/1424-8220/20/23/6709).

### Other Multiple Access Protocols

Here are some ideas that are either old and no longer around today, or too new or academic to be widely known. This is just a tiny selection of mesh MAC protocols out of literally hundreds of variants, so if they spark interest, you can explore more of them [here](https://www.academia.edu/18500393/A_survey_classification_and_comparative_analysis_of_medium_access_control_protocols_for_ad_hoc_networks) and [here](https://users.ece.northwestern.edu/~peters/references/MediumAccessControlSurveyKumar.pdf).

#### Hybrid TDMA-CSMA

For different kinds of traffic you can layer multiple protocols next to each other, separated across channels or time. For example, [hybrid TDMA-CSMA](https://arxiv.org/html/2509.06119) splits the protocol into two time slots, a TDMA and CSMA slot. Different slots allows different traffic types to use the most appropriate protocol depending on if it is small bursty traffic or a large transmission.

This can be useful if you realize your traffic patterns contain multiple traffic types. You are not restrited to using a single protocol for a situation.

#### MACA

One funny idea was to get rid of the Collision Sense (listening to make sure not to transmit) in CSMA/CA and just use RTS/CTS packets to determine if a node was free. This was proposed since the hidden node problem made Collision Sense an unreliable measure for potential collisions, so why not get rid of it? This was called [Multiple Access Collision Avoidance](http://www.columbia.edu/itc/ee/e6950/maca.pdf) (MACA).

It is not used much today since the protocol wastes a lot of time sending RTS/CTS packets, and Carrier Sense turns out to be useful since you often do not want to send out packets when you can hear a node transmitting.

#### Q-CSMA

This is an improvement on CSMA, where the interval you wait before transmitting is based on how much data you have to send (called the queue), so the nodes with a lot of data (a large queue) will get to transmit more often. One such protocol is called [Q-CSMA](https://arxiv.org/pdf/0901.2333), and there are many [similar](https://web1.eng.famu.fsu.edu/~mingyu/rfs-ton-2010/28-walrand-distributed-csma-TON-2010u.pdf) [variants](https://dl.acm.org/doi/epdf/10.1145/1811099.1811093).

These are not widely deployed as general-purpose protocols today since they optimize for throughput and not latency. If a node has a small amount of data to send, it will have to wait a long time. You can of course modify these protocols to weight the older queues so they are more likely to transmit before getting too old, but this adds additional complexity. A lot of traffic we have today is latency-sensitive, so these variants of CSMA are mostly ignored.

#### Busy Tone

This algorithm is old and not used, but provides a novel solution to the hidden node problem. It uses two frequencies, although it only sends packets over one. It also uses slotted time intervals, so some of the race conditions do not appear (try and see below where we might see race conditions if we had asynchronous radios).

We can use one channel as a data channel and the other as a busy-tone channel. When a node wants to send data, they send out a Request-To-Send (RTS) packet, and if the receiver receives it, they start sending out a busy tone (constant signal, no decoding needed) over the busy-tone channel. The sender can begin transmitting once they hear the busy tone; otherwise, they just resend the RTS using exponential random backoff. The receiver will continue to send the busy tone until the message is finished (and maybe send back an acknowledgment if we are paranoid about ambient interference). This busy tone allows hidden nodes to know when their neighbors are receiving a message that the hidden node cannot hear. This algorithm is known as [Busy Tone Multiple Access](https://dl.acm.org/doi/pdf/10.1145/55483.55518).

This does have some subtlety, like how to implement a busy tone in place of sending packets. If we tried to use packets, then busy packets could collide and get corrupted, which allows for protocol failures (try to figure out the failure case yourself; it requires a number of nodes). Multiple busy tones need to be able to interfere and still trigger neighboring nodes to wait. Also recognize that this protocol does not use CSMA and still avoids data collisions, which is pretty amazing. In fact, by not using CSMA, it produces a better solution with respect to the Exposed Node Problem.

This is an outdated protocol since it essentially wastes a full channel that might otherwise be used for increasing throughput.

These were all outdated protocols, let's take a look at some very recent Multiple Access protocol for mesh networks.

#### DDMC-TDMA

We can use previous Multiple Access protocols to build more complex protocols.

This is the [Dynamic Distributed Multi-Channel TDMA](https://repository.uantwerpen.be/docman/irua/631c32/178181.pdf) (DDMC-TDMA) protocol, which is essentially TDMA, except one of the frames is a "control" frame in which nodes figure out who gets to transmit in the following frames. Within the control frame the nodes will use ALOHA to determine who is sending on which frames, although the authors mention that we could experiment with other protocols in place of ALOHA. Because of the additional coordination built on top of the simple ALOHA protocol, we can solve the Hidden Node Problem and Exposed Node problem (and interference if on multiple frequencies) for the larger frames in which the majority of data is sent (although the issues still exists for the small coordination packets in the control frame).

What's so neat about this is that we determined a schedule without any central leader such as a cell tower, it was a decentralized process.

Can we determine a schedule without the problematic control frames? Below is another recent protocol that attempts to solve exactly that issue.

#### KAMA

The [Key-Activation Multiple Access](https://dl.ifip.org/db/conf/wmnc/wmnc2021/13_PID1570758768.pdf) (KAMA) protocol minimizes collisions in multi-hop networks by having nodes perform a decentralized election for each time slot. For every slot in a frame, nodes independently compute which node in their 2-hop neighborhood has the highest priority and may transmit.

Nodes maintain their 2-hop contention sets by occasionally piggybacking 1-hop neighbor lists in packets when inconsistencies are detected. For each slot, nodes deterministically compute a priority by hashing node IDs with the slot ID, producing a total ordering of contenders. The node with the highest priority among the known nodes in a 2-hop neighborhood is allowed to transmit, ensuring collision-free transmissions among those known nodes. Because the priority computation is deterministic, nodes with consistent neighborhood knowledge independently elect the same winner for each slot without coordination.

These were examples of some of the most recent advances in Multiple Access protocols for mesh networks.

## Conclusion

There are many solutions our General could implement for his drum-based communication, I leave it to you to identify the best solution. It is useful to consider: What does the expected communication traffic look like? Do regiments need to communicate with each other? Is it ever acceptable for messages to be lost? What is the communication topology? Are you optimizing for latency or bandwidth? There are many considerations when picking the right MAC protocol, but now you have the basics to build from.



