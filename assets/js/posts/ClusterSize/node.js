const MAX_ID = 2 << 50;

class Payload {
  constructor(groupID, roundID, senderID, hopsToLeader, estimatedSize, sizeAccumulator, receiverID, radiusAccumulator, receiverMaxHopCount) {
    this.groupID = groupID;
    this.roundID = roundID;
    this.senderID = senderID;
    this.hopsToLeader = hopsToLeader;
    this.estimatedSize = estimatedSize;
    this.sizeAccumulator = sizeAccumulator;
    this.receiverID = receiverID;
    this.radiusAccumulator = radiusAccumulator;
    this.receiverMaxHopCount = receiverMaxHopCount;
  }
}

class Node {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.size = 3;
    this.maxSpeed = 1.4;
    this.velocity = p5.Vector.random2D();

    this.range = 15;
    this.seenRounds = [];
    this.maxRoundMemory = 100;
    this.mailbox = [];

    this.leader = true;
    this.groupID = int(random(MAX_ID));
    this.timeSinceLastMessage = random(30);
    this.messageInterval = 3;
    this.messageTimeout = 3 * this.messageInterval;

    this.nodeID = int(random(MAX_ID));
    this.sizeAccumulator = 0;
    this.hopsToLeader = 0;
    this.estimatedClusterSize = 1;
    this.estimatedClusterRadius = 0;
    this.sizeHistory = [];
    this.maxSizeHistory = 5;
  }

  send(payload) {
    network.createBroadcast(this.position, this.range, payload, this);
    this.recordRound(payload.roundID);
  }

  receive({ signalStrength, payload }) {
    const { groupID, roundID, senderID, hopsToLeader, estimatedSize, sizeAccumulator, receiverID, radiusAccumulator, receiverMaxHopCount } = payload;

    // merge into cluster if we run into a larger cluster (with ties broken by groupID)
    if (groupID != this.groupID) {
      const mergeIntoCluster = estimatedSize > this.estimatedClusterSize || (estimatedSize == this.estimatedClusterSize && groupID > this.groupID);
      if (!mergeIntoCluster) return;

      this.groupID = groupID;
      this.leader = false;
      this.hopsToLeader = hopsToLeader;
      this.sizeAccumulator = 1;
      this.radiusAccumulator = this.hopsToLeader;
    }

    // size reduction step
    if (receiverID == this.nodeID) {
      this.sizeAccumulator += sizeAccumulator;
    }

    // radius reduction step
    if (this.hopsToLeader < receiverMaxHopCount) {
      this.radiusAccumulator = max(this.radiusAccumulator, radiusAccumulator);
    }

    // starting a new communication round
    if (!this.hasSeenRound(roundID)) {
      this.hopsToLeader = hopsToLeader;
      this.estimatedClusterSize = estimatedSize;

      this.send(new Payload(this.groupID, roundID, this.nodeID, this.hopsToLeader + 1, estimatedSize, this.sizeAccumulator, senderID, this.radiusAccumulator, hopsToLeader));

      // reset per-round variables
      this.timeSinceLastMessage = 0;
      this.sizeAccumulator = 1;
      this.radiusAccumulator = this.hopsToLeader;
    }
  }

  hasSeenRound(roundID) {
    return this.seenRounds.includes(roundID);
  }

  recordRound(roundID) {
    this.seenRounds.push(roundID);
    if (this.seenRounds.length > this.maxRoundMemory) {
      this.seenRounds.shift();
    }
  }

  timestep() {
    this.move();
    this.timeSinceLastMessage++;

    for (const message of this.mailbox) {
      this.receive(message);
    }
    this.mailbox = [];

    if (this.leader) {
      if (this.timeSinceLastMessage > this.messageInterval) {

        // radius estimation
        this.estimatedClusterRadius = this.radiusAccumulator;

        // size estimation
        this.sizeHistory.push(this.sizeAccumulator);
        if (this.sizeHistory.length > this.maxSizeHistory) {
          this.sizeHistory.shift();
        }
        const windowOfValues = this.sizeHistory.slice(-this.estimatedClusterRadius);
        this.estimatedClusterSize = windowOfValues.reduce((a, b) => a + b, 0) / windowOfValues.length;

        // start a new round
        let roundID;
        do {
          roundID = int(random(MAX_ID));
        } while (this.hasSeenRound(roundID));

        this.send(new Payload(this.groupID, roundID, this.nodeID, 1, this.estimatedClusterSize, 0, null, 0, 0));
        this.timeSinceLastMessage = 0;
        this.sizeAccumulator = 1;
        this.radiusAccumulator = 0;
      }
    } else if (this.timeSinceLastMessage > this.messageTimeout) { // start a new cluster
      this.leader = true;
      this.hopsToLeader = 0;
      this.groupID = int(random(MAX_ID));
      this.timeSinceLastMessage = 0;
      this.sizeHistory = [1];
      this.estimatedClusterSize = 1;
      this.estimatedClusterRadius = 0;
      this.sizeAccumulator = 1;
      this.radiusAccumulator = 0;
    }
  }

  display() {
    noStroke();
    fill(this.groupID % 255, 100, 100);
    ellipse(this.position.x, this.position.y, this.size);
  }

  move() {
    const movement = boids(this).sub(this.velocity.copy().mult(0.01));
    this.velocity.add(movement);
    if (this.velocity.mag() > this.maxSpeed) {
      this.velocity.setMag(this.maxSpeed);
    }
    this.position.add(this.velocity);
  }
}
