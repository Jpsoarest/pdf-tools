'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiPost, downloadBlob, formatBytes } from '../lib/api';
import { useToolChain } from '../components/ToolChainProvider';
import PdfImageCapture from '../components/PdfImageCapture';

type ElementKind = 'text' | 'replace_text' | 'text_field' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
type Tool = 'select' | 'edit_text' | Exclude<ElementKind, 'replace_text'>;
type Align = 'left' | 'center' | 'right';

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> };
}

interface PdfDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
}

interface PdfPage {
  getViewport: (params: { scale: number }) => PdfViewport;
  render: (params: { canvasContext: CanvasRenderingContext2D | null; viewport: PdfViewport }) => PdfRenderTask;
}

interface PdfViewport {
  width: number;
  height: number;
}

interface PdfRenderTask {
  promise: Promise<void>;
  cancel?: () => void;
}

interface PageSize {
  width: number;
  height: number;
}

interface EditorElement {
  id: string;
  kind: ElementKind;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  name: string;
  label: string;
  value: string;
  options: string;
  groupName: string;
  option: string;
  fontSize: number;
  color: string;
  opacity: number;
  align: Align;
  required: boolean;
  multiline: boolean;
  checked: boolean;
  originalText: string;
  sourceId: string;
  backgroundColor: string;
}

interface TextLayerItem {
  id: string;
  page: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  font: string;
  color: string;
}

interface TextLayerResponse {
  has_text_layer: boolean;
  text_items: number;
  pages: Array<{
    page: number;
    width: number;
    height: number;
    items: TextLayerItem[];
  }>;
}

interface DragState {
  id: string;
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  original: Pick<EditorElement, 'x' | 'y' | 'width' | 'height'>;
}

const TOOL_ITEMS: Array<{ tool: Tool; label: string }> = [
  { tool: 'select', label: 'Selecionar' },
  { tool: 'edit_text', label: 'Editar texto' },
  { tool: 'text', label: 'Texto' },
  { tool: 'text_field', label: 'Campo texto' },
  { tool: 'checkbox', label: 'Checkbox' },
  { tool: 'radio', label: 'Radio' },
  { tool: 'dropdown', label: 'Lista' },
  { tool: 'signature', label: 'Assinatura' },
];

const KIND_LABELS: Record<ElementKind, string> = {
  text: 'Texto',
  replace_text: 'Texto existente',
  text_field: 'Campo texto',
  checkbox: 'Checkbox',
  radio: 'Radio',
  dropdown: 'Lista',
  signature: 'Assinatura',
};

const DEFAULT_OPTIONS = 'Opcao 1\nOpcao 2\nOpcao 3';

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getWindowPdfJs() {
  return (window as Window & { pdfjsLib?: PdfJsLib }).pdfjsLib;
}

function defaultSize(kind: ElementKind) {
  if (kind === 'checkbox' || kind === 'radio') return { width: 22, height: 22 };
  if (kind === 'signature') return { width: 190, height: 56 };
  if (kind === 'text' || kind === 'replace_text') return { width: 180, height: 42 };
  return { width: 190, height: 34 };
}

function makeElement(kind: ElementKind, page: number, x: number, y: number, count: number): EditorElement {
  const size = defaultSize(kind);
  return {
    id: makeId(),
    kind,
    page,
    x,
    y,
    width: size.width,
    height: size.height,
    text: kind === 'text' ? 'Novo texto' : '',
    name: `${kind}_${count + 1}`,
    label: KIND_LABELS[kind],
    value: '',
    options: DEFAULT_OPTIONS,
    groupName: 'grupo_1',
    option: `opcao_${count + 1}`,
    fontSize: kind === 'text' ? 16 : 11,
    color: '#111827',
    opacity: 1,
    align: 'left',
    required: false,
    multiline: false,
    checked: false,
    originalText: '',
    sourceId: '',
    backgroundColor: '#FFFFFF',
  };
}

function makeReplacementElement(item: TextLayerItem): EditorElement {
  return {
    ...makeElement('replace_text', item.page, item.x, item.y, 0),
    x: item.x,
    y: item.y,
    width: Math.max(20, item.width),
    height: Math.max(12, item.height),
    text: item.text,
    originalText: item.text,
    sourceId: item.id,
    fontSize: Math.max(6, Math.round(item.fontSize)),
    color: item.color || '#111827',
    backgroundColor: '#FFFFFF',
  };
}

function clampElement(element: EditorElement, pageSize: PageSize | null): EditorElement {
  if (!pageSize) return element;
  const minWidth = element.kind === 'checkbox' || element.kind === 'radio' ? 16 : 28;
  const minHeight = element.kind === 'checkbox' || element.kind === 'radio' ? 16 : 20;
  const width = Math.min(Math.max(element.width, minWidth), pageSize.width);
  const height = Math.min(Math.max(element.height, minHeight), pageSize.height);
  const x = Math.min(Math.max(element.x, 0), Math.max(0, pageSize.width - width));
  const y = Math.min(Math.max(element.y, 0), Math.max(0, pageSize.height - height));
  return { ...element, x, y, width, height };
}

function splitOptions(options: string) {
  return options
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function elementToOperation(element: EditorElement) {
  if (element.kind === 'text' || element.kind === 'replace_text') {
    return {
      kind: element.kind,
      page: element.page,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      text: element.text,
      fontSize: element.fontSize,
      color: element.color,
      opacity: element.opacity,
      align: element.align,
      backgroundColor: element.backgroundColor,
      originalText: element.originalText,
      sourceId: element.sourceId,
    };
  }

  return {
    kind: element.kind,
    page: element.page,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    name: element.name,
    label: element.label,
    value: element.value,
    options: splitOptions(element.options),
    groupName: element.groupName,
    option: element.option,
    fontSize: element.fontSize,
    color: element.color,
    required: element.required,
    multiline: element.multiline,
    checked: element.checked,
  };
}

function ToolIcon({ tool }: { tool: Tool }) {
  if (tool === 'select') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 3l12 8-5.4 1.2L15 20l-2.2 1-3.4-7.7L5 17V3z" />
      </svg>
    );
  }
  if (tool === 'edit_text') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h10v2H4V5zm0 4h12v2H4V9zm0 4h8v2H4v-2zm12.7 1.1l2.2 2.2-4.9 4.9H11.8V19l4.9-4.9zm3.6.8l-.8.8-2.2-2.2.8-.8a1.6 1.6 0 012.2 2.2z" />
      </svg>
    );
  }
  if (tool === 'text') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5h14v3h-2.5V7.5h-3V18H16v1.5H8V18h2.5V7.5h-3V8H5V5z" />
      </svg>
    );
  }
  if (tool === 'text_field') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h8v2H8v-2z" />
      </svg>
    );
  }
  if (tool === 'checkbox') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5h14v14H5V5zm2 2v10h10V7H7zm8.7 2.7l1.1 1.1-5.2 5.2-3.1-3.1 1.1-1.1 2 2 4.1-4.1z" />
      </svg>
    );
  }
  if (tool === 'radio') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12zm0 3a3 3 0 100 6 3 3 0 000-6z" />
      </svg>
    );
  }
  if (tool === 'dropdown') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4V6zm2 2v8h12V8H6zm8 3l-2 2-2-2h4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 16h14v3H5v-3zm1-3.5l7.5-7.5 3.5 3.5-7.5 7.5H6v-3.5zm9.7-4L13.5 6.3l-1.4 1.4 2.2 2.2 1.4-1.4z" />
    </svg>
  );
}

export default function EditarPDF() {
  const router = useRouter();
  const { incomingFile, consumeFile, pushFile, clearFile } = useToolChain();
  const chainLoaded = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [sourceTool, setSourceTool] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [pdfjsLib, setPdfjsLib] = useState<PdfJsLib | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize | null>(null);
  const [zoom, setZoom] = useState(1.2);
  const [tool, setTool] = useState<Tool>('select');
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [textLayerItems, setTextLayerItems] = useState<TextLayerItem[]>([]);
  const [textLayerLoaded, setTextLayerLoaded] = useState(false);
  const [hasTextLayer, setHasTextLayer] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [undoStack, setUndoStack] = useState<EditorElement[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorElement[][]>([]);
  const [snapLines, setSnapLines] = useState<{ orientation: 'h' | 'v'; position: number }[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageSurfaceRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);

  const selectedElement = useMemo(
    () => elements.find((item) => item.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const pushHistory = useCallback((_newElements: EditorElement[]) => {
    setUndoStack((prev) => [...prev.slice(-49), elements]);
    setRedoStack([]);
  }, [elements]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((s) => [...s, elements]);
    setUndoStack((s) => s.slice(0, -1));
    setElements(prev);
    setDone(false);
  }, [undoStack, elements]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, elements]);
    setRedoStack((s) => s.slice(0, -1));
    setElements(next);
    setDone(false);
  }, [redoStack, elements]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          pushHistory(elements);
          setElements((items) => items.filter((item) => item.id !== selectedId));
          setSelectedId(null);
          setDone(false);
        }
      } else if ((e.key === 'd' || e.key === 'D') && (e.metaKey || e.ctrlKey) && selectedElement) {
        e.preventDefault();
        const copy = {
          ...selectedElement,
          id: makeId(),
          name: `${selectedElement.name}_copia`,
          x: selectedElement.x + 20,
          y: selectedElement.y + 20,
        };
        pushHistory(elements);
        setElements((items) => [...items, copy]);
        setSelectedId(copy.id);
        setDone(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, selectedElement, pushHistory, undo, redo, elements]);

  const currentElements = useMemo(
    () => elements.filter((item) => item.page === currentPage),
    [elements, currentPage],
  );

  const currentTextLayerItems = useMemo(
    () => textLayerItems.filter((item) => item.page === currentPage),
    [currentPage, textLayerItems],
  );

  useEffect(() => {
    if (chainLoaded.current) return;
    const f = consumeFile();
    if (f) {
      chainLoaded.current = true;
      setFile(new File([f.file], f.filename, { type: 'application/pdf' }));
      setSourceTool(f.sourceToolName);
    }
  }, [consumeFile]);

  useEffect(() => {
    const loadedLib = getWindowPdfJs();
    if (loadedLib) {
      setPdfjsLib(loadedLib);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-pdfjs-editor="true"]');
    const script = existing ?? document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.dataset.pdfjsEditor = 'true';
    script.onload = () => {
      const lib = getWindowPdfJs();
      if (!lib) return;
      lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setPdfjsLib(lib);
    };
    if (!existing) {
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!pdfjsLib || !file) return;

    let cancelled = false;
    setLoadingPdf(true);
    setError('');
    setDone(false);
    setTextLayerLoaded(false);
    setHasTextLayer(false);
    setTextLayerItems([]);

    file.arrayBuffer()
      .then((data) => pdfjsLib.getDocument({ data }).promise)
      .then((pdf) => {
        if (cancelled) return;
        setPdfDoc(pdf);
        setPageCount(pdf.numPages);
        setCurrentPage(1);
        setSelectedId(null);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Nao foi possivel abrir este PDF.');
          setPdfDoc(null);
          setPageCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPdf(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file, pdfjsLib]);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    const formData = new FormData();
    formData.append('file', file);

    apiPost('/pdf-text-layer', formData)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json() as Promise<TextLayerResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setTextLayerItems(data.pages.flatMap((page) => page.items));
        setHasTextLayer(data.has_text_layer);
      })
      .catch(() => {
        if (!cancelled) {
          setTextLayerItems([]);
          setHasTextLayer(false);
        }
      })
      .finally(() => {
        if (!cancelled) setTextLayerLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (renderTaskRef.current?.cancel) {
      renderTaskRef.current.cancel();
    }

    pdfDoc.getPage(currentPage)
      .then((page) => {
        if (cancelled) return null;
        const viewport = page.getViewport({ scale: zoom });
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        setPageSize({ width: viewport.width / zoom, height: viewport.height / zoom });
        const task = page.render({ canvasContext: context, viewport });
        renderTaskRef.current = task;
        return task.promise;
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : '';
        if (!cancelled && message !== 'Rendering cancelled, page 1') {
          setError('Nao foi possivel renderizar a pagina.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage, zoom]);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event: PointerEvent) => {
      setElements((items) => {
        const updated = items.map((item) => {
          if (item.id !== dragState.id || item.page !== currentPage) return item;
          const dx = (event.clientX - dragState.startX) / zoom;
          const dy = (event.clientY - dragState.startY) / zoom;

          let newElement: EditorElement;
          if (dragState.mode === 'resize') {
            newElement = clampElement({
              ...item,
              width: dragState.original.width + dx,
              height: dragState.original.height + dy,
            }, pageSize);
          } else {
            newElement = clampElement({
              ...item,
              x: dragState.original.x + dx,
              y: dragState.original.y + dy,
            }, pageSize);
          }

          const SNAP = 6 / zoom;
          const otherElements = items.filter((el) => el.id !== dragState.id && el.page === currentPage);
          const lines: { orientation: 'h' | 'v'; position: number }[] = [];

          const eCX = newElement.x + newElement.width / 2;
          const eCY = newElement.y + newElement.height / 2;
          const eL = newElement.x;
          const eR = newElement.x + newElement.width;
          const eT = newElement.y;
          const eB = newElement.y + newElement.height;

          for (const other of otherElements) {
            const oCX = other.x + other.width / 2;
            const oCY = other.y + other.height / 2;
            const oL = other.x;
            const oR = other.x + other.width;
            const oT = other.y;
            const oB = other.y + other.height;

            if (Math.abs(eCX - oCX) < SNAP) { newElement.x = oCX - newElement.width / 2; lines.push({ orientation: 'v', position: oCX }); }
            else if (Math.abs(eL - oR) < SNAP) { newElement.x = oR; lines.push({ orientation: 'v', position: oR }); }
            else if (Math.abs(eR - oL) < SNAP) { newElement.x = oL - newElement.width; lines.push({ orientation: 'v', position: oL }); }
            else if (Math.abs(eR - oR) < SNAP) { newElement.x = oR - newElement.width; lines.push({ orientation: 'v', position: oR }); }
            else if (Math.abs(eL - oL) < SNAP) { newElement.x = oL; lines.push({ orientation: 'v', position: oL }); }

            if (Math.abs(eCY - oCY) < SNAP) { newElement.y = oCY - newElement.height / 2; lines.push({ orientation: 'h', position: oCY }); }
            else if (Math.abs(eT - oB) < SNAP) { newElement.y = oB; lines.push({ orientation: 'h', position: oB }); }
            else if (Math.abs(eB - oT) < SNAP) { newElement.y = oT - newElement.height; lines.push({ orientation: 'h', position: oT }); }
            else if (Math.abs(eB - oB) < SNAP) { newElement.y = oB - newElement.height; lines.push({ orientation: 'h', position: oB }); }
            else if (Math.abs(eT - oT) < SNAP) { newElement.y = oT; lines.push({ orientation: 'h', position: oT }); }
          }

          setSnapLines(lines);
          return clampElement(newElement, pageSize);
        });
        return updated;
      });
    };

    const handlePointerUp = () => {
      pushHistory(elements);
      setDragState(null);
      setSnapLines([]);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [currentPage, dragState, pageSize, zoom, elements, pushHistory]);

  const updateSelected = useCallback((patch: Partial<EditorElement>) => {
    if (!selectedId) return;
    pushHistory(elements);
    setElements((items) => items.map((item) => {
      if (item.id !== selectedId) return item;
      return clampElement({ ...item, ...patch }, item.page === currentPage ? pageSize : null);
    }));
  }, [currentPage, pageSize, selectedId, elements, pushHistory]);

  const resetEditor = () => {
    setFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setCurrentPage(1);
    setPageSize(null);
    setElements([]);
    setUndoStack([]);
    setRedoStack([]);
    setSnapLines([]);
    setTextLayerItems([]);
    setTextLayerLoaded(false);
    setHasTextLayer(false);
    setSelectedId(null);
    setTool('select');
    setError('');
    setDone(false);
    setResultBlob(null);
    setSourceTool('');
    chainLoaded.current = false;
    clearFile();
  };

  const sendTo = (targetHref: string) => {
    if (!resultBlob) return;
    pushFile({
      file: resultBlob,
      filename: file ? `edited_${file.name}` : 'edited.pdf',
      sourceTool: '/editar-pdf',
      sourceToolName: 'Editar PDF',
    });
    router.push(targetHref);
  };

  const selectPdfFile = (chosen: File) => {
    if (!chosen.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF.');
      return;
    }
    setFile(chosen);
    setElements([]);
    setUndoStack([]);
    setRedoStack([]);
    setTextLayerItems([]);
    setTextLayerLoaded(false);
    setHasTextLayer(false);
    setSelectedId(null);
    setError('');
    setDone(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    if (chosen) selectPdfFile(chosen);
  };

  const handleSurfacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pageSurfaceRef.current || !pageSize) return;

    if (tool === 'edit_text') {
      setSelectedId(null);
      return;
    }

    if (tool === 'select') {
      setSelectedId(null);
      return;
    }

    const rect = pageSurfaceRef.current.getBoundingClientRect();
    const pointX = (event.clientX - rect.left) / zoom;
    const pointY = (event.clientY - rect.top) / zoom;
    const draft = makeElement(tool, currentPage, pointX, pointY, elements.length);
    const centered = {
      ...draft,
      x: pointX - draft.width / 2,
      y: pointY - draft.height / 2,
    };
    const next = clampElement(centered, pageSize);
    pushHistory(elements);
    setElements((items) => [...items, next]);
    setSelectedId(next.id);
    setTool('select');
    setError('');
    setDone(false);
  };

  const startDrag = (event: ReactPointerEvent, id: string, mode: DragState['mode']) => {
    const element = elements.find((item) => item.id === id);
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(id);
    setDragState({
      id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      original: {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      },
    });
  };

  const removeSelected = () => {
    if (!selectedId) return;
    pushHistory(elements);
    setElements((items) => items.filter((item) => item.id !== selectedId));
    setSelectedId(null);
    setDone(false);
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const copy = clampElement({
      ...selectedElement,
      id: makeId(),
      name: `${selectedElement.name}_copia`,
      x: selectedElement.x + 16,
      y: selectedElement.y + 16,
    }, pageSize);
    setElements((items) => [...items, copy]);
    setSelectedId(copy.id);
    setDone(false);
  };

  const replaceTextItem = (event: ReactPointerEvent, item: TextLayerItem) => {
    event.preventDefault();
    event.stopPropagation();

    const existing = elements.find((element) => element.kind === 'replace_text' && element.sourceId === item.id);
    if (existing) {
      setSelectedId(existing.id);
      setTool('select');
      return;
    }

    const next = clampElement(makeReplacementElement(item), pageSize);
    pushHistory(elements);
    setElements((items) => [...items, next]);
    setSelectedId(next.id);
    setTool('select');
    setError('');
    setDone(false);
  };

  const handleExport = async () => {
    if (!file) {
      setError('Selecione um PDF.');
      return;
    }
    if (elements.length === 0) {
      setError('Adicione pelo menos um item ao PDF.');
      return;
    }

    setExporting(true);
    setError('');
    setDone(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('operations', JSON.stringify(elements.map(elementToOperation)));

    try {
      const response = await apiPost('/edit-pdf', formData);
      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(details || 'Erro ao editar PDF');
      }
      const blob = await response.blob();
      setResultBlob(blob);
      const baseName = file.name.replace(/\.pdf$/i, '');
      await downloadBlob(blob, `${baseName}_editado.pdf`);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao editar PDF.');
    } finally {
      setExporting(false);
    }
  };

  const goToPage = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), pageCount || 1);
    setCurrentPage(clamped);
    setSelectedId(null);
  };

  return (
    <>
      <style>{`
        .edit-root {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-body);
          padding: 24px 16px 40px;
        }
        .edit-shell {
          max-width: 1440px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 72px minmax(0, 1fr) 320px;
          gap: 12px;
          min-height: calc(100vh - 110px);
        }
        .edit-topbar {
          max-width: 1440px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-tertiary);
        }
        .breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
        }
        .breadcrumb a:hover { color: var(--text-primary); }
        .title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 30px;
          line-height: 1;
          letter-spacing: 0;
          margin: 0;
        }
        .page-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .top-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .file-chip {
          min-height: 38px;
          max-width: 340px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-size: 13px;
        }
        .file-chip strong {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--text-primary);
        }
        .action-btn {
          min-height: 38px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid var(--border-light);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .action-btn:hover:not(:disabled) {
          border-color: var(--border-medium);
          background: var(--bg-tertiary);
        }
        .action-btn.primary {
          background: #2563EB;
          border-color: #2563EB;
          color: white;
        }
        .action-btn.primary:hover:not(:disabled) {
          background: #1D4ED8;
          border-color: #1D4ED8;
        }
        .action-btn.danger {
          color: #DC2626;
        }
        .action-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .tool-rail,
        .inspector,
        .stage-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          box-shadow: var(--shadow-sm);
        }
        .tool-rail {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-self: start;
          position: sticky;
          top: 82px;
        }
        .tool-btn {
          width: 54px;
          height: 54px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .tool-btn svg {
          width: 22px;
          height: 22px;
          fill: currentColor;
        }
        .tool-btn span {
          max-width: 48px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 9px;
          line-height: 1;
        }
        .tool-btn:hover,
        .tool-btn.active {
          border-color: #2563EB;
          background: rgba(37, 99, 235, 0.08);
          color: #2563EB;
        }
        .stage-panel {
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .stage-toolbar {
          min-height: 52px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--border-light);
          flex-wrap: wrap;
        }
        .stage-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .small-btn {
          height: 32px;
          min-width: 32px;
          padding: 0 9px;
          border-radius: 7px;
          border: 1px solid var(--border-light);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-weight: 700;
          font-size: 12px;
        }
        .small-btn:hover:not(:disabled) { background: var(--bg-tertiary); }
        .small-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-counter {
          min-width: 86px;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .zoom-label {
          min-width: 48px;
          text-align: center;
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 700;
        }
        .stage-scroll {
          flex: 1;
          min-height: 620px;
          overflow: auto;
          background:
            linear-gradient(45deg, rgba(17,24,39,0.04) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(17,24,39,0.04) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(17,24,39,0.04) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(17,24,39,0.04) 75%);
          background-size: 18px 18px;
          background-position: 0 0, 0 9px, 9px -9px, -9px 0px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px;
        }
        .empty-stage {
          width: min(520px, 100%);
          margin: auto;
          padding: 28px;
          border: 1px dashed var(--border-medium);
          border-radius: 8px;
          background: var(--bg-secondary);
          text-align: center;
        }
        .upload-box {
          display: block;
          cursor: pointer;
        }
        .upload-box input {
          display: none;
        }
        .upload-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .upload-meta {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .page-surface {
          position: relative;
          background: white;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.25);
          border-radius: 2px;
          flex: 0 0 auto;
        }
        .page-surface canvas {
          display: block;
          pointer-events: none;
        }
        .overlay-element {
          position: absolute;
          border: 1.5px solid #2563EB;
          background: rgba(37, 99, 235, 0.08);
          color: #111827;
          overflow: hidden;
          cursor: move;
          user-select: none;
        }
        .overlay-element:not(.selected) {
          border-color: rgba(37, 99, 235, 0.55);
        }
        .overlay-element.text {
          background: rgba(255, 255, 255, 0.45);
          border-style: dashed;
          padding: 2px 4px;
          white-space: pre-wrap;
        }
        .overlay-element.replace_text {
          background: rgba(255, 255, 255, 0.92);
          border-color: #0D9488;
          padding: 2px 4px;
          white-space: pre-wrap;
        }
        .text-layer-hit {
          position: absolute;
          border: 1px solid rgba(13, 148, 136, 0.35);
          background: rgba(13, 148, 136, 0.08);
          color: transparent;
          cursor: text;
        }
        .text-layer-hit:hover {
          background: rgba(13, 148, 136, 0.18);
          border-color: #0D9488;
        }
        .overlay-element.field {
          background: rgba(255, 255, 255, 0.86);
        }
        .overlay-element.checkbox,
        .overlay-element.radio {
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .overlay-element.radio {
          border-radius: 999px;
        }
        .overlay-element.signature {
          background: rgba(255, 255, 255, 0.86);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
        }
        .field-preview {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 8px;
          color: #475569;
          font-size: 12px;
        }
        .resize-handle {
          position: absolute;
          width: 12px;
          height: 12px;
          right: -6px;
          bottom: -6px;
          border-radius: 3px;
          background: #2563EB;
          border: 2px solid white;
          cursor: nwse-resize;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
        }
        .inspector {
          min-width: 0;
          align-self: start;
          position: sticky;
          top: 82px;
          max-height: calc(100vh - 100px);
          overflow: auto;
        }
        .inspector-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-light);
        }
        .inspector-title {
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 3px;
        }
        .inspector-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .inspector-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .control-label {
          font-size: 12px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .control-input,
        .control-textarea,
        .control-select {
          width: 100%;
          border: 1px solid var(--border-light);
          border-radius: 7px;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          padding: 9px 10px;
          font-size: 13px;
          outline: none;
        }
        .control-textarea {
          min-height: 76px;
          resize: vertical;
        }
        .control-input:focus,
        .control-textarea:focus,
        .control-select:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .toggle-row {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 700;
        }
        .toggle-row input {
          width: 17px;
          height: 17px;
          accent-color: #2563EB;
        }
        .segmented {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid var(--border-light);
          border-radius: 7px;
          overflow: hidden;
        }
        .segmented button {
          min-height: 34px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 800;
          border-right: 1px solid var(--border-light);
        }
        .segmented button:last-child { border-right: none; }
        .segmented button.active {
          background: #2563EB;
          color: white;
        }
        .range-row {
          display: grid;
          grid-template-columns: 1fr 52px;
          gap: 8px;
          align-items: center;
        }
        .range-row input[type="range"] {
          width: 100%;
          accent-color: #2563EB;
        }
        .status-box {
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
          line-height: 1.4;
        }
        .status-box.error {
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.2);
          color: #DC2626;
        }
        .status-box.success {
          background: rgba(22, 163, 74, 0.08);
          border: 1px solid rgba(22, 163, 74, 0.2);
          color: #15803D;
        }
        .inspector-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        @media (max-width: 1100px) {
          .edit-shell {
            grid-template-columns: 64px minmax(0, 1fr);
          }
          .inspector {
            grid-column: 1 / -1;
            position: static;
            max-height: none;
          }
        }
        @media (max-width: 720px) {
          .edit-root { padding: 16px 10px 32px; }
          .edit-shell {
            grid-template-columns: 1fr;
          }
          .tool-rail {
            position: static;
            flex-direction: row;
            overflow-x: auto;
          }
          .tool-btn {
            flex: 0 0 58px;
          }
          .stage-scroll {
            min-height: 460px;
            padding: 18px;
            justify-content: flex-start;
          }
          .page-title { font-size: 25px; }
          .top-actions { width: 100%; }
          .action-btn.primary { flex: 1; }
        }
      `}</style>

      {(loadingPdf || exporting) && (
        <LoadingSpinner message={exporting ? 'Gerando PDF editado...' : 'Carregando PDF...'} />
      )}

      <div className="edit-root">
        <div className="edit-topbar">
          <div className="title-block">
            <nav className="breadcrumb">
              <Link href="/">Inicio</Link>
              <span>/</span>
              <span>Editar PDF</span>
            </nav>
            <h1 className="page-title">Editar PDF</h1>
            <div className="page-subtitle">Texto, campos de formulario e assinatura</div>
          </div>

          <div className="top-actions">
            {file && (
              <div className="file-chip" title={file.name}>
                <strong>{file.name}</strong>
                <span>{formatBytes(file.size)}</span>
              </div>
            )}
            {file && (
              <button className="action-btn" onClick={resetEditor}>
                Novo PDF
              </button>
            )}
            <button className="action-btn primary" onClick={handleExport} disabled={!file || exporting}>
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="edit-shell">
          <aside className="tool-rail" aria-label="Ferramentas">
            {TOOL_ITEMS.map((item) => (
              <button
                key={item.tool}
                type="button"
                className={`tool-btn${tool === item.tool ? ' active' : ''}`}
                title={item.label}
                onClick={() => setTool(item.tool)}
              >
                <ToolIcon tool={item.tool} />
                <span>{item.label}</span>
              </button>
            ))}
          </aside>

          <section className="stage-panel">
            <div className="stage-toolbar">
              <div className="stage-controls">
                <button className="small-btn" onClick={() => goToPage(1)} disabled={!file || currentPage === 1}>
                  1
                </button>
                <button className="small-btn" onClick={() => goToPage(currentPage - 1)} disabled={!file || currentPage === 1}>
                  &lt;
                </button>
                <span className="page-counter">{file ? `${currentPage} / ${pageCount}` : '0 / 0'}</span>
                <button className="small-btn" onClick={() => goToPage(currentPage + 1)} disabled={!file || currentPage === pageCount}>
                  &gt;
                </button>
                <button className="small-btn" onClick={() => goToPage(pageCount)} disabled={!file || currentPage === pageCount}>
                  {pageCount || 'N'}
                </button>
              </div>
              <div className="stage-controls" style={{ marginLeft: 12 }}>
                <button className="small-btn" onClick={undo} disabled={undoStack.length === 0} title="Desfazer (Ctrl+Z)">
                  ↩
                </button>
                <button className="small-btn" onClick={redo} disabled={redoStack.length === 0} title="Refazer (Ctrl+Shift+Z)">
                  ↪
                </button>
                {selectedElement && (
                  <button className="small-btn" onClick={removeSelected} title="Remover (Delete)" style={{ color: '#DC2626' }}>
                    ✕
                  </button>
                )}
              </div>

              <div className="stage-controls">
                <button className="small-btn" onClick={() => setZoom((value) => Math.max(0.6, value - 0.1))} disabled={!file || zoom <= 0.6}>
                  -
                </button>
                <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                <button className="small-btn" onClick={() => setZoom((value) => Math.min(2.2, value + 0.1))} disabled={!file || zoom >= 2.2}>
                  +
                </button>
                <button className="small-btn" onClick={() => setZoom(1.2)} disabled={!file}>
                  120%
                </button>
              </div>
            </div>

            <div className="stage-scroll">
              {!file ? (
                <div className="empty-stage">
                  <label className="upload-box">
                    <input type="file" accept=".pdf" onChange={handleFileChange} />
                    <div className="upload-title">Selecionar PDF</div>
                    <div className="upload-meta">Arquivo unico, maximo 50MB</div>
                  </label>
                </div>
              ) : (
                <div
                  ref={pageSurfaceRef}
                  className="page-surface"
                  onPointerDown={handleSurfacePointerDown}
                  style={{
                    width: pageSize ? pageSize.width * zoom : undefined,
                    height: pageSize ? pageSize.height * zoom : undefined,
                  }}
                >
                  <canvas ref={canvasRef} />

                  {snapLines.map((line, i) => (
                    <div
                      key={`snap-${i}`}
                      style={{
                        position: 'absolute',
                        pointerEvents: 'none',
                        zIndex: 100,
                        background: '#2563EB',
                        opacity: 0.7,
                        ...(line.orientation === 'v'
                          ? { left: line.position * zoom, top: 0, width: 1, height: '100%' }
                          : { left: 0, top: line.position * zoom, width: '100%', height: 1 }
                        ),
                      }}
                    />
                  ))}

                  {tool === 'edit_text' && currentTextLayerItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="text-layer-hit"
                      title={item.text}
                      onPointerDown={(event) => replaceTextItem(event, item)}
                      style={{
                        left: item.x * zoom,
                        top: item.y * zoom,
                        width: Math.max(6, item.width * zoom),
                        height: Math.max(6, item.height * zoom),
                      }}
                    >
                      {item.text}
                    </button>
                  ))}

                  {currentElements.map((element) => {
                    const isSelected = element.id === selectedId;
                    const style = {
                      left: element.x * zoom,
                      top: element.y * zoom,
                      width: element.width * zoom,
                      height: element.height * zoom,
                    };

                    return (
                      <div
                        key={element.id}
                        className={[
                          'overlay-element',
                          element.kind,
                          element.kind === 'text' ? 'text' : element.kind === 'replace_text' ? 'replace_text' : 'field',
                          isSelected ? 'selected' : '',
                        ].join(' ')}
                        style={style}
                        onPointerDown={(event) => startDrag(event, element.id, 'move')}
                        title={KIND_LABELS[element.kind]}
                      >
                        {(element.kind === 'text' || element.kind === 'replace_text') && (
                          <div
                            style={{
                              fontSize: Math.max(8, element.fontSize * zoom),
                              color: element.color,
                              opacity: element.opacity,
                              textAlign: element.align,
                              lineHeight: 1.2,
                            }}
                          >
                            {element.text}
                          </div>
                        )}
                        {element.kind === 'text_field' && (
                          <div className="field-preview">{element.value || element.label || element.name}</div>
                        )}
                        {element.kind === 'checkbox' && element.checked && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="4">
                            <path d="M5 12l4 4L19 7" />
                          </svg>
                        )}
                        {element.kind === 'radio' && (
                          <div style={{
                            width: Math.max(8, Math.min(element.width, element.height) * zoom * 0.45),
                            height: Math.max(8, Math.min(element.width, element.height) * zoom * 0.45),
                            borderRadius: 999,
                            background: 'rgba(37,99,235,0.2)',
                          }} />
                        )}
                        {element.kind === 'dropdown' && (
                          <div className="field-preview">
                            {splitOptions(element.options)[0] || 'Lista'}
                          </div>
                        )}
                        {element.kind === 'signature' && (
                          <span>{element.label || 'Assinatura'}</span>
                        )}
                        {isSelected && (
                          <button
                            type="button"
                            className="resize-handle"
                            aria-label="Redimensionar"
                            onPointerDown={(event) => startDrag(event, element.id, 'resize')}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="inspector">
            <div className="inspector-header">
              <div className="inspector-title">
                {selectedElement ? KIND_LABELS[selectedElement.kind] : 'Inspetor'}
              </div>
              <div className="inspector-subtitle">
                {selectedElement ? `Pagina ${selectedElement.page}` : `${elements.length} itens no documento`}
              </div>
            </div>

            <div className="inspector-body">
              {error && <div className="status-box error">{error}</div>}
              {sourceTool && (
                <div className="status-box" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-primary)', borderColor: 'var(--accent-primary)', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>↳</span> Recebido de <strong>{sourceTool}</strong>
                </div>
              )}
              {done && <div className="status-box success">PDF editado gerado com sucesso.</div>}
              {done && (
                <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button className="small-btn" onClick={() => sendTo('/comprimir-pdf')} style={{ fontSize: 11, padding: '4px 10px' }}>Comprimir →</button>
                  <button className="small-btn" onClick={() => sendTo('/proteger-pdf')} style={{ fontSize: 11, padding: '4px 10px' }}>Proteger →</button>
                  <button className="small-btn" onClick={() => sendTo('/reordenar-pdf')} style={{ fontSize: 11, padding: '4px 10px' }}>Reordenar →</button>
                  <button className="small-btn" onClick={() => sendTo('/mesclar-pdf')} style={{ fontSize: 11, padding: '4px 10px' }}>Mesclar →</button>
                </div>
              )}

              {!file && (
                <>
                  <label className="action-btn" style={{ width: '100%' }}>
                    Selecionar PDF
                    <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                  <PdfImageCapture onPdfReady={(pdfs) => selectPdfFile(pdfs[0])} />
                </>
              )}

              {file && !selectedElement && (
                <>
                  <div className={hasTextLayer ? 'status-box success' : 'status-box error'}>
                    {!textLayerLoaded
                      ? 'Analisando camada de texto...'
                      : hasTextLayer
                        ? 'Camada de texto detectada. Use Editar texto e clique em uma linha.'
                        : 'Nenhuma camada de texto encontrada. Para PDF escaneado, OCR e necessario antes.'}
                  </div>
                  <div className="control-group">
                    <div className="control-label">Documento</div>
                    <div className="file-chip" style={{ maxWidth: 'none' }}>
                      <strong>{file.name}</strong>
                      <span>{formatBytes(file.size)}</span>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="control-group">
                      <label className="control-label">Paginas</label>
                      <input className="control-input" value={pageCount || ''} readOnly />
                    </div>
                    <div className="control-group">
                      <label className="control-label">Itens</label>
                      <input className="control-input" value={elements.length} readOnly />
                    </div>
                  </div>
                  <button className="action-btn primary" onClick={handleExport} disabled={exporting || elements.length === 0}>
                    Exportar PDF
                  </button>
                </>
              )}

              {selectedElement && (
                <>
                  <div className="grid-2">
                    <div className="control-group">
                      <label className="control-label">X</label>
                      <input
                        className="control-input"
                        type="number"
                        value={Math.round(selectedElement.x)}
                        onChange={(event) => updateSelected({ x: Number(event.target.value) })}
                      />
                    </div>
                    <div className="control-group">
                      <label className="control-label">Y</label>
                      <input
                        className="control-input"
                        type="number"
                        value={Math.round(selectedElement.y)}
                        onChange={(event) => updateSelected({ y: Number(event.target.value) })}
                      />
                    </div>
                    <div className="control-group">
                      <label className="control-label">Largura</label>
                      <input
                        className="control-input"
                        type="number"
                        value={Math.round(selectedElement.width)}
                        onChange={(event) => updateSelected({ width: Number(event.target.value) })}
                      />
                    </div>
                    <div className="control-group">
                      <label className="control-label">Altura</label>
                      <input
                        className="control-input"
                        type="number"
                        value={Math.round(selectedElement.height)}
                        onChange={(event) => updateSelected({ height: Number(event.target.value) })}
                      />
                    </div>
                  </div>

                  {(selectedElement.kind === 'text' || selectedElement.kind === 'replace_text') && (
                    <>
                      {selectedElement.kind === 'replace_text' && (
                        <div className="status-box success">
                          Editando texto existente. O trecho original sera removido da camada do PDF e substituido por este texto.
                        </div>
                      )}
                      <div className="control-group">
                        <label className="control-label">Texto</label>
                        <textarea
                          className="control-textarea"
                          value={selectedElement.text}
                          onChange={(event) => updateSelected({ text: event.target.value })}
                        />
                      </div>
                      <div className="grid-2">
                        <div className="control-group">
                          <label className="control-label">Fonte</label>
                          <input
                            className="control-input"
                            type="number"
                            min={6}
                            max={240}
                            value={selectedElement.fontSize}
                            onChange={(event) => updateSelected({ fontSize: Number(event.target.value) })}
                          />
                        </div>
                        <div className="control-group">
                          <label className="control-label">Cor</label>
                          <input
                            className="control-input"
                            type="color"
                            value={selectedElement.color}
                            onChange={(event) => updateSelected({ color: event.target.value })}
                          />
                        </div>
                      </div>
                      <div className="control-group">
                        <label className="control-label">Alinhamento</label>
                        <div className="segmented">
                          {(['left', 'center', 'right'] as Align[]).map((align) => (
                            <button
                              key={align}
                              className={selectedElement.align === align ? 'active' : ''}
                              onClick={() => updateSelected({ align })}
                            >
                              {align === 'left' ? 'Esq' : align === 'center' ? 'Centro' : 'Dir'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="control-group">
                        <label className="control-label">Opacidade</label>
                        <div className="range-row">
                          <input
                            type="range"
                            min="0.05"
                            max="1"
                            step="0.05"
                            value={selectedElement.opacity}
                            onChange={(event) => updateSelected({ opacity: Number(event.target.value) })}
                          />
                          <input className="control-input" value={`${Math.round(selectedElement.opacity * 100)}%`} readOnly />
                        </div>
                      </div>
                      {selectedElement.kind === 'replace_text' && (
                        <div className="control-group">
                          <label className="control-label">Fundo</label>
                          <input
                            className="control-input"
                            type="color"
                            value={selectedElement.backgroundColor}
                            onChange={(event) => updateSelected({ backgroundColor: event.target.value })}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {selectedElement.kind !== 'text' && selectedElement.kind !== 'replace_text' && (
                    <>
                      <div className="control-group">
                        <label className="control-label">Nome do campo</label>
                        <input
                          className="control-input"
                          value={selectedElement.name}
                          onChange={(event) => updateSelected({ name: event.target.value })}
                        />
                      </div>
                      <div className="control-group">
                        <label className="control-label">Rotulo</label>
                        <input
                          className="control-input"
                          value={selectedElement.label}
                          onChange={(event) => updateSelected({ label: event.target.value })}
                        />
                      </div>
                      {(selectedElement.kind === 'text_field' || selectedElement.kind === 'dropdown') && (
                        <div className="control-group">
                          <label className="control-label">Valor inicial</label>
                          <input
                            className="control-input"
                            value={selectedElement.value}
                            onChange={(event) => updateSelected({ value: event.target.value })}
                          />
                        </div>
                      )}
                      {selectedElement.kind === 'text_field' && (
                        <label className="toggle-row">
                          <input
                            type="checkbox"
                            checked={selectedElement.multiline}
                            onChange={(event) => updateSelected({ multiline: event.target.checked })}
                          />
                          Multilinha
                        </label>
                      )}
                      {selectedElement.kind === 'checkbox' && (
                        <label className="toggle-row">
                          <input
                            type="checkbox"
                            checked={selectedElement.checked}
                            onChange={(event) => updateSelected({ checked: event.target.checked })}
                          />
                          Marcado
                        </label>
                      )}
                      {selectedElement.kind === 'radio' && (
                        <>
                          <div className="control-group">
                            <label className="control-label">Grupo</label>
                            <input
                              className="control-input"
                              value={selectedElement.groupName}
                              onChange={(event) => updateSelected({ groupName: event.target.value })}
                            />
                          </div>
                          <div className="control-group">
                            <label className="control-label">Opcao</label>
                            <input
                              className="control-input"
                              value={selectedElement.option}
                              onChange={(event) => updateSelected({ option: event.target.value })}
                            />
                          </div>
                        </>
                      )}
                      {selectedElement.kind === 'dropdown' && (
                        <div className="control-group">
                          <label className="control-label">Opcoes</label>
                          <textarea
                            className="control-textarea"
                            value={selectedElement.options}
                            onChange={(event) => updateSelected({ options: event.target.value })}
                          />
                        </div>
                      )}
                      <div className="grid-2">
                        <div className="control-group">
                          <label className="control-label">Fonte</label>
                          <input
                            className="control-input"
                            type="number"
                            min={0}
                            max={72}
                            value={selectedElement.fontSize}
                            onChange={(event) => updateSelected({ fontSize: Number(event.target.value) })}
                          />
                        </div>
                        <div className="control-group">
                          <label className="control-label">Cor</label>
                          <input
                            className="control-input"
                            type="color"
                            value={selectedElement.color}
                            onChange={(event) => updateSelected({ color: event.target.value })}
                          />
                        </div>
                      </div>
                      <label className="toggle-row">
                        <input
                          type="checkbox"
                          checked={selectedElement.required}
                          onChange={(event) => updateSelected({ required: event.target.checked })}
                        />
                        Obrigatorio
                      </label>
                    </>
                  )}

                  <div className="inspector-actions">
                    <button className="action-btn" onClick={duplicateSelected}>
                      Duplicar
                    </button>
                    <button className="action-btn danger" onClick={removeSelected}>
                      Remover
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
