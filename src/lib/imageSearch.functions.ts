import { createServerFn } from "@tanstack/react-start";

/**
 * Search the web for a product image using DuckDuckGo's unofficial image
 * search endpoint. Returns the first reasonable image URL or null.
 */
export const searchProductImage = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    if (!data || typeof data.query !== "string" || data.query.trim().length === 0) {
      throw new Error("query is required");
    }
    return { query: data.query.trim().slice(0, 200) };
  })
  .handler(async ({ data }) => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

    // Step 1: fetch the vqd token from the HTML page
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(data.query)}&iax=images&ia=images`,
      { headers: { "User-Agent": ua } },
    );
    const html = await tokenRes.text();
    const match =
      html.match(/vqd=["']([\d-]+)["']/) ||
      html.match(/vqd=([\d-]+)&/) ||
      html.match(/"vqd":"([\d-]+)"/);
    const vqd = match?.[1];
    if (!vqd) return { url: null as string | null };

    // Step 2: call the JSON image-search endpoint
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(
        data.query,
      )}&vqd=${vqd}&f=,,,,,&p=1`,
      {
        headers: {
          "User-Agent": ua,
          Accept: "application/json, text/javascript, */*; q=0.01",
          Referer: "https://duckduckgo.com/",
        },
      },
    );
    if (!imgRes.ok) return { url: null as string | null };
    const json = (await imgRes.json()) as { results?: Array<{ image?: string; thumbnail?: string }> };
    const first = json.results?.find((r) => r.image || r.thumbnail);
    return { url: first?.image ?? first?.thumbnail ?? null };
  });
