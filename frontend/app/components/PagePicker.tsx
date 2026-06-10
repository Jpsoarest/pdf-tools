'use client';

interface PagePickerProps {
  totalPages: number;
  selectedPages: number[];
  onChange: (pages: number[]) => void;
  mode?: 'grid' | 'list';
}

export default function PagePicker({
  totalPages,
  selectedPages,
  onChange,
  mode: _mode = 'grid',
}: PagePickerProps) {
  const togglePage = (page: number) => {
    if (selectedPages.includes(page)) {
      onChange(selectedPages.filter((p) => p !== page));
    } else {
      onChange([...selectedPages, page].sort((a, b) => a - b));
    }
  };

  const selectAll = () => onChange([...Array(totalPages)].map((_, i) => i + 1));
  const clearAll = () => onChange([]);
  const selectOdd = () => onChange([...Array(totalPages)].map((_, i) => i + 1).filter((n) => n % 2 === 1));
  const selectEven = () => onChange([...Array(totalPages)].map((_, i) => i + 1).filter((n) => n % 2 === 0));

  return (
    <>
      <style>{`
        .pp-root {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px;
        }
        .pp-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .pp-count {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .pp-count span {
          color: var(--accent-primary);
        }
        .pp-actions {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .pp-btn {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border-light);
          transition: all 0.15s;
        }
        .pp-btn:hover {
          background: var(--border-light);
          color: var(--text-primary);
        }
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
          gap: 6px;
        }
        .pp-page {
          aspect-ratio: 3/4;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 2px solid transparent;
          user-select: none;
        }
        .pp-page:hover {
          border-color: var(--border-medium);
          transform: scale(1.05);
        }
        .pp-page.selected {
          background: rgba(99,102,241,0.15);
          color: var(--accent-primary);
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 1px var(--accent-primary);
        }
        .pp-input-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .pp-input {
          flex: 1;
          min-width: 150px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-medium);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-primary);
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.15s;
        }
        .pp-input:focus {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-glow);
        }
        .pp-apply-btn {
          background: var(--accent-primary);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .pp-apply-btn:hover {
          filter: brightness(1.1);
        }
      `}</style>

      <div className="pp-root">
        <div className="pp-toolbar">
          <div className="pp-count">
            <span>{selectedPages.length}</span> de {totalPages} paginas selecionadas
          </div>
          <div className="pp-actions">
            <button className="pp-btn" onClick={selectAll}>Todas</button>
            <button className="pp-btn" onClick={clearAll}>Nenhuma</button>
            <button className="pp-btn" onClick={selectOdd}>Impares</button>
            <button className="pp-btn" onClick={selectEven}>Pares</button>
          </div>
        </div>

        <div className="pp-grid">
          {[...Array(totalPages)].map((_, i) => (
            <div
              key={i}
              className={`pp-page ${selectedPages.includes(i + 1) ? 'selected' : ''}`}
              onClick={() => togglePage(i + 1)}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="pp-input-row">
          <input
            type="text"
            className="pp-input"
            placeholder="Ex: 1-5,8,10-15"
            defaultValue={selectedPages.join(',')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                const pages: number[] = [];
                val.split(',').forEach((part) => {
                  const trimmed = part.trim();
                  if (trimmed.includes('-')) {
                    const [s, e] = trimmed.split('-').map(Number);
                    for (let p = s; p <= e; p++) pages.push(p);
                  } else {
                    const n = parseInt(trimmed);
                    if (!isNaN(n)) pages.push(n);
                  }
                });
                onChange([...new Set(pages)].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b));
              }
            }}
          />
          <button className="pp-apply-btn">Aplicar</button>
        </div>
      </div>
    </>
  );
}
