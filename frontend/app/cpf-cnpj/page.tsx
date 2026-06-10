'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

type Action = 'validate' | 'format' | 'generate';
type DocType = 'CPF' | 'CNPJ';

interface ValidateResult {
  valid: boolean;
  type: DocType;
  reason?: string;
  raw: string;
}

interface FormatResult {
  formatted: string;
  type: string;
  valid: boolean;
}

interface GenerateResult {
  generated: string;
  formatted: string;
  type: string;
}

export default function CpfCnpj() {
  const [text, setText] = useState('');
  const [action, setAction] = useState<Action>('validate');
  const [docType, setDocType] = useState<DocType>('CPF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ValidateResult | FormatResult | GenerateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() && action !== 'generate') return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('text', text);
    formData.append('action', action);
    if (action === 'generate') {
      formData.append('type', docType.toLowerCase());
    }

    try {
      const res = await fetch('/api/backend/cpf-cnpj', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erro ao processar a requisição');
      }

      const json = await res.json();
      setResult(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar a requisição';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
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

  const reset = () => {
    setText('');
    setResult(null);
    setError('');
  };

  const formatResultValue = (): string => {
    if (!result) return '';
    if (action === 'validate') {
      const r = result as ValidateResult;
      return `${r.valid ? 'Válido' : 'Inválido'} — ${r.type}${r.reason ? ` (${r.reason})` : ''}`;
    }
    if (action === 'format') {
      return (result as FormatResult).formatted;
    }
    if (action === 'generate') {
      return (result as GenerateResult).formatted;
    }
    return '';
  };

  const rawResultValue = (): string => {
    if (!result) return '';
    if (action === 'generate') return (result as GenerateResult).generated;
    return '';
  };

  return (
    <>
      <style>{`
        .cpf-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .cpf-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .cpf-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .cpf-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .cpf-breadcrumb a:hover { color: var(--text-primary); }
        .cpf-breadcrumb span { color: var(--border-light); }
        .cpf-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .cpf-header {
          margin-bottom: 32px;
        }
        .cpf-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .cpf-icon-wrap span { font-size: 28px; }
        .cpf-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .cpf-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .cpf-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .cpf-actions-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .cpf-action-btn {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid var(--border-medium);
          border-radius: 10px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cpf-action-btn:hover {
          border-color: #3B82F6;
          color: #3B82F6;
        }
        .cpf-action-btn.active {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
        }
        .cpf-type-row {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }
        .cpf-type-btn {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border-medium);
          border-radius: 10px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cpf-type-btn:hover {
          border-color: #3B82F6;
          color: #3B82F6;
        }
        .cpf-type-btn.active {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
        }
        .cpf-input {
          width: 100%;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          color: var(--text-primary);
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .cpf-input:focus {
          border-color: #3B82F6;
        }
        .cpf-input::placeholder {
          color: var(--text-tertiary);
        }
        .cpf-btn {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cpf-btn:hover:not(:disabled) {
          background: #2563EB;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
        }
        .cpf-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .cpf-error-box {
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
        .cpf-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .cpf-result-box {
          margin-top: 20px;
          padding: 24px;
          border-radius: 16px;
          background: rgba(59, 130, 246, 0.06);
          border: 1px solid rgba(59, 130, 246, 0.15);
        }
        .cpf-result-valid {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .cpf-result-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
        }
        .cpf-result-badge.valid {
          background: rgba(16, 185, 129, 0.12);
          color: #10B981;
        }
        .cpf-result-badge.invalid {
          background: rgba(239, 68, 68, 0.12);
          color: #EF4444;
        }
        .cpf-result-type {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .cpf-result-value {
          margin-top: 10px;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 20px;
          color: var(--text-primary);
          letter-spacing: 2px;
          word-break: break-all;
        }
        .cpf-result-raw {
          margin-top: 8px;
          font-size: 12px;
          color: var(--text-tertiary);
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        }
        .cpf-result-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .cpf-copy-btn {
          flex: 1;
          padding: 10px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          color: #3B82F6;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-body);
        }
        .cpf-copy-btn:hover {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
        }
        .cpf-reset-btn {
          flex: 1;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-body);
        }
        .cpf-reset-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .cpf-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(59, 130, 246, 0.06);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .cpf-info-box svg { width: 16px; height: 16px; color: #3B82F6; flex-shrink: 0; margin-top: 1px; }
        .cpf-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .cpf-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .cpf-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .cpf-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .cpf-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .cpf-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .cpf-features { grid-template-columns: 1fr; }
          .cpf-actions-bar { flex-direction: column; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Processando CPF/CNPJ..." />}

      <div className="cpf-root">
        <div className="cpf-inner">
          <nav className="cpf-breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="cpf-breadcrumb-current">CPF / CNPJ</span>
          </nav>

          <div className="cpf-header">
            <div className="cpf-icon-wrap">
              <span>🪪</span>
            </div>
            <h1 className="cpf-title">CPF / CNPJ</h1>
            <p className="cpf-subtitle">Valide, formate e gere CPF e CNPJ com dígitos verificadores corretos.</p>
          </div>

          <div className="cpf-card">
            <div className="cpf-actions-bar">
              {(['validate', 'format', 'generate'] as Action[]).map((a) => (
                <button
                  key={a}
                  className={`cpf-action-btn${action === a ? ' active' : ''}`}
                  onClick={() => { setAction(a); setResult(null); setError(''); }}
                >
                  {a === 'validate' ? 'Validar' : a === 'format' ? 'Formatar' : 'Gerar'}
                </button>
              ))}
            </div>

            {action === 'generate' && (
              <div className="cpf-type-row">
                <button
                  className={`cpf-type-btn${docType === 'CPF' ? ' active' : ''}`}
                  onClick={() => setDocType('CPF')}
                >
                  CPF
                </button>
                <button
                  className={`cpf-type-btn${docType === 'CNPJ' ? ' active' : ''}`}
                  onClick={() => setDocType('CNPJ')}
                >
                  CNPJ
                </button>
              </div>
            )}

            {action !== 'generate' && (
              <input
                className="cpf-input"
                type="text"
                inputMode="numeric"
                value={text}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setText(val);
                  setResult(null);
                  setError('');
                }}
                placeholder={action === 'validate' ? 'Digite o CPF ou CNPJ (apenas números)' : 'Digite o CPF ou CNPJ para formatar'}
                maxLength={14}
              />
            )}

            <button
              className="cpf-btn"
              onClick={handleSubmit}
              disabled={loading || (action !== 'generate' && !text.trim())}
            >
              {loading ? 'Processando...' : action === 'validate' ? 'Validar' : action === 'format' ? 'Formatar' : `Gerar ${docType}`}
            </button>

            {error && (
              <div className="cpf-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div className="cpf-result-box">
                {action === 'validate' && (
                  <>
                    <div className="cpf-result-valid">
                      <span className={`cpf-result-badge ${(result as ValidateResult).valid ? 'valid' : 'invalid'}`}>
                        {(result as ValidateResult).valid ? '✓ Válido' : '✗ Inválido'}
                      </span>
                      <span className="cpf-result-type">{(result as ValidateResult).type}</span>
                    </div>
                    <div className="cpf-result-value">{(result as ValidateResult).raw}</div>
                    {(result as ValidateResult).reason && (
                      <div className="cpf-result-raw">Motivo: {(result as ValidateResult).reason}</div>
                    )}
                  </>
                )}

                {action === 'format' && (
                  <>
                    <div className="cpf-result-valid">
                      <span className={`cpf-result-badge ${(result as FormatResult).valid ? 'valid' : 'invalid'}`}>
                        {(result as FormatResult).valid ? '✓ Válido' : '✗ Inválido'}
                      </span>
                      <span className="cpf-result-type">{(result as FormatResult).type}</span>
                    </div>
                    <div className="cpf-result-value">{(result as FormatResult).formatted}</div>
                  </>
                )}

                {action === 'generate' && (
                  <>
                    <div className="cpf-result-valid">
                      <span className="cpf-result-badge valid">✓ Gerado</span>
                      <span className="cpf-result-type">{(result as GenerateResult).type}</span>
                    </div>
                    <div className="cpf-result-value">{(result as GenerateResult).formatted}</div>
                    <div className="cpf-result-raw">Raw: {(result as GenerateResult).generated}</div>
                  </>
                )}

                <div className="cpf-result-actions">
                  <button
                    className="cpf-copy-btn"
                    onClick={() => copyToClipboard(formatResultValue())}
                  >
                    {copied ? 'Copiado!' : 'Copiar resultado'}
                  </button>
                  {action === 'generate' && (
                    <button
                      className="cpf-copy-btn"
                      onClick={() => copyToClipboard(rawResultValue())}
                      style={{ background: 'rgba(59, 130, 246, 0.05)' }}
                    >
                      {copied ? 'Copiado!' : 'Copiar raw'}
                    </button>
                  )}
                  <button className="cpf-reset-btn" onClick={reset}>
                    Limpar
                  </button>
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="cpf-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>
                  {action === 'validate'
                    ? 'Digite um CPF ou CNPJ (apenas números) para verificar se os dígitos verificadores estão corretos.'
                    : action === 'format'
                    ? 'Digite um CPF ou CNPJ para formatá-lo com pontuação padrão.'
                    : 'Gere um CPF ou CNPJ com dígitos verificadores corretos.'}
                </p>
              </div>
            )}
          </div>

          <div className="cpf-features">
            {[
              { e: '✓', t: 'Validar', d: 'Verifique a autenticidade de CPF e CNPJ' },
              { e: '✎', t: 'Formatar', d: 'Formate números com pontuação padrão' },
              { e: '⚙', t: 'Gerar', d: 'Gere documentos com dígitos verificadores corretos' },
            ].map((x) => (
              <div key={x.t} className="cpf-feature">
                <div className="cpf-feature-emoji">{x.e}</div>
                <div className="cpf-feature-title">{x.t}</div>
                <div className="cpf-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
