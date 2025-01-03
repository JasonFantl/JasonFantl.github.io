let network;
let numNodes = 300;
let nodes = [];

function setup() {
  let canvas = createCanvas(500, 400);
  canvas.parent('p5-canvas-container');

  colorMode(HSB);
  frameRate(30);

  initializeButtons();
  initializeNetwork();
}

function initializeNetwork() {
  network = new Network();
  nodes = Array.from({ length: numNodes }, () => new Node(random(width), random(height)));
}

function draw() {
  background(0, 0, 255);

  network.timestep();
  nodes.forEach(node => node.timestep());
  network.broadcasts.forEach(broadcast => broadcast.display());
  nodes.forEach(node => node.display());

  updateClusterHistories();
  if (displayGraphs) drawPlots();

  resetButton.draw();
  graphsButton.draw();
}
