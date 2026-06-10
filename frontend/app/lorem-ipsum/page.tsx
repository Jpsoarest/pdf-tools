'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LoremIpsum() {
  const [paragraphs, setParagraphs] = useState(3);
  const [words, setWords] = useState(50);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('paragraphs', paragraphs.toString());
    formData.append('words', words.toString());

    try {
      const res = await fetch('/api/backend/lorem', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erro ao gerar Lorem Ipsum');
      }
      const json = await res.json();
      setResult(json.paragraphs.join('\n\n'));
      setSuccess(true);
      setCopied(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar Lorem Ipsum';
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
        .li-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .li-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .li-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .li-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .li-breadcrumb a:hover { color: var(--text-primary); }
        .li-breadcrumb span { color: var(--border-light); }
        .li-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .li-header {
          margin-bottom: 32px;
        }
        .li-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
          font-size: 28px;
        }
        .li-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .li-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .li-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .li-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }
        .li-control-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .li-control-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .li-control-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .li-control-value {
          font-size: 14px;
          font-weight: 800;
          color: #8B5CF6;
          font-family: var(--font-display);
          background: rgba(139, 92, 246, 0.1);
          padding: 4px 12px;
          border-radius: 8px;
          min-width: 40px;
          text-align: center;
        }
        .li-range {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          outline: none;
          width: 100%;
        }
        .li-range::-webkit-slider-thumb {
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
        .li-range::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #8B5CF6;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid var(--card-bg);
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }
        .li-btn {
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
        }
        .li-btn:hover:not(:disabled) {
          background: #7C3AED;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
        }
        .li-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .li-result-area {
          margin-top: 20px;
        }
        .li-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .li-result-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .li-copy-btn {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          padding: 6px 14px;
          color: #8B5CF6;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-body);
        }
        .li-copy-btn:hover {
          background: #8B5CF6;
          color: #fff;
          border-color: #8B5CF6;
        }
        .li-result-box {
          width: 100%;
          min-height: 200px;
          padding: 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.8;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: var(--font-body);
        }
        .li-error-box {
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
        .li-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .li-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .li-info-box svg { width: 16px; height: 16px; color: #8B5CF6; flex-shrink: 0; margin-top: 1px; }
        .li-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .li-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .li-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .li-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .li-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .li-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .li-features { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Gerando texto Lorem Ipsum..." />}

      <div className="li-root">
        <div className="li-inner">
          <nav className="li-breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="li-breadcrumb-current">Lorem Ipsum</span>
          </nav>

          <div className="li-header">
            <div className="li-icon-wrap">📝</div>
            <h1 className="li-title">Lorem Ipsum</h1>
            <p className="li-subtitle">Gere texto placeholder para seus designs e prototipos.</p>
          </div>

          <div className="li-card">
            <div className="li-controls">
              <div className="li-control-row">
                <div className="li-control-header">
                  <span className="li-control-label">Paragrafos</span>
                  <span className="li-control-value">{paragraphs}</span>
                </div>
                <input
                  type="range"
                  className="li-range"
                  min={1}
                  max={20}
                  value={paragraphs}
                  onChange={(e) => setParagraphs(Number(e.target.value))}
                />
              </div>
              <div className="li-control-row">
                <div className="li-control-header">
                  <span className="li-control-label">Palavras por paragrafo</span>
                  <span className="li-control-value">{words}</span>
                </div>
                <input
                  type="range"
                  className="li-range"
                  min={5}
                  max={200}
                  step={5}
                  value={words}
                  onChange={(e) => setWords(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              className="li-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? 'Gerando...' : 'Gerar Lorem Ipsum'}
            </button>

            {error && (
              <div className="li-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div className="li-result-area">
                <div className="li-result-header">
                  <span className="li-result-label">{paragraphs} paragrafo{paragraphs !== 1 ? 's' : ''} gerado{paragraphs !== 1 ? 's' : ''}</span>
                  <button className="li-copy-btn" onClick={copyToClipboard}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <div className="li-result-box">{result}</div>
              </div>
            )}

            {!result && !loading && (
              <div className="li-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Configure o numero de paragrafos e palavras e clique em Gerar Lorem Ipsum para obter o texto.</p>
              </div>
            )}
          </div>

          <div className="li-features">
            {[
              { e: '⚙️', t: 'Configuravel', d: 'Ajuste a quantidade de paragrafos e palavras por paragrafo' },
              { e: '♾️', t: 'Ilimitado', d: 'Gere quantos textos placeholder precisar' },
              { e: '⚡', t: 'Instantaneo', d: 'Texto gerado em milissegundos' },
            ].map((x) => (
              <div key={x.t} className="li-feature">
                <div className="li-feature-emoji">{x.e}</div>
                <div className="li-feature-title">{x.t}</div>
                <div className="li-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
