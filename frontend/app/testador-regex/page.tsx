'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

interface RegexMatch {
  match: string;
  start: number;
  end: number;
  groups: string[];
}

interface RegexResult {
  pattern: string;
  flags: string;
  match_count: number;
  matches: RegexMatch[];
}

export default function TestadorRegex() {
  const [pattern, setPattern] = useState('');
  const [text, setText] = useState('');
  const [flags, setFlags] = useState({ i: false, m: false, s: false, x: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RegexResult | null>(null);

  const toggleFlag = (flag: 'i' | 'm' | 's' | 'x') => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const flagsString = () => {
    return Object.entries(flags)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join('');
  };

  const handleTest = async () => {
    if (!pattern || !text) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('pattern', pattern);
    formData.append('text', text);
    formData.append('flags', flagsString());

    try {
      const response = await fetch('/api/backend/regex', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro ao testar regex');

      const data: RegexResult = await response.json();
      setResult(data);
    } catch {
      setError('Erro ao testar a expressão regular. Tente novamente.');
    } finally {
      setLoading(false);
    }
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
          max-width: 680px;
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
          background: rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #3B82F6; }
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
        .input-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .text-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 12px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .text-input:focus {
          border-color: #3B82F6;
        }
        .text-input::placeholder {
          color: var(--text-tertiary);
        }
        .textarea-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 12px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          resize: vertical;
          min-height: 140px;
        }
        .textarea-input:focus {
          border-color: #3B82F6;
        }
        .field-group {
          margin-top: 18px;
        }
        .flags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .flag-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          background: var(--bg-tertiary);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.15s;
          user-select: none;
        }
        .flag-chip:hover {
          border-color: #3B82F6;
          color: var(--text-primary);
        }
        .flag-chip.active {
          background: rgba(59, 130, 246, 0.12);
          border-color: #3B82F6;
          color: #3B82F6;
          font-weight: 700;
        }
        .flag-chip .flag-key {
          font-family: monospace;
          font-size: 14px;
          font-weight: 700;
        }
        .btn-test {
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
        .btn-test:hover:not(:disabled) {
          background: #60A5FA;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
        }
        .btn-test:disabled {
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
          margin-bottom: 20px;
        }
        .results-icon {
          width: 36px; height: 36px;
          background: #3B82F6;
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
        .match-count {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          color: #3B82F6;
          margin: 8px 0 20px;
        }
        .match-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 400px;
          overflow-y: auto;
        }
        .match-item {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 14px;
        }
        .match-text {
          font-family: monospace;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          word-break: break-all;
        }
        .match-meta {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .match-groups {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .group-badge {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          padding: 4px 10px;
          font-family: monospace;
          font-size: 12px;
          color: #3B82F6;
        }
        .group-badge .group-index {
          font-size: 10px;
          color: var(--text-tertiary);
          margin-right: 4px;
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
        @media (max-width: 480px) {
          .features-mini { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Testando expressão regular…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Testador de Regex</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="page-title">Testador de Regex</h1>
            <p className="page-subtitle">Teste expressões regulares em tempo real com destaque de grupos.</p>
          </div>

          <div className="card">
            <div className="field-group">
              <label className="input-label">Expressão Regular</label>
              <input
                className="text-input"
                type="text"
                placeholder="Ex: (\w+)@(\w+)\.com"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="input-label">Flags</label>
              <div className="flags-row">
                {([
                  { key: 'i' as const, label: 'Case-insensitive' },
                  { key: 'm' as const, label: 'Multiline' },
                  { key: 's' as const, label: 'Dotall' },
                  { key: 'x' as const, label: 'Verbose' },
                ]).map(({ key, label }) => (
                  <div
                    key={key}
                    className={`flag-chip${flags[key] ? ' active' : ''}`}
                    onClick={() => toggleFlag(key)}
                  >
                    <span className="flag-key">{key}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="field-group">
              <label className="input-label">Texto para Teste</label>
              <textarea
                className="textarea-input"
                placeholder="Cole ou digite o texto aqui…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <button
              className="btn-test"
              onClick={handleTest}
              disabled={loading || !pattern || !text}
            >
              {loading ? 'Testando…' : '🔍 Testar Regex'}
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
                <h3>Resultados</h3>
              </div>
              <div className="match-count">
                {result.match_count} {result.match_count === 1 ? 'correspondência' : 'correspondências'}
              </div>
              {result.match_count > 0 && (
                <div className="match-list">
                  {result.matches.map((m, i) => (
                    <div key={i} className="match-item">
                      <div className="match-text">{m.match || '(vazio)'}</div>
                      <div className="match-meta">
                        <span>Início: {m.start}</span>
                        <span>Fim: {m.end}</span>
                      </div>
                      {m.groups && m.groups.length > 0 && (
                        <div className="match-groups">
                          {m.groups.map((g, gi) => (
                            <span key={gi} className="group-badge">
                              <span className="group-index">G{gi + 1}</span>
                              {g || '(vazio)'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="features-mini">
            {[
              { e: '📦', t: 'Grupos', d: 'Visualize grupos de captura' },
              { e: '🏳️', t: 'Flags', d: 'i, m, s, x com um clique' },
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
