import bcrypt from "bcryptjs";
import { supabase } from "@/integrations/supabase/client";

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

export async function signIn(username: string, password: string): Promise<boolean> {
  const uname = username.trim();
  if (!uname || !password) return false;

  const { data, error } = await supabase
    .from("users")
    .select("username, password_hash")
    .eq("username", uname)
    .maybeSingle();

  if (error || !data) return false;

  const ok = await bcrypt.compare(password, data.password_hash);
  if (!ok) return false;

  localStorage.setItem(SESSION_KEY, "active");
  localStorage.setItem(USERNAME_KEY, data.username);
  return true;
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export async function updateCredentials(next: {
  username?: string;
  password?: string;
}): Promise<void> {
  const current = getCurrentUsername();
  if (!current) throw new Error("Not signed in");

  const updates: { username?: string; password_hash?: string } = {};
  if (next.username && next.username.trim() && next.username.trim() !== current) {
    updates.username = next.username.trim();
  }
  if (next.password) {
    updates.password_hash = await bcrypt.hash(next.password, 10);
  }
  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from("users").update(updates).eq("username", current);
  if (error) throw error;

  if (updates.username) {
    localStorage.setItem(USERNAME_KEY, updates.username);
  }
}
