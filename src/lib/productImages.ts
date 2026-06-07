import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "product-images";

/** Resolve image_url values (storage paths) to signed URLs. */
export async function resolveImageUrls(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)));
  if (unique.length === 0) return {};
  const out: Record<string, string> = {};
  // signed URLs valid for ~1 year
  await Promise.all(
    unique.map(async (path) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
      if (data?.signedUrl) out[path] = data.signedUrl;
    }),
  );
  return out;
}

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function deleteProductImage(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}
