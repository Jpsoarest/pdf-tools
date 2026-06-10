'use client';

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import PdfImageCapture from '../components/PdfImageCapture';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';

type RedactType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'cep' | 'custom';

export default function RedigirPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [redactType, setRedactType] = useState<RedactType>('cpf');
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [redactedCount, setRedactedCount] = useState<number | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF');
      return;
    }
    setFile(f);
    setError('');
    setCompleted(false);
    setBlob(null);
    setRedactedCount(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setCompleted(false);
    setBlob(null);
    setRedactedCount(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('redact_type', redactType);
    if (redactType === 'custom' && terms.trim()) {
      formData.append('terms', terms.trim());
    }

    try {
      const res = await apiPost('/redact-pdf', formData);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erro ao redigir o PDF');
      }

      const count = res.headers.get('X-Redacted-Count');
      if (count) setRedactedCount(parseInt(count, 10));

      const resultBlob = await res.blob();
      setBlob(resultBlob);
      setCompleted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar o PDF. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!blob || !file) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    await downloadBlob(blob, `${baseName}_redigido.pdf`);
  };

  const reset = () => {
    setFile(null);
    setRedactedCount(null);
    setBlob(null);
    setCompleted(false);
    setError('');
    setTerms('');
    setRedactType('cpf');
  };

  const redactTypeLabels: Record<RedactType, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    phone: 'Telefone',
    cep: 'CEP',
    custom: 'Personalizado',
  };

  return (
    <>
      <style>{`
        .redact-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .redact-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .redact-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .redact-breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .redact-breadcrumb a:hover { color: var(--text-primary); }
        .redact-breadcrumb span { color: var(--border-light); }
        .redact-breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .redact-header {
          margin-bottom: 32px;
        }
        .redact-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .redact-icon-wrap svg { width: 28px; height: 28px; color: #EF4444; }
        .redact-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .redact-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .redact-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .redact-upload {
          border: 1.5px dashed var(--border-medium);
          border-radius: 14px;
          padding: 28px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
          display: block;
        }
        .redact-upload:hover {
          border-color: #EF4444;
          background: rgba(239, 68, 68, 0.03);
        }
        .redact-upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .redact-upload-icon svg {
          width: 22px;
          height: 22px;
          color: #EF4444;
        }
        .redact-upload-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .redact-upload-hint {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .redact-file-selected {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          margin-top: 14px;
        }
        .redact-file-selected .redact-file-icon { font-size: 22px; flex-shrink: 0; }
        .redact-file-selected .redact-file-info { flex: 1; min-width: 0; }
        .redact-file-selected .redact-file-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .redact-file-selected .redact-file-size {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .redact-file-selected .redact-remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: var(--text-tertiary);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .redact-file-selected .redact-remove-btn:hover {
          background: rgba(239,68,68,0.15);
          color: #EF4444;
        }
        .redact-file-selected .redact-remove-btn svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .redact-type-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }
        .redact-type-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .redact-type-btn {
          padding: 10px 8px;
          border: 1px solid var(--border-medium);
          border-radius: 10px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }
        .redact-type-btn:hover {
          border-color: #EF4444;
          color: #EF4444;
        }
        .redact-type-btn.active {
          background: #EF4444;
          color: white;
          border-color: #EF4444;
        }
        .redact-terms-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          margin-bottom: 20px;
        }
        .redact-terms-input:focus {
          border-color: #EF4444;
        }
        .redact-terms-input::placeholder {
          color: var(--text-tertiary);
        }
        .redact-btn {
          width: 100%;
          padding: 16px;
          background: #EF4444;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .redact-btn:hover:not(:disabled) {
          background: #DC2626;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.25);
        }
        .redact-btn:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .redact-error-box {
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
        .redact-error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .redact-success-box {
          padding: 24px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 16px;
          margin-top: 16px;
        }
        .redact-success-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .redact-success-check {
          width: 36px;
          height: 36px;
          background: #EF4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .redact-success-check svg { width: 18px; height: 18px; color: white; }
        .redact-success-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .redact-success-detail {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 20px;
        }
        .redact-success-count {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.12);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          color: #EF4444;
          margin-bottom: 16px;
        }
        .redact-download-btn {
          width: 100%;
          margin-top: 8px;
          padding: 14px;
          background: #EF4444;
          color: white;
          border: none;
          border-radius: 12px;
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .redact-download-btn:hover {
          background: #DC2626;
          transform: translateY(-2px);
        }
        .redact-reset-btn {
          width: 100%;
          margin-top: 10px;
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
        .redact-reset-btn:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }
        .redact-info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .redact-info-box svg { width: 16px; height: 16px; color: #EF4444; flex-shrink: 0; margin-top: 1px; }
        .redact-info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .redact-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .redact-feature {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .redact-feature-emoji { font-size: 22px; margin-bottom: 8px; }
        .redact-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .redact-feature-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 480px) {
          .redact-features { grid-template-columns: 1fr; }
          .redact-type-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {loading && <LoadingSpinner message="Redigindo PDF..." />}

      <div className="redact-root">
        <div className="redact-inner">
          <nav className="redact-breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="redact-breadcrumb-current">Redigir PDF</span>
          </nav>

          <div className="redact-header">
            <div className="redact-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 6l2 2-6 6H9v-2l6-6zm-8 8v4h4l8-8-4-4-8 8z" />
              </svg>
            </div>
            <h1 className="redact-title">Redigir PDF</h1>
            <p className="redact-subtitle">Remova informações sensíveis do PDF: CPF, CNPJ, e-mails, telefones e termos personalizados.</p>
          </div>

          <div className="redact-card">
            {!completed && (
              <>
                {!file ? (
                  <>
                    <label className="redact-upload" style={{ display: 'block' }}>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <div className="redact-upload-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="redact-upload-label">Clique para selecionar um PDF</div>
                      <div className="redact-upload-hint">Arquivo único · Máximo 50MB</div>
                    </label>

                    <PdfImageCapture onPdfReady={(pdfs) => { setFile(pdfs[0]); setError(''); setCompleted(false); }} />
                  </>
                ) : (
                  <div className="redact-file-selected">
                    <span className="redact-file-icon">📄</span>
                    <div className="redact-file-info">
                      <div className="redact-file-name">{file.name}</div>
                      <div className="redact-file-size">{formatBytes(file.size)}</div>
                    </div>
                    <button className="redact-remove-btn" onClick={() => { setFile(null); setCompleted(false); }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}

            {file && !completed && (
              <>
                <div style={{ marginTop: 20 }}>
                  <div className="redact-type-label">Tipo de informação a redigir</div>
                  <div className="redact-type-grid">
                    {(Object.keys(redactTypeLabels) as RedactType[]).map((t) => (
                      <button
                        key={t}
                        className={`redact-type-btn${redactType === t ? ' active' : ''}`}
                        onClick={() => setRedactType(t)}
                      >
                        {redactTypeLabels[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {redactType === 'custom' && (
                  <input
                    className="redact-terms-input"
                    type="text"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Digite os termos separados por vírgula (ex: confidencial, sigiloso)"
                  />
                )}

                <button
                  className="redact-btn"
                  onClick={handleSubmit}
                  disabled={loading || (redactType === 'custom' && !terms.trim())}
                >
                  {loading ? 'Redigindo...' : 'Redigir PDF'}
                </button>
              </>
            )}

            {!file && !completed && (
              <div className="redact-info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Os dados redigidos serão substituídos por tarjas pretas no PDF. O arquivo original não é modificado.</p>
              </div>
            )}

            {error && (
              <div className="redact-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {completed && (
              <div className="redact-success-box">
                <div className="redact-success-header">
                  <div className="redact-success-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3>PDF redigido com sucesso!</h3>
                </div>
                <p className="redact-success-detail">
                  As informações sensíveis foram removidas e substituídas por tarjas pretas.
                </p>
                {redactedCount !== null && (
                  <div className="redact-success-count">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {redactedCount} {redactedCount === 1 ? 'item redigido' : 'itens redigidos'}
                  </div>
                )}
                <button className="redact-download-btn" onClick={handleDownload}>
                  Salvar PDF redigido
                </button>
                <button className="redact-reset-btn" onClick={reset}>
                  Redigir outro PDF
                </button>
              </div>
            )}
          </div>

          <div className="redact-features">
            {[
              { e: '🛡️', t: 'CPF/CNPJ', d: 'Remova documentos pessoais automaticamente' },
              { e: '📧', t: 'E-mails', d: 'Oculte endereços de e-mail do documento' },
              { e: '✏️', t: 'Personalizado', d: 'Defina seus próprios termos para redigir' },
            ].map((x) => (
              <div key={x.t} className="redact-feature">
                <div className="redact-feature-emoji">{x.e}</div>
                <div className="redact-feature-title">{x.t}</div>
                <div className="redact-feature-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
