import * as XLSX from "xlsx";
import type { Customer, CompanySettings, Invoice, InvoiceItem } from "./types";
import { fmtNum, amountInWords } from "./format";

type InvoiceItemWithMaterial = InvoiceItem & {
  materials?: { name?: string | null };
};

type Args = {
  company: CompanySettings;
  customer: Customer;
  invoice: Invoice;
  items: InvoiceItemWithMaterial[];
};

export function downloadInvoiceExcel(args: Args) {
  const { company, customer, invoice, items } = args;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);

  // Granular column structure for maximum layout control
  ws["!cols"] = [
    { wch: 8 },  // A
    { wch: 15 }, // B
    { wch: 15 }, // C
    { wch: 15 }, // D
    { wch: 15 }, // E
    { wch: 12 }, // F
    { wch: 8 },  // G
    { wch: 12 }, // H
  ];

  const data: any[][] = [];
  const merges: XLSX.Range[] = [];

  const addRow = (row: any[]) => data.push(row);
  const addMergedRow = (row: any[], startCol: number, endCol: number) => {
    const rowIdx = data.length;
    data.push(row);
    merges.push({ s: { r: rowIdx, c: startCol }, e: { r: rowIdx, c: endCol } });
  };

  const fmtD = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB").replace(/\//g,'.') : "-";

  // --- 1. TOP STRIP (GSTIN, JURISDICTION, ORIGINAL) ---
  addRow(["GSTIN : " + (company.gstin || ""), "", "", "SUBJECT TO " + (company.jurisdiction || "").toUpperCase() + " JURISDICTION", "", "", "", "ORIGINAL"]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }); // GSTIN
  merges.push({ s: { r: 0, c: 3 }, e: { r: 0, c: 5 } }); // JURISDICTION
  addRow(["State Code : " + (company.state_code || "")]);
  addRow([]);

  // --- 2. MAIN HEADER ---
  addMergedRow(["TAX INVOICE"], 0, 7);
  addMergedRow([company.company_name.toUpperCase()], 0, 7);
  addMergedRow(["Mfg. : " + (company.tagline || "")], 0, 7);
  addMergedRow([company.office_line || ""], 0, 7);
  addRow([]);

  // --- 3. BILLING & INVOICE META (Side-by-Side) ---
  const metaRows = [
    ["To,", "", "", "", "Invoice No.", invoice.invoice_no, "Date :", fmtD(invoice.invoice_date)],
    [customer.name.toUpperCase(), "", "", "", "Challan No.", invoice.challan_no || "-", "Date :", fmtD(invoice.invoice_date)],
    [customer.address || "", "", "", "", "Order No. & Date :", invoice.order_no || "-", "", ""],
    ["", "", "", "", "Term of Payment :", invoice.payment_terms || "-", "", ""],
    ["GSTIN : " + (customer.gstin || ""), "", "", "", "Vehicle No. :", (invoice.vehicle_no || "").toUpperCase(), "", ""],
    ["State Code : " + (company.state_code || "22"), "", "", "", "LR. No.", invoice.lr_no || "-", "Date :", fmtD(invoice.lr_date)],
    ["", "", "", "", "Transport Name :", (invoice.transport_name || "").toUpperCase(), "", ""],
    ["", "", "", "", "HSN Code :", invoice.hsn_code || company.default_hsn || "-", "", ""],
  ];

  metaRows.forEach((row, i) => {
    addRow(row);
    merges.push({ s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 3 } }); // Customer Info merge
    merges.push({ s: { r: data.length - 1, c: 4 }, e: { r: data.length - 1, c: 4 } }); // Meta Label
    merges.push({ s: { r: data.length - 1, c: 5 }, e: { r: data.length - 1, c: 5 } }); // Meta Value
  });
  addRow([]);

  // --- 4. DESPATCH STRIP ---
  const firstItem = items[0];
  const um = firstItem ? (firstItem.basis === "kg" ? "KG" : firstItem.basis === "ton" ? "MT" : firstItem.basis === "meter" ? "MTR" : "PCS") : "";
  const qty = firstItem ? (firstItem.basis === "kg" ? firstItem.weight_kg : firstItem.basis === "ton" ? firstItem.weight_ton : firstItem.basis === "meter" ? (firstItem.length_m ?? 0) : (firstItem.qty_pcs ?? 0)) : 0;
  
  addMergedRow([`We have Despatched ${fmtNum(qty)} ${um} ${firstItem?.paper_type || ""}`], 0, 7);
  addRow([`Freight : Rs. 00.00`, "", `Advance Freight : Rs. ${fmtNum(invoice.advance_freight)}`, "", "", "", "", `Balance Freight : Rs. 00.00`]);
  merges.push({ s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 1 } });
  merges.push({ s: { r: data.length - 1, c: 2 }, e: { r: data.length - 1, c: 4 } });
  merges.push({ s: { r: data.length - 1, c: 5 }, e: { r: data.length - 1, c: 7 } });
  addRow([]);

  // --- 5. ITEMS TABLE ---
  addRow(["Description of Goods", "", "", "", "Quantity", "Rate", "Per", "Amount"]);
  merges.push({ s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 3 } });
  
  items.forEach((it) => {
    const paperType = (it.paper_type || it.materials?.name || "N/A").toUpperCase();
    const itemUm = it.basis === "kg" ? "KG" : it.basis === "ton" ? "MT" : it.basis === "meter" ? "MTR" : "PCS";
    const itemQty = it.basis === "kg" ? it.weight_kg : it.basis === "ton" ? it.weight_ton : it.basis === "meter" ? (it.length_m ?? 0) : (it.qty_pcs ?? 0);
    const itemRate = it.basis === "kg" ? it.rate_kg : it.basis === "ton" ? it.rate_ton : it.basis === "meter" ? it.rate_meter : it.rate_pcs;
    
    // Description can be multi-line in Excel if we were using a more advanced library, 
    // here we'll just put the main info.
    const desc = paperType + " " + (it.gsm ? it.gsm + " GSM" : "");
    addRow([desc, "", "", "", fmtNum(itemQty) + " " + itemUm, fmtNum(itemRate), itemUm + "s", fmtNum(it.amount)]);
    merges.push({ s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 3 } });
  });
  addRow([]);

  // --- 6. TOTAL WEIGHT ---
  addMergedRow([`Total Weight = ${fmtNum(invoice.total_kg, 2)} KGS`], 0, 7);
  addRow([]);

  // --- 7. TOTALS & WORDS (Side-by-Side) ---
  const totalRows = [
    ["Amount In Word :", "", "", "", `CGST @ ${invoice.gst_pct / 2}%`, "", "", fmtNum(invoice.cgst)],
    [("RS. " + amountInWords(invoice.grand_total).replace('Rupees ','').toUpperCase() + " ONLY."), "", "", "", `SGST @ ${invoice.gst_pct / 2}%`, "", "", fmtNum(invoice.sgst)],
    ["", "", "", "", `IGST @ ${invoice.gst_pct}%`, "", "", fmtNum(invoice.igst)],
    ["", "", "", "", "TOTAL", "", "", fmtNum(invoice.subtotal + invoice.cgst + invoice.sgst + invoice.igst)],
    ["", "", "", "", `INSURANCE @ ${invoice.insurance_pct}%`, "", "", fmtNum((invoice.subtotal * invoice.insurance_pct) / 100)],
    ["", "", "", "", "Round Off", "", "", fmtNum(invoice.round_off)],
    ["", "", "", "", "G. Total", "", "", fmtNum(invoice.grand_total)],
  ];

  totalRows.forEach((row, i) => {
    addRow(row);
    merges.push({ s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 3 } }); // Word Section merge
    merges.push({ s: { r: data.length - 1, c: 4 }, e: { r: data.length - 1, c: 6 } }); // Totals Label merge
  });
  addRow([]);

  // --- 8. GST SUMMARY BAND ---
  addRow(["Net Value", "CGST", "SGST", "IGST", "Transit Insurance", "", "", "Gross Amount"]);
  merges.push({ s: { r: data.length - 1, c: 4 }, e: { r: data.length - 1, c: 6 } });
  
  addRow([
    fmtNum(invoice.subtotal), 
    fmtNum(invoice.cgst), 
    fmtNum(invoice.sgst), 
    fmtNum(invoice.igst), 
    fmtNum((invoice.subtotal * invoice.insurance_pct) / 100), 
    "", "", 
    fmtNum(invoice.grand_total)
  ]);
  merges.push({ s: { r: data.length - 1, c: 4 }, e: { r: data.length - 1, c: 6 } });
  addRow([]);

  // --- 9. FOOTER ---
  addRow(["Declaration:", "", "", "", "", "For, " + company.company_name]);
  merges.push({ s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 4 } });
  merges.push({ s: { r: data.length - 1, c: 5 }, e: { r: data.length - 1, c: 7 } });
  
  addRow(["We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct."]);
  merges.push({ s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 4 } });
  addRow([]);
  addRow([]);
  addRow(["", "", "", "", "", "", "Autorised Signatory"]);
  merges.push({ s: { r: data.length - 1, c: 6 }, e: { r: data.length - 1, c: 7 } });

  XLSX.utils.sheet_add_aoa(ws, data);
  ws["!merges"] = merges;

  XLSX.utils.book_append_sheet(wb, ws, "Invoice");
  XLSX.writeFile(wb, `${invoice.invoice_no}.xlsx`);
}
