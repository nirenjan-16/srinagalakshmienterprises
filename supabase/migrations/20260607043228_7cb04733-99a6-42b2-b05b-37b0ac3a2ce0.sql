
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  default_mrp NUMERIC(10,2) NOT NULL DEFAULT 0,
  box_size INTEGER,
  box_mrp NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  to_number TEXT,
  phone TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Pending',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);

CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'Pack' CHECK (unit_type IN ('Pack','Box')),
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update order_items" ON public.order_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete order_items" ON public.order_items FOR DELETE USING (true);

CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_date ON public.orders(order_date);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
