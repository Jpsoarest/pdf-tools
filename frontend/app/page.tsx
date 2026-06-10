'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

const allTools = [
  { name: 'Comprimir PDF', href: '/comprimir-pdf', icon: '📉', desc: 'Reduza ate 80% do tamanho', category: 'PDF', intent: 'comprimir reduzir tamanho diminuir otimizar' },
  { name: 'Mesclar PDFs', href: '/mesclar-pdf', icon: '🔗', desc: 'Una varios arquivos em um so', category: 'PDF', intent: 'mesclar juntar unir combinar concatenar' },
  { name: 'Dividir PDF', href: '/dividir-pdf', icon: '✂️', desc: 'Separe paginas livremente', category: 'PDF', intent: 'dividir separar quebrar partir' },
  { name: 'PDF para JPG', href: '/pdf-para-jpg', icon: '🖼️', desc: 'Converta em alta resolucao', category: 'PDF', intent: 'converter imagem jpg foto' },
  { name: 'PDF para PNG', href: '/pdf-para-png', icon: '🖼️', desc: 'Exporte paginas em PNG transparente', category: 'PDF', intent: 'png imagem transparente converter' },
  { name: 'PDF para WebP', href: '/pdf-para-webp', icon: '🌐', desc: 'Formato leve para web', category: 'PDF', intent: 'webp imagem leve converter' },
  { name: 'Extrair Imagens', href: '/extrair-imagens-pdf', icon: '🖼️', desc: 'Extraia imagens do PDF separadas', category: 'PDF', intent: 'extrair imagens fotos figuras' },
  { name: 'Reordenar PDF', href: '/reordenar-pdf', icon: '🔄', desc: 'Mude a ordem das paginas', category: 'PDF', intent: 'reordenar reorganizar trocar ordem' },
  { name: 'Girar PDF', href: '/girar-pdf', icon: '↩️', desc: 'Rotacione 90, 180 ou 270', category: 'PDF', intent: 'girar rotacionar virar' },
  { name: 'Extrair Paginas', href: '/extrair-paginas', icon: '📤', desc: 'Selecione paginas especificas', category: 'PDF', intent: 'extrair selecionar paginas especificas' },
  { name: 'Remover Paginas', href: '/remover-paginas-pdf', icon: '🗑️', desc: 'Exclua paginas do PDF', category: 'PDF', intent: 'remover excluir deletar apagar paginas' },
  { name: 'Cortar PDF', href: '/cortar-pdf', icon: '✂️', desc: 'Corte livre personalizado', category: 'PDF', intent: 'cortar recortar margem' },
  { name: 'Proteger PDF', href: '/proteger-pdf', icon: '🔐', desc: 'Adicione senha ao PDF', category: 'PDF', intent: 'proteger senha bloquear criptografar' },
  { name: 'Remover Senha', href: '/remover-senha-pdf', icon: '🔓', desc: 'Desbloqueie PDFs protegidos', category: 'PDF', intent: 'remover senha desbloquear destravar' },
  { name: 'Editar PDF', href: '/editar-pdf', icon: 'T', desc: 'Adicione texto e campos', category: 'PDF', intent: 'editar texto modificar alterar formulario campo' },
  { name: 'Marca Dagua', href: '/marca-dagua-pdf', icon: '💧', desc: 'Adicione texto como marca dagua', category: 'PDF', intent: 'marca dagua watermark' },
  { name: 'Numerar Paginas', href: '/numerar-paginas-pdf', icon: '🔢', desc: 'Numeracao automatica', category: 'PDF', intent: 'numerar paginas numeracao' },
  { name: 'PDF para Excel', href: '/pdf-para-excel', icon: '📊', desc: 'Extraia tabelas para planilha', category: 'PDF', intent: 'excel planilha tabela extrair converter' },
  { name: 'PDF para Word', href: '/pdf-para-word', icon: '📝', desc: 'Converta para DOCX editavel', category: 'PDF', intent: 'word docx converter' },
  { name: 'Word para PDF', href: '/word-para-pdf', icon: '📄', desc: 'Converta DOCX em PDF', category: 'PDF', intent: 'word docx converter para pdf' },
  { name: 'OCR PDF', href: '/ocr-pdf', icon: '🔍', desc: 'Extraia texto de PDFs escaneados', category: 'PDF', intent: 'ocr texto escaneado reconhecer' },
  { name: 'Metadados PDF', href: '/metadados-pdf', icon: 'ℹ️', desc: 'Leia e edite metadados', category: 'PDF', intent: 'metadados informacao propriedades' },
  { name: 'Imagem para PDF', href: '/imagem-para-pdf', icon: '🖼️', desc: 'Converta imagens em PDF', category: 'Imagem', intent: 'imagem foto pdf converter' },
  { name: 'Comprimir Imagem', href: '/comprimir-imagem', icon: '🗜️', desc: 'Menos peso, mesma qualidade', category: 'Imagem', intent: 'comprimir imagem foto reduzir' },
  { name: 'Converter Imagem', href: '/converter-imagem', icon: '🔄', desc: 'JPG, PNG, WebP e mais', category: 'Imagem', intent: 'converter imagem formato jpg png webp' },
  { name: 'Redimensionar', href: '/redimensionar-imagem', icon: '📐', desc: 'Ajuste dimensoes precisas', category: 'Imagem', intent: 'redimensionar imagem tamanho dimensao' },
  { name: 'Imagem para Texto', href: '/imagem-para-texto', icon: '📋', desc: 'OCR em imagens', category: 'Imagem', intent: 'imagem texto ocr reconhecer' },
  { name: 'Visualizar XML', href: '/visualizar-xml', icon: '👁️', desc: 'Leia dados da nota fiscal', category: 'XML', intent: 'visualizar xml nota fiscal ver' },
  { name: 'XML para Excel', href: '/xml-para-excel', icon: '📊', desc: 'Exporte NF-e para planilha', category: 'XML', intent: 'xml excel planilha nfe nota fiscal' },
  { name: 'Validar XML', href: '/validar-xml', icon: '✅', desc: 'Verifique a estrutura', category: 'XML', intent: 'validar xml verificar estrutura' },
  { name: 'Gerador de Senha', href: '/gerador-senha', icon: '🔑', desc: 'Senhas seguras e aleatorias', category: 'Utilidades', intent: 'senha password gerador seguro' },
  { name: 'Base64', href: '/base64', icon: '🔣', desc: 'Codifique e decodifique Base64', category: 'Utilidades', intent: 'base64 encode decode codificar decodificar' },
  { name: 'Gerador de Hash', href: '/gerador-hash', icon: '#️⃣', desc: 'MD5, SHA-1, SHA-256, BLAKE2b', category: 'Utilidades', intent: 'hash md5 sha criptografia' },
  { name: 'Gerador de UUID', href: '/gerador-uuid', icon: '🆔', desc: 'UUID v1, v4, v7 em lote', category: 'Utilidades', intent: 'uuid guid identificador unico' },
  { name: 'Formatador JSON', href: '/formatador-json', icon: '{}', desc: 'Formate, minifique e valide JSON', category: 'Utilidades', intent: 'json formatar minificar validar' },
  { name: 'Codificador URL', href: '/codificador-url', icon: '🔗', desc: 'Encode e decode de URLs', category: 'Utilidades', intent: 'url encode decode codificar' },
  { name: 'Lorem Ipsum', href: '/lorem-ipsum', icon: '📝', desc: 'Texto placeholder profissional', category: 'Utilidades', intent: 'lorem ipsum texto placeholder' },
  { name: 'Testador de Regex', href: '/testador-regex', icon: '🔍', desc: 'Teste expressoes regulares', category: 'Utilidades', intent: 'regex expressao regular testar' },
  { name: 'Diff de Texto', href: '/diff-texto', icon: '↔️', desc: 'Compare textos linha a linha', category: 'Utilidades', intent: 'diff comparar texto diferenca' },
  { name: 'Contador de Caracteres', href: '/contador-caracteres', icon: '🔤', desc: 'Palavras, linhas e paragrafos', category: 'Utilidades', intent: 'contar caracteres palavras linhas' },
  { name: 'Reparar PDF', href: '/reparar-pdf', icon: '🔧', desc: 'Recupere PDFs corrompidos', category: 'PDF', intent: 'reparar recuperar pdf corrompido' },
  { name: 'Bookmarks', href: '/bookmarks', icon: '📑', desc: 'Crie e edite marcadores', category: 'PDF', intent: 'bookmarks marcadores indice sumario' },
  { name: 'Simulador Daltonismo', href: '/simulador-daltonismo', icon: '👁️', desc: 'Simule 4 tipos de daltonismo', category: 'Imagem', intent: 'daltonismo cores cegueira simular' },
  { name: 'QR Code', href: '/qr-code', icon: '📱', desc: 'Gere QR Codes em PNG/JPG/WebP', category: 'Utilidades', intent: 'qr code qrcode gerar' },
  { name: 'CSV ↔ JSON', href: '/csv-json', icon: '🔄', desc: 'Converta entre CSV e JSON', category: 'Utilidades', intent: 'csv json converter dados' },
  { name: 'Markdown para PDF', href: '/markdown-para-pdf', icon: '📄', desc: 'Converta .md em PDF profissional', category: 'PDF', intent: 'markdown md pdf converter' },
  { name: 'Renomear Arquivos', href: '/renomear-arquivos', icon: '✏️', desc: 'Renomeie multiplos arquivos em lote', category: 'Utilidades', intent: 'renomear arquivos lote batch' },
  { name: 'Excel para PDF', href: '/excel-para-pdf', icon: '📊', desc: 'Converta planilhas em PDF', category: 'PDF', intent: 'excel planilha xlsx pdf converter' },
  { name: 'PDF para TXT', href: '/pdf-para-txt', icon: '📄', desc: 'Extraia texto puro do PDF', category: 'PDF', intent: 'txt texto extrair pdf converter' },
  { name: 'CPF / CNPJ', href: '/cpf-cnpj', icon: '🪪', desc: 'Valide, formate e gere CPF/CNPJ', category: 'Utilidades', intent: 'cpf cnpj validar formatar gerar' },
  { name: 'Redigir PDF', href: '/redigir-pdf', icon: '🖊️', desc: 'Remova dados sensiveis do PDF', category: 'PDF', intent: 'redigir remover censurar dados sensiveis' },
  { name: 'Comparar PDFs', href: '/comparar-pdfs', icon: '↔️', desc: 'Compare dois PDFs pagina a pagina', category: 'PDF', intent: 'comparar diff diferenca pdfs' },
  { name: 'Buscar em PDFs', href: '/buscar-pdfs', icon: '🔎', desc: 'Pesquise em multiplos PDFs', category: 'PDF', intent: 'buscar pesquisar procurar pdfs multiplos' },
];

const categories = [
  { name: 'PDF', accent: '#6366F1', bg: '#EEF2FF', dbg: '#1E1E3F' },
  { name: 'Imagem', accent: '#8B5CF6', bg: '#F5F3FF', dbg: '#1E1E3F' },
  { name: 'XML', accent: '#10B981', bg: '#ECFDF5', dbg: '#0F2B1A' },
  { name: 'Utilidades', accent: '#F59E0B', bg: '#FFFBEB', dbg: '#2D1F00' },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentTools, setRecentTools] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [detectedFile, setDetectedFile] = useState<{ name: string; type: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pdf-tools-recent');
      if (saved) setRecentTools(JSON.parse(saved));
    } catch {}
  }, []);

  const saveRecent = (href: string) => {
    try {
      const updated = [href, ...recentTools.filter((h) => h !== href)].slice(0, 6);
      setRecentTools(updated);
      localStorage.setItem('pdf-tools-recent', JSON.stringify(updated));
    } catch {}
  };

  const filteredTools = search.trim()
    ? allTools.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.desc.toLowerCase().includes(search.toLowerCase()) ||
          t.intent.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const recentToolList = recentTools
    .map((href) => allTools.find((t) => t.href === href))
    .filter(Boolean) as typeof allTools;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearch('');
      }
      if (e.key === '/' && !searchOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  const detectFileType = (name: string) => {
    const ext = name.toLowerCase().split('.').pop();
    if (ext === 'pdf') return { type: 'PDF', suggestions: ['/comprimir-pdf', '/editar-pdf', '/mesclar-pdf'] };
    if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext || '')) return { type: 'Imagem', suggestions: ['/comprimir-imagem', '/converter-imagem', '/imagem-para-pdf'] };
    if (ext === 'xml') return { type: 'XML', suggestions: ['/visualizar-xml', '/xml-para-excel', '/validar-xml'] };
    if (['docx', 'doc'].includes(ext || '')) return { type: 'Word', suggestions: ['/word-para-pdf'] };
    if (['xlsx', 'xls'].includes(ext || '')) return { type: 'Excel', suggestions: [] };
    return null;
  };

  const handleFileDrop = (file: File) => {
    const info = detectFileType(file.name);
    if (info) setDetectedFile({ name: file.name, type: info.type });
  };

  return (
    <>
      <style>{`
        .home2-root {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-body);
        }

        .h2-hero {
          max-width: 960px;
          margin: 0 auto;
          padding: 80px 24px 60px;
          text-align: center;
        }

        .h2-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent-glow);
          border: 1px solid var(--border-light);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-primary);
          margin-bottom: 28px;
          backdrop-filter: blur(4px);
        }

        .h2-badge-dot {
          width: 6px;
          height: 6px;
          background: var(--accent-primary);
          border-radius: 50%;
          animation: h2-pulse 2s infinite;
        }
        @keyframes h2-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .h2-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(36px, 7vw, 72px);
          line-height: 1.0;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin: 0 0 16px;
        }
        .h2-title .gradient-text {
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .h2-sub {
          font-size: clamp(15px, 1.8vw, 18px);
          color: var(--text-secondary);
          max-width: 520px;
          margin: 0 auto 36px;
          line-height: 1.6;
        }

        .h2-search-wrap {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }
        .h2-search {
          width: 100%;
          background: var(--bg-elevated);
          border: 1.5px solid var(--border-medium);
          border-radius: 16px;
          padding: 14px 20px 14px 48px;
          font-size: 16px;
          color: var(--text-primary);
          font-family: var(--font-body);
          outline: none;
          transition: all 0.2s;
          box-shadow: var(--shadow-sm);
        }
        .h2-search:focus {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-glow), var(--shadow-md);
        }
        .h2-search::placeholder {
          color: var(--text-tertiary);
        }
        .h2-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          font-size: 18px;
          pointer-events: none;
        }
        .h2-search-kbd {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 6px;
          padding: 2px 8px;
          font-size: 11px;
          color: var(--text-tertiary);
          font-family: var(--font-body);
          pointer-events: none;
        }

        .h2-results {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          box-shadow: var(--shadow-xl);
          max-height: 420px;
          overflow-y: auto;
          z-index: 100;
          display: none;
        }
        .h2-results.open {
          display: block;
        }
        .h2-result-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          text-decoration: none;
          color: var(--text-primary);
          transition: background 0.1s;
          cursor: pointer;
        }
        .h2-result-item:hover, .h2-result-item.active {
          background: var(--bg-tertiary);
        }
        .h2-result-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          background: var(--bg-tertiary);
          flex-shrink: 0;
        }
        .h2-result-info {
          flex: 1;
          min-width: 0;
        }
        .h2-result-name {
          font-size: 14px;
          font-weight: 600;
        }
        .h2-result-desc {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .h2-result-cat {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 100px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .h2-result-empty {
          padding: 24px;
          text-align: center;
          color: var(--text-tertiary);
          font-size: 14px;
        }

        .h2-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .h2-section-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .h2-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-light);
        }

        .h2-recent-grid {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }
        .h2-recent-chip {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 100px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .h2-recent-chip:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background: var(--accent-glow);
        }
        .h2-recent-none {
          font-size: 13px;
          color: var(--text-tertiary);
          padding: 8px 0;
        }

        .h2-upload-zone {
          max-width: 600px;
          margin: 0 auto 48px;
          border: 2px dashed var(--border-medium);
          border-radius: 16px;
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s;
          background: var(--bg-secondary);
        }
        .h2-upload-zone:hover, .h2-upload-zone.dragover {
          border-color: var(--accent-primary);
          background: var(--accent-glow);
        }
        .h2-upload-icon { font-size: 32px; margin-bottom: 12px; }
        .h2-upload-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
        .h2-upload-hint { font-size: 13px; color: var(--text-tertiary); }

        .h2-detected {
          max-width: 600px;
          margin: 0 auto 48px;
          background: var(--bg-secondary);
          border: 1px solid var(--accent-primary);
          border-radius: 14px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .h2-detected-icon {
          font-size: 28px;
        }
        .h2-detected-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .h2-detected-type {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .h2-detected-suggestions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .h2-detected-sugg {
          background: var(--accent-primary);
          color: white;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s;
        }
        .h2-detected-sugg:hover {
          filter: brightness(1.1);
        }

        .h2-categ-block {
          margin-bottom: 56px;
        }
        .h2-cat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .h2-cat-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .h2-cat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-primary);
        }
        .h2-cat-count {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-tertiary);
          background: var(--bg-tertiary);
          padding: 3px 10px;
          border-radius: 100px;
        }

        .h2-tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .h2-tool-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          padding: 20px 16px;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.25s;
          box-shadow: var(--shadow-sm);
        }
        .h2-tool-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--accent-primary);
        }
        .h2-tool-icon {
          font-size: 22px;
          line-height: 1;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--tool-icon-bg);
          border-radius: 10px;
        }
        .h2-tool-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .h2-tool-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .h2-highlight-box {
          max-width: 1200px;
          margin: 0 auto 56px;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .h2-hl-card {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 20px;
          padding: 32px;
          text-decoration: none;
          color: white;
          transition: all 0.25s;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: var(--shadow-lg);
        }
        .h2-hl-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-xl);
        }
        .h2-hl-icon {
          font-size: 40px;
          flex-shrink: 0;
        }
        .h2-hl-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .h2-hl-desc {
          font-size: 13px;
          opacity: 0.85;
        }

        .h2-footer {
          border-top: 1px solid var(--border-light);
          padding: 32px 24px;
        }
        .h2-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .h2-footer-copy {
          font-size: 13px;
          color: var(--text-tertiary);
        }
        .h2-footer-links {
          display: flex;
          gap: 24px;
        }
        .h2-footer-links a {
          font-size: 13px;
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .h2-footer-links a:hover { color: var(--text-primary); }

        @media (max-width: 768px) {
          .h2-hero { padding: 48px 16px 40px; }
          .h2-highlight-box { grid-template-columns: 1fr; }
          .h2-tools-grid { grid-template-columns: repeat(2, 1fr); }
          .h2-search-kbd { display: none; }
        }
        @media (max-width: 480px) {
          .h2-tools-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Global search overlay */}
      {searchOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex',
            alignItems: 'flex-start', justifyContent: 'center', paddingTop: '20vh',
          }}
          onClick={() => { setSearchOpen(false); setSearch(''); }}
        >
          <div
            style={{ width: '100%', maxWidth: 560, margin: '0 16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={searchInputRef}
              className="h2-search"
              placeholder="Buscar ferramenta ou intencao..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--accent-primary)' }}
            />
            {search.trim() && (
              <div className={`h2-results open`} style={{ position: 'relative', marginTop: 8 }}>
                {filteredTools.length > 0 ? filteredTools.map((t, i) => (
                  <Link
                    key={i}
                    href={t.href}
                    className="h2-result-item"
                    onClick={() => { setSearchOpen(false); setSearch(''); saveRecent(t.href); }}
                  >
                    <div className="h2-result-icon">{t.icon}</div>
                    <div className="h2-result-info">
                      <div className="h2-result-name">{t.name}</div>
                      <div className="h2-result-desc">{t.desc}</div>
                    </div>
                    <span className="h2-result-cat" style={{
                      background: t.category === 'PDF' ? 'rgba(99,102,241,0.15)' : t.category === 'Imagem' ? 'rgba(139,92,246,0.15)' : t.category === 'Utilidades' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                      color: t.category === 'PDF' ? '#6366F1' : t.category === 'Imagem' ? '#8B5CF6' : t.category === 'Utilidades' ? '#F59E0B' : '#10B981',
                    }}>{t.category}</span>
                  </Link>
                )) : (
                  <div className="h2-result-empty">Nenhuma ferramenta encontrada</div>
                )}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
              Esc para fechar · use setas para navegar
            </div>
          </div>
        </div>
      )}

      <div className="home2-root">
        <section className="h2-hero">
          <div className="h2-badge">
            <span className="h2-badge-dot" />
            100% gratuito · Sem cadastro · Privado
          </div>
          <h1 className="h2-title">
            Seus documentos.<br />
            <span className="gradient-text">Resolvidos em segundos.</span>
          </h1>
          <p className="h2-sub">
            Comprima, edite, converta e organize PDFs, imagens e XMLs.
            Direto no navegador, sem limites e sem complicacao.
          </p>

          <div className="h2-search-wrap">
            <span className="h2-search-icon">🔍</span>
            <input
              className="h2-search"
              placeholder="'comprimir pdf' · 'assinar contrato' · 'xml para planilha'"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
            />
            <span className="h2-search-kbd">Ctrl+K</span>

            {search.trim() && (
              <div className={`h2-results open`}>
                {filteredTools.length > 0 ? filteredTools.map((t, i) => (
                  <Link
                    key={i}
                    href={t.href}
                    className="h2-result-item"
                    onClick={() => { setSearch(''); saveRecent(t.href); }}
                  >
                    <div className="h2-result-icon">{t.icon}</div>
                    <div className="h2-result-info">
                      <div className="h2-result-name">{t.name}</div>
                      <div className="h2-result-desc">{t.desc}</div>
                    </div>
                  </Link>
                )) : (
                  <div className="h2-result-empty">Nenhuma ferramenta encontrada para &quot;{search}&quot;</div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="h2-section">
          {recentToolList.length > 0 && (
            <>
              <div className="h2-section-title">Usadas recentemente</div>
              <div className="h2-recent-grid">
                {recentToolList.map((t, i) => (
                  <Link key={i} href={t.href} className="h2-recent-chip" onClick={() => saveRecent(t.href)}>
                    {t.icon} {t.name}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Universal upload */}
          <div
            className={`h2-upload-zone ${dragOver ? 'dragover' : ''}`}
            onClick={() => uploadInputRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileDrop(file);
            }}
          >
            <input
              ref={uploadInputRef}
              type="file"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }}
              style={{ display: 'none' }}
            />
            <div className="h2-upload-icon">📤</div>
            <div className="h2-upload-title">Solte um arquivo aqui</div>
            <div className="h2-upload-hint">Detectamos o tipo e sugerimos ferramentas</div>
          </div>

          {detectedFile && (
            <div className="h2-detected">
              <div className="h2-detected-icon">
                {detectedFile.type === 'PDF' ? '📄' : detectedFile.type === 'Imagem' ? '🖼️' : detectedFile.type === 'XML' ? '📋' : '📁'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="h2-detected-name">{detectedFile.name}</div>
                <div className="h2-detected-type">Arquivo detectado como {detectedFile.type}</div>
                <div className="h2-detected-suggestions">
                  {detectedFile.type === 'PDF' && (
                    <>
                      <Link href="/comprimir-pdf" className="h2-detected-sugg">Comprimir</Link>
                      <Link href="/editar-pdf" className="h2-detected-sugg">Editar</Link>
                      <Link href="/mesclar-pdf" className="h2-detected-sugg">Mesclar</Link>
                    </>
                  )}
                  {detectedFile.type === 'Imagem' && (
                    <>
                      <Link href="/comprimir-imagem" className="h2-detected-sugg">Comprimir</Link>
                      <Link href="/converter-imagem" className="h2-detected-sugg">Converter</Link>
                      <Link href="/imagem-para-pdf" className="h2-detected-sugg">Para PDF</Link>
                    </>
                  )}
                  {detectedFile.type === 'XML' && (
                    <>
                      <Link href="/visualizar-xml" className="h2-detected-sugg">Visualizar</Link>
                      <Link href="/xml-para-excel" className="h2-detected-sugg">Para Excel</Link>
                      <Link href="/validar-xml" className="h2-detected-sugg">Validar</Link>
                    </>
                  )}
                  {detectedFile.type === 'Word' && (
                    <Link href="/word-para-pdf" className="h2-detected-sugg">Para PDF</Link>
                  )}
                </div>
              </div>
              <button
                onClick={() => setDetectedFile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 18 }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="h2-highlight-box">
          <Link href="/editar-pdf" className="h2-hl-card">
            <div className="h2-hl-icon">T</div>
            <div>
              <div className="h2-hl-title">Editar PDF</div>
              <div className="h2-hl-desc">Adicione texto, formularios e assinaturas</div>
            </div>
          </Link>
          <Link href="/comprimir-pdf" className="h2-hl-card">
            <div className="h2-hl-icon">📉</div>
            <div>
              <div className="h2-hl-title">Comprimir PDF</div>
              <div className="h2-hl-desc">Reduza ate 80% sem perder qualidade</div>
            </div>
          </Link>
        </div>

        <div className="h2-section">
          {categories.map((cat) => {
            const catTools = allTools.filter((t) => t.category === cat.name);
            return (
              <div key={cat.name} className="h2-categ-block">
                <div className="h2-cat-header">
                  <div className="h2-cat-name">
                    <span className="h2-cat-dot" style={{ background: cat.accent }} />
                    {cat.name}
                  </div>
                  <span className="h2-cat-count">{catTools.length} ferramentas</span>
                </div>
                <div className="h2-tools-grid">
                  {catTools.map((tool) => (
                    <Link key={tool.href} href={tool.href} className="h2-tool-card" onClick={() => saveRecent(tool.href)}>
                      <div className="h2-tool-icon">{tool.icon}</div>
                      <div className="h2-tool-name">{tool.name}</div>
                      <div className="h2-tool-desc">{tool.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="h2-footer">
          <div className="h2-footer-inner">
            <span className="h2-footer-copy">PDF Tools · 2025 · Gratuito e privado</span>
            <div className="h2-footer-links">
              <a href="#">Privacidade</a>
              <a href="#">Termos</a>
              <a href="#">Contato</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
