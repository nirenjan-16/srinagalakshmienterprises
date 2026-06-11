import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {},
  // Force the nitro deploy plugin to run outside the Lovable sandbox (i.e. on Vercel)
  // and target Vercel's serverless preset. Nitro emits to `.vercel/output/` using
  // Vercel's Build Output API v3, which Vercel auto-detects.
  nitro: { preset: "vercel" },
});
