import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { getCurrentUsername, updateCredentials } from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — OrderDesk" }] }),
  component: () => (
    <AuthGuard>
      <SettingsPage />
    </AuthGuard>
  ),
});

function SettingsPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setUsername(getCurrentUsername());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (password && password !== confirm) {
      setMessage({ kind: "err", text: "Passwords do not match." });
      return;
    }
    if (password && password.length < 6) {
      setMessage({ kind: "err", text: "Password must be at least 6 characters." });
      return;
    }
    updateCredentials({
  username,
  password: password || undefined,
});
    setPassword("");
    setConfirm("");
    setMessage({ kind: "ok", text: "Settings saved." });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Settings
        </h1>

        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="input"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            className="rounded-md bg-brand px-6 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
          >
            Save
          </button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Credentials are stored locally in your browser. Clearing site data resets them to admin / admin123.
        </p>
      </main>
    </div>
  );
}
