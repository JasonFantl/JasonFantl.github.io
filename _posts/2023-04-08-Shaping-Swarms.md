---
title: Shaping Swarms in Simulation
categories: [Swarm Intelligence]
img_path: https:///684cd055bb4956d0e4cc98c5--bloag-assets.netlify.app/gifs/ShapingSwarms
math: true
image: murmuration.gif
---

## Introduction
Swarms with a large number of agents are beautiful to behold. For example, birds fly in flocks, and specifically, Starlings sometimes fly together in groups of thousands (it has a special name, murmuration).

![murmuration](murmuration.gif){: .center w="400" }

How can we recreate this beautiful and fascinating swarming behavior in simulation? It turns out to be surprisingly easy. In 1986 Craig Reynolds created 3 simple rules from which the emergent swarm behavior can arise. The general name we will use for these entities flying around (they might be birds, insects, cells, etc) is boids. The rules are as follows:
1. Cohesion: Move towards the center of mass of nearby boids.
2. Separation: Move away from boids that are too close.
3. Alignment: Try to move in the same direction as nearby boids.
With this alone, we get behavior similar to that of the birds above. You can add more rules (target following, perching, leadership election, and following) and more realistic assumptions (limited range of view for distance and angle of perception). By searching online you can find an endless number of simulations of these boids, along with their different rule variations. Because of the many implementations already out there, let's instead play with a slightly different idea: forming shapes out of boids.

## Rules
We want boids to equally distribute themselves along the surface of a desired shape, and to adapt to a loss or gain in boids. In order to do this we will need two rules.
Goal pursuit: Each boid will pursue the nearest point on the surface, this is what will cause the boids to form the shape as a whole.
Separation: Just as with Craig Reynolad's boids, each boid will push away from its neighbors. This will cause the boids to naturally distribute themselves within the space while adapting to changes in swarm size.

### Goal pursuit
Let's begin simply, a single boid pursuing the center of the screen. It will generate a force proportional to its distance from the target (the farther it is, the more quickly it accelerates towards the goal. The closer it is, the less it needs to accelerate). Let's see what happens to a boid with no initial velocity.

![single boid](single_simple.gif){: .center w="600" }

It just oscillates around the target, which is not what we want. In real life, you would want to use a control system like PID, but for our purposes, we just need to add drag.

Drag will be a second force being applied to the boid. It will act proportionally in the opposite direction of the boid's velocity (the faster you go, the more strongly drag will push you back). With that we get

![single boid damped](single_damped.gif){: .center w="600" }

If you write the equation for the governing forces on this boid, it turns out to be the equation of a damped oscillator. And this equation applies in higher dimensions, let's see the boid following a moving target.

![single boid following mouse](single_follow.gif){: .center w="400" }

And now we can add many more boids along with a separation rule.

### Separation
Each boid will consider the other boids closest to itself (within a radius) and add a repulsive force inversely proportional to its distance (closer means stronger repulsion, farther is weaker). Let's have lots of boids separate from each other, no target.

![boids separating](seperation.gif){: .center w="400" }

And now let's give them a shape to take.

## Shaping
A simple but interesting shape is the annulus (a donut). Boids will move towards a certain radius from the center, not too close and not too far. We have many variables to play with here: the goal-searching strength, the separation strength, and the drag strength. I will use whatever set of variables looks nice when running the simulation. In order to test the resiliency of the boids, I will introduce disturbances while they attempt to take shape.

![boids shaping a ring](ring.gif){: .center w="400" }

They quickly form the desired shape and heal from disturbances. Now let's add a unique feature to the shape so it's not symmetrical everywhere.

![boids shaping a shape](shape.gif){: .center w="400" }

And it works! But what if we made it more difficult for the boids?

### Voting on location and rotation
What if the boids don't know the location or rotation of the shape, then how would they know where to move to? They would first all have to agree on where the shape is through some voting mechanism. We will limit a boid to communication only with the boids nearest to them, and to only be capable of sending out a message every few seconds.

But first, what does it look like without voting? Everyone has a random initial belief about the location and rotation of the shape, so they essentially just move to a random point on the screen.

![boids randomly targeting](random.gif){: .center w="400" }

Nothing too exciting (except that they all accelerate and decelerate at the same time, look deeper into damped oscillators to find out why). What they need is a voting mechanism.

Every second or so a boid will send out its believed coordinates to its nearest neighbors. The neighbors will then take a weighted average of that value with their current belief (rotation is in modulo space, so we will average in the closest direction), and continue the process. Let's color code the boids based on their belief of the rotation so we can gain some insight into what the swarm is thinking.

![boids voting and shaping](agreeing.gif){: .center w="400" }

We see some outliers, but they're too far to communicate with, so there's no way of getting them to join the larger swarm. We also see each boid starts with a different belief (color), but they eventually all agree and can make the desired shape (and notice it has a different rotation from the original). But this one demonstration is deceiving. If you run the simulation again, there's a chance the boids never agree. Watch.

![boids voting and failing](disagreeing.gif){: .center w="400" }

While the gradient of colors is pretty, it is also problematic. Essentially each color is attempting to spread through the swarm, but due to the circular nature of both the boids and the value being voted on, everyone is stuck in a stalemate (who knew Escher's staircase had real implications?). 

One neat solution (although it could be argued ignores the root issue) is to fill in the shape rather than outline it. If the shape is filled in, then the center has to be some color, which then can spread and take over the rest of the swarm.

![boids voting and shaping filled shape](solved.gif){: .center w="400" }

And now we have a self-healing and self-organizing swarm that can form a global shape using only local information and communication.
