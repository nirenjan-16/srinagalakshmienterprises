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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (await signIn(username, password)) {
        navigate({ to: "/" });
      } else {
        setError("Invalid username or password.");
      }
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ backgroundImage: "var(--gradient-surface)" }}
    >
      {/* Soft ambient blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ backgroundImage: "var(--gradient-brand)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--brand-glow)" }}
        aria-hidden
      />

      <div
        className="relative w-full max-w-md rounded-3xl border border-border/60 bg-card/90 p-8 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ boxShadow: "var(--shadow-elegant)" }}
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <img
            src={logoAsset.url}
            alt="Sri Nagalakshmi Enterprises"
            className="mb-4 h-36 w-36 drop-shadow-xl"
          />
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
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
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-glow)]"
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
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-glow)]"
            />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-brand-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)] active:translate-y-0 disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Contact your administrator if you cannot log in.
        </p>
      </div>
    </div>
  );
}
