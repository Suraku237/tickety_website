import { useEffect, useRef, useState } from 'react';
import '../styles/queuemanager.css';

// =============================================================
// QR MODAL COMPONENT
// OOP Principle: Single Responsibility, Encapsulation
// Responsibilities:
//   - Build the join URL from the queue's join_token
//   - Render a scannable QR code via qrcodejs
//   - Provide Download PNG + Copy Link actions
//   - Trap focus & close on Escape
//
// QR Payload (scanned by the Flutter app):
//   http://<server>/api/join/<join_token>
//
// This is the EXACT URL the backend's POST /api/join/<join_token>
// endpoint expects. The Flutter app extracts the token from this
// URL and calls the backend to issue a ticket.
// =============================================================

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://109.199.120.38:5000/api';

function buildJoinUrl(queue) {
  // join_token is the UUID stored in Queue.join_token on the backend.
  // join_url is pre-built by the backend's to_dict(base_url) method.
  // We prefer join_url if present; otherwise build it ourselves.
  if (queue.join_url) return queue.join_url;
  if (queue.join_token) return `${BASE_URL}/join/${queue.join_token}`;
  return '';
}

// ── Lazy QR script loader (qrcodejs, MIT, no deps) ──────────
let _scriptLoaded = false;
let _scriptCallbacks = [];

function loadQrScript(cb) {
  if (typeof window.QRCode !== 'undefined') { cb(); return; }
  if (_scriptLoaded) { _scriptCallbacks.push(cb); return; }
  _scriptLoaded = true;
  _scriptCallbacks.push(cb);

  const script    = document.createElement('script');
  script.src      = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  script.onload   = () => { _scriptCallbacks.forEach(f => f()); _scriptCallbacks = []; };
  document.head.appendChild(script);
}

// =============================================================
export default function QrModal({ queue, onClose }) {
  const containerRef  = useRef(null);
  const qrInstanceRef = useRef(null);
  const [copied,    setCopied]    = useState(false);
  const [generated, setGenerated] = useState(false);
  const [noToken,   setNoToken]   = useState(false);

  const joinUrl = buildJoinUrl(queue);

  // ── Close on Escape ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Render QR ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    if (!joinUrl) {
      setNoToken(true);
      return;
    }

    loadQrScript(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';
      qrInstanceRef.current = new window.QRCode(containerRef.current, {
        text:         joinUrl,
        width:        220,
        height:       220,
        colorDark:    '#08060d',
        colorLight:   '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H,
      });
      setGenerated(true);
    });

    return () => {
      try { qrInstanceRef.current?.clear(); } catch (_) {}
    };
  }, [joinUrl]);

  // ── Download as PNG ───────────────────────────────────────
  const handleDownload = () => {
    const el = containerRef.current?.querySelector('img') ||
               containerRef.current?.querySelector('canvas');
    if (!el) return;

    let src;
    if (el.tagName === 'CANVAS') {
      src = el.toDataURL('image/png');
    } else {
      const canvas  = document.createElement('canvas');
      canvas.width  = 220;
      canvas.height = 220;
      canvas.getContext('2d').drawImage(el, 0, 0, 220, 220);
      src = canvas.toDataURL('image/png');
    }

    const a      = document.createElement('a');
    a.href       = src;
    a.download   = `tickety-qr-${queue.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  };

  // ── Copy join URL to clipboard ────────────────────────────
  const handleCopy = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const categoryColor =
    queue.color ??
    (queue.code?.startsWith('VIP') ? '#DC0F0F'
    : queue.code?.startsWith('PRI') ? '#F59E0B'
    : queue.code?.startsWith('MED') ? '#22C55E'
    : '#3B82F6');

  return (
    <div className="qrm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qrm-card" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="qrm-header">
          <div className="qrm-header-left">
            <p className="qrm-badge">QR CODE</p>
            <h2 className="qrm-title">{queue.name}</h2>
            <p className="qrm-service">🏢 {queue.service?.service_name ?? ''}</p>
          </div>
          <button className="qrm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* QR canvas */}
        <div className="qrm-qr-wrap">
          <div className="qrm-qr-frame">
            <div className="qrm-corner qrm-c-tl" />
            <div className="qrm-corner qrm-c-tr" />
            <div className="qrm-corner qrm-c-bl" />
            <div className="qrm-corner qrm-c-br" />

            {noToken ? (
              <div className="qrm-loading" style={{ color: '#DC0F0F', fontSize: 13, textAlign: 'center', padding: 20 }}>
                ⚠ No join token found.<br />Refresh the queue list.
              </div>
            ) : (
              <>
                <div ref={containerRef} className="qrm-canvas-host" />
                {!generated && (
                  <div className="qrm-loading">
                    <span className="auth-spinner" />
                  </div>
                )}
              </>
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

        {/* Join URL preview */}
        <div className="qrm-payload">
          <p className="qrm-payload-label">JOIN URL</p>
          <code className="qrm-payload-code">{joinUrl || '—'}</code>
        </div>

        {/* Chips */}
        <div className="qrm-chips">
          <div className="qrm-chip">
            <span className="qrm-chip-dot" style={{ background: categoryColor }} />
            {queue.code ?? 'QUEUE'}
          </div>
          <div className="qrm-chip">
            {queue.active > 0 ? `● ${queue.active} active` : '⏸ Empty'}
          </div>
          <div className="qrm-chip">
            Token: …{(queue.join_token ?? '').slice(-8)}
          </div>
        </div>

        {/* Actions */}
        <div className="qrm-actions">
          <button className="qrm-btn qrm-btn-copy" onClick={handleCopy} disabled={!joinUrl}>
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
          This QR encodes the official Tickety join URL. Customers scan it with the
          TICKETY mobile app to instantly join this queue — no manual input required.
        </p>
      </div>
    </div>
  );
}
