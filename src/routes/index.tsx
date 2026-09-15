import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { StatCard } from "@/components/StatCard";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sri Nagalakshmi Enterprises OrderDesk" },
      { name: "description", content: "Daily orders overview for Sri Nagalakshmi Enterprises." },
    ],
  }),
  component: () => (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  ),
});

interface LastActivity {
  order_number: string;
  customer_name: string;
  status: string;
  updated_at: string;
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(diffMs / 3600000);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(diffMs / 86400000);
  if (days < 7) return rtf.format(-days, "day");
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Dashboard() {
  const [stats, setStats] = useState({ today: 0, pending: 0, delivered: 0 });
  const [lastActivity, setLastActivity] = useState<LastActivity | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [todays, pending, delivered, recent] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_date", today),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "Delivered")
          .gte("delivered_at", `${today}T00:00:00`)
          .lt("delivered_at", `${today}T23:59:59`),
        supabase
          .from("orders")
          .select("order_number, customer_name, status, updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (!mounted) return;
      setStats({
        today: todays.count ?? 0,
        pending: pending.count ?? 0,
        delivered: delivered.count ?? 0,
      });
      setLastActivity((recent.data as LastActivity | null) ?? null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundImage: "var(--gradient-surface)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Orders Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Daily overview of your distribution operations.
            </p>
          </div>
          <Link
            to="/orders/new"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            + New Order
          </Link>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Today's Orders" value={loading ? "…" : stats.today} />
          <StatCard label="Pending Orders" value={loading ? "…" : stats.pending} accent="warning" />
          <StatCard label="Delivered Today" value={loading ? "…" : stats.delivered} accent="success" />
        </section>

        <section
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-6 py-4 transition-all duration-300 hover:shadow-[var(--shadow-elegant)]"
          aria-label="Last activity"
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-foreground"
              style={{ backgroundImage: "var(--gradient-brand)" }}
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Last change
              </p>
              <p className="text-sm font-semibold text-foreground">
                {loading || lastActivity === undefined
                  ? "Checking…"
                  : lastActivity === null
                    ? "No activity yet"
                    : formatRelativeTime(lastActivity.updated_at)}
              </p>
            </div>
          </div>
          {lastActivity && (
            <p className="text-sm text-muted-foreground">
              Order <span className="font-medium text-foreground">{lastActivity.order_number}</span>
              {" · "}
              {lastActivity.customer_name}
              {" · "}
              <span className="font-medium text-foreground">{lastActivity.status}</span>
            </p>
          )}
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            to="/orders"
            className="group block overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-[var(--shadow-elegant)]"
          >
            <h3 className="font-semibold text-foreground transition-colors group-hover:text-brand">
              View All Orders →
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Browse, update status, and export CSV.</p>
          </Link>
          <Link
            to="/products"
            className="group block overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-[var(--shadow-elegant)]"
          >
            <h3 className="font-semibold text-foreground transition-colors group-hover:text-brand">
              Manage Products →
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Add packs, box sizes, and box MRP.</p>
          </Link>
        </section>
      </main>
    </div>
  );
}

