'use client';

import { useState } from 'react';
import { downloadBlob } from '../lib/api';

interface FileEntry {
  originalFile: File;
  newName: string;
}

export default function RenomearArquivos() {
  const [files, setFiles] = useState<File[]>([]);
  const [pattern, setPattern] = useState('{name}');
  const [startNumber, setStartNumber] = useState(1);
  const [error, setError] = useState('');

  const applyPattern = (file: File, index: number): string => {
    const lastDot = file.name.lastIndexOf('.');
    const nameWithoutExt = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
    const ext = lastDot > 0 ? file.name.substring(lastDot) : '';
    const num = startNumber + index;

    return pattern
      .replace(/\{name\}/g, nameWithoutExt)
      .replace(/\{n\}/g, String(num))
      .replace(/\{ext\}/g, ext);
  };

  const previewEntries: FileEntry[] = files.map((file, i) => ({
    originalFile: file,
    newName: applyPattern(file, i),
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setFiles((prev) => [...prev, ...selected]);
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setError('');
  };

  const handleDownloadAll = async () => {
    for (const entry of previewEntries) {
      const blob = entry.originalFile.slice(0, entry.originalFile.size, entry.originalFile.type);
      await downloadBlob(blob, entry.newName);
    }
  };

  return (
    <>
      <style>{`
        .ren-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .ren-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .ren-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .ren-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .ren-breadcrumb a:hover { color: var(--text-primary); }
        .ren-breadcrumb span { color: var(--border-light); }
        .ren-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .ren-header {
          margin-bottom: 32px;
        }
        .ren-icon-wrap {
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
        .ren-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .ren-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .ren-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .ren-upload-trigger {
          border: 1.5px dashed var(--border-medium);
          border-radius: 14px;
          padding: 28px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
          display: block;
        }
        .ren-upload-trigger:hover {
          border-color: #8B5CF6;
          background: rgba(139, 92, 246, 0.03);
        }
        .ren-upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ren-upload-icon svg {
          width: 22px;
          height: 22px;
          color: #8B5CF6;
        }
        .ren-upload-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .ren-upload-hint {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .ren-files-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
          margin-bottom: 12px;
        }
        .ren-files-count {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .ren-clear-btn {
          background: none;
          border: none;
          color: #EF4444;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-body);
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .ren-clear-btn:hover { background: rgba(239, 68, 68, 0.1); }
        .ren-file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }
        .ren-file-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          font-size: 13px;
        }
        .ren-file-name {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--text-primary);
          font-weight: 500;
        }
        .ren-file-arrow {
          color: var(--text-tertiary);
          flex-shrink: 0;
        }
        .ren-file-preview {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #8B5CF6;
          font-weight: 500;
        }
        .ren-file-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary);
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .ren-file-remove:hover { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
        .ren-file-remove svg { width: 14px; height: 14px; display: block; }
        .ren-pattern-section {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-light);
        }
        .ren-pattern-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
          display: block;
        }
        .ren-pattern-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .ren-pattern-input:focus { border-color: #8B5CF6; }
        .ren-variables {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .ren-var-chip {
          padding: 5px 10px;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          color: #8B5CF6;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ren-var-chip:hover { background: rgba(139, 92, 246, 0.2); }
        .ren-start-num {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
        }
        .ren-start-num label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .ren-start-num input {
          width: 80px;
          padding: 8px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 14px;
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.2s;
        }
        .ren-start-num input:focus { border-color: #8B5CF6; }
        .ren-btn {
          width: 100%;
          margin-top: 20px;
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
        .ren-btn:hover:not(:disabled) {
          background: #A78BFA;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
        }
        .ren-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .ren-error-box {
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
        .ren-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .ren-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .ren-info-box svg { width: 16px; height: 16px; color: #8B5CF6; flex-shrink: 0; margin-top: 1px; }
        .ren-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .ren-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .ren-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .ren-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .ren-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .ren-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .ren-features { grid-template-columns: 1fr; }
          .ren-file-row { flex-wrap: wrap; }
        }
      `}</style>

      <div className="ren-root">
        <div className="ren-inner">
          <nav className="ren-breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="ren-breadcrumb-current">Renomear Arquivos</span>
          </nav>

          <div className="ren-header">
            <div className="ren-icon-wrap">✏️</div>
            <h1 className="ren-title">Renomear Arquivos</h1>
            <p className="ren-subtitle">Renomeie múltiplos arquivos em lote usando padrões configuráveis.</p>
          </div>

          <div className="ren-card">
            <label className="ren-upload-trigger" style={{ display: 'block' }}>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="ren-upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="ren-upload-label">Clique para selecionar arquivos</div>
              <div className="ren-upload-hint">Múltiplos arquivos de qualquer tipo</div>
            </label>

            {files.length > 0 && (
              <>
                <div className="ren-files-header">
                  <span className="ren-files-count">{files.length} {files.length === 1 ? 'arquivo' : 'arquivos'} selecionado{files.length === 1 ? '' : 's'}</span>
                  <button className="ren-clear-btn" onClick={clearAll}>Limpar todos</button>
                </div>

                <div className="ren-file-list">
                  {previewEntries.map((entry, i) => (
                    <div key={i} className="ren-file-row">
                      <span className="ren-file-name" title={entry.originalFile.name}>{entry.originalFile.name}</span>
                      <span className="ren-file-arrow">→</span>
                      <span className="ren-file-preview" title={entry.newName}>{entry.newName}</span>
                      <button className="ren-file-remove" onClick={() => removeFile(i)} title="Remover">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="ren-pattern-section">
                  <label className="ren-pattern-label">Padrão de renomeação</label>
                  <input
                    className="ren-pattern-input"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="Ex: foto_{n}{ext}"
                  />
                  <div className="ren-variables">
                    {[
                      { label: '{n}', desc: 'número sequencial' },
                      { label: '{name}', desc: 'nome original' },
                      { label: '{ext}', desc: 'extensão' },
                    ].map((v) => (
                      <button
                        key={v.label}
                        className="ren-var-chip"
                        onClick={() => setPattern((p) => p + v.label)}
                        title={v.desc}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <div className="ren-start-num">
                    <label htmlFor="start-num">Iniciar em:</label>
                    <input
                      id="start-num"
                      type="number"
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>

                {error && (
                  <div className="ren-error-box">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  className="ren-btn"
                  onClick={() => void handleDownloadAll()}
                  disabled={files.length === 0}
                >
                  ✏️ Aplicar e salvar
                </button>
              </>
            )}

            {files.length === 0 && (
              <div className="ren-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Selecione múltiplos arquivos, defina um padrão de nome e aplique para salvar todos renomeados.</p>
              </div>
            )}
          </div>

          <div className="ren-features">
            {[
              { e: '📦', t: 'Em lote', d: 'Renomeie dezenas de arquivos' },
              { e: '🔧', t: 'Padrões', d: 'Use variáveis como {n}, {name}, {ext}' },
              { e: '👁️', t: 'Pré-visualização', d: 'Veja o resultado antes de aplicar' },
            ].map((x) => (
              <div key={x.t} className="ren-feature">
                <div className="ren-feature-emoji">{x.e}</div>
                <div className="ren-feature-title">{x.t}</div>
                <div className="ren-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
