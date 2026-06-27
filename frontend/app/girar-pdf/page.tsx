'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import PDFPreview from '../components/PDFPreview';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import { useToolChain } from '../components/ToolChainProvider';
import PdfImageCapture from '../components/PdfImageCapture';

export default function GirarPDF() {
  const router = useRouter();
  const { incomingFile, consumeFile, pushFile, clearFile } = useToolChain();
  const chainLoaded = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [pageMode, setPageMode] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [sourceTool, setSourceTool] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (chainLoaded.current) return;
    const f = consumeFile();
    if (f) {
      chainLoaded.current = true;
      setFile(new File([f.file], f.filename, { type: 'application/pdf' }));
      setSourceTool(f.sourceToolName);
    }
  }, [consumeFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleRotate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    setShowPreview(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('rotation', String(rotation));
    formData.append('pages', pageMode === 'all' ? 'all' : pageRange);

    try {
      const response = await apiPost('/rotate-pdf', formData);
      if (!response.ok) throw new Error('Erro ao girar PDF');

      const blob = await response.blob();
      const fileName = `rotated_${file.name}`;
      setResultBlob(blob);
      setResultFileName(fileName);
      setSuccess(true);
      setShowPreview(true);
    } catch (err) {
      setError('Erro ao girar o PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!resultBlob) return;
    await downloadBlob(resultBlob, resultFileName);
  };

  const reset = () => {
    setFile(null);
    setError('');
    setSuccess(false);
    setResultBlob(null);
    setResultFileName('');
    setShowPreview(false);
    setSourceTool('');
    chainLoaded.current = false;
    clearFile();
  };

  const sendTo = (targetHref: string) => {
    if (!resultBlob) return;
    pushFile({
      file: resultBlob,
      filename: resultFileName || (file ? `rotated_${file.name}` : 'rotated.pdf'),
      sourceTool: '/girar-pdf',
      sourceToolName: 'Girar PDF',
    });
    router.push(targetHref);
  };

  const rotations: { deg: 90 | 180 | 270; label: string }[] = [
    { deg: 90, label: '90°' },
    { deg: 180, label: '180°' },
    { deg: 270, label: '270°' },
  ];

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
          background: rgba(245, 158, 11, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #F59E0B; }
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
          border-color: #F59E0B;
          background: rgba(245, 158, 11, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #F59E0B;
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
        .section-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 20px 0 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .rotation-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .rotation-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 18px 12px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
        }
        .rotation-btn:hover {
          background: var(--bg-secondary);
          border-color: #F59E0B;
        }
        .rotation-btn.active {
          background: rgba(245, 158, 11, 0.08);
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
        .rotation-btn svg {
          width: 28px;
          height: 28px;
          color: var(--text-secondary);
          transition: color 0.2s;
        }
        .rotation-btn.active svg {
          color: #F59E0B;
        }
        .rotation-btn:hover svg {
          color: var(--text-primary);
        }
        .rotation-btn.active:hover svg {
          color: #F59E0B;
        }
        .rotation-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .page-toggle-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .page-toggle-btn {
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-align: center;
        }
        .page-toggle-btn:hover {
          border-color: #F59E0B;
          color: var(--text-primary);
        }
        .page-toggle-btn.active {
          background: rgba(245, 158, 11, 0.08);
          border-color: #F59E0B;
          color: #F59E0B;
        }
        .range-input-wrap {
          margin-top: 10px;
        }
        .range-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 12px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
        }
        .range-input:focus {
          border-color: #F59E0B;
        }
        .range-input::placeholder {
          color: var(--text-tertiary);
        }
        .range-hint {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 6px;
        }
        .btn-rotate {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #F59E0B;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-rotate:hover:not(:disabled) {
          background: #FBBF24;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
        }
        .btn-rotate:disabled {
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
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #F59E0B; flex-shrink: 0; margin-top: 1px; }
        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
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
          .rotation-grid { grid-template-columns: 1fr; }
          .page-toggle-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Girando seu PDF..." />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Girar PDF</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h1 className="page-title">Girar PDF</h1>
            <p className="page-subtitle">Rotacione páginas do seu PDF em 90°, 180° ou 270°.</p>
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
              <div className="upload-hint">Arquivo único • Máximo 200MB</div>
            </label>

            <PdfImageCapture onPdfReady={(pdfs) => { setFile(pdfs[0]); setError(''); setSuccess(false); }} />

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

            {file && (
              <>
                <div className="section-label">Rotação</div>
                <div className="rotation-grid">
                  {rotations.map((r) => (
                    <button
                      key={r.deg}
                      className={`rotation-btn${rotation === r.deg ? ' active' : ''}`}
                      onClick={() => setRotation(r.deg)}
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        style={{ transform: `rotate(${r.deg}deg)` }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="rotation-label">{r.label}</span>
                    </button>
                  ))}
                </div>

                <div className="section-label">Páginas</div>
                <div className="page-toggle-grid">
                  <button
                    className={`page-toggle-btn${pageMode === 'all' ? ' active' : ''}`}
                    onClick={() => setPageMode('all')}
                  >
                    Todas as páginas
                  </button>
                  <button
                    className={`page-toggle-btn${pageMode === 'range' ? ' active' : ''}`}
                    onClick={() => setPageMode('range')}
                  >
                    Páginas específicas
                  </button>
                </div>

                {pageMode === 'range' && (
                  <div className="range-input-wrap">
                    <input
                      className="range-input"
                      type="text"
                      placeholder="Ex: 1,3-5,7"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                    />
                    <div className="range-hint">Separe páginas com vírgula e intervalos com hífen (ex: 1,3-5).</div>
                  </div>
                )}

                <button
                  className="btn-rotate"
                  onClick={handleRotate}
                  disabled={loading}
                >
                  {loading ? 'Girando…' : 'Girar PDF'}
                </button>
              </>
            )}

            {!file && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Rotacione páginas individuais ou o documento inteiro. Nenhum dado é armazenado.</p>
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

            {success && resultBlob && (
              <div style={{
                padding: 24, marginTop: 16, background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, color: 'var(--success)', marginBottom: 8 }}>✓</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>PDF girado!</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Visualize como ficou antes de salvar.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                  <button
                    className="btn-rotate"
                    onClick={handleDownload}
                    style={{ maxWidth: 240, marginTop: 0, marginBottom: 0 }}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18, marginRight: 8, display: 'inline', verticalAlign: 'middle' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Salvar {resultFileName}
                  </button>
                </div>
                <div style={{
                  margin: '16px -8px 0', borderTop: '1px solid var(--border-light)',
                  paddingTop: 16, textAlign: 'left',
                }}>
                  <PDFPreview file={new File([resultBlob], resultFileName, { type: 'application/pdf' })} showThumbnails maxThumbnails={8} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                  <button className="btn-outline" onClick={reset} style={{ fontSize: 12, padding: '6px 14px' }}>Girar outro PDF</button>
                  <button className="btn-outline" onClick={() => sendTo('/comprimir-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Comprimir →</button>
                  <button className="btn-outline" onClick={() => sendTo('/proteger-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Proteger →</button>
                  <button className="btn-outline" onClick={() => sendTo('/reordenar-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Reordenar →</button>
                </div>
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '🔄', t: '90 180 270', d: 'Rotações em todos os ângulos' },
              { e: '📑', t: 'Todas ou Específicas', d: 'Escolha as páginas exatas' },
              { e: '⚡', t: 'Instantâneo', d: 'Processamento em segundos' },
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
