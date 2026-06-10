'use client';

import { useState } from 'react';
import PdfImageCapture from '../components/PdfImageCapture';
import { apiPost, saveResponseFiles } from '../lib/api';

type SplitMode = 'all' | 'range' | 'specific';

export default function DividirPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<SplitMode>('all');
  const [ranges, setRanges] = useState('');
  const [success, setSuccess] = useState(false);
  const [filesGenerated, setFilesGenerated] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Selecione um arquivo PDF'); return; }
    setFile(f); setError(''); setSuccess(false);
  };

  const handleSplit = async () => {
    if (!file) return;
    if ((mode === 'range' || mode === 'specific') && !ranges.trim()) { setError('Informe as páginas'); return; }
    setLoading(true); setError(''); setSuccess(false);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    formData.append('ranges', ranges);
    try {
      const res = await apiPost('/split-pdf', formData);
      if (!res.ok) throw new Error();
      const gen = parseInt(res.headers.get('X-Files-Generated') || '0');
      setFilesGenerated(gen); setSuccess(true);
      await saveResponseFiles(res, `split_${file.name.replace('.pdf', '')}.pdf`);
    } catch { setError('Erro ao dividir. Verifique os valores e tente novamente.'); }
    finally { setLoading(false); }
  };

  const fmt = (bytes: number) => { const k = 1024, s = ['B','KB','MB'], i = Math.floor(Math.log(bytes)/Math.log(k)); return Math.round(bytes/Math.pow(k,i)*100)/100+' '+s[i]; };

  const modes: { value: SplitMode; label: string; desc: string; example: string }[] = [
    { value: 'all', label: 'Todas as páginas', desc: 'Cada página vira um PDF separado', example: '' },
    { value: 'range', label: 'Por intervalos', desc: 'Defina grupos de páginas', example: 'Ex: 1-5,7-10' },
    { value: 'specific', label: 'Páginas específicas', desc: 'Escolha exatamente quais páginas', example: 'Ex: 1,3,5,8' },
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
        .page-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg {
          width: 28px;
          height: 28px;
          color: #10B981;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: clamp(28px,6vw,44px);
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
          padding: clamp(20px,4vw,32px);
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
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #10B981;
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
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
        }
        .file-selected .remove-btn svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .section-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin: 24px 0 12px;
        }
        .mode-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mode-option {
          border: 1.5px solid var(--border-light);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.15s;
          cursor: pointer;
          background: var(--bg-secondary);
        }
        .mode-option.selected {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.02);
        }
        .mode-option-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
        }
        .mode-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid var(--border-medium);
          flex-shrink: 0;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mode-option.selected .mode-radio {
          border-color: #10B981;
        }
        .mode-radio-dot {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .mode-option.selected .mode-radio-dot { opacity: 1; }
        .mode-text .mode-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .mode-text .mode-desc {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .mode-input-wrap {
          padding: 0 16px 14px;
        }
        .mode-example {
          font-size: 11px;
          color: #10B981;
          margin-bottom: 8px;
        }
        .mode-input {
          width: 100%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 10px 14px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .mode-input:focus {
          border-color: #10B981;
        }
        .mode-input::placeholder {
          color: var(--text-tertiary);
        }
        .btn-split {
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
        .btn-split:hover:not(:disabled) {
          background: #34D399;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
        }
        .btn-split:disabled {
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
          margin-top: 14px;
          font-size: 13px;
          color: #EF4444;
          align-items: flex-start;
        }
        .error-box svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .success-box {
          padding: 24px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 16px;
          margin-top: 14px;
        }
        .success-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .success-check {
          width: 36px;
          height: 36px;
          background: #10B981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .success-check svg {
          width: 18px;
          height: 18px;
          color: white;
        }
        .success-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .success-p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0 0 16px;
        }
        .btn-outline {
          width: 100%;
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
      `}</style>

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a><span>/</span>
            <span className="breadcrumb-current">Dividir PDF</span>
          </nav>

          <div className="page-icon-wrap">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </div>
          <h1 className="page-title">Dividir PDF</h1>
          <p className="page-subtitle">Separe seu PDF do jeito que preferir. Os arquivos saem separados.</p>

          <div className="card">
            <label className="upload-trigger">
              <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="upload-label">Clique para selecionar um PDF</div>
              <div className="upload-hint">Máximo 50MB</div>
            </label>

            <PdfImageCapture onPdfReady={(pdfs) => { setFile(pdfs[0]); setError(''); setSuccess(false); }} />

            {file && (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{fmt(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={() => { setFile(null); setSuccess(false); }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {file && (
              <>
                <div className="section-label">Como dividir?</div>
                <div className="mode-list">
                  {modes.map((m) => (
                    <div
                      key={m.value}
                      className={`mode-option ${mode === m.value ? 'selected' : ''}`}
                      onClick={() => setMode(m.value)}
                    >
                      <div className="mode-option-header">
                        <div className="mode-radio"><div className="mode-radio-dot" /></div>
                        <div className="mode-text">
                          <div className="mode-name">{m.label}</div>
                          <div className="mode-desc">{m.desc}</div>
                        </div>
                      </div>
                      {mode === m.value && m.value !== 'all' && (
                        <div className="mode-input-wrap" onClick={e => e.stopPropagation()}>
                          <div className="mode-example">{m.example}</div>
                          <input
                            className="mode-input"
                            type="text"
                            value={ranges}
                            onChange={e => setRanges(e.target.value)}
                            placeholder={m.example.replace('Ex: ', '')}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button className="btn-split" onClick={handleSplit} disabled={loading}>
                  {loading ? 'Dividindo…' : '⊗ Dividir PDF'}
                </button>
              </>
            )}

            {error && (
              <div className="error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="success-box">
                <div className="success-header">
                  <div className="success-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h3>PDF dividido com sucesso!</h3>
                </div>
                <p className="success-p">{filesGenerated} arquivo{filesGenerated !== 1 ? 's' : ''} gerado{filesGenerated !== 1 ? 's' : ''} na pasta de saída.</p>
                <button className="btn-outline" onClick={() => { setFile(null); setSuccess(false); setRanges(''); }}>← Dividir outro PDF</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
