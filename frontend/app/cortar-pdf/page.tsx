'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Link from 'next/link';
import { useToolChain } from '../components/ToolChainProvider';
import PdfImageCapture from '../components/PdfImageCapture';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function CortarPDF() {
  const router = useRouter();
  const { incomingFile, consumeFile, pushFile, clearFile } = useToolChain();
  const chainLoaded = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [sourceTool, setSourceTool] = useState('');

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const [pagesMode, setPagesMode] = useState<'all' | 'range'>('all');
  const [pagesRange, setPagesRange] = useState('');

  const [crop, setCrop] = useState<CropRect | null>(null);

  useEffect(() => {
    if (chainLoaded.current) return;
    const f = consumeFile();
    if (f) {
      chainLoaded.current = true;
      setFile(new File([f.file], f.filename, { type: 'application/pdf' }));
      setSourceTool(f.sourceToolName);
    }
  }, [consumeFile]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setPdfjsLib(lib);
    };
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  useEffect(() => {
    if (!pdfjsLib || !file) return;
    loadPDF();
  }, [pdfjsLib, file]);

  const loadPDF = async () => {
    if (!pdfjsLib || !file) return;
    setPreviewLoading(true);
    setPreviewError('');
    setCurrentPage(1);
    setCrop(null);
    try {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      await renderPage(pdf, 1);
    } catch {
      setPreviewError('Nao foi possivel pre-visualizar este PDF.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) return;
    const page = await pdf.getPage(pageNum);
    const maxWidth = Math.min((containerRef.current?.clientWidth ?? 800) - 8, 820);
    const baseVp = page.getViewport({ scale: 1 });
    const scale = maxWidth / baseVp.width;
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
  };

  const handlePageChange = async (pageNum: number) => {
    if (!pdfDoc || pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
    setCrop(null);
    await renderPage(pdfDoc, pageNum);
  };

  const getCanvasPos = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const pos = getCanvasPos(e);
    dragStartRef.current = pos;
    setDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStartRef.current || !canvasRef.current) return;
    const pos = getCanvasPos(e);
    const x = Math.min(dragStartRef.current.x, pos.x);
    const y = Math.min(dragStartRef.current.y, pos.y);
    const w = Math.abs(pos.x - dragStartRef.current.x);
    const h = Math.abs(pos.y - dragStartRef.current.y);
    if (w > 5 && h > 5) {
      setCrop({ x, y, w, h });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleCrop = async () => {
    if (!file || !crop) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('x', Math.round(crop.x).toString());
    formData.append('y', Math.round(crop.y).toString());
    formData.append('width', Math.round(crop.w).toString());
    formData.append('height', Math.round(crop.h).toString());
    formData.append('pages', pagesMode === 'all' ? 'all' : pagesRange);

    try {
      const response = await apiPost('/crop-pdf', formData);
      if (!response.ok) { const errText = await response.text(); throw new Error(errText || 'Erro ao cortar'); }
      const blob = await response.blob();
      setResultBlob(blob);
      await downloadBlob(blob, `cropped_${file.name}`);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Erro ao cortar o PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSuccess(false);
    setCrop(null);
    setPdfDoc(null);
    setTotalPages(0);
    setPagesRange('');
    setResultBlob(null);
    setSourceTool('');
    chainLoaded.current = false;
    clearFile();
  };

  const sendTo = (targetHref: string) => {
    if (!resultBlob) return;
    pushFile({
      file: resultBlob,
      filename: file ? `cropped_${file.name}` : 'cropped.pdf',
      sourceTool: '/cortar-pdf',
      sourceToolName: 'Cortar PDF',
    });
    router.push(targetHref);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Selecione um arquivo PDF'); return; }
    setFile(f); setError(''); setSuccess(false); setCrop(null);
  };

  return (
    <>
      <style>{`
        .page-root { background: var(--bg-primary); min-height: 100vh; font-family: var(--font-body); color: var(--text-primary); padding: 32px 16px 60px; }
        .page-inner { max-width: 900px; margin: 0 auto; }
        .breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; font-size: 13px; }
        .breadcrumb a { color: var(--text-tertiary); text-decoration: none; transition: color 0.15s; }
        .breadcrumb a:hover { color: var(--text-primary); }
        .breadcrumb span { color: var(--border-light); }
        .breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .page-header { margin-bottom: 32px; }
        .page-icon-wrap { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: rgba(245, 158, 11, 0.1); border-radius: 16px; margin-bottom: 16px; }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #F59E0B; }
        .page-title { font-family: var(--font-display); font-size: clamp(28px, 6vw, 44px); font-weight: 800; letter-spacing: -1.5px; line-height: 1; margin: 0 0 10px; color: var(--text-primary); }
        .page-subtitle { font-size: 15px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 28px; }
        .card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px; padding: clamp(20px, 4vw, 32px); margin-bottom: 16px; box-shadow: var(--shadow-sm); }
        .upload-trigger { border: 1.5px dashed var(--border-medium); border-radius: 14px; padding: 28px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg-secondary); display: block; }
        .upload-trigger:hover { border-color: #F59E0B; background: rgba(245, 158, 11, 0.03); }
        .upload-icon { width: 48px; height: 48px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; }
        .upload-icon svg { width: 22px; height: 22px; color: #F59E0B; }
        .upload-label { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
        .upload-hint { font-size: 12px; color: var(--text-tertiary); }
        .file-selected { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-light); border-radius: 14px; margin-top: 14px; }
        .file-selected .file-icon { font-size: 22px; flex-shrink: 0; }
        .file-selected .file-info { flex: 1; min-width: 0; }
        .file-selected .file-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-selected .file-size { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
        .file-selected .remove-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: var(--text-tertiary); transition: all 0.15s; flex-shrink: 0; }
        .file-selected .remove-btn:hover { background: rgba(239,68,68,0.15); color: #EF4444; }
        .file-selected .remove-btn svg { width: 16px; height: 16px; display: block; }

        .preview-area { position: relative; margin-top: 16px; border: 1px solid var(--border-light); border-radius: 14px; overflow: hidden; background: #f5f5f5; }
        .preview-area canvas { display: block; max-width: 100%; height: auto; cursor: crosshair; user-select: none; }
        .crop-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .crop-box { position: absolute; border: 2px dashed #F59E0B; background: rgba(245, 158, 11, 0.1); }
        .crop-handle { position: absolute; width: 10px; height: 10px; background: #F59E0B; border: 1px solid white; border-radius: 2px; }

        .preview-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-light); flex-wrap: wrap; gap: 8px; }
        .preview-toolbar .page-nav { display: flex; align-items: center; gap: 4px; }
        .page-nav-btn { background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: all 0.15s; font-size: 14px; }
        .page-nav-btn:hover:not(:disabled) { background: var(--bg-primary); color: var(--text-primary); border-color: #F59E0B; }
        .page-nav-btn:disabled { opacity: 0.3; cursor: default; }
        .page-nav-info { font-size: 13px; color: var(--text-secondary); padding: 0 8px; white-space: nowrap; }
        .page-nav-info strong { color: var(--text-primary); }
        .crop-hint { font-size: 11px; color: #F59E0B; font-weight: 500; }

        .section-label { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-tertiary); margin: 20px 0 12px; }
        .mode-list { display: flex; flex-direction: column; gap: 8px; }
        .mode-option { border: 1.5px solid var(--border-light); border-radius: 14px; cursor: pointer; background: var(--bg-secondary); transition: border-color 0.15s; }
        .mode-option.selected { border-color: #F59E0B; background: rgba(245, 158, 11, 0.02); }
        .mode-option-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
        .mode-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border-medium); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .mode-option.selected .mode-radio { border-color: #F59E0B; }
        .mode-radio-dot { width: 8px; height: 8px; background: #F59E0B; border-radius: 50%; opacity: 0; }
        .mode-option.selected .mode-radio-dot { opacity: 1; }
        .mode-text .mode-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .mode-text .mode-desc { font-size: 12px; color: var(--text-tertiary); }
        .mode-input-wrap { padding: 0 16px 14px; }
        .mode-input { width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-light); border-radius: 10px; padding: 10px 14px; color: var(--text-primary); font-family: var(--font-body); font-size: 14px; outline: none; }
        .mode-input:focus { border-color: #F59E0B; }
        .mode-input::placeholder { color: var(--text-tertiary); }

        .btn-crop { width: 100%; margin-top: 20px; padding: 16px; background: #F59E0B; color: white; border: none; border-radius: 14px; font-family: var(--font-body); font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-crop:hover:not(:disabled) { background: #FBBF24; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25); }
        .btn-crop:disabled { background: var(--bg-tertiary); color: var(--text-tertiary); cursor: not-allowed; }

        .error-box { display: flex; gap: 10px; padding: 14px 16px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; margin-top: 16px; font-size: 13px; color: #EF4444; align-items: flex-start; }
        .error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .info-box { display: flex; gap: 12px; padding: 14px 16px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 12px; margin-top: 16px; }
        .info-box svg { width: 16px; height: 16px; color: #F59E0B; flex-shrink: 0; margin-top: 1px; }
        .info-box p { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5; }
        .success-box { padding: 24px; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 16px; margin-top: 16px; }
        .success-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .success-check { width: 36px; height: 36px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .success-check svg { width: 18px; height: 18px; color: white; }
        .success-header h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
        .success-p { font-size: 13px; color: var(--text-secondary); margin: 0 0 16px; }
        .btn-outline { width: 100%; padding: 13px; background: transparent; border: 1px solid var(--border-light); border-radius: 12px; color: var(--text-secondary); font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-outline:hover { background: var(--bg-tertiary); border-color: var(--border-medium); color: var(--text-primary); }
        .trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; }
        .trust-item { background: var(--card-bg); border: 1px solid var(--border-light); border-radius: 14px; padding: 16px 12px; text-align: center; }
        .trust-emoji { font-size: 22px; margin-bottom: 8px; }
        .trust-title { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
        .trust-desc { font-size: 11px; color: var(--text-tertiary); line-height: 1.4; }
        @media (max-width: 480px) { .trust-grid { grid-template-columns: 1fr; } }
      `}</style>

      {loading && <LoadingSpinner message="Cortando PDF..." />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <Link href="/">Inicio</Link>
            <span>/</span>
            <span className="breadcrumb-current">Cortar PDF</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h5l4-2h10v8H3z M7 9v6a4 4 0 008 0V9" />
              </svg>
            </div>
            <h1 className="page-title">Cortar PDF</h1>
            <p className="page-subtitle">Arraste na pagina para selecionar a area de corte. Simples e visual.</p>
          </div>

          <div className="card">
            {sourceTool && (
              <div style={{
                padding: '8px 14px', marginBottom: 12,
                background: 'var(--accent-glow)', border: '1px solid var(--border-light)',
                borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)',
              }}>
                <span style={{ color: 'var(--accent-primary)' }}>↳</span> Recebido de <strong>{sourceTool}</strong>
              </div>
            )}
            {!file && (
              <label className="upload-trigger">
                <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                <div className="upload-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="upload-label">Clique para selecionar um PDF</div>
                <div className="upload-hint">Maximo 50MB</div>
              </label>
            )}

            <PdfImageCapture onPdfReady={(pdfs) => { setFile(pdfs[0]); setError(''); setSuccess(false); setCrop(null); }} />

            {file && (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={reset}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {previewLoading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                Carregando pre-visualizacao...
              </div>
            )}

            {previewError && (
              <div className="error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {previewError}
              </div>
            )}

            {!previewLoading && !previewError && file && totalPages > 0 && (
              <>
                <div className="preview-area" style={{ position: 'relative', maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="preview-toolbar">
                    <div className="page-nav">
                      <button className="page-nav-btn" onClick={() => handlePageChange(1)} disabled={currentPage === 1} title="Primeira">⇤</button>
                      <button className="page-nav-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} title="Anterior">←</button>
                      <span className="page-nav-info"><strong>{currentPage}</strong> / {totalPages}</span>
                      <button className="page-nav-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} title="Proxima">→</button>
                      <button className="page-nav-btn" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} title="Ultima">⇥</button>
                    </div>
                    <span className="crop-hint">{crop ? 'Area selecionada!' : 'Arraste na pagina para selecionar a area de corte'}</span>
                  </div>
                  <div ref={containerRef} style={{ overflowX: 'auto', textAlign: 'center', background: '#e5e5e5', minHeight: '200px' }}>
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      style={{ cursor: 'crosshair', display: 'block', margin: '0 auto' }}
                    />
                    {crop && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${(crop.x / canvasRef.current!.width) * 100}%`,
                          top: `${(crop.y / canvasRef.current!.height) * 100}%`,
                          width: `${(crop.w / canvasRef.current!.width) * 100}%`,
                          height: `${(crop.h / canvasRef.current!.height) * 100}%`,
                          border: '2px dashed #F59E0B',
                          background: 'rgba(245, 158, 11, 0.15)',
                          pointerEvents: 'none',
                          zIndex: 10,
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: -20, left: 0,
                          background: '#F59E0B', color: 'white', fontSize: 10,
                          padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap',
                        }}>
                          {Math.round(crop.w)} x {Math.round(crop.h)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="info-box">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p>Arraste o mouse sobre a pagina para definir a area de corte. O corte sera aplicado conforme selecionado abaixo.</p>
                </div>

                <div className="section-label">Aplicar em</div>
                <div className="mode-list">
                  {[
                    { value: 'all' as const, label: 'Todas as paginas', desc: 'O mesmo corte em todas as paginas' },
                    { value: 'range' as const, label: 'Paginas especificas', desc: 'Escolha quais paginas cortar' },
                  ].map((m) => (
                    <div key={m.value} className={`mode-option ${pagesMode === m.value ? 'selected' : ''}`} onClick={() => setPagesMode(m.value)}>
                      <div className="mode-option-header">
                        <div className="mode-radio"><div className="mode-radio-dot" /></div>
                        <div className="mode-text">
                          <div className="mode-name">{m.label}</div>
                          <div className="mode-desc">{m.desc}</div>
                        </div>
                      </div>
                      {pagesMode === m.value && m.value === 'range' && (
                        <div className="mode-input-wrap" onClick={e => e.stopPropagation()}>
                          <input className="mode-input" type="text" value={pagesRange} onChange={e => setPagesRange(e.target.value)} placeholder="Ex: 1,3-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {crop && !success && (
                  <button className="btn-crop" onClick={handleCrop} disabled={loading}>
                    {loading ? 'Cortando...' : `Cortar PDF (${Math.round(crop.w)} x ${Math.round(crop.h)})`}
                  </button>
                )}

                {!crop && (
                  <button className="btn-crop" disabled>Arraste na pagina para definir o corte</button>
                )}
              </>
            )}

            {error && (
              <div className="error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            {success && (
              <div className="success-box">
                <div className="success-header">
                  <div className="success-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                  <h3>PDF cortado com sucesso!</h3>
                </div>
                <p className="success-p">O arquivo foi salvo na pasta de saída.</p>
                <button className="btn-outline" onClick={reset}>Cortar outro PDF</button>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Enviar para</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="btn-outline" onClick={() => sendTo('/comprimir-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Comprimir →</button>
                    <button className="btn-outline" onClick={() => sendTo('/proteger-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Proteger →</button>
                    <button className="btn-outline" onClick={() => sendTo('/reordenar-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Reordenar →</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '🖱️', t: 'Arraste Visual', d: 'Selecione a area diretamente na pagina' },
              { e: '✂️', t: 'Corte Preciso', d: 'Area exata do que voce selecionar' },
              { e: '📄', t: 'Por Pagina', d: 'Todas ou paginas especificas' },
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
