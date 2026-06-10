'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const ALGORITHMS = [
  { value: 'md5', label: 'MD5' },
  { value: 'sha1', label: 'SHA-1' },
  { value: 'sha256', label: 'SHA-256' },
  { value: 'sha512', label: 'SHA-512' },
  { value: 'blake2b', label: 'BLAKE2b' },
];

export default function GeradorHash() {
  const [text, setText] = useState('');
  const [algorithm, setAlgorithm] = useState('sha256');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('text', text);
    formData.append('algorithm', algorithm);

    try {
      const res = await fetch('/api/backend/hash', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erro ao gerar hash');
      }
      const json = await res.json();
      setResult(json.result);
      setSuccess(true);
      setCopied(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar hash';
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

  return (
    <>
      <style>{`
        .gh-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .gh-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .gh-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .gh-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .gh-breadcrumb a:hover { color: var(--text-primary); }
        .gh-breadcrumb span { color: var(--border-light); }
        .gh-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .gh-header {
          margin-bottom: 32px;
        }
        .gh-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
          font-size: 28px;
        }
        .gh-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .gh-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .gh-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .gh-textarea {
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
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .gh-textarea:focus {
          border-color: #6366F1;
        }
        .gh-textarea::placeholder {
          color: var(--text-tertiary);
        }
        .gh-select-row {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .gh-select-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .gh-select {
          flex: 1;
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
        .gh-select:focus {
          border-color: #6366F1;
        }
        .gh-btn {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #6366F1;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gh-btn:hover:not(:disabled) {
          background: #4F46E5;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
        }
        .gh-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .gh-result-area {
          margin-top: 20px;
        }
        .gh-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .gh-result-algo {
          font-size: 12px;
          font-weight: 600;
          color: #6366F1;
          background: rgba(99, 102, 241, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .gh-copy-btn {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          padding: 6px 14px;
          color: #6366F1;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-body);
        }
        .gh-copy-btn:hover {
          background: #6366F1;
          color: #fff;
          border-color: #6366F1;
        }
        .gh-result-box {
          width: 100%;
          min-height: 60px;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          color: var(--text-primary);
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 14px;
          word-break: break-all;
          line-height: 1.6;
        }
        .gh-error-box {
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
        .gh-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .gh-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .gh-info-box svg { width: 16px; height: 16px; color: #6366F1; flex-shrink: 0; margin-top: 1px; }
        .gh-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .gh-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .gh-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .gh-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .gh-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .gh-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .gh-features { grid-template-columns: 1fr; }
          .gh-select-row { flex-direction: column; align-items: stretch; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Gerando hash..." />}

      <div className="gh-root">
        <div className="gh-inner">
          <nav className="gh-breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="gh-breadcrumb-current">Gerador de Hash</span>
          </nav>

          <div className="gh-header">
            <div className="gh-icon-wrap">#️⃣</div>
            <h1 className="gh-title">Gerador de Hash</h1>
            <p className="gh-subtitle">Gere hashes criptograficos MD5, SHA-1, SHA-256, SHA-512 e BLAKE2b.</p>
          </div>

          <div className="gh-card">
            <textarea
              className="gh-textarea"
              value={text}
              onChange={(e) => { setText(e.target.value); setResult(''); setSuccess(false); setError(''); }}
              placeholder="Digite o texto para gerar o hash..."
            />

            <div className="gh-select-row">
              <span className="gh-select-label">Algoritmo</span>
              <select
                className="gh-select"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
              >
                {ALGORITHMS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <button
              className="gh-btn"
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
            >
              {loading ? 'Gerando...' : 'Gerar Hash'}
            </button>

            {error && (
              <div className="gh-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div className="gh-result-area">
                <div className="gh-result-header">
                  <span className="gh-result-algo">{ALGORITHMS.find(a => a.value === algorithm)?.label || algorithm.toUpperCase()}</span>
                  <button className="gh-copy-btn" onClick={copyToClipboard}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <div className="gh-result-box">{result}</div>
              </div>
            )}

            {!result && !loading && (
              <div className="gh-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Insira o texto, selecione o algoritmo e clique em Gerar Hash para obter o resultado.</p>
              </div>
            )}
          </div>

          <div className="gh-features">
            {[
              { e: '🔢', t: 'Multiplos algoritmos', d: 'Suporte a MD5, SHA-1, SHA-256, SHA-512 e BLAKE2b' },
              { e: '⚡', t: 'Instantaneo', d: 'Resultado gerado em milissegundos' },
              { e: '🔒', t: 'Privado', d: 'Seus dados nao sao armazenados apos o processamento' },
            ].map((x) => (
              <div key={x.t} className="gh-feature">
                <div className="gh-feature-emoji">{x.e}</div>
                <div className="gh-feature-title">{x.t}</div>
                <div className="gh-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
