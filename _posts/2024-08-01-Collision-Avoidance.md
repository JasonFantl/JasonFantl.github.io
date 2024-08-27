---
title: Collision Avoidance
categories: []
img_path: /assets/img/posts/CollisionAvoidance
image: cover.png
math: true
---

When you're walking through a large crowd, how do you avoid colliding with everyone else? You arne't communicating with each other, and you aren't being directed by a central director, so how does the large crowd coordinate? Everyone is reacting independently using only their visual senses to estimate the velocity and size of everyone else, using that information to plan out a path to some goal.

Let's find an algorithm so we can let robots navigate crowds as well!

Some assumptions we will make to simplify the experiments: 
* Robots are circles.
* Robots can read other robots positions, sizes, and velocities.
* Robots have a max speed.
* Velocities have some noise (this doesn't necessarily simplify the experiments, but it does remove unstable equilibriums that can occur in simulations).

## Avoid Nearest Neighbor

The most basic algorithm we can implement is 'Avoid Nearest Neighbor'. Here's how we could implement it: Travel towards our goal, but if we get too close to another robot, push away.

We calculate two vectors: The goal vector which points at the goal at max speed, and the evasion vector which points away from the nearest robot. The magnitude of the evasion vector is determined by our distance to the other robot. We want to ensure we never collide, so the magnitude should approach infinity as we approach a collision. A good equation to satisfy these requirements is below, where $p_i$ is the position of the $i$th robot, and $r_i$ is its radius.

$$
\text{evasion vector magnitude} = \frac{1}{\left\lVert  p_{\text{self}} - p_{\text{closest}} \right\rVert - ( r_{\text{self}} + r_{\text{closest}})}
$$

Which means when the two robots are far apart, the magnitude is nearly zero, and when they approach touching, the magnitude approaches infinity.

Now we just add the two vectors together, limit the new vectors magnitude to the robots max velocity, and we have a collision avoidant robot. The scale of each vector can be controlled by a coefficient, and the ratio between these coefficient we will call the `evasion strength`. When `evasion strength` is high, it means the evasion vector is weighted much more strongly then the goal vector.

Here is a robot trying to reach a goal with an obstacle in the way. The first is at a low `evasion strength` and the second is at a high `evasion strength`.

<div class="row align-items-center">
<div class="col-md-6" markdown="1">
![collision avoidance between a robot and obstacle, at a low evasion strength](obstacle-avoid_closest-10_evade.gif){: .center w="300" }
 </div>
<div class="col-md-6" markdown="1">
![collision avoidance between a robot and obstacle, at a high evasion strength](obstacle-avoid_closest-50_evade.gif){: .center w="300" }
</div>
</div>

Note that a higher evasion strength means we are safer, but take longer to reach our goal. 

To test this algorithm in crowd-like settings, let's put 50 robots in a circle and have each one try to get to the opposite side.

![robots in a circle trying to get to the other side, but failing since robots get too close to our goal](50_circle-avoid_closest-30_evasion-fail.gif){: .center w="300" }

It's not bad, but we see an issue where some robots get nearly to their goal, but get repelled by other robots sitting too close by. We can fix this be using a dynamic `evasion strength` value. As we get closer to our goal we decrease the `evasion strength`, until near our goal we arne't evading at all.

![robots in a circle trying to get to the other side, but failing since robots get too close to our goal](50_circle-avoid_closest-30_evasion.gif){: .center w="300" }

That looks pretty good! But we can still do better.

## Velocity Obstacle

We can calculate the valid velocities that ensure a collision won't occur between any robots, even while they're moving. This is known as a [Velocity Object](https://en.wikipedia.org/wiki/Velocity_obstacle) (VO). VO has been used in maritime calculations since at least 1903 with a neat looking [Battenberg's Course Indicator](https://www.si.edu/object/battenbergs-course-indicator:nmah_1087634) on a [Maneuvering Board](https://cdn.fs.teachablecdn.com/1k2BDPlQ3KyPY9XPPRDZ). Here's how it works.

The most simple case is where we are a point trying to calculate all invalid velocities that would cause a collision with a static circle. That's not too hard, it's just the cone originating at us and envelopes the circle. Clearly if we set our velocity anywhere in the cone, we will collide with the circle.

[] image of point and cone to circle, with a vector in the circle and one out

If we arne't a point, but a circle instead, we need to add an extra step. Notice for any two circles that are just touching, if we shrink the radius of one and increase the radius of the other in equal parts, the circles will still be touching. This means for the cone calculation we can shrink our robot down to a point as long as we increase the radius of the other robots by the same amount and then we can calculate the cone of invalid velocities exactly as we did in the more basic case (for more general shapes, look into the [Minkowski Sum](https://en.wikipedia.org/wiki/Minkowski_addition)).

[right] image of point and two layers of circles with a cone

And finally, what if the other circle is moving at a constant velocity? Notice if we were also traveling at the same velocity, from our new frame of reference it looks as if the other robot is standing still. We can calculate the cone again, but then we need to make sure the final cone is added to that initial velocity we added at the begging of the calculation. 

[right] image of point and two layers of circles with a cone shifted by the velocity

That is the core of VO and all of its variants. We can now apply VO to all the robots around us and find which velocities are valid.

[right] image of circles and all the VO cones

But that still leaves us the decision for which velocity to actually pick. One solution is to pick the velocity closest to the preferred velocity (the one pointing directly at the goal at max speed) that's not restricted by VO. This has the downside that sometimes there are so many robots around us that no velocities are valid. So instead, we will sample many different potential velocities and score each sample velocity based on how well it points at the goal and how well it avoids collisions.  

### Sampling Velocities

First we need a way to generate all the sample velocities. We want a sampling of velocities within our max speed and preferably uniformly distributed. The first and easiest way to generate the points would be use two for loops that iterate over angles and radiuses. But [here's a better solution](https://www.youtube.com/watch?v=sj8Sg8qnjOg), using the most irrational number (the golden ratio) to uniformly generate points on a disk. You can see how much better it is compared to the naive sampling below, both using the same number of sample points.

<div class="row align-items-center">
<div class="col-md-6" markdown="1">
![naive sampling](naive_sampling.png){: .center w="200" h="200" }
</div>
<div class="col-md-6" markdown="1">
![golden ratio sampling](golden_sampling.png){: .center w="200" h="200" }
</div>
</div>

And now we need to score each of these potential velocities. We pick the velocity with the least penalty, where the penalty is below. The $v_{\text{preferred}}$ is the vector pointing towards the goal at max speed, $v_{\text{sample}}$ is the velocity we are sampling, and $t_{\text{collision}}$ is the time to the nearest collision for this sample velocity (scored as $\infty$ for no collision).

$$
v_{\text{sample}} \ \text{ penalty} = \left\lVert  v_{\text{preferred}} - v_{\text{sample}} \right\rVert + \frac{\text{evasion strength}}{t_{\text{collision}}}
$$

This has many desirable properties: the penalty approaches infinity as a robot approaches a collision, it scores the preferred velocity with the lowest penalty in the absence of obstacles, and we can use our previous `evasion score` in a similar way to control how aggressive each robot is.

And with all that, we can run some simulations and see what happens!

### Simulations

Again let's see what effect the `evasion strength` has on a robot getting around an obstacle. First is the low `evasion strength` followed by a higher value. Let's also look at what the sampled velocities scores look like.

<div class="row align-items-center">
<div class="col-md-6" markdown="1">
![collision avoidance between a robot and obstacle, at a low evasion strength](obstacle-VO-6_evade.gif){: .center w="300" }
 </div>
<div class="col-md-6" markdown="1">
![collision avoidance between a robot and obstacle, at a high evasion strength](obstacle-VO-50_evade.gif){: .center w="300" }
</div>
</div>

And how about two robots trying to pass each other? We should expect the VOs to be offset by the other robots velocity.

![collision avoidance between two robots passing each other](passing-VO-50_evasion.gif){: .center w="300" }

And lets go to the crowded circle again! The sampled points will clutter the screen, so let's remove those.

![collision avoidance between a circle of robots using VO](50_circle-VO-50_evasion.gif){: .center w="300" }

This looks much nicer then the previous collision avoidance algorithm. There is one modification I haven't mentioned yet that allows VO to work as smoothly as it has. VO has a well-known oscillation issue that arises from two robots constantly flip-flopping their velocities. Here's how it arises: Look to the two robots heading directly towards one-another in the figure below, they must choose a velocity outside of the VO, which means both are no longer pointed at one-another, meaning they can each go back to their preferred velocity, only to repeat the process.

![oscillation from VO](oscillation_fig.png){: .center w="600" }

This figure is from the paper that solved this issue, where a modification of VO was proposed called Reciprocal Velocity Obstacles (RVO), and who's details can be found [here](https://ieeexplore.ieee.org/document/4543489). But we actually take a different approach.

We smooth the robots actual velocity so it can't make discontinuous jumps. The robot has a target velocity and a real velocity, where the real velocity must smoothly follow the target velocity. This means both robots will smoothly come to a stable set of velocities just with VO. 

<details markdown=1><summary markdown="span">
To see how the smoothing is implemented and some potential alternatives.
  </summary>

We can firstly simplify the problem into a one-dimension problem since we can smooth the components of our velocity vector independently.

A common smoothing algorithm for a live data-stream is a Simple Moving Average, which takes the average of the last $k$ data points. This is pretty nice, but it's not as smooth as we might like and requires storing $k$ data points.

[] gif of SMA with a bar graph in the corner of the weights 

We could instead take a weighted average of the last $k$ points, where we assign small weights to the most recent and oldest points, and weight most heavily the middle of the $k$ points. This would give us a much smoother signal, and we can even control how quickly it smooths. This is an example of a convolution, which is a very powerful tool capable of much more then just smoothing.

[] gif of convolution with a bar graph in the corner of the weights 

But these methods require storing $k$ points, I want to do it with even fewer.

If we use [Exponential Smoothing](https://en.wikipedia.org/wiki/Exponential_smoothing) then we only have to store the previous result. For an $\alpha$ value we can control how quickly it reacts to a change in signal. This has the issue that it isn't very smooth at the discontinuous change.

[] gif of ES

My favorite implementation is the [critically damped oscillator](https://en.wikipedia.org/wiki/Damping). It requires storing two values, the previous result and its velocity. We imagine the input signal is the source of a spring and our current value is a block attached to the other end of the spring. By dampening the spring we can remove oscillations, and by critically dampening the spring we can reach the target signal as quickly as possible. The spring constant is a parameter we have control over to choose how quickly we react to changes in signal.

[] gif of damped

</details>

And now we can run lots of experiments and see what happens.

<div class="row align-items-center">
<div class="col-md-3" markdown="1">
![10 robots in a circle using VO](10_circle-VO-50_evasion.gif){: .center w="300" }
 </div>
<div class="col-md-3" markdown="1">
![collision avoidance ](2_perpendicular-VO-50_evasion.gif){: .center w="300" }
</div>
<div class="col-md-3" markdown="1">
![collision avoidance between two parallel lines](18_parallel-VO-50_evasion.gif){: .center w="300" }
</div>
<div class="col-md-3" markdown="1">
![collision avoidance between two co-linear lines](12_opposite-VO-50_evasion.gif){: .center w="300" }
</div>
</div>

And we can compare to the initial algorithm that just avoided the nearest neighbor.

<div class="row align-items-center">
<div class="col-md-3" markdown="1">
![collision avoidance in a circle using nearest neighbor](10_circle-NN-35_evasion.gif){: .center w="300" }
</div>
<div class="col-md-3" markdown="1">
![collision avoidance between two robots](2_perpendicular-NN-35_evasion.gif){: .center w="300" }
</div>
<div class="col-md-3" markdown="1">
![collision avoidance between two parallel lines](18_parallel-NN-30_evasion.gif){: .center w="300" }
</div>
<div class="col-md-3" markdown="1">
![collision avoidance between two co-linear lines](12_opposite-NN-35_evasion.gif){: .center w="300" }
</div>
</div>

These experiments did reveal to me that there is no set of parameters that works perfectly well for all simulations. Some of them were smoother if the evasion strength was larger or smaller, or the smoothing of the velocity was too high (collisions occur) or too low (re-introduced oscillations), or the evasion strength was too high (robots were too close to each other and no one could reach their goal) or too low (robots got too close and collided due to the noise added to the velocity).

To see this, why don't we compare the times it takes to complete different sets of simulations with different parameters.

** Under construction

All code for these simulation can be found at ...

### Limits

This is a collision avoidance algorithm only for local collisions, it needs to be directed by a higher-order system like a path-finding algorithm to determine what the desired velocity is. VO on its own just points at the goal, which would fail for example in a maze.

VO doesn't handle deadlocks with other robots. You can imagine two robots meeting in a hallway which is too small for either to pass. This is being worked on right now with papers like (Adaptive Optimal Collision Avoidance driven by Opinion)[https://www.semanticscholar.org/reader/b693e30610ed2b4e39a9016b10d05dcdcc09d084] (AVOCADO).

## Future Ideas

Working more on an adaptive `evasion strength` could allow for robot swarms to collectively complete a task faster. If for example the `evasion strength` is inversely proportional to your distance to your goal (the opposite of what we have been doing, but this is at a larger scale), then robots who need to get to a farther goal will be given right of way. This hopefully would have the overall effect of speeding up the entire robot swarm.

Similarly, you may want an adaptive `evasion strength` that depends on how long you've been deadlocked for. A small `evasion strength` is less safe, but may be necessary in cases like getting through tight spaces. A good heuristic may be that the longer you are stuck for, the more aggressive you should try to be.

A much more complicated alternative to VO would be to generate a 3D spacetime representation of the available space, and path-find (restricting the path to travel at the robots max speed along the time dimension). This would solve the collisions, high-level path-finding, and deadlocks. Although it may introduce oscillation issues like seen in the original VO.

An interesting problem would be to avoid collisions while also maintaining a cluster of robots. There could be a restraint where a group of robots needs to stay together while avoiding collisions on the way to their destination (like a a family in a crowd).

## Further Reading

Velocity Obstacle Approaches for Multi-Agent Collision Avoidance (James A. Douthwaite, Shiyu Zhao, Lyudmila S. Mihaylova)

Reciprocal Velocity Obstacles for Real-Time Multi-Agent Navigation (Jur van den Berg, Ming Lin, Dinesh Manocha)

Reciprocal n-Body Collision Avoidance (Jur van den Berg, Stephen J. Guy, Ming Lin, Dinesh Manocha)

A Real-time Fuzzy Interacting Multiple-Model Velocity Obstacle
Avoidance Approach for Unmanned Aerial Vehicles (Fethi Candan, Aykut Beke, Mahdi Mahfouf, Lyudmila Mihaylova)

Distributed Multi-agent Navigation Based on Reciprocal Collision
Avoidance and Locally Confined Multi-agent Path Finding (Stepan Dergachev, Konstantin Yakovlev)

AVOCADO: Adaptive Optimal Collision Avoidance driven by Opinion (Diego Martínez-Baselga, Eduardo Sebastián*, Eduardo Montijano, Luis Riazuelo, Carlos Sagüés, Luis Montano)
