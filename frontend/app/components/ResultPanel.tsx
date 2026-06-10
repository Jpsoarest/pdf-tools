'use client';

interface ResultPanelProps {
  success: boolean;
  title?: string;
  message?: string;
  metrics?: { label: string; value: string; highlight?: boolean }[];
  downloadLabel?: string;
  onDownload?: () => void;
  onReset?: () => void;
  nextActions?: { label: string; href?: string; onClick?: () => void }[];
}

export default function ResultPanel({
  success,
  title,
  message,
  metrics,
  downloadLabel = 'Salvar arquivo',
  onDownload,
  onReset,
  nextActions,
}: ResultPanelProps) {
  return (
    <>
      <style>{`
        .rp-root {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: clamp(28px, 4vw, 40px);
          text-align: center;
        }
        .rp-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 28px;
        }
        .rp-icon.success {
          background: rgba(16,185,129,0.12);
          color: var(--success);
        }
        .rp-icon.error {
          background: rgba(239,68,68,0.12);
          color: var(--error);
        }
        .rp-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .rp-message {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 480px;
          margin: 0 auto 24px;
        }
        .rp-metrics {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .rp-metric {
          background: var(--bg-tertiary);
          border-radius: 12px;
          padding: 12px 20px;
          text-align: center;
          min-width: 100px;
        }
        .rp-metric.highlight {
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.2);
        }
        .rp-metric-value {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .rp-metric.highlight .rp-metric-value {
          color: var(--accent-primary);
        }
        .rp-metric-label {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 4px;
          font-weight: 500;
        }
        .rp-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .rp-btn-primary {
          background: var(--accent-primary);
          color: white;
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .rp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
          filter: brightness(1.1);
        }
        .rp-btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
          border: 1px solid var(--border-light);
          cursor: pointer;
        }
        .rp-btn-secondary:hover {
          background: var(--border-light);
          color: var(--text-primary);
        }
        .rp-next-actions {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--border-light);
        }
        .rp-next-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .rp-next-list {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rp-next-btn {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s;
          cursor: pointer;
          border: 1px solid var(--border-light);
        }
        .rp-next-btn:hover {
          background: var(--border-light);
          color: var(--text-primary);
        }
      `}</style>

      <div className="rp-root">
        <div className={`rp-icon ${success ? 'success' : 'error'}`}>
          {success ? '✓' : '✕'}
        </div>
        <div className="rp-title">{title || (success ? 'Concluido!' : 'Ocorreu um erro')}</div>
        {message && <div className="rp-message">{message}</div>}

        {metrics && metrics.length > 0 && (
          <div className="rp-metrics">
            {metrics.map((m, i) => (
              <div key={i} className={`rp-metric ${m.highlight ? 'highlight' : ''}`}>
                <div className="rp-metric-value">{m.value}</div>
                <div className="rp-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="rp-actions">
          {success && onDownload && (
            <button className="rp-btn-primary" onClick={onDownload}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              {downloadLabel}
            </button>
          )}
          {onReset && (
            <button className="rp-btn-secondary" onClick={onReset}>
              Novo arquivo
            </button>
          )}
        </div>

        {success && nextActions && nextActions.length > 0 && (
          <div className="rp-next-actions">
            <div className="rp-next-title">Enviar para</div>
            <div className="rp-next-list">
              {nextActions.map((a, i) => (
                <button
                  key={i}
                  className="rp-next-btn"
                  onClick={a.onClick || (() => { if (a.href) window.location.href = a.href; })}
                >
                  {a.label} →
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
