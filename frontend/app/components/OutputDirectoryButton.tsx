'use client';

import { useEffect, useState, useRef } from 'react';
import {
  clearOutputDirectory,
  getOutputDirectoryLabel,
  loadSavedOutputDirectory,
  selectOutputDirectory,
  supportsOutputDirectoryPicker,
} from '../lib/api';

export default function OutputDirectoryButton() {
  const [label, setLabel] = useState(() => getOutputDirectoryLabel());
  const [supported, setSupported] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const pickerSupported = supportsOutputDirectoryPicker();
    const frame = window.requestAnimationFrame(() => {
      setSupported(pickerSupported);
      if (!pickerSupported) {
        clearOutputDirectory();
        setLabel('Downloads do navegador');
      }
    });
    const update = () => setLabel(pickerSupported ? getOutputDirectoryLabel() : 'Downloads do navegador');
    void loadSavedOutputDirectory().then((directoryLabel) => {
      if (active) setLabel(pickerSupported ? directoryLabel : 'Downloads do navegador');
    });
    window.addEventListener('output-directory-change', update);

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('output-directory-change', update);
    };
  }, []);

  // Close popover on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const handleOpen = async () => {
    if (supported) {
      try {
        const directory = await selectOutputDirectory();
        setLabel(directory);
        return;
      } catch {
        setLabel(getOutputDirectoryLabel());
      }
    }
    setShowPicker((v) => !v);
  };

  const displayLabel = supported
    ? label
    : 'Downloads';

  const tooltip = supported
    ? 'Selecionar pasta de saida'
    : 'Downloads no computador do usuario';

  return (
    <>
      <style>{`
        .output-dir-wrap { position: relative; display: inline-flex; }
        .output-dir-btn {
          height: 36px;
          max-width: 180px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 11px;
          border: 1px solid var(--nav-border);
          border-radius: 9px;
          background: var(--nav-btn-hover-bg);
          color: var(--nav-text-hover);
          cursor: pointer;
          font: 700 12px 'DM Sans', sans-serif;
          transition: background 0.15s, border-color 0.15s;
        }
        .output-dir-btn:hover {
          border-color: rgba(232,255,71,0.45);
          background: rgba(232,255,71,0.14);
        }
        .output-dir-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
        .output-dir-label {
          min-width: 0; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }

        .odp-popover {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 300px;
          background: var(--card-bg, #1e1e2e);
          border: 1px solid var(--border-light, #374151);
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
          z-index: 200;
          animation: odpIn 0.15s ease;
          overflow: hidden;
        }
        @keyframes odpIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .odp-header {
          padding: 12px 14px 8px;
          font: 700 11px 'DM Sans', sans-serif;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--text-tertiary, #9ca3af);
          border-bottom: 1px solid var(--border-light, #374151);
        }
        .odp-base {
          padding: 4px 14px 8px;
          font: 400 10px 'DM Sans', sans-serif;
          color: var(--text-tertiary, #6b7280);
          word-break: break-all;
        }

        .odp-list {
          max-height: 180px;
          overflow-y: auto;
          padding: 6px;
        }
        .odp-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          font: 500 13px 'DM Sans', sans-serif;
          color: var(--text-secondary, #d1d5db);
          cursor: pointer;
          transition: background 0.1s;
          border: none; background: none; width: 100%;
          text-align: left;
        }
        .odp-item:hover { background: rgba(255,255,255,0.06); }
        .odp-item.active {
          background: rgba(16,185,129,0.12);
          color: #10B981;
          font-weight: 700;
        }
        .odp-item svg { width: 16px; height: 16px; flex-shrink: 0; }

        .odp-create {
          display: flex; gap: 6px;
          padding: 8px 10px;
          border-top: 1px solid var(--border-light, #374151);
        }
        .odp-input {
          flex: 1; min-width: 0;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid var(--border-medium, #4b5563);
          background: var(--bg-tertiary, #111827);
          color: var(--text-primary, #f3f4f6);
          font: 400 12px 'DM Sans', sans-serif;
          outline: none;
        }
        .odp-input:focus { border-color: #10B981; }
        .odp-input::placeholder { color: var(--text-tertiary, #6b7280); }
        .odp-create-btn {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: #10B981;
          color: #fff;
          font: 600 12px 'DM Sans', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .odp-create-btn:hover { background: #34D399; }
        .odp-create-btn:disabled { opacity: 0.5; cursor: default; }

        @media (max-width: 900px) {
          .output-dir-btn { max-width: 150px; }
          .odp-popover { width: 260px; right: -10px; }
        }
      `}</style>
      <div className="output-dir-wrap" ref={popRef}>
        <button
          type="button"
          className="output-dir-btn"
          onClick={handleOpen}
          title={tooltip}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <span className="output-dir-label">{displayLabel}</span>
        </button>

        {showPicker && (
          <div className="odp-popover">
            <div className="odp-header">Downloads no seu computador</div>
            <div className="odp-base">
              Em HTTP, a pasta e controlada pelo navegador. Ative a opcao
              &quot;Perguntar onde salvar cada arquivo&quot; nas configuracoes de downloads
              para escolher uma pasta no PC a cada resultado.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
