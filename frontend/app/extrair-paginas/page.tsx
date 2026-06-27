'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import PdfImageCapture from '../components/PdfImageCapture';

export default function ExtrairPaginas() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedCount, setExtractedCount] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF');
      return;
    }
    setFile(f);
    setError('');
    setExtractedCount(null);
  };

  const handlePagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPages(e.target.value);
    setError('');
  };

  const handleExtract = async () => {
    if (!file) return;
    if (!pages.trim()) {
      setError('Informe as paginas para extracao.');
      return;
    }

    setLoading(true);
    setError('');
    setExtractedCount(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('pages', pages.trim());

    try {
      const response = await apiPost('/extract-pages', formData);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || 'Erro ao extrair paginas');
      }

      const count = parseInt(response.headers.get('X-Extracted-Pages') || '0');
      setExtractedCount(count);

      const blob = await response.blob();
      const baseName = file.name.replace(/\.pdf$/i, '');
      await downloadBlob(blob, `${baseName}_extraido.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao extrair paginas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPages('');
    setExtractedCount(null);
  };

  const isValid = file && pages.trim().length > 0;

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
          background: rgba(236, 72, 153, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #EC4899; }
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
        .upload-trigger {
          border: 1.5px dashed var(--border-medium);
          border-radius: 14px;
          padding: 28px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
          display: block;
        }
        .upload-trigger:hover {
          border-color: #EC4899;
          background: rgba(236, 72, 153, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(236, 72, 153, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #EC4899;
        }
        .upload-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .upload-hint {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .file-selected {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          margin-top: 14px;
        }
        .file-selected .file-icon { font-size: 22px; flex-shrink: 0; }
        .file-selected .file-info { flex: 1; min-width: 0; }
        .file-selected .file-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-selected .file-size {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .file-selected .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: var(--text-tertiary);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .file-selected .remove-btn:hover {
          background: rgba(239,68,68,0.15);
          color: #EF4444;
        }
        .file-selected .remove-btn svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .pages-input-wrap {
          margin-top: 16px;
        }
        .pages-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .pages-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .pages-input:focus {
          border-color: #EC4899;
        }
        .pages-input::placeholder {
          color: var(--text-tertiary);
        }
        .btn-extract {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #EC4899;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-extract:hover:not(:disabled) {
          background: #F472B6;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(236, 72, 153, 0.25);
        }
        .btn-extract:disabled {
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
        .info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(236, 72, 153, 0.06);
          border: 1px solid rgba(236, 72, 153, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #EC4899; flex-shrink: 0; margin-top: 1px; }
        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .success-box {
          padding: 24px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 16px;
          margin-top: 16px;
        }
        .success-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .success-check {
          width: 36px; height: 36px;
          background: #10B981;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .success-check svg { width: 18px; height: 18px; color: white; }
        .success-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .success-p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 20px;
        }
        .stat-card-big {
          background: rgba(16, 185, 129, 0.08);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin-bottom: 10px;
        }
        .stat-card-big .label {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-card-big .value {
          font-family: var(--font-display);
          font-size: 40px;
          font-weight: 800;
          color: #EC4899;
        }
        .stat-card-big .sub {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 2px;
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
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .trust-item {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .trust-emoji { font-size: 22px; margin-bottom: 8px; }
        .trust-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .trust-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .trust-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Extraindo paginas…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="breadcrumb-current">Extrair Paginas</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-3-3v6m-8 4V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="page-title">Extrair Paginas</h1>
            <p className="page-subtitle">Selecione paginas especificas de um PDF e gere um novo arquivo com apenas o que importa.</p>
          </div>

          <div className="card">
            <label className="upload-trigger" style={{ display: 'block' }}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="upload-label">Clique para selecionar um PDF</div>
              <div className="upload-hint">Arquivo unico • Maximo 200MB</div>
            </label>

            <PdfImageCapture onPdfReady={(pdfs) => { setFile(pdfs[0]); setError(''); setExtractedCount(null); }} />

            {file && (
              <div className="file-selected">
                <span className="file-icon">&#x1F4C4;</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={() => { setFile(null); setExtractedCount(null); }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {file && !extractedCount && (
              <>
                <div className="pages-input-wrap">
                  <label className="pages-label">Paginas</label>
                  <input
                    className="pages-input"
                    type="text"
                    value={pages}
                    onChange={handlePagesChange}
                    placeholder="Ex: 1,3-5,7 — a ordem sera preservada"
                  />
                </div>
                <button
                  className="btn-extract"
                  onClick={handleExtract}
                  disabled={!isValid || loading}
                >
                  {loading ? 'Extraindo…' : 'Extrair Paginas'}
                </button>
              </>
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

            {!file && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>As paginas serao extraidas na ordem informada. Voce pode repetir paginas.</p>
              </div>
            )}

            {extractedCount !== null && (
              <div className="success-box">
                <div className="success-header">
                  <div className="success-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3>Paginas extraidas com sucesso!</h3>
                </div>
                <div className="stat-card-big">
                  <div className="label">Paginas extraidas</div>
                  <div className="value">{extractedCount}</div>
                  <div className="sub">O download foi iniciado automaticamente</div>
                </div>
                <button className="btn-outline" onClick={reset}>
                  Extrair outro PDF
                </button>
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '\uD83D\uDCCB', t: 'Ordem Customizada', d: 'As paginas seguem exatamente a ordem informada' },
              { e: '\uD83D\uDD04', t: 'Intervalos Flexiveis', d: 'Use intervalos como 1-5 ou paginas avulsas' },
              { e: '\u26A1', t: 'Download Rapido', d: 'Seu novo PDF em instantes' },
            ].map((x) => (
              <div key={x.t} className="trust-item">
                <div className="trust-emoji">{x.e}</div>
                <div className="trust-title">{x.t}</div>
                <div className="trust-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
