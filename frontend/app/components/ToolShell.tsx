'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ToolShellProps {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
  stats?: { label: string; value: string }[];
}

export default function ToolShell({ title, description, breadcrumbs, children, stats }: ToolShellProps) {
  return (
    <>
      <style>{`
        .toolshell {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 0;
        }
        .toolshell-header {
          max-width: 960px;
          margin: 0 auto;
          padding: 40px 24px 0;
        }
        .toolshell-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--text-tertiary);
          flex-wrap: wrap;
        }
        .toolshell-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .toolshell-breadcrumb a:hover {
          color: var(--accent-primary);
        }
        .toolshell-breadcrumb-sep {
          color: var(--text-tertiary);
          opacity: 0.5;
        }
        .toolshell-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(28px, 4vw, 40px);
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .toolshell-desc {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 600px;
          margin-bottom: 24px;
        }
        .toolshell-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        .toolshell-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 100px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .toolshell-body {
          max-width: 960px;
          margin: 0 auto;
          padding: 32px 24px 80px;
        }
        .toolshell-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
        }
        .toolshell-stat {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .toolshell-stat-value {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 800;
          color: var(--accent-primary);
          line-height: 1.2;
        }
        .toolshell-stat-label {
          font-size: 11px;
          color: var(--text-tertiary);
          font-weight: 500;
        }
        @media (max-width: 480px) {
          .toolshell-header { padding: 24px 16px 0; }
          .toolshell-body { padding: 24px 16px 60px; }
        }
      `}</style>

      <div className="toolshell">
        <div className="toolshell-header">
          <div className="toolshell-breadcrumb">
            {breadcrumbs.map((item, i) => (
              <span key={i}>
                {i > 0 && <span className="toolshell-breadcrumb-sep">/</span>}
                {item.href ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </span>
            ))}
          </div>
          <h1 className="toolshell-title">{title}</h1>
          <p className="toolshell-desc">{description}</p>
          <div className="toolshell-badges">
            <span className="toolshell-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              Privado
            </span>
            <span className="toolshell-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Sem cadastro
            </span>
            <span className="toolshell-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7"/></svg>
              Até 200MB
            </span>
          </div>
          {stats && stats.length > 0 && (
            <div className="toolshell-stats">
              {stats.map((s, i) => (
                <div key={i} className="toolshell-stat">
                  <span className="toolshell-stat-value">{s.value}</span>
                  <span className="toolshell-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="toolshell-body">
          {children}
        </div>
      </div>
    </>
  );
}
