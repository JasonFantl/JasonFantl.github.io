---
title: Simulated Economy (5)
categories: [Simulated Economy]
img_path: https:///bloag-assets.netlify.app/gifs/SimulatedEconomy/5
math: true
image: cover.png
---

## Geographic separation
What we want is the separation of economies which are in separate cities. In a forested city we would expect the price of wood to be lower then in other cities. In a city which has a love of dinner parties that require many chairs in every house, we would expect the price of chairs to be higher. This is what we expect, but how do we implement it?

We start by creating two totally separate economies. By the forest we'll have the city of Riverwood, and far away on the coast is Seaside. Riverwood has more forests, so the people there can get 2 wood for the same amount of work that the Seaside people expend for a single piece. That will be the only difference for now.

There is a lot happening, so in order to make sure we don't miss anything lets graph everything. Below are the price graphs for each good in each each location. There is also a "Good V Money" plot for each good, which lets us keep track of the wealth distribution and concentration.

![Graph the locations](large.gif){: .center w="1000" }

We see Riverwood has cheaper wood and chairs, and Riverwood citizens have more of each good. But now lets have Seaside specialize in chair making, which means they can build a chair with 2 wood rather then 4.

![Graph the locations](large2.gif){: .center w="1000" }

And now we see Seaside has just as many chairs as Riverwood, and even at the same price. But Riverwood has cheaper wood, and more of it. This makes sense since Seaside doesn't have as much use for wood, so they demand and produce less of it.

The graphs are getting a bit crowded, so lets simplify be replacing the Personal and Expected prices with "the Expected price" (if things ever start acting weird we can pop open the hood again and see whats happening). Lets have green represent Riverwood and blue represent Seaside. The thickness of the line will tell us its uncertainty (shows the min and max of all actors).

![Graph the locations](small.gif){: .center w="800" }

### Connecting Economies
Lets imagine a small shipping company connects the cities and uses arbitrage to profit. They will offer to buy and sell goods at a competitive price by transporting goods in a city where it's cheap to a city where it's more expensive.

We won't change the functionality of the actors, simply add a new type of actor in the market, the merchant. But how else could we connect economies?

We will have merchants with the sole purpose of tracking the expected prices in each city so they can buy in bulk from one city and sell to another city. Buyers and sellers would indirectly be sending market signals through the merchant. This is easier to implement since only one or two special actors need to consider the complexity introduced by different prices in each city and the asymmetry of the transaction. 

Another idea is to have all the buyers and sellers in the world talk to each other (Craigslist through letters?), then for a small cost a good can be shipped from seller to buyer. In this case the buyers and sellers would be in direct contact, factoring in the price of shipping when setting the sell price. This would complicate the decision making process for actors since now they need to track separate selling and buying prices due to the asymmetry of the sale. Some of the cost in a transaction goes to a third party (the shipper), so the buyer pays more then the seller receives.

You could have actors simply move between cities without tracking the expected values in each city. Market signals between cities would be unbelievably slow, but they would still be connected.

## Separating Functionality
We are going to have different types of actors now interacting in the market (locals and merchants), this complicates the code a bit. In order to resolve this we use interfaces, which will allow different types of structs to interact through common methods. Below are the methods necessary for an actor to interact in the market, as well as an implementation for the locals.

```go
type EconomicActor interface {
	isSelling(Good) (bool, float64)
	transact(Good, bool, float64)
	gossip(Good) float64
}

func (local *Local) isSelling(good Good) (bool, float64) {
	if !local.isSeller(good) || local.markets[good].ownedGoods <= 0 {
		return false, 0
	}
	return true, local.markets[good].expectedMarketPrice
}

func (local *Local) transact(good Good, buying bool, price float64) {
	local.markets[good].timeSinceLastTransaction = 0
	if buying {
		local.money -= price
		local.markets[good].ownedGoods++
		local.markets[good].expectedMarketPrice -= local.markets[good].beliefVolatility
	} else {
		local.money += price
		local.markets[good].ownedGoods--
		local.markets[good].expectedMarketPrice += local.markets[good].beliefVolatility
	}
}

func (local *Local) gossip(good Good) float64 {
	return local.markets[good].expectedMarketPrice
}
```

And the logic for the merchants is only to maximize profit, they don't consider personal value or diminishing returns. They will buy a good if they believe a profit can be made by selling it somewhere else, factoring in the price of traveling from the current city to the city where the good will be sold. They sell a good only if they are in the city where the largest profit can be made by selling that good (again factoring in the cost of traveling).

Merchants will focus on a single type of good, so there will be wood merchants and chair merchants. They randomly move from one city to the other, except when they hit their carrying capacity. Merchants can carry up to 20 goods, and when they get 20 goods they will move to the city in which they can sell it for the highest price.

Lets watch the interaction of the economies as we change the cost of moving between cities. Merchants will be shown as yellow for Riverwood and red for Seaside. To begin the cost to move between cities is \\$100, so the merchants are essentially useless and the economies stay separate. At iteration 500 the cost to move from Riverwood to Seaside is set to 0, so merchants can buy in Riverwood and sell in Seaside at no cost. Finally, at iteration 1000 the cost of moving from Seaside to Riverwood is also set to 0.

![The effects of traders](with_traders.gif){: .center w="800" }

Iteration 0 through 500 matches what we saw before. Riverwood has wood at half the price of Seaside since they can produce it twice as easily. The cost of chairs is about the same for both since Seaside can build chairs with half the materials, which compensates for the high price of wood.

Just after iteration 500 we see the price of wood equalize in both economies, which makes sense since the wood merchants can suddenly travel from Riverwood to Seasise at no cost. The wood merchants buy lots of cheap wood in Riverwood and sell it all in Seaside, increasing demand in Riverwood and increasing supply in Seaside, repeating until the prices equalize. The cost of chairs decreases in Seaside and increases in Riverwood because the price of wood decreased in Seaside and increased in Riverwood. 

After iteration 1000 the chair merchants begin trading, and the prices of both wood and chairs suddenly seem less certain. Sometimes the price of wood in each economy is equal, sometimes not. The price of chairs looks to start equalizing, but then just wonders. Running more experiments we discover that which ever good has more merchants will determine the good that equalizes.

If we have an army of wood merchants and only a few chair merchants, then the wood prices will be aggressively equal between cities, and the force equalizing chairs will be small and overpowered. What we need are merchants which change what good they are trading depending on whatever is most profitable. But not all at once, it would destabilize the market if every merchant traded in the same type of good. Instead, merchants will consider switching professions only once they sell all the goods they currently own.

![The effects of traders](with_traders2.gif){: .center w="800" }

And we get exactly what we would expect! When transportation costs from Riverwood to Seaside drop, all the merchants become wood merchants, and when transportation between both cities costs nothing, merchants alternate between trading wood and chair. It might look like after iteration 1000 that chairs are equal between cities but wood isn't, but keep in mind the scale of the Y axis for each good.

The full repository can be found [here](https://github.com/JasonFantl/Simulated-Economy-Tutorial/tree/master/5).

## [Next]({% post_url 2023-04-07-Simulated-Economy-(6) %})
We have a lot of functionality, lets try and have multiple goods interacting and multiple cities. We can play with lots of knobs: the desirability of goods, the cost of materials to build a new good, the transportation cost between cities, and other random events that can do things like destroy or create goods.