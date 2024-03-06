---
title: Firefly Synchronization
categories: []
img_path: /assets/img/posts/Firefly
image: cover.webp
math: true
---

## Fireflies

There exists a somewhat magical phenomenon in nature where a swarm of fireflies will begin flashing in sync, an entire swarm will light up a forest every few seconds.

![real fireflies flashing in sync](real_fireflies.gif){: .center w="600" }

Let's recreate that behavior in simulation!

## "Fireflies"

To start simply, let's have two fireflies. We assume they already know the frequency to flash at (maybe it's in their biology). Each firefly has an internal clock, and every time the clock completes a cycle, the firefly flashes. This is represented by the below code, which runs continuously. The `flashInterval` represents how long we wait between flashes, and the `flashTimer` tells us where in that interval we are, with `flashTimer` increasing with time.

``` javascript
if (flashTimer >= flashInterval) {
    flash();
    flashTimer = 0.0;
}
```

We visualize the internal clocks of each firefly as a point traveling around a circle. When a fireflies clock reaches midnight (internally represented by `flashTimer >= flashInterval`), the firefly flashes.

![two fireflies and thier clocks](no_delta.gif){: .center w="300" }

We see that the two fireflies flash at the same rate, but they have the wrong phase. We need a system for phase synchronization. There are many potential solutions to this problem, but we're going to make it as hard as possible for ourselves. We assume a firefly gets a signal from seeing a flash, but it doesn't know which firefly flashed. This means it can't see into another fireflies internal clock, and it doesn't know how many fireflies are around it.

## Phase Synchronization

To synchronize the phase, the fireflies will follow a simple rule: If you see a flash just before you flashed, flash later. If you see a flash just after you flashed, flash earlier. Here is the code and its associated graph showing the change in phase relative to when a flash is received (green means increment our timer, red means decrement, and the height tells you by how much).

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
timerDelta = 1; // how many seconds to change our phase by
if (flashTimer < flashInterval / 2) { // saw flash after, flash later
    flashTimer -= timerDelta;
} else if (flashTimer > flashInterval / 2) { // saw flash before, flash earlier
    flashTimer += timerDelta;
}
```
</div>
<div class="col-md-2" markdown="1">
![graph of constant phase delta](constant_delta_graph.png){: .center w="100" }
</div>
</div>

Each time we see a firefly flash, the delta corresponding to where we currently are in our phase will be applied to our timer.

![two fireflies and their clocks](constant_delta.gif){: .center w="300" }

This can be cleaner. Firstly, we don't know how long the interval may be, so we should change by a percent of our interval, not some hardcoded value. This means we now have `timerDelta = timerPercent*flashInterval`, where `timerPercent` is some value like $0.05$. But more importantly, the fireflies aren't precisely synchronizing, their phases are leapfrogging each another. This can be easily resolved.

If a flash comes less then a microsecond after we flashed, we don't want to change our phase by much. The delta should be proportional to the difference between our flash and the observed flash. All together, the code is now

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
timerDelta = timerPercent*flashInterval;
if (flashTimer < flashInterval / 2) { // saw flash after, flash later
    flashTimer += timerDelta*((0-flashTimer)/(flashInterval/2));
} else if (flashTimer > flashInterval / 2) { // saw flash before, flash earlier
    flashTimer += timerDelta*((flashInterval-flashTimer)/(flashInterval/2));
}
```
</div>
<div class="col-md-2" markdown="1">
![graph of proportional phase delta](proportional_delta_graph.png){: .center w="100" }
</div>
</div>

This produces much cleaner synchronized phases. The phases will seemingly forever approach one another, until one of the phases eventually underflows, but that may as well be forever.

![two synchronizing fireflies and their clocks](proportional_delta.gif){: .center w="300" }

If we don't mind also having a small delta when flashes are nearly opposite (this is a significant, but it'll still at least be an unstable point), then this can all be condensed into a sin function.

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
flashTimer -= timerPercent*flashInterval*sin(flashTimer/flashInterval*2*Pi);
```
</div>
<div class="col-md-2" markdown="1">
![graph of sin phase delta](sin_delta_graph.png){: .center w="100" }
</div>
</div>

And we get synchronizing fireflies again. Let's add some more, see how they handle receiving multiple flashes from multiple sources. When having more fireflies, `timerPercent` is also brought down, but just so that visually we can see them converge more slowly.

![many synchronizing fireflies and their clocks](sin_delta.gif){: .center w="300" }

Adn it works! And we've just begun, there are many avenues to explore here: De-synchronizing phases, synchronizing frequencies, continuous models using differential equations, localized flashes rather then global ones (partially connected rather then fully connected graphs), and the combination of all these things.

## Phase De-Synchronization

Now we do the reverse. When we see a flash just before our own, flash later, and seen just after, flash earlier. This time we don't know by what magnitude our phase shift should be since we don't know what our optimal phase position is (this is because we can't tell if there's one other firefly or ten, so we can't tell how far apart the phases ought to be). We know that if all the fireflies have distributed their phases equally, then for every flash we see before our own, we should also see one after. This is what we will rely on.

The constant value delta looks identical to the synchronizing version, but the signs are flipped.

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
timerDelta = 1; // how many seconds to change our phase by
if (flashTimer < flashInterval / 2) { // saw flash after, flash earlier
    flashTimer += timerDelta;
} else if (flashTimer > flashInterval / 2) { // saw flash before, flash later
    flashTimer -= timerDelta;
}
```
</div>
<div class="col-md-2" markdown="1">
![graph of constant phase negative delta](constant_neg_delta_graph.png){: .center w="100" }
</div>
</div>

And we add back the percent of the phase rather then a constant value. And we may want to ignore flashes opposite from our phase, while emphasizing the ones closest to us. This turns out to be very simple, just one line.

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
``` javascript
flashTimer += timerPercent*(flashInterval/2 - flashTimer)*2;
``` 
</div>
<div class="col-md-2" markdown="1">
![graph of proportional phase negative delta](proportional_neg_delta_graph.png){: .center w="100" }
</div>
</div>

And regardless of the number of fireflies we have, they will evenly distribute themselves within the phase space.

![fireflies de-synchronizing](proportional_neg_delta.gif){: .center w="300" }

And if we wanted to be consistent (but sacrificing the largest effects at the nearest flashes) we can encode this with a sin function to get

<div class="row align-items-center">
<div class="col-md-8" markdown="1">
 ``` javascript
 flashTimer += timerPercent*flashInterval*sin(flashTimer/flashInterval*2*Pi);
 ```
 </div>
<div class="col-md-2" markdown="1">
![graph of sin phase negative delta](sin_neg_delta_graph.png){: .center w="100" }
</div>
</div>

But this removes the phase deltas where it's most critical, when fireflies flash near each other, and so we should ignore it.

## Frequency Synchronization

And now what if the frequency is random for each firefly? This suddenly looks much more difficult. Ah, but let's play around and see what happens anyway. First, what does a swarm of fireflies trying to synchronize phase look like with varying frequencies/intervals?

![fireflies with varying frequencies and trying to align phases](no_frequency_sync.gif){: .center w="300" }

They can't synchronize. Even if for a moment they were to synchronize, the longer frequency fireflies would take longer to flash next time, throwing everyone out of sync again.

We need an additional mechanism to update our frequency. When we see a flash after our own, then perhaps our interval is too short, and a longer interval would cause us to flash later next time. Now, we might already have the right frequency and it's just our phase that's incorrect, in which case the next time we'll see the flash early and we'll update back to the correct frequency, slowly honing in on the correct parameters.

We can use exactly the same code as the phase synchronization, but for frequency synchronization. In fact, the only thing that changes is the sign (you can imagine if we want to flash later, that means we turn the clock back, subtracting, and we make the interval longer, adding).

```
flashTimer -= timerPercent*flashInterval*sin(flashTimer/flashInterval*2*Pi);
flashInterval += timerPercent*flashInterval*sin(flashTimer/flashInterval*2*Pi);
```

Later we may want to play with different coupling strengths for phase and frequency synchronization, but this works well enough for now.

![fireflies with varying frequencies synchronizing](sin_frequency_delta.gif){: .center w="300" }

Or does it? If we start with slightly more varied frequencies, the swarm never synchronizes. I speed up a part of the simulation below so we can see the steady state it falls into.

![fireflies with varying frequencies failing to synchronize](failed_frequency_sync.gif){: .center w="300" }

We notice that they fall into frequencies which are multiples of each other, and that one firefly gets perpetually stuck at the beginning of its interval. 

Since we ignore flashes when they're opposite our phase, fireflies can have intervals that are multiple of each other and never notice. They only see flashes when they flash, or on opposite phases, (or every other time they flash, but that would still have no delta on their frequency). 

A firefly can get stuck when it has an interval at least twice (really four times) as long as the others. It will see the faster fireflies flash and think it needs to flash later, causing his clock to be turned back and the interval lengthened, and before he can get halfway though his interval, the fast fireflies flash again, again causing him to turn back his clock and lengthen his interval. This can repeat forever, causing the firefly to never flash and be constantly increasing his interval.

## Continuous Models

TODO

## Local Flashes

TODO

## Phase De-Synchronization (part 2)

During our attempt to de-synchronize, it's impossible to tell if we are seeing two fireflies flash, or if it's one firefly with double the frequency. In this case it's impossible resolve the issue. But this is only an issue in particular situations.

one firefly flashing 3 times as fast, and 3 fireflies that are each individually responsible for a flash in-between one pair of the first fireflies three flashes, this will be stable since every firefly sees one and only one flash equally distributed in their own cycle.
If one firefly is taken out, then there exist no orientation where these fireflies with these frequencies can be stable.

Two fireflies, A and B, where B has double the frequency. A flashes right between the two flashes of B. A sees two flashes, each equally before and after their own, although they might expect another flash directly opposite their own phase, which they would not see. B sees one flash directly opposite its phase one cycle, and no flash at all the second cycle. There is nothing wrong with the scenario and it would incorrectly be stable.