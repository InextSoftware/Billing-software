import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { FileText, IndianRupee, Weight, Ruler, Scale } from "lucide-react";
import { useDashboard } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtINR, fmtNum } from "@/lib/format";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="bg-white shadow-md">
      <CardContent className="pt-6 flex items-center justify-between">
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading } = useDashboard();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of sales and measurements</p>
        </div>
        <Button asChild>
          <Link to="/invoices/new" className="bg-primary hover:bg-primary/90 text-white">
            + New Invoice
                      </Link>
        </Button>
    </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Stat icon={FileText} label="Total Invoices" value={fmtNum(data?.total_invoices ?? 0, 0)} />
        <Stat icon={IndianRupee} label="Total Sales" value={fmtINR(data?.total_sales ?? 0)} />
        <Stat icon={Weight} label="Total KG" value={fmtNum(data?.total_kg ?? 0, 2)} />
        <Stat icon={Scale} label="Total Ton" value={fmtNum(data?.total_ton ?? 0, 3)} />
        <Stat icon={Ruler} label="Total Meter" value={fmtNum(data?.total_meter ?? 0, 2)} />
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.monthly ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (data?.recent?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet. Create your first one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">KG</TableHead>
                  <TableHead className="text-right">Meter</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.recent.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link to="/invoices/$id" params={{ id: r.id }} className="text-primary hover:underline">
                        {r.invoice_no}
                      </Link>
                    </TableCell>
                    <TableCell>{new Date(r.invoice_date).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>{r.customers?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">{fmtNum(r.total_kg, 2)}</TableCell>
                    <TableCell className="text-right">{fmtNum(r.total_meter, 2)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtINR(r.grand_total)}</TableCell>
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
