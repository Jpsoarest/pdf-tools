'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToolChain } from '../components/ToolChainProvider';
import PdfImageCapture from '../components/PdfImageCapture';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function ReordenarPDF() {
  const router = useRouter();
  const { incomingFile, consumeFile, pushFile, clearFile } = useToolChain();
  const chainLoaded = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [sourceTool, setSourceTool] = useState('');
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    if (window.pdfjsLib) {
      scriptLoadedRef.current = true;
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      scriptLoadedRef.current = true;
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);
  }, []);

  const loadPDF = useCallback(async (pdfFile: File) => {
    setLoadingPDF(true);
    setError('');
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages = pdfDoc.numPages;

      if (pages <= 1) {
        setError('PDF com apenas 1 página não pode ser reordenado.');
        setNumPages(0);
        setPageOrder([]);
        setThumbnails([]);
        setLoadingPDF(false);
        return;
      }

      setNumPages(pages);
      const order = Array.from({ length: pages }, (_, i) => i + 1);
      setPageOrder(order);

      const thumbs: string[] = [];
      const scale = 0.4;
      for (let i = 1; i <= pages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
      }
      setThumbnails(thumbs);
    } catch {
      setError('Erro ao carregar o PDF. Verifique se o arquivo é válido.');
      setNumPages(0);
      setPageOrder([]);
      setThumbnails([]);
    } finally {
      setLoadingPDF(false);
    }
  }, []);

  useEffect(() => {
    if (chainLoaded.current) return;
    const f = consumeFile();
    if (f) {
      chainLoaded.current = true;
      const newFile = new File([f.file], f.filename, { type: 'application/pdf' });
      setFile(newFile);
      setSourceTool(f.sourceToolName);
      loadPDF(newFile);
    }
  }, [consumeFile, loadPDF]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF');
      return;
    }
    setFile(f);
    setError('');
    setSuccess(false);
    setNumPages(0);
    setPageOrder([]);
    setThumbnails([]);
    loadPDF(f);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setPageOrder((prev) => {
      const next = [...prev];
      const tmp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = tmp;
      return next;
    });
    setSuccess(false);
  };

  const moveDown = (idx: number) => {
    if (idx === pageOrder.length - 1) return;
    setPageOrder((prev) => {
      const next = [...prev];
      const tmp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = tmp;
      return next;
    });
    setSuccess(false);
  };

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    if (dragIdx === null || dragIdx === toIdx) return;

    setPageOrder((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
    setSuccess(false);
    setDragIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleReorder = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('order', JSON.stringify(pageOrder));

    try {
      const response = await apiPost('/reorder-pdf', formData);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as any).detail || 'Erro ao reordenar PDF');
      }
      const blob = await response.blob();
      setResultBlob(blob);
      await downloadBlob(blob, `reordenado_${file.name}`);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao reordenar o PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setNumPages(0);
    setPageOrder([]);
    setThumbnails([]);
    setSuccess(false);
    setError('');
    setResultBlob(null);
    setSourceTool('');
    chainLoaded.current = false;
    clearFile();
  };

  const sendTo = (targetHref: string) => {
    if (!resultBlob) return;
    pushFile({
      file: resultBlob,
      filename: file ? `reordenado_${file.name}` : 'reordenado.pdf',
      sourceTool: '/reordenar-pdf',
      sourceToolName: 'Reordenar PDF',
    });
    router.push(targetHref);
  };

  const isOrderChanged = pageOrder.length > 0 && pageOrder.some((p, i) => p !== i + 1);

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
          background: rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #6366F1; }
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
          border-color: #6366F1;
          background: rgba(99, 102, 241, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #6366F1;
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
        .file-selected {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          margin-top: 14px;
        }
        .file-selected .file-icon { font-size: 22px; flex-shrink: 0; }
        .file-selected .file-info { flex: 1; min-width: 0; }
        .file-selected .file-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-selected .file-size {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .file-selected .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: var(--text-tertiary);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .file-selected .remove-btn:hover {
          background: rgba(239,68,68,0.15);
          color: #EF4444;
        }
        .file-selected .remove-btn svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .reorder-section {
          margin-top: 20px;
        }
        .reorder-section h3 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px;
        }
        .reorder-hint {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0 0 14px;
        }
        .thumb-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .thumb-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          cursor: grab;
          transition: all 0.2s;
          user-select: none;
        }
        .thumb-item:active { cursor: grabbing; }
        .thumb-item.dragging {
          opacity: 0.4;
          transform: scale(0.96);
        }
        .thumb-item.drag-over {
          border-color: #6366F1;
          background: rgba(99, 102, 241, 0.06);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
        }
        .thumb-canvas-wrap {
          position: relative;
          flex-shrink: 0;
          width: 80px;
          height: 104px;
          border-radius: 6px;
          overflow: hidden;
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
        }
        .thumb-canvas-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .thumb-page-num {
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.65);
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 8px;
          border-radius: 10px;
          pointer-events: none;
        }
        .thumb-info {
          flex: 1;
          min-width: 0;
        }
        .thumb-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .thumb-pos {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .thumb-controls {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
        }
        .thumb-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid var(--border-light);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          padding: 0;
        }
        .thumb-btn:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.1);
          border-color: #6366F1;
          color: #6366F1;
        }
        .thumb-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .thumb-btn svg {
          width: 14px;
          height: 14px;
        }
        .btn-reorder {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #6366F1;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-reorder:hover:not(:disabled) {
          background: #818CF8;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
        }
        .btn-reorder:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
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
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #6366F1; flex-shrink: 0; margin-top: 1px; }
        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .success-box {
          padding: 24px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 16px;
          margin-top: 16px;
        }
        .success-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .success-check {
          width: 36px; height: 36px;
          background: #10B981;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .success-check svg { width: 18px; height: 18px; color: white; }
        .success-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .success-p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 16px;
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
        .loading-pages {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
        }
        .loading-pages::before {
          content: '';
          width: 18px;
          height: 18px;
          border: 2.5px solid var(--border-medium);
          border-top-color: #6366F1;
          border-radius: 50%;
          animation: spinThumb 0.7s linear infinite;
        }
        @keyframes spinThumb {
          to { transform: rotate(360deg); }
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
          .thumb-item { gap: 8px; padding: 10px; }
          .thumb-canvas-wrap { width: 60px; height: 80px; }
          .thumb-controls { flex-direction: row; }
          .thumb-btn { width: 28px; height: 28px; }
        }
        .warning-box {
          display: flex;
          gap: 10px;
          padding: 14px 16px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 12px;
          margin-top: 16px;
          font-size: 13px;
          color: #D97706;
          align-items: flex-start;
        }
        .warning-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
      `}</style>

      {loading && <LoadingSpinner message="Reordenando seu PDF…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Reordenar PDF</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <h1 className="page-title">Reordenar PDF</h1>
            <p className="page-subtitle">Reorganize as páginas do seu PDF arrastando e soltando.</p>
          </div>

          <div className="card">
            {sourceTool && (
              <div style={{
                padding: '8px 14px', margin: '0 0 12px',
                background: 'var(--accent-glow)', border: '1px solid var(--border-light)',
                borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)',
              }}>
                <span style={{ color: 'var(--accent-primary)' }}>↳</span> Recebido de <strong>{sourceTool}</strong>
              </div>
            )}
            <label className="upload-trigger" style={{ display: 'block' }}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="upload-label">Clique para selecionar um PDF</div>
              <div className="upload-hint">Arquivo único • Máximo 50MB</div>
            </label>

            <PdfImageCapture
              onPdfReady={(pdfs) => {
                const converted = pdfs[0];
                setFile(converted);
                setError('');
                setSuccess(false);
                setNumPages(0);
                setPageOrder([]);
                setThumbnails([]);
                void loadPDF(converted);
              }}
            />

            {file && (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={reset}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {loadingPDF && (
              <div className="loading-pages">Carregando páginas do PDF…</div>
            )}

            {thumbnails.length > 0 && !loadingPDF && (
              <div className="reorder-section">
                <h3>Reordenar páginas</h3>
                <p className="reorder-hint">
                  Arraste as miniaturas ou use os botões ↑ ↓ para reorganizar. A nova ordem será enviada ao processar.
                </p>
                <div className="thumb-list">
                  {pageOrder.map((pageNum, idx) => (
                    <div
                      key={pageNum}
                      className={`thumb-item${dragIdx === idx ? ' dragging' : ''}${dragOverIdx === idx ? ' drag-over' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="thumb-canvas-wrap">
                        <img src={thumbnails[pageNum - 1]} alt={`Página ${pageNum}`} />
                        <span className="thumb-page-num">{pageNum}</span>
                      </div>
                      <div className="thumb-info">
                        <div className="thumb-label">Página {pageNum}</div>
                        <div className="thumb-pos">Posição {idx + 1}</div>
                      </div>
                      <div className="thumb-controls">
                        <button
                          className="thumb-btn"
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          title="Mover para cima"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          className="thumb-btn"
                          onClick={() => moveDown(idx)}
                          disabled={idx === pageOrder.length - 1}
                          title="Mover para baixo"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-reorder"
                  onClick={handleReorder}
                  disabled={loading || !isOrderChanged}
                >
                  {loading ? 'Reordenando…' : '🔀 Reordenar PDF'}
                </button>
              </div>
            )}

            {!file && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Arraste as miniaturas ou use os botões para reordenar as páginas. Nenhum dado é armazenado.</p>
              </div>
            )}

            {error && (
              <div className={`${error.includes('apenas 1 página') ? 'warning-box' : 'error-box'}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="success-box">
                <div className="success-header">
                  <div className="success-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3>PDF reordenado com sucesso!</h3>
                </div>
                <p className="success-p">O download foi iniciado automaticamente.</p>
                <button className="btn-outline" onClick={reset}>
                  ← Reordenar outro PDF
                </button>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Enviar para</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn-outline" onClick={() => sendTo('/comprimir-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Comprimir →</button>
                    <button className="btn-outline" onClick={() => sendTo('/proteger-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Proteger →</button>
                    <button className="btn-outline" onClick={() => sendTo('/girar-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Girar →</button>
                    <button className="btn-outline" onClick={() => sendTo('/cortar-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Cortar →</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '🖱️', t: 'Arrastar e Soltar', d: 'Reordene páginas com facilidade' },
              { e: '🖼️', t: 'Visualização em Miniatura', d: 'Veja cada página antes de reordenar' },
              { e: '⚡', t: 'Download Instantâneo', d: 'Arquivo pronto em segundos' },
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
