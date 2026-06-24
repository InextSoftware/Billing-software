export type Customer = {
  id: string;
  name: string;
  mobile: string | null;
  gstin: string | null;
  email: string | null;
  address: string | null;
  state: string | null;
  delivery_address: string | null;
  pan: string | null;
  created_at: string;
};

export type UserProfile = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanySettings = {
  id: string;
  company_name: string;
  address: string | null;
  gstin: string | null;
  phone: string | null;
  email: string | null;
  home_state: string | null;
  default_gst_pct: number;
  terms: string | null;
  jurisdiction: string | null;
  state_code: string | null;
  tagline: string | null;
  office_line: string | null;
  default_insurance_pct: number;
  round_off_enabled: boolean;
  default_hsn: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_branch: string | null;
  ifsc: string | null;
  signatory_name: string | null;
  signatory_designation: string | null;
  pan: string | null;
  bill_style: "style1" | "style2" | "style3" | "style4";
  updated_at: string;
};

export type StockUnit = "kg" | "ton" | "meter" | "pcs";
export type RateBasis = "kg" | "ton" | "meter" | "pcs";

export type Material = {
  id: string;
  name: string;
  hsn_code: string | null;
  stock_unit: StockUnit;
  default_basis: RateBasis;
  default_rate: number;
  gsm: number | null;
  width_mm: number | null;
  opening_stock: number;
  reorder_level: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  material_id: string;
  movement_date: string;
  qty: number;
  source: "manual_in" | "manual_adjust" | "invoice_out" | "opening";
  reference: string | null;
  invoice_id: string | null;
  notes: string | null;
  created_at: string;
};

export type StockOnHand = {
  material_id: string;
  name: string;
  stock_unit: StockUnit;
  reorder_level: number;
  on_hand: number;
};

export type InvoiceItem = {
  id?: string;
  invoice_id?: string;
  material_id: string | null;
  paper_type: string | null;
  gsm: number | null;
  width_mm: number | null;
  length_m: number | null;
  qty_rolls: number | null;
  qty_pcs: number | null;
  weight_kg: number;
  weight_ton: number;
  rate_kg: number;
  rate_ton: number;
  rate_meter: number;
  rate_pcs: number;
  basis: RateBasis;
  amount: number;
  sort_order: number;
};

export type Invoice = {
  id: string;
  invoice_no: string;
  invoice_date: string;
  customer_id: string;
  vehicle_no: string | null;
  challan_no: string | null;
  order_no: string | null;
  order_date: string | null;
  payment_terms: string | null;
  lr_no: string | null;
  lr_date: string | null;
  transport_name: string | null;
  hsn_code: string | null;
  subtotal: number;
  gst_pct: number;
  cgst: number;
  sgst: number;
  igst: number;
  advance_freight: number;
  insurance_pct: number;
  round_off: number;
  grand_total: number;
  total_kg: number;
  total_ton: number;
  total_meter: number;
  total_pcs: number;
  notes: string | null;
  invoice_notes: string | null;
  created_at: string;
};
