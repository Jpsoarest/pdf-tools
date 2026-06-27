'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiPost, downloadBlob, formatBytes, getApiUrl } from '../lib/api';
import PdfImageCapture from '../components/PdfImageCapture';

interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  total_pages: number;
  file_size: number;
}

const INITIAL_FORM = { title: '', author: '', subject: '' };

export default function MetadadosPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectPdfFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF');
      return;
    }
    setFile(f);
    setMetadata(null);
    setForm(INITIAL_FORM);
    setError('');

    setReading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const response = await fetch(getApiUrl('/pdf-metadata'), {
        method: 'POST',
        body: fd,
      });
      if (!response.ok) throw new Error('Erro ao ler metadados');
      const data: PdfMetadata = await response.json();
      setMetadata(data);
      setForm({
        title: data.title || '',
        author: data.author || '',
        subject: data.subject || '',
      });
    } catch {
      setError('Erro ao ler metadados do PDF.');
    } finally {
      setReading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void selectPdfFile(f);
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    setError('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title);
    fd.append('author', form.author);
    fd.append('subject', form.subject);

    try {
      const response = await apiPost('/edit-pdf-metadata', fd);
      if (!response.ok) throw new Error('Erro ao salvar metadados');

      const blob = await response.blob();
      await downloadBlob(blob, `metadados_${file.name}`);
    } catch {
      setError('Erro ao salvar metadados. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setFile(null);
    setMetadata(null);
    setForm(INITIAL_FORM);
    setError('');
  };

  const loading = reading || saving;

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
        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .metadata-item {
          background: var(--bg-tertiary);
          border-radius: 12px;
          padding: 14px;
        }
        .metadata-item .label {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metadata-item .value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .metadata-item-full {
          grid-column: 1 / -1;
          background: var(--bg-tertiary);
          border-radius: 12px;
          padding: 14px;
        }
        .metadata-item-full .label {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metadata-item-full .value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .form-field {
          margin-top: 14px;
        }
        .form-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .form-input {
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
        .form-input:focus {
          border-color: #F59E0B;
        }
        .form-input::placeholder {
          color: var(--text-tertiary);
        }
        .btn-save {
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
        .btn-save:hover:not(:disabled) {
          background: #FBBF24;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
        }
        .btn-save:disabled {
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
          .metadata-grid { grid-template-columns: 1fr; }
          .metadata-item-full { grid-column: auto; }
        }
      `}</style>

      {loading && <LoadingSpinner message={reading ? 'Lendo metadados…' : 'Salvando metadados…'} />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Metadados PDF</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h1 className="page-title">Metadados PDF</h1>
            <p className="page-subtitle">Visualize e edite título, autor e assunto do seu PDF.</p>
          </div>

          <div className="card">
            {!file && (
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
            )}

            <PdfImageCapture onPdfReady={(pdfs) => void selectPdfFile(pdfs[0])} />

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

            {metadata && !reading && (
              <>
                <div className="section-label">Metadados do Documento</div>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <div className="label">Criador</div>
                    <div className="value">{metadata.creator || '—'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="label">Produtor</div>
                    <div className="value">{metadata.producer || '—'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="label">Páginas</div>
                    <div className="value">{metadata.total_pages ?? '—'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="label">Tamanho</div>
                    <div className="value">{formatBytes(metadata.file_size)}</div>
                  </div>
                </div>

                <div className="section-label">Editar Metadados</div>
                <div className="form-field">
                  <label htmlFor="meta-title">Título</label>
                  <input
                    id="meta-title"
                    className="form-input"
                    type="text"
                    placeholder="Título do documento"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="meta-author">Autor</label>
                  <input
                    id="meta-author"
                    className="form-input"
                    type="text"
                    placeholder="Autor do documento"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="meta-subject">Assunto</label>
                  <input
                    id="meta-subject"
                    className="form-input"
                    type="text"
                    placeholder="Assunto do documento"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>

                <button
                  className="btn-save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Salvando…' : 'Salvar Metadados'}
                </button>

                <button className="btn-outline" onClick={reset}>
                  ← Selecionar outro PDF
                </button>
              </>
            )}

            {!file && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Visualize e edite os metadados do seu PDF. Nenhum dado é armazenado.</p>
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
              { e: '📋', t: 'Leitura Completa', d: 'Todos os metadados do documento' },
              { e: '🔐', t: 'Edição Segura', d: 'Altere apenas título, autor e assunto' },
              { e: '⬇', t: 'Download Imediato', d: 'Baixe o PDF editado na hora' },
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
