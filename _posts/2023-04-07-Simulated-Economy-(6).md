---
title: Simulated Economy (6)
categories: [Simulated Economy]
img_path: https:///bloag-assets.netlify.app/gifs/SimulatedEconomy/6
math: true
image: cover.png
---

## More goods, more cities
Lets have four different markets in four different cities. We now have wood, chairs, thread, and beds. Wood can be used to build chairs, and wood and thread can be used to make beds. Although very simple, all the markets should interact with each other. The most indirect connection is between thread and chairs. Thread is used to make beds, which also requires wood to build, and wood is used to make chairs. So lets see if the market of thread can actually influence the market of chairs.

We look at just the city of Riverwood. At iteration 500 everyone will gain an over-abundance of thread, quickly causing thread to be worth nothing. How will this affect other markets?

![Graph the connected markets](single.gif){: .center w="800" }

We see the economy stabilize after around iteration 150, each price staying constant until we interrupt the market. As we expected, when everyone gains lots of thread, it loses value. Excitingly, we also see the price of every other good change due to the event. Even the market of chairs, the most distantly connected market, was affected (even if only temporarily).

Lets add more cities. The four cities will be Riverwood, Seaside, Winterhold, and Portsville. Each city will specialize in something: Riverwood can make wood more easily, Seaside can make chairs with less wood, Winterhold can make beds with less wood and thread, and Portsville can make thread more easily. 

Lets look at the four cities and markets without any merchants connecting them.

![Graph the connected markets with merchants](no_merchants.gif){: .center w="800" }

If we look at each city we see the effects of their specialization. Riverwood has cheaper wood, which also leads to cheaper chairs and slightly cheaper beds. Seaside has cheaper chairs even though wood is expensive. Portsville has cheaper thread, which makes cheaper beds. Winterhold has cheaper beds even though both wood and thread are expensive. But as we saw before, each market affects every other market, so we need to be careful when attempting to attribute cause for prices.

Now we add merchants between cities. Initially the cost of moving between cities is too high for merchants to do anything, but at iteration 500 we set the moving cost between all cities at \\$1. We also add a tax on merchants since they hoard the money they make, causing inflation over time. Every few iterations merchants will be taxed %10 of the money they have over \\$1000, which is then evenly distributed evenly amongst all the locals. Lets also track what merchants are trading in, as well as the distribution of wealth compared to an individuals value of leisure (the idea being that perhaps the rich are rich since they don't value leisure as much).

![Track who gets rich](wealth_dist.gif){: .center w="800" }

At iteration 500 we see the merchants equally split as chair and bed merchants. As the iterations pass on, all merchants seem to slowly switch back and forth between trading chairs or trading beds. As merchants all begin to trade beds, the difference in chair prices grow, and the bed prices start to equalize, until eventually all the merchants slowly switch back to trade chairs. The process then repeats.

We also see a distribution of wealth, those who value leisure more have less money, and those who value leisure less have more money. This makes sense since the leisure lovers will spend more time on leisure rather then gaining wealth. We also see some cities are more wealthy then others. Lets take a closer look at the distribution of wealth.

![Track who gets rich](wealth.gif){: .center w="600" }

We see Winterhold has the most wealth, with Portsville just behind. Riverwood and Seaside are the poorest cities. Why are some cities wealthier then others in this simulation? In this case it's because Winterhold and Portsville make the high cost goods which merchants like to trade (probably because the high priced goods can have a large price difference between cities, while low priced goods can have an at most few dollar difference). Initially each city has the same amount of money, but as merchants buy beds from Winterhold and sell them in other cities, money flows from the other cities into Winterhold, making it more wealthy.

### Technological development over time
Lets watch how "technological" developments affect economies over time. Initially every city will be identical and unconnected, then each city will specialize in production of some good, and then trade routes will be established between cities. Afterward we can have a few disasters take place.

At iteration 500, every city will develop a different technology to more easily develop goods. As before, Riverwood will specialize in wood production, Seaside in chairs, Portsville in thread, and Winterhold in beds. Then, at iteration 2000 we enable cheap transport between Riverwood and Seaside, and also between Portsville and Winterhold. At iteration 2500 we enable cheap transport between Riverwood and Portsville, and also between Seaside and Winterhold. This creates a ring connecting the cities. 

At iteration 3000 disaster strikes! Riverwood is burned to the ground. And then another disaster, at iteration 4000 a great war breaks out and all knowledge of technological advances are destroyed and forgot.

{% include embed/youtube.html id='HMjeSG6rZjA' %}

We see the rise and fall of these cities. From nothing, to specializing in different goods, to an interconnected world economy, and then back to nothing. 

## Thanks for reading
There is a lot that could be added: job skills, time delays in traveling, more predictive agents (could this recreate the bullwhip effect in markets?), loans, inheritance, unique goods (not all chairs are the same), ownership over means of production, governments (taxes, minimum wages, public works, minimum/maximum price setting, etc.), dynamic base values (the more hungry someone is, the more they value food), negative prices for goods (trash), and much more that you may think up.

If you want to play with any of code at any step along the way, the code for every blog post can be found [here](https://github.com/JasonFantl/Simulated-Economy-Tutorial/tree/master). 

This is a long way from being playable as any type of game, but hopefully it can act as an inspiration or starting point. The code itself isn't complex, and can be easily recreated in any context as long as you understand the underlying concepts, all of which are shared here in this blog. 

Please share if you create anything similar, I would love to see what people can create! Thanks for reading.

## [Next]({% post_url 2023-04-30-Simulated-Economy-(7) %})

I have some fun additions that aren't core to the ideas demonstrated here, but may be of interest to others. This includes creating networked economies, so economies can reside on many CPUs and computers, where merchants travel over shared memory and the Internet. I also play with connecting the economy to other complex systems by simulating population dynamics, where population counts impact the price of goods in the market (Foxes eat rabbits, the number of rabbits impacts the supply of furs).