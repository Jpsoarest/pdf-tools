'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CsvJson() {
  const [text, setText] = useState('');
  const [direction, setDirection] = useState<'csv-to-json' | 'json-to-csv'>('csv-to-json');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [rows, setRows] = useState(0);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    setResult('');

    const formData = new FormData();
    formData.append('input_text', text);
    formData.append('direction', direction);

    try {
      const res = await fetch('/api/backend/csv-json', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erro ao converter os dados');
      }
      const json = await res.json();
      setResult(json.output);
      setRows(json.rows);
      setSuccess(true);
      setCopied(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao converter os dados';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const swapDirection = () => {
    setDirection(direction === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
    setResult('');
    setSuccess(false);
    setError('');
    setText('');
  };

  const placeholders: Record<string, string> = {
    'csv-to-json': 'nome,idade,cidade\nJoão,30,São Paulo\nMaria,25,Rio de Janeiro',
    'json-to-csv': '[\n  {"nome": "João", "idade": 30},\n  {"nome": "Maria", "idade": 25}\n]',
  };

  return (
    <>
      <style>{`
        .csv-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .csv-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .csv-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .csv-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .csv-breadcrumb a:hover { color: var(--text-primary); }
        .csv-breadcrumb span { color: var(--border-light); }
        .csv-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .csv-header {
          margin-bottom: 32px;
        }
        .csv-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .csv-icon-wrap svg { width: 28px; height: 28px; color: #F59E0B; }
        .csv-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .csv-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .csv-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .csv-direction-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .csv-direction-label {
          flex: 1;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .csv-direction-label.active {
          color: #F59E0B;
        }
        .csv-swap-btn {
          width: 38px;
          height: 38px;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .csv-swap-btn:hover {
          border-color: #F59E0B;
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.1);
        }
        .csv-swap-btn svg { width: 16px; height: 16px; }
        .csv-textarea {
          width: 100%;
          min-height: 160px;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          color: var(--text-primary);
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 14px;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .csv-textarea:focus {
          border-color: #F59E0B;
        }
        .csv-textarea::placeholder {
          color: var(--text-tertiary);
        }
        .csv-btn {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #F59E0B;
          color: #1a1a1a;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .csv-btn:hover:not(:disabled) {
          background: #D97706;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
        }
        .csv-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .csv-result-area {
          margin-top: 20px;
        }
        .csv-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .csv-result-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .csv-result-label span {
          margin-left: 8px;
          font-size: 11px;
          font-weight: 400;
          color: var(--text-tertiary);
        }
        .csv-copy-btn {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 8px;
          padding: 6px 14px;
          color: #F59E0B;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-body);
        }
        .csv-copy-btn:hover {
          background: #F59E0B;
          color: #1a1a1a;
          border-color: #F59E0B;
        }
        .csv-result-textarea {
          width: 100%;
          min-height: 140px;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          color: var(--text-primary);
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 14px;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        }
        .csv-error-box {
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
        .csv-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .csv-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .csv-info-box svg { width: 16px; height: 16px; color: #F59E0B; flex-shrink: 0; margin-top: 1px; }
        .csv-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .csv-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .csv-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .csv-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .csv-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .csv-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .csv-features { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message={`Convertendo ${direction === 'csv-to-json' ? 'CSV para JSON' : 'JSON para CSV'}...`} />}

      <div className="csv-root">
        <div className="csv-inner">
          <nav className="csv-breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="csv-breadcrumb-current">CSV para JSON</span>
          </nav>

          <div className="csv-header">
            <div className="csv-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h1 className="csv-title">CSV ↔ JSON</h1>
            <p className="csv-subtitle">Converta dados entre CSV e JSON bidirecionalmente.</p>
          </div>

          <div className="csv-card">
            <div className="csv-direction-bar">
              <span className={`csv-direction-label${direction === 'csv-to-json' ? ' active' : ''}`}>
                CSV → JSON
              </span>
              <button className="csv-swap-btn" onClick={swapDirection} title="Inverter direção">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
              <span className={`csv-direction-label${direction === 'json-to-csv' ? ' active' : ''}`}>
                JSON → CSV
              </span>
            </div>

            <textarea
              className="csv-textarea"
              value={text}
              onChange={(e) => { setText(e.target.value); setResult(''); setSuccess(false); setError(''); }}
              placeholder={placeholders[direction]}
            />

            <button
              className="csv-btn"
              onClick={handleConvert}
              disabled={loading || !text.trim()}
            >
              {loading ? 'Convertendo...' : direction === 'csv-to-json' ? 'CSV → JSON' : 'JSON → CSV'}
            </button>

            {error && (
              <div className="csv-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div className="csv-result-area">
                <div className="csv-result-header">
                  <span className="csv-result-label">
                    {direction === 'csv-to-json' ? 'JSON' : 'CSV'}
                    {rows > 0 && <span>{rows} {rows === 1 ? 'linha' : 'linhas'}</span>}
                  </span>
                  <button className="csv-copy-btn" onClick={copyToClipboard}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <textarea
                  className="csv-result-textarea"
                  value={result}
                  readOnly
                />
              </div>
            )}

            {!result && !loading && (
              <div className="csv-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>
                  {direction === 'csv-to-json'
                    ? 'Cole seus dados CSV, defina a direção e converta para JSON formatado.'
                    : 'Cole seu JSON (array de objetos), defina a direção e converta para CSV.'}
                </p>
              </div>
            )}
          </div>

          <div className="csv-features">
            {[
              { e: '📊', t: 'CSV → JSON', d: 'Converta planilhas CSV em JSON' },
              { e: '📋', t: 'JSON → CSV', d: 'Converta JSON para CSV tabular' },
              { e: '🔁', t: 'Bidirecional', d: 'Conversão nos dois sentidos' },
            ].map((x) => (
              <div key={x.t} className="csv-feature">
                <div className="csv-feature-emoji">{x.e}</div>
                <div className="csv-feature-title">{x.t}</div>
                <div className="csv-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
