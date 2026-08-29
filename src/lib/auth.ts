const SESSION_KEY = "orderdesk_session";
const USERNAME_KEY = "orderdesk_username";

export function getCurrentUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USERNAME_KEY) ?? "";
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "active";
}

export function startSession(username: string): void {
  localStorage.setItem(SESSION_KEY, "active");
  localStorage.setItem(USERNAME_KEY, username);
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function updateSessionUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username);
}
