'use client';

interface ErrorCalloutProps {
  title?: string;
  message: string;
  suggestion?: string;
  suggestionAction?: string;
  onSuggestion?: () => void;
  onRetry?: () => void;
}

export default function ErrorCallout({
  title = 'Algo deu errado',
  message,
  suggestion,
  suggestionAction,
  onSuggestion,
  onRetry,
}: ErrorCalloutProps) {
  return (
    <>
      <style>{`
        .ec-root {
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ec-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .ec-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(239,68,68,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--error);
          font-size: 14px;
          font-weight: 700;
        }
        .ec-content {
          flex: 1;
        }
        .ec-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--error);
          margin-bottom: 4px;
        }
        .ec-message {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .ec-suggestion {
          margin-top: 8px;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ec-suggestion-text {
          font-size: 13px;
          color: var(--text-secondary);
          flex: 1;
        }
        .ec-suggestion-btn {
          background: var(--accent-primary);
          color: white;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .ec-suggestion-btn:hover {
          filter: brightness(1.1);
        }
        .ec-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .ec-retry-btn {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border-light);
          transition: all 0.15s;
        }
        .ec-retry-btn:hover {
          background: var(--border-light);
          color: var(--text-primary);
        }
      `}</style>

      <div className="ec-root">
        <div className="ec-header">
          <div className="ec-icon">!</div>
          <div className="ec-content">
            <div className="ec-title">{title}</div>
            <div className="ec-message">{message}</div>
          </div>
        </div>

        {suggestion && (
          <div className="ec-suggestion">
            <span className="ec-suggestion-text">{suggestion}</span>
            {onSuggestion && suggestionAction && (
              <button className="ec-suggestion-btn" onClick={onSuggestion}>
                {suggestionAction}
              </button>
            )}
          </div>
        )}

        {onRetry && (
          <div className="ec-actions">
            <button className="ec-retry-btn" onClick={onRetry}>
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </>
  );
}
