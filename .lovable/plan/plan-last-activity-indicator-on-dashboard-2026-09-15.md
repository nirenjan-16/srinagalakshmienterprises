# Plan: "Last Activity" Indicator on Dashboard

## Goal
Show when the last change was made — e.g. the most recent order created or updated — so the user can instantly see when someone last worked in the app.

## What will change

1. **Dashboard "Last Activity" card** (`src/routes/index.tsx`)
   - A new card on the dashboard (below the stat cards) showing:
     - **Time**: a friendly relative timestamp, e.g. "5 minutes ago", "Yesterday, 4:32 PM" (falls back to full date for older entries)
     - **What changed**: order number, customer name, and status of the most recent order
   - Data source: query the `orders` table sorted by `updated_at` descending, limited to 1 row — this naturally covers both new orders (`updated_at = created_at`) and later edits/status changes.
   - If there are no orders yet, the card shows "No activity yet".

2. **No database changes needed**
   - The `orders` table already has `created_at` and `updated_at` columns, so no migration is required.

## Technical notes
- Uses the existing browser Supabase client, same pattern as the dashboard's stat queries.
- Relative time formatting done with plain JavaScript (`Intl.RelativeTimeFormat`), no new dependencies.
- Card styling matches the existing modern dashboard design tokens.
