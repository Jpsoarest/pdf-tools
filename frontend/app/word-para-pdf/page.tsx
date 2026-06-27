'use client';

import { useState } from 'react';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function WordParaPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith('.docx') && !name.endsWith('.doc')) {
      setError('Selecione um arquivo Word (.docx ou .doc)');
      return;
    }
    setFile(f);
    setError('');
    setSuccess(false);
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiPost('/word-to-pdf', formData);

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(errBody || 'Erro ao converter Word para PDF');
      }

      const blob = await response.blob();
      const baseName = file.name.replace(/\.(docx|doc)$/i, '');
      await downloadBlob(blob, `${baseName}.pdf`);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao converter o documento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSuccess(false);
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
          background: rgba(139, 92, 246, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #8B5CF6; }
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
          border-color: #8B5CF6;
          background: rgba(139, 92, 246, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #8B5CF6;
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
        .btn-convert {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #8B5CF6;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-convert:hover:not(:disabled) {
          background: #A78BFA;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
        }
        .btn-convert:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 12px;
          margin-top: 16px;
          align-items: flex-start;
        }
        .info-box svg { width: 16px; height: 16px; color: #8B5CF6; flex-shrink: 0; margin-top: 1px; }
        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
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
        .success-box {
          padding: 24px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 16px;
          margin-top: 16px;
        }
        .success-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .success-check {
          width: 36px; height: 36px;
          background: #8B5CF6;
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
        .success-detail {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 20px;
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

      {loading && <LoadingSpinner message="Convertendo para PDF…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Word para PDF</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="page-title">Word para PDF</h1>
            <p className="page-subtitle">Converta documentos Word (.docx, .doc) em PDF de forma rápida e precisa.</p>
          </div>

          <div className="card">
            <label className="upload-trigger">
              <input
                type="file"
                accept=".docx,.doc"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="upload-label">Clique para selecionar um documento Word</div>
              <div className="upload-hint">Formatos .docx e .doc • Máximo 200MB</div>
            </label>

            {file && (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={() => { setFile(null); setSuccess(false); }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {file && !success && (
              <button
                className="btn-convert"
                onClick={handleConvert}
                disabled={loading}
              >
                {loading ? 'Convertendo…' : 'Converter para PDF'}
              </button>
            )}

            {!file && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Converta documentos Word (.docx, .doc) em PDF.</p>
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

            {success && (
              <div className="success-box">
                <div className="success-header">
                  <div className="success-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3>Download iniciado!</h3>
                </div>
                <p className="success-detail">Seu PDF foi gerado com sucesso.</p>
                <button className="btn-outline" onClick={reset}>
                  ← Converter outro documento
                </button>
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '🔄', t: 'Conversão Direta', d: 'Word para PDF sem etapas extras' },
              { e: '📐', t: 'Formato Preservado', d: 'Layout e formatação mantidos' },
              { e: '⚡', t: 'Download Rápido', d: 'PDF pronto em segundos' },
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
