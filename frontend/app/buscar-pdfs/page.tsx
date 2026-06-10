'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatBytes } from '../lib/api';

interface PageResult {
  page: number;
  occurrences: number;
  contexts: string[];
}

interface FileResult {
  filename: string;
  total_occurrences: number;
  pages: PageResult[];
}

interface SearchResult {
  query: string;
  files_searched: number;
  files_with_results: number;
  total_occurrences: number;
  results: FileResult[];
}

export default function BuscarPdfs() {
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const pdfs = selected.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length !== selected.length) {
      setError('Apenas arquivos PDF são permitidos.');
      return;
    }
    setFiles((prev) => [...prev, ...pdfs]);
    setError('');
    setResult(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleSubmit = async () => {
    if (files.length === 0 || !query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('query', query.trim());

    try {
      const res = await fetch('/api/backend/search-pdfs', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erro ao pesquisar nos PDFs');
      }

      const json: SearchResult = await res.json();
      setResult(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao pesquisar nos PDFs. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setQuery('');
    setResult(null);
    setError('');
  };

  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase()
        ? `<mark style="background:#10B98133;color:#10B981;padding:1px 3px;border-radius:3px;font-weight:600">${part}</mark>`
        : part
    ).join('');
  };

  return (
    <>
      <style>{`
        .search-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .search-inner {
          max-width: 780px;
          margin: 0 auto;
        }
        .search-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .search-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .search-breadcrumb a:hover { color: var(--text-primary); }
        .search-breadcrumb span { color: var(--border-light); }
        .search-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .search-header {
          margin-bottom: 32px;
        }
        .search-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .search-icon-wrap span { font-size: 28px; }
        .search-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .search-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .search-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .search-upload {
          border: 1.5px dashed var(--border-medium);
          border-radius: 14px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
          display: block;
          margin-bottom: 20px;
        }
        .search-upload:hover {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.03);
        }
        .search-upload-icon {
          width: 40px;
          height: 40px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 10px;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-upload-icon svg {
          width: 20px;
          height: 20px;
          color: #10B981;
        }
        .search-upload-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .search-upload-hint {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .search-file-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }
        .search-file-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
        }
        .search-file-item .search-file-icon { font-size: 18px; flex-shrink: 0; }
        .search-file-item .search-file-info { flex: 1; min-width: 0; }
        .search-file-item .search-file-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-file-item .search-file-size {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .search-file-item .search-file-remove {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          color: var(--text-tertiary);
          font-size: 14px;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .search-file-item .search-file-remove:hover {
          background: rgba(239,68,68,0.15);
          color: #EF4444;
        }
        .search-query-row {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }
        .search-query-input {
          flex: 1;
          padding: 14px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .search-query-input:focus {
          border-color: #10B981;
        }
        .search-query-input::placeholder {
          color: var(--text-tertiary);
        }
        .search-btn {
          padding: 14px 28px;
          background: #10B981;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .search-btn:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
        }
        .search-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .search-error-box {
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
        .search-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .search-result-box {
          margin-top: 16px;
        }
        .search-summary {
          padding: 16px 20px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 14px;
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }
        .search-summary-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .search-summary-value {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: #10B981;
        }
        .search-summary-label {
          font-size: 11px;
          color: var(--text-tertiary);
          font-weight: 500;
        }
        .search-file-result {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 10px;
        }
        .search-file-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .search-file-result-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .search-file-result-count {
          font-size: 12px;
          font-weight: 600;
          color: #10B981;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 10px;
          border-radius: 8px;
        }
        .search-page-item {
          border-top: 1px solid var(--border-light);
          padding: 10px 0;
        }
        .search-page-item:first-child {
          border-top: none;
          padding-top: 0;
        }
        .search-page-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .search-page-number {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .search-page-occurrences {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
        }
        .search-context-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .search-context {
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 12px;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          color: var(--text-secondary);
          line-height: 1.6;
          word-break: break-all;
        }
        .search-no-results {
          text-align: center;
          padding: 24px;
          color: var(--text-tertiary);
          font-size: 14px;
        }
        .search-reset-btn {
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
        .search-reset-btn:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }
        .search-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .search-info-box svg { width: 16px; height: 16px; color: #10B981; flex-shrink: 0; margin-top: 1px; }
        .search-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .search-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .search-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .search-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .search-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .search-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 600px) {
          .search-query-row { flex-direction: column; }
          .search-features { grid-template-columns: 1fr; }
          .search-summary { flex-direction: column; align-items: flex-start; gap: 8px; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Pesquisando nos PDFs..." />}

      <div className="search-root">
        <div className="search-inner">
          <nav className="search-breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="search-breadcrumb-current">Buscar em PDFs</span>
          </nav>

          <div className="search-header">
            <div className="search-icon-wrap">
              <span>🔎</span>
            </div>
            <h1 className="search-title">Buscar em PDFs</h1>
            <p className="search-subtitle">Pesquise termos em múltiplos PDFs simultaneamente e encontre onde aparece.</p>
          </div>

          <div className="search-card">
            {!result && (
              <>
                <label className="search-upload" style={{ display: 'block' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div className="search-upload-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="search-upload-label">Selecione um ou mais PDFs</div>
                  <div className="search-upload-hint">Múltiplos arquivos · Máximo 50MB cada</div>
                </label>

                {files.length > 0 && (
                  <div className="search-file-list">
                    {files.map((file, i) => (
                      <div key={`${file.name}-${i}`} className="search-file-item">
                        <span className="search-file-icon">📄</span>
                        <div className="search-file-info">
                          <div className="search-file-name">{file.name}</div>
                          <div className="search-file-size">{formatBytes(file.size)}</div>
                        </div>
                        <button
                          className="search-file-remove"
                          onClick={() => removeFile(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, color: 'var(--text-tertiary)', fontSize: 14 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="search-query-row">
                  <input
                    className="search-query-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Digite o termo a pesquisar..."
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                  />
                  <button
                    className="search-btn"
                    onClick={handleSubmit}
                    disabled={loading || files.length === 0 || !query.trim()}
                  >
                    {loading ? '...' : 'Buscar'}
                  </button>
                </div>

                {files.length === 0 && (
                  <div className="search-info-box">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Faça upload de um ou mais PDFs e pesquise termos em todos eles simultaneamente.</p>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="search-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div className="search-result-box">
                <div className="search-summary">
                  <div className="search-summary-stat">
                    <div className="search-summary-value">&ldquo;{result.query}&rdquo;</div>
                    <div className="search-summary-label">Termo pesquisado</div>
                  </div>
                  <div className="search-summary-stat">
                    <div className="search-summary-value">{result.total_occurrences}</div>
                    <div className="search-summary-label">Ocorrências totais</div>
                  </div>
                  <div className="search-summary-stat">
                    <div className="search-summary-value">{result.files_with_results}/{result.files_searched}</div>
                    <div className="search-summary-label">Arquivos com resultado</div>
                  </div>
                </div>

                {result.results.length > 0 ? (
                  <div>
                    {result.results.map((fr, fi) => (
                      <div key={fi} className="search-file-result">
                        <div className="search-file-result-header">
                          <span className="search-file-result-name">{fr.filename}</span>
                          <span className="search-file-result-count">
                            {fr.total_occurrences} {fr.total_occurrences === 1 ? 'ocorrência' : 'ocorrências'}
                          </span>
                        </div>
                        {fr.pages.map((page, pi) => (
                          <div key={pi} className="search-page-item">
                            <div className="search-page-header">
                              <span className="search-page-number">Página {page.page}</span>
                              <span className="search-page-occurrences">
                                {page.occurrences} {page.occurrences === 1 ? 'ocorrência' : 'ocorrências'}
                              </span>
                            </div>
                            <div className="search-context-list">
                              {page.contexts.map((ctx, ci) => (
                                <div
                                  key={ci}
                                  className="search-context"
                                  dangerouslySetInnerHTML={{ __html: '...' + highlightText(ctx, result.query) + '...' }}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="search-no-results">
                    Nenhum resultado encontrado para &ldquo;{result.query}&rdquo; nos PDFs enviados.
                  </div>
                )}

                <button className="search-reset-btn" onClick={reset}>
                  Nova pesquisa
                </button>
              </div>
            )}
          </div>

          <div className="search-features">
            {[
              { e: '📚', t: 'Múltiplos PDFs', d: 'Pesquise em vários arquivos de uma vez' },
              { e: '📋', t: 'Contexto', d: 'Veja o texto ao redor de cada ocorrência' },
              { e: '⚡', t: 'Instantâneo', d: 'Resultados rápidos com busca textual' },
            ].map((x) => (
              <div key={x.t} className="search-feature">
                <div className="search-feature-emoji">{x.e}</div>
                <div className="search-feature-title">{x.t}</div>
                <div className="search-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
