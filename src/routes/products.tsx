import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products — OrderDesk" }] }),
  component: () => (
    <AuthGuard>
      <ProductsPage />
    </AuthGuard>
  ),
});

interface Product {
  id: string;
  name: string;
  default_mrp: number;
  box_size: number | null;
  box_mrp: number | null;
}

interface FormState {
  id: string | null;
  name: string;
  default_mrp: string;
  box_size: string;
  box_mrp: string;
  box_mrp_touched: boolean;
}

const emptyForm: FormState = {
  id: null,
  name: "",
  default_mrp: "",
  box_size: "",
  box_mrp: "",
  box_mrp_touched: false,
};

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Auto-calc box_mrp unless user has manually overridden
  useEffect(() => {
    if (form.box_mrp_touched) return;
    const mrp = parseFloat(form.default_mrp);
    const size = parseInt(form.box_size);
    if (!isNaN(mrp) && !isNaN(size) && size > 0) {
      setForm((f) => ({ ...f, box_mrp: (mrp * size).toFixed(2) }));
    }
  }, [form.default_mrp, form.box_size, form.box_mrp_touched]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      default_mrp: parseFloat(form.default_mrp) || 0,
      box_size: form.box_size ? parseInt(form.box_size) : null,
      box_mrp: form.box_mrp ? parseFloat(form.box_mrp) : null,
    };
    if (form.id) {
      await supabase.from("products").update(payload).eq("id", form.id);
    } else {
      await supabase.from("products").insert(payload);
    }
    setForm(emptyForm);
    setSaving(false);
    load();
  };

  const handleEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      default_mrp: String(p.default_mrp),
      box_size: p.box_size ? String(p.box_size) : "",
      box_mrp: p.box_mrp ? String(p.box_mrp) : "",
      box_mrp_touched: true,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Products
        </h1>

        <form
          onSubmit={handleSave}
          className="mb-8 grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        >
          <Field label="Product name" required>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Pack MRP ₹" required>
            <input
              required
              type="number"
              step="0.01"
              value={form.default_mrp}
              onChange={(e) => setForm({ ...form, default_mrp: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Packs per Box">
            <input
              type="number"
              value={form.box_size}
              onChange={(e) => setForm({ ...form, box_size: e.target.value })}
              className="input"
              placeholder="e.g. 180"
            />
          </Field>
          <Field label="Box MRP ₹">
            <input
              type="number"
              step="0.01"
              value={form.box_mrp}
              onChange={(e) =>
                setForm({ ...form, box_mrp: e.target.value, box_mrp_touched: true })
              }
              className="input"
              placeholder="auto"
            />
          </Field>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {form.id ? "Update" : "Add"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="rounded-md border border-input px-4 py-2 text-sm transition hover:bg-accent"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Pack MRP</th>
                <th className="px-4 py-3">Packs/Box</th>
                <th className="px-4 py-3">Box MRP</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No products yet.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">₹{Number(p.default_mrp).toFixed(2)}</td>
                    <td className="px-4 py-3">{p.box_size ?? "—"}</td>
                    <td className="px-4 py-3">{p.box_mrp ? `₹${Number(p.box_mrp).toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(p)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand hover:bg-accent"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-destructive hover:bg-accent"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
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
