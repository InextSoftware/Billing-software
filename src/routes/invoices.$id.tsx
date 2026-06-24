import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useInvoice, useCompanySettings } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Download, Printer, ArrowLeft, Eye, FileText, FileSpreadsheet } from "lucide-react";
import { downloadInvoicePdf, viewInvoicePdf } from "@/lib/pdf";
import { downloadInvoiceExcel } from "@/lib/excel";
import { downloadInvoiceWord } from "@/lib/word";
import { InvoicePaper } from "@/components/invoice-paper";

export const Route = createFileRoute("/invoices/$id")({
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { id } = useParams({ from: "/invoices/$id" });
  const { data, isLoading } = useInvoice(id);
  const { data: company } = useCompanySettings();

  if (isLoading || !data || !company) return <p className="text-sm text-muted-foreground p-6">Loading…</p>;
  const { invoice, items } = data;
  const customer = invoice.customers;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/invoices"><ArrowLeft className="h-4 w-4 mr-1" /> Back to List</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print / PDF (Browser)
          </Button>
          <Button variant="outline" onClick={() => viewInvoicePdf({ company, customer, invoice, items })}>
            <Eye className="h-4 w-4 mr-1" /> View PDF (Auto)
          </Button>
          <Button onClick={() => downloadInvoicePdf({ company, customer, invoice, items })}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" onClick={() => downloadInvoiceExcel({ company, customer, invoice, items })}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" onClick={() => downloadInvoiceWord({ company, customer, invoice, items })}>
            <FileText className="h-4 w-4 mr-1" /> Word
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-muted/30 p-4 md:p-8 rounded-xl border border-dashed print:p-0 print:bg-transparent print:border-none">
        <div className="print-area">
          <InvoicePaper company={company} customer={customer} invoice={invoice} items={items} />
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

