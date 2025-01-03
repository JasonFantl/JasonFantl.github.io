// Boids
function boids(boid) {
    let force = createVector();

    let separateForce = separate(boid).mult(1.0);
    let alignForce = align(boid).mult(0.8);
    let cohesionForce = cohesion(boid).mult(0.5);

    let centerForce = boid.position.copy().sub(createVector(width / 2, height / 2)).div(-width * 4);
    force.add(centerForce);

    force.add(separateForce);
    force.add(alignForce);
    force.add(cohesionForce);

    return force;
}

function separate(boid) {
    let desiredSeparation = 5;
    let sum = createVector();
    let count = 0;

    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] == boid) {
            continue;
        }
        let distance = p5.Vector.dist(boid.position, nodes[i].position);
        if (distance < desiredSeparation) {
            let diff = p5.Vector.sub(boid.position, nodes[i].position);
            diff.normalize();
            // diff.div(distance);
            sum.add(diff);
            count++;
        }
    }

    if (count > 0) {
        sum.div(count);
    }

    return sum;
}

function align(boid) {
    let neighborDist = 10;
    let sum = createVector();
    let count = 0;

    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] == boid) {
            continue;
        }
        let distance = p5.Vector.dist(boid.position, nodes[i].position);
        if (distance < neighborDist) {
            sum.add(nodes[i].velocity.copy().normalize());
            count++;
        }
    }

    if (count > 0) {
        sum.div(count);
    }

    return sum;
}

function cohesion(boid) {
    let neighborDist = 30;
    let sum = createVector();
    let count = 0;

    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] == boid) {
            continue;
        }
        let distance = p5.Vector.dist(boid.position, nodes[i].position);
        if (distance < neighborDist) {
            sum.add(nodes[i].position);
            count++;
        }
    }

    if (count > 0) {
        sum.div(count);
        return p5.Vector.sub(sum, boid.position).mult(0.001);
    } else {
        return createVector();
    }
}