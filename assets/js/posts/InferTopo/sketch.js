let nodes = [];
let nodeCount = 10;

let logicalNodes = [];
let logicalCenter;

function setup() {
  let canvas = createCanvas(600, 600);
  canvas.parent('p5-canvas-container');

  // Create physical nodes

  // random
  let padding = 40;
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(new PhysicalNode(random(width / 2 - padding * 2) + padding, random(height / 2 - padding * 2) + padding, color(random(255), random(255), random(255))));
  }

  // grid
  // let gridSize = sqrt(nodeCount);
  // let padding = 40;
  // for (let i = 0; i < nodeCount; i++) {
  //   let x = int(i / gridSize);
  //   let y = i % gridSize;
  //   x /= gridSize - 1;
  //   y /= gridSize - 1;
  //   nodes.push(new PhysicalNode(x * (width / 2 - padding * 2) + padding, y * (height / 2 - padding * 2) + padding, color(random(255), random(255), random(255))));
  // }

  // Create logical nodes
  for (let i = 0; i < nodeCount; i++) {
    logicalNodes.push(new LogicalNode(i, random(width / 2) + width / 2, random(height)));
  }

  logicalCenter = createVector(width / 2, height * 3 / 4);
}

function draw() {
  background(255);

  // Display and update nodes

  for (let node of nodes) {
    node.update();
  }

  // update edges
  for (let i = 0; i < nodes.length; i++) {
    let nodesInRange = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j && nodes[i].pos.dist(nodes[j].pos) < nodes[i].connectionRange) {
        nodesInRange.push(j);
      }
    }
    nodes[i].connectedIndices = nodesInRange;
  }

  // displaying physical nodes
  for (let node of nodes) {
    node.displayConnectionRange();
  }
  for (let node of nodes) {
    node.displayEdges();
  }
  for (let node of nodes) {
    node.displayNode();
  }

  // displaying logical nodes
  for (let node of logicalNodes) {
    node.update();
  }
  for (let node of logicalNodes) {
    node.displayEdges();
  }
  for (let node of logicalNodes) {
    node.displayNode();
  }

  // Display the edge matrix
  displayEdgeMatrix();

}


function keyPressed() {
  for (let node of nodes) {
    node.connectionRange += 5;
  }
}
