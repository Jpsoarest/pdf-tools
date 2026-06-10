'use client';

import { useState } from 'react';
import { getApiUrl } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface ValidationResult {
  well_formed: boolean;
  error?: string;
  error_line?: number;
  error_col?: number;
}

export default function ValidarXML() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.xml')) {
      setError('Selecione um arquivo XML');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
    handleValidate(f);
  };

  const handleValidate = async (f: File) => {
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', f);

    try {
      const response = await fetch(getApiUrl('/validate-xml'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao validar XML');
      }

      const data: ValidationResult = await response.json();
      setResult(data);
    } catch {
      setError('Erro ao validar o XML. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const fmt = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + s[i];
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
          background: rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #6366F1; }
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
          border-color: #6366F1;
          background: rgba(99, 102, 241, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #6366F1;
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
        .result-container {
          margin-top: 20px;
          text-align: center;
        }
        .result-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }
        .result-check {
          width: 80px;
          height: 80px;
          background: #10B981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .result-check svg {
          width: 40px;
          height: 40px;
          color: white;
          stroke-width: 3;
        }
        .result-fail {
          width: 80px;
          height: 80px;
          background: #EF4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .result-fail svg {
          width: 40px;
          height: 40px;
          color: white;
          stroke-width: 3;
        }
        .result-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .result-msg {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .result-success {
          padding: 24px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 16px;
          text-align: center;
        }
        .result-error-box {
          padding: 24px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 16px;
          text-align: center;
        }
        .error-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 16px;
        }
        .error-detail-card {
          background: var(--bg-tertiary);
          border-radius: 12px;
          padding: 14px;
        }
        .error-detail-card .label {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .error-detail-card .value {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .error-detail-full {
          grid-column: 1 / -1;
          background: var(--bg-tertiary);
          border-radius: 12px;
          padding: 14px;
          text-align: left;
        }
        .error-detail-full .label {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .error-detail-full .value {
          font-family: monospace;
          font-size: 13px;
          color: #EF4444;
          line-height: 1.5;
          word-break: break-all;
        }
        .btn-outline {
          width: 100%;
          margin-top: 16px;
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
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #6366F1; flex-shrink: 0; margin-top: 1px; }
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
          .error-detail-grid { grid-template-columns: 1fr; }
          .error-detail-full { grid-column: auto; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Validando seu XML…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Validar XML</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="page-title">Validar XML</h1>
            <p className="page-subtitle">Verifique se seu arquivo XML está bem formado e livre de erros estruturais.</p>
          </div>

          <div className="card">
            <label className="upload-trigger" style={{ display: 'block' }}>
              <input
                type="file"
                accept=".xml"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="upload-label">Clique para selecionar um XML</div>
              <div className="upload-hint">Arquivo único • Validação estrutural</div>
            </label>

            {file && (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{fmt(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={() => { setFile(null); setResult(null); }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {!file && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>A validação é feita no navegador. Nenhum dado é enviado ou armazenado em servidores.</p>
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

            {result && result.well_formed && (
              <div className="result-success">
                <div className="result-icon-wrap">
                  <div className="result-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="result-title">XML Válido!</div>
                <div className="result-msg">
                  O arquivo <strong>{file?.name}</strong> está bem formado e não contém erros estruturais.
                </div>
                <button className="btn-outline" onClick={reset}>
                  ← Validar outro XML
                </button>
              </div>
            )}

            {result && !result.well_formed && (
              <div className="result-error-box">
                <div className="result-icon-wrap">
                  <div className="result-fail">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="result-title" style={{ color: '#EF4444' }}>XML Inválido</div>
                <div className="result-msg">
                  O arquivo <strong>{file?.name}</strong> contém erros estruturais.
                </div>
                <div className="error-detail-grid">
                  {(result.error_line !== undefined || result.error_col !== undefined) && (
                    <>
                      {result.error_line !== undefined && (
                        <div className="error-detail-card">
                          <div className="label">Linha do Erro</div>
                          <div className="value">{result.error_line}</div>
                        </div>
                      )}
                      {result.error_col !== undefined && (
                        <div className="error-detail-card">
                          <div className="label">Coluna do Erro</div>
                          <div className="value">{result.error_col}</div>
                        </div>
                      )}
                    </>
                  )}
                  {result.error && (
                    <div className="error-detail-full">
                      <div className="label">Detalhes do Erro</div>
                      <div className="value">{result.error}</div>
                    </div>
                  )}
                </div>
                <button className="btn-outline" onClick={reset}>
                  ← Validar outro XML
                </button>
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '🔍', t: 'Validação Estrutural', d: 'Verifica a sintaxe completa do XML' },
              { e: '📋', t: 'Erros Detalhados', d: 'Indica linha e coluna do problema' },
              { e: '⚡', t: 'Resposta Rápida', d: 'Resultado em milissegundos' },
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
