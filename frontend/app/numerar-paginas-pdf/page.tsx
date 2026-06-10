'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import PdfImageCapture from '../components/PdfImageCapture';

const FORMATS = [
  { value: '1', label: '1' },
  { value: 'Pagina {page}', label: 'Pagina 1' },
  { value: '{page} de {total}', label: '1 de 10' },
  { value: '{page}/{total}', label: '1/10' },
];

const POSITIONS = [
  { value: 'bottom', label: 'Central inferior' },
  { value: 'bottom-right', label: 'Canto inferior direito' },
  { value: 'bottom-left', label: 'Canto inferior esquerdo' },
  { value: 'top', label: 'Central superior' },
];

export default function NumerarPaginasPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [startNumber, setStartNumber] = useState('1');
  const [formatStr, setFormatStr] = useState('1');
  const [position, setPosition] = useState('bottom');
  const [margin, setMargin] = useState('30');
  const [skipFirst, setSkipFirst] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF');
      return;
    }
    setFile(f);
    setError('');
    setDone(false);
  };

  const handleNumerate = async () => {
    if (!file) return;

    const start = parseInt(startNumber, 10);
    if (isNaN(start) || start < 0) {
      setError('Numero inicial invalido.');
      return;
    }

    const m = parseInt(margin, 10);
    if (isNaN(m) || m < 0) {
      setError('Margem invalida.');
      return;
    }

    setLoading(true);
    setError('');
    setDone(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('start_number', String(start));
    formData.append('format_str', formatStr);
    formData.append('position', position);
    formData.append('margin', String(m));
    formData.append('skip_first', skipFirst ? 'true' : 'false');

    try {
      const response = await apiPost('/number-pages', formData);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || 'Erro ao numerar paginas');
      }

      const blob = await response.blob();
      const baseName = file.name.replace(/\.pdf$/i, '');
      await downloadBlob(blob, `${baseName}_numerado.pdf`);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao numerar paginas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStartNumber('1');
    setFormatStr('1');
    setPosition('bottom');
    setMargin('30');
    setSkipFirst(false);
    setDone(false);
  };

  return (
    <>
      <style>{`
        .num-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .num-inner {
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

        .num-header { margin-bottom: 32px; }
        .num-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .num-icon-wrap svg { width: 28px; height: 28px; color: #10B981; }
        .num-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .num-subtitle {
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
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg { width: 22px; height: 22px; color: #10B981; }
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
        .file-selected .remove-btn svg { width: 16px; height: 16px; display: block; }

        .control-group { margin-top: 20px; }
        .control-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .control-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .control-input:focus { border-color: #10B981; }
        .control-input::placeholder { color: var(--text-tertiary); }

        .radio-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        @media (max-width: 400px) {
          .radio-grid { grid-template-columns: 1fr; }
        }
        .radio-card {
          position: relative;
        }
        .radio-card input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        .radio-card label {
          display: block;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border: 1.5px solid var(--border-light);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          text-align: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .radio-card input:checked + label {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.06);
          color: #10B981;
          font-weight: 600;
        }
        .radio-card label:hover {
          border-color: var(--border-medium);
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-primary);
          user-select: none;
          margin-top: 4px;
        }
        .checkbox-row input {
          width: 18px;
          height: 18px;
          accent-color: #10B981;
          cursor: pointer;
          flex-shrink: 0;
        }

        .btn-numerate {
          width: 100%;
          margin-top: 24px;
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
        .btn-numerate:hover:not(:disabled) {
          background: #34D399;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
        }
        .btn-numerate:disabled {
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
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #10B981; flex-shrink: 0; margin-top: 1px; }
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
          margin: 0 0 20px;
        }
        .success-stats {
          text-align: center;
          padding: 20px;
          background: rgba(16, 185, 129, 0.08);
          border-radius: 12px;
          margin-bottom: 10px;
        }
        .success-stats .stat-label {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-bottom: 8px;
        }
        .success-stats .stat-settings {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .success-stats .stat-settings strong { color: var(--text-primary); }

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
        }
      `}</style>

      {loading && <LoadingSpinner message="Numerando paginas..." />}

      <div className="num-root">
        <div className="num-inner">
          <nav className="breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="breadcrumb-current">Numerar Paginas</span>
          </nav>

          <div className="num-header">
            <div className="num-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 20h4V4H7v16zm6 0h4v-6h-4v6zm4-8V4h-4m4 0h-4m-8 0v16m0 0h4m-4 0h0" />
              </svg>
            </div>
            <h1 className="num-title">Numerar Paginas</h1>
            <p className="num-subtitle">Adicione numeracao automatica as paginas do seu PDF com formatos e posicoes personalizadas.</p>
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
              <div className="upload-hint">Arquivo unico • Maximo 50MB</div>
            </label>

            <PdfImageCapture onPdfReady={(pdfs) => { setFile(pdfs[0]); setError(''); setDone(false); }} />

            {file && (
              <div className="file-selected">
                <span className="file-icon">{'\uD83D\uDCC4'}</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={() => { setFile(null); setDone(false); }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {file && !done && (
              <>
                <div className="control-group">
                  <label className="control-label">Numero inicial</label>
                  <input
                    className="control-input"
                    type="number"
                    min="0"
                    value={startNumber}
                    onChange={(e) => { setStartNumber(e.target.value); setError(''); }}
                    placeholder="1"
                  />
                </div>

                <div className="control-group">
                  <label className="control-label">Formato da numeracao</label>
                  <div className="radio-grid">
                    {FORMATS.map((f) => (
                      <div key={f.value} className="radio-card">
                        <input
                          type="radio"
                          id={`fmt-${f.value}`}
                          name="format_str"
                          value={f.value}
                          checked={formatStr === f.value}
                          onChange={() => setFormatStr(f.value)}
                        />
                        <label htmlFor={`fmt-${f.value}`}>{f.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">Posicao</label>
                  <div className="radio-grid">
                    {POSITIONS.map((p) => (
                      <div key={p.value} className="radio-card">
                        <input
                          type="radio"
                          id={`pos-${p.value}`}
                          name="position"
                          value={p.value}
                          checked={position === p.value}
                          onChange={() => setPosition(p.value)}
                        />
                        <label htmlFor={`pos-${p.value}`}>{p.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">Margem (pixels)</label>
                  <input
                    className="control-input"
                    type="number"
                    min="0"
                    value={margin}
                    onChange={(e) => { setMargin(e.target.value); setError(''); }}
                    placeholder="30"
                  />
                </div>

                <div className="control-group">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={skipFirst}
                      onChange={(e) => setSkipFirst(e.target.checked)}
                    />
                    Pular primeira pagina
                  </label>
                </div>

                <button
                  className="btn-numerate"
                  onClick={handleNumerate}
                  disabled={loading}
                >
                  {loading ? 'Numerando...' : 'Numerar Paginas'}
                </button>
              </>
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

            {!file && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Escolha o formato, posicao e a numeracao comeca a partir do numero que voce definir.</p>
              </div>
            )}

            {done && (
              <div className="success-box">
                <div className="success-header">
                  <div className="success-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3>Paginas numeradas com sucesso!</h3>
                </div>
                <p className="success-p">A numeracao foi aplicada e o download foi iniciado automaticamente.</p>
                <div className="success-stats">
                  <div className="stat-label">CONFIGURACAO APLICADA</div>
                  <div className="stat-settings">
                    Inicio: <strong>{startNumber}</strong> &middot;
                    Formato: <strong>{FORMATS.find((f) => f.value === formatStr)?.label}</strong> &middot;
                    Posicao: <strong>{POSITIONS.find((p) => p.value === position)?.label}</strong><br />
                    Margem: <strong>{margin}px</strong> &middot;
                    Pular capa: <strong>{skipFirst ? 'Sim' : 'Nao'}</strong>
                  </div>
                </div>
                <button className="btn-outline" onClick={reset}>
                  Numerar outro PDF
                </button>
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '\uD83C\uDFB2', t: 'Formatos Flexiveis', d: 'Numeracao simples, texto ou fracionada' },
              { e: '\uD83D\uDCCD', t: 'Posicao Customizada', d: 'Escolha onde o numero aparece na pagina' },
              { e: '\uD83D\uDCD6', t: 'Pular Capa', d: 'Preserve a primeira pagina sem numeracao' },
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
