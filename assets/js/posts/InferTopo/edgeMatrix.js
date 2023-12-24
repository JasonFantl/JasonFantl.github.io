
function displayEdgeMatrix() {
  let padding = 50;
  let matrixCellSize = (width / 2 - padding * 2) / (nodeCount + 1); // Size of each cell in the matrix display

  push();
  translate(width / 2 + padding, padding); // Move to the right side of the canvas

  // edges
  for (let i = 0; i < nodeCount; i++) {
    fill(nodes[i].col);
    stroke(0);
    strokeWeight(1);
    rect(0, (i + 1) * matrixCellSize, matrixCellSize, matrixCellSize);
  }
  for (let j = 0; j < nodeCount; j++) {
    fill(nodes[j].col);
    stroke(0);
    strokeWeight(1);
    rect((j + 1) * matrixCellSize, 0, matrixCellSize, matrixCellSize);
  }

  // connections
  for (let i = 0; i < nodeCount; i++) {
    for (let j = 0; j < nodeCount; j++) {
      if (nodes[i].connectedIndices.includes(j)) {
        fill(50);
      } else {
        noFill();
      }
      stroke(0);
      strokeWeight(1);
      rect((j + 1) * matrixCellSize, (i + 1) * matrixCellSize, matrixCellSize, matrixCellSize);
    }
  }

  pop();
}