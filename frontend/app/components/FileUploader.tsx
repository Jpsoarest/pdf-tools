'use client';

import { useState, useRef } from 'react';

interface FileUploaderProps {
  accept: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export default function FileUploader({
  accept,
  maxSizeMB = 10,
  multiple = false,
  onFilesSelected,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    files.forEach((file) => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const accepted = accept.split(',').map((e) => e.trim());
      if (!accepted.includes(extension)) {
        errors.push(`${file.name}: tipo não permitido`);
        return;
      }
      if (file.size > maxBytes) {
        errors.push(`${file.name}: excede ${maxSizeMB}MB`);
        return;
      }
      valid.push(file);
    });

    return { valid, errors };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const { valid, errors } = validateFiles(Array.from(files));
    if (errors.length > 0) {
      setError(errors.join(' · '));
      return;
    }
    setError('');
    setSelectedFiles(valid);
    onFilesSelected(valid);
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelected(updated);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');
  const isImage = (name: string) => /\.(jpe?g|png|gif|webp|svg)$/i.test(name);

  return (
    <>
      <style>{`
        .uploader-zone {
          border: 1.5px dashed rgba(255,255,255,0.12);
          border-radius: 16px;
          padding: clamp(28px, 5vw, 48px) 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(255,255,255,0.02);
          position: relative;
        }
        .uploader-zone:hover {
          border-color: rgba(232,255,71,0.35);
          background: rgba(232,255,71,0.03);
        }
        .uploader-zone.dragging {
          border-color: #E8FF47;
          background: rgba(232,255,71,0.06);
          transform: scale(1.01);
        }
        .uploader-icon {
          width: 52px;
          height: 52px;
          background: rgba(255,255,255,0.05);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          transition: all 0.2s;
        }
        .uploader-zone.dragging .uploader-icon {
          background: rgba(232,255,71,0.15);
        }
        .uploader-icon svg {
          width: 24px;
          height: 24px;
          color: rgba(255,255,255,0.4);
          transition: color 0.2s;
        }
        .uploader-zone.dragging .uploader-icon svg {
          color: #E8FF47;
        }
        .uploader-label {
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          margin-bottom: 6px;
        }
        .uploader-hint {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
        }
        .uploader-hint strong {
          color: #E8FF47;
          font-weight: 600;
        }
        .uploader-limit {
          margin-top: 12px;
          display: inline-block;
          background: rgba(255,255,255,0.05);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-weight: 500;
        }
        .uploader-error {
          margin-top: 12px;
          padding: 12px 16px;
          background: rgba(255,59,48,0.1);
          border: 1px solid rgba(255,59,48,0.2);
          border-radius: 10px;
          font-size: 13px;
          color: #FF6B6B;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .uploader-error svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .file-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          transition: all 0.15s;
        }
        .file-item:hover {
          background: rgba(255,255,255,0.06);
        }
        .file-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 16px;
        }
        .file-info {
          flex: 1;
          min-width: 0;
        }
        .file-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-size {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          margin-top: 2px;
        }
        .file-remove {
          background: none;
          border: none;
          cursor: pointer;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.3);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .file-remove:hover {
          background: rgba(255,59,48,0.15);
          color: #FF6B6B;
        }
        .file-remove svg {
          width: 14px;
          height: 14px;
        }
      `}</style>

      <div>
        {/* Drop zone */}
        <div
          className={`uploader-zone ${isDragging ? 'dragging' : ''}`}
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
          <div className="uploader-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          {isDragging ? (
            <p className="uploader-label">Solte aqui!</p>
          ) : (
            <>
              <p className="uploader-label">
                Clique para selecionar {multiple ? 'arquivos' : 'um arquivo'}
              </p>
              <p className="uploader-hint">
                ou <strong>arraste e solte</strong> aqui
              </p>
            </>
          )}
          <span className="uploader-limit">Máx. {maxSizeMB}MB por arquivo</span>
        </div>

        {/* Error */}
        {error && (
          <div className="uploader-error">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* File list */}
        {selectedFiles.length > 0 && (
          <div className="file-list">
            {selectedFiles.map((file, i) => (
              <div key={i} className="file-item">
                <div
                  className="file-icon"
                  style={{
                    background: isPdf(file.name)
                      ? 'rgba(255,59,48,0.12)'
                      : isImage(file.name)
                      ? 'rgba(10,132,255,0.12)'
                      : 'rgba(255,255,255,0.06)',
                    fontSize: '18px',
                  }}
                >
                  {isPdf(file.name) ? '📄' : isImage(file.name) ? '🖼' : '📁'}
                </div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="file-remove" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}