'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import PdfImageCapture from '../components/PdfImageCapture';

export default function MarcaDaguaPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [opacity, setOpacity] = useState(0.3);
  const [position, setPosition] = useState<'center' | 'top' | 'bottom' | 'diagonal'>('center');
  const [fontSize, setFontSize] = useState(48);
  const [pageMode, setPageMode] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleApply = async () => {
    if (!file) return;
    if (!text.trim()) {
      setError('Digite o texto da marca d\'água');
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('text', text.trim());
    formData.append('opacity', String(opacity));
    formData.append('position', position);
    formData.append('font_size', String(fontSize));
    formData.append('pages', pageMode === 'all' ? 'all' : pageRange);

    try {
      const response = await apiPost('/watermark-pdf', formData);
      if (!response.ok) throw new Error('Erro ao aplicar marca d\'água');

      const blob = await response.blob();
      await downloadBlob(blob, `watermarked_${file.name}`);
    } catch (err) {
      setError('Erro ao aplicar a marca d\'água. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setText('');
    setOpacity(0.3);
    setPosition('center');
    setFontSize(48);
    setPageMode('all');
    setPageRange('');
    setError('');
  };

  const positions: { value: 'center' | 'top' | 'bottom' | 'diagonal'; label: string }[] = [
    { value: 'center', label: 'Centro' },
    { value: 'top', label: 'Topo' },
    { value: 'bottom', label: 'Rodapé' },
    { value: 'diagonal', label: 'Diagonal' },
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
        .section-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 20px 0 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .text-input {
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
          box-sizing: border-box;
        }
        .text-input:focus {
          border-color: #6366F1;
        }
        .text-input::placeholder {
          color: var(--text-tertiary);
        }
        .slider-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .slider-range {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: var(--border-light);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        .slider-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #6366F1;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .slider-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          min-width: 44px;
          text-align: right;
        }
        .position-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .position-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 12px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .position-btn:hover {
          background: var(--bg-secondary);
          border-color: #6366F1;
          color: var(--text-primary);
        }
        .position-btn.active {
          background: rgba(99, 102, 241, 0.08);
          border-color: #6366F1;
          color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .position-btn svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        .font-size-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .font-size-input {
          width: 100px;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 12px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
          text-align: center;
        }
        .font-size-input:focus {
          border-color: #6366F1;
        }
        .font-size-hint {
          font-size: 12px;
          color: var(--text-tertiary);
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
          border-color: #6366F1;
          color: var(--text-primary);
        }
        .page-toggle-btn.active {
          background: rgba(99, 102, 241, 0.08);
          border-color: #6366F1;
          color: #6366F1;
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
          box-sizing: border-box;
        }
        .range-input:focus {
          border-color: #6366F1;
        }
        .range-input::placeholder {
          color: var(--text-tertiary);
        }
        .range-hint {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 6px;
        }
        .btn-apply {
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
        .btn-apply:hover:not(:disabled) {
          background: #818CF8;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
        }
        .btn-apply:disabled {
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
          .position-grid { grid-template-columns: 1fr; }
          .page-toggle-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Aplicando marca d'água..." />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Marca D'água PDF</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 9h2m-2 4h4" />
              </svg>
            </div>
            <h1 className="page-title">Marca D'água PDF</h1>
            <p className="page-subtitle">Adicione texto como marca d'água nas páginas do seu PDF.</p>
          </div>

          <div className="card">
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

            <PdfImageCapture onPdfReady={(pdfs) => { setFile(pdfs[0]); setError(''); }} />

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
                <div className="section-label">Texto da Marca D'água</div>
                <input
                  className="text-input"
                  type="text"
                  placeholder="Ex: CONFIDENCIAL, RASCUNHO, NÃO CIRCULAR..."
                  value={text}
                  onChange={(e) => { setText(e.target.value); setError(''); }}
                />

                <div className="section-label">Opacidade</div>
                <div className="slider-group">
                  <input
                    className="slider-range"
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                  />
                  <span className="slider-value">{Math.round(opacity * 100)}%</span>
                </div>

                <div className="section-label">Posição</div>
                <div className="position-grid">
                  {positions.map((p) => (
                    <button
                      key={p.value}
                      className={`position-btn${position === p.value ? ' active' : ''}`}
                      onClick={() => setPosition(p.value)}
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {p.value === 'center' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 11a1 1 0 100-2 1 1 0 000 2zm0 0v8m0-8l4-4m-4 4l-4-4" />
                        )}
                        {p.value === 'top' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 20V10m0 0l4 4m-4-4l-4 4" />
                        )}
                        {p.value === 'bottom' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 4v10m0 0l4-4m-4 4l-4-4" />
                        )}
                        {p.value === 'diagonal' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 20L20 4" />
                        )}
                      </svg>
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="section-label">Tamanho da Fonte</div>
                <div className="font-size-row">
                  <input
                    className="font-size-input"
                    type="number"
                    min={8}
                    max={200}
                    value={fontSize}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v >= 8 && v <= 200) setFontSize(v);
                    }}
                  />
                  <span className="font-size-hint">8 – 200</span>
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
                  className="btn-apply"
                  onClick={handleApply}
                  disabled={loading}
                >
                  {loading ? 'Aplicando…' : 'Aplicar Marca D\'água'}
                </button>
              </>
            )}

            {!file && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Adicione uma marca d'água de texto ao seu PDF. Escolha posição, opacidade e páginas. Nenhum dado é armazenado.</p>
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
              { e: '📝', t: 'Texto Personalizado', d: 'Digite o texto que preferir' },
              { e: '🎨', t: 'Opacidade Ajustável', d: 'De 5% a 100% de visibilidade' },
              { e: '📍', t: 'Múltiplas Posições', d: 'Centro, topo, rodapé ou diagonal' },
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
