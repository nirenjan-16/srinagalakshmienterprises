import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — OrderDesk" }] }),
  component: () => (
    <AuthGuard>
      <OrdersPage />
    </AuthGuard>
  ),
});

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  to_number: string | null;
  phone: string | null;
  order_date: string;
  status: string;
  total_amount: number;
  delivered_at: string | null;
  order_items: Array<{
    product_name: string;
    unit_type: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

const STATUSES = ["Pending", "Confirmed", "Delivered", "Cancelled"];

function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, to_number, phone, order_date, status, total_amount, delivered_at, order_items(product_name, unit_type, quantity, rate, amount)",
      )
      .order("created_at", { ascending: false });
    setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === "Delivered") patch.delivered_at = new Date().toISOString();
    await supabase.from("orders").update(patch).eq("id", id);
    load();
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    await supabase.from("orders").delete().eq("id", id);
    load();
  };

  const exportCsv = () => {
    const headers = [
      "Order Number",
      "Customer",
      "TO Number",
      "Phone",
      "Date",
      "Product",
      "Unit",
      "Quantity",
      "Rate",
      "Amount",
      "Status",
    ];
    const rows: string[][] = [];
    orders.forEach((o) => {
      if (o.order_items.length === 0) {
        rows.push([o.order_number, o.customer_name, o.to_number ?? "", o.phone ?? "", o.order_date, "", "", "", "", "0", o.status]);
      } else {
        o.order_items.forEach((it) => {
          rows.push([
            o.order_number,
            o.customer_name,
            o.to_number ?? "",
            o.phone ?? "",
            o.order_date,
            it.product_name,
            it.unit_type,
            String(it.quantity),
            String(it.rate),
            String(it.amount),
            o.status,
          ]);
        });
      }
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Orders
          </h1>
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <Link
              to="/orders/new"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
            >
              + New Order
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customer_name}</div>
                      {o.phone && <div className="text-xs text-muted-foreground">{o.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.order_date}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 text-xs">
                        {o.order_items.map((it, i) => (
                          <div key={i}>
                            {it.product_name} — {it.quantity} {it.unit_type}
                            {it.unit_type === "Box" ? "(es)" : "(s)"}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">₹{Number(o.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteOrder(o.id)}
                        className="rounded-md p-1.5 text-destructive hover:bg-accent"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
