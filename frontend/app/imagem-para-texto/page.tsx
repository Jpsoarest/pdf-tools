'use client';

import { useState } from 'react';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

type Lang = 'pt' | 'eng' | 'spa';

const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];

export default function ImagemParaTexto() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('pt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      setError('Formato inválido. Envie uma imagem JPG, PNG, WEBP ou BMP.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
    setExtractedText(null);
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setExtractedText(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('lang', lang);

    try {
      const response = await apiPost('/image-to-text', formData);
      if (!response.ok) throw new Error('Erro ao extrair texto da imagem');

      const data = await response.json();
      const text: string = data.text || '';
      setExtractedText(text);

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const filename = file.name.replace(/\.[^.]+$/, '') + '_ocr.txt';
      await downloadBlob(blob, filename);
    } catch (err) {
      setError('Erro ao processar a imagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError('');
    setExtractedText(null);
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
          background: rgba(236, 72, 153, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #EC4899; }
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
          border-color: #EC4899;
          background: rgba(236, 72, 153, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(236, 72, 153, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #EC4899;
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
        .preview-wrap {
          margin-top: 14px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border-light);
          background: var(--bg-tertiary);
          position: relative;
        }
        .preview-img {
          width: 100%;
          max-height: 320px;
          object-fit: contain;
          display: block;
          background: var(--bg-secondary);
        }
        .preview-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.6);
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: #fff;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-remove:hover {
          background: rgba(239,68,68,0.85);
        }
        .preview-remove svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .lang-section {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lang-section label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .lang-select {
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
        .lang-select:focus {
          border-color: #EC4899;
        }
        .btn-extract {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #EC4899;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-extract:hover:not(:disabled) {
          background: #F472B6;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(236, 72, 153, 0.25);
        }
        .btn-extract:disabled {
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
        .result-box {
          margin-top: 16px;
          padding: 20px;
          background: rgba(236, 72, 153, 0.04);
          border: 1px solid rgba(236, 72, 153, 0.15);
          border-radius: 16px;
        }
        .result-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .result-check {
          width: 36px; height: 36px;
          background: #EC4899;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .result-check svg { width: 18px; height: 18px; color: white; }
        .result-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .result-text-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 16px;
          max-height: 280px;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .result-text-box::-webkit-scrollbar {
          width: 6px;
        }
        .result-text-box::-webkit-scrollbar-track {
          background: transparent;
        }
        .result-text-box::-webkit-scrollbar-thumb {
          background: var(--border-medium);
          border-radius: 3px;
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

      {loading && <LoadingSpinner message="Extraindo texto da imagem…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Imagem para Texto</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="page-title">Imagem para Texto</h1>
            <p className="page-subtitle">Converta imagens em texto editável com OCR de alta precisão. Extraia e baixe o conteúdo como arquivo .txt.</p>
          </div>

          <div className="card">
            <label className="upload-trigger">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.bmp"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="upload-label">Clique para selecionar uma imagem</div>
              <div className="upload-hint">JPG, PNG, WEBP, BMP • Arquivo único</div>
            </label>

            {preview && (
              <div className="preview-wrap">
                <img className="preview-img" src={preview} alt="Preview" />
                <button className="preview-remove" onClick={reset} title="Remover imagem">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {file && (
              <div className="lang-section">
                <label htmlFor="ocr-lang">Idioma do texto na imagem</label>
                <select
                  id="ocr-lang"
                  className="lang-select"
                  value={lang}
                  onChange={e => setLang(e.target.value as Lang)}
                >
                  <option value="pt">Português</option>
                  <option value="eng">Inglês</option>
                  <option value="spa">Espanhol</option>
                </select>
              </div>
            )}

            {file && !extractedText && (
              <button
                className="btn-extract"
                onClick={handleExtract}
                disabled={loading}
              >
                {loading ? 'Extraindo…' : 'Extrair Texto'}
              </button>
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

            {extractedText !== null && (
              <div className="result-box">
                <div className="result-header">
                  <div className="result-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="result-title">Texto extraído</h3>
                </div>
                <div className="result-text-box">{extractedText}</div>
                <button className="btn-outline" onClick={reset}>
                  Extrair outra imagem
                </button>
              </div>
            )}
          </div>

          <div className="trust-grid">
            {[
              { e: '🎯', t: 'OCR Preciso', d: 'Reconhecimento avançado de caracteres' },
              { e: '🌐', t: 'Vários Idiomas', d: 'Português, inglês e espanhol' },
              { e: '⚡', t: 'Resultado Instantâneo', d: 'Texto extraído em segundos' },
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
