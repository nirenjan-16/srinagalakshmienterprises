const CREDS_KEY = "orderdesk_credentials";
const SESSION_KEY = "orderdesk_session";
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";

interface Creds {
  username: string;
  password: string;
}

function readCreds(): Creds {
  if (typeof window === "undefined") return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };
    return JSON.parse(raw) as Creds;
  } catch {
    return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };
  }
}

export function getCurrentUsername(): string {
  return readCreds().username;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "active";
}

export function signIn(username: string, password: string): boolean {
  const creds = readCreds();
  if (username.trim() === creds.username && password === creds.password) {
    localStorage.setItem(SESSION_KEY, "active");
    return true;
  }
  return false;
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function updateCredentials(next: Partial<Creds>): void {
  const current = readCreds();
  const updated: Creds = {
    username: next.username?.trim() || current.username,
    password: next.password || current.password,
  };
  localStorage.setItem(CREDS_KEY, JSON.stringify(updated));
}
