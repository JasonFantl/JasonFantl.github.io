const speedOfLight = 30;

class Network {
  constructor() {
    this.broadcasts = [];
  }

  timestep() {
    // update and remove any broadcasts that have completed
    for (let i = this.broadcasts.length - 1; i >= 0; i--) {
      let broadcast = this.broadcasts[i];
      broadcast.timestep();

      if (broadcast.hasCompleted()) {
        this.broadcasts.splice(i, 1);
        continue;
      }
    }
  }

  createBroadcast(position, range, payload, node) {
    let broadcast = new Broadcast(position, range, speedOfLight, payload, node);
    this.broadcasts.push(broadcast);
  }
}

class PayloadNetworkMetadata {
  constructor(payload, signalStrength) {
    this.payload = payload;
    this.signalStrength = signalStrength;
  }
}

class Broadcast {
  constructor(position, max_radius, speed, payload, node) {
    this.position = position;
    this.radius = 0;
    this.max_radius = max_radius;
    this.speed = speed;
    this.payload = payload;
    this.seen = [node];
  }

  timestep() {
    this.radius += this.speed;

    // check for any broadcasts that reach a node
    for (let node of nodes) {
      if (!(this.seen.includes(node))) {
        let d = dist(this.position.x, this.position.y, node.position.x, node.position.y);
        if (d < min(this.radius, this.max_radius)) {
          let signalStrength = 1 / d;
          node.mailbox.push(new PayloadNetworkMetadata(this.payload, signalStrength));
          this.seen.push(node)
        }
      }
    }
  }

  display() {
    let a = map(min(this.radius, this.max_radius), 0, this.max_radius, 0.15, 0);
    fill(186, 255, 255, a); // Set hue to 100, full saturation and brightness, and alpha mapped from radius
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2);
  }

  hasCompleted() {
    return this.radius > this.max_radius;
  }
}