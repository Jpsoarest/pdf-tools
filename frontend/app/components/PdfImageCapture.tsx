'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiPost } from '../lib/api';

interface PdfImageCaptureProps {
  multiple?: boolean;
  asImages?: boolean;
  onPdfReady?: (files: File[]) => void;
  onImagesReady?: (files: File[]) => void;
}

type ScanFilter = 'original' | 'document' | 'bw' | 'sharp' | 'light';

const SUPPORTED_IMAGE = /\.(jpe?g|png|webp)$/i;
const FILTERS: { value: ScanFilter; label: string }[] = [
  { value: 'document', label: 'Documento' },
  { value: 'bw', label: 'P&B' },
  { value: 'sharp', label: 'Nitido' },
  { value: 'light', label: 'Claro' },
  { value: 'original', label: 'Original' },
];

function imageBaseName(filename: string, fallback: string) {
  const base = filename.replace(/\.[^.]+$/, '').trim();
  return base || fallback;
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function adjust(value: number, contrast: number, brightness: number) {
  return clampChannel((value - 128) * contrast + 128 + brightness);
}

function processImageFile(file: File, filter: ScanFilter): Promise<File> {
  if (filter === 'original') return Promise.resolve(file);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Nao foi possivel preparar a imagem.'));
        return;
      }

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = r * 0.299 + g * 0.587 + b * 0.114;

        if (filter === 'bw') {
          const v = gray > 168 ? 255 : 0;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        } else if (filter === 'document') {
          const v = adjust(gray, 1.55, 18);
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        } else if (filter === 'sharp') {
          data[i] = adjust(r, 1.28, 8);
          data[i + 1] = adjust(g, 1.28, 8);
          data[i + 2] = adjust(b, 1.28, 8);
        } else if (filter === 'light') {
          data[i] = adjust(r, 1.12, 22);
          data[i + 1] = adjust(g, 1.12, 22);
          data[i + 2] = adjust(b, 1.12, 22);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Nao foi possivel gerar a imagem ajustada.'));
          return;
        }
        const base = imageBaseName(file.name, 'imagem');
        resolve(new File([blob], `${base}_${filter}.jpg`, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.94);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Nao foi possivel abrir a imagem.'));
    };
    image.src = url;
  });
}

export default function PdfImageCapture({
  multiple = false,
  asImages = false,
  onPdfReady,
  onImagesReady,
}: PdfImageCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pastePanelRef = useRef<HTMLDivElement>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [pendingSource, setPendingSource] = useState('imagem');
  const [pendingCaptured, setPendingCaptured] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ScanFilter>('document');
  const [previewUrl, setPreviewUrl] = useState('');
  const supportsCaptureSeries = multiple || asImages;

  const convertImages = useCallback(async (
    images: File[],
    sourceLabel: string,
    captured = false
  ): Promise<boolean> => {
    if (images.length === 0) return false;
    const selected = multiple ? images : images.slice(0, 1);
    setBusy(true);
    setError('');
    setMessage('');

    try {
      if (asImages) {
        onImagesReady?.(selected);
        setMessage(`${selected.length === 1 ? 'Imagem anexada' : 'Imagens anexadas'} para conversao.`);
      } else {
        const pdfs: File[] = [];
        for (const [index, image] of selected.entries()) {
          const formData = new FormData();
          formData.append('files', image);
          formData.append('page_size', 'auto');
          formData.append('orientation', 'auto');
          formData.append('margin_mm', '0');
          formData.append('fit', 'contain');
          const response = await apiPost('/images-to-pdf', formData);

          if (!response.ok) {
            const body = await response.json().catch(() => null) as { detail?: string } | null;
            throw new Error(body?.detail || 'Nao foi possivel converter a imagem em PDF.');
          }

          const blob = await response.blob();
          const fallback = `${sourceLabel}-${index + 1}`;
          const filename = `${imageBaseName(image.name, fallback)}.pdf`;
          pdfs.push(new File([blob], filename, { type: 'application/pdf' }));
        }

        onPdfReady?.(pdfs);
        setMessage(`${pdfs.length === 1 ? 'Imagem convertida' : 'Imagens convertidas'} em PDF e anexada${pdfs.length === 1 ? '' : 's'}.`);
      }

      if (captured) setCaptureCount((count) => count + selected.length);
      return true;
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : 'Nao foi possivel converter a imagem.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [asImages, multiple, onImagesReady, onPdfReady]);

  const openImageEditor = (files: File[], sourceLabel: string, captured = false) => {
    setPendingImages(files);
    setPendingSource(sourceLabel);
    setPendingCaptured(captured);
    setSelectedFilter('document');
    setError('');
    setMessage('');
  };

  const closeImageEditor = () => {
    setPendingImages([]);
    setPendingCaptured(false);
    setPendingSource('imagem');
  };

  const confirmImageEditor = async () => {
    try {
      const processed = await Promise.all(pendingImages.map((file) => processImageFile(file, selectedFilter)));
      closeImageEditor();
      await convertImages(processed, pendingSource, pendingCaptured);
    } catch (filterError) {
      setError(filterError instanceof Error ? filterError.message : 'Nao foi possivel aplicar o filtro.');
    }
  };

  const handleImageFiles = (files: File[]) => {
    const valid = files.filter((file) => SUPPORTED_IMAGE.test(file.name));
    if (valid.length !== files.length) {
      setError('Use imagens JPG, PNG ou WEBP.');
      return;
    }
    openImageEditor(valid, 'imagem');
  };

  const clipboardImageFiles = async (items: ClipboardItems) => {
    const now = Date.now();
    const files: File[] = [];
    for (const [index, item] of items.entries()) {
      const imageType = item.types.find((type) => type.startsWith('image/'));
      if (!imageType) continue;
      const blob = await item.getType(imageType);
      files.push(new File([blob], `captura-${now}-${index + 1}.png`, { type: imageType }));
    }
    return files;
  };

  const pasteFromClipboard = async () => {
    setError('');
    if (!navigator.clipboard?.read) {
      setError('Pressione Ctrl+V dentro deste painel para anexar a captura.');
      pastePanelRef.current?.focus();
      return;
    }

    try {
      const items = await navigator.clipboard.read();
      const files = await clipboardImageFiles(items);
      if (files.length === 0) {
        setError('A area de transferencia nao contem uma imagem.');
        return;
      }
      openImageEditor(files, 'captura', true);
    } catch {
      setError('O navegador bloqueou a leitura direta. Pressione Ctrl+V neste painel.');
      pastePanelRef.current?.focus();
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const imageItems = Array.from(event.clipboardData?.items ?? [])
        .filter((item) => item.type.startsWith('image/'));
      if (imageItems.length === 0 || busy) return;

      const now = Date.now();
      const files = imageItems
        .map((item, index) => {
          const blob = item.getAsFile();
          return blob
            ? new File([blob], `colagem-${now}-${index + 1}.png`, { type: blob.type || 'image/png' })
            : null;
        })
        .filter((file): file is File => file !== null);

      if (files.length > 0) {
        event.preventDefault();
        openImageEditor(files, 'colagem', captureOpen);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [busy, captureOpen, convertImages]);

  useEffect(() => {
    if (captureOpen) pastePanelRef.current?.focus();
  }, [captureOpen]);

  useEffect(() => {
    if (pendingImages.length === 0) {
      setPreviewUrl('');
      return;
    }
    const nextUrl = URL.createObjectURL(pendingImages[0]);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [pendingImages]);

  const openCapturePanel = () => {
    setCaptureOpen(true);
    setCaptureCount(0);
    setError('');
    setMessage('');
  };

  return (
    <>
      <style>{`
        .pic-root {
          margin-top: 12px;
          padding: 12px;
          border: 1px solid var(--border-light);
          border-radius: 14px;
          background: var(--bg-secondary);
        }
        .pic-title {
          margin: 0 0 9px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .pic-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pic-action {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--border-medium);
          border-radius: 10px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 9px 12px;
          font: 600 12px var(--font-body);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .pic-action:hover:not(:disabled) {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background: var(--accent-glow);
        }
        .pic-action:disabled {
          cursor: wait;
          opacity: 0.55;
        }
        .pic-help, .pic-status, .pic-error {
          margin: 9px 0 0;
          font-size: 12px;
          line-height: 1.45;
        }
        .pic-help { color: var(--text-tertiary); }
        .pic-status { color: var(--success); }
        .pic-error { color: var(--error); }
        .pic-modal {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 12000;
          width: min(360px, calc(100vw - 28px));
          border: 1px solid var(--border-medium);
          border-radius: 18px;
          padding: 15px;
          background: var(--bg-secondary);
          box-shadow: var(--shadow-xl);
          outline: none;
        }
        .pic-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .pic-modal-title {
          margin: 0;
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 700;
        }
        .pic-modal-close {
          border: none;
          border-radius: 8px;
          padding: 5px 8px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          font: 600 12px var(--font-body);
        }
        .pic-modal-copy {
          margin: 0 0 12px;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.55;
        }
        .pic-shortcut {
          display: inline-flex;
          align-items: center;
          margin: 0 3px;
          padding: 2px 6px;
          border: 1px solid var(--border-medium);
          border-radius: 5px;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 700;
        }
        .pic-paste-zone {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70px;
          margin-bottom: 10px;
          border: 1px dashed var(--accent-primary);
          border-radius: 12px;
          background: var(--accent-glow);
          color: var(--text-secondary);
          text-align: center;
          font-size: 12px;
          outline: none;
        }
        .pic-paste-zone:focus {
          box-shadow: 0 0 0 2px var(--accent-glow);
        }
        .pic-modal-action {
          width: 100%;
          border: 1px solid var(--accent-primary);
          border-radius: 10px;
          padding: 10px 12px;
          background: var(--accent-primary);
          color: white;
          cursor: pointer;
          font: 600 13px var(--font-body);
        }
        .pic-modal-action:disabled {
          opacity: 0.55;
          cursor: wait;
        }
        .pic-count {
          display: inline-flex;
          margin: 10px 0 0;
          border-radius: 999px;
          padding: 4px 9px;
          background: rgba(16, 185, 129, 0.12);
          color: var(--success);
          font-size: 11px;
          font-weight: 600;
        }
        .scan-backdrop {
          position: fixed;
          inset: 0;
          z-index: 12500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(17, 24, 39, 0.72);
        }
        .scan-modal {
          width: min(720px, calc(100vw - 28px));
          max-height: calc(100vh - 32px);
          overflow: auto;
          border: 1px solid var(--border-medium);
          border-radius: 18px;
          padding: 14px;
          background: var(--bg-secondary);
          box-shadow: var(--shadow-xl);
        }
        .scan-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .scan-title {
          margin: 0;
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 700;
        }
        .scan-subtitle {
          margin: 3px 0 0;
          color: var(--text-tertiary);
          font-size: 12px;
        }
        .scan-preview {
          display: grid;
          place-items: center;
          min-height: 260px;
          border: 1px solid var(--border-light);
          border-radius: 14px;
          background: var(--bg-tertiary);
          overflow: hidden;
        }
        .scan-preview img {
          max-width: 100%;
          max-height: 58vh;
          display: block;
        }
        .scan-preview img[data-filter="document"] { filter: grayscale(1) contrast(1.55) brightness(1.08); }
        .scan-preview img[data-filter="bw"] { filter: grayscale(1) contrast(2.2); }
        .scan-preview img[data-filter="sharp"] { filter: contrast(1.25) brightness(1.04) saturate(1.08); }
        .scan-preview img[data-filter="light"] { filter: contrast(1.1) brightness(1.16); }
        .scan-filters {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 7px;
          margin-top: 12px;
        }
        .scan-filter {
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 9px 8px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          font: 700 12px var(--font-body);
        }
        .scan-filter.active {
          border-color: var(--accent-primary);
          background: var(--accent-primary);
          color: white;
        }
        .scan-actions {
          display: flex;
          gap: 9px;
          justify-content: flex-end;
          margin-top: 12px;
        }
        .scan-secondary, .scan-primary {
          border: 1px solid var(--border-medium);
          border-radius: 10px;
          padding: 10px 13px;
          cursor: pointer;
          font: 700 13px var(--font-body);
        }
        .scan-secondary {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }
        .scan-primary {
          border-color: var(--accent-primary);
          background: var(--accent-primary);
          color: white;
        }
        .scan-primary:disabled {
          opacity: .55;
          cursor: wait;
        }
        @media (max-width: 560px) {
          .scan-filters { grid-template-columns: repeat(2, 1fr); }
          .scan-actions { flex-direction: column-reverse; }
          .scan-secondary, .scan-primary { width: 100%; }
        }
      `}</style>

      <div className="pic-root">
        <p className="pic-title">{asImages ? 'Adicionar prints ou imagens' : 'Adicionar uma imagem como PDF'}</p>
        <div className="pic-actions">
          <button type="button" className="pic-action" disabled={busy} onClick={() => inputRef.current?.click()}>
            Imagem
          </button>
          <button type="button" className="pic-action" disabled={busy} onClick={openCapturePanel}>
            Recortar tela
          </button>
          <span className="pic-action" aria-hidden="true">Ctrl+V para colar print</span>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple={multiple}
            onChange={(event) => {
              handleImageFiles(Array.from(event.target.files || []));
              event.target.value = '';
            }}
            style={{ display: 'none' }}
          />
        </div>
        <p className="pic-help">
          {asImages
            ? 'Cole prints ou use o painel de captura para montar varias paginas.'
            : 'Prints colados sao convertidos automaticamente para PDF.'}
        </p>
        {busy && !captureOpen && <p className="pic-status">{asImages ? 'Adicionando imagem...' : 'Convertendo imagem em PDF...'}</p>}
        {message && !busy && !captureOpen && <p className="pic-status">{message}</p>}
        {error && !captureOpen && <p className="pic-error">{error}</p>}
      </div>

      {pendingImages.length > 0 && (
        <div className="scan-backdrop" onClick={closeImageEditor}>
          <div className="scan-modal" onClick={(event) => event.stopPropagation()}>
            <div className="scan-head">
              <div>
                <p className="scan-title">Ajustar foto</p>
                <p className="scan-subtitle">
                  {pendingImages.length} imagem{pendingImages.length === 1 ? '' : 's'} - filtro aplicado antes de gerar o PDF.
                </p>
              </div>
              <button type="button" className="pic-modal-close" onClick={closeImageEditor}>
                Fechar
              </button>
            </div>
            <div className="scan-preview">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={pendingImages[0].name}
                  data-filter={selectedFilter}
                />
              )}
            </div>
            <div className="scan-filters" role="group" aria-label="Filtros da foto">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`scan-filter${selectedFilter === filter.value ? ' active' : ''}`}
                  onClick={() => setSelectedFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="scan-actions">
              <button type="button" className="scan-secondary" onClick={closeImageEditor}>
                Cancelar
              </button>
              <button type="button" className="scan-primary" disabled={busy} onClick={() => void confirmImageEditor()}>
                {busy ? 'Aplicando...' : 'Aplicar e anexar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {captureOpen && (
        <div ref={pastePanelRef} className="pic-modal" tabIndex={0}>
          <div className="pic-modal-header">
            <p className="pic-modal-title">Capturas de tela</p>
            <button type="button" className="pic-modal-close" onClick={() => setCaptureOpen(false)}>
              Fechar
            </button>
          </div>
          <p className="pic-modal-copy">
            Use <span className="pic-shortcut">Win + Shift + S</span> para recortar,
            ou <span className="pic-shortcut">PrtScn</span> para a tela completa.
            Depois pressione <span className="pic-shortcut">Ctrl + V</span> aqui.
          </p>
          <div className="pic-paste-zone">
            {busy ? 'Anexando captura...' : 'Cole a captura neste painel'}
          </div>
          <button type="button" className="pic-modal-action" disabled={busy} onClick={() => void pasteFromClipboard()}>
            {busy ? 'Anexando...' : 'Colar agora'}
          </button>
          {captureCount > 0 && (
            <div className="pic-count">
              {supportsCaptureSeries
                ? `${captureCount} captura${captureCount === 1 ? '' : 's'} anexada${captureCount === 1 ? '' : 's'}`
                : 'PDF de entrada atualizado'}
            </div>
          )}
          {message && !busy && <p className="pic-status">{message}</p>}
          {error && <p className="pic-error">{error}</p>}
        </div>
      )}
    </>
  );
}
