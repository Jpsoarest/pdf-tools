'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

interface DiffLine {
  line: string;
}

interface DiffResult {
  diff: DiffLine[];
  lines: number;
}

export default function DiffTexto() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DiffResult | null>(null);

  const handleCompare = async () => {
    if (!text1 || !text2) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('text1', text1);
    formData.append('text2', text2);

    try {
      const response = await fetch('/api/backend/diff', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro ao comparar textos');

      const data: DiffResult = await response.json();
      setResult(data);
    } catch {
      setError('Erro ao comparar os textos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getLineStyle = (line: string): string => {
    if (line.startsWith('+')) return 'diff-added';
    if (line.startsWith('-')) return 'diff-removed';
    if (line.startsWith('@@')) return 'diff-hunk';
    return '';
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
          max-width: 900px;
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
          background: rgba(245, 158, 11, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #F59E0B; }
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
        .diff-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .diff-column {
          display: flex;
          flex-direction: column;
        }
        .diff-column-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .diff-textarea {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 12px;
          font-family: monospace;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          resize: vertical;
          min-height: 200px;
          line-height: 1.6;
        }
        .diff-textarea:focus {
          border-color: #F59E0B;
        }
        .diff-textarea::placeholder {
          color: var(--text-tertiary);
        }
        .btn-compare {
          width: 100%;
          padding: 16px;
          background: #F59E0B;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-compare:hover:not(:disabled) {
          background: #FBBF24;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
        }
        .btn-compare:disabled {
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
        .results-card {
          margin-top: 16px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          box-shadow: var(--shadow-sm);
        }
        .results-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .results-icon {
          width: 36px; height: 36px;
          background: #F59E0B;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .results-icon svg { width: 18px; height: 18px; color: white; }
        .results-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .diff-output {
          background: #1e1e1e;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 16px;
          max-height: 500px;
          overflow: auto;
          font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.7;
          color: #d4d4d4;
        }
        .diff-output pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .diff-line-added {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
          display: block;
          padding: 0 8px;
          border-radius: 3px;
        }
        .diff-line-removed {
          background: rgba(239, 68, 68, 0.15);
          color: #EF4444;
          display: block;
          padding: 0 8px;
          border-radius: 3px;
        }
        .diff-line-hunk {
          color: #6366F1;
          font-weight: 600;
          display: block;
        }
        .diff-line-neutral {
          display: block;
          color: #9CA3AF;
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
        @media (max-width: 640px) {
          .diff-columns { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .features-mini { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Comparando textos…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Diff de Texto</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h1 className="page-title">Diff de Texto</h1>
            <p className="page-subtitle">Compare dois textos e veja as diferenças linha por linha.</p>
          </div>

          <div className="card">
            <div className="diff-columns">
              <div className="diff-column">
                <label className="diff-column-label">Texto Original</label>
                <textarea
                  className="diff-textarea"
                  placeholder="Cole o texto original…"
                  value={text1}
                  onChange={(e) => setText1(e.target.value)}
                />
              </div>
              <div className="diff-column">
                <label className="diff-column-label">Texto Modificado</label>
                <textarea
                  className="diff-textarea"
                  placeholder="Cole o texto modificado…"
                  value={text2}
                  onChange={(e) => setText2(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn-compare"
              onClick={handleCompare}
              disabled={loading || !text1 || !text2}
            >
              {loading ? 'Comparando…' : '↔️ Comparar Textos'}
            </button>

            {error && (
              <div className="error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          {result && (
            <div className="results-card">
              <div className="results-header">
                <div className="results-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3>{result.lines} {result.lines === 1 ? 'linha no diff' : 'linhas no diff'}</h3>
              </div>
              <div className="diff-output">
                <pre>
                  {result.diff.map((d, i) => {
                    const style = getLineStyle(d.line);
                    return (
                      <span
                        key={i}
                        className={
                          style === 'diff-added' ? 'diff-line-added' :
                          style === 'diff-removed' ? 'diff-line-removed' :
                          style === 'diff-hunk' ? 'diff-line-hunk' : 'diff-line-neutral'
                        }
                      >
                        {d.line}{'\n'}
                      </span>
                    );
                  })}
                </pre>
              </div>
              <button className="btn-outline" onClick={() => setResult(null)}>
                ← Nova comparação
              </button>
            </div>
          )}

          <div className="features-mini">
            {[
              { e: '🎯', t: 'Preciso', d: 'Diferenças exatas linha a linha' },
              { e: '📋', t: 'Linha a linha', d: 'Formato unificado style' },
              { e: '⚡', t: 'Instantâneo', d: 'Resultado em segundos' },
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
