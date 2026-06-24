
-- ===== Materials =====
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hsn_code TEXT,
  stock_unit TEXT NOT NULL DEFAULT 'kg' CHECK (stock_unit IN ('kg','ton','meter','pcs')),
  default_basis TEXT NOT NULL DEFAULT 'kg' CHECK (default_basis IN ('kg','ton','meter','pcs')),
  default_rate NUMERIC NOT NULL DEFAULT 0,
  gsm NUMERIC,
  width_mm NUMERIC,
  opening_stock NUMERIC NOT NULL DEFAULT 0,
  reorder_level NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO anon, authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access" ON public.materials FOR ALL USING (true) WITH CHECK (true);

-- ===== Stock movements =====
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  qty NUMERIC NOT NULL,  -- positive = IN, negative = OUT (in material.stock_unit)
  source TEXT NOT NULL CHECK (source IN ('manual_in','manual_adjust','invoice_out','opening')),
  reference TEXT,
  invoice_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO anon, authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_stock_mov_material ON public.stock_movements(material_id);
CREATE INDEX idx_stock_mov_invoice ON public.stock_movements(invoice_id);

-- ===== Invoice items: add material link + pieces =====
ALTER TABLE public.invoice_items
  ADD COLUMN material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  ADD COLUMN qty_pcs NUMERIC,
  ADD COLUMN rate_pcs NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_basis_check;
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_basis_check
  CHECK (basis IN ('kg','ton','meter','pcs'));

-- ===== Invoices: extra meta =====
ALTER TABLE public.invoices
  ADD COLUMN challan_no TEXT,
  ADD COLUMN order_no TEXT,
  ADD COLUMN order_date DATE,
  ADD COLUMN payment_terms TEXT,
  ADD COLUMN lr_no TEXT,
  ADD COLUMN lr_date DATE,
  ADD COLUMN transport_name TEXT,
  ADD COLUMN hsn_code TEXT,
  ADD COLUMN advance_freight NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN insurance_pct NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN round_off NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN total_pcs NUMERIC NOT NULL DEFAULT 0;

-- ===== Company settings: branding for new PDF =====
ALTER TABLE public.company_settings
  ADD COLUMN jurisdiction TEXT DEFAULT 'Raipur',
  ADD COLUMN state_code TEXT DEFAULT '22',
  ADD COLUMN tagline TEXT DEFAULT '',
  ADD COLUMN office_line TEXT DEFAULT '',
  ADD COLUMN default_insurance_pct NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN round_off_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN default_hsn TEXT DEFAULT '';

-- ===== updated_at trigger for materials =====
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Auto stock-out / reverse =====
CREATE OR REPLACE FUNCTION public.invoice_item_stock_out()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m RECORD;
  out_qty NUMERIC;
  inv_no TEXT;
  inv_date DATE;
BEGIN
  IF NEW.material_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO m FROM public.materials WHERE id = NEW.material_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  -- pick qty in material's stock unit
  IF m.stock_unit = 'kg' THEN out_qty := COALESCE(NEW.weight_kg,0);
  ELSIF m.stock_unit = 'ton' THEN out_qty := COALESCE(NEW.weight_ton,0);
  ELSIF m.stock_unit = 'meter' THEN out_qty := COALESCE(NEW.length_m,0);
  ELSIF m.stock_unit = 'pcs' THEN out_qty := COALESCE(NEW.qty_pcs, NEW.qty_rolls, 0);
  END IF;
  IF out_qty IS NULL OR out_qty = 0 THEN RETURN NEW; END IF;

  SELECT invoice_no, invoice_date INTO inv_no, inv_date FROM public.invoices WHERE id = NEW.invoice_id;
  INSERT INTO public.stock_movements(material_id, movement_date, qty, source, reference, invoice_id)
  VALUES (NEW.material_id, COALESCE(inv_date, CURRENT_DATE), -out_qty, 'invoice_out', inv_no, NEW.invoice_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_invoice_item_stock_out
AFTER INSERT ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.invoice_item_stock_out();

CREATE OR REPLACE FUNCTION public.invoice_item_stock_reverse()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.stock_movements WHERE invoice_id = OLD.invoice_id AND source = 'invoice_out';
  RETURN OLD;
END; $$;

CREATE TRIGGER trg_invoice_item_stock_reverse
AFTER DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.invoice_item_stock_reverse();

-- ===== Opening stock helper: when material created with opening_stock > 0 =====
CREATE OR REPLACE FUNCTION public.material_opening_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.opening_stock IS NOT NULL AND NEW.opening_stock <> 0 THEN
    INSERT INTO public.stock_movements(material_id, qty, source, notes)
    VALUES (NEW.id, NEW.opening_stock, 'opening', 'Opening stock');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_material_opening_stock
AFTER INSERT ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.material_opening_stock();

-- ===== View: stock on hand =====
CREATE OR REPLACE VIEW public.stock_on_hand AS
SELECT m.id AS material_id,
       m.name,
       m.stock_unit,
       m.reorder_level,
       COALESCE(SUM(sm.qty), 0) AS on_hand
FROM public.materials m
LEFT JOIN public.stock_movements sm ON sm.material_id = m.id
GROUP BY m.id, m.name, m.stock_unit, m.reorder_level;

GRANT SELECT ON public.stock_on_hand TO anon, authenticated, service_role;
