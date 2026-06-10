'use client';

import { useState, useRef, useCallback } from 'react';

interface UploadPanelProps {
  accept: string;
  maxSizeMB?: number;
  multiple?: boolean;
  label?: string;
  hint?: string;
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
}

export default function UploadPanel({
  accept,
  maxSizeMB = 50,
  multiple = false,
  label = 'Selecione um arquivo',
  hint = 'ou arraste e solte aqui',
  onFilesSelected,
  maxFiles = 20,
}: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');
  const isImage = (name: string) => /\.(jpe?g|png|webp|bmp|tiff?)$/i.test(name);
  const isXml = (name: string) => name.toLowerCase().endsWith('.xml');
  const isDocx = (name: string) => /\.(docx?)$/i.test(name);

  const getFileIcon = (name: string) => {
    if (isPdf(name)) return '📄';
    if (isImage(name)) return '🖼️';
    if (isXml(name)) return '📋';
    if (isDocx(name)) return '📝';
    return '📁';
  };

  const getFileColor = (name: string) => {
    if (isPdf(name)) return 'rgba(239,68,68,0.12)';
    if (isImage(name)) return 'rgba(16,185,129,0.12)';
    if (isXml(name)) return 'rgba(245,158,11,0.12)';
    return 'rgba(99,102,241,0.12)';
  };

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const maxBytes = maxSizeMB * 1024 * 1024;
      const acceptedList = accept.split(',').map((e) => e.trim().toLowerCase());
      const newFiles = Array.from(fileList);

      const valid: File[] = [];
      const errors: string[] = [];

      newFiles.forEach((f) => {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        if (!acceptedList.includes(ext)) {
          errors.push(`${f.name}: formato nao permitido`);
          return;
        }
        if (f.size > maxBytes) {
          errors.push(`${f.name}: excede ${maxSizeMB}MB`);
          return;
        }
        valid.push(f);
      });

      if (errors.length > 0) {
        setError(errors.join(' · '));
        return;
      }

      setError('');

      if (multiple) {
        const updated = [...files, ...valid].slice(0, maxFiles);
        setFiles(updated);
        onFilesSelected(updated);
      } else {
        setFiles(valid.slice(0, 1));
        onFilesSelected(valid.slice(0, 1));
      }
    },
    [accept, maxSizeMB, multiple, files, maxFiles, onFilesSelected]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesSelected(updated);
  };

  return (
    <>
      <style>{`
        .up-root { width: 100%; }
        .up-zone {
          border: 2px dashed var(--border-medium);
          border-radius: 16px;
          padding: clamp(32px, 5vw, 48px) 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s;
          background: var(--bg-secondary);
          position: relative;
        }
        .up-zone:hover {
          border-color: var(--accent-primary);
          background: var(--accent-glow);
        }
        .up-zone.dragging {
          border-color: var(--accent-primary);
          background: var(--accent-glow);
          transform: scale(1.01);
        }
        .up-icon {
          width: 56px;
          height: 56px;
          background: var(--bg-tertiary);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          transition: all 0.2s;
          font-size: 24px;
        }
        .up-zone.dragging .up-icon {
          background: rgba(99,102,241,0.15);
          transform: rotate(4deg);
        }
        .up-label {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .up-hint {
          font-size: 14px;
          color: var(--text-tertiary);
        }
        .up-hint strong {
          color: var(--accent-primary);
          font-weight: 600;
        }
        .up-badges {
          margin-top: 12px;
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .up-badge {
          background: var(--bg-tertiary);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 11px;
          color: var(--text-tertiary);
          font-weight: 500;
        }
        .up-error {
          margin-top: 12px;
          padding: 12px 16px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px;
          font-size: 13px;
          color: var(--error);
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .up-error svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .up-file-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .up-file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          transition: all 0.15s;
        }
        .up-file-item:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-medium);
        }
        .up-file-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 18px;
        }
        .up-file-info {
          flex: 1;
          min-width: 0;
        }
        .up-file-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .up-file-size {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .up-file-remove {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          transition: all 0.15s;
          flex-shrink: 0;
          cursor: pointer;
          border: none;
          background: none;
          font-size: 16px;
        }
        .up-file-remove:hover {
          background: rgba(239,68,68,0.15);
          color: var(--error);
        }
        .up-drop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .up-drop-overlay.active {
          opacity: 1;
        }
        .up-drop-card {
          background: var(--bg-elevated);
          border: 2px solid var(--accent-primary);
          border-radius: 24px;
          padding: 48px 64px;
          text-align: center;
          box-shadow: var(--shadow-xl);
        }
        .up-drop-card-title {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .up-drop-card-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        @media (max-width: 480px) {
          .up-zone { padding: 24px 16px; }
          .up-label { font-size: 14px; }
        }
      `}</style>

      <div className="up-root">
        <div
          className={`up-zone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          <div className="up-icon">📤</div>
          {isDragging ? (
            <p className="up-label">Solte para enviar</p>
          ) : (
            <>
              <p className="up-label">{label}</p>
              <p className="up-hint">{hint}</p>
            </>
          )}
          <div className="up-badges">
            <span className="up-badge">Max {maxSizeMB}MB</span>
            {multiple && <span className="up-badge">Até {maxFiles} arquivos</span>}
          </div>
        </div>

        {error && (
          <div className="up-error">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {files.length > 0 && (
          <div className="up-file-list">
            {files.map((file, i) => (
              <div key={i} className="up-file-item">
                <div className="up-file-icon" style={{ background: getFileColor(file.name) }}>
                  {getFileIcon(file.name)}
                </div>
                <div className="up-file-info">
                  <div className="up-file-name">{file.name}</div>
                  <div className="up-file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="up-file-remove" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
