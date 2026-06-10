'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ToolShell from '../components/ToolShell';
import UploadPanel from '../components/UploadPanel';
import FileSummary from '../components/FileSummary';
import ResultPanel from '../components/ResultPanel';
import ErrorCallout from '../components/ErrorCallout';
import JobProgress from '../components/JobProgress';
import SettingsPanel from '../components/SettingsPanel';
import { useToolChain } from '../components/ToolChainProvider';
import PdfImageCapture from '../components/PdfImageCapture';
import { apiPost, downloadBlob } from '../lib/api';

export default function ComprimirPDF() {
  const router = useRouter();
  const { incomingFile, consumeFile, pushFile, clearFile } = useToolChain();
  const chainLoaded = useRef(false);

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState<{ originalSize: number; compressedSize: number; reduction: number } | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [sourceTool, setSourceTool] = useState('');

  useEffect(() => {
    if (chainLoaded.current) return;
    const f = consumeFile();
    if (f) {
      chainLoaded.current = true;
      const file = new File([f.file], f.filename, { type: 'application/pdf' });
      setFiles([file]);
      setSourceTool(f.sourceToolName);
    }
  }, [consumeFile]);

  const handleSubmit = async () => {
    if (files.length === 0) return;
    const file = files[0];
    setLoading(true);
    setError('');
    setCompleted(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiPost('/compress-pdf', formData);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Erro ao comprimir PDF' }));
        setError(err.detail?.message || 'Erro ao comprimir PDF');
        return;
      }

      const originalSize = parseInt(res.headers.get('X-Original-Size') || '0');
      const compressedSize = parseInt(res.headers.get('X-Compressed-Size') || '0');
      const reduction = parseFloat(res.headers.get('X-Reduction-Percent') || '0');

      setStats({ originalSize, compressedSize, reduction });

      const resultBlob = await res.blob();
      setBlob(resultBlob);
      setCompleted(true);
    } catch {
      setError('Erro de conexao. Verifique se o servidor esta rodando.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setStats(null);
    setBlob(null);
    setCompleted(false);
    setError('');
    setSourceTool('');
    chainLoaded.current = false;
    clearFile();
  };

  const fmt = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + s[i];
  };

  const handleDownload = async () => {
    if (!blob || !files[0]) return;
    await downloadBlob(blob, `compressed_${files[0].name}`);
  };

  const sendTo = (targetHref: string, targetName: string) => {
    if (!blob) return;
    pushFile({
      file: blob,
      filename: files[0] ? `compressed_${files[0].name}` : 'compressed.pdf',
      sourceTool: '/comprimir-pdf',
      sourceToolName: 'Comprimir PDF',
    });
    router.push(targetHref);
  };

  return (
    <ToolShell
      title="Comprimir PDF"
      description="Reduza o tamanho do seu PDF mantendo a melhor qualidade possivel. Compressao inteligente que preserva a legibilidade."
      breadcrumbs={[
        { label: 'Inicio', href: '/' },
        { label: 'Comprimir PDF' },
      ]}
    >
      <JobProgress isProcessing={loading} message="Comprimindo PDF..." showProgress />

      {sourceTool && (
        <div style={{
          marginBottom: 16, padding: '8px 14px',
          background: 'var(--accent-glow)', border: '1px solid var(--border-light)',
          borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>↳</span>
          Arquivo recebido de <strong style={{ color: 'var(--text-primary)' }}>{sourceTool}</strong>
        </div>
      )}

      {!completed && !loading && (
        <>
          {files.length === 0 ? (
            <>
              <UploadPanel
                accept=".pdf"
                maxSizeMB={50}
                label="Selecione um PDF para comprimir"
                hint="ou arraste e solte o arquivo aqui"
                onFilesSelected={setFiles}
              />
              <PdfImageCapture onPdfReady={setFiles} />
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FileSummary name={files[0].name} size={files[0].size} type="PDF" />

              <SettingsPanel title="Configuracoes avancadas" defaultExpanded={false}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    A compressao atual usa o modo equilibrado com streams otimizadas.
                  </label>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                    Se o PDF ja estiver otimizado, retornaremos o arquivo original para nao piorar a qualidade.
                  </p>
                </div>
              </SettingsPanel>

              <button
                onClick={handleSubmit}
                style={{
                  background: 'var(--accent-primary)', color: 'white', padding: '14px 32px',
                  borderRadius: 12, fontWeight: 600, fontSize: 15, border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s', width: 'fit-content',
                  boxShadow: 'var(--shadow-md)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              >
                Comprimir PDF
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{ marginTop: 16 }}>
          <ErrorCallout
            message={error}
            suggestion="Verifique se o arquivo e um PDF valido e tente novamente."
            onRetry={() => { setError(''); handleSubmit(); }}
          />
        </div>
      )}

      {completed && stats && (
        <div style={{ marginTop: 16 }}>
          <ResultPanel
            success={stats.reduction > 0}
            title={stats.reduction > 0 ? 'PDF comprimido!' : 'PDF ja esta otimizado'}
            message={
              stats.reduction > 0
                ? `O arquivo foi comprimido de ${fmt(stats.originalSize)} para ${fmt(stats.compressedSize)}`
                : 'A compressao nao resultou em reducao significativa. O arquivo original foi mantido para preservar a qualidade.'
            }
            metrics={[
              { label: 'Original', value: fmt(stats.originalSize) },
              { label: 'Final', value: fmt(stats.compressedSize) },
              { label: 'Reducao', value: `${stats.reduction.toFixed(1)}%`, highlight: true },
            ]}
            downloadLabel="Salvar PDF comprimido"
            onDownload={stats.reduction > 0 ? handleDownload : undefined}
            onReset={reset}
            nextActions={[
              { label: 'Proteger com senha', onClick: () => sendTo('/proteger-pdf', 'Proteger PDF') },
              { label: 'Mesclar com outro', onClick: () => sendTo('/mesclar-pdf', 'Mesclar PDFs') },
              { label: 'Editar PDF', onClick: () => sendTo('/editar-pdf', 'Editar PDF') },
            ]}
          />
        </div>
      )}
    </ToolShell>
  );
}
