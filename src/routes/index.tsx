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

function Dashboard() {
  const [stats, setStats] = useState({ today: 0, pending: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [todays, pending, delivered] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_date", today),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "Delivered")
          .gte("delivered_at", `${today}T00:00:00`)
          .lt("delivered_at", `${today}T23:59:59`),
      ]);
      if (!mounted) return;
      setStats({
        today: todays.count ?? 0,
        pending: pending.count ?? 0,
        delivered: delivered.count ?? 0,
      });
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
