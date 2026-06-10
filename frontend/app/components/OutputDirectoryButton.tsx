'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let active = true;
    const frame = window.requestAnimationFrame(() => {
      setSupported(supportsOutputDirectoryPicker());
    });
    const update = () => setLabel(getOutputDirectoryLabel());
    void loadSavedOutputDirectory().then((directoryLabel) => {
      if (active) setLabel(directoryLabel);
    });
    window.addEventListener('output-directory-change', update);
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('output-directory-change', update);
    };
  }, []);

  const chooseDirectory = async () => {
    if (!supported) {
      clearOutputDirectory();
      setLabel(getOutputDirectoryLabel());
      return;
    }

    try {
      const directory = await selectOutputDirectory();
      setLabel(directory);
    } catch {
      setLabel(getOutputDirectoryLabel());
    }
  };

  return (
    <>
      <style>{`
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
        .output-dir-btn svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }
        .output-dir-label {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (max-width: 900px) {
          .output-dir-btn {
            max-width: 150px;
          }
        }
      `}</style>
      <button
        type="button"
        className="output-dir-btn"
        onClick={chooseDirectory}
        title={supported ? 'Selecionar pasta de saida' : 'Saida na pasta padrao do navegador'}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
        <span className="output-dir-label">{label}</span>
      </button>
    </>
  );
}
