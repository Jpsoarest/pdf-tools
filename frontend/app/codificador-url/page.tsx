'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CodificadorURL() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAction = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('text', text);
    const endpoint = mode === 'encode' ? '/url-encode' : '/url-decode';

    try {
      const res = await fetch(`/api/backend${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Erro ao ${mode === 'encode' ? 'codificar' : 'decodificar'} URL`);
      }
      const json = await res.json();
      setResult(json.result);
      setSuccess(true);
      setCopied(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Erro ao ${mode === 'encode' ? 'codificar' : 'decodificar'} URL`;
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
        .cu-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .cu-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .cu-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .cu-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .cu-breadcrumb a:hover { color: var(--text-primary); }
        .cu-breadcrumb span { color: var(--border-light); }
        .cu-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .cu-header {
          margin-bottom: 32px;
        }
        .cu-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(6, 182, 212, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
          font-size: 28px;
        }
        .cu-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .cu-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .cu-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .cu-mode-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 4px;
        }
        .cu-mode-tab {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .cu-mode-tab.active {
          background: rgba(6, 182, 212, 0.15);
          color: #06B6D4;
        }
        .cu-textarea {
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
        .cu-textarea:focus {
          border-color: #06B6D4;
        }
        .cu-textarea::placeholder {
          color: var(--text-tertiary);
        }
        .cu-btn {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #06B6D4;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cu-btn:hover:not(:disabled) {
          background: #0891B2;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(6, 182, 212, 0.25);
        }
        .cu-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .cu-result-area {
          margin-top: 20px;
        }
        .cu-result-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .cu-result-label span {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .cu-copy-btn {
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          border-radius: 8px;
          padding: 6px 14px;
          color: #06B6D4;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-body);
        }
        .cu-copy-btn:hover {
          background: #06B6D4;
          color: #fff;
          border-color: #06B6D4;
        }
        .cu-result-textarea {
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
        .cu-error-box {
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
        .cu-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .cu-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(6, 182, 212, 0.06);
          border: 1px solid rgba(6, 182, 212, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .cu-info-box svg { width: 16px; height: 16px; color: #06B6D4; flex-shrink: 0; margin-top: 1px; }
        .cu-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .cu-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .cu-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .cu-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .cu-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .cu-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .cu-features { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message={`${mode === 'encode' ? 'Codificando' : 'Decodificando'} URL...`} />}

      <div className="cu-root">
        <div className="cu-inner">
          <nav className="cu-breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="cu-breadcrumb-current">Codificador URL</span>
          </nav>

          <div className="cu-header">
            <div className="cu-icon-wrap">🔗</div>
            <h1 className="cu-title">Codificador URL</h1>
            <p className="cu-subtitle">Codifique e decodifique URLs com caracteres especiais.</p>
          </div>

          <div className="cu-card">
            <div className="cu-mode-tabs">
              <button
                className={`cu-mode-tab${mode === 'encode' ? ' active' : ''}`}
                onClick={() => { setMode('encode'); setResult(''); setSuccess(false); setError(''); }}
              >
                Codificar
              </button>
              <button
                className={`cu-mode-tab${mode === 'decode' ? ' active' : ''}`}
                onClick={() => { setMode('decode'); setResult(''); setSuccess(false); setError(''); }}
              >
                Decodificar
              </button>
            </div>

            <textarea
              className="cu-textarea"
              value={text}
              onChange={(e) => { setText(e.target.value); setResult(''); setSuccess(false); setError(''); }}
              placeholder={mode === 'encode' ? 'Digite o texto com caracteres especiais para codificar...' : 'Cole a URL codificada para decodificar...'}
            />

            <button
              className="cu-btn"
              onClick={handleAction}
              disabled={loading || !text.trim()}
            >
              {loading ? 'Processando...' : mode === 'encode' ? 'Codificar URL' : 'Decodificar URL'}
            </button>

            {error && (
              <div className="cu-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div className="cu-result-area">
                <div className="cu-result-label">
                  <span>Resultado</span>
                  <button className="cu-copy-btn" onClick={copyToClipboard}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <textarea
                  className="cu-result-textarea"
                  value={result}
                  readOnly
                />
              </div>
            )}

            {!result && !loading && (
              <div className="cu-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Insira o texto, escolha o modo e clique para codificar ou decodificar URLs com caracteres especiais.</p>
              </div>
            )}
          </div>

          <div className="cu-features">
            {[
              { e: '🔗', t: 'Encode', d: 'Converta caracteres especiais em formato seguro para URLs' },
              { e: '🔓', t: 'Decode', d: 'Converta URLs codificadas de volta ao texto original' },
              { e: '🎯', t: 'Preciso', d: 'Encoding seguindo o padrao RFC 3986' },
            ].map((x) => (
              <div key={x.t} className="cu-feature">
                <div className="cu-feature-emoji">{x.e}</div>
                <div className="cu-feature-title">{x.t}</div>
                <div className="cu-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
