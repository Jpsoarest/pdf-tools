'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

/* ─── Types ─────────────────────────────────────────────── */
interface Props {
  file: File;
  groups: number[][];
  onChange: (groups: number[][]) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfjsLib: any;
  }
}

/* ─── Cached thumbnail (renders once, shows <img> after) ── */
function PageThumb({
  pdfDoc,
  pageNum,
  scale = 0.28,
  cache,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any;
  pageNum: number;
  scale?: number;
  cache: Map<string, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheKey = `${pageNum}-${scale}`;
  const cached = cache.get(cacheKey);

  useEffect(() => {
    if (cached) return; // already cached
    let cancelled = false;
    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) {
          cache.set(cacheKey, canvas.toDataURL('image/jpeg', 0.85));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, scale, cached, cache, cacheKey]);

  if (cached) {
    return <img src={cached} alt={`Página ${pageNum}`} style={{ display: 'block', width: '100%', height: '100%' }} draggable={false} />;
  }
  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}

/* ─── Enlarged page (always renders fresh at high scale) ── */
function EnlargedPage({
  pdfDoc,
  pageNum,
  cache,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any;
  pageNum: number;
  cache: Map<string, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = 1.5;
  const cacheKey = `${pageNum}-${scale}`;
  const cached = cache.get(cacheKey);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) {
          cache.set(cacheKey, canvas.toDataURL('image/jpeg', 0.92));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, cached, cache, cacheKey]);

  if (cached) {
    return <img src={cached} alt={`Página ${pageNum}`} className="sve-lightbox-img" draggable={false} />;
  }
  return <canvas ref={canvasRef} className="sve-lightbox-img" />;
}

/* ─── Main component ─────────────────────────────────────── */
export default function SplitVisualEditor({ file, groups, onChange }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enlarged, setEnlarged] = useState<number | null>(null);
  const [dragging, setDragging] = useState<{ gi: number; pi: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ gi: number; pi: number } | null>(null);
  const urlRef = useRef<string | null>(null);

  // Persistent thumbnail cache (survives re-renders)
  const thumbCache = useMemo(() => new Map<string, string>(), []);

  /* ── Load PDF.js + document ── */
  useEffect(() => {
    let objectUrl: string | null = null;

    async function load() {
      setLoading(true);
      if (!window.pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      objectUrl = URL.createObjectURL(file);
      urlRef.current = objectUrl;

      const doc = await window.pdfjsLib.getDocument(objectUrl).promise;
      setPdfDoc(doc);
      const n = doc.numPages;
      setTotalPages(n);
      setLoading(false);
      thumbCache.clear();
      onChange([...Array(n)].map((_, i) => i + 1).reduce<number[][]>((acc, p) => { acc[0].push(p); return acc; }, [[]]));
    }

    load();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  /* ── Flat page list for reference ── */
  const allPages = groups.flat();

  /* ── Lightbox keyboard navigation ── */
  useEffect(() => {
    if (enlarged === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEnlarged(null);
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setEnlarged(prev => prev !== null && prev < totalPages ? prev + 1 : prev);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setEnlarged(prev => prev !== null && prev > 1 ? prev - 1 : prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enlarged, totalPages]);

  /* ── Insert cut after page at position (gi, pi) ── */
  const insertCutAfter = useCallback(
    (gi: number, pi: number) => {
      const next = groups.map((g) => [...g]);
      const group = next[gi];
      if (pi >= group.length - 1) return;
      const left = group.slice(0, pi + 1);
      const right = group.slice(pi + 1);
      next.splice(gi, 1, left, right);
      onChange(next);
    },
    [groups, onChange]
  );

  /* ── Remove cut between group gi and gi+1 ── */
  const removeCut = useCallback(
    (afterGroupIndex: number) => {
      const next = groups.map((g) => [...g]);
      const merged = [...next[afterGroupIndex], ...next[afterGroupIndex + 1]];
      next.splice(afterGroupIndex, 2, merged);
      onChange(next);
    },
    [groups, onChange]
  );

  /* ── Quick actions ── */
  const splitAll = useCallback(() => {
    onChange(allPages.map((p) => [p]));
  }, [allPages, onChange]);

  const joinAll = useCallback(() => {
    onChange([allPages]);
  }, [allPages, onChange]);

  const splitEvery = useCallback(
    (n: number) => {
      const result: number[][] = [];
      for (let i = 0; i < allPages.length; i += n) {
        result.push(allPages.slice(i, i + n));
      }
      onChange(result);
    },
    [allPages, onChange]
  );

  /* ── Drag & Drop ── */
  const handleDragStart = (gi: number, pi: number) => {
    setDragging({ gi, pi });
  };

  const handleDragOver = (e: React.DragEvent, gi: number, pi: number) => {
    e.preventDefault();
    setDragOver({ gi, pi });
  };

  const handleDrop = (e: React.DragEvent, targetGi: number, targetPi: number) => {
    e.preventDefault();
    if (!dragging) return;
    const { gi: srcGi, pi: srcPi } = dragging;
    if (srcGi === targetGi && srcPi === targetPi) return;

    const next = groups.map((g) => [...g]);
    const srcPage = next[srcGi][srcPi];

    next[srcGi].splice(srcPi, 1);

    let adjTargetPi = targetPi;
    if (srcGi === targetGi && srcPi < targetPi) adjTargetPi--;

    next[targetGi].splice(adjTargetPi, 0, srcPage);

    const cleaned = next.filter((g) => g.length > 0);
    onChange(cleaned);
    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  /* ── Group color palette ── */
  const groupColors = [
    '#6366F1', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6',
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
        <div style={{ fontSize: 13 }}>Carregando miniaturas…</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .sve-root { display: flex; flex-direction: column; gap: 16px; }

        .sve-toolbar {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          padding: 10px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          font-size: 12px;
        }
        .sve-toolbar-label { color: var(--text-tertiary); font-weight: 600; margin-right: 4px; }
        .sve-qbtn {
          padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
          cursor: pointer; border: 1px solid var(--border-light);
          background: var(--bg-secondary); color: var(--text-secondary);
          transition: all 0.15s;
        }
        .sve-qbtn:hover { background: var(--border-light); color: var(--text-primary); }

        .sve-groups { display: flex; flex-direction: column; gap: 12px; }

        .sve-group {
          border-radius: 14px;
          border: 2px solid var(--border-light);
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .sve-group-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 14px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
          background: var(--bg-tertiary);
        }
        .sve-group-badge { display: inline-flex; align-items: center; gap: 6px; }
        .sve-group-dot { width: 8px; height: 8px; border-radius: 50%; }
        .sve-group-pages-hint { color: var(--text-tertiary); font-size: 10px; font-weight: 500; }

        .sve-thumbs {
          display: flex; flex-wrap: wrap; gap: 8px;
          padding: 12px;
          background: var(--bg-secondary);
          min-height: 80px;
        }

        .sve-thumb-wrap {
          position: relative; flex-shrink: 0;
          width: 80px;
          border-radius: 6px; overflow: hidden;
          border: 2px solid transparent;
          transition: all 0.15s;
          background: var(--bg-tertiary);
          cursor: grab;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .sve-thumb-wrap:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .sve-thumb-wrap.dragging { opacity: 0.4; cursor: grabbing; }
        .sve-thumb-wrap.drag-over { border-color: #6366F1; box-shadow: 0 0 0 2px rgba(99,102,241,0.3); }

        .sve-thumb-num {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(0,0,0,0.55); color: #fff;
          font-size: 10px; font-weight: 600; text-align: center;
          padding: 2px 0;
        }
        .sve-thumb-zoom {
          position: absolute; top: 3px; right: 3px;
          width: 20px; height: 20px; border-radius: 4px;
          background: rgba(0,0,0,0.45); color: #fff;
          font-size: 11px; display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.15s; cursor: zoom-in;
          border: none;
        }
        .sve-thumb-wrap:hover .sve-thumb-zoom { opacity: 1; }

        .sve-cut-inner {
          display: flex; align-items: center; align-self: stretch;
          flex-shrink: 0; width: 22px;
          justify-content: center; position: relative; cursor: pointer;
        }
        .sve-cut-inner::before {
          content: ''; position: absolute;
          width: 1px; height: 100%;
          background: var(--border-light);
          left: 50%; top: 0; transform: translateX(-50%);
        }
        .sve-cut-inner-btn {
          position: relative; z-index: 1;
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--bg-tertiary); border: 1px solid var(--border-medium);
          color: var(--text-tertiary); font-size: 11px;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: all 0.15s; cursor: pointer;
        }
        .sve-cut-inner:hover .sve-cut-inner-btn {
          opacity: 1; background: #EF4444; border-color: #EF4444; color: #fff;
        }

        .sve-between-groups {
          display: flex; align-items: center; gap: 10px;
          padding: 0 4px;
        }
        .sve-between-line { flex: 1; height: 1px; background: var(--border-light); }
        .sve-merge-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
          cursor: pointer; border: 1px dashed var(--border-medium);
          background: var(--bg-secondary); color: var(--text-tertiary);
          transition: all 0.15s; white-space: nowrap;
        }
        .sve-merge-btn:hover {
          border-color: #6366F1; color: #6366F1; background: rgba(99,102,241,0.05);
        }
        .sve-merge-btn svg { width: 12px; height: 12px; }

        /* Lightbox */
        .sve-lightbox {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
        }
        .sve-lightbox-inner {
          max-width: 90vw; max-height: 90vh;
          border-radius: 10px; overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          background: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .sve-lightbox-img {
          display: block; max-width: 80vw; max-height: 85vh;
          object-fit: contain;
        }
        .sve-lightbox-close {
          position: absolute; top: 16px; right: 16px;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.15); border: none;
          color: #fff; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .sve-lightbox-close:hover { background: rgba(255,255,255,0.3); }
        .sve-lightbox-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 44px; height: 44px; border-radius: 50%;
          background: rgba(255,255,255,0.15); border: none;
          color: #fff; font-size: 20px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .sve-lightbox-nav:hover { background: rgba(255,255,255,0.3); }
        .sve-lightbox-nav:disabled { opacity: 0.3; cursor: default; }
        .sve-lightbox-nav:disabled:hover { background: rgba(255,255,255,0.15); }
        .sve-lightbox-prev { left: 16px; }
        .sve-lightbox-next { right: 16px; }
        .sve-lightbox-info {
          position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.6); color: #fff; padding: 4px 14px;
          border-radius: 20px; font-size: 12px; font-weight: 600;
          user-select: none;
        }
      `}</style>

      <div className="sve-root">
        {/* Quick actions toolbar */}
        <div className="sve-toolbar">
          <span className="sve-toolbar-label">Ações rápidas:</span>
          <button className="sve-qbtn" onClick={joinAll}>Juntar todas</button>
          <button className="sve-qbtn" onClick={splitAll}>Separar todas</button>
          <button className="sve-qbtn" onClick={() => splitEvery(2)}>A cada 2</button>
          <button className="sve-qbtn" onClick={() => splitEvery(3)}>A cada 3</button>
          <button className="sve-qbtn" onClick={() => splitEvery(5)}>A cada 5</button>
          <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: 11 }}>
            {groups.length} grupo{groups.length !== 1 ? 's' : ''} · {totalPages} pág.
          </span>
        </div>

        <div className="sve-groups">
          {groups.map((group, gi) => {
            const color = groupColors[gi % groupColors.length];
            return (
              <div key={gi}>
                <div className="sve-group" style={{ borderColor: color }}>
                  <div className="sve-group-header" style={{ borderBottom: `2px solid ${color}` }}>
                    <span className="sve-group-badge">
                      <span className="sve-group-dot" style={{ background: color }} />
                      <span style={{ color }}>Grupo {gi + 1}</span>
                    </span>
                    <span className="sve-group-pages-hint">
                      {group.length} pág{group.length !== 1 ? 's' : ''}.
                      {group.length <= 6
                        ? ` (${group.join(', ')})`
                        : ` (${group.slice(0, 5).join(', ')}…)`}
                    </span>
                  </div>

                  <div className="sve-thumbs">
                    {group.map((pageNum, pi) => {
                      const isDragging = dragging?.gi === gi && dragging?.pi === pi;
                      const isOver = dragOver?.gi === gi && dragOver?.pi === pi;
                      return (
                        <div key={pageNum} style={{ display: 'flex', alignItems: 'center' }}>
                          <div
                            className={`sve-thumb-wrap${isDragging ? ' dragging' : ''}${isOver ? ' drag-over' : ''}`}
                            draggable
                            onDragStart={() => handleDragStart(gi, pi)}
                            onDragOver={(e) => handleDragOver(e, gi, pi)}
                            onDrop={(e) => handleDrop(e, gi, pi)}
                            onDragEnd={handleDragEnd}
                            style={{ aspectRatio: '0.707' }}
                          >
                            <PageThumb
                              pdfDoc={pdfDoc}
                              pageNum={pageNum}
                              scale={0.28}
                              cache={thumbCache}
                            />
                            <div className="sve-thumb-num">{pageNum}</div>
                            <button
                              className="sve-thumb-zoom"
                              onClick={(e) => { e.stopPropagation(); setEnlarged(pageNum); }}
                              title="Ampliar"
                            >
                              ⤢
                            </button>
                          </div>

                          {pi < group.length - 1 && (
                            <div
                              className="sve-cut-inner"
                              title="Cortar aqui"
                              onClick={() => insertCutAfter(gi, pi)}
                            >
                              <div className="sve-cut-inner-btn">✂</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {gi < groups.length - 1 && (
                  <div className="sve-between-groups">
                    <div className="sve-between-line" />
                    <button className="sve-merge-btn" onClick={() => removeCut(gi)}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                      </svg>
                      Juntar grupos {gi + 1} e {gi + 2}
                    </button>
                    <div className="sve-between-line" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox with navigation */}
      {enlarged !== null && pdfDoc && (
        <div className="sve-lightbox" onClick={() => setEnlarged(null)}>
          <button
            className="sve-lightbox-nav sve-lightbox-prev"
            disabled={enlarged <= 1}
            onClick={(e) => { e.stopPropagation(); setEnlarged(p => p !== null && p > 1 ? p - 1 : p); }}
          >
            ‹
          </button>

          <div className="sve-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <EnlargedPage pdfDoc={pdfDoc} pageNum={enlarged} cache={thumbCache} />
          </div>

          <button
            className="sve-lightbox-nav sve-lightbox-next"
            disabled={enlarged >= totalPages}
            onClick={(e) => { e.stopPropagation(); setEnlarged(p => p !== null && p < totalPages ? p + 1 : p); }}
          >
            ›
          </button>

          <button className="sve-lightbox-close" onClick={() => setEnlarged(null)}>✕</button>
          <div className="sve-lightbox-info">
            Página {enlarged} de {totalPages} — ← → para navegar, Esc para fechar
          </div>
        </div>
      )}
    </>
  );
}
