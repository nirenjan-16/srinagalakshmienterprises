import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { purgeOldArchivedOrders } from "@/lib/archiveCleanup";

export const Route = createFileRoute("/orders/archive")({
  head: () => ({ meta: [{ title: "Archive — OrderDesk" }] }),
  component: () => (
    <AuthGuard>
      <ArchivePage />
    </AuthGuard>
  ),
});

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string | null;
  order_date: string;
  status: string;
  total_amount: number;
  delivered_at: string | null;
  cancelled_at: string | null;
  order_items: Array<{ product_name: string; unit_type: string; quantity: number }>;
}

function daysRemaining(o: OrderRow): number | null {
  const ms = 24 * 60 * 60 * 1000;
  if (o.status === "Delivered" && o.delivered_at) {
    const elapsed = (Date.now() - new Date(o.delivered_at).getTime()) / ms;
    return Math.max(0, Math.ceil(5 - elapsed));
  }
  if (o.status === "Cancelled" && o.cancelled_at) {
    const elapsed = (Date.now() - new Date(o.cancelled_at).getTime()) / ms;
    return Math.max(0, Math.ceil(3 - elapsed));
  }
  return null;
}

function ArchivePage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Delivered" | "Cancelled">("All");

  const load = async () => {
    setLoading(true);
    await purgeOldArchivedOrders();
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, phone, order_date, status, total_amount, delivered_at, cancelled_at, order_items(product_name, unit_type, quantity)",
      )
      .in("status", ["Delivered", "Cancelled"])
      .order("created_at", { ascending: false });
    setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const restore = async (id: string) => {
    await supabase
      .from("orders")
      .update({ status: "Pending", delivered_at: null, cancelled_at: null })
      .eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Permanently delete this order?")) return;
    await supabase.from("orders").delete().eq("id", id);
    load();
  };

  const filtered = orders.filter((o) => filter === "All" || o.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              to="/orders"
              className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back to orders
            </Link>
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Archive
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Delivered orders are removed 5 days after delivery. Cancelled orders are removed 3 days after cancellation.
            </p>
          </div>
          <div className="flex gap-1 rounded-md border border-border bg-card p-1 text-xs">
            {(["All", "Delivered", "Cancelled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-1.5 transition ${
                  filter === f ? "bg-brand text-brand-foreground" : "hover:bg-accent"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Removed in</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No archived orders.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const days = daysRemaining(o);
                  return (
                    <tr key={o.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{o.customer_name}</div>
                        {o.phone && <div className="text-xs text-muted-foreground">{o.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {o.order_items.map((it, i) => (
                          <div key={i}>
                            {it.product_name} — {it.quantity} {it.unit_type}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 font-semibold">₹{Number(o.total_amount).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            o.status === "Delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {days === null ? "—" : days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"}`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => restore(o.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand hover:bg-accent"
                          title="Restore to active"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </button>
                        <button
                          onClick={() => remove(o.id)}
                          className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-destructive hover:bg-accent"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
