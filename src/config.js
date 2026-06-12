const fs = require('fs')
const path = require('path')
const { app } = require('electron')

function configPath() {
  return path.join(app.getPath('userData'), 'config.json')
}

function candidatePaths() {
  return [
    process.env.FRIGATE_OVERLAY_CONFIG,
    configPath(),
    path.join(process.cwd(), 'config.json'),
    path.join(__dirname, '..', 'config.json')
  ].filter(Boolean)
}

function findConfig() {
  for (const file of candidatePaths()) {
    if (fs.existsSync(file)) return file
  }
  return null
}

function loadConfig() {
  const file = findConfig()
  if (!file) {
    throw new Error('config.json not found. Copy config.example.json to config.json and edit it.')
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function readConfig() {
  try {
    return loadConfig()
  } catch (err) {
    return null
  }
}

function saveConfig(data) {
  fs.writeFileSync(configPath(), JSON.stringify(data, null, 2))
}

module.exports = { loadConfig, readConfig, saveConfig, configPath, findConfig }
