---
title: Simulated Economy (1)
categories: [Simulated Economy]
img_path: /assets/img/posts/SimulatedEconomy/1
math: true
image: cover.png
pin: true
---

## Concept
### Motivation
Imagine an open world RPG where your actions affect the price of goods (and in turn other events: Burning a farm creates higher food prices, then people spend more on food, leaving less to spend on other goods, decreasing demand and making them cheaper. Hoarding swords makes them rare and so more expensive, which causes more people to take up smithing. Killing bandits on the road leads to more trade, allowing for new types of items to be crafted and prices to decrease as cheaper labor is more easily accessed). What would it take to have the actions of a player impact the cost of goods? You could take a very simple approach and define a rule like the cost of a good is inversely proportional to the amount of that good in circulation. But this will inevitable fail to capture the complex behavior we know economies to have. In order to create the desired emergent behavior, we must think at the level of the individual. By the end of this project we'll have markets that converge to optimal prices, multiple coupled markets, inflation, geographically distinct economies, and merchants connecting cities, all of which adapts to any potential change in the environment. This work is in part inspired by Simulating Supply and Demand and Emergent Economies for Role Playing Games, both great resources if you find the following interesting.

We want a complex economy to emerge from simple actions taken by individuals, so how do people make economic decisions? This is quite fun to think about, I suggest you consider your thought process next time you're deciding whether or not to buy something. Below is the motivating example for the beginning of our economic model.

> You're checking out a new super market in the neighborhood and see your favorite cereal, but then upon closer inspection you find that it costs \\$10. "This is madness!" you think. You know that just down the road your usual super market sells the same cereal for \\$5, so you don't buy the cereal. But the next day at your usual super market you find the price of the cereal is \\$10 here as well. "This is unfortunate, but it seems the price of cereal has gone up, darn." You still decide to buy the cereal since you really like it.

This story outlines for us a very simple decision making algorithm, it is in no way complete, but a good place to start. People seem to track two numbers when it comes to the price of a good: How much they personally value a good, and how much they expect that good to be in the market. In the above story, our individual personally valued the cereal at more then \\$10, which we know since they bought the cereal for \\$10. But this value alone is not enough to explain our story, if it were, then our individual would have immediately bought the cereal from the new market. Their expected market value of the cereal was much lower then the price they saw, so they knew they could buy it somewhere else for much cheaper, and that's why they didn't buy the first cereal. These two numbers are where we begin.

### Implementation
We will begin with a single market. Each actor will keep track of how much they personally value a good and how much they expect that good to cost. From here we can tell if they are a buyer or seller: A buyer is someone who personally values a good more then they expect it to cost (for example, if they value a good at \\$10 and expect it to cost \\$8, they will buy it), and a seller is someone who values a good less then what they expect it to cost.

This very first simulation will be as simple as possible, no money is given in a trade, no limited goods, no transaction costs, no diminishing returns, nothing except transaction offers. They will attempt to buy and sell and hopefully converge on an expected market price. But how does the expected market value change over time? In order to have a convergence of prices, we will have the buyer decrease their expected price after a transaction, and sellers increase their price. Essentially, the buyer is thinking "I bought this good for \\$10, next time I'll try and buy it for \\$9", while the seller thinks "I sold this for \\$10, next time I'll try and sell it for \\$11". The opposite happens on a failed transaction, the buyer thinking "I need to offer more next time if I want the good". Perhaps at some point the buyer even becomes a seller when the expected price overcomes their personal value.

The core of the code is shown below, but I will link the [full repository](https://github.com/JasonFantl/Simulated-Economy-Tutorial/tree/master/1) (with commented code if you want to see the finer details.)

```go
// how quickly we should update our beliefs about the market
beliefVolatility := 0.1

// find all buyers and sellers
sellers := make([]*Actor, 0)
buyers := make([]*Actor, 0)
for actor := range actors {
	if actor.expectedMarketValue < actor.personalValue {
		buyers = append(buyers, actor)
	} else {
		sellers = append(sellers, actor)
	}
}

// try to buy and sell
matchedCount := intMin(len(buyers), len(sellers))
for i := 0; i < matchedCount; i++ {

	// buyers and sellers are randomly matched up
	buyer := buyers[i]
	seller := sellers[i]

	// attempt to transact
	willingSellPrice := seller.expectedMarketValue
	willingBuyPrice := buyer.expectedMarketValue
	if willingBuyPrice >= willingSellPrice {
		// transaction made
		buyer.expectedMarketValue -= beliefVolatility
		seller.expectedMarketValue += beliefVolatility
	} else {
		// transaction failed, make a better offer next time
		buyer.expectedMarketValue += beliefVolatility
		seller.expectedMarketValue -= beliefVolatility
	}
}

// if you didn't get matched with anyone, offer a better deal next time
for i := matchedCount; i < len(buyers); i++ {
	buyers[i].expectedMarketValue += beliefVolatility
}
for i := matchedCount; i < len(sellers); i++ {
	sellers[i].expectedMarketValue -= beliefVolatility
}
```

With this very simple decision making process we can run our first simulation. We will have 200 actors in this market, each starting with a random personal value and expected value. Below is the graph of expected values (green and red for buyers and sellers respectively) and personal values (pink). I have modified random actors personal values at different points in time to see how it effects the market.

![Supply and demand](supply_demand.gif){: .center h="400" }

We see a quick convergence of expected values at around what looks like the average of the personal values. Actually, its converging to the median. Our market applies forces that try and balance the number of buyers and sellers, penalizing those who don't get matched up. Another perspective we can take is to consider the supply demand curves.

Instead of being given the supply and demand curves, we need to derive them. Given that we know peoples personal values, we can determine for some hypothetical price how many people will be buyers and how many sellers. Graphing for every price the number of buyers will give us a demand curve, and similarly with sellers the supply curve. By finding at what price the two curves are equal, we find the theoretical optimal price. Below is again 200 people interacting every frame, some personal values changed at points in time. We add in the theoretical price to the graph (blue), as well as the supply and demand curves. 

![Supply and demand](equilibrium.gif){: .center h="400" }

The basic principal works well! We haven't set a global price for a good, or set who should buy or sell, and yet we get a functioning economy that converges to the best possible market price and adapts to changes in actors values.

## Next 
Currently we rely on a round based approach, but economies don't function in these discrete type rounds, people buy and sell at random times. People also currently don't transact anything, neither goods nor money are being moved. Both these issues can be easily addressed, but the second will create a new and difficult problem: Scarcity.
