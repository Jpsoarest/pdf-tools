'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Base64() {
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
    const endpoint = mode === 'encode' ? '/base64-encode' : '/base64-decode';

    try {
      const res = await fetch(`/api/backend${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Erro ao ${mode === 'encode' ? 'codificar' : 'decodificar'}`);
      }
      const json = await res.json();
      setResult(json.result);
      setSuccess(true);
      setCopied(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Erro ao ${mode === 'encode' ? 'codificar' : 'decodificar'}`;
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

  const clear = () => {
    setText('');
    setResult('');
    setError('');
    setSuccess(false);
  };

  return (
    <>
      <style>{`
        .b64-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .b64-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .b64-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .b64-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .b64-breadcrumb a:hover { color: var(--text-primary); }
        .b64-breadcrumb span { color: var(--border-light); }
        .b64-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .b64-header {
          margin-bottom: 32px;
        }
        .b64-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
          font-size: 28px;
        }
        .b64-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .b64-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .b64-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .b64-mode-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 4px;
        }
        .b64-mode-tab {
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
        .b64-mode-tab.active {
          background: rgba(245, 158, 11, 0.15);
          color: #F59E0B;
        }
        .b64-textarea {
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
        .b64-textarea:focus {
          border-color: #F59E0B;
        }
        .b64-textarea::placeholder {
          color: var(--text-tertiary);
        }
        .b64-btn {
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
        .b64-btn:hover:not(:disabled) {
          background: #D97706;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
        }
        .b64-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .b64-result-area {
          margin-top: 20px;
        }
        .b64-result-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .b64-result-label span {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .b64-copy-btn {
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
        .b64-copy-btn:hover {
          background: #F59E0B;
          color: #1a1a1a;
          border-color: #F59E0B;
        }
        .b64-result-textarea {
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
        .b64-error-box {
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
        .b64-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .b64-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .b64-info-box svg { width: 16px; height: 16px; color: #F59E0B; flex-shrink: 0; margin-top: 1px; }
        .b64-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .b64-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .b64-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .b64-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .b64-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .b64-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .b64-features { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message={`${mode === 'encode' ? 'Codificando' : 'Decodificando'} Base64...`} />}

      <div className="b64-root">
        <div className="b64-inner">
          <nav className="b64-breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="b64-breadcrumb-current">Base64</span>
          </nav>

          <div className="b64-header">
            <div className="b64-icon-wrap">🔣</div>
            <h1 className="b64-title">Base64</h1>
            <p className="b64-subtitle">Codifique e decodifique texto em Base64.</p>
          </div>

          <div className="b64-card">
            <div className="b64-mode-tabs">
              <button
                className={`b64-mode-tab${mode === 'encode' ? ' active' : ''}`}
                onClick={() => { setMode('encode'); setResult(''); setSuccess(false); setError(''); }}
              >
                Codificar
              </button>
              <button
                className={`b64-mode-tab${mode === 'decode' ? ' active' : ''}`}
                onClick={() => { setMode('decode'); setResult(''); setSuccess(false); setError(''); }}
              >
                Decodificar
              </button>
            </div>

            <textarea
              className="b64-textarea"
              value={text}
              onChange={(e) => { setText(e.target.value); setResult(''); setSuccess(false); setError(''); }}
              placeholder={mode === 'encode' ? 'Digite o texto para codificar em Base64...' : 'Cole o texto em Base64 para decodificar...'}
            />

            <button
              className="b64-btn"
              onClick={handleAction}
              disabled={loading || !text.trim()}
            >
              {loading ? 'Processando...' : mode === 'encode' ? 'Codificar para Base64' : 'Decodificar de Base64'}
            </button>

            {error && (
              <div className="b64-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div className="b64-result-area">
                <div className="b64-result-label">
                  <span>Resultado</span>
                  <button className="b64-copy-btn" onClick={copyToClipboard}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <textarea
                  className="b64-result-textarea"
                  value={result}
                  readOnly
                />
              </div>
            )}

            {!result && !loading && (
              <div className="b64-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Insira o texto, escolha o modo e clique para codificar ou decodificar em Base64.</p>
              </div>
            )}
          </div>

          <div className="b64-features">
            {[
              { e: '⚡', t: 'Rapido', d: 'Processamento instantaneo dos dados' },
              { e: '🎯', t: 'Preciso', d: 'Encoding/decoding seguindo o padrao RFC 4648' },
              { e: '🔒', t: 'Privado', d: 'Seus dados nao sao armazenados apos o processamento' },
            ].map((x) => (
              <div key={x.t} className="b64-feature">
                <div className="b64-feature-emoji">{x.e}</div>
                <div className="b64-feature-title">{x.t}</div>
                <div className="b64-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
