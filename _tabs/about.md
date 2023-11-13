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

<style>
    .linkx-section {
        display: flex;
        justify-content: space-around;
        gap: 10px;
        /* Adjust the gap as needed for spacing */
        margin-bottom: 20px;
        text-decoration: none;
    }

    .imagex-link {
        position: relative;
        text-decoration: none;
        color: #333;
        text-align: center;
        overflow: visible;
        padding: 10px;
        /* Increase padding as needed */
        margin: 5px;
        /* Adjust margin if you want more space outside the links */
        box-sizing: border-box;
        /* Ensures padding is included in width/height */
        text-decoration: none;
    }

    .imagex-link img {
        max-width: 100%;
        height: 150px;
        /* Set a fixed height for all images */
        /* Set a fixed height for all images */
        object-fit: cover;
        /* Ensure images maintain aspect ratio within the fixed height */
        border-radius: 8px;
        transition: transform 0.3s ease-in-out;
        text-decoration: none;
    }

    .imagex-link:hover img {
        transform: scale(1.1);
    }

    .imagex-link {
        position: relative;
        text-decoration: none;
        color: #333;
        text-align: center;
        overflow: hidden;
text-decoration: none;
    }

    .imagex-text {
        display: inline;
        position: absolute;
        z-index: 1;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        transition: opacity 0.3s ease-in-out;
        color: #ffffff;
        /* Text color */
        font-size: 14px;
        font-weight: bold;
        pointer-events: none;
        line-height: 1.2;
        text-shadow: 0px 0px 10px rgba(0, 0, 0, 1), 0px 0px 10px rgba(0, 0, 0, 1), 0px 0px 10px rgba(0, 0, 0, 1);

    }

    .overlayx-link {
        color: inherit;
        /* Use the same color as the text */
        text-decoration: none;
    }

    .imagex-link:hover .imagex-text {
        text-shadow: 2px 2px 10px rgba(0, 0, 0, 1);
        /* Adjust shadow size and color on hover */

    }


.hidden-text-node {
    display: none;
}

</style>

----------------------

#### Blog
<div class="linkx-section" class="hidden_text">

<a href="/posts/Decentralized-Dynamic-Cluster-Identification/" class="imagex-link"><span class="imagex-text">Dynamic Cluster Identification</span> <img src="cluster.png" alt="Dynamic Cluster Identification"></a>

<a href="{% post_url 2023-04-07-Simulated-Economy-(1) %}" class="imagex-link"><span class="imagex-text">Simulating an Economy</span> <img src="economy.png" alt="Simulating an Economy"></a>

<a href="{% post_url 2023-04-09-Non-Euclidian-Renderer %}" class="imagex-link"><span class="imagex-text">Non-Euclidean Renderer</span> <img src="blackhole.gif" alt="Non-Euclidean Renderer"></a>

<a href="{% post_url 2023-04-08-Shaping-Swarms %}" class="imagex-link"><span class="imagex-text">Shaping Swarms in Simulation</span> <img src="swarm.gif" alt="Shaping Swarms in Simulation"></a>
</div>

----------------------

#### Github

<div class="linkx-section" class="hidden_text">
<a href="https://github.com/JasonFantl/Drone-hand-controller" class="imagex-link"><span class="imagex-text">Controlling drones with hand rotation</span> <img src="drone.png" alt="Controlling drones with hand motions"></a>

<a href="https://github.com/JasonFantl/VR-Lenia" class="imagex-link"><span class="imagex-text">Lenia in VR: Continuous 3D cellular automata</span> <img src="lenia.png" alt="Lenia in VR: Continuous 3D cellular automata"></a>

<a href="https://github.com/JasonFantl/Lambda-calculus-interpreter" class="imagex-link"><span class="imagex-text">Lambda Calculus shell interpreter</span> <img src="lambda.jpg" alt="Lambda Calculus shell interpreter"></a>
</div>

<script>
  document.querySelectorAll('.hidden_text a').forEach(a => {
    Array.from(a.childNodes).forEach(node => {
        if (node.nodeType === 3) { // Node type 3 is a text node
            const span = document.createElement('span');
            span.className = 'hidden-text-node';
            span.textContent = node.textContent;
            node.parentNode.replaceChild(span, node);
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
