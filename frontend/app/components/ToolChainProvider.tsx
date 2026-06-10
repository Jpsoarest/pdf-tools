'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ToolChainFile {
  file: Blob;
  filename: string;
  sourceTool: string;
  sourceToolName: string;
}

interface ToolChainContextType {
  incomingFile: ToolChainFile | null;
  pushFile: (file: ToolChainFile) => void;
  consumeFile: () => ToolChainFile | null;
  clearFile: () => void;
}

const ToolChainContext = createContext<ToolChainContextType>({
  incomingFile: null,
  pushFile: () => {},
  consumeFile: () => null,
  clearFile: () => {},
});

export function useToolChain() {
  return useContext(ToolChainContext);
}

export function ToolChainProvider({ children }: { children: ReactNode }) {
  const [incomingFile, setIncomingFile] = useState<ToolChainFile | null>(null);
  const [mounted, setMounted] = useState(false);

  useState(() => {
    try {
      const saved = sessionStorage.getItem('toolchain-file');
      const savedMeta = sessionStorage.getItem('toolchain-meta');
      if (saved && savedMeta) {
        const meta = JSON.parse(savedMeta);
        const byteString = atob(saved);
        const bytes = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          bytes[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        setIncomingFile({
          file: blob,
          filename: meta.filename,
          sourceTool: meta.sourceTool,
          sourceToolName: meta.sourceToolName,
        });
        sessionStorage.removeItem('toolchain-file');
        sessionStorage.removeItem('toolchain-meta');
      }
    } catch {}
    setMounted(true);
  });

  const pushFile = useCallback((tf: ToolChainFile) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      sessionStorage.setItem('toolchain-file', base64);
      sessionStorage.setItem('toolchain-meta', JSON.stringify({
        filename: tf.filename,
        sourceTool: tf.sourceTool,
        sourceToolName: tf.sourceToolName,
      }));
    };
    reader.readAsDataURL(tf.file);
  }, []);

  const consumeFile = useCallback(() => {
    const f = incomingFile;
    setIncomingFile(null);
    return f;
  }, [incomingFile]);

  const clearFile = useCallback(() => {
    setIncomingFile(null);
    sessionStorage.removeItem('toolchain-file');
    sessionStorage.removeItem('toolchain-meta');
  }, []);

  if (!mounted) return null;

  return (
    <ToolChainContext.Provider value={{ incomingFile, pushFile, consumeFile, clearFile }}>
      {children}
    </ToolChainContext.Provider>
  );
}
