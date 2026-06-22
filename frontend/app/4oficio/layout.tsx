import type { ReactNode } from 'react';

export default function OficioLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <section className="oficio4-theme">
      <style>{`
        .oficio4-theme {
          --bg-primary: #f7f3ee;
          --bg-secondary: #fffaf4;
          --bg-tertiary: #efe5da;
          --bg-elevated: #fffaf4;
          --text-primary: #10263d;
          --text-secondary: #405467;
          --text-tertiary: #7f8c98;
          --border-light: rgba(16,38,61,0.12);
          --border-medium: rgba(16,38,61,0.22);
          --accent-primary: #c58f5f;
          --accent-secondary: #10263d;
          --accent-glow: rgba(197,143,95,0.16);
          --card-bg: #fffaf4;
          --card-border: rgba(16,38,61,0.12);
          --tool-icon-bg: rgba(197,143,95,0.13);
          background: #f7f3ee;
          min-height: 100vh;
        }
        .oficio4-theme .merge-root,
        .oficio4-theme .page-root,
        .oficio4-theme .editor-root {
          background:
            linear-gradient(180deg, rgba(16,38,61,.06), transparent 320px),
            #f7f3ee;
        }
        .oficio4-theme .merge-add,
        .oficio4-theme .btn-reorder,
        .oficio4-theme .action-btn.primary {
          background: #c58f5f;
          color: #10263d;
        }
        .oficio4-theme .merge-add:hover:not(:disabled),
        .oficio4-theme .btn-reorder:hover:not(:disabled),
        .oficio4-theme .action-btn.primary:hover:not(:disabled) {
          background: #d6a371;
        }
      `}</style>
      {children}
    </section>
  );
}
