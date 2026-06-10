'use client';

import { useState } from 'react';

export default function GeradorSenha() {
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    let chars = '';
    if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) { setPassword(''); return; }
    let result = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    setPassword(result);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = password;
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

  const getStrength = (): { label: string; color: string; width: string } => {
    if (!password) return { label: '---', color: 'var(--border-light)', width: '0%' };
    let score = 0;
    if (length >= 12) score++;
    if (length >= 20) score++;
    if (includeUpper && /[A-Z]/.test(password)) score++;
    if (includeLower && /[a-z]/.test(password)) score++;
    if (includeNumbers && /[0-9]/.test(password)) score++;
    if (includeSymbols && /[^A-Za-z0-9]/.test(password)) score++;
    const active = [includeUpper, includeLower, includeNumbers, includeSymbols].filter(Boolean).length;
    if (active >= 3) score++;
    if (active >= 4) score++;
    if (score <= 2) return { label: 'Fraca', color: '#EF4444', width: '25%' };
    if (score <= 4) return { label: 'Media', color: '#F59E0B', width: '55%' };
    if (score <= 6) return { label: 'Forte', color: '#10B981', width: '80%' };
    return { label: 'Excelente', color: '#8B5CF6', width: '100%' };
  };

  const strength = getStrength();

  return (
    <>
      <style>{`
        .gs-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .gs-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .gs-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .gs-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .gs-breadcrumb a:hover { color: var(--text-primary); }
        .gs-breadcrumb span { color: var(--border-light); }
        .gs-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .gs-header {
          margin-bottom: 32px;
        }
        .gs-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .gs-icon-wrap svg { width: 28px; height: 28px; color: #8B5CF6; }
        .gs-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .gs-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .gs-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .gs-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .gs-length-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .gs-range {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          outline: none;
        }
        .gs-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #8B5CF6;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid var(--card-bg);
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }
        .gs-range::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #8B5CF6;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid var(--card-bg);
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }
        .gs-length-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          height: 36px;
          background: rgba(139, 92, 246, 0.1);
          color: #8B5CF6;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 800;
          font-family: var(--font-display);
        }
        .gs-toggles {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }
        .gs-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gs-toggle-row:hover { background: var(--bg-tertiary); }
        .gs-toggle-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .gs-toggle {
          position: relative;
          width: 44px;
          height: 26px;
          flex-shrink: 0;
        }
        .gs-toggle input { opacity: 0; width: 0; height: 0; }
        .gs-toggle-slider {
          position: absolute;
          inset: 0;
          background: var(--bg-tertiary);
          border-radius: 13px;
          transition: 0.2s;
          cursor: pointer;
        }
        .gs-toggle-slider::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          left: 3px;
          bottom: 3px;
          background: #fff;
          border-radius: 50%;
          transition: 0.2s;
        }
        .gs-toggle input:checked + .gs-toggle-slider {
          background: #8B5CF6;
        }
        .gs-toggle input:checked + .gs-toggle-slider::before {
          transform: translateX(18px);
        }
        .gs-btn-generate {
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
          margin-bottom: 20px;
        }
        .gs-btn-generate:hover {
          background: #7C3AED;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
        }
        .gs-password-display {
          position: relative;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 18px;
          margin-top: 8px;
        }
        .gs-password-text {
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          word-break: break-all;
          padding-right: 60px;
          letter-spacing: 1px;
        }
        .gs-password-empty {
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 18px;
          color: var(--text-tertiary);
          font-weight: 400;
          padding-right: 60px;
        }
        .gs-copy-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 10px;
          padding: 8px 12px;
          color: #8B5CF6;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .gs-copy-btn:hover {
          background: #8B5CF6;
          color: #fff;
          border-color: #8B5CF6;
        }
        .gs-strength-row {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .gs-strength-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }
        .gs-strength-bar-wrap {
          flex: 1;
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
        }
        .gs-strength-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s, background 0.3s;
        }
        .gs-strength-value {
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          min-width: 60px;
          text-align: right;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .gs-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .gs-info-box svg { width: 16px; height: 16px; color: #8B5CF6; flex-shrink: 0; margin-top: 1px; }
        .gs-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .gs-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .gs-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .gs-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .gs-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .gs-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .gs-features { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="gs-root">
        <div className="gs-inner">
          <nav className="gs-breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="gs-breadcrumb-current">Gerador de Senha</span>
          </nav>

          <div className="gs-header">
            <div className="gs-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="gs-title">Gerador de Senha</h1>
            <p className="gs-subtitle">Gere senhas seguras e aleatorias com um clique.</p>
          </div>

          <div className="gs-card">
            <span className="gs-label">Comprimento: {length} caracteres</span>
            <div className="gs-length-row">
              <input
                type="range"
                className="gs-range"
                min={8}
                max={64}
                value={length}
                onChange={(e) => { setLength(Number(e.target.value)); setCopied(false); }}
              />
              <span className="gs-length-badge">{length}</span>
            </div>

            <div className="gs-toggles">
              <label className="gs-toggle-row">
                <span className="gs-toggle-label">Maiusculas (A-Z)</span>
                <div className="gs-toggle">
                  <input type="checkbox" checked={includeUpper} onChange={() => setIncludeUpper(!includeUpper)} />
                  <span className="gs-toggle-slider" />
                </div>
              </label>
              <label className="gs-toggle-row">
                <span className="gs-toggle-label">Minusculas (a-z)</span>
                <div className="gs-toggle">
                  <input type="checkbox" checked={includeLower} onChange={() => setIncludeLower(!includeLower)} />
                  <span className="gs-toggle-slider" />
                </div>
              </label>
              <label className="gs-toggle-row">
                <span className="gs-toggle-label">Numeros (0-9)</span>
                <div className="gs-toggle">
                  <input type="checkbox" checked={includeNumbers} onChange={() => setIncludeNumbers(!includeNumbers)} />
                  <span className="gs-toggle-slider" />
                </div>
              </label>
              <label className="gs-toggle-row">
                <span className="gs-toggle-label">Simbolos (!@#$...)</span>
                <div className="gs-toggle">
                  <input type="checkbox" checked={includeSymbols} onChange={() => setIncludeSymbols(!includeSymbols)} />
                  <span className="gs-toggle-slider" />
                </div>
              </label>
            </div>

            <button className="gs-btn-generate" onClick={generate}>
              Gerar Senha
            </button>

            {password ? (
              <div className="gs-password-display">
                <div className="gs-password-text">{password}</div>
                <button className="gs-copy-btn" onClick={copyToClipboard}>
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <div className="gs-strength-row">
                  <span className="gs-strength-label">Forca</span>
                  <div className="gs-strength-bar-wrap">
                    <div
                      className="gs-strength-bar"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                  <span className="gs-strength-value" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              </div>
            ) : (
              <div className="gs-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Configure as opcoes acima e clique em Gerar Senha para criar uma senha segura e aleatoria.</p>
              </div>
            )}
          </div>

          <div className="gs-features">
            {[
              { e: '🔐', t: 'Seguranca maxima', d: 'Geracao criptografica com crypto.getRandomValues' },
              { e: '⚙️', t: 'Configuravel', d: 'Escolha comprimento e tipos de caracteres' },
              { e: '💻', t: 'Local', d: 'Tudo processado no navegador, sem envio de dados' },
            ].map((x) => (
              <div key={x.t} className="gs-feature">
                <div className="gs-feature-emoji">{x.e}</div>
                <div className="gs-feature-title">{x.t}</div>
                <div className="gs-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
