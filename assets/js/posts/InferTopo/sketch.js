let nodes = [];
let nodeCount = 10;

let logicalNodes = [];
let logicalCenter;

let touchX, touchY;
let touching = false;

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

  // update input position
  let nowTouching = false;
  if (touches.length >= 1) {
    touchX = touches[0].x;
    touchY = touches[0].y;
    nowTouching = true;
  } else if (mouseIsPressed) {
    touchX = mouseX;
    touchY = mouseY;
    nowTouching = true;
  }
  if (!nowTouching && touching) { // went from touching to not touching
    for (let node of nodes) {
      node.released();
    }
    touching = false;
  } else if (nowTouching && !touching) { // went from not touching to touching
    for (let node of nodes) {
      let d = dist(touchX, touchY, node.pos.x, node.pos.y);
      if (d < node.radius) {
        node.pressed();
        break;
      }
    }
  }

  touching = nowTouching;

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

