'use client';

interface LoadingSpinnerProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export default function LoadingSpinner({
  message = 'Processando...',
  progress,
  showProgress = false,
}: LoadingSpinnerProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
        .spinner-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .spinner-card {
          background: #141414;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 40px 32px;
          width: 100%;
          max-width: 360px;
          text-align: center;
          box-shadow: 0 40px 80px rgba(0,0,0,0.7);
        }
        .spinner-ring-wrap {
          position: relative;
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
        }
        .spinner-ring-bg {
          position: absolute;
          inset: 0;
          border: 3px solid rgba(255,255,255,0.06);
          border-radius: 50%;
        }
        .spinner-ring {
          position: absolute;
          inset: 0;
          border: 3px solid transparent;
          border-top-color: #E8FF47;
          border-right-color: rgba(232,255,71,0.3);
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner-dot {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spinner-dot::after {
          content: '';
          width: 8px;
          height: 8px;
          background: #E8FF47;
          border-radius: 50%;
          animation: dotPulse 0.9s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.6); opacity: 0.5; }
        }
        .spinner-msg {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
        }
        .spinner-hint {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
        }
        .progress-bar-wrap {
          margin-top: 24px;
          background: rgba(255,255,255,0.06);
          border-radius: 100px;
          height: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: #E8FF47;
          border-radius: 100px;
          transition: width 0.4s ease;
          box-shadow: 0 0 12px rgba(232,255,71,0.5);
        }
        .progress-pct {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #E8FF47;
          margin-top: 8px;
          font-weight: 600;
        }
      `}</style>
      <div className="spinner-overlay">
        <div className="spinner-card">
          <div className="spinner-ring-wrap">
            <div className="spinner-ring-bg" />
            <div className="spinner-ring" />
            <div className="spinner-dot" />
          </div>
          <div className="spinner-msg">{message}</div>
          <div className="spinner-hint">Isso pode levar alguns segundos…</div>
          {showProgress && progress !== undefined && (
            <>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-pct">{progress}%</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}