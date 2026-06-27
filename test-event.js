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

client.on('connect', () => {
  const prefix = config.topicPrefix || 'frigate';
  
  // Target the mock camera for MP4 streaming
  const camera = '__MOCK_CAMERA__';
  
  // This mimics the exact payload Frigate sends to the MQTT broker
  const payload = {
    type: 'new',
    after: {
      id: `test-${Date.now()}`,
      camera: camera,
      label: 'person',
      score: 0.85,
      
      // Mock bounding box: [xMin, yMin, xMax, yMax]
      // Assuming typical detect res (e.g. 1280x720), this creates a nice portrait box in the middle
      box: [ 500, 150, 750, 650 ] 
    }
  };

  console.log(`Publishing mock event for camera: ${camera}...`);
  
  client.publish(`${prefix}/events`, JSON.stringify(payload), () => {
    console.log('✅ Mock event published successfully!');
    client.end();
  });
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
  client.end();
});
