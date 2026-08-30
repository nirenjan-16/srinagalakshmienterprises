import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { resetPasswordAccount } from "@/lib/auth.functions";
import { passwordSchema, recoveryCodeSchema, usernameSchema } from "@/lib/auth.schemas";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Sri Nagalakshmi Enterprises OrderDesk" },
      {
        name: "description",
        content: "Reset an OrderDesk password with a one-time recovery code.",
      },
      { property: "og:title", content: "Reset password — Sri Nagalakshmi Enterprises OrderDesk" },
      {
        property: "og:description",
        content: "Reset an OrderDesk password with a one-time recovery code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const resetPassword = useServerFn(resetPasswordAccount);
  const [username, setUsername] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const parsedUsername = usernameSchema.safeParse(username);
    const parsedCode = recoveryCodeSchema.safeParse(recoveryCode);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedUsername.success || !parsedCode.success || !parsedPassword.success) {
      setMessage({ kind: "err", text: "Check the username, recovery code, and password." });
      return;
    }
    if (password !== confirm) {
      setMessage({ kind: "err", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({
        data: {
          username: parsedUsername.data,
          recoveryCode: parsedCode.data,
          newPassword: parsedPassword.data,
        },
      });
      if (!result.ok) {
        setMessage({
          kind: "err",
          text: "The recovery code is invalid, expired, or already used.",
        });
        return;
      }
      setMessage({ kind: "ok", text: "Password reset successfully. Redirecting to sign in…" });
      window.setTimeout(() => void navigate({ to: "/login" }), 900);
    } catch {
      setMessage({ kind: "err", text: "Unable to reset the password. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-card/90 p-8 shadow-[var(--shadow-elegant)] backdrop-blur-xl">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            OrderDesk recovery
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the one-time recovery code created in Settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reset-username"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Username
            </label>
            <input
              id="reset-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="input"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label
              htmlFor="recovery-code"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Recovery code
            </label>
            <input
              id="recovery-code"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value)}
              className="input font-mono uppercase"
              autoComplete="one-time-code"
              required
            />
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="input"
              autoComplete="new-password"
              required
            />
          </div>
          {message && (
            <p
              className={`rounded-md px-3 py-2 text-sm ${message.kind === "ok" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}
            >
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Resetting…" : "Reset password"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
