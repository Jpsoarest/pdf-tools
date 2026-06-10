'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiPost, downloadBlob } from '../lib/api';

const FORMAT_OPTIONS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'webp', label: 'WebP' },
];

export default function QRCode() {
  const [text, setText] = useState('');
  const [format, setFormat] = useState('png');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrBlob, setQrBlob] = useState<Blob | null>(null);

  const handleGenerate = async () => {
    if (!text) return;
    setLoading(true);
    setError('');
    setQrUrl(null);
    setQrBlob(null);

    const formData = new FormData();
    formData.append('text', text);
    formData.append('format', format);

    try {
      const response = await apiPost('/qrcode', formData);

      if (!response.ok) throw new Error('Erro ao gerar QR Code');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setQrBlob(blob);
      setQrUrl(url);
    } catch {
      setError('Erro ao gerar o QR Code. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!qrBlob) return;
    await downloadBlob(qrBlob, `qrcode.${format}`);
  };

  const handleReset = () => {
    setText('');
    setQrUrl(null);
    setQrBlob(null);
    setError('');
  };

  return (
    <>
      <style>{`
        .page-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .page-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .breadcrumb a:hover { color: var(--text-primary); }
        .breadcrumb span { color: var(--border-light); }
        .breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .page-header {
          margin-bottom: 32px;
        }
        .page-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(17, 24, 39, 0.08);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #111827; }
        .page-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .page-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .input-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .text-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 12px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .text-input:focus {
          border-color: #111827;
        }
        .text-input::placeholder {
          color: var(--text-tertiary);
        }
        .field-group {
          margin-top: 18px;
        }
        .format-select {
          display: block;
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-medium);
          border-radius: 12px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s;
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%239CA3AF' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
        }
        .format-select:focus {
          outline: none;
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1);
        }
        .btn-generate {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #111827;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-generate:hover:not(:disabled) {
          background: #1F2937;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(17, 24, 39, 0.25);
        }
        .btn-generate:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .error-box {
          display: flex;
          gap: 10px;
          padding: 14px 16px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          margin-top: 16px;
          font-size: 13px;
          color: #EF4444;
          align-items: flex-start;
        }
        .error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .qr-result {
          margin-top: 20px;
          text-align: center;
        }
        .qr-preview {
          display: inline-block;
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .qr-preview img {
          display: block;
          width: 220px;
          height: 220px;
        }
        .btn-download {
          width: 100%;
          padding: 16px;
          background: #111827;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-download:hover {
          background: #1F2937;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(17, 24, 39, 0.25);
        }
        .btn-outline {
          width: 100%;
          margin-top: 12px;
          padding: 13px;
          background: transparent;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-outline:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }
        .info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(17, 24, 39, 0.04);
          border: 1px solid rgba(17, 24, 39, 0.1);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #111827; flex-shrink: 0; margin-top: 1px; }
        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .features-mini {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .feature-mini {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .feature-mini .emoji { font-size: 22px; margin-bottom: 8px; }
        .feature-mini .title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .feature-mini .desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .features-mini { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Gerando QR Code…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">QR Code</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 4v1m6 11h2m-6 0h-2m4 0v-2m0 0V8m0 4H8m4-4V4m0 0V3m-4 1v1m0 16v1m10-2v1M4 8h2m2 0h2M4 16h2m2 0h2M6 4v4m0 0v8m0 0v4" />
                <rect x="3" y="3" width="6" height="6" rx="1" strokeWidth={1.5} />
                <rect x="15" y="3" width="6" height="6" rx="1" strokeWidth={1.5} />
                <rect x="3" y="15" width="6" height="6" rx="1" strokeWidth={1.5} />
              </svg>
            </div>
            <h1 className="page-title">QR Code</h1>
            <p className="page-subtitle">Gere QR Codes para URLs, textos, WiFi e muito mais.</p>
          </div>

          <div className="card">
            {!qrUrl && (
              <>
                <div className="field-group" style={{ marginTop: 0 }}>
                  <label className="input-label">Texto ou URL</label>
                  <input
                    className="text-input"
                    type="text"
                    placeholder="https://exemplo.com ou um texto qualquer…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="input-label">Formato da imagem</label>
                  <select
                    className="format-select"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn-generate"
                  onClick={handleGenerate}
                  disabled={loading || !text}
                >
                  {loading ? 'Gerando…' : '📱 Gerar QR Code'}
                </button>
              </>
            )}

            {qrUrl && (
              <div className="qr-result">
                <div className="qr-preview">
                  <img src={qrUrl} alt="QR Code gerado" />
                </div>
                <button className="btn-download" onClick={handleDownload}>
                  Salvar {format.toUpperCase()}
                </button>
                <button className="btn-outline" onClick={handleReset}>
                  ← Gerar outro QR Code
                </button>
              </div>
            )}

            {error && (
              <div className="error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {!qrUrl && !error && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>O QR Code é gerado no servidor e entregue como imagem. Nenhum dado é armazenado.</p>
              </div>
            )}
          </div>

          <div className="features-mini">
            {[
              { e: '🖼️', t: 'PNG/JPG/WebP', d: 'Escolha o formato ideal' },
              { e: '⚡', t: 'Instantâneo', d: 'Geração em segundos' },
              { e: '🔒', t: 'Privado', d: 'Dados não são armazenados' },
            ].map((x) => (
              <div key={x.t} className="feature-mini">
                <div className="emoji">{x.e}</div>
                <div className="title">{x.t}</div>
                <div className="desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
