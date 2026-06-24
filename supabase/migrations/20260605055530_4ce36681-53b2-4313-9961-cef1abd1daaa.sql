
-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT,
  gstin TEXT,
  email TEXT,
  address TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access" ON public.customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Company settings (singleton)
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'i next software',
  address TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  home_state TEXT DEFAULT 'Gujarat',
  default_gst_pct NUMERIC NOT NULL DEFAULT 18,
  terms TEXT DEFAULT 'Goods once sold will not be taken back. E.&O.E.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO anon, authenticated;
GRANT ALL ON public.company_settings TO service_role;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access" ON public.company_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.company_settings (company_name) VALUES ('i next software');

-- Invoice counters (per year-month)
CREATE TABLE public.invoice_counters (
  year_month TEXT PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_counters TO anon, authenticated;
GRANT ALL ON public.invoice_counters TO service_role;
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access" ON public.invoice_counters FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Atomic invoice number RPC
CREATE OR REPLACE FUNCTION public.next_invoice_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ym TEXT := to_char(now(), 'YYYYMM');
  next_seq INTEGER;
BEGIN
  INSERT INTO public.invoice_counters (year_month, last_seq)
  VALUES (ym, 1)
  ON CONFLICT (year_month) DO UPDATE SET last_seq = public.invoice_counters.last_seq + 1
  RETURNING last_seq INTO next_seq;
  RETURN 'INV-' || ym || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$;
GRANT EXECUTE ON FUNCTION public.next_invoice_no() TO anon, authenticated;

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  vehicle_no TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  gst_pct NUMERIC NOT NULL DEFAULT 18,
  cgst NUMERIC NOT NULL DEFAULT 0,
  sgst NUMERIC NOT NULL DEFAULT 0,
  igst NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  total_kg NUMERIC NOT NULL DEFAULT 0,
  total_ton NUMERIC NOT NULL DEFAULT 0,
  total_meter NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO anon, authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access" ON public.invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX invoices_date_idx ON public.invoices (invoice_date DESC);
CREATE INDEX invoices_customer_idx ON public.invoices (customer_id);

-- Invoice items
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  paper_type TEXT,
  gsm NUMERIC,
  width_mm NUMERIC,
  length_m NUMERIC,
  qty_rolls NUMERIC,
  weight_kg NUMERIC NOT NULL DEFAULT 0,
  weight_ton NUMERIC NOT NULL DEFAULT 0,
  rate_kg NUMERIC NOT NULL DEFAULT 0,
  rate_ton NUMERIC NOT NULL DEFAULT 0,
  rate_meter NUMERIC NOT NULL DEFAULT 0,
  basis TEXT NOT NULL DEFAULT 'kg',
  amount NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO anon, authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access" ON public.invoice_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX invoice_items_invoice_idx ON public.invoice_items (invoice_id);
