---
# the default layout is 'page'
icon: fas fa-info-circle
order: 4
img_path: /assets/img/about/
---

----------------------

<div align="center">
Hi, my name is Jason. 
</div>

![Alt Text](my_face.jpg){:style="width: 200px; height: 200px; background-size: cover; background-repeat: no-repeat; border-radius: 10%; margin: 0 auto; display: flex; justify-content: center; align-items: center;"}

<div align="center" markdown="1">
[LinkedIn](https://www.linkedin.com/in/jason-fantl-5435b1228/) | [Github](https://github.com/JasonFantl)
</div>

This is my blog where I write about fun ideas, usually with some animations, code, and/or simulations. If you find this interesting, also check out some of my github projects and the academic papers I've contributed to. Below are some of my favorite projects.

----------------------


<style>
.rounded_image2 {
    width: 150px;
    height: 150px;
    background-size: cover;
    border-radius: 10%;
    margin: 0 auto;
    transition: transform 0.3s ease-in-out; /* Add transition for smooth effect */
}

    .grid2 {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        padding: 16px;
    }

    .grid-item2 {
        position: relative;
        margin: 8px;
        overflow: hidden;
        border-radius: 8px;
        cursor: pointer; /* Added this line */
    overflow: visible; /* Set overflow to visible */

    }

    .text-overlay2 {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 20px;
        opacity: 1;
        color: white;
        transition: opacity 0.3s ease-in-out;
        z-index: 2;
        line-height: 1.0;
            font-weight: bold; /* Make the text bold */
    text-shadow: 0px 0px 10px rgba(0, 0, 0, 1), 0px 0px 10px rgba(0, 0, 0, 1), 0px 0px 10px rgba(0, 0, 0, 1);

        /* Adjust the line-height as needed */
    }

.grid-item2:hover .rounded_image2 {
    transform: scale(1.1); /* Expand image on hover */
}


</style>


#### Blog

<div class="grid2">
    <div class="grid-item2" data-url="{% post_url 2023-08-7-Decentralized-Dynamic-Cluster-Identification %}">
        <img src="cluster.png" alt="Dynamic Cluster Identification" class="rounded_image2">
        <div class="text-overlay2">
            <p>Dynamic Cluster Identification</p>
        </div>
    </div>
    <div class="grid-item2" data-url="{% post_url 2023-04-07-Simulated-Economy-(1) %}">
        <img src="economy.png" alt="Simulating an Economy" class="rounded_image2">
        <div class="text-overlay2">
            <p>Simulating an Economy</p>
        </div>
    </div>
    <div class="grid-item2" data-url="{% post_url 2023-04-09-Non-Euclidian-Renderer %}">
        <img src="blackhole.gif" alt="Non-Euclidean Renderer" class="rounded_image2">
        <div class="text-overlay2">
            <p>Non-Euclidean Renderer</p>
        </div>
    </div>
    <div class="grid-item2" data-url="{% post_url 2023-04-08-Shaping-Swarms %}">
        <img src="swarm.gif" alt="Shaping Swarms in Simulation" class="rounded_image2">
        <div class="text-overlay2">
            <p>Shaping Swarms in Simulation</p>
        </div>
    </div>
</div>

----------------------

#### Github
<div class="grid2">
    <div class="grid-item2" data-url="https://github.com/JasonFantl/Drone-hand-controller">
        <img src="drone.png" alt="Controlling drones with hand motions" class="rounded_image2">
        <div class="text-overlay2">
            <p>Controlling drones with hand rotation</p>
        </div>
    </div>
    <div class="grid-item2" data-url="https://github.com/JasonFantl/VR-Lenia">
        <img src="lenia.png" alt="Controlling drones with hand motions" class="rounded_image2">
        <div class="text-overlay2">
            <p>Lenia in VR: Continuous 3D cellular automata</p>
        </div>
    </div>
    <div class="grid-item2" data-url="https://github.com/JasonFantl/Lambda-calculus-interpreter">
        <img src="lambda.jpg" alt="Controlling drones with hand motions" class="rounded_image2">
        <div class="text-overlay2">
            <p>Lambda Calculus shell interpreter</p>
        </div>
    </div>
</div>

<script>
    document.querySelectorAll('.grid-item2').forEach(item => {
        item.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            if(url) {
                window.location.href = url;
            }
        });
    });
</script>

----------------------

#### Papers
* [Towards the Development of a Multi-Agent Cognitive Networking System for the Lunar Environment](https://ieeexplore.ieee.org/document/9613839) 
  * [Here](https://photos.app.goo.gl/zj436VeFZ2GyUC9y5) is the presentation I gave at NASA after my time there, which contains my contributions that made it into this paper.
* [Secure and Resilient Swarms: Autonomous Decentralized Lightweight UAVs to the Rescue](https://ieeexplore.ieee.org/document/9109421)
* [Efficient Direct-Connect Topologies for Collective Communications](https://arxiv.org/abs/2202.03356)
* [Efficient All-to-All Collective Communication Schedules for Direct-Connect Topologies](https://arxiv.org/abs/2309.13541)

----------------------

#### Physical Projects

{% include physical_projects.html %}
