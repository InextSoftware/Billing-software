import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useInvoices, useDeleteInvoice, useCompanySettings } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Download, Trash2, FileText, FileSpreadsheet } from "lucide-react";
import { fmtINR } from "@/lib/format";
import { downloadInvoicePdf, viewInvoicePdf } from "@/lib/pdf";
import { downloadInvoiceExcel } from "@/lib/excel";
import { downloadInvoiceWord } from "@/lib/word";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/invoices/")({
  component: InvoiceListPage,
});

function InvoiceListPage() {
  const { data, isLoading } = useInvoices();
  const { data: company } = useCompanySettings();
  const del = useDeleteInvoice();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = (data ?? []).filter((r) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      r.invoice_no.toLowerCase().includes(s) ||
      (r.customers?.name ?? "").toLowerCase().includes(s);
    const matchFrom = !from || r.invoice_date >= from;
    const matchTo = !to || r.invoice_date <= to;
    return matchSearch && matchFrom && matchTo;
  });

  const fetchInvoiceData = async (id: string) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/invoices/${id}`);
    if (!response.ok) {
      throw new Error("Unable to load invoice data");
    }
    return response.json();
  };

  const handleDownload = async (id: string) => {
    if (!company) return;
    try {
      const data = await fetchInvoiceData(id);
      const { invoice, items } = data;
      const customer = invoice.customers;
      downloadInvoicePdf({ company, customer, invoice, items });
    } catch (error) {
      toast.error("Unable to load invoice for download");
    }
  };

  const handleView = async (id: string) => {
    if (!company) return;
    try {
      const data = await fetchInvoiceData(id);
      const { invoice, items } = data;
      const customer = invoice.customers;
      viewInvoicePdf({ company, customer, invoice, items });
    } catch (error) {
      toast.error("Unable to load invoice for viewing");
    }
  };

  const handleExcel = async (id: string) => {
    if (!company) return;
    try {
      const data = await fetchInvoiceData(id);
      const { invoice, items } = data;
      const customer = invoice.customers;
      downloadInvoiceExcel({ company, customer, invoice, items });
    } catch (error) {
      toast.error("Unable to load invoice for Excel download");
    }
  };

  const handleWord = async (id: string) => {
    if (!company) return;
    try {
      const data = await fetchInvoiceData(id);
      const { invoice, items } = data;
      const customer = invoice.customers;
      await downloadInvoiceWord({ company, customer, invoice, items });
    } catch (error) {
      toast.error("Unable to load invoice for Word download");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">Invoice history</p>
        </div>
        <Button asChild><Link to="/invoices/new">+ New Invoice</Link></Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search invoice no or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No invoices.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.invoice_no}</TableCell>
                    <TableCell>{new Date(r.invoice_date).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>{r.customers?.name ?? "—"}</TableCell>
                    <TableCell>{r.vehicle_no ?? "—"}</TableCell>
                    <TableCell className="text-right">{fmtINR(r.grand_total)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleView(r.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(r.id)} title="Download PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleExcel(r.id)} title="Download Excel">
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleWord(r.id)} title="Download Word">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {r.invoice_no}?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={async () => {
                              try { await del.mutateAsync(r.id); toast.success("Invoice deleted"); }
                              catch (e: any) { toast.error(e.message ?? "Failed"); }
                            }}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
