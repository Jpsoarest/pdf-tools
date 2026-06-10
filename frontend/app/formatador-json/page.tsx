'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

type JsonAction = 'format' | 'minify' | 'validate';

export default function FormatadorJSON() {
  const [jsonText, setJsonText] = useState('');
  const [action, setAction] = useState<JsonAction>('format');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keysCount, setKeysCount] = useState<number | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleAction = async () => {
    if (!jsonText.trim()) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    setKeysCount(null);
    setIsValid(null);

    const formData = new FormData();
    formData.append('json_text', jsonText);
    formData.append('action', action);

    try {
      const res = await fetch('/api/backend/json-tool', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Erro ao ${action === 'format' ? 'formatar' : action === 'minify' ? 'minificar' : 'validar'} JSON`);
      }
      const json = await res.json();
      setOutput(json.output);
      setSuccess(true);
      setCopied(false);
      if (action === 'validate') {
        setIsValid(json.valid);
        setKeysCount(json.keys_count ?? null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar JSON';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = output;
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

  const actionLabel = action === 'format' ? 'Formatado' : action === 'minify' ? 'Minificado' : 'Validado';

  return (
    <>
      <style>{`
        .fj-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .fj-inner {
          max-width: 780px;
          margin: 0 auto;
        }
        .fj-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .fj-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .fj-breadcrumb a:hover { color: var(--text-primary); }
        .fj-breadcrumb span { color: var(--border-light); }
        .fj-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .fj-header {
          margin-bottom: 32px;
        }
        .fj-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(236, 72, 153, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
          font-size: 28px;
        }
        .fj-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .fj-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .fj-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .fj-action-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 4px;
        }
        .fj-action-tab {
          flex: 1;
          padding: 10px 12px;
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
        .fj-action-tab.active {
          background: rgba(236, 72, 153, 0.15);
          color: #EC4899;
        }
        .fj-textarea {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          color: var(--text-primary);
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 13px;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          line-height: 1.6;
          tab-size: 2;
        }
        .fj-textarea:focus {
          border-color: #EC4899;
        }
        .fj-textarea::placeholder {
          color: var(--text-tertiary);
        }
        .fj-btn {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #EC4899;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .fj-btn:hover:not(:disabled) {
          background: #F472B6;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(236, 72, 153, 0.25);
        }
        .fj-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .fj-output-area {
          margin-top: 20px;
        }
        .fj-output-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .fj-output-label {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .fj-output-label span {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .fj-valid-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .fj-valid-badge.valid {
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
        }
        .fj-valid-badge.invalid {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
        }
        .fj-keys-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          background: rgba(236, 72, 153, 0.1);
          color: #EC4899;
          border-radius: 6px;
        }
        .fj-copy-btn {
          background: rgba(236, 72, 153, 0.1);
          border: 1px solid rgba(236, 72, 153, 0.2);
          border-radius: 8px;
          padding: 6px 14px;
          color: #EC4899;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-body);
        }
        .fj-copy-btn:hover {
          background: #EC4899;
          color: #fff;
          border-color: #EC4899;
        }
        .fj-output-textarea {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          color: var(--text-primary);
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 13px;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          line-height: 1.6;
          tab-size: 2;
        }
        .fj-error-box {
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
        .fj-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .fj-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(236, 72, 153, 0.06);
          border: 1px solid rgba(236, 72, 153, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .fj-info-box svg { width: 16px; height: 16px; color: #EC4899; flex-shrink: 0; margin-top: 1px; }
        .fj-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .fj-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .fj-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .fj-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .fj-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .fj-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .fj-features { grid-template-columns: 1fr; }
          .fj-action-tabs { flex-direction: column; }
        }
      `}</style>

      {loading && <LoadingSpinner message={`${action === 'format' ? 'Formatando' : action === 'minify' ? 'Minificando' : 'Validando'} JSON...`} />}

      <div className="fj-root">
        <div className="fj-inner">
          <nav className="fj-breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="fj-breadcrumb-current">Formatador JSON</span>
          </nav>

          <div className="fj-header">
            <div className="fj-icon-wrap">{ }</div>
            <h1 className="fj-title">Formatador JSON</h1>
            <p className="fj-subtitle">Formate, minifique e valide dados JSON com facilidade.</p>
          </div>

          <div className="fj-card">
            <div className="fj-action-tabs">
              <button
                className={`fj-action-tab${action === 'format' ? ' active' : ''}`}
                onClick={() => { setAction('format'); setOutput(''); setSuccess(false); setError(''); setKeysCount(null); setIsValid(null); }}
              >
                Formatar
              </button>
              <button
                className={`fj-action-tab${action === 'minify' ? ' active' : ''}`}
                onClick={() => { setAction('minify'); setOutput(''); setSuccess(false); setError(''); setKeysCount(null); setIsValid(null); }}
              >
                Minificar
              </button>
              <button
                className={`fj-action-tab${action === 'validate' ? ' active' : ''}`}
                onClick={() => { setAction('validate'); setOutput(''); setSuccess(false); setError(''); setKeysCount(null); setIsValid(null); }}
              >
                Validar
              </button>
            </div>

            <textarea
              className="fj-textarea"
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setOutput(''); setSuccess(false); setError(''); setKeysCount(null); setIsValid(null); }}
              placeholder={action === 'validate' ? 'Cole o JSON para validar...' : 'Cole o JSON para ' + (action === 'format' ? 'formatar...' : 'minificar...')}
            />

            <button
              className="fj-btn"
              onClick={handleAction}
              disabled={loading || !jsonText.trim()}
            >
              {loading ? 'Processando...' : action === 'format' ? 'Formatar JSON' : action === 'minify' ? 'Minificar JSON' : 'Validar JSON'}
            </button>

            {error && (
              <div className="fj-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {output && (
              <div className="fj-output-area">
                <div className="fj-output-header">
                  <div className="fj-output-label">
                    <span>{actionLabel}</span>
                    {action === 'validate' && (
                      <>
                        <span className={`fj-valid-badge ${isValid ? 'valid' : 'invalid'}`}>
                          {isValid ? 'Valido' : 'Invalido'}
                        </span>
                        {keysCount !== null && (
                          <span className="fj-keys-badge">{keysCount} chaves</span>
                        )}
                      </>
                    )}
                  </div>
                  <button className="fj-copy-btn" onClick={copyToClipboard}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <textarea
                  className="fj-output-textarea"
                  value={output}
                  readOnly
                />
              </div>
            )}

            {!output && !loading && (
              <div className="fj-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Cole seu JSON, escolha uma acao (Formatar, Minificar ou Validar) e clique no botao para processar.</p>
              </div>
            )}
          </div>

          <div className="fj-features">
            {[
              { e: '📋', t: 'Formatar', d: 'Organize JSON com indentacao e quebras de linha' },
              { e: '🗜️', t: 'Minificar', d: 'Remova espacos para reduzir o tamanho do JSON' },
              { e: '✅', t: 'Validar', d: 'Verifique se o JSON e sintaticamente valido' },
            ].map((x) => (
              <div key={x.t} className="fj-feature">
                <div className="fj-feature-emoji">{x.e}</div>
                <div className="fj-feature-title">{x.t}</div>
                <div className="fj-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
