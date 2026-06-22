'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { readSessionUser, type SessionUser } from '../lib/session';
import {
  essentialOficioToolIds,
  getOficioToolPreferenceKey,
  getToolsByIds,
  OFICIO_TOOLS_CHANGE_EVENT,
  toolCatalog,
} from '../lib/toolCatalog';

export default function OficioHome() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [toolIds, setToolIds] = useState<string[]>(essentialOficioToolIds);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const parsed = readSessionUser();
      if (parsed) {
        setUser(parsed);
        const savedTools = localStorage.getItem(getOficioToolPreferenceKey(parsed.name));
        if (savedTools) {
          const parsedTools = JSON.parse(savedTools);
          if (Array.isArray(parsedTools)) setToolIds(parsedTools);
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!user || !loaded) return;
    localStorage.setItem(getOficioToolPreferenceKey(user.name), JSON.stringify(toolIds));
    window.dispatchEvent(new CustomEvent(OFICIO_TOOLS_CHANGE_EVENT));
  }, [loaded, toolIds, user]);

  const selectedTools = useMemo(() => getToolsByIds(toolIds), [toolIds]);
  const availableTools = useMemo(() => {
    const selected = new Set(toolIds);
    const normalized = query.trim().toLowerCase();
    return toolCatalog.filter((tool) => {
      if (selected.has(tool.id)) return false;
      if (category !== 'Todas' && tool.category !== category) return false;
      if (!normalized) return true;
      return `${tool.name} ${tool.desc} ${tool.category}`.toLowerCase().includes(normalized);
    });
  }, [category, query, toolIds]);

  const addTool = (id: string) => {
    setToolIds((current) => current.includes(id) ? current : [...current, id]);
  };

  const removeTool = (id: string) => {
    setToolIds((current) => current.filter((item) => item !== id));
  };

  const restoreEssentials = () => {
    setToolIds(essentialOficioToolIds);
    setQuery('');
    setCategory('Todas');
  };

  return (
    <>
      <style>{`
        .oficio-home {
          min-height: 100vh;
          background:
            linear-gradient(180deg, #10263d 0, #10263d 380px, #f7f3ee 380px),
            #f7f3ee;
          color: #10263d;
          font-family: var(--font-body);
        }
        .oficio-shell {
          max-width: 1180px;
          margin: 0 auto;
          padding: 44px 24px 70px;
        }
        .oficio-hero {
          color: #fff7ef;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 230px;
          gap: 26px;
          align-items: center;
          margin-bottom: 28px;
        }
        .oficio-logo-card {
          width: 230px;
          aspect-ratio: 1;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(214,163,113,.34);
          box-shadow: 0 32px 70px rgba(4,15,27,.38);
        }
        .oficio-logo-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .oficio-kicker {
          display: inline-flex;
          border: 1px solid rgba(214,163,113,.34);
          border-radius: 999px;
          padding: 7px 12px;
          color: #e5bd93;
          background: rgba(214,163,113,.12);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .oficio-title {
          font: 800 clamp(34px, 6vw, 68px) var(--font-display);
          line-height: .96;
          margin: 0 0 14px;
        }
        .oficio-subtitle {
          max-width: 720px;
          color: rgba(255,247,239,.76);
          font-size: 15px;
          line-height: 1.65;
          margin: 0;
        }
        .login-required {
          border: 1px solid rgba(214,163,113,.34);
          border-radius: 18px;
          background: #fffaf4;
          padding: 24px;
          box-shadow: 0 18px 48px rgba(16,38,61,.12);
          max-width: 560px;
        }
        .login-required h2 {
          margin: 0 0 8px;
          font: 800 25px var(--font-display);
        }
        .login-required p {
          margin: 0 0 18px;
          color: #526476;
          line-height: 1.55;
          font-size: 14px;
        }
        .primary-link {
          display: inline-flex;
          border-radius: 11px;
          padding: 11px 14px;
          background: #c58f5f;
          color: #10263d;
          font-size: 13px;
          font-weight: 900;
        }
        .panel-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 16px;
          align-items: start;
        }
        .panel-card {
          border: 1px solid rgba(16,38,61,.12);
          border-radius: 18px;
          background: #fffaf4;
          box-shadow: 0 18px 48px rgba(16,38,61,.1);
          padding: 20px;
        }
        .panel-head {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .panel-title {
          margin: 0 0 4px;
          font: 800 22px var(--font-display);
        }
        .panel-desc {
          margin: 0;
          color: #526476;
          font-size: 13px;
          line-height: 1.45;
        }
        .ghost-button {
          border: 1px solid rgba(16,38,61,.14);
          border-radius: 10px;
          background: #f7f3ee;
          color: #405467;
          padding: 9px 11px;
          font: 800 12px var(--font-body);
          white-space: nowrap;
        }
        .tool-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 10px;
        }
        .tool-card {
          min-height: 168px;
          border: 1px solid rgba(16,38,61,.12);
          border-radius: 14px;
          background: #ffffff;
          color: #10263d;
          padding: 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          transition: transform .18s, border-color .18s, box-shadow .18s;
        }
        .tool-card:hover {
          transform: translateY(-2px);
          border-color: rgba(197,143,95,.52);
          box-shadow: 0 12px 28px rgba(16,38,61,.1);
        }
        .tool-top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .tool-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #10263d;
          color: #d6a371;
          font: 900 12px var(--font-display);
          flex: none;
        }
        .tool-name {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 900;
          line-height: 1.2;
        }
        .tool-desc {
          margin: 0;
          color: #647383;
          font-size: 12px;
          line-height: 1.45;
        }
        .tool-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .tool-open {
          flex: 1;
          text-align: center;
          border-radius: 10px;
          padding: 9px 10px;
          background: #c58f5f;
          color: #10263d;
          font-size: 12px;
          font-weight: 900;
        }
        .tool-remove, .tool-add {
          border-radius: 10px;
          padding: 9px 10px;
          border: 1px solid rgba(16,38,61,.13);
          background: #f7f3ee;
          color: #405467;
          font-size: 12px;
          font-weight: 900;
        }
        .tool-add {
          width: 100%;
          background: #10263d;
          color: #fff7ef;
          border-color: #10263d;
        }
        .catalog-controls {
          display: grid;
          gap: 9px;
          margin-bottom: 13px;
        }
        .catalog-input, .catalog-select {
          width: 100%;
          border: 1px solid rgba(16,38,61,.18);
          border-radius: 11px;
          background: #fff;
          color: #10263d;
          padding: 11px 12px;
          font: 700 13px var(--font-body);
          outline: none;
        }
        .catalog-list {
          display: grid;
          gap: 8px;
          max-height: 590px;
          overflow: auto;
          padding-right: 2px;
        }
        .catalog-item {
          border: 1px solid rgba(16,38,61,.1);
          border-radius: 13px;
          background: #fff;
          padding: 12px;
        }
        .catalog-meta {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 10px;
        }
        .category-pill {
          display: inline-flex;
          margin-top: 6px;
          border-radius: 999px;
          padding: 3px 8px;
          background: rgba(197,143,95,.12);
          color: #8c623c;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .5px;
        }
        .empty-state {
          border: 1px dashed rgba(16,38,61,.22);
          border-radius: 14px;
          padding: 24px;
          color: #647383;
          text-align: center;
          font-size: 13px;
          line-height: 1.5;
        }
        @media (max-width: 960px) {
          .oficio-shell { padding: 34px 16px 56px; }
          .oficio-hero { grid-template-columns: 1fr; }
          .oficio-logo-card { width: min(210px, 72vw); }
          .panel-grid { grid-template-columns: 1fr; }
          .catalog-list { max-height: none; }
        }
      `}</style>

      <main className="oficio-home">
        <div className="oficio-shell">
          <section className="oficio-hero">
            <div>
              <span className="oficio-kicker">Painel modular</span>
              <h1 className="oficio-title">4º Ofício de Caxias</h1>
              <p className="oficio-subtitle">
                Personalize o painel com as ferramentas globais que fazem sentido para a rotina do cartorio.
                O conjunto escolhido fica salvo para o usuario logado.
              </p>
            </div>
            <div className="oficio-logo-card">
              <img src="/logo.png" alt="Logo 4º Oficio de Caxias" />
            </div>
          </section>

          {!loaded ? null : !user ? (
            <section className="login-required">
              <h2>Login necessario</h2>
              <p>Entre pela tela inicial para carregar e salvar o painel de ferramentas do usuario.</p>
              <Link className="primary-link" href="/">Ir para login</Link>
            </section>
          ) : (
            <section className="panel-grid">
              <div className="panel-card">
                <div className="panel-head">
                  <div>
                    <h2 className="panel-title">Meu painel</h2>
                    <p className="panel-desc">
                      {user.name} tem {selectedTools.length} ferramenta{selectedTools.length === 1 ? '' : 's'} ativa{selectedTools.length === 1 ? '' : 's'} neste modulo.
                    </p>
                  </div>
                  <button type="button" className="ghost-button" onClick={restoreEssentials}>
                    Restaurar essenciais
                  </button>
                </div>

                {selectedTools.length === 0 ? (
                  <div className="empty-state">
                    Nenhuma ferramenta no painel. Use o catalogo ao lado para importar ferramentas globais.
                  </div>
                ) : (
                  <div className="tool-grid">
                    {selectedTools.map((tool) => (
                      <article key={tool.id} className="tool-card">
                        <div className="tool-top">
                          <div className="tool-icon">{tool.icon}</div>
                          <div>
                            <h3 className="tool-name">{tool.name}</h3>
                            <p className="tool-desc">{tool.desc}</p>
                          </div>
                        </div>
                        <div className="tool-actions">
                          <Link className="tool-open" href={tool.oficioHref ?? tool.href}>Abrir</Link>
                          <button className="tool-remove" type="button" onClick={() => removeTool(tool.id)}>Excluir</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <aside className="panel-card">
                <div className="panel-head">
                  <div>
                    <h2 className="panel-title">Importar globais</h2>
                    <p className="panel-desc">Adicione qualquer ferramenta da aplicacao principal.</p>
                  </div>
                </div>
                <div className="catalog-controls">
                  <input
                    className="catalog-input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar ferramenta"
                  />
                  <select className="catalog-select" value={category} onChange={(event) => setCategory(event.target.value)}>
                    {['Todas', 'PDF', 'Imagem', 'XML', 'Utilidades'].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="catalog-list">
                  {availableTools.length === 0 ? (
                    <div className="empty-state">Nenhuma ferramenta disponivel com estes filtros.</div>
                  ) : availableTools.map((tool) => (
                    <article key={tool.id} className="catalog-item">
                      <div className="catalog-meta">
                        <div className="tool-icon">{tool.icon}</div>
                        <div>
                          <h3 className="tool-name">{tool.name}</h3>
                          <p className="tool-desc">{tool.desc}</p>
                          <span className="category-pill">{tool.category}</span>
                        </div>
                      </div>
                      <button className="tool-add" type="button" onClick={() => addTool(tool.id)}>
                        Adicionar ao painel
                      </button>
                    </article>
                  ))}
                </div>
              </aside>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
