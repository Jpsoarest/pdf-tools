'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './Themetoggle'; // Import corrigido
import OutputDirectoryButton from './OutputDirectoryButton';
import {
  canAccessGeneralModule,
  readSessionUser,
  SESSION_CHANGE_EVENT,
  type SessionUser,
} from '../lib/session';
import {
  essentialOficioToolIds,
  getOficioToolPreferenceKey,
  getToolsByIds,
  OFICIO_TOOLS_CHANGE_EVENT,
  type ToolCatalogItem,
} from '../lib/toolCatalog';

interface Tool { name: string; href: string; description: string; }
interface Category { name: string; color: string; tools: Tool[]; }

const categories: Category[] = [
  {
    name: 'PDF', color: '#FF3B30',
    tools: [
      { name: 'Comprimir PDF', href: '/comprimir-pdf', description: 'Reduza o tamanho' },
      { name: 'Mesclar PDFs', href: '/mesclar-pdf', description: 'Junte varios em um' },
      { name: 'Dividir PDF', href: '/dividir-pdf', description: 'Separe paginas' },
      { name: 'PDF para JPG', href: '/pdf-para-jpg', description: 'Converta em imagens' },
      { name: 'Reordenar PDF', href: '/reordenar-pdf', description: 'Mude a ordem das paginas' },
      { name: 'Girar PDF', href: '/girar-pdf', description: 'Rotacione paginas' },
      { name: 'Extrair Paginas', href: '/extrair-paginas', description: 'Selecione paginas' },
      { name: 'Remover Paginas', href: '/remover-paginas-pdf', description: 'Exclua paginas' },
      { name: 'Cortar PDF', href: '/cortar-pdf', description: 'Corte personalizado' },
      { name: 'Proteger PDF', href: '/proteger-pdf', description: 'Adicione senha' },
      { name: 'Remover Senha', href: '/remover-senha-pdf', description: 'Remova protecao' },
      { name: 'Editar PDF', href: '/editar-pdf', description: 'Texto e formularios' },
      { name: 'Marca Dagua', href: '/marca-dagua-pdf', description: 'Texto ou imagem' },
      { name: 'Numerar Paginas', href: '/numerar-paginas-pdf', description: 'Numeracao automatica' },
      { name: 'PDF para Excel', href: '/pdf-para-excel', description: 'Extraia tabelas' },
      { name: 'PDF para Word', href: '/pdf-para-word', description: 'Converta para DOCX' },
      { name: 'Word para PDF', href: '/word-para-pdf', description: 'DOCX para PDF' },
      { name: 'OCR PDF', href: '/ocr-pdf', description: 'Texto de escaneados' },
      { name: 'Metadados PDF', href: '/metadados-pdf', description: 'Leia e edite metadados' },
    ],
  },
  {
    name: 'Imagem', color: '#0A84FF',
    tools: [
      { name: 'Imagem para PDF', href: '/imagem-para-pdf', description: 'Converta em PDF' },
      { name: 'Comprimir Imagem', href: '/comprimir-imagem', description: 'Reduza o tamanho' },
      { name: 'Converter Formato', href: '/converter-imagem', description: 'JPG, PNG, WebP' },
      { name: 'Redimensionar', href: '/redimensionar-imagem', description: 'Altere dimensoes' },
      { name: 'Imagem para Texto', href: '/imagem-para-texto', description: 'OCR de imagens' },
    ],
  },
  {
    name: 'XML', color: '#30D158',
    tools: [
      { name: 'Visualizar XML', href: '/visualizar-xml', description: 'Veja dados da NF-e' },
      { name: 'XML para Excel', href: '/xml-para-excel', description: 'Exporte para planilha' },
      { name: 'Validar XML', href: '/validar-xml', description: 'Verifique estrutura' },
    ],
  },
];

const MAX_OFICIO_DROPDOWN_TOOLS = 12;

function asNavTool(tool: ToolCatalogItem): Tool {
  return {
    name: tool.name,
    href: tool.oficioHref ?? tool.href,
    description: tool.desc,
  };
}

function oficioCategoryFromTools(tools: ToolCatalogItem[]): Category[] {
  const visibleTools = tools.slice(0, MAX_OFICIO_DROPDOWN_TOOLS).map(asNavTool);
  const shouldShowPanelLink = tools.length === 0 || tools.length > MAX_OFICIO_DROPDOWN_TOOLS;

  return [{
    name: '4º Ofício de Caxias',
    color: '#D6A371',
    tools: [
      ...visibleTools,
      ...(shouldShowPanelLink
        ? [{ name: 'Gerenciar painel', href: '/4oficio', description: 'Ver todas as ferramentas ativas' }]
        : []),
    ],
  }];
}

function readOficioTools(user: SessionUser | null): ToolCatalogItem[] {
  if (!user) return getToolsByIds(essentialOficioToolIds);

  try {
    const saved = localStorage.getItem(getOficioToolPreferenceKey(user.name));
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return getToolsByIds(parsed);
    }
  } catch {}

  return getToolsByIds(essentialOficioToolIds);
}

export default function Navbar() {
  const pathname = usePathname();
  const isOficioMode = pathname?.startsWith('/4oficio') ?? false;
  const [user, setUser] = useState<SessionUser | null>(null);
  const [oficioTools, setOficioTools] = useState<ToolCatalogItem[]>(() => getToolsByIds(essentialOficioToolIds));
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const canSeeGeneral = canAccessGeneralModule(user);
  const shouldUseOficioNav = isOficioMode || !canSeeGeneral;
  const activeCategories: Category[] = shouldUseOficioNav ? oficioCategoryFromTools(oficioTools) : categories;

  // Per-item timeout refs so each menu has its own close delay
  const closeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const openMenu = (name: string) => {
    // Cancel any pending close for this item
    if (closeTimers.current[name]) {
      clearTimeout(closeTimers.current[name]);
      delete closeTimers.current[name];
    }
    setActiveMenu(name);
  };

  const scheduleClose = (name: string) => {
    closeTimers.current[name] = setTimeout(() => {
      setActiveMenu(prev => (prev === name ? null : prev));
    }, 120); // 120ms grace window — enough to move the mouse across the gap
  };

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(closeTimers.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const nextUser = readSessionUser();
      setUser(nextUser);
      setOficioTools(readOficioTools(nextUser));
    };
    syncUser();
    window.addEventListener(SESSION_CHANGE_EVENT, syncUser);
    window.addEventListener(OFICIO_TOOLS_CHANGE_EVENT, syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, syncUser);
      window.removeEventListener(OFICIO_TOOLS_CHANGE_EVENT, syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        /* ─── CSS variables for both themes ─── */
        :root {
          --nav-bg: #0A0A0A;
          --nav-border: rgba(255,255,255,0.08);
          --nav-text: rgba(255,255,255,0.65);
          --nav-text-hover: #fff;
          --nav-btn-hover-bg: rgba(255,255,255,0.08);
          --nav-logo-text: #fff;
          --nav-dropdown-bg: #1A1A1A;
          --nav-dropdown-border: rgba(255,255,255,0.1);
          --nav-dropdown-hover: rgba(255,255,255,0.06);
          --nav-link-name: #fff;
          --nav-link-desc: rgba(255,255,255,0.38);
          --nav-shadow: 0 4px 40px rgba(0,0,0,0.5);
          --mobile-bg: #0A0A0A;
          --mobile-cat-bg: rgba(255,255,255,0.04);
          --mobile-cat-border: rgba(255,255,255,0.08);
          --mobile-tool-hover: rgba(255,255,255,0.06);
        }
        [data-theme="light"] {
          --nav-bg: #ffffff;
          --nav-border: rgba(0,0,0,0.08);
          --nav-text: rgba(0,0,0,0.55);
          --nav-text-hover: #0A0A0A;
          --nav-btn-hover-bg: rgba(0,0,0,0.05);
          --nav-logo-text: #0A0A0A;
          --nav-dropdown-bg: #ffffff;
          --nav-dropdown-border: rgba(0,0,0,0.1);
          --nav-dropdown-hover: rgba(0,0,0,0.04);
          --nav-link-name: #0A0A0A;
          --nav-link-desc: rgba(0,0,0,0.4);
          --nav-shadow: 0 4px 40px rgba(0,0,0,0.12);
          --mobile-bg: #ffffff;
          --mobile-cat-bg: rgba(0,0,0,0.03);
          --mobile-cat-border: rgba(0,0,0,0.08);
          --mobile-tool-hover: rgba(0,0,0,0.04);
        }

        .nav-root {
          font-family: 'DM Sans', sans-serif;
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--nav-bg);
          border-bottom: 1px solid var(--nav-border);
          transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .nav-root.scrolled { box-shadow: var(--nav-shadow); }
        .nav-root.oficio-mode {
          --nav-bg: #10263d;
          --nav-border: rgba(214,163,113,0.25);
          --nav-text: rgba(255,255,255,0.72);
          --nav-text-hover: #fff7ef;
          --nav-btn-hover-bg: rgba(214,163,113,0.14);
          --nav-logo-text: #fff7ef;
          --nav-dropdown-bg: #17314a;
          --nav-dropdown-border: rgba(214,163,113,0.28);
          --nav-dropdown-hover: rgba(214,163,113,0.12);
          --nav-link-name: #fff7ef;
          --nav-link-desc: rgba(255,247,239,0.6);
          --nav-shadow: 0 14px 40px rgba(16,38,61,0.28);
          --mobile-bg: #10263d;
          --mobile-cat-bg: rgba(214,163,113,0.1);
          --mobile-cat-border: rgba(214,163,113,0.24);
          --mobile-tool-hover: rgba(214,163,113,0.12);
        }

        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-logo-mark {
          width: 32px; height: 32px;
          background: #E8FF47;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nav-logo-mark svg { width: 17px; height: 17px; color: #0A0A0A; }
        .nav-logo-mark.oficio-mark {
          width: 38px;
          height: 38px;
          padding: 0;
          overflow: hidden;
          background: #10263d;
          border: 1px solid rgba(214,163,113,0.34);
          border-radius: 10px;
        }
        .nav-logo-mark.oficio-mark img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .nav-logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 18px;
          color: var(--nav-logo-text);
          letter-spacing: -0.5px;
          transition: color 0.3s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: min(280px, 38vw);
        }
        .nav-logo-text span { color: #E8FF47; }

        /* Desktop nav */
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          justify-content: center;
        }

        .nav-item {
          position: relative;
        }
        .nav-btn {
          background: none; border: none;
          padding: 8px 13px;
          color: var(--nav-text);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          cursor: pointer;
          display: flex; align-items: center; gap: 5px;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .nav-btn:hover, .nav-btn.active {
          background: var(--nav-btn-hover-bg);
          color: var(--nav-text-hover);
        }
        .nav-btn .chevron {
          width: 14px; height: 14px;
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        .nav-btn.active .chevron { transform: rotate(180deg); }

        .nav-dropdown-bridge {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          height: 10px;
          background: transparent;
        }

        .nav-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 250px;
          background: var(--nav-dropdown-bg);
          border: 1px solid var(--nav-dropdown-border);
          border-radius: 14px;
          padding: 8px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          animation: dropIn 0.15s ease;
          transition: background 0.3s, border-color 0.3s;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-dropdown-link {
          display: block;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.1s;
        }
        .nav-dropdown-link:hover { background: var(--nav-dropdown-hover); }
        .nav-dropdown-link .link-name {
          font-size: 13px; font-weight: 600;
          color: var(--nav-link-name);
          margin-bottom: 2px;
          transition: color 0.3s;
        }
        .nav-dropdown-link .link-desc {
          font-size: 11px;
          color: var(--nav-link-desc);
          transition: color 0.3s;
        }

        /* Right side controls */
        .nav-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .nav-cta {
          background: #E8FF47;
          color: #0A0A0A;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
          white-space: nowrap;
        }
        .nav-cta:hover { background: #f5ff80; transform: translateY(-1px); }

        /* Mobile hamburger */
        .nav-mobile-btn {
          display: none;
          background: none; border: none;
          width: 40px; height: 40px;
          align-items: center; justify-content: center;
          cursor: pointer;
          border-radius: 8px;
          color: var(--nav-text-hover);
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .nav-mobile-btn:hover { background: var(--nav-btn-hover-bg); }
        .nav-mobile-btn svg { width: 22px; height: 22px; }

        /* ── Mobile overlay ── */
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 200;
          background: var(--mobile-bg);
          overflow-y: auto;
          flex-direction: column;
          transition: background 0.3s;
        }
        .mobile-overlay.open { display: flex; }

        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--nav-border);
          flex-shrink: 0;
          gap: 12px;
        }
        .mobile-header-right { display: flex; align-items: center; gap: 10px; }
        .mobile-close {
          background: var(--nav-btn-hover-bg);
          border: none;
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: var(--nav-text-hover);
          transition: background 0.15s;
        }
        .mobile-close:hover { background: rgba(255,59,48,0.12); color: #FF6B6B; }
        .mobile-close svg { width: 18px; height: 18px; }

        .mobile-content { padding: 16px 20px; flex: 1; }

        .mobile-category {
          margin-bottom: 8px;
          border: 1px solid var(--mobile-cat-border);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.3s;
        }
        .mobile-cat-btn {
          width: 100%;
          background: var(--mobile-cat-bg);
          border: none;
          padding: 15px 16px;
          display: flex; align-items: center; justify-content: space-between;
          cursor: pointer;
          color: var(--nav-link-name);
          font-family: 'DM Sans', sans-serif;
          font-weight: 700; font-size: 15px;
          text-align: left;
          transition: background 0.15s, color 0.3s;
        }
        .mobile-cat-btn .cat-left { display: flex; align-items: center; gap: 10px; }
        .mobile-cat-btn .cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .mobile-cat-btn svg { width: 16px; height: 16px; color: var(--nav-link-desc); transition: transform 0.2s; flex-shrink: 0; }
        .mobile-cat-btn.expanded svg { transform: rotate(180deg); }

        .mobile-tools { background: rgba(0,0,0,0.12); padding: 6px; }
        [data-theme="light"] .mobile-tools { background: rgba(0,0,0,0.04); }

        .mobile-tool-link {
          display: block;
          padding: 11px 12px;
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.1s;
        }
        .mobile-tool-link:hover, .mobile-tool-link:active { background: var(--mobile-tool-hover); }
        .mobile-tool-name { font-size: 14px; font-weight: 600; color: var(--nav-link-name); margin-bottom: 2px; transition: color 0.3s; }
        .mobile-tool-desc { font-size: 12px; color: var(--nav-link-desc); transition: color 0.3s; }

        .mobile-footer {
          padding: 16px 20px 32px;
          display: flex; flex-direction: column; gap: 10px;
          flex-shrink: 0;
        }
        .mobile-cta {
          display: block;
          background: #E8FF47;
          color: #0A0A0A;
          text-align: center;
          padding: 15px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700; font-size: 15px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .mobile-cta:hover { background: #f5ff80; }

        /* Theme toggle label row */
        .mobile-theme-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border: 1px solid var(--mobile-cat-border);
          border-radius: 12px;
          background: var(--mobile-cat-bg);
          transition: background 0.3s, border-color 0.3s;
        }
        .mobile-theme-label { font-size: 14px; font-weight: 600; color: var(--nav-link-name); transition: color 0.3s; }

        @media (max-width: 900px) {
          .nav-desktop { display: none; }
          .nav-cta { display: none; }
          .nav-mobile-btn { display: flex; }
          .nav-logo-text { max-width: 52vw; }
        }
      `}</style>

      <nav className={`nav-root ${scrolled ? 'scrolled' : ''} ${shouldUseOficioNav ? 'oficio-mode' : ''}`}>
        <div className="nav-inner">
          {/* Logo */}
          <Link href={shouldUseOficioNav ? '/4oficio' : '/'} className="nav-logo">
            {shouldUseOficioNav ? (
              <div className="nav-logo-mark oficio-mark">
                <img src="/logo.png" alt="4º Ofício de Caxias" />
              </div>
            ) : (
              <div className="nav-logo-mark">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="nav-logo-text">{shouldUseOficioNav ? '4º Ofício de Caxias' : <>PDF<span>Tools</span></>}</span>
          </Link>

          {/* Desktop menu */}
          <div className="nav-desktop">
            {activeCategories.map((cat) => (
              <div
                key={cat.name}
                className="nav-item"
                onMouseEnter={() => openMenu(cat.name)}
                onMouseLeave={() => scheduleClose(cat.name)}
              >
                <button className={`nav-btn ${activeMenu === cat.name ? 'active' : ''}`}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, display: 'inline-block', flexShrink: 0 }} />
                  {cat.name}
                  <svg className="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {activeMenu === cat.name && (
                  <>
                    <div className="nav-dropdown-bridge" />
                    <div className="nav-dropdown">
                      {cat.tools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="nav-dropdown-link"
                          onClick={() => setActiveMenu(null)}
                        >
                          <div className="link-name">{tool.name}</div>
                          <div className="link-desc">{tool.description}</div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Right controls */}
          <div className="nav-controls">
            <OutputDirectoryButton />
            <ThemeToggle />
            <Link href={shouldUseOficioNav ? '/4oficio/mesclar-pdf' : '/comprimir-pdf'} className="nav-cta">
              {shouldUseOficioNav ? 'Mesclar PDFs' : 'Começar grátis'}
            </Link>
            <button
              className="nav-mobile-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-header">
          <Link href={shouldUseOficioNav ? '/4oficio' : '/'} className="nav-logo" onClick={() => setMobileOpen(false)}>
            {shouldUseOficioNav ? (
              <div className="nav-logo-mark oficio-mark">
                <img src="/logo.png" alt="4º Ofício de Caxias" />
              </div>
            ) : (
              <div className="nav-logo-mark">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="nav-logo-text">{shouldUseOficioNav ? '4º Ofício de Caxias' : <>PDF<span>Tools</span></>}</span>
          </Link>
          <div className="mobile-header-right">
            <OutputDirectoryButton />
            <ThemeToggle />
            <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mobile-content">
          {activeCategories.map((cat) => (
            <div key={cat.name} className="mobile-category">
              <button
                className={`mobile-cat-btn ${mobileExpanded === cat.name ? 'expanded' : ''}`}
                onClick={() => setMobileExpanded(mobileExpanded === cat.name ? null : cat.name)}
              >
                <span className="cat-left">
                  <span className="cat-dot" style={{ background: cat.color }} />
                  {cat.name}
                </span>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileExpanded === cat.name && (
                <div className="mobile-tools">
                  {cat.tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="mobile-tool-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      <div className="mobile-tool-name">{tool.name}</div>
                      <div className="mobile-tool-desc">{tool.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mobile-footer">
          <Link href={shouldUseOficioNav ? '/4oficio/mesclar-pdf' : '/comprimir-pdf'} className="mobile-cta" onClick={() => setMobileOpen(false)}>
            {shouldUseOficioNav ? 'Mesclar PDFs' : 'Começar grátis →'}
          </Link>
        </div>
      </div>
    </>
  );
}
