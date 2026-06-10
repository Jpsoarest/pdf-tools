'use client';

import { ReactNode, useState } from 'react';

interface SettingsPanelProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export default function SettingsPanel({
  title,
  children,
  defaultExpanded = false,
}: SettingsPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <>
      <style>{`
        .sp-root {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          overflow: hidden;
        }
        .sp-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          cursor: pointer;
          border: none;
          background: none;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          transition: all 0.15s;
        }
        .sp-toggle:hover {
          background: var(--bg-tertiary);
        }
        .sp-toggle-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
          font-size: 12px;
        }
        .sp-toggle-icon.open {
          transform: rotate(180deg);
        }
        .sp-content {
          padding: 0 18px 18px;
          animation: spFadeIn 0.2s ease;
        }
        @keyframes spFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="sp-root">
        <button className="sp-toggle" onClick={() => setExpanded(!expanded)}>
          {title}
          <span className={`sp-toggle-icon ${expanded ? 'open' : ''}`}>▼</span>
        </button>
        {expanded && <div className="sp-content">{children}</div>}
      </div>
    </>
  );
}
