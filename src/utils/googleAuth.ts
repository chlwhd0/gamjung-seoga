export interface AdminUser {
  email: string;
  name: string;
  picture?: string;
  sub: string;
  loginAt: string;
}

export const MASTER_ADMIN_EMAIL = 'hitodays@gmail.com';

const SESSION_KEY = 'gamjung_seoga_admin_google_session_v1';
const WHITELIST_KEY = 'gamjung_seoga_admin_whitelist_v1';
const CLIENT_ID_KEY = 'gamjung_seoga_google_client_id_v1';

export function loadAllowedAdmins(): string[] {
  try {
    const raw = localStorage.getItem(WHITELIST_KEY);
    if (!raw) return [MASTER_ADMIN_EMAIL];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    if (!list.includes(MASTER_ADMIN_EMAIL)) {
      list.unshift(MASTER_ADMIN_EMAIL);
    }
    return list;
  } catch {
    return [MASTER_ADMIN_EMAIL];
  }
}

export function saveAllowedAdmins(emails: string[]): void {
  try {
    const cleaned = Array.from(new Set(emails.map(e => e.trim().toLowerCase()))).filter(Boolean);
    if (!cleaned.includes(MASTER_ADMIN_EMAIL)) {
      cleaned.unshift(MASTER_ADMIN_EMAIL);
    }
    localStorage.setItem(WHITELIST_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore
  }
}

export function isAuthorizedAdmin(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const allowed = loadAllowedAdmins().map(e => e.trim().toLowerCase());
  return allowed.includes(normalized);
}

export function loadAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user: AdminUser = JSON.parse(raw);
    if (user && isAuthorizedAdmin(user.email)) {
      return user;
    }
    clearAdminSession();
    return null;
  } catch {
    return null;
  }
}

export function saveAdminSession(user: AdminUser): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearAdminSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function loadGoogleClientId(): string {
  try {
    return localStorage.getItem(CLIENT_ID_KEY) || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  } catch {
    return '';
  }
}

export function saveGoogleClientId(clientId: string): void {
  try {
    localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
  } catch {
    // ignore
  }
}

// Safely decode a Google JWT ID Token without requiring an external library
export function decodeGoogleJwt(credential: string): { email?: string; name?: string; picture?: string; sub?: string } | null {
  try {
    const parts = credential.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse Google JWT credential:', err);
    return null;
  }
}
