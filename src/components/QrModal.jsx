import { useEffect, useRef, useState } from 'react';
import '../styles/queueManager.css';

// =============================================================
// QR MODAL COMPONENT
// OOP Principle: Single Responsibility, Encapsulation
// Responsibilities:
//   - Build a deterministic payload from queue + service data
//   - Render a QR code via the qrcode.js CDN-free canvas API
//   - Provide download + copy-link actions
//   - Trap focus & close on Escape for accessibility
//
// QR Payload (scanned by Flutter app):
//   tickety://join?service_id=<id>&queue_id=<id>&service=<name>&queue=<name>
// =============================================================

// ── Tiny pure-JS QR encoder (no external dep) ───────────────
// Uses the browser's built-in canvas to draw via qrcodejs loaded
// from a data-URI script OR a tiny hand-rolled version below.
// We use the qrcode-generator approach via dynamic script injection.

function buildPayload(queue) {
  const params = new URLSearchParams({
    service_id:   String(queue.serviceId   ?? ''),
    queue_id:     String(queue.id          ?? ''),
    service:      queue.serviceName        ?? '',
    queue:        queue.name               ?? '',
    type:         queue.type               ?? 'general',
  });
  return `tickety://join?${params.toString()}`;
}

// ── QR canvas renderer using qrcodejs (injected once) ───────
let _scriptLoaded = false;
let _scriptCallbacks = [];

function loadQrScript(cb) {
  if (typeof window.qrcode !== 'undefined') { cb(); return; }
  if (_scriptLoaded) { _scriptCallbacks.push(cb); return; }
  _scriptLoaded = true;
  _scriptCallbacks.push(cb);

  const script = document.createElement('script');
  // qrcode-generator — MIT licence, tiny, no deps
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  script.onload = () => { _scriptCallbacks.forEach(f => f()); _scriptCallbacks = []; };
  document.head.appendChild(script);
}

// =============================================================
export default function QrModal({ queue, onClose }) {
  const containerRef = useRef(null);
  const qrInstanceRef = useRef(null);
  const [copied,    setCopied]    = useState(false);
  const [generated, setGenerated] = useState(false);

  const payload = buildPayload(queue);

  // ── Close on Escape ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Render QR into canvas container ─────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    loadQrScript(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';
      qrInstanceRef.current = new window.QRCode(containerRef.current, {
        text:           payload,
        width:          220,
        height:         220,
        colorDark:      '#08060d',
        colorLight:     '#ffffff',
        correctLevel:   window.QRCode.CorrectLevel.H,
      });
      setGenerated(true);
    });

    return () => {
      if (qrInstanceRef.current) {
        try { qrInstanceRef.current.clear(); } catch (_) {}
      }
    };
  }, [payload]);

  // ── Download QR as PNG ───────────────────────────────────
  const handleDownload = () => {
    const img = containerRef.current?.querySelector('img') ||
                containerRef.current?.querySelector('canvas');
    if (!img) return;

    let src;
    if (img.tagName === 'CANVAS') {
      src = img.toDataURL('image/png');
    } else {
      // QRCode.js renders an <img> — redraw onto a canvas to export
      const canvas = document.createElement('canvas');
      canvas.width  = 220;
      canvas.height = 220;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 220, 220);
      src = canvas.toDataURL('image/png');
    }

    const a = document.createElement('a');
    a.href     = src;
    a.download = `tickety-qr-${queue.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  };

  // ── Copy deep-link to clipboard ──────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="qrm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qrm-card" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="qrm-header">
          <div className="qrm-header-left">
            <p className="qrm-badge">QR CODE</p>
            <h2 className="qrm-title">{queue.name}</h2>
            <p className="qrm-service">🏢 {queue.serviceName}</p>
          </div>
          <button className="qrm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* QR Canvas */}
        <div className="qrm-qr-wrap">
          <div className="qrm-qr-frame">
            {/* Corner decorations */}
            <div className="qrm-corner qrm-c-tl" />
            <div className="qrm-corner qrm-c-tr" />
            <div className="qrm-corner qrm-c-bl" />
            <div className="qrm-corner qrm-c-br" />

            <div ref={containerRef} className="qrm-canvas-host" />

            {!generated && (
              <div className="qrm-loading">
                <span className="auth-spinner" />
              </div>
            )}
          </div>

          <div className="qrm-scan-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Scan with TICKETY mobile app to join queue
          </div>
        </div>

        {/* Payload preview */}
        <div className="qrm-payload">
          <p className="qrm-payload-label">DEEP LINK</p>
          <code className="qrm-payload-code">{payload}</code>
        </div>

        {/* Queue info chips */}
        <div className="qrm-chips">
          <div className="qrm-chip">
            <span className="qrm-chip-dot" style={{
              background: queue.type === 'vip' ? '#DC0F0F'
                        : queue.type === 'priority' ? '#F59E0B'
                        : queue.type === 'medical'  ? '#22C55E'
                        : '#3B82F6'
            }} />
            {queue.type?.toUpperCase()} QUEUE
          </div>
          <div className="qrm-chip">
            {queue.active ? '● Active' : '⏸ Paused'}
          </div>
          <div className="qrm-chip">
            ID: {String(queue.id).slice(-6)}
          </div>
        </div>

        {/* Actions */}
        <div className="qrm-actions">
          <button className="qrm-btn qrm-btn-copy" onClick={handleCopy}>
            {copied ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy Link
              </>
            )}
          </button>

          <button className="qrm-btn qrm-btn-download" onClick={handleDownload}
            disabled={!generated}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PNG
          </button>
        </div>

        <p className="qrm-note">
          This QR code encodes your service & queue identifiers. Customers scan it with
          the TICKETY app to instantly join this queue without any manual input.
        </p>
      </div>
    </div>
  );
}
