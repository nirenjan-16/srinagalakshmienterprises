
## Goal
Point the app at your Supabase project `pafettljahbetggrrbfs` instead of the current Lovable Cloud–managed project, recreate the schema there, keep the existing permissive RLS model, and migrate existing rows from products / orders / order_items / users.

## 1. Switch credentials

Update `.env` to use only your project (both VITE_ and server keys), so the browser client and the server-side admin/auth clients all hit the same project:

```
VITE_SUPABASE_URL=https://pafettljahbetggrrbfs.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your anon key>
VITE_SUPABASE_PROJECT_ID=pafettljahbetggrrbfs
SUPABASE_URL=https://pafettljahbetggrrbfs.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your anon key>
```

`supabase/config.toml` already points at `pafettljahbetggrrbfs`, so it stays.

No code changes needed in `src/integrations/supabase/client.ts` — it already reads from these env vars. `client.server.ts` needs `SUPABASE_SERVICE_ROLE_KEY`; if you want any admin/server features to work you'll need to add that as a secret. For the current app (browser-only Supabase calls) it isn't required.

Regenerate `src/integrations/supabase/types.ts` against the new project after the schema migration runs.

## 2. Schema SQL (run manually in your new project's SQL editor)

Single script that creates all four tables, indexes, FKs, defaults, the status CHECK with `Confirmed`, plus an `updated_at` trigger and permissive RLS that matches today's behavior. Anon role gets full CRUD so the existing client-side queries keep working.

```sql
-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- users
create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.users to anon, authenticated;
grant all on public.users to service_role;
alter table public.users enable row level security;
create policy "allow all users" on public.users for all using (true) with check (true);

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_mrp numeric not null default 0,
  box_size integer,
  box_mrp numeric,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
grant select, insert, update, delete on public.products to anon, authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Public read products"   on public.products for select using (true);
create policy "Public insert products" on public.products for insert with check (true);
create policy "Public update products" on public.products for update using (true) with check (true);
create policy "Public delete products" on public.products for delete using (true);

-- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  customer_name text not null,
  phone text,
  to_number text,
  order_date date not null default current_date,
  status text not null default 'Pending'
    check (status = any (array['Pending','Confirmed','Delivered','Cancelled'])),
  total_amount numeric not null default 0,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders(status);
create index orders_order_date_idx on public.orders(order_date);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
grant select, insert, update, delete on public.orders to anon, authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Public read orders"   on public.orders for select using (true);
create policy "Public insert orders" on public.orders for insert with check (true);
create policy "Public update orders" on public.orders for update using (true) with check (true);
create policy "Public delete orders" on public.orders for delete using (true);

-- order_items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_type text not null default 'Pack',
  quantity numeric not null default 1,
  rate numeric not null default 0,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);
grant select, insert, update, delete on public.order_items to anon, authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Public read order_items"   on public.order_items for select using (true);
create policy "Public insert order_items" on public.order_items for insert with check (true);
create policy "Public update order_items" on public.order_items for update using (true) with check (true);
create policy "Public delete order_items" on public.order_items for delete using (true);

-- seed admin / admin
insert into public.users (username, password_hash) values
  ('admin', '$2a$10$Bn.nORhcPA7YuYMKQR0VUeRyTobUrlhSAnUHnHMLGY0RfnZs/Zd26')
on conflict (username) do nothing;
```

Also create the `product-images` Storage bucket (Private) in the new project — Storage > New bucket > name `product-images`.

## 3. Data migration

I can't read your current Lovable Cloud DB directly into your external project. Two options — pick one:

```text
Option A (fastest, recommended):
  1. In the current project's Studio, run SELECT * → "Download CSV" for products, orders, order_items, users.
  2. Drop the CSVs into chat.
  3. I generate INSERT SQL preserving ids + timestamps and you run it in the new project.

Option B:
  Use pg_dump on the current DB → psql restore into the new DB
  (you'd run this locally with both DB URLs; I'll provide the exact commands).
```

The existing in-app "Upload Products" XLSX/CSV importer continues to work against the new project once the env vars are switched — it inserts via the same `products` columns.

## 4. Verification

After the migration runs and env vars are swapped, I'll restart the dev server and walk through:
- Login as `admin` / `admin`
- Products page: list, edit, bulk upload via CSV + XLSX
- New Order: create order, status flows Pending → Confirmed → Delivered
- Archive page restore/delete
- Settings password change

If anything 401s or returns empty, it's almost always (a) missing GRANT to `anon`, (b) RLS policy gap, or (c) types.ts out of date — all addressed above.

## Technical notes

- `client.ts` reads `VITE_SUPABASE_URL/PUBLISHABLE_KEY` at build time, so a dev-server restart is required after `.env` edit.
- `types.ts` will be regenerated against `pafettljahbetggrrbfs` after the schema is in place; until then TS may show stale types but runtime works.
- No edge functions to redeploy — the app uses direct browser → Supabase calls only.
- Existing migrations under `supabase/migrations/` were applied to the old project; they won't auto-run on yours, which is why Section 2 is a single consolidated script.

## What I need from you to proceed
1. Confirm the anon key above is correct (it matches what you pasted).
2. Choose data-migration Option A or B.
3. If Option A, attach the 4 CSV exports.
