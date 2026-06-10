'use client';

import { useState, useRef } from 'react';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RedimensionarImagem() {
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [keepAspect, setKeepAspect] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validExts = ['.jpg', '.jpeg', '.png', '.webp'];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      setError('Selecione uma imagem JPG, PNG ou WEBP.');
      return;
    }

    if (image) URL.revokeObjectURL(image.preview);

    const img = new Image();
    const preview = URL.createObjectURL(file);
    img.onload = () => {
      setImage({ file, preview });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setError('');
    };
    img.src = preview;

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const w = parseInt(e.target.value) || 0;
    setWidth(Math.min(10000, Math.max(0, w)));
    if (keepAspect && image) {
      const imgEl = document.querySelector('.preview-image') as HTMLImageElement | null;
      const naturalW = imgEl?.naturalWidth || 1;
      const naturalH = imgEl?.naturalHeight || 1;
      if (w > 0) setHeight(Math.round(w * (naturalH / naturalW)));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value) || 0;
    setHeight(Math.min(10000, Math.max(0, h)));
    if (keepAspect && image) {
      const imgEl = document.querySelector('.preview-image') as HTMLImageElement | null;
      const naturalW = imgEl?.naturalWidth || 1;
      const naturalH = imgEl?.naturalHeight || 1;
      if (h > 0) setWidth(Math.round(h * (naturalW / naturalH)));
    }
  };

  const handleResize = async () => {
    if (!image || width <= 0 || height <= 0) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', image.file);
    formData.append('width', String(width));
    formData.append('height', String(height));
    formData.append('keep_aspect', String(keepAspect));

    try {
      const response = await apiPost('/resize-image', formData);
      if (!response.ok) throw new Error('Erro ao redimensionar imagem');

      const blob = await response.blob();
      const baseName = image.file.name.replace(/\.[^.]+$/, '');
      const ext = image.file.name.split('.').pop();
      const filename = `${baseName}_${width}x${height}.${ext}`;
      await downloadBlob(blob, filename);
    } catch {
      setError('Erro ao redimensionar a imagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (image) URL.revokeObjectURL(image.preview);
    setImage(null);
    setWidth(0);
    setHeight(0);
    setKeepAspect(true);
  };

  return (
    <>
      <style>{`
        .resize-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .resize-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .resize-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .resize-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .resize-breadcrumb a:hover { color: var(--text-primary); }
        .resize-breadcrumb span { color: var(--border-light); }
        .resize-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .resize-header {
          margin-bottom: 32px;
        }
        .resize-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .resize-icon-wrap svg { width: 28px; height: 28px; color: #10B981; }
        .resize-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .resize-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .resize-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .resize-upload-trigger {
          border: 1.5px dashed var(--border-medium);
          border-radius: 14px;
          padding: 28px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
          display: block;
        }
        .resize-upload-trigger:hover {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.03);
        }
        .resize-upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .resize-upload-icon svg {
          width: 22px;
          height: 22px;
          color: #10B981;
        }
        .resize-upload-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .resize-upload-hint {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .resize-preview-section {
          margin-top: 20px;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }
        .resize-preview-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        .resize-image-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          margin-bottom: 12px;
        }
        .resize-image-thumb {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
          background: var(--bg-secondary);
        }
        .resize-image-details {
          flex: 1;
          min-width: 0;
        }
        .resize-image-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .resize-image-size {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .resize-image-remove {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: var(--text-tertiary);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .resize-image-remove:hover {
          background: rgba(239,68,68,0.15);
          color: #EF4444;
        }
        .resize-image-remove svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .resize-preview-wrapper {
          width: 100%;
          max-height: 300px;
          overflow: hidden;
          border-radius: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .resize-preview-img {
          max-width: 100%;
          max-height: 300px;
          object-fit: contain;
          display: block;
        }
        .resize-dims-section {
          margin-top: 20px;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }
        .resize-dims-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 16px;
        }
        .resize-dims-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .resize-dim-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .resize-dim-group label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .resize-dim-group input {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 10px 12px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s;
        }
        .resize-dim-group input:focus {
          border-color: #10B981;
        }
        .resize-original-dims {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 10px;
          text-align: center;
        }
        .resize-checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          padding: 10px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .resize-checkbox-row:hover {
          border-color: #10B981;
        }
        .resize-checkbox-row input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #10B981;
          cursor: pointer;
          flex-shrink: 0;
        }
        .resize-checkbox-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          user-select: none;
        }
        .resize-btn {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #10B981;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .resize-btn:hover:not(:disabled) {
          background: #34D399;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
        }
        .resize-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .resize-btn-outline {
          width: 100%;
          margin-top: 12px;
          padding: 13px;
          background: transparent;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .resize-btn-outline:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }
        .resize-error-box {
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
        .resize-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .resize-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .resize-info-box svg { width: 16px; height: 16px; color: #10B981; flex-shrink: 0; margin-top: 1px; }
        .resize-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .resize-trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .resize-trust-item {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .resize-trust-emoji { font-size: 22px; margin-bottom: 8px; }
        .resize-trust-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .resize-trust-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .resize-trust-grid { grid-template-columns: 1fr; }
          .resize-dims-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Redimensionando imagem…" />}

      <div className="resize-root">
        <div className="resize-inner">
          <nav className="resize-breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="resize-breadcrumb-current">Redimensionar Imagem</span>
          </nav>

          <div className="resize-header">
            <div className="resize-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <h1 className="resize-title">Redimensionar Imagem</h1>
            <p className="resize-subtitle">Altere as dimensões da sua imagem com controle de proporção e alta qualidade.</p>
          </div>

          <div className="resize-card">
            {!image && (
              <label className="resize-upload-trigger">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFile}
                  style={{ display: 'none' }}
                />
                <div className="resize-upload-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="resize-upload-label">Clique para selecionar uma imagem</div>
                <div className="resize-upload-hint">JPG, PNG, WEBP</div>
              </label>
            )}

            {image && (
              <>
                <div className="resize-image-info">
                  <img
                    className="resize-image-thumb"
                    src={image.preview}
                    alt={image.file.name}
                  />
                  <div className="resize-image-details">
                    <div className="resize-image-name">{image.file.name}</div>
                    <div className="resize-image-size">{formatBytes(image.file.size)}</div>
                  </div>
                  <button
                    className="resize-image-remove"
                    onClick={reset}
                    title="Remover imagem"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="resize-preview-label">Pré-visualização</div>
                <div className="resize-preview-wrapper">
                  <img
                    className="preview-image resize-preview-img"
                    src={image.preview}
                    alt="Pré-visualização"
                  />
                </div>

                <div className="resize-dims-section">
                  <div className="resize-dims-title">Novas Dimensões (px)</div>
                  <div className="resize-dims-grid">
                    <div className="resize-dim-group">
                      <label htmlFor="width">Largura</label>
                      <input
                        id="width"
                        type="number"
                        min={1}
                        max={10000}
                        value={width || ''}
                        onChange={handleWidthChange}
                        placeholder="Largura"
                      />
                    </div>
                    <div className="resize-dim-group">
                      <label htmlFor="height">Altura</label>
                      <input
                        id="height"
                        type="number"
                        min={1}
                        max={10000}
                        value={height || ''}
                        onChange={handleHeightChange}
                        placeholder="Altura"
                      />
                    </div>
                  </div>
                  <div className="resize-original-dims">
                    Dimensões originais: {image ? (() => { const img = document.querySelector('.preview-image') as HTMLImageElement | null; return img ? `${img.naturalWidth} × ${img.naturalHeight} px` : `${width} × ${height} px`; })() : ''}
                  </div>

                  <label className="resize-checkbox-row">
                    <input
                      type="checkbox"
                      checked={keepAspect}
                      onChange={e => setKeepAspect(e.target.checked)}
                    />
                    <span className="resize-checkbox-label">Manter proporção</span>
                  </label>
                </div>

                <button
                  className="resize-btn"
                  onClick={handleResize}
                  disabled={loading || width <= 0 || height <= 0}
                >
                  {loading ? 'Redimensionando…' : 'Redimensionar Imagem'}
                </button>

                <button className="resize-btn-outline" onClick={reset}>
                  Limpar
                </button>
              </>
            )}

            {!image && (
              <div className="resize-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>A imagem é redimensionada com alta qualidade. Nenhum dado é armazenado em nossos servidores.</p>
              </div>
            )}

            {error && (
              <div className="resize-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          <div className="resize-trust-grid">
            {([
              { e: '📐', t: 'Dimensões Precisas', d: 'Controle exato de largura e altura' },
              { e: '🔒', t: 'Mantém Proporção', d: 'Opção de preservar a proporção original' },
              { e: '✨', t: 'Alta Qualidade', d: 'Resultado com qualidade profissional' },
            ]).map((x) => (
              <div key={x.t} className="resize-trust-item">
                <div className="resize-trust-emoji">{x.e}</div>
                <div className="resize-trust-title">{x.t}</div>
                <div className="resize-trust-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
