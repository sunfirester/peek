const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const mqtt = require('mqtt')
const { loadConfig } = require('./config')

let win = null
let config = null

function httpToWs(url) {
  return url.replace(/^http/, 'ws')
}

function streamUrl(camera) {
  return `${httpToWs(config.frigateUrl)}/live/webrtc/api/ws?src=${encodeURIComponent(camera)}`
}

function prettyName(camera) {
  if (config.cameras && config.cameras[camera]) return config.cameras[camera]
  return camera.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function overlaySize() {
  return { width: config.width || 380, height: config.height || 300 }
}

function positionWindow() {
  const area = screen.getPrimaryDisplay().workArea
  const { width, height } = overlaySize()
  const margin = config.margin != null ? config.margin : 24
  const corner = config.corner || 'top-right'
  let x = area.x + area.width - width - margin
  let y = area.y + margin
  if (corner.includes('left')) x = area.x + margin
  if (corner.includes('bottom')) y = area.y + area.height - height - margin
  win.setBounds({ x, y, width, height })
}

function createWindow() {
  const { width, height } = overlaySize()
  win = new BrowserWindow({
    width,
    height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  positionWindow()
}

function handleEvent(data) {
  const after = data.after || data.before
  if (!after || !after.label) return

  const labels = config.labels || []
  if (labels.length && !labels.includes(after.label)) return

  const cameras = config.cameras || {}
  if (Object.keys(cameras).length && !cameras[after.camera]) return

  const score = Math.max(after.score || 0, after.top_score || 0)
  const minScore = config.minScore != null ? config.minScore : 0.6
  if (data.type === 'new' && score < minScore) return

  const subLabel = Array.isArray(after.sub_label) ? after.sub_label[0] : after.sub_label
  const event = {
    id: after.id,
    type: data.type,
    name: prettyName(after.camera),
    label: after.label,
    score,
    subLabel: subLabel || null,
    plate: after.recognized_license_plate || null,
    zones: after.entered_zones || [],
    streamUrl: streamUrl(after.camera),
    dismiss: config.dismissSeconds != null ? config.dismissSeconds : 8
  }

  if (!win) return
  if (data.type === 'new') {
    positionWindow()
    win.showInactive()
  }
  win.webContents.send('frigate-event', event)
}

function startMqtt() {
  const prefix = config.topicPrefix || 'frigate'
  const client = mqtt.connect(config.mqtt, { reconnectPeriod: 3000 })
  client.on('connect', () => client.subscribe(`${prefix}/events`))
  client.on('message', (topic, payload) => {
    let data
    try {
      data = JSON.parse(payload.toString())
    } catch (err) {
      return
    }
    handleEvent(data)
  })
}

app.whenReady().then(() => {
  config = loadConfig()
  createWindow()
  ipcMain.on('overlay-hide', () => {
    if (win) win.hide()
  })
  startMqtt()
})

app.on('window-all-closed', () => {})
