'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PdfImageCapture from '../components/PdfImageCapture';
import PDFPreview from '../components/PDFPreview';
import { apiPost, formatBytes, saveResponseFiles } from '../lib/api';

type Orientation = 'auto' | 'portrait' | 'landscape';
type PdfRotation = 0 | 90 | 180 | 270;

interface MergeInput {
  id: number;
  file: File;
  orientation: Orientation;
  rotation: PdfRotation;
}

interface ReadyMerge {
  id: number;
  filename: string;
  files: MergeInput[];
}

let readyId = 0;
let inputId = 0;

function outputFilename(raw: string) {
  const withoutExtension = raw.trim().replace(/\.pdf$/i, '');
  const safeBase = withoutExtension
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return safeBase ? `${safeBase}.pdf` : '';
}

export default function MesclarPDF() {
  const [files, setFiles] = useState<MergeInput[]>([]);
  const [mergeOrientation, setMergeOrientation] = useState<Orientation>('auto');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [outputName, setOutputName] = useState('');
  const [ready, setReady] = useState<ReadyMerge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dragRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const appendPdfs = (selected: File[]) => {
    const inputs = selected.map((file) => ({
      id: ++inputId,
      file,
      orientation: 'auto' as Orientation,
      rotation: 0 as PdfRotation,
    }));
    setFiles((previous) => [...previous, ...inputs]);
    setError('');
    setNotice('');
  };

  const orientationLabel = (orientation: Orientation) => {
    if (orientation === 'portrait') return 'Retrato';
    if (orientation === 'landscape') return 'Paisagem';
    return 'Auto';
  };

  const applyMergeOrientation = (orientation: Orientation) => {
    setMergeOrientation(orientation);
    setFiles((previous) => previous.map((item) => ({ ...item, orientation: 'auto' })));
  };

  const updateFileOrientation = (id: number, orientation: Orientation) => {
    setFiles((previous) => previous.map((item) => (
      item.id === id ? { ...item, orientation } : item
    )));
  };

  const updateFileRotation = (id: number, rotation: PdfRotation) => {
    setFiles((previous) => previous.map((item) => (
      item.id === id ? { ...item, rotation } : item
    )));
  };

  const applyMergeRotation = () => {
    setFiles((previous) => previous.map((item) => ({ ...item, rotation: ((item.rotation + 90) % 360) as PdfRotation })));
  };

  const resolvedOrientation = (item: MergeInput) => (
    item.orientation === 'auto' ? mergeOrientation : item.orientation
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    const pdfs = selected.filter((file) => file.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length !== selected.length) {
      setError('Apenas arquivos PDF sao permitidos.');
      return;
    }
    appendPdfs(pdfs);
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    setFiles((previous) => {
      const reordered = [...previous];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  };

  const addReadyMerge = () => {
    if (files.length < 2) {
      setError('Adicione pelo menos 2 PDFs antes de enviar aos prontos.');
      return;
    }
    const filename = outputFilename(outputName);
    if (!filename) {
      setError('Informe o nome do PDF que sera gerado.');
      return;
    }
    if (ready.some((item) => outputFilename(item.filename).toLowerCase() === filename.toLowerCase())) {
      setError('Ja existe um arquivo pronto com esse nome.');
      return;
    }

    setReady((previous) => [...previous, {
      id: ++readyId,
      filename,
      files: files.map((item) => ({ ...item, orientation: resolvedOrientation(item) })),
    }]);
    setFiles([]);
    setMergeOrientation('auto');
    setOutputName('');
    setError('');
    setNotice(`${filename} adicionado aos prontos.`);
  };

  const updateReadyName = (id: number, value: string) => {
    setReady((previous) => previous.map((item) => (
      item.id === id ? { ...item, filename: value } : item
    )));
    setError('');
  };

  const removeReady = (id: number) => {
    setReady((previous) => previous.filter((item) => item.id !== id));
  };

  const editReady = (id: number) => {
    const chosen = ready.find((item) => item.id === id);
    if (!chosen) return;
    if (files.length > 0) {
      setError('Limpe ou envie o lote atual aos prontos antes de editar outro.');
      return;
    }
    setReady((previous) => previous.filter((item) => item.id !== id));
    setFiles(chosen.files);
    setMergeOrientation('auto');
    setOutputName(chosen.filename.replace(/\.pdf$/i, ''));
    setNotice('Lote carregado novamente para edicao.');
    setError('');
  };

  const downloadAll = async () => {
    if (ready.length === 0) return;

    const namedReady = ready.map((item) => ({ ...item, filename: outputFilename(item.filename) }));
    if (namedReady.some((item) => !item.filename)) {
      setError('Todos os arquivos prontos precisam ter um nome.');
      return;
    }
    const names = namedReady.map((item) => item.filename.toLowerCase());
    if (new Set(names).size !== names.length) {
      setError('Os arquivos prontos precisam ter nomes diferentes.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    const formData = new FormData();
    const manifest: { filename: string; indexes: number[]; orientations: Orientation[]; rotations: PdfRotation[] }[] = [];
    let index = 0;

    namedReady.forEach((item) => {
      const indexes: number[] = [];
      const orientations: Orientation[] = [];
      const rotations: PdfRotation[] = [];
      item.files.forEach((input) => {
        formData.append('files', input.file);
        indexes.push(index);
        orientations.push(input.orientation);
        rotations.push(input.rotation);
        index += 1;
      });
      manifest.push({ filename: item.filename, indexes, orientations, rotations });
    });
    formData.append('manifest', JSON.stringify(manifest));

    try {
      const response = await apiPost('/merge-pdf-batch', formData);
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { detail?: string | { message?: string } } | null;
        const detail = body?.detail;
        throw new Error(typeof detail === 'string' ? detail : detail?.message || 'Falha ao gerar as mesclagens.');
      }
      await saveResponseFiles(response, 'mesclagens_prontas.pdf');
      setNotice(`${ready.length} arquivo${ready.length === 1 ? '' : 's'} salvo${ready.length === 1 ? '' : 's'} na pasta de saída.`);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Erro ao salvar as mesclagens.');
    } finally {
      setLoading(false);
    }
  };

  const currentTotalSize = files.reduce((total, item) => total + item.file.size, 0);

  return (
    <>
      <style>{`
        .merge-root {
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 8%, rgba(167,139,250,0.13), transparent 30%),
            var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-body);
          padding: 32px 18px 64px;
        }
        .merge-wrap { max-width: 1080px; margin: 0 auto; }
        .merge-breadcrumb {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 26px;
          color: var(--text-tertiary);
          font-size: 13px;
        }
        .merge-breadcrumb a { color: inherit; text-decoration: none; }
        .merge-breadcrumb a:hover { color: #8B5CF6; }
        .merge-hero { margin-bottom: 28px; }
        .merge-kicker {
          display: inline-flex;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(139,92,246,0.1);
          color: #8B5CF6;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .merge-title {
          font: 800 clamp(30px, 4.6vw, 48px) var(--font-display);
          letter-spacing: -0.05em;
          margin: 0 0 8px;
        }
        .merge-subtitle {
          margin: 0;
          max-width: 690px;
          color: var(--text-secondary);
          font-size: 15px;
          line-height: 1.6;
        }
        .merge-grid {
          display: grid;
          grid-template-columns: minmax(360px, 1.08fr) minmax(300px, .92fr);
          gap: 16px;
          align-items: start;
        }
        .merge-card {
          border: 1px solid var(--card-border);
          border-radius: 20px;
          background: var(--card-bg);
          box-shadow: var(--shadow-sm);
          padding: clamp(18px, 3vw, 25px);
        }
        .merge-card-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .merge-card-title {
          font: 700 18px var(--font-display);
          letter-spacing: -0.03em;
          margin: 0 0 3px;
        }
        .merge-card-desc {
          color: var(--text-tertiary);
          font-size: 12px;
          line-height: 1.45;
          margin: 0;
        }
        .merge-count {
          border-radius: 999px;
          padding: 6px 10px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .merge-upload {
          display: block;
          border: 1.5px dashed var(--border-medium);
          border-radius: 14px;
          padding: 22px;
          text-align: center;
          cursor: pointer;
          background: var(--bg-secondary);
          transition: .18s ease;
        }
        .merge-upload:hover {
          border-color: #8B5CF6;
          background: rgba(139,92,246,0.04);
        }
        .merge-upload strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }
        .merge-upload span { font-size: 12px; color: var(--text-tertiary); }
        .merge-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 15px;
        }
        .merge-file {
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid var(--border-light);
          border-radius: 11px;
          background: var(--bg-tertiary);
          padding: 9px 10px;
        }
        .merge-number {
          width: 23px;
          height: 23px;
          flex: none;
          border-radius: 6px;
          display: grid;
          place-items: center;
          color: #8B5CF6;
          background: rgba(139,92,246,0.12);
          font-size: 11px;
          font-weight: 700;
        }
        .merge-file-data { flex: 1; min-width: 0; }
        .merge-file-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 600;
        }
        .merge-file-size { color: var(--text-tertiary); font-size: 11px; }
        .merge-controls { display: flex; gap: 3px; }
        .merge-orientation {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
          padding: 2px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          background: var(--bg-secondary);
        }
        .merge-orientation-btn {
          min-width: 30px;
          height: 27px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-tertiary);
          cursor: pointer;
          font: 700 10px var(--font-body);
        }
        .merge-orientation-btn:hover {
          background: rgba(139,92,246,.1);
          color: #8B5CF6;
        }
        .merge-orientation-btn.active {
          background: #8B5CF6;
          color: white;
        }
        .merge-rotate-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          height: 27px;
          padding: 0 8px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-tertiary);
          cursor: pointer;
          font: 700 10px var(--font-body);
          transition: all 0.15s;
          white-space: nowrap;
        }
        .merge-rotate-btn:hover {
          border-color: #F59E0B;
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.08);
        }
        .merge-rotate-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }
        .merge-rotate-global {
          width: 100%;
          height: 36px;
          justify-content: center;
          font-size: 11px;
        }
        .merge-rotate-global .merge-rotate-icon {
          width: 16px;
          height: 16px;
        }
        .merge-orientation-bar {
          margin-top: 12px;
          padding: 11px;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          background: var(--bg-secondary);
        }
        .merge-orientation-title {
          margin: 0 0 8px;
          color: var(--text-secondary);
          font: 700 12px var(--font-body);
        }
        .merge-orientation-wide {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
        }
        .merge-icon-btn {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 13px;
        }
        .merge-icon-btn:hover:not(:disabled) {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }
        .merge-icon-btn.danger:hover { color: #EF4444; background: rgba(239,68,68,.1); }
        .merge-icon-btn:disabled { opacity: .3; cursor: default; }
        .merge-output {
          margin-top: 18px;
          padding-top: 17px;
          border-top: 1px solid var(--border-light);
        }
        .merge-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 7px;
        }
        .merge-name-row {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-medium);
          background: var(--bg-secondary);
          border-radius: 11px;
          overflow: hidden;
        }
        .merge-name {
          min-width: 0;
          flex: 1;
          border: none;
          outline: none;
          padding: 11px 12px;
          background: transparent;
          color: var(--text-primary);
          font: 500 14px var(--font-body);
        }
        .merge-extension {
          padding: 0 12px;
          color: var(--text-tertiary);
          font-size: 13px;
        }
        .merge-add {
          width: 100%;
          border: none;
          border-radius: 12px;
          background: #8B5CF6;
          color: white;
          margin-top: 12px;
          padding: 13px 15px;
          cursor: pointer;
          font: 700 14px var(--font-body);
        }
        .merge-add:hover:not(:disabled) { background: #7C3AED; }
        .merge-add:disabled { opacity: .42; cursor: default; }
        .ready-empty {
          border: 1px dashed var(--border-medium);
          border-radius: 14px;
          padding: 27px 20px;
          color: var(--text-tertiary);
          text-align: center;
          font-size: 13px;
          line-height: 1.5;
        }
        .ready-list { display: flex; flex-direction: column; gap: 9px; }
        .ready-item {
          border: 1px solid var(--border-light);
          border-radius: 13px;
          padding: 11px;
          background: var(--bg-secondary);
        }
        .ready-head {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ready-name {
          flex: 1;
          min-width: 0;
          border: 1px solid transparent;
          border-radius: 7px;
          padding: 6px 7px;
          color: var(--text-primary);
          background: transparent;
          font: 600 13px var(--font-body);
        }
        .ready-name:focus {
          outline: none;
          border-color: var(--border-medium);
          background: var(--bg-tertiary);
        }
        .ready-meta {
          padding: 0 7px;
          color: var(--text-tertiary);
          font-size: 11px;
        }
        .ready-actions { display: flex; gap: 6px; margin-top: 9px; padding: 0 7px; }
        .ready-btn {
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 6px 9px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          font: 600 11px var(--font-body);
        }
        .ready-btn:hover { border-color: var(--border-medium); color: var(--text-primary); }
        .ready-btn.delete:hover { color: #EF4444; border-color: rgba(239,68,68,.35); }
        .download-all {
          width: 100%;
          margin-top: 16px;
          padding: 14px 15px;
          border: none;
          border-radius: 12px;
          background: #111827;
          color: white;
          cursor: pointer;
          font: 700 14px var(--font-body);
        }
        [data-theme="dark"] .download-all { background: #F9FAFB; color: #111827; }
        .download-all:disabled { opacity: .5; cursor: wait; }
        .merge-message {
          margin-top: 14px;
          border-radius: 11px;
          padding: 11px 13px;
          font-size: 12px;
          line-height: 1.45;
        }
        .merge-message.error { color: #DC2626; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.18); }
        .merge-message.notice { color: #059669; background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.17); }
        .preview-backdrop {
          position: fixed;
          inset: 0;
          z-index: 13000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(17,24,39,.72);
        }
        .preview-modal {
          width: min(900px, calc(100vw - 28px));
          max-height: calc(100vh - 32px);
          overflow: auto;
          border: 1px solid var(--border-medium);
          border-radius: 16px;
          background: var(--card-bg);
          box-shadow: var(--shadow-xl);
          padding: 14px;
        }
        .preview-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .preview-title {
          margin: 0;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--text-primary);
          font: 700 14px var(--font-body);
        }
        @media (max-width: 820px) {
          .merge-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 500px) {
          .merge-root { padding: 24px 12px 48px; }
          .merge-controls { gap: 0; }
          .merge-file { flex-wrap: wrap; }
          .merge-file-data { flex-basis: calc(100% - 72px); }
           .merge-orientation {
            order: 5;
            width: 100%;
            justify-content: space-between;
          }
          .merge-orientation-btn { flex: 1; }
          .merge-rotate-btn { order: 6; }
        }
      `}</style>

      <main className="merge-root">
        <div className="merge-wrap">
          <nav className="merge-breadcrumb">
            <Link href="/">Inicio</Link><span>/</span><span>Mesclar PDFs</span>
          </nav>
          <header className="merge-hero">
            <span className="merge-kicker">Fluxo em lote</span>
            <h1 className="merge-title">Mesclar PDFs</h1>
            <p className="merge-subtitle">
              Monte cada documento, defina o nome e envie para os prontos. Quando terminar,
              salve todas as mesclagens de uma vez como PDFs separados.
            </p>
          </header>

          <div className="merge-grid">
            <section className="merge-card">
              <div className="merge-card-header">
                <div>
                  <h2 className="merge-card-title">Montar arquivo</h2>
                  <p className="merge-card-desc">Adicione e ordene os PDFs desta mesclagem.</p>
                </div>
                {files.length > 0 && <span className="merge-count">{files.length} PDFs</span>}
              </div>

              <label className="merge-upload">
                <input type="file" accept=".pdf" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                <strong>Adicionar PDFs</strong>
                <span>Selecione varios arquivos ou continue adicionando abaixo</span>
              </label>

              <PdfImageCapture multiple onPdfReady={appendPdfs} />

              {files.length > 0 && (
                <>
                <div className="merge-orientation-bar">
                  <p className="merge-orientation-title">Orientacao do arquivo completo</p>
                  <div className="merge-orientation-wide" role="group" aria-label="Orientacao do arquivo completo">
                    {[
                      { value: 'auto', label: 'Auto' },
                      { value: 'portrait', label: 'Retrato' },
                      { value: 'landscape', label: 'Paisagem' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`merge-orientation-btn${mergeOrientation === item.value ? ' active' : ''}`}
                        onClick={() => applyMergeOrientation(item.value as Orientation)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="merge-orientation-bar">
                  <p className="merge-orientation-title">Rotacao de todos os PDFs</p>
                  <button
                    type="button"
                    className="merge-rotate-btn merge-rotate-global"
                    onClick={() => applyMergeRotation()}
                    title="Girar todos os PDFs"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="merge-rotate-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Girar todos +90°
                  </button>
                </div>

                <div className="merge-list">
                  {files.map((item, index) => (
                    <div
                      key={item.id}
                      className="merge-file"
                      draggable
                      onDragStart={() => { dragRef.current = index; setDragOverIdx(index); }}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDragEnd={() => { dragRef.current = null; setDragOverIdx(null); }}
                      onDrop={() => {
                        const from = dragRef.current;
                        if (from !== null && from !== index) {
                          setFiles((prev) => {
                            const reordered = [...prev];
                            const [item] = reordered.splice(from, 1);
                            reordered.splice(index, 0, item);
                            return reordered;
                          });
                        }
                        dragRef.current = null;
                        setDragOverIdx(null);
                      }}
                      style={dragOverIdx === index ? { opacity: 0.4 } : undefined}
                    >
                      <span className="merge-number">{index + 1}</span>
                      <div className="merge-file-data">
                        <div className="merge-file-name">{item.file.name}</div>
                        <div className="merge-file-size">
                          {formatBytes(item.file.size)} - {orientationLabel(resolvedOrientation(item))}{item.rotation !== 0 ? ` | ${item.rotation}°` : ''}
                        </div>
                      </div>
                      <div className="merge-orientation" aria-label={`Orientacao do PDF ${index + 1}`}>
                        {[
                          { value: 'auto', label: 'Auto', title: 'Usar orientacao do arquivo completo' },
                          { value: 'portrait', label: 'Ret', title: 'Retrato neste PDF' },
                          { value: 'landscape', label: 'Pais', title: 'Paisagem neste PDF' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`merge-orientation-btn${item.orientation === option.value ? ' active' : ''}`}
                            onClick={() => updateFileOrientation(item.id, option.value as Orientation)}
                            title={option.title}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="merge-rotate-btn"
                        onClick={() => updateFileRotation(item.id, ((item.rotation + 90) % 360) as PdfRotation)}
                        title="Girar PDF"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="merge-rotate-icon" style={item.rotation !== 0 ? { color: '#F59E0B' } : undefined}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {item.rotation > 0 && `${item.rotation}°`}
                      </button>
                      <div className="merge-controls">
                        <button type="button" className="merge-icon-btn" onClick={() => setPreviewFile(item.file)} title="Previsualizar">&#128065;</button>
                        <button type="button" className="merge-icon-btn" disabled={index === 0} onClick={() => moveFile(index, -1)} title="Subir">&#8593;</button>
                        <button type="button" className="merge-icon-btn" disabled={index === files.length - 1} onClick={() => moveFile(index, 1)} title="Descer">&#8595;</button>
                        <button type="button" className="merge-icon-btn danger" onClick={() => removeFile(index)} title="Remover">&#10005;</button>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}

              <div className="merge-output">
                <label className="merge-label" htmlFor="merge-output-name">Nome do arquivo pronto</label>
                <div className="merge-name-row">
                  <input
                    id="merge-output-name"
                    className="merge-name"
                    value={outputName}
                    placeholder="Ex: Contrato - Cliente 01"
                    onChange={(event) => { setOutputName(event.target.value); setError(''); }}
                  />
                  <span className="merge-extension">.pdf</span>
                </div>
                <button
                  type="button"
                  className="merge-add"
                  disabled={files.length < 2 || !outputName.trim()}
                  onClick={addReadyMerge}
                >
                  + Adicionar aos prontos
                </button>
                {files.length > 0 && (
                  <p className="merge-card-desc" style={{ marginTop: 9 }}>
                    Entrada atual: {formatBytes(currentTotalSize)} em {files.length} arquivo{files.length === 1 ? '' : 's'}.
                  </p>
                )}
              </div>
            </section>

            <section className="merge-card">
              <div className="merge-card-header">
                <div>
                  <h2 className="merge-card-title">Prontos para salvar</h2>
                  <p className="merge-card-desc">Os arquivos serao mesclados e salvos separadamente.</p>
                </div>
                {ready.length > 0 && <span className="merge-count">{ready.length} prontos</span>}
              </div>

              {ready.length === 0 ? (
                <div className="ready-empty">
                  Nenhuma mesclagem pronta ainda.<br />
                  Monte o primeiro arquivo ao lado e use o botao <strong>+ Adicionar aos prontos</strong>.
                </div>
              ) : (
                <div className="ready-list">
                  {ready.map((item, index) => (
                    <article key={item.id} className="ready-item">
                      <div className="ready-head">
                        <span className="merge-number">{index + 1}</span>
                        <input
                          className="ready-name"
                          aria-label={`Nome do arquivo pronto ${index + 1}`}
                          value={item.filename}
                          onChange={(event) => updateReadyName(item.id, event.target.value)}
                        />
                      </div>
                      <p className="ready-meta">{item.files.length} PDFs de origem</p>
                      <div className="ready-actions">
                        <button type="button" className="ready-btn" onClick={() => editReady(item.id)}>Editar composicao</button>
                        <button type="button" className="ready-btn delete" onClick={() => removeReady(item.id)}>Remover</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {ready.length > 0 && (
                <button type="button" className="download-all" disabled={loading} onClick={() => void downloadAll()}>
                  {loading ? 'Gerando arquivos...' : `Salvar todos (${ready.length})`}
                </button>
              )}

              {error && <div className="merge-message error">{error}</div>}
              {notice && <div className="merge-message notice">{notice}</div>}
            </section>
          </div>
        </div>
      </main>

      {previewFile && (
        <div className="preview-backdrop" onClick={() => setPreviewFile(null)}>
          <div className="preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="preview-head">
              <p className="preview-title">{previewFile.name}</p>
              <button type="button" className="ready-btn" onClick={() => setPreviewFile(null)}>
                Fechar
              </button>
            </div>
            <PDFPreview file={previewFile} showThumbnails maxThumbnails={8} />
          </div>
        </div>
      )}
    </>
  );
}
