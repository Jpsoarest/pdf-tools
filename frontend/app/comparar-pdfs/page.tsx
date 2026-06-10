'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatBytes } from '../lib/api';

interface PageDiff {
  page: number;
  differences: number;
  diff: string[];
}

interface CompareResult {
  file1_pages: number;
  file2_pages: number;
  pages_compared: number;
  page_differences: PageDiff[];
  total_differences: number;
}

export default function CompararPdfs() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF');
      return;
    }
    if (slot === 1) setFile1(f);
    else setFile2(f);
    setError('');
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!file1 || !file2) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);

    try {
      const res = await fetch('/api/backend/compare-pdfs', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erro ao comparar os PDFs');
      }

      const json: CompareResult = await res.json();
      setResult(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao comparar os PDFs. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile1(null);
    setFile2(null);
    setResult(null);
    setError('');
  };

  return (
    <>
      <style>{`
        .comp-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .comp-inner {
          max-width: 780px;
          margin: 0 auto;
        }
        .comp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .comp-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .comp-breadcrumb a:hover { color: var(--text-primary); }
        .comp-breadcrumb span { color: var(--border-light); }
        .comp-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .comp-header {
          margin-bottom: 32px;
        }
        .comp-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .comp-icon-wrap svg { width: 28px; height: 28px; color: #8B5CF6; }
        .comp-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .comp-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .comp-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .comp-uploads {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .comp-upload-box {
          border: 1.5px dashed var(--border-medium);
          border-radius: 14px;
          padding: 24px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
          display: block;
        }
        .comp-upload-box:hover {
          border-color: #8B5CF6;
          background: rgba(139, 92, 246, 0.03);
        }
        .comp-upload-box.has-file {
          border-style: solid;
          border-color: var(--border-light);
          background: var(--bg-tertiary);
          text-align: left;
          padding: 14px 16px;
        }
        .comp-upload-icon {
          width: 40px;
          height: 40px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 10px;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .comp-upload-icon svg {
          width: 20px;
          height: 20px;
          color: #8B5CF6;
        }
        .comp-upload-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .comp-upload-hint {
          font-size: 11px;
          color: var(--text-tertiary);
        }
        .comp-file-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .comp-file-size {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .comp-file-remove {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          color: var(--text-tertiary);
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
          transition: all 0.15s;
        }
        .comp-file-remove:hover {
          background: rgba(239,68,68,0.15);
          color: #EF4444;
        }
        .comp-btn {
          width: 100%;
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
        .comp-btn:hover:not(:disabled) {
          background: #7C3AED;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
        }
        .comp-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .comp-error-box {
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
        .comp-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .comp-result-box {
          margin-top: 16px;
          padding: 24px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 16px;
        }
        .comp-result-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        .comp-stat {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 14px 12px;
          text-align: center;
        }
        .comp-stat-value {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          color: #8B5CF6;
          line-height: 1.1;
          margin-bottom: 4px;
        }
        .comp-stat-label {
          font-size: 11px;
          color: var(--text-tertiary);
          font-weight: 500;
        }
        .comp-diff-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .comp-diff-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px;
        }
        .comp-diff-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .comp-diff-page {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .comp-diff-count {
          font-size: 12px;
          font-weight: 600;
          color: #8B5CF6;
          background: rgba(139, 92, 246, 0.1);
          padding: 4px 10px;
          border-radius: 8px;
        }
        .comp-diff-preview {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .comp-diff-line {
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 12px;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          color: var(--text-secondary);
          line-height: 1.5;
          word-break: break-all;
        }
        .comp-no-diffs {
          text-align: center;
          padding: 20px;
          color: var(--text-tertiary);
          font-size: 14px;
        }
        .comp-reset-btn {
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
        .comp-reset-btn:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }
        .comp-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .comp-info-box svg { width: 16px; height: 16px; color: #8B5CF6; flex-shrink: 0; margin-top: 1px; }
        .comp-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .comp-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .comp-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .comp-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .comp-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .comp-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 600px) {
          .comp-uploads { grid-template-columns: 1fr; }
          .comp-result-stats { grid-template-columns: 1fr; }
          .comp-features { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Comparando PDFs..." />}

      <div className="comp-root">
        <div className="comp-inner">
          <nav className="comp-breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="comp-breadcrumb-current">Comparar PDFs</span>
          </nav>

          <div className="comp-header">
            <div className="comp-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <h1 className="comp-title">Comparar PDFs</h1>
            <p className="comp-subtitle">Compare dois PDFs página a página e encontre diferenças no texto.</p>
          </div>

          <div className="comp-card">
            {!result && (
              <>
                <div className="comp-uploads">
                  <label className={`comp-upload-box${file1 ? ' has-file' : ''}`}>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 1)}
                      style={{ display: 'none' }}
                    />
                    {!file1 ? (
                      <>
                        <div className="comp-upload-icon">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="comp-upload-label">PDF Original</div>
                        <div className="comp-upload-hint">Clique para selecionar</div>
                      </>
                    ) : (
                      <>
                        <div className="comp-file-name">{file1.name}</div>
                        <div className="comp-file-size">{formatBytes(file1.size)}</div>
                        <button
                          className="comp-file-remove"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile1(null); setResult(null); }}
                        >
                          Remover
                        </button>
                      </>
                    )}
                  </label>

                  <label className={`comp-upload-box${file2 ? ' has-file' : ''}`}>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 2)}
                      style={{ display: 'none' }}
                    />
                    {!file2 ? (
                      <>
                        <div className="comp-upload-icon">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="comp-upload-label">PDF Modificado</div>
                        <div className="comp-upload-hint">Clique para selecionar</div>
                      </>
                    ) : (
                      <>
                        <div className="comp-file-name">{file2.name}</div>
                        <div className="comp-file-size">{formatBytes(file2.size)}</div>
                        <button
                          className="comp-file-remove"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile2(null); setResult(null); }}
                        >
                          Remover
                        </button>
                      </>
                    )}
                  </label>
                </div>

                <button
                  className="comp-btn"
                  onClick={handleSubmit}
                  disabled={loading || !file1 || !file2}
                >
                  {loading ? 'Comparando...' : 'Comparar PDFs'}
                </button>

                {!file1 && !file2 && (
                  <div className="comp-info-box">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Selecione dois arquivos PDF para comparar o conteúdo textual página a página.</p>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="comp-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div className="comp-result-box">
                <div className="comp-result-stats">
                  <div className="comp-stat">
                    <div className="comp-stat-value">{result.file1_pages}</div>
                    <div className="comp-stat-label">Páginas — PDF 1</div>
                  </div>
                  <div className="comp-stat">
                    <div className="comp-stat-value">{result.file2_pages}</div>
                    <div className="comp-stat-label">Páginas — PDF 2</div>
                  </div>
                  <div className="comp-stat">
                    <div className="comp-stat-value">{result.total_differences}</div>
                    <div className="comp-stat-label">Diferenças totais</div>
                  </div>
                </div>

                {result.page_differences.length > 0 ? (
                  <div className="comp-diff-list">
                    {result.page_differences.map((pd) => (
                      <div key={pd.page} className="comp-diff-item">
                        <div className="comp-diff-header">
                          <span className="comp-diff-page">Página {pd.page}</span>
                          <span className="comp-diff-count">{pd.differences} {pd.differences === 1 ? 'diferença' : 'diferenças'}</span>
                        </div>
                        <div className="comp-diff-preview">
                          {pd.diff.map((line, i) => (
                            <div key={i} className="comp-diff-line">{line}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="comp-no-diffs">
                    Nenhuma diferença textual encontrada entre os PDFs.
                  </div>
                )}

                <button className="comp-reset-btn" onClick={reset}>
                  Comparar outros PDFs
                </button>
              </div>
            )}
          </div>

          <div className="comp-features">
            {[
              { e: '📝', t: 'Texto', d: 'Comparação precisa do conteúdo textual' },
              { e: '📄', t: 'Página a página', d: 'Resultados organizados por página' },
              { e: '🎯', t: 'Preciso', d: 'Detecta até as menores diferenças' },
            ].map((x) => (
              <div key={x.t} className="comp-feature">
                <div className="comp-feature-emoji">{x.e}</div>
                <div className="comp-feature-title">{x.t}</div>
                <div className="comp-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
