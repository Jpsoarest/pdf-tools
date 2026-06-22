'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import {
  canAccessGeneralModule,
  clearSessionUser,
  getAuthHeader,
  normalizeName,
  readSessionUser,
  saveSessionUser,
  type SessionUser,
} from './lib/session';
import { getApiUrl } from './lib/api';

interface ManagedUser {
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export default function Home() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  useEffect(() => {
    setUser(readSessionUser());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!user || !canAccessGeneralModule(user)) return;
    void loadUsers(user);
  }, [user]);

  const loadUsers = async (currentUser: SessionUser) => {
    try {
      const response = await fetch(getApiUrl('/auth/users'), {
        headers: getAuthHeader(currentUser),
      });
      if (!response.ok) return;
      const data = await response.json() as { users?: ManagedUser[] };
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch {}
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeName(name);
    if (normalized.length < 2) {
      setError('Informe pelo menos 2 caracteres.');
      return;
    }
    if (password.length < 4) {
      setError('Informe a senha.');
      return;
    }

    try {
      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalized, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || 'Usuario ou senha invalidos.');
        return;
      }
      const nextUser = data as SessionUser;
      setUser(nextUser);
      saveSessionUser(nextUser);
      setPassword('');
      setError('');
    } catch {
      setError('Nao foi possivel conectar ao servidor de autenticacao.');
    }
  };

  const logout = () => {
    clearSessionUser();
    setUser(null);
    setName('');
    setPassword('');
    setUsers([]);
    setAdminError('');
    setAdminMessage('');
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canAccessGeneralModule(user)) return;

    const normalized = normalizeName(newUserName);
    if (normalized.length < 2) {
      setAdminError('Informe pelo menos 2 caracteres para o usuario.');
      setAdminMessage('');
      return;
    }
    if (newUserPassword.length < 4) {
      setAdminError('A senha deve ter pelo menos 4 caracteres.');
      setAdminMessage('');
      return;
    }

    try {
      const response = await fetch(getApiUrl('/auth/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(user),
        },
        body: JSON.stringify({ username: normalized, password: newUserPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAdminError(data?.detail || 'Nao foi possivel criar o usuario.');
        setAdminMessage('');
        return;
      }
      setNewUserName('');
      setNewUserPassword('');
      setAdminError('');
      setAdminMessage(`Usuario ${normalized} criado.`);
      await loadUsers(user);
    } catch {
      setAdminError('Nao foi possivel conectar ao servidor de autenticacao.');
      setAdminMessage('');
    }
  };

  const canSeeGeneral = canAccessGeneralModule(user);

  return (
    <>
      <style>{`
        .start-root {
          min-height: calc(100vh - 60px);
          background:
            linear-gradient(135deg, rgba(99,102,241,.1), transparent 38%),
            linear-gradient(180deg, var(--bg-primary), var(--bg-tertiary));
          color: var(--text-primary);
          font-family: var(--font-body);
          padding: 54px 24px 72px;
        }
        .start-shell {
          max-width: 1120px;
          margin: 0 auto;
        }
        .start-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }
        .start-kicker {
          color: var(--text-tertiary);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .start-title {
          max-width: 650px;
          margin: 0;
          font: 800 clamp(34px, 6vw, 72px) var(--font-display);
          line-height: .98;
        }
        .start-subtitle {
          max-width: 430px;
          color: var(--text-secondary);
          font-size: 15px;
          line-height: 1.65;
          margin: 0;
        }
        .login-card {
          max-width: 520px;
          border: 1px solid var(--card-border);
          border-radius: 18px;
          background: var(--card-bg);
          box-shadow: var(--shadow-md);
          padding: 24px;
        }
        .login-title {
          margin: 0 0 7px;
          font: 800 24px var(--font-display);
        }
        .login-copy {
          margin: 0 0 18px;
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.55;
        }
        .login-row {
          display: flex;
          gap: 9px;
        }
        .login-input {
          flex: 1;
          min-width: 0;
          border: 1px solid var(--border-medium);
          border-radius: 12px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          padding: 13px 14px;
          font: 600 14px var(--font-body);
          outline: none;
        }
        .login-input:focus {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-glow);
        }
        .login-button, .session-button {
          border-radius: 12px;
          padding: 13px 16px;
          background: var(--accent-primary);
          color: #fff;
          font: 800 14px var(--font-body);
          border: 0;
          cursor: pointer;
          white-space: nowrap;
        }
        .session-button {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border-light);
        }
        .login-error {
          margin-top: 10px;
          color: var(--error);
          font-size: 12px;
          font-weight: 700;
        }
        .admin-panel {
          margin-top: 18px;
          border: 1px solid var(--border-light);
          border-radius: 16px;
          background: var(--card-bg);
          padding: 18px;
          box-shadow: var(--shadow-sm);
        }
        .admin-panel h2 {
          margin: 0 0 6px;
          font: 800 22px var(--font-display);
        }
        .admin-panel p {
          margin: 0 0 14px;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.5;
        }
        .admin-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
          gap: 9px;
          margin-bottom: 14px;
        }
        .admin-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .admin-user-pill {
          border: 1px solid var(--border-light);
          border-radius: 999px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 800;
        }
        .admin-user-pill strong {
          color: var(--text-primary);
        }
        .admin-message {
          margin-bottom: 10px;
          color: var(--success);
          font-size: 12px;
          font-weight: 800;
        }
        .session-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border: 1px solid var(--border-light);
          border-radius: 16px;
          background: var(--card-bg);
          padding: 14px 16px;
          margin-bottom: 18px;
        }
        .session-user {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .session-user strong {
          color: var(--text-primary);
        }
        .module-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
          gap: 14px;
        }
        .module-grid.single-module {
          grid-template-columns: minmax(0, 760px);
        }
        .module-card {
          min-height: 310px;
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          box-shadow: var(--shadow-sm);
          color: var(--text-primary);
          text-decoration: none;
          transition: transform .2s, box-shadow .2s, border-color .2s;
        }
        .module-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
          border-color: var(--accent-primary);
        }
        .module-card.oficio {
          display: grid;
          grid-template-columns: .86fr 1.14fr;
          background: #10263d;
          border-color: rgba(214,163,113,.36);
          color: #fff7ef;
        }
        .module-logo {
          background: #10263d;
          display: grid;
          place-items: center;
          border-right: 1px solid rgba(214,163,113,.22);
        }
        .module-logo img {
          width: min(230px, 76%);
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 20px;
          box-shadow: 0 28px 60px rgba(4,15,27,.42);
        }
        .module-content {
          padding: 30px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
        }
        .module-card.general .module-content {
          min-height: 310px;
          background:
            linear-gradient(135deg, rgba(99,102,241,.1), transparent 48%),
            var(--card-bg);
        }
        .module-eyebrow {
          display: inline-flex;
          width: fit-content;
          border-radius: 999px;
          padding: 6px 11px;
          background: rgba(214,163,113,.15);
          color: #e5bd93;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .module-card.general .module-eyebrow {
          background: var(--accent-glow);
          color: var(--accent-primary);
        }
        .module-name {
          margin: 16px 0 8px;
          font: 800 clamp(25px, 3.5vw, 40px) var(--font-display);
          line-height: 1.02;
        }
        .module-desc {
          max-width: 460px;
          color: inherit;
          opacity: .74;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }
        .module-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .module-chip {
          border-radius: 999px;
          padding: 7px 12px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          font-size: 12px;
          font-weight: 800;
        }
        .module-card.general .module-chip {
          background: var(--bg-tertiary);
          border-color: var(--border-light);
          color: var(--text-secondary);
        }
        .module-enter {
          display: inline-flex;
          width: fit-content;
          margin-top: 18px;
          border-radius: 11px;
          padding: 11px 14px;
          background: #d6a371;
          color: #10263d;
          font-size: 13px;
          font-weight: 900;
        }
        .module-card.general .module-enter {
          background: var(--accent-primary);
          color: white;
        }
        @media (max-width: 840px) {
          .start-root { padding: 34px 16px 54px; }
          .start-top { display: block; }
          .start-subtitle { margin-top: 12px; }
          .login-row { flex-direction: column; }
          .admin-form { grid-template-columns: 1fr; }
          .module-grid { grid-template-columns: 1fr; }
          .module-card.oficio { grid-template-columns: 1fr; }
          .module-logo { min-height: 190px; border-right: 0; border-bottom: 1px solid rgba(214,163,113,.22); }
          .session-bar { align-items: flex-start; flex-direction: column; }
        }
      `}</style>

      <main className="start-root">
        <div className="start-shell">
          <div className="start-top">
            <div>
              <div className="start-kicker">Entrada da aplicacao</div>
              <h1 className="start-title">Entre e escolha seu modulo de trabalho.</h1>
            </div>
            <p className="start-subtitle">
              As preferencias do painel modular ficam salvas para o usuario neste navegador.
            </p>
          </div>

          {!loaded ? null : !user ? (
            <form className="login-card" onSubmit={login}>
              <h2 className="login-title">Login</h2>
              <p className="login-copy">
                Use seu nome ou identificador interno para carregar suas ferramentas preferidas.
              </p>
              <div className="login-row">
                <input
                  className="login-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Maria - balcão"
                  autoFocus
                />
                <input
                  className="login-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Senha"
                  type="password"
                />
                <button className="login-button" type="submit">Entrar</button>
              </div>
              {error && <div className="login-error">{error}</div>}
            </form>
          ) : (
            <>
              <div className="session-bar">
                <div className="session-user">
                  Logado como <strong>{user.name}</strong>. {canSeeGeneral ? 'Escolha o modulo para continuar.' : 'Seu acesso esta liberado para o 4o Oficio.'}
                </div>
                <button className="session-button" onClick={logout} type="button">Trocar usuario</button>
              </div>

              <div className={`module-grid ${!canSeeGeneral ? 'single-module' : ''}`}>
                <Link href="/4oficio" className="module-card oficio">
                  <div className="module-logo">
                    <img src="/logo.png" alt="Logo 4o Oficio de Caxias" />
                  </div>
                  <div className="module-content">
                    <div>
                      <span className="module-eyebrow">Painel modular</span>
                      <h2 className="module-name">4º Ofício de Caxias</h2>
                      <p className="module-desc">
                        Comece com as rotinas essenciais e importe qualquer ferramenta global para este painel.
                      </p>
                    </div>
                    <div>
                      <div className="module-chips">
                        <span className="module-chip">Mesclar</span>
                        <span className="module-chip">Editar</span>
                        <span className="module-chip">Reordenar</span>
                      </div>
                      <span className="module-enter">Acessar 4º Ofício de Caxias</span>
                    </div>
                  </div>
                </Link>

                {canSeeGeneral && (
                  <Link href="/geral" className="module-card general">
                    <div className="module-content">
                      <div>
                        <span className="module-eyebrow">Completo</span>
                        <h2 className="module-name">Ferramentas gerais</h2>
                        <p className="module-desc">
                          Acesse a caixa completa de ferramentas para PDF, imagem, XML e utilidades.
                        </p>
                      </div>
                      <div>
                        <div className="module-chips">
                          <span className="module-chip">PDF</span>
                          <span className="module-chip">Imagem</span>
                          <span className="module-chip">XML</span>
                          <span className="module-chip">Utilidades</span>
                        </div>
                        <span className="module-enter">Acessar geral</span>
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              {canSeeGeneral && (
                <section className="admin-panel">
                  <h2>Usuarios</h2>
                  <p>Crie usuarios comuns. Eles acessam o 4 Oficio e podem montar o proprio painel de ferramentas.</p>
                  <form className="admin-form" onSubmit={createUser}>
                    <input
                      className="login-input"
                      value={newUserName}
                      onChange={(event) => setNewUserName(event.target.value)}
                      placeholder="Novo usuario"
                    />
                    <input
                      className="login-input"
                      value={newUserPassword}
                      onChange={(event) => setNewUserPassword(event.target.value)}
                      placeholder="Senha inicial"
                      type="password"
                    />
                    <button className="login-button" type="submit">Criar usuario</button>
                  </form>
                  {adminError && <div className="login-error">{adminError}</div>}
                  {adminMessage && <div className="admin-message">{adminMessage}</div>}
                  <div className="admin-list">
                    {users.map((item) => (
                      <span className="admin-user-pill" key={item.name}>
                        <strong>{item.name}</strong> - {item.role}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
