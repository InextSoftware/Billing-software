import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Customer, CompanySettings, Invoice, InvoiceItem } from "./types";
import { amountInWords, fmtNum } from "./format";

type InvoiceItemWithMaterial = InvoiceItem & {
  materials?: { name?: string | null };
};

type Args = {
  company: CompanySettings;
  customer: Customer;
  invoice: Invoice;
  items: InvoiceItemWithMaterial[];
};

const RUPEE = "Rs.";

export function buildInvoicePdf(args: Args): jsPDF {
  const { company, customer, invoice, items } = args;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 24;
  const innerW = W - 2 * M;
  const safeText = (s: string | null | undefined) => (s == null ? "" : String(s));

  // Outer border
  doc.setLineWidth(1);
  doc.setDrawColor(0);
  doc.rect(M, M, innerW, H - 2 * M);

  let y = M;

  // 1. Top Strip
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(
    "SUBJECT TO " + safeText(company.jurisdiction).toUpperCase() + " JURISDICTION",
    W / 2, y + 12, { align: "center" }
  );
  if (company.gstin) {
    doc.text("GSTIN : " + company.gstin, M + 6, y + 12);
  }
  if (company.state_code) {
    doc.text("State Code : " + company.state_code, M + 6, y + 22);
  }
  doc.setFont("helvetica", "normal");
  doc.text("ORIGINAL", W - M - 6, y + 12, { align: "right" });
  
  y += 28;
  doc.line(M, y, M + innerW, y);

  // 2. Main Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TAX INVOICE", W / 2, y + 14, { align: "center" });
  y += 20;

  doc.setFontSize(26);
  doc.setFont("times", "bold");
  doc.text(safeText(company.company_name).toUpperCase(), W / 2, y + 22, { align: "center" });
  y += 28;
  
  // Double line
  doc.setLineWidth(0.5);
  doc.line(M + 40, y, W - M - 40, y);
  doc.line(M + 40, y + 2, W - M - 40, y + 2);
  y += 12;

  if (company.tagline) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bolditalic");
    doc.text("Mfg. : " + safeText(company.tagline), W / 2, y, { align: "center" });
    y += 14;
  }

  if (company.office_line) {
    doc.setLineWidth(1);
    doc.line(M, y, M + innerW, y);
    y += 12;
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(9);
    doc.text(safeText(company.office_line), W / 2, y, { align: "center" });
    y += 12;
  }

  y += 4;
  doc.line(M, y, M + innerW, y);

  // 3. Billing & Invoice Meta
  const headerH = 160;
  const leftW = innerW * 0.55;
  doc.line(M + leftW, y, M + leftW, y + headerH);

  // Bill To
  let ly = y + 14;
  doc.setFontSize(10);
  doc.text("To,", M + 8, ly); ly += 14;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(safeText(customer.name).toUpperCase(), M + 8, ly); ly += 16;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (customer.address) {
    const lines = doc.splitTextToSize(customer.address, leftW - 16);
    doc.text(lines, M + 8, ly);
    ly += lines.length * 11;
  }
  ly += 4;
  doc.setFont("helvetica", "bold");
  doc.text("GSTIN : " + (customer.gstin || "-") + "   State Code : " + (company.state_code || "22"), M + 8, ly);

  // Invoice Meta Box (Right)
  let ry = y;
  const metaColW = (innerW - leftW);
  const col1 = leftW + 8;
  const col2 = leftW + 90;
  const col3 = leftW + 140;
  const col4 = leftW + 180;

  const drawRow = (label1: string, val1: string, label2?: string, val2?: string, height = 20) => {
     doc.setFontSize(8); doc.setFont("helvetica", "bold");
     doc.text(label1, M + col1, ry + height/2 + 3);
     if(label2) doc.text(label2, M + col3, ry + height/2 + 3);
     
     doc.setFontSize(10); doc.setFont("helvetica", "bold");
     doc.text(val1, M + col2, ry + height/2 + 3, { align: "center" });
     if(val2) doc.text(val2, M + col4, ry + height/2 + 3);
     
     ry += height;
     doc.line(M + leftW, ry, M + innerW, ry);
     // vertical dividers in meta box
     doc.line(M + col2 - 10, ry - height, M + col2 - 10, ry);
     doc.line(M + col3 - 10, ry - height, M + col3 - 10, ry);
     doc.line(M + col4 - 10, ry - height, M + col4 - 10, ry);
  };

  const fmtD = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB").replace(/\//g,'.') : "-";

  drawRow("Invoice No.", invoice.invoice_no, "Date :", fmtD(invoice.invoice_date));
  drawRow("Challan No.", invoice.challan_no || "-", "Date :", fmtD(invoice.invoice_date));
  
  // rows with single value
  const drawWideRow = (label: string, val: string, height = 20, isBig = false) => {
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text(label, M + col1, ry + height/2 + 3);
    doc.setFontSize(isBig ? 14 : 10); doc.setFont("helvetica", isBig ? "black" : "bold");
    doc.text(val, M + col2 + 40, ry + height/2 + (isBig ? 5 : 3), { align: "center" });
    ry += height;
    doc.line(M + leftW, ry, M + innerW, ry);
    doc.line(M + col2 - 10, ry - height, M + col2 - 10, ry);
  };

  drawWideRow("Order No. & Date :", invoice.order_no || "-");
  drawWideRow("Term of Payment :", invoice.payment_terms || "-");
  drawWideRow("Vehicle No. :", (invoice.vehicle_no || "-").toUpperCase());
  
  // LR row
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("LR. No.", M + col1, ry + 13);
  doc.text("Date :", M + col3, ry + 13);
  doc.setFontSize(10);
  doc.text(invoice.lr_no || "-", M + col2, ry + 13, { align: "center" });
  doc.text(fmtD(invoice.lr_date), M + col4, ry + 13);
  ry += 20;
  doc.line(M + leftW, ry, M + innerW, ry);
  doc.line(M + col2 - 10, ry - 20, M + col2 - 10, ry);
  doc.line(M + col3 - 10, ry - 20, M + col3 - 10, ry);
  doc.line(M + col4 - 10, ry - 20, M + col4 - 10, ry);

  drawWideRow("Transport Name :", (invoice.transport_name || "-").toUpperCase());
  drawWideRow("HSN Code :", invoice.hsn_code || company.default_hsn || "-", 20, true);

  y += headerH;
  doc.line(M, y, M + innerW, y);

  // 4. Despatch Strip
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  const firstItem = items[0];
  const despatchText = firstItem 
    ? `We have Despatched ${fmtNum(firstItem.basis === 'kg' ? firstItem.weight_kg : firstItem.basis === 'ton' ? firstItem.weight_ton : firstItem.basis === 'meter' ? (firstItem.length_m ?? 0) : (firstItem.qty_pcs ?? 0))} ${firstItem.basis.toUpperCase()} ${firstItem.paper_type || firstItem.materials?.name || ''}`
    : "-";
  doc.text(despatchText, M + 8, y + 14);
  y += 22;
  doc.line(M, y, M + innerW, y);
  
  doc.text(`Freight : Rs. 0.00`, M + 8, y + 12);
  doc.text(`Advance Freight : Rs. ${fmtNum(invoice.advance_freight)}`, W/2, y + 12, { align: "center" });
  doc.text(`Balance Freight : Rs. 0.00`, W - M - 8, y + 12, { align: "right" });
  y += 18;
  doc.line(M, y, M + innerW, y);

  // 5. Items Table
  const head = [["Description of Goods", "Quantity", "Rate", "Per", "Amount"]];
  const body = items.map((it) => {
    const paperType = (it.paper_type || it.materials?.name || "N/A").toUpperCase();
    const um = it.basis === "kg" ? "KG" : it.basis === "ton" ? "MT" : it.basis === "meter" ? "MTR" : "PCS";
    const qty = it.basis === "kg" ? fmtNum(it.weight_kg, 3) : it.basis === "ton" ? fmtNum(it.weight_ton, 4) : it.basis === "meter" ? fmtNum(it.length_m ?? 0, 2) : fmtNum(it.qty_pcs ?? 0, 0);
    const rate = it.basis === "kg" ? it.rate_kg : it.basis === "ton" ? it.rate_ton : it.basis === "meter" ? it.rate_meter : it.rate_pcs;
    const desc = paperType + "\n\n" + [
      it.gsm && `${it.gsm} GSM`,
      [
        it.width_mm && `SIZE : ${it.width_mm} MM`,
        it.length_m && `${it.length_m} MTR`,
        it.qty_pcs && `${it.qty_pcs} PCS`
      ].filter(Boolean).join(" X ")
    ].filter(Boolean).join(", ") + `\n\n= ${qty} ${um}`;
    
    return [
      { content: desc, styles: { halign: 'left', fontStyle: 'bold' } },
      { content: qty + " " + um, styles: { halign: 'center', fontStyle: 'bold', fontSize: 11, cellPadding: { top: 40 } } },
      { content: fmtNum(rate, 2), styles: { halign: 'center', fontStyle: 'bold', fontSize: 11, cellPadding: { top: 40 } } },
      { content: um + "s", styles: { halign: 'center', fontStyle: 'bold', cellPadding: { top: 40 } } },
      { content: fmtNum(it.amount, 2), styles: { halign: 'right', fontStyle: 'bold', fontSize: 11, cellPadding: { top: 40 } } }
    ] as any;
  });

  autoTable(doc, {
    head, body: body as any[], startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 8, lineColor: 0, lineWidth: 0.5, textColor: 0, font: "helvetica" },
    headStyles: { fillColor: 255, textColor: 0, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 70 },
      2: { cellWidth: 60 },
      3: { cellWidth: 40 },
      4: { cellWidth: 80 },
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY;
  
  // Total Weight row
  doc.setLineWidth(0.5);
  doc.line(M, finalY, M + innerW, finalY);
  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(`Total Weight = ${fmtNum(invoice.total_kg, 2)} KGS`, M + innerW * 0.3, finalY + 14, { align: "center" });
  finalY += 20;
  doc.line(M, finalY, M + innerW, finalY);

  // 6. Totals Section
  const totalBoxW = 180;
  const leftColW = innerW - totalBoxW;
  
  // vertical line for totals
  doc.line(M + leftColW, finalY, M + leftColW, finalY + 140);

  let ty = finalY;
  const sameState = customer.state && company.home_state && customer.state.trim().toLowerCase() === company.home_state.trim().toLowerCase();
  
  const drawTotalRow = (label: string, val: number, isLast = false, isBold = false) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal"); doc.setFontSize(isBold ? 11 : 9);
    doc.text(label, M + leftColW + 6, ty + 14);
    doc.text(fmtNum(val, 2), M + innerW - 6, ty + 14, { align: "right" });
    ty += 20;
    if(!isLast) doc.line(M + leftColW, ty, M + innerW, ty);
  };

  drawTotalRow(`CGST @ ${invoice.gst_pct / 2}%`, invoice.cgst);
  drawTotalRow(`SGST @ ${invoice.gst_pct / 2}%`, invoice.sgst);
  drawTotalRow(`IGST @ ${invoice.gst_pct}%`, invoice.igst);
  doc.setFont("helvetica", "bold");
  drawTotalRow(`TOTAL`, invoice.subtotal + invoice.cgst + invoice.sgst + invoice.igst, false, true);
  drawTotalRow(`INSURANCE @ ${invoice.insurance_pct}%`, (invoice.subtotal * invoice.insurance_pct) / 100);
  drawTotalRow(`Round Off`, invoice.round_off);
  
  // Grand Total highlight
  doc.setFillColor(240, 240, 240);
  doc.rect(M + leftColW, ty, totalBoxW, 20, "F");
  drawTotalRow(`G. Total`, invoice.grand_total, true, true);
  doc.line(M + leftColW, ty, M + innerW, ty);

  // Amount in words (on the left of totals)
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Amount In Word :", M + 8, finalY + 20);
  doc.setFontSize(10); doc.setFont("helvetica", "black");
  const words = ("RS. " + amountInWords(invoice.grand_total).replace('Rupees ','').toUpperCase() + " ONLY.");
  const wordsLines = doc.splitTextToSize(words, leftColW - 16);
  doc.text(wordsLines, M + 8, finalY + 34);

  finalY = ty;
  doc.line(M, finalY, M + innerW, finalY);

  // 7. GST Summary Band
  const by = finalY + 10;
  const bandCols = ["Net Value", "CGST", "SGST", "IGST", "Transit Insurance", "Gross Amount"];
  const bandVals = [fmtNum(invoice.subtotal, 2), fmtNum(invoice.cgst, 2), fmtNum(invoice.sgst, 2), fmtNum(invoice.igst, 2), fmtNum((invoice.subtotal * invoice.insurance_pct) / 100, 2), fmtNum(invoice.grand_total, 2)];
  const bw = innerW / 6;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(M, by, innerW, 15, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  for(let i=0; i<6; i++) {
    doc.text(bandCols[i], M + i*bw + bw/2, by + 10, { align: "center" });
    doc.text(bandVals[i], M + i*bw + bw/2, by + 25, { align: "center" });
    if(i < 5) doc.line(M + (i+1)*bw, by, M + (i+1)*bw, by + 30);
  }
  doc.line(M, by, M + innerW, by);
  doc.line(M, by + 15, M + innerW, by + 15);
  doc.line(M, by + 30, M + innerW, by + 30);

  // 8. Footer
  const fy = by + 45;
  doc.setFontSize(9); doc.setFont("helvetica", "bolditalic"); doc.text("Declaration:", M + 6, fy);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  const declLines = doc.splitTextToSize("We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.", innerW * 0.6);
  doc.text(declLines, M + 6, fy + 12);
  
  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("For, " + company.company_name, M + innerW - 6, fy + 10, { align: "right" });
  doc.text("Autorised Signatory", M + innerW - 40, H - M - 25, { align: "center" });

  return doc;
}

export function downloadInvoicePdf(args: Args) {
  const doc = buildInvoicePdf(args);
  doc.save(`${args.invoice.invoice_no}.pdf`);
}

export function viewInvoicePdf(args: Args) {
  const doc = buildInvoicePdf(args);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
