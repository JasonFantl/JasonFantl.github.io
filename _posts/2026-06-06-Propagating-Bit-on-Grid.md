---
title: Bit propagation over a noisy grid
categories: []
img_path: https:///blog-assets.jasonemerald.workers.dev/PropogatingBit
image: cover.png
math: true
---

Below is an open problem, an approachable problem, one perhaps you will be the one to solve!

We send a bit over a noisy grid, starting from the origin and propagating out as a wave. Can we recover the original bit when looking at just the wavefront?

This is easy to solve for 1D, mostly solved in 2D, and still open in 3D and above.

Here is [the lecture](https://www.youtube.com/watch?v=P7-Xtkra2s4) that introduced the problem to me, as well as [the paper](https://people.lids.mit.edu/yp/homepage/data/2020_2dgrid.pdf) proving that no single function works in 2D.

## The problem

### 1D

We start with a bit at the root node, in this case the bit is a 1. That node then sends the bit to the next node, indicated with an arrow. This repeats forever. There is a small probability, which we call the temperature, that the bit will flip during each transmission.

<div style="text-align: center;">
  <video controls autoplay muted loop playsinline width="75%">
    <source src="https:///blog-assets.jasonemerald.workers.dev/PropogatingBit/1d-chain.webm" type="video/webm">
  </video>
</div>

The question is, can you determine the original bit by only looking at the last bit in a long chain? 

You cannot. Your chances of guessing correctly decay exponentially with every hop, down to 50%, at which point you are guessing at random. There's a good chance the bit is flipped multiple times between the origin and the node you are looking at, so there's a roughly equal chance it's a 1 or 0 regardless of what it started out as.

There was no way to preserve the original information in 1D. Perhaps we can in 2D?

### 2D

Now the information of the original bit gets replicated at each layer, so perhaps there is a better chance we can recover the bit?

In order to attempt to recover the bit, we are allowed to look at all the nodes in the wavefront. We will guess that the original bit was a 1 if the majority of bits in the wavefront are 1s, and then likewise for 0s. For the full open problem you are free to use any calculation on the final bits, but we will restrict ourselves to just the majority calculation today. We say the bit is recoverable if the expected percent of correct bits in the wavefront is strictly > 50% as we look at the layers in their limit (again, just for this restricted version of the problem, in general you should be looking to prove that there exists a decoder with error bounded away from 0.5 in the limit).

We also need to decide how each node in our 2D grid should handle receiving two different inputs. If both inputs match, then we pass that value forward, as that is likely the value of the original bit. If they are different, we will just pass forward a random value, as both are equally likely.

<div style="text-align: center;">
  <video controls autoplay muted loop playsinline width="90%">
    <source src="https:///blog-assets.jasonemerald.workers.dev/PropogatingBit/2d-pryamid.webm" type="video/webm">
  </video>
</div>

In this single example, we see how between the 6th and 7th layers the information about the original bit was lost, as it was no longer the majority of the wavefront.

Note that the full problem looks at assigning functions to each node, where each node can decide for itself how to handle two inputs. Perhaps some clever combination of functions arranged on the grid will allow more information to be preserved, similar in spirit to [Toom's rule](https://en.wikipedia.org/wiki/Toom's_rule). But for a homogeneous assignment of any function, [it has been proved that information is not preserved](https://people.lids.mit.edu/yp/homepage/data/2020_2dgrid.pdf), at least for 2D. For today, we will use just one function: pass forward the majority bit, or pick at random in a tie.

### 3D

The open question, can we recover the bit from the 3D wavefront?

<div style="text-align: center;">
  <video controls autoplay muted loop playsinline width="90%">
    <source src="https:///blog-assets.jasonemerald.workers.dev/PropogatingBit/3d-pryamid.webm" type="video/webm">
  </video>
</div>

The majority function makes natural sense here, as most nodes have 3 inputs and can erase a bad bit. This means if a single bit gets flipped, there is a good chance it gets immediately fixed due to the surrounding bits being correct and the majority function overwriting the error. Is this enough to maintain the original bit at the wavefront? Let's explore!

## Exploring

### Simulations

The first and easiest thing to do is to just simulate a bunch of random 3D grids and see if the percent of correct bits along the wavefront tends to go to 50% or not, sampled across different temperature values.

Because this is probabilistic, let's run 100 simulations at each of 10 temperature values, with grids out to 300 layers. It is likely that the temperature only starts to matter at small values, so let's sample those logarithmically.

![](3d_noise.png){: .center w="700" }

At high temperature, the percent of correct bits drops to 50% very quickly, meaning the original bit is irrecoverable. As we decrease the temperature, the percent of correct bits stays high for longer, but still eventually reaches 50%. At very low temperatures, starting around $2^{-6}$, it is hard to tell when or if the original bit will stay as the majority. Perhaps if we simulate more layers we will see the percent eventually drop, or perhaps at such low temperatures the correct bit will always stay the majority. We don't know. If there is a phase change from information-eroding to information-preserving anywhere, which we do not know, these empirical simulations suggest we start looking around $2^{-5}$.

To get a more intuitive idea for the problem, here is an interactive visualization with many options which we will explore next.

<div id="broadcast-viewer"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<script src="/assets/js/posts/BitOnGrid/broadcast_viewer.js"></script>

This is the main visual we will play with, so spend some time with it.

### Less noise

Notice that at low temperatures a lot of the incorrect bits come from near the axes (sides) of the grid. Turn on `axes only` for the 2D grid to see what happens if we only allow noise on the axes, and see if we can spot any patterns.

![](2d-edge-noise.png){: .right w="300" }

There are a lot of incorrect bits considering that only the edges on the axes have noise. It looks as if the flipped bits on the axes are making their way down into the triangle.

Notice that the axes are actually 1D chains, which we know are problematic. In particular, we know the 1D chains are about 50% 1s and 50% 0s, with the expected size of each segment inversely proportional to the temperature. When we look at the full picture, the noise from these 1D edges seems to be reaching into the entire 2D grid, cascading down to the wavefront.

One complication is that the information looks to move back and forth as it cascades down. Because we have nodes pick random outputs for tied inputs, the boundary between regions of 1s and 0s moves as a random walk (more specifically a [Gambler's Ruin](https://en.wikipedia.org/wiki/Gambler%27s_ruin) since it terminates when it has 0 width). It makes the analysis harder when the known errors at the top of the triangle do a random walk before reaching the wavefront. How do random walks affect the errors as they fall down to the wavefront? I don't know, so I will make a simplification instead.

I will add a simplification that removes the random walks. I find this simplification highly suspect, potentially over-simplifying to the point of making our model vacuous. But, as always, it is helpful to consider simpler models to discover insights that may have been hidden under complexity.

### Undefined nodes

We can ignore nodes that have a tie on their inputs, which will then stop useless information from cascading down the grid. This actually feels more principled than picking an output at random.

This also turns our random walks into straight lines. Turn on `stay undefined` for ties.

![](2d-undefined-nodes.png){: .right w="300" }

This is much easier to analyze. The 1D chains have alternating segments of 1s and 0s, with expected equal lengths, and these are projected down onto the wavefront. Importantly, the expected size of the segments for 1s is equal to the expected size of segments for 0s, which means we expect the bottom of the triangle, the wavefront, to have an equal number of 1s and 0s.

This means we do not expect to be able to recover the information from the wavefront.

How does this interact in 3D? Try it on the visualization.

You should find that by only allowing noise on the axes and turning on undefined nodes, you get a very structured pattern of V-shaped strips on the wavefront (the bottom of the pyramid). This is the projection of the 2D walls of the pyramid down to its floor (the wavefront). Because we know the 2D walls are 50% 1s and 0s, their projection onto the 3D wavefront will also produce 50% 1s and 0s.

<div style="text-align: center;">
  <video controls autoplay muted loop playsinline width="50%">
    <source src="https:///blog-assets.jasonemerald.workers.dev/PropogatingBit/3d-pryamid.mp4" type="video/mp4">
  </video>
</div>

## Conclusion

For our restricted case, using the majority function everywhere, the above analysis suggests that the problem of recovering a bit propagated over a noisy 3D grid is impossible. In fact, the analysis here suggests that we only need noise along the axes to make the information irrecoverable. But I am not yet convinced.

My biggest concern is the introduction of undefined nodes, which remove the random walks. I suspect those random walks may be what enables the erosion property. Undefined nodes essentially disable the eroding power of the majority function, which is the property we were hoping to leverage, by walling off the disagreements. We also failed to consider alternative function assignments or decoders.

What remains to be seen is whether the informal descriptions here can be mapped to rigorous proofs, or, if not, where the critical misstep lies. Perhaps this can shine some light on the assumptions necessary for the eventual proof.

All the code can be found at [this repo](https://github.com/JasonFantl/BitPropogationBlogPost) if you want to play with the visuals or simulation.

### Other models to explore

There are so many more models to explore. Below are just a few ideas.
* Triangle and hexagonal grids.
* Grids with larger neighborhoods.
* Grids with growing (exponential) neighborhoods.
* Inverse grids (start at a boundary and flow inward to the origin).
* Multiple root nodes.
* Grids with finite size that wrap around on themselves.


<!-- ## Other

Can we remove the 1D axis in all sims? As in, will there always be a path from the axis which always has one input? They are annoying. =
* Maybe just need a clever neighborhood around each node, like 2 hops?. This seems incorect as no matter the geometric neighborhood, there will be some corner of the neighborhood that will always produce a path of single edges.
* Triangle grid - nope, 6 1d axis now instead of 4.
* Hexagon grid - info degrades fast and almost no new inputs combined
* If we try to mathmatically find what the tree would have to look like to avoid special axis we find it must grow exponentially
    * For d_in degree into n nodes from the above layer of m nodes with degree d_out, we get  `n d_in = m d_out`. So, if d_in = d_out, then layers do not change. If n > m then d_in < d_out. Can show for simple examples that d_in=2, d_out=3 that it is not possible since eventually a layer will have an odd number of nodes. For din_2, d_out=4, we realize we should impose the additional constraint that two nodes in a layer should not have the same set of nodes being sent into it. This restricts the number of nodes in each new layer to be at most (n-1)n/2 for n nodes in the previous layer for d_in=2 and a varying d_out. This is how many combos we can have that are unique. We solve (n-1)n/2 >= n*2 for d_in=2, d_out=4, which gives us n >= 5.19, so we can begin to meet all the requirements at n=6. Then if we want to keep d_out=4 constant, we need a principaled way to choose the edges to keep.
* Can we swap some edges so the 1-input nodes dont form a chain?
    * We want to have a pryamid shape, but we can swap edges to avoid forming the chain. Imagine forming a shifted ring below an existing layer, but then we need to add one more node. This needs to steal two edges. In the default case, we take edges from one 



My proof for the 2d case (super simplified model, not direclty applicable):
If we only assume noise on the 1d axis, and we use suppression (although I think random will perform the same), then we can show that all the nodes below the flipped bits on the 1d axis will all also be flipped. Since the noise is constant, we expect on average the same distance between 1s and 0s on the edges. This means we expect the percent of 1s and 0s to converge to 50% as the number of layers goes to infinity.

Can we extend this to 3d?
We assume the side panels are versions of the above, a traingle with strips of 1s and 0s. Here is the shape we get: a traingle with random strips starting from the lines between the origin and corners  -->