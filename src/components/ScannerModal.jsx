import { useEffect, useRef, useState } from 'react'
import {
  createCameraScannerAdapter,
  normalizeManualScan,
  playScanBeep,
} from '../services/scannerAdapter'

const VIEWPORT_ID = 'parts-ledger-scanner-viewport'

export default function ScannerModal({
  open,
  title = 'Scan QR or Barcode',
  subtitle = 'Point your phone or webcam at the box QR code or 1D barcode.',
  mode = 'single', // 'single' | 'continuous'
  lastFeedback = null, // { tone: 'ok' | 'warn' | 'err', text: string }
  onScan,
  onClose,
}) {
  const adapterRef = useRef(null)
  const onScanRef = useRef(onScan)
  const onCloseRef = useRef(onClose)
  const lastCodeRef = useRef({ code: '', at: 0 })

  const [cameras, setCameras] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [cameraState, setCameraState] = useState('starting') // starting | active | error
  const [cameraError, setCameraError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    lastCodeRef.current = { code: '', at: 0 }

    const handleDetected = (payload) => {
      const now = Date.now()
      if (
        payload.source === 'camera' &&
        lastCodeRef.current.code === payload.code &&
        now - lastCodeRef.current.at < 1400
      ) {
        return
      }
      lastCodeRef.current = { code: payload.code, at: now }

      const result = onScanRef.current?.(payload)
      if (soundEnabled) {
        playScanBeep(result === 'unknown' ? 'unknown' : 'ok')
      }
      if (mode === 'single') {
        onCloseRef.current?.()
      }
    }

    const adapter = createCameraScannerAdapter({
      elementId: VIEWPORT_ID,
      onScan: handleDetected,
      onError: (msg) => {
        if (!cancelled) {
          setCameraState('error')
          setCameraError(msg)
        }
      },
    })
    adapterRef.current = adapter

    async function boot() {
      setCameraState('starting')
      setCameraError('')
      const list = await adapter.listCameras()
      if (cancelled) return
      setCameras(list)

      let target = selectedCameraId
      if (!target && list.length > 0) {
        const rear = list.find((c) =>
          /back|rear|environment/i.test(c.label || '')
        )
        target = rear ? rear.id : list[0].id
        setSelectedCameraId(target)
      }

      try {
        await adapter.start(target || undefined)
        if (!cancelled) setCameraState('active')
      } catch (err) {
        if (!cancelled) {
          setCameraState('error')
          setCameraError(
            err?.message ||
              'Camera permission denied or no camera available. You can still type or scan with a USB scanner below.'
          )
        }
      }
    }

    boot()

    return () => {
      cancelled = true
      adapter.stop()
      adapterRef.current = null
    }
  }, [open, mode, selectedCameraId, soundEnabled])

  if (!open) return null

  function submitManual(e) {
    e.preventDefault()
    const payload = normalizeManualScan(manualCode, 'manual')
    if (!payload) return
    const result = onScanRef.current?.(payload)
    if (soundEnabled) {
      playScanBeep(result === 'unknown' ? 'unknown' : 'ok')
    }
    setManualCode('')
    if (mode === 'single') {
      onCloseRef.current?.()
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
    >
      <div className="modal-card scanner-modal">
        <div className="modal-head">
          <div>
            <span className="modal-kicker">
              {mode === 'continuous' ? 'CONTINUOUS CHECKOUT SCANNER' : 'SINGLE CODE SCANNER'}
            </span>
            <h3 id="scanner-modal-title">{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        <div className="scanner-toolbar">
          {cameras.length > 0 && (
            <div className="scanner-camera-select">
              <label htmlFor="scannerCameraSelect">Camera</label>
              <select
                id="scannerCameraSelect"
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
              >
                {cameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            className={`scanner-toggle ${soundEnabled ? 'is-on' : ''}`}
            onClick={() => setSoundEnabled((s) => !s)}
          >
            {soundEnabled ? 'Sound: On' : 'Sound: Off'}
          </button>
        </div>

        <div className="scanner-stage">
          <div id={VIEWPORT_ID} className="scanner-viewport" />
          {cameraState === 'active' && (
            <div className="scanner-reticle" aria-hidden="true">
              <span className="reticle-corner tl" />
              <span className="reticle-corner tr" />
              <span className="reticle-corner bl" />
              <span className="reticle-corner br" />
            </div>
          )}
          {cameraState === 'starting' && (
            <div className="scanner-overlay-msg">Starting camera…</div>
          )}
          {cameraState === 'error' && (
            <div className="scanner-overlay-msg is-error">
              <strong>Camera unavailable</strong>
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {lastFeedback && (
          <div className={`scanner-feedback tone-${lastFeedback.tone || 'ok'}`}>
            {lastFeedback.text}
          </div>
        )}

        <form className="scanner-manual-form" onSubmit={submitManual}>
          <label htmlFor="scannerManualCode">
            USB / Bluetooth scanner gun or manual code entry
          </label>
          <div className="scanner-manual-row">
            <input
              id="scannerManualCode"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Scan with gun or type barcode / QR value (e.g. 811330920247)"
              autoFocus
            />
            <button type="submit" className="quick-action quick-action-primary">
              Apply code
            </button>
          </div>
        </form>

        <div className="modal-foot">
          <span className="modal-foot-note">
            Supports QR codes &amp; 1D barcodes (EAN-13, Code 128, UPC, Code 39)
          </span>
          <button
            type="button"
            className="quick-action quick-action-secondary"
            onClick={onClose}
          >
            {mode === 'continuous' ? 'Done scanning' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
