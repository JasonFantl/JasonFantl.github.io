class PhysicalNode {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.col = col;
    this.radius = 20;
    this.connectionRange = 100;
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;

    this.connectedIndices = []
  }

  update() {
    if (this.dragging) {
      this.pos.x = mouseX + this.offsetX;
      this.pos.y = mouseY + this.offsetY;
    }
  }

  displayNode() {
    fill(this.col);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
  }

  displayEdges() {
    for (let i = 0; i < nodes.length; i++) {
      if (this.connectedIndices.includes(i)) {
        stroke(0, 150);
        strokeWeight(1.5);
        line(this.pos.x, this.pos.y, nodes[i].pos.x, nodes[i].pos.y);
      }
    }
  }

  displayConnectionRange() {
    fill(100, 200, 250, 50);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.connectionRange * 2, this.connectionRange * 2);
  }

  pressed() {
    this.dragging = true;
    this.offsetX = this.pos.x - mouseX;
    this.offsetY = this.pos.y - mouseY;
  }

  released() {
    this.dragging = false;
  }
}

function mousePressed() {
  for (let node of nodes) {
    let d = dist(mouseX, mouseY, node.pos.x, node.pos.y);
    if (d < node.radius) {
      node.pressed();
      break;
    }
  }
}

function mouseReleased() {
  for (let node of nodes) {
    node.released();
  }
}