/**
 * Product image URLs are now stored directly as remote http(s) URLs in
 * products.image_url (no upload bucket). These helpers are kept as small
 * pass-throughs so existing callers keep working.
 */
export async function resolveImageUrls(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const p of paths) {
    if (p) out[p] = p;
  }
  return out;
}
