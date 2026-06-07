import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2, ImagePlus, X } from "lucide-react";
import { resolveImageUrls, uploadProductImage, deleteProductImage } from "@/lib/productImages";

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
  image_url: string | null;
}

interface FormState {
  id: string | null;
  name: string;
  default_mrp: string;
  box_size: string;
  box_mrp: string;
  box_mrp_touched: boolean;
  image_url: string | null;
  imageFile: File | null;
  imagePreview: string | null;
}

const emptyForm: FormState = {
  id: null,
  name: "",
  default_mrp: "",
  box_size: "",
  box_mrp: "",
  box_mrp_touched: false,
  image_url: null,
  imageFile: null,
  imagePreview: null,
};

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("name");
    const list = (data as Product[]) ?? [];
    setProducts(list);
    const urls = await resolveImageUrls(list.map((p) => p.image_url));
    setImageMap(urls);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (form.box_mrp_touched) return;
    const mrp = parseFloat(form.default_mrp);
    const size = parseInt(form.box_size);
    if (!isNaN(mrp) && !isNaN(size) && size > 0) {
      setForm((f) => ({ ...f, box_mrp: (mrp * size).toFixed(2) }));
    }
  }, [form.default_mrp, form.box_size, form.box_mrp_touched]);

  const handleFile = (file: File | null) => {
    if (!file) {
      setForm((f) => ({ ...f, imageFile: null, imagePreview: null }));
      return;
    }
    setForm((f) => ({ ...f, imageFile: file, imagePreview: URL.createObjectURL(file) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (form.imageFile) {
        if (form.image_url) await deleteProductImage(form.image_url).catch(() => {});
        image_url = await uploadProductImage(form.imageFile);
      }
      const payload = {
        name: form.name.trim(),
        default_mrp: parseFloat(form.default_mrp) || 0,
        box_size: form.box_size ? parseInt(form.box_size) : null,
        box_mrp: form.box_mrp ? parseFloat(form.box_mrp) : null,
        image_url,
      };
      if (form.id) {
        await supabase.from("products").update(payload).eq("id", form.id);
      } else {
        await supabase.from("products").insert(payload);
      }
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      alert("Failed to save product: " + (err?.message ?? "unknown"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      default_mrp: String(p.default_mrp),
      box_size: p.box_size ? String(p.box_size) : "",
      box_mrp: p.box_mrp ? String(p.box_mrp) : "",
      box_mrp_touched: true,
      image_url: p.image_url,
      imageFile: null,
      imagePreview: p.image_url ? imageMap[p.image_url] ?? null : null,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const p = products.find((x) => x.id === id);
    if (p?.image_url) await deleteProductImage(p.image_url).catch(() => {});
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  const clearImage = async () => {
    setForm((f) => ({ ...f, imageFile: null, imagePreview: null, image_url: null }));
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
          className="mb-8 grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Image
            </span>
            <div className="flex items-center gap-2">
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-muted/40 text-muted-foreground hover:bg-accent">
                {form.imagePreview ? (
                  <img src={form.imagePreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {(form.imagePreview || form.image_url) && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
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
              {saving ? "Saving…" : form.id ? "Update" : "Add"}
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
                <th className="px-4 py-3">Image</th>
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
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No products yet.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      {p.image_url && imageMap[p.image_url] ? (
                        <img
                          src={imageMap[p.image_url]}
                          alt={p.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-muted" />
                      )}
                    </td>
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
