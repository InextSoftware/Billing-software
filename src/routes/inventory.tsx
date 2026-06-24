import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMaterials, useStockOnHand, useStockLedger, useCreateStockMovement } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, Settings2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { fmtNum } from "@/lib/format";

export const Route = createFileRoute("/inventory")({ component: InventoryPage });

function InventoryPage() {
  const { data: materials } = useMaterials();
  const { data: onHand } = useStockOnHand();
  const { data: ledger } = useStockLedger();
  const move = useCreateStockMovement();

  const [mode, setMode] = useState<"in" | "adjust" | null>(null);
  const [materialId, setMaterialId] = useState("");
  const [qty, setQty] = useState(0);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const summary = useMemo(() => {
    return (onHand ?? []).map((s) => ({
      ...s,
      low: s.reorder_level > 0 && Number(s.on_hand) <= Number(s.reorder_level),
    }));
  }, [onHand]);

  const open = (m: "in" | "adjust") => {
    setMode(m); setMaterialId(""); setQty(0); setReference(""); setNotes("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  const submit = async () => {
    if (!materialId) { toast.error("Pick a material"); return; }
    if (!qty || qty === 0) { toast.error("Quantity required"); return; }
    try {
      await move.mutateAsync({
        material_id: materialId,
        movement_date: date,
        qty: mode === "in" ? Math.abs(qty) : qty, // adjust allows negative
        source: mode === "in" ? "manual_in" : "manual_adjust",
        reference: reference || null,
        notes: notes || null,
      });
      toast.success("Stock updated");
      setMode(null);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Stock in, adjustments, and an audit ledger of every movement.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => open("adjust")}><Settings2 className="h-4 w-4 mr-1" /> Adjustment</Button>
          <Button onClick={() => open("in")}><ArrowDownToLine className="h-4 w-4 mr-1" /> Stock In</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Stock on Hand</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Reorder Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((s) => (
                <TableRow key={s.material_id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">{fmtNum(Number(s.on_hand), 3)}</TableCell>
                  <TableCell className="uppercase text-xs">{s.stock_unit}</TableCell>
                  <TableCell className="text-right">{fmtNum(Number(s.reorder_level), 2)}</TableCell>
                  <TableCell>
                    {s.low ? (
                      <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Low</Badge>
                    ) : Number(s.on_hand) < 0 ? (
                      <Badge variant="destructive">Negative</Badge>
                    ) : (
                      <Badge variant="secondary">OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {summary.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No materials yet — add some in Material Master.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Stock Ledger</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ledger ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.movement_date).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>{m.materials?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{m.source.replace("_", " ")}</Badge></TableCell>
                  <TableCell>{m.reference ?? "—"}</TableCell>
                  <TableCell className={"text-right font-medium " + (Number(m.qty) < 0 ? "text-destructive" : "text-emerald-600")}>
                    {Number(m.qty) > 0 ? "+" : ""}{fmtNum(Number(m.qty), 3)}
                  </TableCell>
                  <TableCell className="uppercase text-xs">{m.materials?.stock_unit}</TableCell>
                </TableRow>
              ))}
              {(ledger ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No movements yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={mode !== null} onOpenChange={(v) => !v && setMode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{mode === "in" ? "Stock In (Receipt)" : "Stock Adjustment"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Material *</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                <SelectContent>
                  {materials?.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.stock_unit})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div>
              <Label>{mode === "in" ? "Quantity (in)" : "Quantity (+/-)"}</Label>
              <Input type="number" step="0.001" value={qty || ""} onChange={(e) => setQty(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="col-span-2"><Label>Reference (e.g. PO / Bill no)</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={submit} disabled={move.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
