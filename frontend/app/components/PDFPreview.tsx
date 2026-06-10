'use client';

import { useState, useEffect, useRef } from 'react';

interface PDFInfo {
  pageCount: number;
  fileSizeBytes: number;
  fileName: string;
}

interface PDFPreviewProps {
  file: File;
  showThumbnails?: boolean; // Para múltiplos arquivos (mesclar)
  maxThumbnails?: number;
}

export default function PDFPreview({
  file,
  showThumbnails = false,
  maxThumbnails = 4,
}: PDFPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Carregar PDF.js dinamicamente
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setPdfjsLib(lib);
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Carregar PDF quando arquivo ou lib estiver pronto
  useEffect(() => {
    if (!pdfjsLib || !file) return;
    loadPDF();
  }, [pdfjsLib, file]);

  const loadPDF = async () => {
    setLoading(true);
    setError('');
    setCurrentPage(1);
    setZoom(1);
    setThumbnails([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);

      setPdfInfo({
        pageCount: pdf.numPages,
        fileSizeBytes: file.size,
        fileName: file.name,
      });

      // Renderizar primeira página
      await renderPage(pdf, 1, 1);

      // Gerar thumbnails se necessário
      if (showThumbnails) {
        await generateThumbnails(pdf, Math.min(maxThumbnails, pdf.numPages));
      }
    } catch (err) {
      setError('Não foi possível pré-visualizar este PDF.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async (pdf: any, pageNum: number, scale: number) => {
    if (!canvasRef.current) return;

    // Cancelar renderização anterior
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport,
    };

    renderTaskRef.current = page.render(renderContext);
    await renderTaskRef.current.promise;
  };

  const generateThumbnails = async (pdf: any, count: number) => {
    const thumbs: string[] = [];
    for (let i = 1; i <= count; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      thumbs.push(canvas.toDataURL());
    }
    setThumbnails(thumbs);
  };

  const handlePageChange = async (newPage: number) => {
    if (!pdfDoc || newPage < 1 || newPage > (pdfInfo?.pageCount ?? 1)) return;
    setCurrentPage(newPage);
    await renderPage(pdfDoc, newPage, zoom);
  };

  const handleZoom = async (newZoom: number) => {
    const clamped = Math.min(2.5, Math.max(0.5, newZoom));
    setZoom(clamped);
    if (pdfDoc) {
      await renderPage(pdfDoc, currentPage, clamped);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="pdf-preview-loading">
        <div className="pdf-preview-spinner" />
        <span>Carregando pré-visualização...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-preview-error">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.293 4.293a1 1 0 011.414 0l7 7a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414l7-7z" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="pdf-preview-wrapper">
      <style>{`
        .pdf-preview-wrapper {
          background: #f8f7f4;
          border: 1px solid #e5e2db;
          border-radius: 16px;
          overflow: hidden;
          font-family: 'Georgia', serif;
        }

        /* Info Bar */
        .pdf-info-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: #1c1917;
          color: #d6d3d1;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pdf-info-filename {
          font-size: 13px;
          font-weight: 600;
          color: #fafaf9;
          letter-spacing: 0.01em;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pdf-info-badges {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .pdf-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }
        .pdf-badge-pages {
          background: #292524;
          color: #fb923c;
          border: 1px solid #44403c;
        }
        .pdf-badge-size {
          background: #292524;
          color: #34d399;
          border: 1px solid #44403c;
        }

        /* Toolbar */
        .pdf-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          background: #292524;
          border-bottom: 1px solid #3c3837;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pdf-nav-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pdf-btn {
          background: #3c3837;
          border: none;
          color: #d6d3d1;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          font-size: 14px;
        }
        .pdf-btn:hover:not(:disabled) {
          background: #57534e;
          color: #fafaf9;
        }
        .pdf-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .pdf-page-display {
          font-size: 13px;
          color: #a8a29e;
          font-family: 'Courier New', monospace;
          padding: 0 6px;
          white-space: nowrap;
        }
        .pdf-page-display strong {
          color: #fafaf9;
        }
        .pdf-zoom-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pdf-zoom-label {
          font-size: 12px;
          color: #78716c;
          font-family: 'Courier New', monospace;
          min-width: 40px;
          text-align: center;
        }

        /* Canvas Area */
        .pdf-canvas-area {
          overflow: auto;
          max-height: 420px;
          background: #44403c;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 20px;
          position: relative;
        }
        .pdf-canvas-area canvas {
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          border-radius: 4px;
          display: block;
          max-width: 100%;
        }

        /* Thumbnails */
        .pdf-thumbnails {
          padding: 12px 20px;
          background: #1c1917;
          display: flex;
          gap: 10px;
          overflow-x: auto;
          align-items: center;
          border-top: 1px solid #292524;
        }
        .pdf-thumbnails-label {
          font-size: 11px;
          color: #78716c;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
          margin-right: 4px;
        }
        .pdf-thumbnail {
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid #3c3837;
          transition: border-color 0.15s;
          position: relative;
        }
        .pdf-thumbnail:hover {
          border-color: #fb923c;
        }
        .pdf-thumbnail img {
          display: block;
          height: 72px;
          width: auto;
        }
        .pdf-thumbnail-num {
          position: absolute;
          bottom: 2px;
          right: 3px;
          background: rgba(0,0,0,0.7);
          color: #fafaf9;
          font-size: 9px;
          font-family: 'Courier New', monospace;
          padding: 1px 4px;
          border-radius: 3px;
        }
        .pdf-thumbnail-more {
          flex-shrink: 0;
          height: 72px;
          min-width: 44px;
          background: #292524;
          border: 2px dashed #44403c;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #78716c;
          font-size: 11px;
          font-family: 'Courier New', monospace;
          gap: 2px;
        }

        /* Loading & Error */
        .pdf-preview-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 32px;
          background: #f8f7f4;
          border-radius: 16px;
          color: #78716c;
          font-size: 14px;
          border: 1px solid #e5e2db;
        }
        .pdf-preview-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e7e5e4;
          border-top-color: #fb923c;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pdf-preview-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 16px;
          color: #c2410c;
          font-size: 14px;
        }
      `}</style>

      {/* Info Bar */}
      <div className="pdf-info-bar">
        <span className="pdf-info-filename" title={pdfInfo?.fileName}>
          📄 {pdfInfo?.fileName}
        </span>
        <div className="pdf-info-badges">
          <span className="pdf-badge pdf-badge-pages">
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {pdfInfo?.pageCount} {pdfInfo?.pageCount === 1 ? 'página' : 'páginas'}
          </span>
          <span className="pdf-badge pdf-badge-size">
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {formatBytes(pdfInfo?.fileSizeBytes ?? 0)}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="pdf-toolbar">
        {/* Navegação de páginas */}
        <div className="pdf-nav-group">
          <button
            className="pdf-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title="Primeira página"
          >
            ⏮
          </button>
          <button
            className="pdf-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Página anterior"
          >
            ←
          </button>
          <span className="pdf-page-display">
            <strong>{currentPage}</strong> / {pdfInfo?.pageCount}
          </span>
          <button
            className="pdf-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === (pdfInfo?.pageCount ?? 1)}
            title="Próxima página"
          >
            →
          </button>
          <button
            className="pdf-btn"
            onClick={() => handlePageChange(pdfInfo?.pageCount ?? 1)}
            disabled={currentPage === (pdfInfo?.pageCount ?? 1)}
            title="Última página"
          >
            ⏭
          </button>
        </div>

        {/* Controles de zoom */}
        <div className="pdf-zoom-group">
          <button
            className="pdf-btn"
            onClick={() => handleZoom(zoom - 0.25)}
            disabled={zoom <= 0.5}
            title="Diminuir zoom"
          >
            −
          </button>
          <span className="pdf-zoom-label">{Math.round(zoom * 100)}%</span>
          <button
            className="pdf-btn"
            onClick={() => handleZoom(zoom + 0.25)}
            disabled={zoom >= 2.5}
            title="Aumentar zoom"
          >
            +
          </button>
          <button
            className="pdf-btn"
            onClick={() => handleZoom(1)}
            title="Zoom padrão"
            style={{ fontSize: '10px', width: 'auto', padding: '0 8px' }}
          >
            100%
          </button>
        </div>
      </div>

      {/* Canvas de visualização */}
      <div className="pdf-canvas-area">
        <canvas ref={canvasRef} />
      </div>

      {/* Thumbnails (modo mesclar) */}
      {showThumbnails && thumbnails.length > 0 && (
        <div className="pdf-thumbnails">
          <span className="pdf-thumbnails-label">Páginas</span>
          {thumbnails.map((thumb, i) => (
            <div
              key={i}
              className="pdf-thumbnail"
              onClick={() => handlePageChange(i + 1)}
              style={{ cursor: 'pointer' }}
              title={`Ir para página ${i + 1}`}
            >
              <img src={thumb} alt={`Página ${i + 1}`} />
              <span className="pdf-thumbnail-num">{i + 1}</span>
            </div>
          ))}
          {(pdfInfo?.pageCount ?? 0) > maxThumbnails && (
            <div className="pdf-thumbnail-more">
              <span>+{(pdfInfo?.pageCount ?? 0) - maxThumbnails}</span>
              <span>pgs</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}