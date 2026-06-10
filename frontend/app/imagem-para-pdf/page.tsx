'use client';

import { useState, useRef, useCallback } from 'react';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PdfImageCapture from '../components/PdfImageCapture';

type PageSize = 'auto' | 'a4' | 'letter';
type Orientation = 'auto' | 'portrait' | 'landscape';
type Margin = 0 | 5 | 10 | 20;
type Fit = 'contain' | 'cover';
type ImgRotation = 0 | 90 | 180 | 270;

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  orientation: Orientation;
  rotation: ImgRotation;
}

let idCounter = 0;
function genId() {
  return `img-${++idCounter}`;
}

export default function ImagemParaPDF() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('auto');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [globalRotation, setGlobalRotation] = useState<ImgRotation>(0);
  const [margin, setMargin] = useState<Margin>(10);
  const [fit, setFit] = useState<Fit>('contain');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dropOverIndex, setDropOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);

  const validExts = ['.jpg', '.jpeg', '.png', '.webp'];

  const addImages = (files: File[]) => {
    const valid: ImageFile[] = [];

    for (const f of files) {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!validExts.includes(ext)) continue;
      valid.push({
        id: genId(),
        file: f,
        preview: URL.createObjectURL(f),
        orientation: 'auto',
        rotation: globalRotation,
      });
    }

    if (valid.length === 0 && files.length > 0) {
      setError('Selecione apenas imagens JPG, PNG ou WEBP.');
      return;
    }

    setImages(prev => [...prev, ...valid]);
    setError('');
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImages(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const updateImageOrientation = (id: string, nextOrientation: Orientation) => {
    setImages(prev => prev.map(img => (
      img.id === id ? { ...img, orientation: nextOrientation } : img
    )));
  };

  const updateImageRotation = (id: string, nextRotation: ImgRotation) => {
    setImages(prev => prev.map(img => (
      img.id === id ? { ...img, rotation: nextRotation } : img
    )));
  };

  const applyOrientationToAll = (nextOrientation: Orientation) => {
    setOrientation(nextOrientation);
    setImages(prev => prev.map(img => ({ ...img, orientation: 'auto' })));
  };

  const applyRotationToAll = (nextRotation: ImgRotation) => {
    setGlobalRotation(nextRotation);
    setImages(prev => prev.map(img => ({ ...img, rotation: nextRotation })));
  };

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= images.length) return;
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
  }, [images.length]);

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropOverIndex(index);
  };

  const handleDragLeave = () => {
    setDropOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (dragIndex.current !== null && dragIndex.current !== index) {
      moveImage(dragIndex.current, index);
    }
    dragIndex.current = null;
    setDropOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDropOverIndex(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    for (const img of images) {
      formData.append('files', img.file);
    }
    formData.append('page_size', pageSize);
    formData.append('orientation', orientation);
    formData.append('image_orientations', JSON.stringify(images.map(img => img.orientation)));
    formData.append('image_rotations', JSON.stringify(images.map(img => img.rotation)));
    formData.append('margin_mm', String(margin));
    formData.append('fit', fit);

    try {
      const response = await apiPost('/images-to-pdf', formData);
      if (!response.ok) {
        let serverMsg = '';
        try {
          const body = await response.json();
          serverMsg = body?.detail?.message || body?.detail || body?.message || '';
        } catch {}
        throw new Error(serverMsg || 'Erro ao converter imagens para PDF');
      }

      const blob = await response.blob();
      const filename = images.length === 1
        ? images[0].file.name.replace(/\.[^.]+$/, '') + '.pdf'
        : 'imagens_convertidas.pdf';
      await downloadBlob(blob, filename);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao converter as imagens. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    images.forEach(i => URL.revokeObjectURL(i.preview));
    setImages([]);
    setPageSize('auto');
    setOrientation('auto');
    setGlobalRotation(0);
    setMargin(10);
    setFit('contain');
  };

  return (
    <>
      <style>{`
        .page-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .page-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .breadcrumb a:hover { color: var(--text-primary); }
        .breadcrumb span { color: var(--border-light); }
        .breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .page-header {
          margin-bottom: 32px;
        }
        .page-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #8B5CF6; }
        .page-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .page-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .upload-trigger {
          border: 1.5px dashed var(--border-medium);
          border-radius: 14px;
          padding: 28px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
          display: block;
        }
        .upload-trigger:hover {
          border-color: #8B5CF6;
          background: rgba(139, 92, 246, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #8B5CF6;
        }
        .upload-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .upload-hint {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .images-list {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .image-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          cursor: grab;
          user-select: none;
          transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
        }
        .image-row:active {
          cursor: grabbing;
        }
        .image-row.dragging {
          opacity: 0.5;
        }
        .image-row.drop-over {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
        }
        .image-grip {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          color: var(--text-tertiary);
          cursor: grab;
        }
        .image-grip:active {
          cursor: grabbing;
        }
        .image-grip svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .image-thumb {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
          background: var(--bg-secondary);
          pointer-events: none;
        }
        .image-info {
          flex: 1;
          min-width: 0;
        }
        .image-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .image-size {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .image-reorder {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }
        .image-reorder button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          color: var(--text-tertiary);
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-reorder button:hover {
          background: rgba(139, 92, 246, 0.12);
          color: #8B5CF6;
        }
        .image-reorder button:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }
        .image-reorder button:disabled:hover {
          background: none;
          color: var(--text-tertiary);
        }
        .image-reorder svg {
          width: 14px;
          height: 14px;
          display: block;
        }
        .image-remove {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: var(--text-tertiary);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .image-remove:hover {
          background: rgba(239,68,68,0.15);
          color: #EF4444;
        }
        .image-remove svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .image-orientation {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          padding: 2px;
          border: 1px solid var(--border-light);
          border-radius: 9px;
          background: var(--bg-secondary);
        }
        .orientation-btn {
          min-width: 30px;
          height: 28px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: var(--text-tertiary);
          cursor: pointer;
          font: 700 11px var(--font-body);
          transition: background 0.15s, color 0.15s;
        }
        .orientation-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          color: #8B5CF6;
        }
        .orientation-btn.active {
          background: #8B5CF6;
          color: white;
        }
        .rotate-cycle-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          height: 32px;
          padding: 0 10px;
          border: 1px solid var(--border-light);
          border-radius: 9px;
          background: var(--bg-secondary);
          color: var(--text-tertiary);
          cursor: pointer;
          font: 600 11px var(--font-body);
          transition: all 0.15s;
          white-space: nowrap;
        }
        .rotate-cycle-btn:hover {
          border-color: #F59E0B;
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.08);
        }
        .rotate-cycle-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        .rotate-cycle-label {
          font-weight: 700;
          color: #F59E0B;
        }
        .rotate-global {
          height: 40px;
          font-size: 12px;
          justify-content: center;
          width: 100%;
        }
        .rotate-global .rotate-cycle-icon {
          width: 18px;
          height: 18px;
        }
        .rotation-wide {
          grid-column: 1 / -1;
        }
        .options-section {
          margin-top: 20px;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }
        .options-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 16px;
        }
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .option-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .option-group label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .option-group select {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 10px 12px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-primary);
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 32px;
        }
        .option-group select:focus {
          border-color: #8B5CF6;
        }
        .orientation-wide {
          grid-column: 1 / -1;
        }
        .orientation-control {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 4px;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          background: var(--bg-secondary);
        }
        .orientation-control .orientation-btn {
          flex: 1;
          min-width: 92px;
          height: 36px;
        }
        .btn-convert {
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
        .btn-convert:hover:not(:disabled) {
          background: #A78BFA;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
        }
        .btn-convert:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .btn-outline {
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
        .btn-outline:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }
        .error-box {
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
        .error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #8B5CF6; flex-shrink: 0; margin-top: 1px; }
        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .file-count-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(139, 92, 246, 0.1);
          color: #8B5CF6;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 100px;
          margin-bottom: 12px;
        }
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .trust-item {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .trust-emoji { font-size: 22px; margin-bottom: 8px; }
        .trust-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .trust-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .trust-grid { grid-template-columns: 1fr; }
          .options-grid { grid-template-columns: 1fr; }
          .image-row { flex-wrap: wrap; }
          .image-info { flex-basis: calc(100% - 92px); }
           .image-orientation {
            order: 5;
            width: 100%;
            justify-content: space-between;
          }
          .image-orientation .orientation-btn { flex: 1; }
          .rotate-cycle-btn { order: 6; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Convertendo imagens para PDF…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Imagem para PDF</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="page-title">Imagem para PDF</h1>
            <p className="page-subtitle">Converta uma ou várias imagens em um único arquivo PDF com controle de layout.</p>
          </div>

          <div className="card">
            <label className="upload-trigger">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                onChange={handleFiles}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="upload-label">Clique para selecionar imagens</div>
              <div className="upload-hint">JPG, PNG, WEBP • Múltiplos arquivos permitidos</div>
            </label>

            <PdfImageCapture multiple asImages onImagesReady={addImages} />

            {images.length > 0 && (
              <>
                <div className="file-count-badge">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {images.length} {images.length === 1 ? 'imagem' : 'imagens'} selecionada{images.length === 1 ? '' : 's'}
                </div>

                <div className="images-list">
                  {images.map((img, i) => (
                    <div
                      key={img.id}
                      className={`image-row${dropOverIndex === i ? ' drop-over' : ''}${dragIndex.current === i ? ' dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(i)}
                      onDragEnd={handleDragEnd}
                    >
                      <div
                        className="image-grip"
                        title="Arraste para reordenar"
                      >
                        <svg fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="9" cy="5" r="1.5" />
                          <circle cx="15" cy="5" r="1.5" />
                          <circle cx="9" cy="12" r="1.5" />
                          <circle cx="15" cy="12" r="1.5" />
                          <circle cx="9" cy="19" r="1.5" />
                          <circle cx="15" cy="19" r="1.5" />
                        </svg>
                      </div>
                      <img
                        className="image-thumb"
                        src={img.preview}
                        alt={img.file.name}
                        style={{ transform: `rotate(${img.rotation}deg)` }}
                      />
                      <div className="image-info">
                        <div className="image-name">{img.file.name}</div>
                        <div className="image-size">
                          {formatBytes(img.file.size)} - Pagina {img.orientation === 'auto' ? 'auto' : img.orientation === 'portrait' ? 'retrato' : 'paisagem'}
                        </div>
                      </div>
                      <div className="image-orientation" aria-label={`Orientacao da imagem ${i + 1}`}>
                        {[
                          { value: 'auto', label: 'Auto', title: 'Usar orientacao do arquivo' },
                          { value: 'portrait', label: 'Ret', title: 'Retrato nesta imagem' },
                          { value: 'landscape', label: 'Pais', title: 'Paisagem nesta imagem' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={`orientation-btn${img.orientation === item.value ? ' active' : ''}`}
                            onClick={() => updateImageOrientation(img.id, item.value as Orientation)}
                            title={item.title}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="rotate-cycle-btn"
                        onClick={() => updateImageRotation(img.id, ((img.rotation + 90) % 360) as ImgRotation)}
                        title="Girar imagem"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="rotate-cycle-icon" style={img.rotation !== 0 ? { color: '#F59E0B' } : undefined}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {img.rotation > 0 && <span className="rotate-cycle-label">{img.rotation}°</span>}
                      </button>
                      <div className="image-reorder">
                        <button
                          onClick={() => moveImage(i, i - 1)}
                          disabled={i === 0}
                          title="Mover para cima"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveImage(i, i + 1)}
                          disabled={i === images.length - 1}
                          title="Mover para baixo"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <button
                        className="image-remove"
                        onClick={() => removeImage(img.id)}
                        title="Remover imagem"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="options-section">
                  <div className="options-title">Opções de Layout</div>
                  <div className="options-grid">
                    <div className="option-group">
                      <label htmlFor="page_size">Tamanho da Página</label>
                      <select
                        id="page_size"
                        value={pageSize}
                        onChange={e => setPageSize(e.target.value as PageSize)}
                      >
                        <option value="auto">Automático</option>
                        <option value="a4">A4</option>
                        <option value="letter">Carta</option>
                      </select>
                    </div>
                    <div className="option-group orientation-wide">
                      <label>Orientacao do arquivo completo</label>
                      <div className="orientation-control" role="group" aria-label="Orientacao do arquivo completo">
                        {[
                          { value: 'auto', label: 'Automatico' },
                          { value: 'portrait', label: 'Retrato' },
                          { value: 'landscape', label: 'Paisagem' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={`orientation-btn${orientation === item.value ? ' active' : ''}`}
                            onClick={() => applyOrientationToAll(item.value as Orientation)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="option-group rotation-wide">
                      <label>Rotacao das imagens</label>
                      <button
                        type="button"
                        className="rotate-cycle-btn rotate-global"
                        onClick={() => applyRotationToAll(((globalRotation + 90) % 360) as ImgRotation)}
                        title="Girar todas as imagens"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="rotate-cycle-icon" style={globalRotation !== 0 ? { color: '#F59E0B' } : undefined}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {globalRotation === 0 ? 'Girar todas' : `Girar todas (${globalRotation}°)`}
                      </button>
                    </div>
                    <div className="option-group">
                      <label htmlFor="margin">Margem (mm)</label>
                      <select
                        id="margin"
                        value={margin}
                        onChange={e => setMargin(Number(e.target.value) as Margin)}
                      >
                        <option value={0}>Sem margem</option>
                        <option value={5}>5 mm</option>
                        <option value={10}>10 mm</option>
                        <option value={20}>20 mm</option>
                      </select>
                    </div>
                    <div className="option-group">
                      <label htmlFor="fit">Ajuste da Imagem</label>
                      <select
                        id="fit"
                        value={fit}
                        onChange={e => setFit(e.target.value as Fit)}
                      >
                        <option value="contain">Conter (sem cortes)</option>
                        <option value="cover">Cobrir (preencher)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-convert"
                  onClick={handleConvert}
                  disabled={loading}
                >
                  {loading ? 'Convertendo…' : 'Converter para PDF'}
                </button>

                <button className="btn-outline" onClick={reset}>
                  Limpar tudo
                </button>
              </>
            )}

            {images.length === 0 && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>As imagens são convertidas com alta qualidade. Nenhum dado é armazenado em nossos servidores.</p>
              </div>
            )}

            {error && (
              <div className="error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '🖼️', t: 'Múltiplas Imagens', d: 'Combine várias fotos em um só PDF' },
              { e: '🎨', t: 'Controle de Layout', d: 'Tamanho, orientação e margens' },
              { e: '✨', t: 'Alta Qualidade', d: 'Resolução original preservada' },
            ].map((x) => (
              <div key={x.t} className="trust-item">
                <div className="trust-emoji">{x.e}</div>
                <div className="trust-title">{x.t}</div>
                <div className="trust-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
