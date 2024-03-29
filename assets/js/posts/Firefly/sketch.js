let fireflies = [];
let numFireflies = 10;

let resetButton;
let speedUpButton;
let isSpeedUpButtonPressed = false; // This will act like button.pressed()

function setup() {
  let canvas = createCanvas(400, 400); // specify WEBGL for 3D graphics
  canvas.parent('p5-canvas-container');

  for (let i = 0; i < numFireflies; i++) {
    fireflies[i] = new Firefly();
  }

  frameRate(30);

  resetButton = new Button({
    x: width / 4, y: height - 50,
    width: 150, height: 50,
    align_x: 0, align_y: 0,
    content: 'Reset',
    on_press() {
      for (let i = 0; i < numFireflies; i++) {
        fireflies[i] = new Firefly();
      }
    }
  });

  speedUpButton = new Button({
    x: width * 3 / 4, y: height - 50,
    width: 150, height: 50,
    align_x: 0, align_y: 0,
    content: 'Fast forward',
    on_press() {
      isSpeedUpButtonPressed = true;
    },
    on_release() {
      isSpeedUpButtonPressed = false;
    }
  });
}

function draw() {
  background(255);


  let substeps = 10;
  let dt_per_frame = 0.01;
  for (let i = 0; i < substeps; i++) {
    for (let firefly of fireflies) {
      firefly.update(dt_per_frame / substeps);
    }
  }

  if (isSpeedUpButtonPressed) {
    for (let i = 0; i < substeps * 10; i++) {
      for (let firefly of fireflies) {
        firefly.update(dt_per_frame / substeps);
      }
    }
  }

  // fireflies
  for (let firefly of fireflies) {
    firefly.display();
  }

  // analysis
  drawPhases();
  // drawBuckets();

  resetButton.draw();
  speedUpButton.draw();
}

function drawPhases() {
  // angle
  let xAverage = 0;
  let yAverage = 0;

  push();
  translate(width / 2, height / 2);
  noFill();
  stroke(0);
  strokeWeight(0.5);
  // circle(0, 0, height / 2);
  line(0, -100, 0, 100);
  line(-100, 0, 100, 0);

  for (let firefly of fireflies) {
    let r = width / 2 / (abs(firefly.frequency) + 1);
    let t = firefly.theta - PI / 2;

    let x = cos(t) * r;
    let y = sin(t) * r;
    xAverage += x;
    yAverage += y;
    fill(200, 100, 100);
    noStroke();
    circle(x, y, 8);

    fill(0, 0, 0, 0);
    stroke(0);
    strokeWeight(0.1);
    circle(0, 0, r * 2);
    circle(0, -r, 4);
  }

  xAverage /= numFireflies;
  yAverage /= numFireflies;
  fill(100, 100, 200);
  noStroke();
  // circle(xAverage, yAverage, 10);
  pop();
}

function drawBuckets() {
  // intervals

  let intervalBuckets = {};
  let bucketSize = 1;
  for (let firefly of fireflies) {
    let key = int(firefly.flashInterval / bucketSize);
    intervalBuckets[key] = intervalBuckets[key] ? intervalBuckets[key] + 1 : 1;
  }

  let rectWidth = 2;

  // axis lines
  stroke(100);
  fill(10);
  for (let interval = 0; interval <= 200; interval += 40) {
    let x = interval * rectWidth;
    let y = height - 30;

    strokeWeight(1);
    line(x, y, x, y + 10);
    strokeWeight(0);
    text(interval, x, y);
  }

  // buckets
  fill(100);
  noStroke();
  for (let interval in intervalBuckets) {
    let rectHeight = intervalBuckets[interval] * 10;
    let x = interval * rectWidth;
    let y = height - rectHeight;

    rect(x, y, rectWidth, rectHeight);
  }
}
