const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

// Read the global Peek config from AppData
const configPath = path.join(process.env.APPDATA, 'Peek', 'config.json');
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error("Could not read Peek config.json from AppData.");
  process.exit(1);
}

const client = mqtt.connect(config.mqtt);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function simulateSequence(client, prefix, camera, label, startBox, endBox, durationMs, steps, delayBeforeStart = 0) {
  await sleep(delayBeforeStart);
  const eventId = `test-${camera}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const sendEvent = (type, box) => {
    const payload = {
      type: type,
      after: {
        id: eventId,
        camera: camera,
        label: label,
        score: 0.85,
        box: box
      }
    };
    client.publish(`${prefix}/events`, JSON.stringify(payload));
  };

  console.log(`[${camera}] Started new event (${label})`);
  sendEvent('new', startBox);

  // Send updates to simulate movement
  for (let i = 1; i <= steps; i++) {
    await sleep(durationMs / steps);
    const progress = i / steps;
    const currentBox = [
      Math.round(startBox[0] + (endBox[0] - startBox[0]) * progress),
      Math.round(startBox[1] + (endBox[1] - startBox[1]) * progress),
      Math.round(startBox[2] + (endBox[2] - startBox[2]) * progress),
      Math.round(startBox[3] + (endBox[3] - startBox[3]) * progress)
    ];
    sendEvent('update', currentBox);
  }

  // Send end event
  await sleep(durationMs / steps);
  sendEvent('end', endBox);
  console.log(`[${camera}] Ended event (${label})`);
}

client.on('connect', async () => {
  console.log('Connected to MQTT. Starting dynamic sequences...');
  const prefix = config.topicPrefix || 'frigate';
  
  // 1. Person on the doorbell, moving left to right
  const s1 = simulateSequence(
    client, prefix, 
    'doorbell', 'person', 
    [100, 100, 400, 600],  // start box
    [800, 100, 1100, 600], // end box
    5000,  // 5 seconds total
    25,    // 25 updates (5/sec)
    0      // start immediately
  );

  // 2. Car on the front_duo, moving right to left
  const s2 = simulateSequence(
    client, prefix, 
    'front_duo', 'car', 
    [300, 150, 400, 250], 
    [50, 150, 150, 250], 
    8000, 
    40,   
    0      // start immediately
  );
  
  // 3. Dog on the doorbell, appearing a bit later
  const s3 = simulateSequence(
    client, prefix, 
    'doorbell', 'dog', 
    [200, 300, 250, 350], 
    [100, 300, 150, 350], 
    4000, 
    20, 
    0      // start immediately
  );

  // 4. Second car on the front duo to trigger the 4-window limit
  const s4 = simulateSequence(
    client, prefix, 
    'front_duo', 'car', 
    [100, 200, 200, 300], 
    [250, 200, 350, 300], 
    6000, 
    30, 
    0      // start immediately
  );
  
  // 5. Package drop-off to push past the 4-window limit and trigger the indicator
  const s5 = simulateSequence(
    client, prefix, 
    'doorbell', 'package', 
    [150, 250, 250, 350], 
    [150, 250, 250, 350], 
    6000, 
    5, 
    0      // start immediately
  );

  await Promise.all([s1, s2, s3, s4, s5]);
  console.log('✅ All dynamic mock sequences completed!');
  client.end();
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
  client.end();
});
