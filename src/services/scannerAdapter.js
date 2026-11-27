import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

// Supported QR + 1D retail/automotive barcode formats
export const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
]

/**
 * Decoupled scanner adapter interface.
 * Any hardware/source adapter emits normalized `{ code, format, source }` payloads.
 * Swap or add adapters here (e.g. Bluetooth HID/Serial or native bridge) without
 * changing page components.
 */
export function createCameraScannerAdapter({ elementId, onScan, onError }) {
  let instance = null
  let running = false

  async function listCameras() {
    try {
      const devices = await Html5Qrcode.getCameras()
      return devices || []
    } catch {
      return []
    }
  }

  async function start(cameraIdOrConfig) {
    await stop()
    instance = new Html5Qrcode(elementId, {
      formatsToSupport: SUPPORTED_FORMATS,
      verbose: false,
    })

    const cameraConfig = cameraIdOrConfig
      ? cameraIdOrConfig
      : { facingMode: 'environment' }

    const scanConfig = {
      fps: 12,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
        const boxW = Math.min(320, Math.max(190, Math.floor(viewfinderWidth * 0.78)))
        const boxH = Math.min(240, Math.max(150, Math.floor(minEdge * 0.68)))
        return { width: boxW, height: boxH }
      },
      aspectRatio: 1.4,
    }

    try {
      await instance.start(
        cameraConfig,
        scanConfig,
        (decodedText, decodedResult) => {
          const code = String(decodedText || '').trim()
          if (!code) return
          const format =
            decodedResult?.result?.format?.formatName || 'CODE'
          onScan({ code, format, source: 'camera' })
        },
        () => {
          // Ignore per-frame decode misses
        }
      )
      running = true
    } catch (err) {
      running = false
      const message =
        err?.message ||
        (typeof err === 'string' ? err : 'Could not access camera.')
      if (onError) onError(message)
      throw err
    }
  }

  async function stop() {
    if (!instance) return
    try {
      if (running) {
        await instance.stop()
      }
    } catch {
      // Ignore stop errors if already stopped
    }
    try {
      instance.clear()
    } catch {
      // Ignore clear errors
    }
    running = false
    instance = null
  }

  return {
    listCameras,
    start,
    stop,
    isRunning: () => running,
  }
}

/**
 * Keyboard-wedge / USB & Bluetooth scanner gun helper.
 * Normalizes manual or gun-typed submissions into the same scan event shape.
 */
export function normalizeManualScan(rawCode, source = 'manual') {
  const code = String(rawCode || '').trim()
  if (!code) return null
  return { code, format: 'INPUT', source }
}

/**
 * Lightweight Web Audio confirmation beep (supermarket checkout feel, no external audio assets).
 */
let audioCtx = null
export function playScanBeep(tone = 'ok') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    if (!audioCtx) audioCtx = new AudioCtx()
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }

    const now = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)

    if (tone === 'unknown') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.setValueAtTime(380, now + 0.08)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.start(now)
      osc.stop(now + 0.19)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1040, now)
      gain.gain.setValueAtTime(0.09, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)
      osc.start(now)
      osc.stop(now + 0.12)
    }
  } catch {
    // Audio feedback is strictly best-effort
  }
}
