import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { getCurrentUsername, updateSessionUsername } from "@/lib/auth";
import { generateRecoveryCode, updateAccountCredentials } from "@/lib/auth.functions";
import { passwordSchema, usernameSchema } from "@/lib/auth.schemas";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Sri Nagalakshmi Enterprises OrderDesk" },
      { name: "description", content: "Manage OrderDesk credentials and recovery access." },
      { property: "og:title", content: "Settings — Sri Nagalakshmi Enterprises OrderDesk" },
      { property: "og:description", content: "Manage OrderDesk credentials and recovery access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <SettingsPage />
    </AuthGuard>
  ),
});

function SettingsPage() {
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [recoveryExpiresAt, setRecoveryExpiresAt] = useState<string | null>(null);
  const updateCredentials = useServerFn(updateAccountCredentials);
  const createRecoveryCode = useServerFn(generateRecoveryCode);

  useEffect(() => {
    setUsername(getCurrentUsername());
  }, []);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    if (!currentPassword) {
      setMessage({ kind: "err", text: "Enter your current password to save changes." });
      return;
    }
    if (password && password !== confirm) {
      setMessage({ kind: "err", text: "Passwords do not match." });
      return;
    }
    const parsedUsername = usernameSchema.safeParse(username);
    const parsedPassword = password ? passwordSchema.safeParse(password) : null;
    if (!parsedUsername.success || (parsedPassword && !parsedPassword.success)) {
      setMessage({ kind: "err", text: "Check the username and password requirements." });
      return;
    }
    try {
      const result = await updateCredentials({
        data: {
          currentUsername: getCurrentUsername(),
          currentPassword,
          nextUsername: parsedUsername.data,
          newPassword: parsedPassword?.data,
        },
      });
      if (!result.ok) {
        setMessage({
          kind: "err",
          text: "Current password is incorrect or the username is unavailable.",
        });
        return;
      }
      updateSessionUsername(result.username);
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      setMessage({ kind: "ok", text: "Settings saved." });
    } catch {
      setMessage({ kind: "err", text: "Failed to save settings." });
    }
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
            <label className="mb-1 block text-sm font-medium">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
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
            <p
              className={`text-sm ${message.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}
            >
              {message.text}
            </p>
          )}

          <Button type="submit" className="bg-brand text-brand-foreground hover:opacity-90">
            Save changes
          </Button>
        </form>

        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recovery access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a one-time code before you need it. It expires in 30 minutes and is shown only
            once.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={async () => {
              setRecoveryCode(null);
              setMessage(null);
              if (!currentPassword) {
                setMessage({ kind: "err", text: "Enter your current password above first." });
                return;
              }
              const result = await createRecoveryCode({
                data: { username: getCurrentUsername(), currentPassword },
              });
              if (!result.ok) {
                setMessage({ kind: "err", text: "Current password is incorrect." });
                return;
              }
              setRecoveryCode(result.code);
              setRecoveryExpiresAt(result.expiresAt);
              setCurrentPassword("");
            }}
          >
            Generate recovery code
          </Button>
          {recoveryCode && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Copy this code now
              </p>
              <p className="mt-2 break-all font-mono text-lg font-semibold tracking-wider text-foreground">
                {recoveryCode}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Expires{" "}
                {recoveryExpiresAt ? new Date(recoveryExpiresAt).toLocaleTimeString() : "soon"}. It
                cannot be viewed again.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
