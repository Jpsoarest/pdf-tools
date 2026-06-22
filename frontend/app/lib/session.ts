export interface SessionUser {
  name: string;
  role: 'admin' | 'user';
  loginAt: string;
  token: string;
}

export const SESSION_KEY = 'pdf-tools-session';
export const SESSION_CHANGE_EVENT = 'pdf-tools-session-change';

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function isAdminUser(user: SessionUser | null | undefined) {
  return user?.role === 'admin';
}

export function readSessionUser(): SessionUser | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<SessionUser>;
    if (!parsed.name || !parsed.loginAt || !parsed.token) return null;
    return {
      name: String(parsed.name),
      role: parsed.role === 'admin' ? 'admin' : 'user',
      loginAt: String(parsed.loginAt),
      token: String(parsed.token),
    };
  } catch {
    return null;
  }
}

export function getAuthHeader(user: SessionUser | null | undefined): Record<string, string> {
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
}

export function saveSessionUser(user: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT));
}

export function clearSessionUser() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT));
}

export function canAccessGeneralModule(user: SessionUser | null | undefined) {
  return isAdminUser(user);
}
