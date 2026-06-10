'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import PdfImageCapture from '../components/PdfImageCapture';
import { apiPost, saveResponseFiles } from '../lib/api';

interface Bookmark {
  level: number;
  title: string;
  page: number;
}

interface BookmarksResult {
  bookmarks: Bookmark[];
  bookmarks_count: number;
  action: string;
}

export default function Bookmarks() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookmarksData, setBookmarksData] = useState<BookmarksResult | null>(null);
  const [editing, setEditing] = useState(false);
  const [bookmarksJson, setBookmarksJson] = useState('');
  const [mode, setMode] = useState<'idle' | 'read' | 'edit'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Selecione um arquivo PDF'); return; }
    setFile(f); setError(''); setSuccess(false); setBookmarksData(null); setMode('idle');
  };

  const handleRead = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiPost('/bookmarks', formData);

      if (!response.ok) throw new Error('Erro ao ler bookmarks');

      const data: BookmarksResult = await response.json();
      setBookmarksData(data);
      setBookmarksJson(JSON.stringify(
        data.bookmarks.map((b) => [b.level, b.title, b.page]),
        null,
        2
      ));
      setMode('read');
    } catch {
      setError('Erro ao ler os bookmarks do PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bookmarks_json', bookmarksJson);

    try {
      const response = await apiPost('/bookmarks', formData);

      if (!response.ok) throw new Error('Erro ao salvar bookmarks');

      const created = parseInt(response.headers.get('X-Bookmarks-Created') || '0');
      setSuccess(true);

      await saveResponseFiles(response, `bookmarks_${file.name}`);

      if (created > 0) {
        setEditing(false);
        handleRead();
      }
    } catch {
      setError('Erro ao salvar os bookmarks. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setError('');
    setSuccess(false);
    setBookmarksData(null);
    setBookmarksJson('');
    setMode('idle');
    setEditing(false);
  };

  const fmt = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + s[i];
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
          background: rgba(139, 92, 246, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #8B5CF6; }
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
          border-color: #8B5CF6;
          background: rgba(139, 92, 246, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #8B5CF6;
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
        .btn-read {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #8B5CF6;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-read:hover:not(:disabled) {
          background: #A78BFA;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
        }
        .btn-read:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .btn-save {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #8B5CF6;
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
          background: #A78BFA;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
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
        .bookmarks-list {
          margin-top: 20px;
        }
        .bookmarks-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .bookmarks-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .bookmarks-count {
          font-size: 13px;
          color: #8B5CF6;
          font-weight: 600;
        }
        .bookmark-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          margin-bottom: 8px;
        }
        .bookmark-item .bm-page {
          width: 36px;
          height: 36px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 800;
          color: #8B5CF6;
          flex-shrink: 0;
        }
        .bookmark-item .bm-info {
          flex: 1;
          min-width: 0;
        }
        .bookmark-item .bm-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .bookmark-item .bm-level {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .json-textarea {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-light);
          border-radius: 12px;
          font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          resize: vertical;
          min-height: 200px;
          line-height: 1.6;
        }
        .json-textarea:focus {
          border-color: #8B5CF6;
        }
        .info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #8B5CF6; flex-shrink: 0; margin-top: 1px; }
        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .action-row {
          display: flex;
          gap: 10px;
        }
        .action-row .btn-outline {
          flex: 1;
          margin-top: 0;
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
          .action-row { flex-direction: column; }
        }
      `}</style>

      {loading && <LoadingSpinner message={editing ? 'Salvando bookmarks…' : 'Lendo bookmarks…'} />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Bookmarks</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h1 className="page-title">Bookmarks</h1>
            <p className="page-subtitle">Leia, crie e edite marcadores (bookmarks) do seu PDF.</p>
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
                <div className="upload-hint">Arquivo único · Máximo 50MB</div>
              </label>
            )}

            <PdfImageCapture onPdfReady={(pdfs) => { setFile(pdfs[0]); setError(''); }} />

            {file && mode === 'idle' && (
              <>
                <div className="file-selected">
                  <span className="file-icon">📄</span>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{fmt(file.size)}</div>
                  </div>
                  <button className="remove-btn" onClick={reset}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <button
                  className="btn-read"
                  onClick={handleRead}
                  disabled={loading}
                >
                  {loading ? 'Lendo…' : '📑 Ler Bookmarks'}
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

            {mode === 'read' && bookmarksData && !editing && (
              <>
                {bookmarksData.bookmarks.length > 0 ? (
                  <div className="bookmarks-list">
                    <div className="bookmarks-header">
                      <h3>Bookmarks do PDF</h3>
                      <span className="bookmarks-count">{bookmarksData.bookmarks_count} marcadores</span>
                    </div>
                    {bookmarksData.bookmarks.map((bm, i) => (
                      <div key={i} className="bookmark-item" style={{ marginLeft: `${(bm.level - 1) * 20}px` }}>
                        <div className="bm-page">{bm.page}</div>
                        <div className="bm-info">
                          <div className="bm-title">{bm.title}</div>
                          <div className="bm-level">Nível {bm.level}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="info-box">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Este PDF não possui bookmarks. Use a opção de edição para criar novos.</p>
                  </div>
                )}

                <div className="action-row" style={{ marginTop: 16 }}>
                  <button className="btn-outline" onClick={() => setEditing(true)}>
                    📝 Editar Bookmarks
                  </button>
                  <button className="btn-outline" onClick={reset}>
                    ← Selecionar outro PDF
                  </button>
                </div>
              </>
            )}

            {editing && (
              <>
                <div className="info-box" style={{ marginTop: 0 }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Formato JSON: array de [nível, título, página]. Ex: [[1, &quot;Capítulo 1&quot;, 1], [2, &quot;Seção 1.1&quot;, 2]]</p>
                </div>

                <div style={{ marginTop: 16 }}>
                  <textarea
                    className="json-textarea"
                    value={bookmarksJson}
                    onChange={(e) => setBookmarksJson(e.target.value)}
                  />
                </div>

                <button
                  className="btn-save"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Salvando…' : '💾 Salvar Bookmarks'}
                </button>

                <button className="btn-outline" onClick={() => setEditing(false)}>
                  ← Cancelar
                </button>
              </>
            )}

            {!file && (
              <div className="info-box" style={{ marginTop: 0 }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Os bookmarks são lidos e processados localmente. Nenhum dado é armazenado.</p>
              </div>
            )}
          </div>

          <div className="features-mini">
            {[
              { e: '👁️', t: 'Visualizar', d: 'Veja todos os bookmarks do PDF' },
              { e: '✏️', t: 'Criar', d: 'Adicione novos marcadores' },
              { e: '📤', t: 'Exportar', d: 'Baixe o PDF com bookmarks' },
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
