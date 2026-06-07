import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signIn } from "@/lib/auth";
import logoAsset from "@/assets/sri-nagalakshmi-logo.svg.asset.json";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in — Sri Nagalakshmi Enterprises OrderDesk" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signIn(username, password)) {
      navigate({ to: "/" });
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            className="text-2xl font-semibold text-brand"
          >
            Sri Nagalakshmi Enterprises
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            FMCG Distributor — OrderDesk
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-brand py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Default: admin / admin123 — change in Settings.
        </p>
      </div>
    </div>
  );
}
