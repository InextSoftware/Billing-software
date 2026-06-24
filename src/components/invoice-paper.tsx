import React from "react";
import type { CompanySettings, Customer, Invoice, InvoiceItem } from "@/lib/types";
import { fmtINR, fmtNum, amountInWords } from "@/lib/format";

interface InvoiceItemWithMaterial extends InvoiceItem {
  materials?: { name?: string | null };
}

interface InvoicePaperProps {
  company: CompanySettings;
  customer: Customer;
  invoice: Invoice;
  items: InvoiceItemWithMaterial[];
}

export function InvoicePaper({ company, customer, invoice, items }: InvoicePaperProps) {
  const cleanWords = (amt: number) => {
    let s = amountInWords(amt).toUpperCase();
    s = s.replace('RUPEES ', '');
    s = s.replace(' AND ZERO PAISE', '');
    return s;
  };

  const fmtD = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB").replace(/\//g,'.') : "-";

  return (
    <div className="bg-white text-black p-6 shadow-2xl mx-auto border" style={{ width: "210mm", minHeight: "297mm", fontSize: "11px", fontFamily: "Arial, sans-serif" }}>
      {/* Outer Border */}
      <div className="border border-black h-full flex flex-col">
        
        {/* Top Strip */}
        <div className="border-b border-black flex justify-between p-1 text-[9px] leading-tight font-bold">
          <div>
            <div>GSTIN : {company.gstin}</div>
            <div>State Code : {company.state_code || "22"}</div>
          </div>
          <div className="text-center">
            SUBJECT TO {company.jurisdiction?.toUpperCase() || "RAIPUR"} JURISDICTION
          </div>
          <div className="italic font-normal">
            ORIGINAL
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-2 border-b border-black">
          <h2 className="text-[13px] font-bold uppercase tracking-widest">TAX INVOICE</h2>
          <div className="px-10">
            <h1 className="text-3xl font-black mt-1 uppercase tracking-tight" style={{ fontFamily: "'Times New Roman', serif" }}>{company.company_name}</h1>
            <div className="border-b-2 border-double border-black mt-1"></div>
          </div>
          {company.tagline && <p className="text-[11px] italic font-bold mt-1">Mfg. : {company.tagline}</p>}
          {company.office_line && <p className="text-[10px] italic font-bold border-t border-black mt-1 py-1">{company.office_line}</p>}
        </div>

        {/* Header Grid */}
        <div className="border-b border-black flex">
          {/* Left: To Section */}
          <div className="border-r border-black p-2 flex flex-col" style={{ flex: "1.2" }}>
            <div className="text-sm font-bold">To,</div>
            <div className="text-base leading-tight mt-1 uppercase font-bold">{customer.name}</div>
            <div className="text-[10px] leading-snug mt-1 flex-1 uppercase whitespace-pre-line font-bold">
              {customer.address}
              {customer.mobile && <div className="mt-1 font-black">MO. NO. {customer.mobile}</div>}
            </div>
            <div className="pt-2 text-[10px] font-black">
              <div>GSTIN : {customer.gstin || "-"} &nbsp; State Code : {company.state_code || "22"}</div>
            </div>
          </div>

          {/* Right: Meta Grid */}
          <div className="flex flex-col text-[9px] font-bold divide-y divide-black" style={{ flex: "1" }}>
            {/* Invoice No & Date */}
            <div className="flex divide-x divide-black h-7 items-center">
              <div className="px-2" style={{ width: "80px", flexShrink: 0 }}>Invoice No.</div>
              <div className="flex-1 px-2 text-center text-sm font-black">{invoice.invoice_no}</div>
              <div className="px-1" style={{ width: "40px", flexShrink: 0 }}>Date :</div>
              <div className="px-2" style={{ width: "70px", flexShrink: 0 }}>{fmtD(invoice.invoice_date)}</div>
            </div>

            {/* Challan No & Date */}
            <div className="flex divide-x divide-black h-7 items-center">
              <div className="px-2" style={{ width: "80px", flexShrink: 0 }}>Challan No.</div>
              <div className="flex-1 px-2 text-center text-sm font-black">{invoice.challan_no || "-"}</div>
              <div className="px-1" style={{ width: "40px", flexShrink: 0 }}>Date :</div>
              <div className="px-2" style={{ width: "70px", flexShrink: 0 }}>{fmtD(invoice.invoice_date)}</div>
            </div>

            {/* Order No */}
            <div className="flex divide-x divide-black h-6 items-center">
              <div className="px-2" style={{ width: "80px", flexShrink: 0 }}>Order No. & Date :</div>
              <div className="flex-1 px-2 text-center">{invoice.order_no || "-"}</div>
            </div>

            {/* Term of Payment */}
            <div className="flex divide-x divide-black h-6 items-center">
              <div className="px-2" style={{ width: "80px", flexShrink: 0 }}>Term of Payment :</div>
              <div className="flex-1 px-2 text-center">{invoice.payment_terms || "-"}</div>
            </div>

            {/* Vehicle No */}
            <div className="flex divide-x divide-black h-6 items-center">
              <div className="px-2" style={{ width: "80px", flexShrink: 0 }}>Vehicle No. :</div>
              <div className="flex-1 px-2 text-center text-sm font-black uppercase">{invoice.vehicle_no || "-"}</div>
            </div>

            {/* LR No & Date */}
            <div className="flex divide-x divide-black h-7 items-center">
              <div className="px-2" style={{ width: "55px", flexShrink: 0 }}>LR. No.</div>
              <div className="flex-1 px-2 text-center font-black uppercase">{invoice.lr_no || "-"}</div>
              <div className="px-1" style={{ width: "40px", flexShrink: 0 }}>Date :</div>
              <div className="px-2" style={{ width: "70px", flexShrink: 0 }}>{fmtD(invoice.lr_date)}</div>
            </div>

            {/* Transport Name */}
            <div className="flex divide-x divide-black h-6 items-center">
              <div className="px-2" style={{ width: "80px", flexShrink: 0 }}>Transport Name :</div>
              <div className="flex-1 px-2 text-center uppercase font-black">{invoice.transport_name || "-"}</div>
            </div>

            {/* HSN Code */}
            <div className="flex divide-x divide-black h-8 items-center bg-gray-100">
              <div className="px-2" style={{ width: "80px", flexShrink: 0 }}>HSN Code :</div>
              <div className="flex-1 px-2 text-center text-2xl font-black tracking-widest">{invoice.hsn_code || company.default_hsn || "-"}</div>
            </div>
          </div>
        </div>

        {/* Despatch Strip */}
        <div className="border-b border-black text-[10px] font-bold p-2 space-y-1">
          <div>
            We have Despatched {items[0] ? `${fmtNum(items[0].basis === 'kg' ? items[0].weight_kg : items[0].basis === 'ton' ? items[0].weight_ton : items[0].basis === 'meter' ? (items[0].length_m ?? 0) : (items[0].qty_pcs ?? 0))} ${items[0].basis.toUpperCase()} ${items[0].paper_type || items[0].materials?.name || ''}` : "-"}
          </div>
          <div className="flex gap-12">
            <span>Freight : Rs. 00.00</span>
            <span>Advance Freight : Rs. {fmtNum(invoice.advance_freight)}</span>
          </div>
          <div>
            Balance Freight : Rs. 00.00
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 flex flex-col">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="border-b border-black text-[10px] font-bold uppercase divide-x divide-black h-8 bg-gray-100">
                <th className="p-1 text-center">Description of Goods</th>
                <th className="p-1 text-center" style={{ width: "14%" }}>Quantity</th>
                <th className="p-1 text-center" style={{ width: "10%" }}>Rate</th>
                <th className="p-1 text-center" style={{ width: "10%" }}>Per</th>
                <th className="p-1 text-center" style={{ width: "10%" }}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {items.map((it, idx) => {
                const um = it.basis === "kg" ? "KG" : it.basis === "ton" ? "MT" : it.basis === "meter" ? "MTR" : "PCS";
                const qty =
                  it.basis === "kg" ? fmtNum(it.weight_kg, 3) :
                  it.basis === "ton" ? fmtNum(it.weight_ton, 4) :
                  it.basis === "meter" ? fmtNum(it.length_m ?? 0, 2) :
                  fmtNum(it.qty_pcs ?? 0, 0);
                const rate =
                  it.basis === "kg" ? it.rate_kg :
                  it.basis === "ton" ? it.rate_ton :
                  it.basis === "meter" ? it.rate_meter :
                  it.rate_pcs;
                
                return (
                  <tr key={it.id || idx} className="text-[11px] divide-x divide-black h-56 align-top">
                    <td className="p-3 leading-snug">
                      <div className="font-bold text-[16px] uppercase text-center mb-6 tracking-wide">{it.paper_type || it.materials?.name || "N/A"}</div>
                      <div className="font-bold text-[12px] leading-relaxed">
                        {[
                          it.gsm && `${it.gsm} GSM`,
                          [
                            it.width_mm && `SIZE : ${it.width_mm} MM`,
                            it.length_m && `${it.length_m} MTR`,
                            it.qty_pcs && `${it.qty_pcs} PCS`
                          ].filter(Boolean).join(" X ")
                        ].filter(Boolean).join(", ")}
                      </div>
                      <div className="mt-4 font-black text-base">= {qty} {um}</div>
                    </td>
                    <td className="p-2 text-center font-black text-[16px] align-middle whitespace-nowrap">{qty} {um}</td>
                    <td className="p-2 text-center font-black text-[16px] align-middle">{fmtNum(rate, 2)}</td>
                    <td className="p-2 text-center font-black align-middle text-[14px]">{um}s</td>
                    <td className="p-2 text-right font-black text-[16px] align-middle">{fmtNum(it.amount, 2)}</td>
                  </tr>
                );
              })}
              
              {/* Total Weight Label row */}
              <tr className="border-t border-black divide-x divide-black font-bold h-10">
                 <td className="p-2 text-[14px]">Total Weight = {fmtNum(invoice.total_kg, 2)} KGS</td>
                 <td colSpan={3}></td>
                 <td></td>
              </tr>

              {/* Totals Section */}
              <tr className="border-t border-black divide-x divide-black font-bold text-[11px]">
                 <td rowSpan={7} className="p-3 align-top bg-white">
                    <div className="mt-2">
                       <div className="text-[10px] mb-1 font-bold">Amount In Word :</div>
                       <div className="text-[13px] font-black uppercase leading-relaxed pr-6 tracking-tight">RS. {cleanWords(invoice.grand_total)} RUPEES ONLY.</div>
                    </div>
                 </td>
                 <td colSpan={3} className="px-3 py-2 border-b border-black">CGST @ {invoice.gst_pct / 2}%</td>
                 <td className="px-3 py-2 text-right text-base border-b border-black font-black">{fmtNum(invoice.cgst, 2)}</td>
              </tr>
              <tr className="divide-x divide-black font-bold text-[11px]">
                 <td colSpan={3} className="px-3 py-2 border-b border-black">SGST @ {invoice.gst_pct / 2}%</td>
                 <td className="px-3 py-2 text-right text-base border-b border-black font-black">{fmtNum(invoice.sgst, 2)}</td>
              </tr>
              <tr className="divide-x divide-black font-bold text-[11px]">
                 <td colSpan={3} className="px-3 py-2 border-b border-black">IGST @ {invoice.gst_pct}%</td>
                 <td className="px-3 py-2 text-right text-base border-b border-black font-black">{fmtNum(invoice.igst, 2)}</td>
              </tr>
              <tr className="divide-x divide-black font-bold text-[11px] bg-gray-100">
                 <td colSpan={3} className="px-3 py-2 border-b border-black uppercase tracking-wider">Total</td>
                 <td className="px-3 py-2 text-right text-base border-b border-black font-black">{fmtNum(invoice.subtotal + invoice.cgst + invoice.sgst + invoice.igst, 2)}</td>
              </tr>
              <tr className="divide-x divide-black font-bold text-[11px]">
                 <td colSpan={3} className="px-3 py-2 border-b border-black uppercase tracking-wider">Insurance @ {invoice.insurance_pct}%</td>
                 <td className="px-3 py-2 text-right text-base border-b border-black font-black">{fmtNum((invoice.subtotal * invoice.insurance_pct) / 100, 2)}</td>
              </tr>
              <tr className="divide-x divide-black font-bold text-[11px]">
                 <td colSpan={3} className="px-3 py-2 border-b border-black uppercase tracking-wider">Round Off</td>
                 <td className="px-3 py-2 text-right text-base border-b border-black font-black">{fmtNum(invoice.round_off, 2)}</td>
              </tr>
              <tr className="divide-x divide-black font-bold text-[11px] bg-gray-200">
                 <td colSpan={3} className="px-3 py-2 uppercase font-black text-sm">G. Total</td>
                 <td className="px-3 py-2 text-right text-[20px] font-black">{fmtNum(invoice.grand_total, 2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* GST Summary Band */}
        <div className="border-t border-black grid grid-cols-6 divide-x divide-black text-[10px] font-black text-center uppercase bg-gray-100">
           <div className="p-2 border-b border-black">Net Value</div>
           <div className="p-2 border-b border-black">CGST</div>
           <div className="p-2 border-b border-black">SGST</div>
           <div className="p-2 border-b border-black">IGST</div>
           <div className="p-2 border-b border-black leading-tight">Transit Insurance</div>
           <div className="p-2 border-b border-black">Gross Amount</div>
           
           <div className="p-2 text-[13px]">{fmtNum(invoice.subtotal, 2)}</div>
           <div className="p-2 text-[13px]">{fmtNum(invoice.cgst, 2)}</div>
           <div className="p-2 text-[13px]">{fmtNum(invoice.sgst, 2)}</div>
           <div className="p-2 text-[13px]">{fmtNum(invoice.igst, 2)}</div>
           <div className="p-2 text-[13px]">{fmtNum((invoice.subtotal * invoice.insurance_pct) / 100, 2)}</div>
           <div className="p-2 text-[13px]">{fmtNum(invoice.grand_total, 2)}</div>
        </div>

        {/* Footer */}
        <div className="p-3 grid grid-cols-2 gap-4 text-[10px] font-bold mt-auto mb-6">
           <div className="space-y-1">
              <div className="underline italic">Declaration:</div>
              <p className="leading-tight font-bold">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
           </div>
           <div className="text-right flex flex-col justify-between pt-1">
              <div className="font-black">For, &nbsp; {company.company_name}</div>
              <div className="pt-12 pr-12 font-black">Autorised Signatory</div>
           </div>
        </div>

      </div>
      <p className="text-center text-[8px] text-gray-400 mt-2 italic">This is a computer generated invoice and does not require a physical signature.</p>
    </div>
  );
}
