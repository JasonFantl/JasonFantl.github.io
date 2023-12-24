class LogicalNode {
  constructor(i, x, y) {
    this.index = i;
    this.pos = createVector(x, y);
    this.vel = createVector();
    this.radius = 5;
    this.connectionRange = 40;
  }

  update() {
    let force = createVector();

    // centering force
    let centeringForce = this.pos.copy().sub(logicalCenter);
    force.sub(centeringForce.mult(0.0001));

    // noise
    // force.add(p5.Vector.random2D().mult(0.1));

    // other nodes
    force.sub(this.getAestheticForce());
    // force.sub(this.getDiscreteForce());

    // dampening
    let dampening_coefficient = 0.03;
    force.sub(this.vel.copy().mult(dampening_coefficient));

    this.vel.add(force);
    this.pos.add(this.vel);
  }

  getAestheticForce() {
    let force = createVector();
    for (let i = 0; i < nodes.length; i++) {
      let springForce = createVector();
      let deltaPos = this.pos.copy().sub(logicalNodes[i].pos);
      if (nodes[this.index].connectedIndices.includes(i)) { // connected
        // pulled to average distance
        let deltaDistance =
          deltaPos.mag() - this.connectionRange / sqrt(2);
        springForce = deltaPos.setMag((atan(deltaDistance) * 2.0) / PI * 0.1);
      } else {

        // should always push away, just use 1/x since it gets weaker as you get farther
        springForce = deltaPos.setMag(-1.0 / (deltaPos.mag() + 0.01)).mult(this.connectionRange / 50);
      }
      force.add(springForce);
    }
    return force;
  }

  getDiscreteForce() {
    let force = createVector();
    for (let i = 0; i < nodes.length; i++) {
      let springForce = createVector();
      let deltaPos = this.pos.copy().sub(logicalNodes[i].pos);
      if (nodes[this.index].connectedIndices.includes(i)) { // connected
        if (deltaPos.mag() > this.connectionRange) { // too far
          springForce = deltaPos.setMag(1);
        }
      } else { // not connected
        if (deltaPos.mag() < this.connectionRange) { // too close
          springForce = deltaPos.setMag(-1);
        }
      }
      force.add(springForce);
    }

    // its a bit strong
    force.mult(0.1);
    return force;
  }

  displayNode() {
    fill(nodes[this.index].col);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
  }

  displayEdges() {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[this.index].connectedIndices.includes(i)) {
        stroke(0, 150);
        strokeWeight(1);
        line(
          this.pos.x,
          this.pos.y,
          logicalNodes[i].pos.x,
          logicalNodes[i].pos.y
        );
      }
    }
  }
}
