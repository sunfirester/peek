const fs = require('fs')
const path = require('path')
const { app } = require('electron')

function prefsPath() {
  return path.join(app.getPath('userData'), 'preferences.json')
}

function readPrefs() {
  try {
    return JSON.parse(fs.readFileSync(prefsPath(), 'utf8'))
  } catch (err) {
    return {}
  }
}

function writePrefs(prefs) {
  try {
    fs.writeFileSync(prefsPath(), JSON.stringify(prefs, null, 2))
  } catch (err) {}
}

module.exports = { readPrefs, writePrefs }
