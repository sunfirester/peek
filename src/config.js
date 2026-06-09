const fs = require('fs')
const path = require('path')

function loadConfig() {
  const candidates = [
    process.env.FRIGATE_OVERLAY_CONFIG,
    path.join(process.cwd(), 'config.json'),
    path.join(__dirname, '..', 'config.json')
  ].filter(Boolean)

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    }
  }

  throw new Error('config.json not found. Copy config.example.json to config.json and edit it.')
}

module.exports = { loadConfig }
