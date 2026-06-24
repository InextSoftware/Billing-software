import { createFileRoute } from "@tanstack/react-router";
import { useCompanySettings, useSaveCompanySettings, useUsers, useSaveUser, useDeleteUser } from "@/lib/queries";
import { useEffect, useState } from "react";
import type { CompanySettings, UserProfile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Save, Pencil, Trash2, UserPlus } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: companyData } = useCompanySettings();
  const saveCompany = useSaveCompanySettings();
  const { data: users, isLoading: usersLoading } = useUsers(companyData?.id);
  const saveUser = useSaveUser();
  const deleteUser = useDeleteUser();

  const [companyForm, setCompanyForm] = useState<CompanySettings | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);

  useEffect(() => {
    if (companyData && !companyForm) setCompanyForm(companyData);
  }, [companyData, companyForm]);

  if (!companyForm) return <p className="text-sm text-muted-foreground p-6">Loading…</p>;

  const submitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCompany.mutateAsync(companyForm);
      toast.success("Company settings saved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    }
  };

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.name?.trim()) {
      toast.error("User name is required");
      return;
    }
    if (!editingUser?.email?.trim()) {
      toast.error("User email is required");
      return;
    }

    try {
      await saveUser.mutateAsync({
        ...editingUser,
        company_id: companyForm.id,
      } as Partial<UserProfile> & { company_id: string });
      toast.success(editingUser?.id ? "User updated" : "User added");
      setUserDialogOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save user");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your company details and invoice format via company settings.</p>
      </div>

      <form onSubmit={submitCompany}>
        <Card>
          <CardHeader>
            <CardTitle>Business details</CardTitle>
            <CardDescription>Primary information shown on every invoice.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Company Name *</Label>
              <Input value={companyForm.company_name} onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Textarea rows={2} value={companyForm.address ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} />
            </div>
            <div>
              <Label>GSTIN</Label>
              <Input value={companyForm.gstin ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Home State</Label>
              <Input value={companyForm.home_state ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, home_state: e.target.value })} placeholder="e.g. Chhattisgarh" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={companyForm.phone ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={companyForm.email ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Default GST %</Label>
              <Input
                type="number"
                step="0.01"
                value={companyForm.default_gst_pct}
                onChange={(e) => setCompanyForm({ ...companyForm, default_gst_pct: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Default Insurance %</Label>
              <Input
                type="number"
                step="0.01"
                value={companyForm.default_insurance_pct}
                onChange={(e) => setCompanyForm({ ...companyForm, default_insurance_pct: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Default HSN Code</Label>
              <Input
                value={companyForm.default_hsn ?? ""}
                onChange={(e) => setCompanyForm({ ...companyForm, default_hsn: e.target.value })}
                placeholder="e.g. 4819"
              />
            </div>
            <div>
              <Label>Jurisdiction (city)</Label>
              <Input value={companyForm.jurisdiction ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, jurisdiction: e.target.value })} placeholder="e.g. Raipur" />
            </div>
            <div>
              <Label>State Code</Label>
              <Input value={companyForm.state_code ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, state_code: e.target.value })} placeholder="e.g. 22" />
            </div>
            <div>
              <Label>Company PAN</Label>
              <Input value={companyForm.pan ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value.toUpperCase() })} placeholder="e.g. ABCDE1234F" />
            </div>
            <div className="md:col-span-2">
              <Label>Tagline</Label>
              <Input value={companyForm.tagline ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })} placeholder="e.g. Mfgrs: Paper Core, Paper Tubes…" />
            </div>
            <div className="md:col-span-2">
              <Label>Office Line</Label>
              <Input value={companyForm.office_line ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, office_line: e.target.value })} placeholder="e.g. Office: 4/448/3, Gudhiyari, Raipur" />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <input id="round_off_enabled" type="checkbox" checked={!!companyForm.round_off_enabled}
                onChange={(e) => setCompanyForm({ ...companyForm, round_off_enabled: e.target.checked })} />
              <Label htmlFor="round_off_enabled" className="cursor-pointer">Round off grand total on invoices</Label>
            </div>
            <div className="md:col-span-2">
              <Label>Terms / Declaration</Label>
              <Textarea rows={3} value={companyForm.terms ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, terms: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Bank & Signatory</CardTitle>
            <CardDescription>Financial and legal details for the invoice footer.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Bank Name</Label><Input value={companyForm.bank_name ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, bank_name: e.target.value })} /></div>
            <div><Label>Account No.</Label><Input value={companyForm.bank_account ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, bank_account: e.target.value })} /></div>
            <div><Label>Branch</Label><Input value={companyForm.bank_branch ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, bank_branch: e.target.value })} /></div>
            <div><Label>IFSC</Label><Input value={companyForm.ifsc ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, ifsc: e.target.value.toUpperCase() })} /></div>
            <div className="border-t md:col-span-2 my-2" />
            <div><Label>Signatory Name</Label><Input value={companyForm.signatory_name ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, signatory_name: e.target.value })} /></div>
            <div><Label>Designation</Label><Input value={companyForm.signatory_designation ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, signatory_designation: e.target.value })} /></div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Company users</CardTitle>
            <CardDescription>Users for this company. Create up to 3 users and assign them to the company.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="text-sm text-muted-foreground">Users are linked to the current company.</div>
              <Dialog open={userDialogOpen} onOpenChange={(open) => {
                setUserDialogOpen(open);
                if (!open) setEditingUser(null);
              }}>
                <DialogTrigger asChild>
                  <Button disabled={Array.isArray(users) && users.length >= 3} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingUser?.id ? "Edit User" : "Add User"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={submitUser} className="space-y-4">
                    <div>
                      <Label>Name *</Label>
                      <Input value={editingUser?.name ?? ""} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={editingUser?.email ?? ""} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={editingUser?.phone ?? ""} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label>Designation</Label>
                      <Input value={editingUser?.designation ?? ""} onChange={(e) => setEditingUser({ ...editingUser, designation: e.target.value })} />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => { setUserDialogOpen(false); setEditingUser(null); }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saveUser.isPending}>
                        Save user
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Loading users…</p>
            ) : (!users || users.length === 0) ? (
              <p className="text-sm text-muted-foreground">No users defined yet for this company.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone ?? "—"}</TableCell>
                      <TableCell>{user.designation ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingUser(user);
                            setUserDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    await deleteUser.mutateAsync(user.id);
                                    toast.success("User deleted");
                                  } catch (err: any) {
                                    toast.error(err.message ?? "Failed to delete");
                                  }
                                }}
                              >
                                Delete
                              </AlertDialogAction>
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

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saveCompany.isPending} size="lg">
            <Save className="h-4 w-4 mr-2" />
            Save All Company Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
