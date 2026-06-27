'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import PdfImageCapture from '../components/PdfImageCapture';

export default function PdfParaExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'tables' | 'text'>('tables');
  const [pages, setPages] = useState('');
  const [tablesFound, setTablesFound] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF');
      return;
    }
    setFile(f);
    setError('');
    setTablesFound(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setTablesFound(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    if (pages.trim()) {
      formData.append('pages', pages.trim());
    }

    try {
      const response = await apiPost('/pdf-to-excel', formData);

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(errBody || 'Erro ao converter PDF para Excel');
      }

      const tables = parseInt(response.headers.get('X-Tables-Found') || '0');
      setTablesFound(tables);

      const blob = await response.blob();
      const baseName = file.name.replace(/\.pdf$/i, '');
      await downloadBlob(blob, `${baseName}.xlsx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao converter o PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setTablesFound(null);
    setMode('tables');
    setPages('');
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
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #10B981; }
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
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #10B981;
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
        .options-section {
          margin-top: 20px;
        }
        .options-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 10px;
        }
        .mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .mode-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--border-medium);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .mode-btn:hover {
          border-color: #10B981;
          color: var(--text-primary);
        }
        .mode-btn.active {
          background: rgba(16, 185, 129, 0.08);
          border-color: #10B981;
          color: #10B981;
        }
        .pages-input-wrap {
          position: relative;
        }
        .pages-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid var(--border-medium);
          border-radius: 12px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .pages-input:focus {
          border-color: #10B981;
        }
        .pages-input::placeholder {
          color: var(--text-tertiary);
        }
        .pages-hint {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 6px;
        }
        .btn-convert {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #10B981;
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
          background: #34D399;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
        }
        .btn-convert:disabled {
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
        .warning-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 12px;
          margin-top: 16px;
          align-items: flex-start;
        }
        .warning-box svg { width: 16px; height: 16px; color: #F59E0B; flex-shrink: 0; margin-top: 1px; }
        .warning-box p {
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
          margin-bottom: 14px;
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
        .success-detail {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 20px;
        }
        .tables-stat {
          padding: 18px;
          background: rgba(16, 185, 129, 0.08);
          border-radius: 12px;
          text-align: center;
          margin-bottom: 12px;
        }
        .tables-stat .label {
          font-size: 11px;
          color: #10B981;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tables-stat .value {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          color: #10B981;
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
          .mode-toggle { flex-direction: column; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Convertendo para Excel…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">PDF para Excel</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="page-title">PDF para Excel</h1>
            <p className="page-subtitle">Extraia tabelas do seu PDF e transforme em planilhas editáveis.</p>
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
              <div className="upload-hint">Arquivo único • Máximo 200MB</div>
            </label>

            <PdfImageCapture onPdfReady={(pdfs) => { setFile(pdfs[0]); setError(''); setTablesFound(null); }} />

            {file && (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={() => { setFile(null); setTablesFound(null); }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {file && !tablesFound && (
              <div className="options-section">
                <div className="options-label">Modo de extração</div>
                <div className="mode-toggle">
                  <button
                    className={`mode-btn ${mode === 'tables' ? 'active' : ''}`}
                    onClick={() => setMode('tables')}
                  >
                    📊 Tabelas detectadas
                  </button>
                  <button
                    className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
                    onClick={() => setMode('text')}
                  >
                    📝 Texto bruto
                  </button>
                </div>

                <div className="pages-input-wrap">
                  <input
                    type="text"
                    className="pages-input"
                    placeholder="Páginas (opcional)"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                  />
                  <div className="pages-hint">Ex: 1,3-5 • Deixe em branco para todas as páginas</div>
                </div>

                <button
                  className="btn-convert"
                  onClick={handleConvert}
                  disabled={loading}
                >
                  {loading ? 'Convertendo…' : '📄 Converter para Excel'}
                </button>
              </div>
            )}

            {!file && (
              <div className="warning-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p>Funciona melhor com PDFs digitais; PDFs escaneados exigem OCR.</p>
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

            {tablesFound !== null && (
              <div className="success-box">
                <div className="success-header">
                  <div className="success-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3>Download iniciado!</h3>
                </div>
                <p className="success-detail">Sua planilha Excel foi gerada com sucesso.</p>
                <div className="tables-stat">
                  <div className="label">{mode === 'tables' ? 'Tabelas encontradas' : 'Abas geradas'}</div>
                  <div className="value">{tablesFound}</div>
                </div>
                <button className="btn-outline" onClick={reset}>
                  ← Converter outro PDF
                </button>
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '📊', t: 'Tabelas Precisas', d: 'Detecção inteligente de tabelas' },
              { e: '📑', t: 'Múltiplas Abas', d: 'Cada tabela em sua própria aba' },
              { e: '⚡', t: 'Download Imediato', d: 'Arquivo pronto em segundos' },
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
