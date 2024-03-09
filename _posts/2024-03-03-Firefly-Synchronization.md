---
title: Firefly Synchronization
categories: []
img_path: /assets/img/posts/Firefly
image: cover.webp
math: true
---

## Fireflies

There exists a somewhat magical phenomenon in nature where a swarm of fireflies will begin flashing in synchrony.

![real fireflies flashing in sync](real_fireflies.gif){: .center w="600" }

Let's recreate that behavior in simulation!

## "Fireflies"

Starting simply, let's have two fireflies. We assume they already know the frequency to flash at (maybe it's in their biology). Each firefly has an internal clock, and every time the clock completes a cycle, the firefly flashes. This is represented by the below code, which runs continuously. The `flashInterval` represents how long we wait between flashes, and the `flashTimer` tells us where in that interval we are, with `flashTimer` increasing with time.

``` javascript
if (flashTimer >= flashInterval) {
    flash();
    flashTimer = 0.0;
}
```

We visualize the internal clocks of each firefly as a point traveling around a circle. When a fireflies clock reaches midnight (internally represented by `flashTimer >= flashInterval`), the firefly flashes.

![two fireflies and thier clocks](no_delta.gif){: .center w="300" }

We see these two fireflies flash at the same rate but out of phase with each other. We need a system for phase synchronization. There are many potential solutions to this problem, but we're going to make it especially hard for ourselves. We assume a firefly has the ability to sense when a flash occurs, but nothing else. This means it doesn't know how many fireflies there are, which one caused the flash it just saw, or what the internal clocks look like in other fireflies.

## Phase Synchronization

To synchronize the phase, the fireflies will follow a simple rule: If you see a flash just before you're about to flash, flash earlier. If you see a flash just after you flashed, flash later. We'll flash earlier by moving our phase forward a bit, and flash later by turning our phase back a bit. Here is the code and its associated graph showing the change in phase relative to when a flash is received (green means increment our phase, red means decrement, and the height tells you by how much).

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
if (flashTimer < flashInterval / 2) { // saw flash after, flash later
    flashTimer -= couplingConstant*flashInterval;
} else if (flashTimer > flashInterval / 2) { // saw flash before, flash earlier
    flashTimer += couplingConstant*flashInterval;
}
```
</div>
<div class="col-md-2" markdown="1">
![graph of constant phase delta](constant_delta_graph.png){: .center w="100" }
</div>
</div>

The circular graph is known as the phase response curve (PRC). Each time we see a firefly flash, the delta corresponding to where we currently are in our phase will be applied to our phase.

![two fireflies and their clocks](constant_delta.gif){: .center w="300" }

It sort of worked. The fireflies aren't precisely synchronizing, their phases are jumping too far sometimes. We can fix this by having the delta depend on our phase. If a flash comes a microsecond after our flash, we don't want to change our phase by much. The delta will be proportional to the difference between our flash and the observed flash. All together, the code is now

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
if (flashTimer < flashInterval / 2) { // saw flash after, flash later
    flashTimer += couplingConstant*flashInterval*((0-flashTimer)/(flashInterval/2));
} else if (flashTimer > flashInterval / 2) { // saw flash before, flash earlier
    flashTimer += couplingConstant*flashInterval*((flashInterval-flashTimer)/(flashInterval/2));
}
```
</div>
<div class="col-md-2" markdown="1">
![graph of proportional phase delta](proportional_delta_graph.png){: .center w="100" }
</div>
</div>

This produces much cleaner synchronized phases.

![two synchronizing fireflies and their clocks](proportional_delta.gif){: .center w="300" }

This is absolutely sufficient, but for the sake of elegance I want to modify this slightly. As long as we don't mind having a small delta when flashes are nearly opposite (it'll still be an unstable point), then this can all be condensed into a sin function. This makes the code more concise and the phase response curve smooth (infinitely smooth even).

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
flashTimer -= couplingConstant*flashInterval*sin(flashTimer/flashInterval*2*Pi);
```
</div>
<div class="col-md-2" markdown="1">
![graph of sin phase delta](sin_delta_graph.png){: .center w="100" }
</div>
</div>

And we get synchronizing fireflies again. Let's add some more and see how this handles multiple flashes from multiple sources. When having more fireflies, `couplingConstant` is brought down so that visually we can see them converge more slowly.

![many synchronizing fireflies and their clocks](sin_delta.gif){: .center w="300" }

It works! And we've just begun, there are many avenues to explore here: De-synchronizing phases, synchronizing frequencies, continuous models using differential equations, localized flashes rather then global ones, and the combination of all these things.

## Phase De-Synchronization

Now we do the reverse. When we see a flash just before our own, flash later, and seen just after, flash earlier.

Let's follow the same progression. The constant value delta for de-synchronization looks identical to the synchronizing version, but the signs are flipped.

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
if (flashTimer < flashInterval / 2) { // saw flash after, flash earlier
    flashTimer += couplingConstant*flashInterval;
} else if (flashTimer > flashInterval / 2) { // saw flash before, flash later
    flashTimer -= couplingConstant*flashInterval;
}
```
</div>
<div class="col-md-2" markdown="1">
![graph of constant phase negative delta](constant_neg_delta_graph.png){: .center w="100" }
</div>
</div>

Then we may want to ignore flashes opposite from our phase while emphasizing the ones closest to us. This turns out to be very simple, just one line.

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
flashTimer += couplingConstant*flashInterval*((flashInterval/2 - flashTimer)/(flashInterval/2));
``` 
</div>
<div class="col-md-2" markdown="1">
![graph of proportional phase negative delta](proportional_neg_delta_graph.png){: .center w="100" }
</div>
</div>

And regardless of the number of fireflies we have, they will evenly distribute themselves within the phase space.

![fireflies de-synchronizing](proportional_neg_delta.gif){: .center w="300" }

And if we can again elegantly encode this with a sin function to get

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
 ``` javascript
 flashTimer += couplingConstant*flashInterval*sin(flashTimer/flashInterval*2*Pi);
 ```
 </div>
<div class="col-md-2" markdown="1">
![graph of sin phase negative delta](sin_neg_delta_graph.png){: .center w="100" }
</div>
</div>

But this removes the phase deltas where it's most critical, when fireflies flash near each other, and so isn't as useful.

[ TODO try sin desync with frequency, like in the continuos version, see if it works well in the pulse version ]

## Frequency Synchronization

And now what if the frequency is random for each firefly? This suddenly looks much more difficult. Let's play around and see what happens anyway. First, what does a swarm of fireflies trying to synchronize phase look like with varying frequencies?

![fireflies with varying frequencies and trying to align phases](no_frequency_sync.gif){: .center w="300" }

They can't synchronize. Even if for a moment they were to synchronize, the longer frequency fireflies would take longer to flash next time, throwing everyone out of sync again.

We need an additional mechanism to update our frequency. When we see a flash after our own, then perhaps our interval is too short, and a longer interval would cause us to flash later next time. We can use exactly the same code as the phase synchronization, but for frequency synchronization. In fact, the only thing that changes is the sign (you can imagine if we want to flash later, that means we turn the clock back, subtracting, and we make the interval longer, adding).

```
flashTimer -= couplingConstant*flashInterval*sin(flashTimer/flashInterval*2*Pi);
flashInterval += couplingConstant*flashInterval*sin(flashTimer/flashInterval*2*Pi);
```

Later we may want to play with different coupling strengths for phase and frequency synchronization, but this works well enough for now.

![fireflies with varying frequencies synchronizing](sin_frequency_delta.gif){: .center w="300" }

Or does it? If we start with slightly more varied frequencies, the swarm never synchronizes. I speed up a part of the simulation below so we can see the steady state it falls into.

![fireflies with varying frequencies failing to synchronize](failed_frequency_sync.gif){: .center w="300" }

We notice that they fall into frequencies which are multiples of each other, and that one firefly gets perpetually stuck at the beginning of its interval. 

Since we ignore flashes when they're opposite our phase, fireflies can have intervals that are multiple of each other and never notice. They only see flashes when they flash, or on opposite phases, (or every other time they flash, but that would still have no delta on their frequency). 

A firefly can get stuck when it has an interval at least twice as long as the others. It will see the faster fireflies flash and think it needs to flash later, causing his clock to be turned back and the interval lengthened, and before he can get halfway though his interval, the fast fireflies flash again, again causing him to turn back his clock and lengthen his interval. This can repeat forever, causing the firefly to never flash and be constantly increasing his interval.

## Continuous Models

TODO


$$
\begin{align}
\frac{d\theta_i}{dt} &= w_i + \frac{K}{N} \sum_{j=1}^{N} \sin(\theta_j - \theta_i) \\
\frac{dw_i}{dt} &= \frac{L}{N} \sum_{j=1}^{N} \sin(\theta_j - \theta_i)
\end{align}
$$

<div id="p5-canvas-container" style="
  display: flex;
  justify-content: center; /* Horizontal centering */
  align-items: center;     /* Vertical centering */
"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
<script src="/assets/js/posts/Firefly/buttons.js"></script>
<script src="/assets/js/posts/Firefly/sketch.js"></script>
<script src="/assets/js/posts/Firefly/firefly.js"></script>


## Local Flashes

TODO

## Phase De-Synchronization (part 2)

During our attempt to de-synchronize, it's impossible to tell if we are seeing two fireflies flash, or if it's one firefly with double the frequency. In this case it's impossible resolve the issue. But this is only an issue in particular situations.

one firefly flashing 3 times as fast, and 3 fireflies that are each individually responsible for a flash in-between one pair of the first fireflies three flashes, this will be stable since every firefly sees one and only one flash equally distributed in their own cycle.
If one firefly is taken out, then there exist no orientation where these fireflies with these frequencies can be stable.

Two fireflies, A and B, where B has double the frequency. A flashes right between the two flashes of B. A sees two flashes, each equally before and after their own, although they might expect another flash directly opposite their own phase, which they would not see. B sees one flash directly opposite its phase one cycle, and no flash at all the second cycle. There is nothing wrong with the scenario and it would incorrectly be stable.


## Useful links

* https://www.researchgate.net/publication/44610675_Spontaneous_synchronization_of_coupled_oscillator_systems_with_frequency_adaptation
  * Most relevant resource.
  * Equation 2, page 2, has exactly our model, plus some noise added.
* https://www.researchgate.net/publication/369974513_Adaptive_Dynamical_Networks
  * A good overview
  * Part 3.4 is most relevant
* https://www.researchgate.net/publication/286479365_Synchronization_dynamics_in_diverse_ensemble_of_noisy_phase_oscillators_with_asynchronous_phase_updates
* https://www.researchgate.net/publication/243777919_Adaptive_Frequency_Model_for_Phase-Frequency_Synchronization_in_Large_Populations_of_Globally_Coupled_Nonlinear_Oscillators
* https://arxiv.org/pdf/1011.3878v2.pdf
  * ON THE CRITICAL COUPLING FOR KURAMOTO OSCILLATORS
  * Some useful notes
* https://www.math.uh.edu/~zpkilpat/teaching/math4309/project/jmb91_ermentrout.pdf
  * An adaptive model for synchrony in the firefly Pteroptyx malaccae 
  * Equation 4.1,4.2 page 580, very nearly contains our model