'use client';

import { useState, useRef } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiPost, saveResponseFiles } from '../lib/api';

export default function SimuladorDaltonismo() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [modesSimulated, setModesSimulated] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    setSuccess(false);

    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const removeFile = () => {
    setFile(null);
    setSuccess(false);
    setModesSimulated([]);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSimulate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiPost('/colorblind-simulate', formData);

      if (!response.ok) throw new Error('Erro ao simular daltonismo');

      const modes = response.headers.get('X-Modes-Simulated') || '';
      const allModes = response.headers.get('X-Modes') || '';
      setModesSimulated(modes ? modes.split(',') : allModes ? allModes.split(',') : []);
      setSuccess(true);

      const baseName = file.name.replace(/\.[^.]+$/, '');
      await saveResponseFiles(response, `daltonismo_${baseName}.png`);
    } catch {
      setError('Erro ao simular daltonismo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + s[i];
  };

  const modeLabels: Record<string, string> = {
    protanopia: 'Protanopia (Vermelho)',
    deuteranopia: 'Deuteranopia (Verde)',
    tritanopia: 'Tritanopia (Azul)',
    achromatopsia: 'Acromatopsia (Monocromático)',
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
        .preview-section {
          margin-top: 14px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border-light);
          background: var(--bg-secondary);
          position: relative;
        }
        .preview-section img {
          width: 100%;
          max-height: 280px;
          object-fit: contain;
          display: block;
          background: repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 20px 20px;
        }
        .preview-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
        }
        .preview-badge {
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 100px;
          white-space: nowrap;
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
        .btn-simulate {
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
        .btn-simulate:hover:not(:disabled) {
          background: #818CF8;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
        }
        .btn-simulate:disabled {
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
        .success-box {
          padding: 24px;
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px;
          margin-top: 16px;
        }
        .success-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .success-check {
          width: 36px; height: 36px;
          background: #6366F1;
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
        .modes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
        }
        .mode-badge {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          text-align: center;
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
        .features-mini {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .feature-mini {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .feature-mini .emoji { font-size: 22px; margin-bottom: 8px; }
        .feature-mini .title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .feature-mini .desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .features-mini { grid-template-columns: 1fr; }
          .modes-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Simulando daltonismo…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Simulador de Daltonismo</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h1 className="page-title">Simulador de Daltonismo</h1>
            <p className="page-subtitle">Simule como pessoas com diferentes tipos de daltonismo veem suas imagens.</p>
          </div>

          <div className="card">
            {!file && (
              <label className="upload-trigger" style={{ display: 'block' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="upload-label">Clique para selecionar uma imagem</div>
                <div className="upload-hint">JPG, PNG ou WebP · Máximo 25MB</div>
              </label>
            )}

            {file && !success && (
              <>
                {previewUrl && (
                  <div className="preview-section">
                    <img src={previewUrl} alt="Pré-visualização" />
                    <div className="preview-overlay">
                      <span className="preview-badge">{file.name}</span>
                      <span className="preview-badge">{fmt(file.size)}</span>
                    </div>
                  </div>
                )}

                <div className="file-selected">
                  <span className="file-icon">🖼️</span>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{fmt(file.size)}</div>
                  </div>
                  <button className="remove-btn" onClick={removeFile}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <button
                  className="btn-simulate"
                  onClick={handleSimulate}
                  disabled={loading}
                >
                  {loading ? 'Simulando…' : '👁️ Simular Daltonismo'}
                </button>
              </>
            )}

            {!file && (
              <div className="info-box" style={{ marginTop: 0 }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>A simulação gera 4 variantes da imagem e salva cada uma separadamente.</p>
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

            {success && (
              <div className="success-box">
                <div className="success-header">
                  <div className="success-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3>Simulação concluída!</h3>
                </div>
                <p className="success-p">As simulações foram salvas na pasta de saída.</p>
                {modesSimulated.length > 0 && (
                  <div className="modes-grid">
                    {modesSimulated.map((mode) => (
                      <div key={mode} className="mode-badge">
                        {modeLabels[mode] || mode}
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn-outline" onClick={removeFile}>
                  ← Simular outra imagem
                </button>
              </div>
            )}
          </div>

          <div className="features-mini">
            {[
              { e: '🌈', t: '4 modos', d: 'Protanopia, deuteranopia e mais' },
              { e: '🎯', t: 'Preciso', d: 'Simulação realista e fiel' },
              { e: '🔒', t: 'Privado', d: 'Processado no servidor local' },
            ].map((x) => (
              <div key={x.t} className="feature-mini">
                <div className="emoji">{x.e}</div>
                <div className="title">{x.t}</div>
                <div className="desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
