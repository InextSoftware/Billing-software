# Plan: Inventory, Material Master, Pieces Rate & New Invoice PDF

## 1. Material Master (`/materials`)
New page to manage items (the "product catalog").
Fields: **Name**, **HSN code**, **Unit of stock** (KG / Ton / Meter / Pieces), **Default rate basis**, **Default rate**, **GSM**, **Width (mm)**, **Opening stock**, **Reorder level**, **Notes**.
CRUD table with search, just like Customers.

## 2. Inventory Management (`/inventory`)
- **Stock ledger** table: every movement (IN/OUT) with material, qty (in stock unit), source (`manual_in`, `manual_adjust`, `invoice_out`), reference (invoice no), date, notes.
- Page shows: current stock per material (KG + Pieces + Meter as applicable), low-stock badges, and a ledger view with filters (material, date range, type).
- "Stock In" dialog to record purchases / receipts.
- "Adjustment" dialog for manual corrections (+/-).
- **Invoice generation → automatic stock-out**: when an invoice is saved, one ledger row per line item is inserted (qty in the material's stock unit). Deleting an invoice reverses the movements.

## 3. Invoice changes
- **Pieces** added as 4th rate basis (KG / Ton / Meter / Pieces). New columns `qty_pcs`, `rate_pcs` on `invoice_items`.
- **Material picker** per row → autofills HSN, GSM, width, default rate. Free-text still allowed.
- **Validation rule**: KG is mandatory on every row regardless of rate basis (since stock & weight tracking require it). Form blocks "Generate Invoice" with clear errors if any row has rate basis = meter/pieces/ton but KG = 0.
- **Stock check**: warn (not block) if the requested qty (in stock unit) exceeds current stock.

## 4. PDF redesign (match Menghani sample)
Rewrite `src/lib/pdf.ts` to a bordered, table-grid layout:
- Top strip: `GSTIN`, `State Code`, "SUBJECT TO <CITY> JURISDICTION", **TAX INVOICE** centered, big bold **Company Name**, tagline, office line.
- Two-column meta block: left = `To` (customer name, address, GSTIN, state code); right grid = Invoice No, Date, Challan No, Order No, Term of Payment, Vehicle No, L/R No, Transport Name, **HSN Code**.
- Despatch line: `We have Despached <qty> <unit> <description>`.
- Items table columns: **Description of Goods | Quantity | Rate | Per | Amount**. Description shows item name (bold) + `SIZE: W x ? x L` + `N PCS`.
- Right-side totals stack: Subtotal, CGST @ x%, SGST @ x%, IGST @ x%, Total, Advance Freight, Insurance @ 0.2%, Round Off, **G. Total**.
- Bottom row: **Net Value | CGST | SGST | IGST | Transit Insurance | Gross Amount**.
- Footer: **Declaration** left, **For <Company> / Authorised Signatory** right.
- Settings → add `jurisdiction`, `state_code`, `tagline`, `office_line`, default `insurance_pct`, toggle `round_off`.

## 5. New invoice meta fields
Add to `invoices`: `challan_no`, `order_no`, `order_date`, `payment_terms`, `lr_no`, `lr_date`, `transport_name`, `hsn_code`, `advance_freight`, `insurance_pct`, `round_off`.

## Technical
- Migration: create `materials`, `stock_movements`; add columns to `invoice_items` (`material_id`, `qty_pcs`, `rate_pcs`) and `invoices` (meta + freight/insurance/round-off); add columns to `company_settings`.
- Trigger or app-layer logic: on `invoice_items` insert → insert `stock_movements` row with negative qty in material's stock unit; on invoice delete → reverse.
- New routes: `/materials`, `/inventory`. Sidebar entries added.
- Queries module gets `useMaterials`, `useStockLedger`, `useStockOnHand`, `useStockIn`, `useStockAdjust`.

## Out of scope (confirm)
- Purchase orders / suppliers (only manual Stock In for now)
- Multi-warehouse
- Batch / lot tracking
