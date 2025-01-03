let clusterSizeHistory = {};
let clusterRadiusHistory = {};
let maxHistoryLength = 100;

let resetButton, graphsButton;
let displayGraphs = false;

function initializeButtons() {
    resetButton = new Button({
        x: width / 4,
        y: height - 20,
        width: 100,
        height: 30,
        align_x: 0,
        align_y: 0,
        content: 'Reset',
        on_press: initializeNetwork
    });

    graphsButton = new Button({
        x: width * 3 / 4,
        y: height - 20,
        width: 100,
        height: 30,
        align_x: 0,
        align_y: 0,
        content: 'Graphs',
        on_press: toggleGraphs
    });
}

function toggleGraphs() {
    displayGraphs = !displayGraphs;
}

function updateClusterHistories() {
    // Group nodes by groupID
    let groups = {};

    for (let node of nodes) {
        let groupID = node.groupID;
        if (!groups[groupID]) {
            groups[groupID] = {
                nodes: [],
                leaderNode: null
            };
        }
        groups[groupID].nodes.push(node);
        if (node.leader) {
            groups[groupID].leaderNode = node;
        }
    }

    // Get all groupIDs that have ever existed
    let allGroupIDs = new Set([
        ...Object.keys(clusterSizeHistory),
        ...Object.keys(groups)
    ]);

    // For each groupID, update the histories
    for (let groupID of allGroupIDs) {
        let group = groups[groupID];
        let leaderNode = group ? group.leaderNode : null;

        // Initialize histories if not present
        if (!clusterSizeHistory[groupID]) {
            clusterSizeHistory[groupID] = [];
        }
        if (!clusterRadiusHistory[groupID]) {
            clusterRadiusHistory[groupID] = [];
        }

        if (leaderNode) {
            // Estimated values from the leader
            let estimatedSize = leaderNode.estimatedClusterSize;
            let estimatedRadius = leaderNode.estimatedClusterRadius;

            // True values
            let trueSize = group.nodes.length;
            let trueRadius = Math.max(...group.nodes.map(n => n.hopsToLeader));

            // Add the values to the histories
            clusterSizeHistory[groupID].push([
                estimatedSize,
                trueSize
            ]);
            clusterRadiusHistory[groupID].push([
                estimatedRadius,
                trueRadius
            ]);
        } else {
            // Group no longer exists, add null values
            clusterSizeHistory[groupID].push([null, null]);
            clusterRadiusHistory[groupID].push([null, null]);
        }

        // Limit the length of the histories to prevent memory overflow
        if (clusterSizeHistory[groupID].length > maxHistoryLength) {
            clusterSizeHistory[groupID].shift();
        }
        if (clusterRadiusHistory[groupID].length > maxHistoryLength) {
            clusterRadiusHistory[groupID].shift();
        }

        // Remove history if all entries are null
        let sizeHistory = clusterSizeHistory[groupID];
        let allSizeNull = sizeHistory.every(
            entry => entry[0] === null && entry[1] === null
        );
        if (allSizeNull) {
            delete clusterSizeHistory[groupID];
        }

        let radiusHistory = clusterRadiusHistory[groupID];
        let allRadiusNull = radiusHistory.every(
            entry => entry[0] === null && entry[1] === null
        );
        if (allRadiusNull) {
            delete clusterRadiusHistory[groupID];
        }
    }
}


function drawPlots() {
    // Determine plot positions and sizes
    let padding = 10;
    let plotHeight = height / 8; // Height of each plot
    let plotWidth = width - padding; // Height of each plot
    let sizePlotY = 20; // Y position of the size plot
    let radiusPlotY = sizePlotY + plotHeight + padding;   // Y position of the radius plot

    // Draw size plot
    drawClusterPlot(clusterSizeHistory, 10, sizePlotY, numNodes * 1.4, plotHeight, plotWidth, 'Size');

    // Draw radius plot
    drawClusterPlot(clusterRadiusHistory, 10, radiusPlotY, 20, plotHeight, plotWidth, 'Radius');
}

function drawClusterPlot(historyData, plotX, plotY, maxY, plotHeight, plotWidth, label) {
    // Draw plot background
    fill(255);
    stroke(0);
    strokeWeight(1);
    rect(plotX, plotY, plotWidth, plotHeight);

    // Draw label
    textAlign(LEFT);
    fill(0);
    textSize(10);
    noStroke();
    text(label, plotX + 5, plotY + 10);

    strokeWeight(1);

    const maxHistoryLength = Math.max(...Object.values(historyData).map(hist => hist.length));
    const precomputedX = Array.from({ length: maxHistoryLength }, (_, i) =>
        map(i, 0, maxHistoryLength - 1, 0, plotWidth) + plotX
    );

    for (let groupID in historyData) {
        let history = historyData[groupID];
        stroke(groupID % 255, 100, 100);
        noFill();

        for (let line_index = 0; line_index < 2; line_index++) {
            strokeWeight(line_index * 0.5 + 0.5);
            beginShape();
            for (let i = 0; i < history.length; i++) {
                let x = precomputedX[i + maxHistoryLength - history.length];
                let value = history[i][line_index];
                if (value) {
                    let y = map(value, 0, maxY, plotHeight, 0) + plotY;
                    vertex(x, y);
                }
            }
            endShape();
        }
    }
}
