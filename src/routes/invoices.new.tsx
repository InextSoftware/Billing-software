import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useCustomers, useCompanySettings, useCreateInvoice, useSaveCustomer,
  useMaterials, useStockOnHand,
} from "@/lib/queries";
import type { Customer, InvoiceItem, Material, RateBasis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText, AlertTriangle, RotateCcw } from "lucide-react";
import { fmtINR, fmtNum, toNum } from "@/lib/format";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/invoices/new")({
  component: NewInvoicePage,
});

type Row = InvoiceItem & { _key: string };

function emptyRow(i: number): Row {
  return {
    _key: `r${Date.now()}-${i}`,
    material_id: null,
    paper_type: "",
    gsm: null,
    width_mm: null,
    length_m: null,
    qty_rolls: null,
    qty_pcs: null,
    weight_kg: 0,
    weight_ton: 0,
    rate_kg: 0,
    rate_ton: 0,
    rate_meter: 0,
    rate_pcs: 0,
    basis: "kg",
    amount: 0,
    sort_order: i,
  };
}

function NewInvoicePage() {
  const navigate = useNavigate();
  const { data: customers } = useCustomers();
  const { data: company } = useCompanySettings();
  const { data: materials } = useMaterials();
  const { data: onHand } = useStockOnHand();
  const createInv = useCreateInvoice();
  const saveCust = useSaveCustomer();

  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vehicle, setVehicle] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [lrNo, setLrNo] = useState("");
  const [transport, setTransport] = useState("");
  const [hsn, setHsn] = useState("");
  const [advFreight, setAdvFreight] = useState(0);
  const [insurancePct, setInsurancePct] = useState(0);
  const [customerId, setCustomerId] = useState<string>("");
  const [gstPct, setGstPct] = useState(18);
  const [rows, setRows] = useState<Row[]>([emptyRow(0)]);
  const [addOpen, setAddOpen] = useState(false);
  const [newCust, setNewCust] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (company) {
      setGstPct(Number(company.default_gst_pct ?? 18));
      setInsurancePct(Number(company.default_insurance_pct ?? 0));
      setHsn(company.default_hsn ?? "");
    }
  }, [company]);

  const customer = useMemo(() => customers?.find((c) => c.id === customerId) ?? null, [customers, customerId]);
  const stockMap = useMemo(() => {
    const m = new Map<string, number>();
    onHand?.forEach((s) => m.set(s.material_id, Number(s.on_hand)));
    return m;
  }, [onHand]);

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((rs) =>
      rs.map((r) => {
        if (r._key !== key) return r;
        const next: Row = { ...r, ...patch };
        if ("weight_kg" in patch) next.weight_ton = +(toNum(next.weight_kg) / 1000).toFixed(6);
        else if ("weight_ton" in patch) next.weight_kg = +(toNum(next.weight_ton) * 1000).toFixed(3);
        if (next.basis === "kg") next.amount = +(toNum(next.weight_kg) * toNum(next.rate_kg)).toFixed(2);
        else if (next.basis === "ton") next.amount = +(toNum(next.weight_ton) * toNum(next.rate_ton)).toFixed(2);
        else if (next.basis === "meter") next.amount = +(toNum(next.length_m) * toNum(next.rate_meter)).toFixed(2);
        else next.amount = +(toNum(next.qty_pcs) * toNum(next.rate_pcs)).toFixed(2);
        return next;
      }),
    );
  };

  const pickMaterial = (key: string, mat: Material | null) => {
    if (!mat) { updateRow(key, { material_id: null }); return; }
    updateRow(key, {
      material_id: mat.id,
      paper_type: mat.name,
      gsm: mat.gsm,
      width_mm: mat.width_mm,
      basis: mat.default_basis,
      rate_kg: mat.default_basis === "kg" ? Number(mat.default_rate) : 0,
      rate_ton: mat.default_basis === "ton" ? Number(mat.default_rate) : 0,
      rate_meter: mat.default_basis === "meter" ? Number(mat.default_rate) : 0,
      rate_pcs: mat.default_basis === "pcs" ? Number(mat.default_rate) : 0,
    });
  };

  const removeRow = (key: string) => setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r._key !== key)));
  const addRow = () => setRows((rs) => [...rs, emptyRow(rs.length)]);

  const totals = useMemo(() => {
    const subtotal = rows.reduce((s, r) => s + toNum(r.amount), 0);
    const total_kg = rows.reduce((s, r) => s + toNum(r.weight_kg), 0);
    const total_ton = rows.reduce((s, r) => s + toNum(r.weight_ton), 0);
    const total_meter = rows.reduce((s, r) => s + toNum(r.length_m), 0);
    const total_pcs = rows.reduce((s, r) => s + toNum(r.qty_pcs), 0);

    const sameState =
      customer?.state && company?.home_state &&
      customer.state.trim().toLowerCase() === company.home_state.trim().toLowerCase();

    const tax = +(subtotal * (gstPct / 100)).toFixed(2);
    let cgst = 0, sgst = 0, igst = 0;
    if (customer) {
      if (sameState) { cgst = +(tax / 2).toFixed(2); sgst = +(tax - cgst).toFixed(2); }
      else { igst = tax; }
    }
    const insAmt = +((subtotal * (insurancePct || 0)) / 100).toFixed(2);
    const beforeRound = subtotal + cgst + sgst + igst + Number(advFreight || 0) + insAmt;
    // Force round off to nearest whole number as requested
    const rounded = Math.round(beforeRound);
    const round_off = +(rounded - beforeRound).toFixed(2);
    const grand_total = rounded;
    return { subtotal, total_kg, total_ton, total_meter, total_pcs, cgst, sgst, igst, insAmt, round_off, grand_total, sameState };
  }, [rows, gstPct, customer, company, insurancePct, advFreight]);

  const handleAddCustomer = async () => {
    if (!newCust.name?.trim()) { toast.error("Name required"); return; }
    try { await saveCust.mutateAsync(newCust); toast.success("Customer added"); setAddOpen(false); setNewCust({}); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const validate = (): string | null => {
    if (!customerId) return "Select a customer";
    if (!invoiceNo?.trim()) return "Invoice number is required";
    if (totals.subtotal <= 0) return "Add at least one line item with an amount";
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      // KG is mandatory on every row
      if (!r.weight_kg || toNum(r.weight_kg) <= 0) {
        return `Row #${i + 1}: Weight (KG) is required for every item`;
      }
      if (r.basis === "meter" && (!r.length_m || toNum(r.length_m) <= 0)) {
        return `Row #${i + 1}: Length (Meter) required when rating by Meter`;
      }
      if (r.basis === "pcs" && (!r.qty_pcs || toNum(r.qty_pcs) <= 0)) {
        return `Row #${i + 1}: Pieces required when rating by Pieces`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    try {
      const inv = await createInv.mutateAsync({
        invoice_no: invoiceNo,
        invoice_date: date,
        customer_id: customerId,
        vehicle_no: vehicle || null,
        challan_no: challanNo || null,
        order_no: orderNo || null,
        order_date: null,
        payment_terms: paymentTerms || null,
        lr_no: lrNo || null,
        lr_date: null,
        transport_name: transport || null,
        hsn_code: hsn || null,
        gst_pct: gstPct,
        cgst: totals.cgst, sgst: totals.sgst, igst: totals.igst,
        advance_freight: Number(advFreight) || 0,
        insurance_pct: Number(insurancePct) || 0,
        round_off: totals.round_off,
        subtotal: +totals.subtotal.toFixed(2),
        grand_total: totals.grand_total,
        total_kg: +totals.total_kg.toFixed(3),
        total_ton: +totals.total_ton.toFixed(4),
        total_meter: +totals.total_meter.toFixed(2),
        total_pcs: +totals.total_pcs.toFixed(0),
        notes: null,
        invoice_notes: null,
        items: rows.map(({ _key, ...rest }, i) => ({ ...rest, sort_order: i })),
      });
      toast.success(`Invoice ${inv.invoice_no} created`);
      navigate({ to: "/invoices/$id", params: { id: inv.id } });
    } catch (e: any) { toast.error(e.message ?? "Failed to create invoice"); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">New Invoice</h1>
          <p className="text-sm text-muted-foreground">Stock-out is recorded automatically when you generate the invoice.</p>
        </div>
        <Button size="lg" onClick={handleSubmit} disabled={createInv.isPending}>
          <FileText className="h-4 w-4 mr-2" /> Generate Invoice
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Customer & Invoice Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Label>Customer *</Label>
            <div className="flex gap-2">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.state ? ` — ${c.state}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild><Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Name *</Label><Input value={newCust.name ?? ""} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} /></div>
                    <div><Label>Mobile</Label><Input value={newCust.mobile ?? ""} onChange={(e) => setNewCust({ ...newCust, mobile: e.target.value })} /></div>
                    <div><Label>GSTIN</Label><Input value={newCust.gstin ?? ""} onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value.toUpperCase() })} /></div>
                    <div><Label>State</Label><Input value={newCust.state ?? ""} onChange={(e) => setNewCust({ ...newCust, state: e.target.value })} /></div>
                    <div><Label>Email</Label><Input value={newCust.email ?? ""} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} /></div>
                    <div className="col-span-2"><Label>Address</Label><Textarea rows={2} value={newCust.address ?? ""} onChange={(e) => setNewCust({ ...newCust, address: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={handleAddCustomer}>Save</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {customer && (
              <p className="text-xs text-muted-foreground mt-1">
                {customer.address && <>{customer.address} • </>}
                {customer.state && <>State: {customer.state} • </>}
                GST: {totals.sameState ? "CGST+SGST" : "IGST"}
              </p>
            )}
          </div>
          <div>
            <Label>Invoice No</Label>
            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Enter invoice number" />
          </div>
          <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Challan No</Label><Input value={challanNo} onChange={(e) => setChallanNo(e.target.value)} /></div>
          <div><Label>Order No</Label><Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} /></div>
          <div><Label>Payment Terms</Label><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 30 Days" /></div>
          <div><Label>Vehicle No</Label><Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. CG 04 MJ 3039" /></div>
          <div><Label>L/R No</Label><Input value={lrNo} onChange={(e) => setLrNo(e.target.value)} /></div>
          <div><Label>Transport Name</Label><Input value={transport} onChange={(e) => setTransport(e.target.value)} /></div>
          <div><Label>HSN Code</Label><Input value={hsn} onChange={(e) => setHsn(e.target.value)} /></div>
          <div><Label>GST %</Label><Input type="number" step="0.01" value={gstPct} onChange={(e) => setGstPct(toNum(e.target.value))} /></div>
          <div><Label>Insurance %</Label><Input type="number" step="0.01" value={insurancePct} onChange={(e) => setInsurancePct(toNum(e.target.value))} /></div>
          <div><Label>Advance Freight</Label><Input type="number" step="0.01" value={advFreight} onChange={(e) => setAdvFreight(toNum(e.target.value))} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1" /> Add Row</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((r, i) => {
            const mat = materials?.find((m) => m.id === r.material_id) ?? null;
            const stock = r.material_id ? stockMap.get(r.material_id) ?? 0 : null;
            const used =
              mat?.stock_unit === "kg" ? toNum(r.weight_kg) :
              mat?.stock_unit === "ton" ? toNum(r.weight_ton) :
              mat?.stock_unit === "meter" ? toNum(r.length_m) :
              mat?.stock_unit === "pcs" ? toNum(r.qty_pcs) : 0;
            const lowStock = stock !== null && used > 0 && used > stock;
            return (
              <div key={r._key} className="rounded-lg border p-4 space-y-3 bg-card">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-medium">Item #{i + 1}</span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-64">
                      <Select value={r.material_id ?? "_free"} onValueChange={(v) => pickMaterial(r._key, v === "_free" ? null : (materials?.find(m => m.id === v) ?? null))}>
                        <SelectTrigger><SelectValue placeholder="Pick material…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_free">— Free text —</SelectItem>
                          {materials?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} ({fmtNum(stockMap.get(m.id) ?? 0, 2)} {m.stock_unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Select value={r.basis} onValueChange={(v) => updateRow(r._key, { basis: v as RateBasis })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Rate by KG</SelectItem>
                        <SelectItem value="ton">Rate by Ton</SelectItem>
                        <SelectItem value="meter">Rate by Meter</SelectItem>
                        <SelectItem value="pcs">Rate by Pieces</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeRow(r._key)} disabled={rows.length === 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {lowStock && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 rounded px-2 py-1">
                    <AlertTriangle className="h-3 w-3" />
                    Requested {fmtNum(used, 2)} {mat?.stock_unit} but only {fmtNum(stock ?? 0, 2)} in stock.
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div><Label className="text-xs">Paper Type</Label><Input value={r.paper_type ?? ""} onChange={(e) => updateRow(r._key, { paper_type: e.target.value })} placeholder="Kraft, Core Pipe…" /></div>
                  <div><Label className="text-xs">GSM</Label><Input type="number" value={r.gsm ?? ""} onChange={(e) => updateRow(r._key, { gsm: e.target.value === "" ? null : toNum(e.target.value) })} /></div>
                  <div><Label className="text-xs">Width (mm)</Label><Input type="number" value={r.width_mm ?? ""} onChange={(e) => updateRow(r._key, { width_mm: e.target.value === "" ? null : toNum(e.target.value) })} /></div>
                  <div><Label className="text-xs">Length (m)</Label><Input type="number" step="0.01" value={r.length_m ?? ""} onChange={(e) => updateRow(r._key, { length_m: e.target.value === "" ? null : toNum(e.target.value) })} /></div>
                  <div><Label className="text-xs">Qty (Pieces)</Label><Input type="number" value={r.qty_pcs ?? ""} onChange={(e) => updateRow(r._key, { qty_pcs: e.target.value === "" ? null : toNum(e.target.value) })} /></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div>
                    <Label className="text-xs">Weight (KG) *</Label>
                    <Input type="number" step="0.001" value={r.weight_kg || ""} onChange={(e) => updateRow(r._key, { weight_kg: toNum(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="text-xs">Weight (Ton)</Label>
                    <Input type="number" step="0.0001" value={r.weight_ton || ""} onChange={(e) => updateRow(r._key, { weight_ton: toNum(e.target.value) })} />
                  </div>
                  <div className={r.basis === "kg" ? "" : "opacity-50"}>
                    <Label className="text-xs">Rate / KG</Label>
                    <Input type="number" step="0.01" value={r.rate_kg || ""} onChange={(e) => updateRow(r._key, { rate_kg: toNum(e.target.value) })} />
                  </div>
                  <div className={r.basis === "ton" ? "" : "opacity-50"}>
                    <Label className="text-xs">Rate / Ton</Label>
                    <Input type="number" step="0.01" value={r.rate_ton || ""} onChange={(e) => updateRow(r._key, { rate_ton: toNum(e.target.value) })} />
                  </div>
                  <div className={r.basis === "meter" ? "" : "opacity-50"}>
                    <Label className="text-xs">Rate / Meter</Label>
                    <Input type="number" step="0.01" value={r.rate_meter || ""} onChange={(e) => updateRow(r._key, { rate_meter: toNum(e.target.value) })} />
                  </div>
                  <div className={r.basis === "pcs" ? "" : "opacity-50"}>
                    <Label className="text-xs">Rate / Piece</Label>
                    <Input type="number" step="0.01" value={r.rate_pcs || ""} onChange={(e) => updateRow(r._key, { rate_pcs: toNum(e.target.value) })} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="text-lg font-semibold">{fmtINR(r.amount)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Charges</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Insurance %</Label><Input type="number" step="0.01" value={insurancePct} onChange={(e) => setInsurancePct(toNum(e.target.value))} /></div>
          <div><Label>Advance Freight</Label><Input type="number" step="0.01" value={advFreight} onChange={(e) => setAdvFreight(toNum(e.target.value))} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total KG</span><span className="font-medium">{fmtNum(totals.total_kg, 3)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Ton</span><span className="font-medium">{fmtNum(totals.total_ton, 4)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Meter</span><span className="font-medium">{fmtNum(totals.total_meter, 2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Pieces</span><span className="font-medium">{fmtNum(totals.total_pcs, 0)}</span></div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{fmtINR(totals.subtotal)}</span></div>
            {totals.cgst > 0 && <div className="flex justify-between"><span className="text-muted-foreground">CGST ({gstPct / 2}%)</span><span>{fmtINR(totals.cgst)}</span></div>}
            {totals.sgst > 0 && <div className="flex justify-between"><span className="text-muted-foreground">SGST ({gstPct / 2}%)</span><span>{fmtINR(totals.sgst)}</span></div>}
            {totals.igst > 0 && <div className="flex justify-between"><span className="text-muted-foreground">IGST ({gstPct}%)</span><span>{fmtINR(totals.igst)}</span></div>}
            {advFreight > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Advance Freight</span><span>{fmtINR(advFreight)}</span></div>}
            {totals.insAmt > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Insurance ({insurancePct}%)</span><span>{fmtINR(totals.insAmt)}</span></div>}
            {totals.round_off !== 0 && <div className="flex justify-between"><span className="text-muted-foreground">Round Off</span><span>{fmtINR(totals.round_off)}</span></div>}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Grand Total</span><span>{fmtINR(totals.grand_total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
