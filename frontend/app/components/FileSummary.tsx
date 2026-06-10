'use client';

interface FileSummaryProps {
  name: string;
  size: number;
  pages?: number;
  type?: string;
  status?: 'idle' | 'processing' | 'success' | 'error';
  metadata?: { label: string; value: string }[];
}

export default function FileSummary({ name, size, pages, type, status = 'idle', metadata }: FileSummaryProps) {
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const isPdf = name.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpe?g|png|webp|bmp)$/i.test(name);
  const isXml = name.toLowerCase().endsWith('.xml');

  const getTypeLabel = () => {
    if (type) return type;
    if (isPdf) return pages ? `PDF · ${pages} pags` : 'PDF';
    if (isImage) return 'Imagem';
    if (isXml) return 'XML';
    return 'Arquivo';
  };

  const statusColors: Record<string, string> = {
    idle: 'var(--text-tertiary)',
    processing: 'var(--accent-primary)',
    success: 'var(--success)',
    error: 'var(--error)',
  };

  return (
    <>
      <style>{`
        .fs-root {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fs-main {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .fs-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 20px;
          background: var(--bg-tertiary);
        }
        .fs-info {
          flex: 1;
          min-width: 0;
        }
        .fs-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fs-details {
          display: flex;
          gap: 12px;
          margin-top: 3px;
          font-size: 12px;
          color: var(--text-tertiary);
          flex-wrap: wrap;
        }
        .fs-detail {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .fs-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          background: ${statusColors[status]};
          animation: ${status === 'processing' ? 'pulse 1.5s infinite' : 'none'};
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .fs-meta-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .fs-meta-item {
          background: var(--bg-tertiary);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 11px;
          color: var(--text-secondary);
          display: flex;
          gap: 4px;
        }
        .fs-meta-label {
          color: var(--text-tertiary);
        }
        .fs-meta-value {
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>

      <div className="fs-root">
        <div className="fs-main">
          <div className="fs-icon">
            {isPdf ? '📄' : isImage ? '🖼️' : isXml ? '📋' : '📁'}
          </div>
          <div className="fs-info">
            <div className="fs-name">{name}</div>
            <div className="fs-details">
              <span>{getTypeLabel()}</span>
              <span className="fs-detail">
                <span className="fs-status" />
                {status === 'processing' && 'Processando...'}
                {status === 'success' && 'Concluido'}
                {status === 'error' && 'Falhou'}
                {status === 'idle' && formatBytes(size)}
              </span>
            </div>
          </div>
          {status !== 'processing' && (
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatBytes(size)}
            </span>
          )}
        </div>
        {metadata && metadata.length > 0 && (
          <div className="fs-meta-grid">
            {metadata.map((m, i) => (
              <div key={i} className="fs-meta-item">
                <span className="fs-meta-label">{m.label}:</span>
                <span className="fs-meta-value">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
