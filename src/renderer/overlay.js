import { VideoRTC } from './vendor/video-rtc.js'

customElements.define('video-stream', VideoRTC)

const LABELS = {
  person: ['🧍', 'Person'],
  car: ['🚗', 'Car'],
  motorcycle: ['🏍️', 'Motorcycle'],
  bicycle: ['🚲', 'Bicycle'],
  dog: ['🐕', 'Dog'],
  cat: ['🐈', 'Cat'],
  bird: ['🐦', 'Bird'],
  package: ['📦', 'Package']
}

const card = document.getElementById('card')
const timerBar = document.getElementById('timer-bar')
const camEl = document.getElementById('cam')
const badgeEl = document.getElementById('badge')
const scoreEl = document.getElementById('score')
const infoEl = document.getElementById('info')
const videoBox = document.getElementById('video')
const poster = document.getElementById('poster')
const closeBtn = document.getElementById('close')

let activeId = null
let activeStreamUrl = null
let activeClickUrl = null
let stream = null
let dismissTimer = null
let timerAnimation = null

function showTimerBarActive() {
  if (timerAnimation) { timerAnimation.cancel(); timerAnimation = null }
  timerBar.style.transform = 'scaleX(1)'
  timerBar.style.background = 'rgba(220, 60, 60, 0.85)'
  timerBar.style.opacity = '1'
}

function startTimerBar(seconds) {
  if (timerAnimation) timerAnimation.cancel()
  timerBar.style.background = 'rgba(255, 255, 255, 0.75)'
  timerBar.style.opacity = '1'
  timerAnimation = timerBar.animate(
    [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
    { duration: seconds * 1000, easing: 'linear', fill: 'forwards' }
  )
}

function resetTimerBar() {
  if (timerAnimation) { timerAnimation.cancel(); timerAnimation = null }
  timerBar.style.opacity = '0'
  timerBar.style.transform = ''
  timerBar.style.background = ''
}

function labelText(label) {
  const entry = LABELS[label]
  return entry ? `${entry[0]} ${entry[1]}` : label
}

function updateCrop(event) {
  if (!stream || !event.cropToObject || !event.boxRelative) {
    if (stream) {
      stream.style.transition = 'transform 0.1s ease-out'
      stream.style.transform = ''
    }
    return
  }
  
  const boxW = event.boxRelative[2] - event.boxRelative[0]
  const boxH = event.boxRelative[3] - event.boxRelative[1]
  const cx = (event.boxRelative[0] + event.boxRelative[2]) / 2
  const cy = (event.boxRelative[1] + event.boxRelative[3]) / 2

  if (boxW <= 0 || boxH <= 0) return

  // Pad the bounding box so it fills 50% of the screen instead of being tightly cropped
  const idealScaleX = 1 / (boxW * 2.0)
  const idealScaleY = 1 / (boxH * 2.0)
  const idealScale = Math.min(idealScaleX, idealScaleY)
  
  // Cap the zoom factor between 1x and 4x
  const S = Math.max(1, Math.min(4, idealScale))

  // Calculate the maximum relative translation to prevent exposing black edges
  const maxTx = (S - 1) / (2 * S)
  const maxTy = (S - 1) / (2 * S)

  let relX = 0.5 - cx
  let relY = 0.5 - cy

  // Clamp the translation so the camera stops panning precisely at the edge of the frame
  relX = Math.max(-maxTx, Math.min(maxTx, relX))
  relY = Math.max(-maxTy, Math.min(maxTy, relY))

  stream.style.transition = 'transform 0.1s ease-out'
  stream.style.transformOrigin = '50% 50%'
  stream.style.transform = `scale(${S}) translate(${relX * 100}%, ${relY * 100}%)`
}

function applyVideoSettings(event, muted) {
  if (!stream) return
  if (stream.video) {
    stream.video.muted = muted
    stream.video.controls = false
    stream.video.disableRemotePlayback = true
    stream.video.addEventListener('playing', () => {
      poster.style.opacity = '0'
      const videoWidth = stream.video.videoWidth
      const videoHeight = stream.video.videoHeight
      if (videoWidth && videoHeight) {
        // ALWAYS preserve native aspect ratio for the window
        const ratio = videoWidth / videoHeight
        const newWidth = Math.round(window.innerHeight * ratio)
        window.overlay.resize(newWidth, window.innerHeight)
        
        stream.style.width = '100%'
        stream.style.height = '100%'
        stream.style.maxWidth = 'none'
        stream.style.position = 'absolute'
        stream.style.left = '0'
        stream.style.top = '0'
        
        updateCrop(event)
      }
    }, { once: true })
  } else {
    requestAnimationFrame(() => applyVideoSettings(event, muted))
  }
}

function startStream(event, muted) {
  stopStream()
  if (event.streamUrl === '__MOCK_IMAGE__') {
    stream = document.createElement('div')
    stream.style.backgroundImage = 'url("https://picsum.photos/id/237/1280/720")'
    stream.style.backgroundSize = '100% 100%'
    stream.style.zIndex = '1'
    
    stream.video = document.createElement('div')
    stream.video.videoWidth = 1280
    stream.video.videoHeight = 720
    stream.video.style = {}
    stream.video.addEventListener = (evt, cb) => {
      if (evt === 'playing') setTimeout(() => cb(), 100)
    }
  } else {
    stream = document.createElement('video-stream')
    stream.background = true
    stream.mode = 'webrtc,mse'
    stream.src = event.streamUrl
  }
  videoBox.appendChild(stream)
  applyVideoSettings(event, muted)
}

function stopStream() {
  if (stream) {
    if (stream.ondisconnect) stream.ondisconnect()
    stream.remove()
    stream = null
  }
}

function render(event) {
  camEl.textContent = event.name
  badgeEl.textContent = labelText(event.label)
  scoreEl.textContent = Math.round(event.score * 100) + '%'

  const extras = []
  if (event.subLabel) extras.push('👤 ' + event.subLabel)
  if (event.plate) extras.push('🔢 ' + event.plate)
  if (event.zones && event.zones.length) extras.push('📍 ' + event.zones.join(', '))
  infoEl.textContent = extras.join('   ')
  infoEl.style.display = extras.length ? 'block' : 'none'
  
  if (stream && stream.video && stream.video.videoWidth) {
    updateCrop(event)
  }
}

function show(event) {
  clearTimeout(dismissTimer)
  activeId = event.id
  activeClickUrl = event.clickUrl || null
  card.classList.toggle('clickable', !!activeClickUrl)
  render(event)
  showTimerBarActive()
  if (stream && event.streamUrl === activeStreamUrl && card.classList.contains('show')) return
  if (event.poster) {
    poster.style.opacity = '1'
    poster.src = event.poster + (event.poster.includes('?') ? '&' : '?') + 't=' + Date.now()
  } else {
    poster.style.opacity = '0'
    poster.removeAttribute('src')
  }
  activeStreamUrl = event.streamUrl
  startStream(event, !event.sound)
  card.classList.remove('hidden')
  requestAnimationFrame(() => card.classList.add('show'))
}

function hide() {
  clearTimeout(dismissTimer)
  resetTimerBar()
  activeId = null
  activeStreamUrl = null
  activeClickUrl = null
  card.classList.remove('clickable')
  card.classList.remove('show')
  setTimeout(() => {
    stopStream()
    card.classList.add('hidden')
    window.overlay.hide()
  }, 320)
}

window.overlay.onEvent((event) => {
  if (event.type === 'new') {
    show(event)
  } else if (event.type === 'update' && event.id === activeId) {
    render(event)
  } else if (event.type === 'end' && event.id === activeId) {
    render(event)
    if (event.dismiss > 0) {
      dismissTimer = setTimeout(hide, event.dismiss * 1000)
      startTimerBar(event.dismiss)
    }
  }
})

closeBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  hide()
})

card.addEventListener('click', () => {
  if (activeClickUrl) window.overlay.openUrl(activeClickUrl)
})
