// DB-backed auth using Supabase users table + bcryptjs password verification.
import { supabase } from "@/integrations/supabase/client";
// @ts-ignore — no types shipped for bcryptjs
import bcrypt from "bcryptjs";

const SESSION_KEY = "orderdesk_session";
const SESSION_USER_KEY = "orderdesk_username";

// `users` table is managed outside the generated Supabase types, so we cast.
const db = supabase as any;

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "active";
}

export function getCurrentUsername(): string {
  return localStorage.getItem(SESSION_USER_KEY) ?? "admin";
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
}

export async function signIn(username: string, password: string): Promise<boolean> {
  try {
    const { data, error } = await db
      .from("users")
      .select("username, password_hash")
      .eq("username", username.trim())
      .limit(1);

    if (error || !data || data.length === 0) return false;

    const user = data[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (valid) {
      localStorage.setItem(SESSION_KEY, "active");
      localStorage.setItem(SESSION_USER_KEY, user.username);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function updateCredentials(
  newUsername?: string,
  newPassword?: string,
): Promise<{ success: boolean; error?: string }> {
  const currentUsername = getCurrentUsername();

  const updatePayload: { username?: string; password_hash?: string } = {};

  if (newUsername && newUsername.trim() !== currentUsername) {
    updatePayload.username = newUsername.trim();
  }

  if (newPassword) {
    updatePayload.password_hash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updatePayload).length === 0) {
    return { success: true };
  }

  const { error } = await db
    .from("users")
    .update(updatePayload)
    .eq("username", currentUsername);

  if (error) return { success: false, error: error.message };

  if (updatePayload.username) {
    localStorage.setItem(SESSION_USER_KEY, updatePayload.username);
  }

  return { success: true };
}
