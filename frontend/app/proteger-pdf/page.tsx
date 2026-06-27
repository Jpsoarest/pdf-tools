'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToolChain } from '../components/ToolChainProvider';
import PdfImageCapture from '../components/PdfImageCapture';
import { apiPost, downloadBlob } from '../lib/api';

export default function ProtegerPDF() {
  const router = useRouter();
  const { incomingFile, consumeFile, pushFile, clearFile } = useToolChain();
  const chainLoaded = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [sourceTool, setSourceTool] = useState('');

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
    setSuccess(false);
  };

  const handleProtect = async () => {
    if (!file) return;
    if (!password.trim()) {
      setError('Digite uma senha para proteger o PDF');
      return;
    }
    if (password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    try {
      const response = await apiPost('/protect-pdf', formData);

      if (!response.ok) throw new Error('Erro ao proteger o PDF');

      const blob = await response.blob();
      setResultBlob(blob);
      await downloadBlob(blob, `protected_${file.name}`);
      
      setSuccess(true);
    } catch (err) {
      setError('Erro ao proteger o PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPassword('');
    setSuccess(false);
    setResultBlob(null);
    setSourceTool('');
    chainLoaded.current = false;
    clearFile();
  };

  const sendTo = (targetHref: string) => {
    if (!resultBlob) return;
    pushFile({
      file: resultBlob,
      filename: file ? `protected_${file.name}` : 'protected.pdf',
      sourceTool: '/proteger-pdf',
      sourceToolName: 'Proteger PDF',
    });
    router.push(targetHref);
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
        .password-section {
          margin-top: 20px;
        }
        .password-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
          display: block;
        }
        .password-input {
          width: 100%;
          padding: 14px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .password-input:focus {
          border-color: #F59E0B;
        }
        .password-input::placeholder {
          color: var(--text-tertiary);
        }
        .password-hint {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 6px;
        }
        .btn-protect {
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
        .btn-protect:hover:not(:disabled) {
          background: #FBBF24;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
        }
        .btn-protect:disabled {
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
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.15);
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
          background: #F59E0B;
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
        }
      `}</style>

      {loading && <LoadingSpinner message="Protegendo seu PDF…" />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Início</a>
            <span>/</span>
            <span className="breadcrumb-current">Proteger PDF</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="page-title">Proteger PDF</h1>
            <p className="page-subtitle">Adicione uma senha ao seu PDF para garantir a segurança dos documentos.</p>
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
            {/* Uploader */}
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
              <>
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

                <div className="password-section">
                  <label className="password-label">Senha de proteção</label>
                  <input
                    type="password"
                    className="password-input"
                    placeholder="Digite uma senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="password-hint">Mínimo de 4 caracteres</div>
                </div>

                {!success && (
                  <button
                    className="btn-protect"
                    onClick={handleProtect}
                    disabled={loading || !password.trim()}
                  >
                    {loading ? 'Protegendo…' : '🔒 Proteger PDF com senha'}
                  </button>
                )}
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

            {success && (
              <div className="success-box">
                <div className="success-header">
                  <div className="success-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3>PDF protegido com sucesso!</h3>
                </div>
                <p className="success-p">
                  O arquivo protegido foi salvo na pasta de saída.
                  <br />
                  <strong>Guarde bem sua senha!</strong>
                </p>
                <button className="btn-outline" onClick={reset}>
                  ← Proteger outro PDF
                </button>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Enviar para</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn-outline" onClick={() => sendTo('/comprimir-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Comprimir →</button>
                    <button className="btn-outline" onClick={() => sendTo('/mesclar-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Mesclar →</button>
                    <button className="btn-outline" onClick={() => sendTo('/editar-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Editar →</button>
                    <button className="btn-outline" onClick={() => sendTo('/numerar-paginas-pdf')} style={{ fontSize: 12, padding: '6px 14px' }}>Numerar →</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="features-mini">
            {[
              { e: '🔒', t: 'Criptografia', d: 'Proteção com senha forte' },
              { e: '⚡', t: 'Rápido', d: 'Processamento em segundos' },
              { e: '🆓', t: 'Gratuito', d: 'Sem custo adicional' },
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
