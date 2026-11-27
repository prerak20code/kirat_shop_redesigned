import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

// Checksum-verified 2D + 1D formats only (excludes unchecksummed ITF/Codabar
// which commonly misread random bars as different numbers on camera frames).
export const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
]

const TWO_D_FORMATS = new Set(['QR_CODE', 'DATA_MATRIX', 'AZTEC', 'PDF_417'])

/**
 * Decoupled scanner adapter interface.
 * Any hardware/source adapter emits normalized `{ code, format, source }` payloads.
 * Swap or add adapters here (e.g. Bluetooth HID/Serial or native bridge) without
 * changing page components.
 */
export function createCameraScannerAdapter({
  elementId,
  onScan,
  onError,
  onCandidate,
}) {
  let instance = null
  let running = false
  // Multi-frame consensus state for 1D barcodes so single-frame misreads are rejected
  let pending1D = { code: '', count: 0, lastAt: 0 }

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
    pending1D = { code: '', count: 0, lastAt: 0 }

    instance = new Html5Qrcode(elementId, {
      formatsToSupport: SUPPORTED_FORMATS,
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    })

    const cameraConfig = cameraIdOrConfig
      ? { deviceId: { exact: cameraIdOrConfig } }
      : { facingMode: 'environment' }

    const scanConfig = {
      fps: 15,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        // Wide landscape scan window works well for both horizontal 1D barcodes and QR codes
        const boxW = Math.min(360, Math.max(210, Math.floor(viewfinderWidth * 0.86)))
        const boxH = Math.min(240, Math.max(130, Math.floor(viewfinderHeight * 0.58)))
        return { width: boxW, height: boxH }
      },
      aspectRatio: 1.5,
      videoConstraints: {
        ...cameraConfig,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    }

    try {
      await instance.start(
        cameraIdOrConfig || { facingMode: 'environment' },
        scanConfig,
        (decodedText, decodedResult) => {
          const code = String(decodedText || '').trim()
          if (!code) return
          const format =
            decodedResult?.result?.format?.formatName || 'CODE'

          // 2D codes (QR / DataMatrix) have built-in error correction -> accept immediately
          if (TWO_D_FORMATS.has(format)) {
            pending1D = { code: '', count: 0, lastAt: 0 }
            onScan({ code, format, source: 'camera' })
            return
          }

          // 1D barcodes: require 2 matching reads within 1200ms before accepting
          const now = Date.now()
          if (pending1D.code === code && now - pending1D.lastAt <= 1200) {
            pending1D.count += 1
            pending1D.lastAt = now
          } else {
            pending1D = { code, count: 1, lastAt: now }
            if (onCandidate) onCandidate({ code, format })
          }

          if (pending1D.count >= 2) {
            pending1D = { code: '', count: 0, lastAt: 0 }
            onScan({ code, format, source: 'camera' })
          }
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
    pending1D = { code: '', count: 0, lastAt: 0 }
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
