import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMaterials, useSaveMaterial, useDeleteMaterial, useStockOnHand } from "@/lib/queries";
import type { Material, StockUnit, RateBasis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { fmtNum } from "@/lib/format";

export const Route = createFileRoute("/materials")({ component: MaterialsPage });

const blank: Partial<Material> = {
  name: "", hsn_code: "", stock_unit: "kg", default_basis: "kg", default_rate: 0,
  opening_stock: 0, reorder_level: 0,
};

function MaterialsPage() {
  const { data: materials } = useMaterials();
  const { data: onHand } = useStockOnHand();
  const save = useSaveMaterial();
  const del = useDeleteMaterial();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Material>>(blank);

  const stockMap = useMemo(() => {
    const m = new Map<string, number>();
    onHand?.forEach((s) => m.set(s.material_id, Number(s.on_hand)));
    return m;
  }, [onHand]);

  const filtered = useMemo(
    () => (materials ?? []).filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase()) || (m.hsn_code ?? "").includes(q)),
    [materials, q],
  );

  const startNew = () => { setForm(blank); setOpen(true); };
  const startEdit = (m: Material) => { setForm(m); setOpen(true); };

  const submit = async () => {
    if (!form.name?.trim()) { toast.error("Name required"); return; }
    try {
      await save.mutateAsync(form);
      toast.success("Saved");
      setOpen(false);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this material? Its stock movements will also be deleted.")) return;
    try { await del.mutateAsync(id); toast.success("Deleted"); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Material Master</h1>
          <p className="text-sm text-muted-foreground">Catalog of items used on invoices and tracked in inventory.</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-1" /> Add Material</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search name or HSN…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>HSN</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Default Rate</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="text-right">Reorder</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => {
                const oh = stockMap.get(m.id) ?? 0;
                const low = m.reorder_level > 0 && oh <= m.reorder_level;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.hsn_code || "—"}</TableCell>
                    <TableCell className="uppercase text-xs">{m.stock_unit}</TableCell>
                    <TableCell className="text-right">{fmtNum(Number(m.default_rate), 2)} / {m.default_basis}</TableCell>
                    <TableCell className={"text-right " + (low ? "text-destructive font-semibold" : "")}>{fmtNum(oh, 2)}</TableCell>
                    <TableCell className="text-right">{fmtNum(Number(m.reorder_level), 2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No materials yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} Material</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Name *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>HSN Code</Label><Input value={form.hsn_code ?? ""} onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} /></div>
            <div><Label>Stock Unit</Label>
              <Select value={form.stock_unit ?? "kg"} onValueChange={(v) => setForm({ ...form, stock_unit: v as StockUnit })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilogram (KG)</SelectItem>
                  <SelectItem value="ton">Ton</SelectItem>
                  <SelectItem value="meter">Meter</SelectItem>
                  <SelectItem value="pcs">Pieces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Default Rate Basis</Label>
              <Select value={form.default_basis ?? "kg"} onValueChange={(v) => setForm({ ...form, default_basis: v as RateBasis })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Per KG</SelectItem>
                  <SelectItem value="ton">Per Ton</SelectItem>
                  <SelectItem value="meter">Per Meter</SelectItem>
                  <SelectItem value="pcs">Per Piece</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Default Rate</Label><Input type="number" step="0.01" value={form.default_rate ?? 0} onChange={(e) => setForm({ ...form, default_rate: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>GSM</Label><Input type="number" value={form.gsm ?? ""} onChange={(e) => setForm({ ...form, gsm: e.target.value === "" ? null : parseFloat(e.target.value) })} /></div>
            <div><Label>Width (mm)</Label><Input type="number" value={form.width_mm ?? ""} onChange={(e) => setForm({ ...form, width_mm: e.target.value === "" ? null : parseFloat(e.target.value) })} /></div>
            <div><Label>Opening Stock</Label><Input type="number" step="0.001" value={form.opening_stock ?? 0} onChange={(e) => setForm({ ...form, opening_stock: parseFloat(e.target.value) || 0 })} disabled={!!form.id} /></div>
            <div><Label>Reorder Level</Label><Input type="number" step="0.001" value={form.reorder_level ?? 0} onChange={(e) => setForm({ ...form, reorder_level: parseFloat(e.target.value) || 0 })} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submit} disabled={save.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
