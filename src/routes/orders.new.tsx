import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, Plus, ImageIcon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { resolveImageUrls } from "@/lib/productImages";
import { searchProductImage } from "@/lib/imageSearch.functions";

export const Route = createFileRoute("/orders/new")({
  head: () => ({ meta: [{ title: "New Order — OrderDesk" }] }),
  component: () => (
    <AuthGuard>
      <NewOrderPage />
    </AuthGuard>
  ),
});

interface Product {
  id: string;
  name: string;
  default_mrp: number;
  box_size: number | null;
  box_mrp: number | null;
  image_url: string | null;
}

interface LineItem {
  key: string;
  product_id: string;
  product_name: string;
  unit_type: "Pack" | "Box";
  quantity: string;
  rate: string;
}

const newLine = (): LineItem => ({
  key: Math.random().toString(36).slice(2),
  product_id: "",
  product_name: "",
  unit_type: "Pack",
  quantity: "1",
  rate: "",
});

function NewOrderPage() {
  const navigate = useNavigate();
  const fetchImage = useServerFn(searchProductImage);
  const [products, setProducts] = useState<Product[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Array<{ name: string; phone: string | null }>>([]);
  const [customer, setCustomer] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [saving, setSaving] = useState(false);

  const reloadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("name");
    const list = (data as Product[]) ?? [];
    setProducts(list);
    setImageMap(await resolveImageUrls(list.map((p) => p.image_url)));
    return list;
  };

  useEffect(() => {
    reloadProducts();
    supabase
      .from("orders")
      .select("customer_name, phone")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        const seen = new Map<string, { name: string; phone: string | null }>();
        (data ?? []).forEach((row: any) => {
          const name = (row.customer_name ?? "").trim();
          if (name && !seen.has(name.toLowerCase())) {
            seen.set(name.toLowerCase(), { name, phone: row.phone ?? null });
          }
        });
        setCustomers(Array.from(seen.values()));
      });
  }, []);

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const updateLine = (key: string, patch: Partial<LineItem>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        const product = productMap[next.product_id];
        if (product && (patch.product_id !== undefined || patch.unit_type !== undefined)) {
          next.product_name = product.name;
          next.rate =
            next.unit_type === "Box"
              ? product.box_mrp != null
                ? String(product.box_mrp)
                : ""
              : String(product.default_mrp);
        }
        return next;
      }),
    );
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const total = lines.reduce((sum, l) => {
    const q = parseFloat(l.quantity) || 0;
    const r = parseFloat(l.rate) || 0;
    return sum + q * r;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = lines.filter(
      (l) => (l.product_id || l.product_name.trim()) && parseFloat(l.quantity) > 0,
    );
    if (valid.length === 0) {
      alert("Add at least one product line with a name and quantity.");
      return;
    }
    setSaving(true);

    // Auto-create any products that don't exist yet
    const newProductNames = Array.from(
      new Set(
        valid
          .filter((l) => !l.product_id && l.product_name.trim())
          .map((l) => l.product_name.trim()),
      ),
    ).filter((name) => !products.some((p) => p.name.toLowerCase() === name.toLowerCase()));

    if (newProductNames.length > 0) {
      const inserts = await Promise.all(
        newProductNames.map(async (name) => {
          const sourceLine = valid.find(
            (l) => l.product_name.trim().toLowerCase() === name.toLowerCase(),
          );
          const rate = sourceLine ? parseFloat(sourceLine.rate) || 0 : 0;
          let image_url: string | null = null;
          try {
            const res = await fetchImage({ data: { query: `${name} product pack` } });
            image_url = res?.url ?? null;
          } catch {
            /* ignore — leave image blank */
          }
          return {
            name,
            default_mrp: sourceLine?.unit_type === "Box" ? 0 : rate,
            box_mrp: sourceLine?.unit_type === "Box" ? rate || null : null,
            image_url,
          };
        }),
      );
      const { error: prodErr } = await supabase.from("products").insert(inserts);
      if (prodErr) {
        alert("Failed to add new products: " + prodErr.message);
        setSaving(false);
        return;
      }
    }

    // Reload products so we can attach product_ids to the new lines
    const refreshedProducts = await reloadProducts();
    const findByName = (name: string) =>
      refreshedProducts.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());

    const { data: lastOrder } = await supabase
  .from("orders")
  .select("order_number")
  .order("created_at", { ascending: false })
  .limit(1);
const lastNum = lastOrder?.[0]?.order_number
  ? parseInt(lastOrder[0].order_number.replace("ORD-", "")) || 0
  : 0;
const orderNumber = `ORD-${String(lastNum + 1).padStart(3, "0")}`;
const { data: order, error } = await supabase
  .from("orders")
  .insert({
    order_number: orderNumber,
    customer_name: customer.trim(),
    to_number: toNumber.trim() || null,
    phone: phone.trim() || null,
    order_date: orderDate,
    status: "Pending",
    total_amount: total,
  })
  .select("id")
  .single();
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customer.trim(),
        to_number: toNumber.trim() || null,
        phone: phone.trim() || null,
        order_date: orderDate,
        status: "Pending",
        total_amount: total,
      })
      .select("id")
      .single();

    if (error || !order) {
      alert("Failed to save order: " + (error?.message ?? "unknown"));
      setSaving(false);
      return;
    }

    const itemsPayload = valid.map((l) => {
      const matched = l.product_id ? null : findByName(l.product_name);
      const productId = l.product_id || matched?.id || null;
      const productName = l.product_name.trim() || matched?.name || "";
      const q = parseFloat(l.quantity) || 0;
      const r = parseFloat(l.rate) || 0;
      return {
        order_id: order.id,
        product_id: productId,
        product_name: productName,
        unit_type: l.unit_type,
        quantity: q,
        rate: r,
        amount: q * r,
      };
    });
    const { error: itemErr } = await supabase.from("order_items").insert(itemsPayload);
    if (itemErr) {
      alert("Failed to save items: " + itemErr.message);
      setSaving(false);
      return;
    }
    navigate({ to: "/orders" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          New Order
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Customer name" required>
              <input
                required
                list="customers-list"
                value={customer}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomer(val);
                  const match = customers.find(
                    (c) => c.name.toLowerCase() === val.toLowerCase(),
                  );
                  if (match && !phone && match.phone) setPhone(match.phone);
                }}
                className="input"
                placeholder="Start typing…"
              />
              <datalist id="customers-list">
                {customers.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
            </Field>
            <Field label="TO Number">
              <input value={toNumber} onChange={(e) => setToNumber(e.target.value)} className="input" />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </Field>
            <Field label="Date" required>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="input"
              />
            </Field>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Line items</h2>
              <button
                type="button"
                onClick={() => setLines((p) => [...p, newLine()])}
                className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
              >
                <Plus className="h-4 w-4" /> Add row
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line) => {
                const product = productMap[line.product_id];
                const showBoxHint = line.unit_type === "Box" && product?.box_size;
                return (
                  <div
                    key={line.key}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 md:grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_auto]"
                  >
                    <div className="flex items-end">
                      {product?.image_url && imageMap[product.image_url] ? (
                        <img
                          src={imageMap[product.image_url]}
                          alt={product.name}
                          className="h-14 w-14 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
                        Product
                      </label>
                      <input
                        list={`products-${line.key}`}
                        value={line.product_name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const match = products.find((p) => p.name === val);
                          updateLine(line.key, {
                            product_name: val,
                            product_id: match?.id ?? "",
                            ...(match
                              ? {
                                  rate:
                                    line.unit_type === "Box"
                                      ? match.box_mrp != null
                                        ? String(match.box_mrp)
                                        : ""
                                      : String(match.default_mrp),
                                }
                              : {}),
                          });
                        }}
                        placeholder="Type or select a product"
                        className="input"
                      />
                      <datalist id={`products-${line.key}`}>
                        {products.map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
                        Unit
                      </label>
                      <select
                        value={line.unit_type}
                        onChange={(e) => updateLine(line.key, { unit_type: e.target.value as "Pack" | "Box" })}
                        className="input"
                      >
                        <option value="Pack">Pack</option>
                        <option value="Box">Box</option>
                      </select>
                      {showBoxHint && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {product!.box_size} packs/box
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
                        Quantity
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
                        Rate ₹
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.rate}
                        onChange={(e) => updateLine(line.key, { rate: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
                        Amount
                      </label>
                      <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
                        ₹{((parseFloat(line.quantity) || 0) * (parseFloat(line.rate) || 0)).toFixed(2)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="self-end rounded-md p-2 text-destructive hover:bg-accent"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end border-t border-border pt-4 text-lg font-semibold">
              Total: ₹{total.toFixed(2)}
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/orders" })}
              className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand px-6 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Order"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
