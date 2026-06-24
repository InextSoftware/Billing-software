import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, BorderStyle, VerticalAlign } from "docx";
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

export async function downloadInvoiceWord(args: Args) {
  const { company, customer, invoice, items } = args;

  const standardBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const noBorder = { style: BorderStyle.NONE };

  const fmtD = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB").replace(/\//g,'.') : "-";

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 400,
              right: 400,
              bottom: 400,
              left: 400,
            },
          },
        },
        children: [
          // 1. Outer Border Wrapper (using a single-cell table to encompass everything)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: { top: standardBorder, left: standardBorder, bottom: standardBorder, right: standardBorder },
                    children: [
                      // --- TOP STRIP ---
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({ 
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: { bottom: standardBorder, right: standardBorder },
                                children: [
                                  new Paragraph({ children: [new TextRun({ text: "GSTIN : " + (company.gstin || ""), bold: true, size: 16 })] }),
                                  new Paragraph({ children: [new TextRun({ text: "State Code : " + (company.state_code || ""), bold: true, size: 16 })] }),
                                ] 
                              }),
                              new TableCell({ 
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                borders: { bottom: standardBorder, right: standardBorder },
                                children: [
                                  new Paragraph({ 
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: "SUBJECT TO " + (company.jurisdiction || "").toUpperCase() + " JURISDICTION", bold: true, size: 16 })] 
                                  })
                                ] 
                              }),
                              new TableCell({ 
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: { bottom: standardBorder },
                                children: [
                                  new Paragraph({ 
                                    alignment: AlignmentType.RIGHT,
                                    children: [new TextRun({ text: "ORIGINAL", size: 16 })] 
                                  })
                                ] 
                              }),
                            ],
                          }),
                        ],
                      }),

                      // --- HEADER ---
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TAX INVOICE", bold: true, size: 20 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: company.company_name.toUpperCase(), bold: true, size: 52 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mfg. : " + (company.tagline || ""), italics: true, bold: true, size: 20 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: company.office_line || "", italics: true, bold: true, size: 18 })] }),
                      
                      // --- BILLING & META ---
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({
                                width: { size: 55, type: WidthType.PERCENTAGE },
                                borders: { top: standardBorder, right: standardBorder },
                                children: [
                                  new Paragraph({ children: [new TextRun({ text: "To,", size: 20 })] }),
                                  new Paragraph({ children: [new TextRun({ text: customer.name.toUpperCase(), bold: true, size: 26 })] }),
                                  new Paragraph({ children: [new TextRun({ text: customer.address || "", size: 18 })] }),
                                  new Paragraph({ children: [new TextRun({ text: "GSTIN : " + (customer.gstin || "-") + "   State Code : " + (company.state_code || "22"), bold: true, size: 18 })] }),
                                ],
                              }),
                              new TableCell({
                                width: { size: 45, type: WidthType.PERCENTAGE },
                                borders: { top: standardBorder },
                                children: [
                                  new Table({
                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                    rows: [
                                      ["Invoice No.", invoice.invoice_no, "Date :", fmtD(invoice.invoice_date)],
                                      ["Challan No.", invoice.challan_no || "-", "Date :", fmtD(invoice.invoice_date)],
                                      ["Order No. & Date :", invoice.order_no || "-", "", ""],
                                      ["Term of Payment :", invoice.payment_terms || "-", "", ""],
                                      ["Vehicle No. :", (invoice.vehicle_no || "").toUpperCase(), "", ""],
                                      ["LR. No.", invoice.lr_no || "-", "Date :", fmtD(invoice.lr_date)],
                                      ["Transport Name :", (invoice.transport_name || "").toUpperCase(), "", ""],
                                      ["HSN Code :", invoice.hsn_code || company.default_hsn || "-", "", ""],
                                    ].map((row, idx, arr) => new TableRow({
                                      children: [
                                        new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, borders: { bottom: idx === arr.length - 1 ? noBorder : standardBorder, right: standardBorder }, children: [new Paragraph({ children: [new TextRun({ text: String(row[0]), size: 14, bold: true })] })] }),
                                        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: { bottom: idx === arr.length - 1 ? noBorder : standardBorder, right: standardBorder }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row[1]), size: 16, bold: true })] })] }),
                                        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: { bottom: idx === arr.length - 1 ? noBorder : standardBorder, right: standardBorder }, children: [new Paragraph({ children: [new TextRun({ text: String(row[2]), size: 14, bold: true })] })] }),
                                        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: { bottom: idx === arr.length - 1 ? noBorder : noBorder }, children: [new Paragraph({ children: [new TextRun({ text: String(row[3]), size: 16, bold: true })] })] }),
                                      ],
                                    })),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),

                      // --- DESPATCH STRIP ---
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({
                                borders: { top: standardBorder, bottom: standardBorder },
                                children: [
                                  new Paragraph({
                                    children: [
                                      new TextRun({
                                        text: items[0] 
                                          ? `We have Despatched ${fmtNum(items[0].basis === 'kg' ? items[0].weight_kg : items[0].basis === 'ton' ? items[0].weight_ton : items[0].basis === 'meter' ? (items[0].length_m ?? 0) : (items[0].qty_pcs ?? 0))} ${items[0].basis.toUpperCase()} ${items[0].paper_type || items[0].materials?.name || ''}`
                                          : "-",
                                        bold: true,
                                        size: 18
                                      })
                                    ]
                                  })
                                ]
                              })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({
                                borders: { bottom: standardBorder },
                                children: [
                                  new Table({
                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                    rows: [
                                      new TableRow({
                                        children: [
                                          new TableCell({ borders: { right: standardBorder }, children: [new Paragraph({ children: [new TextRun({ text: "Freight : Rs. 00.00", size: 16, bold: true })] })] }),
                                          new TableCell({ borders: { right: standardBorder }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Advance Freight : Rs. ${fmtNum(invoice.advance_freight)}`, size: 16, bold: true })] })] }),
                                          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Balance Freight : Rs. 00.00", size: 16, bold: true })] })] }),
                                        ]
                                      })
                                    ]
                                  })
                                ]
                              })
                            ]
                          })
                        ]
                      }),

                      // --- ITEMS TABLE ---
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                          new TableRow({
                            children: [
                              "Description of Goods", "Quantity", "Rate", "Per", "Amount"
                            ].map(text => new TableCell({
                              borders: { bottom: standardBorder, right: standardBorder },
                              children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
                            })),
                          }),
                          ...items.map(it => {
                            const paperType = (it.paper_type || it.materials?.name || "N/A").toUpperCase();
                            const um = it.basis === "kg" ? "KG" : it.basis === "ton" ? "MT" : it.basis === "meter" ? "MTR" : "PCS";
                            const qty = it.basis === "kg" ? it.weight_kg : it.basis === "ton" ? it.weight_ton : it.basis === "meter" ? (it.length_m ?? 0) : (it.qty_pcs ?? 0);
                            const rate = it.basis === "kg" ? it.rate_kg : it.basis === "ton" ? it.rate_ton : it.basis === "meter" ? it.rate_meter : it.rate_pcs;
                            const desc = paperType + "\n" + [
                              it.gsm && `${it.gsm} GSM`,
                              [it.width_mm && `SIZE : ${it.width_mm} MM`, it.length_m && `${it.length_m} MTR`, it.qty_pcs && `${it.qty_pcs} PCS`].filter(Boolean).join(" X ")
                            ].filter(Boolean).join(", ") + `\n= ${fmtNum(qty)} ${um}`;
                            
                            return new TableRow({
                              children: [
                                new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: { bottom: standardBorder, right: standardBorder }, children: [new Paragraph({ children: desc.split('\n').map((line, i) => new TextRun({ text: line, break: i > 0 ? 1 : 0, bold: true, size: 18 })) })] }),
                                new TableCell({ verticalAlign: VerticalAlign.CENTER, borders: { bottom: standardBorder, right: standardBorder }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fmtNum(qty) + " " + um, bold: true, size: 18 })] })] }),
                                new TableCell({ verticalAlign: VerticalAlign.CENTER, borders: { bottom: standardBorder, right: standardBorder }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fmtNum(rate), bold: true, size: 18 })] })] }),
                                new TableCell({ verticalAlign: VerticalAlign.CENTER, borders: { bottom: standardBorder, right: standardBorder }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: um + "s", bold: true, size: 18 })] })] }),
                                new TableCell({ verticalAlign: VerticalAlign.CENTER, borders: { bottom: standardBorder }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmtNum(it.amount), bold: true, size: 18 })] })] }),
                              ],
                            });
                          }),
                        ],
                      }),

                      // --- TOTAL WEIGHT ---
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Total Weight = ${fmtNum(invoice.total_kg, 2)} KGS`, bold: true, size: 20 })] }),

                      // --- TOTALS & WORDS ---
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                borders: { top: standardBorder, right: standardBorder },
                                children: [
                                  new Paragraph({ children: [new TextRun({ text: "Amount In Word :", bold: true, size: 18 })] }),
                                  new Paragraph({ children: [new TextRun({ text: ("RS. " + amountInWords(invoice.grand_total).replace('Rupees ','').toUpperCase() + " ONLY."), bold: true, size: 18 })] }),
                                ]
                              }),
                              new TableCell({
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                borders: { top: standardBorder },
                                children: [
                                  new Table({
                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                    rows: [
                                      [`CGST @ ${invoice.gst_pct / 2}%`, invoice.cgst],
                                      [`SGST @ ${invoice.gst_pct / 2}%`, invoice.sgst],
                                      [`IGST @ ${invoice.gst_pct}%`, invoice.igst],
                                      ["TOTAL", invoice.subtotal + invoice.cgst + invoice.sgst + invoice.igst],
                                      [`INSURANCE @ ${invoice.insurance_pct}%`, (invoice.subtotal * invoice.insurance_pct) / 100],
                                      ["Round Off", invoice.round_off],
                                      ["G. Total", invoice.grand_total],
                                    ].map((row, idx, arr) => new TableRow({
                                      children: [
                                        new TableCell({ borders: { bottom: idx === arr.length - 1 ? noBorder : standardBorder, right: standardBorder }, children: [new Paragraph({ children: [new TextRun({ text: String(row[0]), bold: true, size: 18 })] })] }),
                                        new TableCell({ borders: { bottom: idx === arr.length - 1 ? noBorder : standardBorder }, children: [new Paragraph({ children: [new TextRun({ text: fmtNum(Number(row[1])), bold: true, size: 18 })], alignment: AlignmentType.RIGHT })] }),
                                      ],
                                    })),
                                  })
                                ]
                              })
                            ]
                          })
                        ]
                      }),

                      // --- GST SUMMARY ---
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                          new TableRow({
                            children: ["Net Value", "CGST", "SGST", "IGST", "Transit Insurance", "Gross Amount"].map((text, i, arr) => 
                              new TableCell({ borders: { top: standardBorder, bottom: standardBorder, right: i === arr.length - 1 ? noBorder : standardBorder }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 14 })] })] })
                            )
                          }),
                          new TableRow({
                            children: [
                              invoice.subtotal, invoice.cgst, invoice.sgst, invoice.igst, 
                              (invoice.subtotal * invoice.insurance_pct) / 100, invoice.grand_total
                            ].map((val, i, arr) => 
                              new TableCell({ borders: { right: i === arr.length - 1 ? noBorder : standardBorder }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fmtNum(val), bold: true, size: 16 })] })] })
                            )
                          })
                        ]
                      }),

                      // --- FOOTER ---
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                borders: { top: standardBorder, right: standardBorder },
                                children: [
                                  new Paragraph({ children: [new TextRun({ text: "Declaration:", bold: true, size: 18 })] }),
                                  new Paragraph({ children: [new TextRun({ text: "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.", size: 16 })] }),
                                ]
                              }),
                              new TableCell({
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                borders: { top: standardBorder },
                                children: [
                                  new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "For, " + company.company_name, bold: true, size: 20 })] }),
                                  new Paragraph({ text: "" }),
                                  new Paragraph({ text: "" }),
                                  new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Autorised Signatory", bold: true, size: 18 })] }),
                                ]
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoice.invoice_no}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}
