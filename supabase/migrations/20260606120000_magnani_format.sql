-- ===== Magnani-style invoice additions =====

-- Customers: delivery address (separate from billing address, as in Magnani)
ALTER TABLE public.customers
  ADD COLUMN delivery_address TEXT DEFAULT '',
  ADD COLUMN pan TEXT DEFAULT '';

-- Company settings: bank details + signatory + footer (for the "Pagamento / Banca" block)
ALTER TABLE public.company_settings
  ADD COLUMN bank_name TEXT DEFAULT '',
  ADD COLUMN bank_account TEXT DEFAULT '',
  ADD COLUMN bank_branch TEXT DEFAULT '',
  ADD COLUMN ifsc TEXT DEFAULT '',
  ADD COLUMN signatory_name TEXT DEFAULT '',
  ADD COLUMN signatory_designation TEXT DEFAULT '',
  ADD COLUMN pan TEXT DEFAULT '';

-- Invoices: free-text note printed under the items table (analogous to "Note" in Magnani)
ALTER TABLE public.invoices
  ADD COLUMN invoice_notes TEXT DEFAULT '';
