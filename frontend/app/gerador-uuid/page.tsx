'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const VERSIONS = [
  { value: 'v4', label: 'v4 (Aleatorio)' },
  { value: 'v1', label: 'v1 (Timestamp)' },
  { value: 'v7', label: 'v7 (Ordenavel)' },
];

export default function GeradorUUID() {
  const [version, setVersion] = useState('v4');
  const [count, setCount] = useState(5);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('version', version);
    formData.append('count', count.toString());

    try {
      const res = await fetch('/api/backend/uuid', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erro ao gerar UUIDs');
      }
      const json = await res.json();
      setResults(json.results);
      setSuccess(true);
      setCopied(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar UUIDs';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (results.length === 0) return;
    const text = results.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
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

  const copyOne = async (uuid: string) => {
    try {
      await navigator.clipboard.writeText(uuid);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = uuid;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  return (
    <>
      <style>{`
        .gu-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .gu-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .gu-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .gu-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .gu-breadcrumb a:hover { color: var(--text-primary); }
        .gu-breadcrumb span { color: var(--border-light); }
        .gu-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .gu-header {
          margin-bottom: 32px;
        }
        .gu-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
          font-size: 28px;
        }
        .gu-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .gu-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .gu-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .gu-options {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .gu-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .gu-option-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .gu-select {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }
        .gu-select:focus {
          border-color: #10B981;
        }
        .gu-input {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          width: 100%;
        }
        .gu-input:focus {
          border-color: #10B981;
        }
        .gu-btn {
          width: 100%;
          margin-top: 4px;
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
        .gu-btn:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
        }
        .gu-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .gu-results-area {
          margin-top: 20px;
        }
        .gu-results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .gu-results-count {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .gu-copy-all-btn {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          padding: 6px 14px;
          color: #10B981;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-body);
        }
        .gu-copy-all-btn:hover {
          background: #10B981;
          color: #fff;
          border-color: #10B981;
        }
        .gu-uuid-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .gu-uuid-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          transition: background 0.15s;
        }
        .gu-uuid-row:hover {
          background: var(--bg-tertiary);
        }
        .gu-uuid-index {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
          min-width: 24px;
          text-align: right;
          flex-shrink: 0;
        }
        .gu-uuid-text {
          flex: 1;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 13px;
          color: var(--text-primary);
          word-break: break-all;
          min-width: 0;
        }
        .gu-uuid-copy {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.15s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .gu-uuid-copy:hover {
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
        }
        .gu-uuid-copy svg { width: 14px; height: 14px; }
        .gu-error-box {
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
        .gu-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .gu-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .gu-info-box svg { width: 16px; height: 16px; color: #10B981; flex-shrink: 0; margin-top: 1px; }
        .gu-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .gu-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .gu-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .gu-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .gu-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .gu-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .gu-features { grid-template-columns: 1fr; }
          .gu-options { flex-direction: column; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Gerando UUIDs..." />}

      <div className="gu-root">
        <div className="gu-inner">
          <nav className="gu-breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="gu-breadcrumb-current">Gerador de UUID</span>
          </nav>

          <div className="gu-header">
            <div className="gu-icon-wrap">🆔</div>
            <h1 className="gu-title">Gerador de UUID</h1>
            <p className="gu-subtitle">Gere identificadores unicos universais (UUID/GUID) nas versoes v1, v4 e v7.</p>
          </div>

          <div className="gu-card">
            <div className="gu-options">
              <div className="gu-option">
                <span className="gu-option-label">Versao</span>
                <select
                  className="gu-select"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                >
                  {VERSIONS.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="gu-option">
                <span className="gu-option-label">Quantidade</span>
                <input
                  type="number"
                  className="gu-input"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= 100) setCount(v); }}
                />
              </div>
            </div>

            <button
              className="gu-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? 'Gerando...' : 'Gerar UUIDs'}
            </button>

            {error && (
              <div className="gu-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {results.length > 0 && (
              <div className="gu-results-area">
                <div className="gu-results-header">
                  <span className="gu-results-count">{results.length} UUID{results.length !== 1 ? 's' : ''} gerado{results.length !== 1 ? 's' : ''}</span>
                  <button className="gu-copy-all-btn" onClick={copyAll}>
                    {copied ? 'Copiado!' : 'Copiar todos'}
                  </button>
                </div>
                <div className="gu-uuid-list">
                  {results.map((uuid, i) => (
                    <div key={i} className="gu-uuid-row">
                      <span className="gu-uuid-index">{i + 1}</span>
                      <span className="gu-uuid-text">{uuid}</span>
                      <button className="gu-uuid-copy" onClick={() => copyOne(uuid)} title="Copiar">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length === 0 && !loading && (
              <div className="gu-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Escolha a versao e a quantidade de UUIDs que deseja gerar, depois clique em Gerar UUIDs.</p>
              </div>
            )}
          </div>

          <div className="gu-features">
            {[
              { e: '🔢', t: 'v1/v4/v7', d: 'Suporte as versoes baseadas em timestamp, aleatoria e ordenavel' },
              { e: '📦', t: 'Em lote', d: 'Gere ate 100 UUIDs de uma so vez' },
              { e: '🔒', t: 'Privado', d: 'Seus dados nao sao armazenados apos o processamento' },
            ].map((x) => (
              <div key={x.t} className="gu-feature">
                <div className="gu-feature-emoji">{x.e}</div>
                <div className="gu-feature-title">{x.t}</div>
                <div className="gu-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
