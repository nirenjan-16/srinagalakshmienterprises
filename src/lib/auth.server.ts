import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RECOVERY_CODE_TTL_MS = 30 * 60 * 1000;
const MAX_RECOVERY_ATTEMPTS = 5;
const RECOVERY_LOCKOUT_MS = 15 * 60 * 1000;

function createRecoveryCode() {
  return randomBytes(12).toString("base64url").slice(0, 16).toUpperCase();
}

export async function verifyCredentials(username: string, password: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("username, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (error || !data) return { ok: false as const };
  const ok = await bcrypt.compare(password, data.password_hash);
  return ok ? { ok: true as const, username: data.username } : { ok: false as const };
}

export async function changeCredentials(input: {
  currentUsername: string;
  currentPassword: string;
  nextUsername: string;
  newPassword?: string;
}) {
  const verified = await verifyCredentials(input.currentUsername, input.currentPassword);
  if (!verified.ok) return { ok: false as const };

  const updates: { username?: string; password_hash?: string } = {};
  if (input.nextUsername !== input.currentUsername) updates.username = input.nextUsername;
  if (input.newPassword) updates.password_hash = await bcrypt.hash(input.newPassword, 12);
  if (Object.keys(updates).length === 0) return { ok: true as const, username: input.currentUsername };

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("username", input.currentUsername)
    .select("username")
    .maybeSingle();

  if (error || !data) return { ok: false as const };
  return { ok: true as const, username: data.username };
}

export async function issueRecoveryCode(username: string, currentPassword: string) {
  const verified = await verifyCredentials(username, currentPassword);
  if (!verified.ok) return { ok: false as const };

  const code = createRecoveryCode();
  const expiresAt = new Date(Date.now() + RECOVERY_CODE_TTL_MS).toISOString();
  const recoveryCodeHash = await bcrypt.hash(code, 12);
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      recovery_code_hash: recoveryCodeHash,
      recovery_code_expires_at: expiresAt,
      recovery_code_used_at: null,
      recovery_failed_attempts: 0,
      recovery_locked_until: null,
    })
    .eq("username", username);

  if (error) return { ok: false as const };
  return { ok: true as const, code, expiresAt };
}

export async function resetPasswordWithCode(
  username: string,
  recoveryCode: string,
  newPassword: string,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(
      "id, recovery_code_hash, recovery_code_expires_at, recovery_code_used_at, recovery_failed_attempts, recovery_locked_until",
    )
    .eq("username", username)
    .maybeSingle();

  if (error || !data || !data.recovery_code_hash) return { ok: false as const };

  const now = Date.now();
  const lockedUntil = data.recovery_locked_until ? Date.parse(data.recovery_locked_until) : 0;
  const expiresAt = data.recovery_code_expires_at ? Date.parse(data.recovery_code_expires_at) : 0;
  if (
    data.recovery_code_used_at ||
    !expiresAt ||
    expiresAt <= now ||
    (lockedUntil > now && lockedUntil > 0)
  ) {
    return { ok: false as const };
  }

  const matches = await bcrypt.compare(recoveryCode, data.recovery_code_hash);
  if (!matches) {
    const failedAttempts = (data.recovery_failed_attempts ?? 0) + 1;
    await supabaseAdmin
      .from("users")
      .update({
        recovery_failed_attempts: failedAttempts,
        recovery_locked_until:
          failedAttempts >= MAX_RECOVERY_ATTEMPTS
            ? new Date(now + RECOVERY_LOCKOUT_MS).toISOString()
            : null,
      })
      .eq("id", data.id);
    return { ok: false as const };
  }

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      password_hash: await bcrypt.hash(newPassword, 12),
      recovery_code_hash: null,
      recovery_code_expires_at: null,
      recovery_code_used_at: new Date(now).toISOString(),
      recovery_failed_attempts: 0,
      recovery_locked_until: null,
    })
    .eq("id", data.id);

  return updateError ? { ok: false as const } : { ok: true as const };
}