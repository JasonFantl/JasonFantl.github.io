---
title: Simulated Economy (4)
categories: [Simulated Economy]
img_path: https://684cd055bb4956d0e4cc98c5--bloag-assets.netlify.app/gifs/SimulatedEconomy/4
math: true
image: cover.png
---

## Inflation
Everyone seems to know that when the government prints too much money it causes inflation, but why? If everyone suddenly doubled their money, they would be willing to buy more, increasing demand, and decreasing prices, which is inflation. Another way of looking at this is that money becomes less useful as you have more of it.

The phrase "money becomes less useful" makes no sense in the current simulation, usefulness and money are equal. We need to separate them and create two distinct concepts for the value of a good and the price of a good. Value is some nebulous measurement that we use to roughly mean usefulness/utility/how much we want it, whereas price is the number of dollars you assign to a good. We need to be careful not to confuse value with price. Lets see and example of how having more money changes your price for an item.

Imagine someone very rich, they value money very little because they have so much of it. Lets say they value \\$1 at 0.2 "utility" (lets give utility a label, say ₴, so ₴0.2), and they value wood at ₴3. They wouldn't sell a piece of wood for less then ₴3*(\\$1/₴0.2)=$15. But they are also willing to buy at that price. This means rich people will buy lots of everything until each good has little value to them, or their money becomes more valuable.

We need to determine a utility graph for the value of money. Lets have a graph which goes to zero as the amount of money increases, and becomes very large as the amount of money gets near zero. This is not the best solution since in reality money is only valuable in so far as you can spend it. This means if you're very poor, you wouldn't hoard money and sell all your belongings (which our actors will do since money would be more valuable then the items). So lets cap the value of money at some "reasonable" value, say ₴1000. We want a function such that when someone has no money they will value a dollar at ₴1000, and as they gain more money its value goes to zero. We will use 1000/(x+1).

At the bottom the code snippet is the implementation of the separation of price and value, and at the top an example of how it changes some of the logic. The full repository can be found [here](https://github.com/JasonFantl/Simulated-Economy-Tutorial/tree/master/4).

```go
func (actor Actor) isSeller(good Good) bool {
	return actor.priceToValue(actor.markets[good].expectedMarketPrice) > actor.currentPersonalValue(good)
}

func (actor Actor) isBuyer(good Good) bool {
	return actor.priceToValue(actor.markets[good].expectedMarketPrice) < actor.potentialPersonalValue(good)
}

func (actor *Actor) priceToValue(price float64) float64 {
	return price * actor.utilityPerDollar()
}

func (actor *Actor) valueToPrice(value float64) float64 {
	return value / actor.utilityPerDollar()
}

func (actor *Actor) utilityPerDollar() float64 {
	// utility per dollar has diminishing returns
	return 1000.0 / (actor.money + 1.0)
}
```

Now let's watch the price of goods change as we give and take money from everyone. At iteration 200 we give everyone \\$1000, and at iteration 400 we take away \\$1000. After iteration 600 everyone gets \\$10 every iteration. Note that the "Personal Price" is calculated by applying the above conversion from value to price on the actors personal value of each good.

![Graph the effects of inflation](inflation.gif){: .center w="700" h="500" }

We see that introducing more money increases the prices of goods, and similarly decreasing the money supply decreases prices. Unlike the effects we saw from adding or removing goods from the market, inflation causes no rebound or restoring force, it all moves together. When we affected the number of goods in the market, it always returned to same baseline price, but here we don't see that, which is exactly what we would expect to see!

## [Next]({% post_url 2023-04-07-Simulated-Economy-(5) %})
Our current markets are directly connected to each other, but wouldn't it be interesting if you had geographically separated cities with their own economies? Perhaps one town has an abundance of forest and wood, so wood is cheap there, but over hill and dale is a town with no wood at all. It would be worth a merchants time to simply transport wood from one town to the next, connecting the two economies.