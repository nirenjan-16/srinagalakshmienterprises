import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Trash2, Archive, Search, Pencil, Plus } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { purgeOldArchivedOrders } from "@/lib/archiveCleanup";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Orders — OrderDesk" }] }),
  component: () => (
    <AuthGuard>
      <OrdersPage />
    </AuthGuard>
  ),
});

interface OrderItemRow {
  id?: string;
  product_id?: string | null;
  product_name: string;
  unit_type: string;
  quantity: number;
  rate: number;
  amount: number;
}

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
  cancelled_at: string | null;
  order_items: OrderItemRow[];
}

interface EditModal {
  order: OrderRow;
}

const ACTIVE_STATUSES = ["Pending", "Confirmed", "Delivered", "Cancelled"];

function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState<EditModal | null>(null);

  const load = async () => {
    setLoading(true);
    await purgeOldArchivedOrders();
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, to_number, phone, order_date, status, total_amount, delivered_at, cancelled_at, order_items(id, product_id, product_name, unit_type, quantity, rate, amount)",
      )
      .in("status", ["Pending", "Confirmed"])
      .order("created_at", { ascending: false });
    setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Filter orders by search query (customer name or order number)
  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.customer_name.toLowerCase().includes(q) ||
      o.order_number.toLowerCase().includes(q) ||
      (o.phone ?? "").includes(q)
    );
  });

  const updateStatus = async (id: string, status: string) => {
    const patch: { status: string; delivered_at?: string | null; cancelled_at?: string | null } = { status };
    if (status === "Delivered") patch.delivered_at = new Date().toISOString();
    if (status === "Cancelled") patch.cancelled_at = new Date().toISOString();
    if (status === "Pending" || status === "Confirmed") {
      patch.delivered_at = null;
      patch.cancelled_at = null;
    }
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
      "Order Number", "Customer", "TO Number", "Phone",
      "Date", "Product", "Unit", "Quantity", "Rate", "Amount", "Status",
    ];
    const rows: string[][] = [];
    orders.forEach((o) => {
      if (o.order_items.length === 0) {
        rows.push([o.order_number, o.customer_name, o.to_number ?? "", o.phone ?? "", o.order_date, "", "", "", "", "0", o.status]);
      } else {
        o.order_items.forEach((it) => {
          rows.push([
            o.order_number, o.customer_name, o.to_number ?? "", o.phone ?? "",
            o.order_date, it.product_name, it.unit_type,
            String(it.quantity), String(it.rate), String(it.amount), o.status,
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
            Active Orders
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/orders/archive"
              className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
            >
              <Archive className="h-4 w-4" /> Archive
            </Link>
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

        {/* Search bar */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer name, order number, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results count when searching */}
        {search && (
          <p className="mb-3 text-xs text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
          </p>
        )}

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
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {search ? `No orders matching "${search}".` : "No active orders. Delivered and cancelled orders are in the Archive."}
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
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
                            {it.product_name} — {it.quantity} {it.unit_type}{it.unit_type === "Box" ? "(es)" : "(s)"}
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
                        {ACTIVE_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditModal({ order: o })}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteOrder(o.id)}
                          className="rounded-md p-1.5 text-destructive hover:bg-accent"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Edit Modal */}
      {editModal && (
        <EditOrderModal
          order={editModal.order}
          onClose={() => setEditModal(null)}
          onSaved={() => { setEditModal(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Edit Order Modal ───────────────────────────────────────────────────────
function EditOrderModal({
  order,
  onClose,
  onSaved,
}: {
  order: OrderRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [customerName, setCustomerName] = useState(order.customer_name);
  const [toNumber, setToNumber] = useState(order.to_number ?? "");
  const [phone, setPhone] = useState(order.phone ?? "");
  const [orderDate, setOrderDate] = useState(order.order_date);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!customerName.trim()) {
      alert("Customer name is required.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("orders")
      .update({
        customer_name: customerName.trim(),
        to_number: toNumber.trim() || null,
        phone: phone.trim() || null,
        order_date: orderDate,
      })
      .eq("id", order.id);
    setSaving(false);
    if (error) {
      alert("Failed to save: " + error.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">
          Edit Order <span className="font-mono text-sm text-muted-foreground">{order.order_number}</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Customer Name *</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">TO Number</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={toNumber}
              onChange={(e) => setToNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Phone</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            * To edit line items, delete this order and create a new one.
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-md bg-brand py-2 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-input py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
