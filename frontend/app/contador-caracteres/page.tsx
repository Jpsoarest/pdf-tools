'use client';

import { useState, useMemo } from 'react';

export default function ContadorCaracteres() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;
    const paragraphs = text.trim() ? text.split('\n').filter((p) => p.trim().length > 0).length : 0;
    return { characters, charactersNoSpaces, words, lines, paragraphs };
  }, [text]);

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
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #10B981; }
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
        .textarea-input {
          width: 100%;
          padding: 16px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          resize: vertical;
          min-height: 200px;
          line-height: 1.7;
        }
        .textarea-input:focus {
          border-color: #10B981;
        }
        .textarea-input::placeholder {
          color: var(--text-tertiary);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 20px;
        }
        .stat-card {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 18px 14px;
          text-align: center;
        }
        .stat-card .stat-value {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 800;
          color: #10B981;
          line-height: 1;
        }
        .stat-card .stat-label {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-card.highlight {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.2);
        }
        .stat-card.highlight .stat-value {
          color: #10B981;
        }
        .info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #10B981; flex-shrink: 0; margin-top: 1px; }
        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
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
          .stats-grid { grid-template-columns: 1fr; }
          .features-mini { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Contador de Caracteres</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="page-title">Contador de Caracteres</h1>
            <p className="page-subtitle">Conte caracteres, palavras e linhas do seu texto em tempo real.</p>
          </div>

          <div className="card">
            <textarea
              className="textarea-input"
              placeholder="Digite ou cole seu texto aqui…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="stats-grid">
              <div className="stat-card highlight">
                <div className="stat-value">{stats.characters.toLocaleString()}</div>
                <div className="stat-label">Caracteres</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.charactersNoSpaces.toLocaleString()}</div>
                <div className="stat-label">Sem espaços</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.words.toLocaleString()}</div>
                <div className="stat-label">Palavras</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.lines.toLocaleString()}</div>
                <div className="stat-label">Linhas</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.paragraphs.toLocaleString()}</div>
                <div className="stat-label">Parágrafos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{text ? (stats.characters / stats.words).toFixed(1) : '0'}</div>
                <div className="stat-label">Média p/ palavra</div>
              </div>
            </div>

            {!text && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Tudo é processado no seu navegador. Nenhum dado é enviado a servidores externos.</p>
              </div>
            )}
          </div>

          <div className="features-mini">
            {[
              { e: '⚡', t: 'Tempo real', d: 'Contagem instantânea' },
              { e: '📝', t: 'Palavras', d: 'Contagem precisa' },
              { e: '📄', t: 'Linhas', d: 'Inclui parágrafos' },
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
