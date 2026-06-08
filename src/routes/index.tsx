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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-semibold text-foreground"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Orders Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Daily overview of your distribution operations.
            </p>
          </div>
          <Link
            to="/orders/new"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm transition hover:opacity-90"
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
            className="block rounded-xl border border-border bg-card p-6 transition hover:border-brand hover:shadow-md"
          >
            <h3 className="font-semibold text-foreground">View All Orders</h3>
            <p className="mt-1 text-sm text-muted-foreground">Browse, update status, and export CSV.</p>
          </Link>
          <Link
            to="/products"
            className="block rounded-xl border border-border bg-card p-6 transition hover:border-brand hover:shadow-md"
          >
            <h3 className="font-semibold text-foreground">Manage Products</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add packs, box sizes, and box MRP.</p>
          </Link>
        </section>
      </main>
    </div>
  );
}
/* Hide Lovable badge */
#lovable-badge,
[data-lovable-badge],
iframe[src*="lovable"] {
  display: none !important;
}
