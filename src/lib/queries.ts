import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import type {
  Customer, CompanySettings, Invoice, InvoiceItem,
  Material, StockMovement, StockOnHand, UserProfile,
} from "./types";

// ---------------- Customers ----------------
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async (): Promise<Customer[]> => {
      return apiGet<Customer[]>("/api/customers");
    },
  });
}
export function useSaveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<Customer> & { id?: string }) => {
      if (c.id) {
        const { id, ...rest } = c;
        await apiPut(`/api/customers/${id}`, rest);
      } else {
        await apiPost("/api/customers", c);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/api/customers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

// ---------------- Company Settings ----------------
export function useUsers(companyId?: string) {
  return useQuery({
    queryKey: ["users", companyId],
    queryFn: async (): Promise<UserProfile[]> => {
      const url = companyId ? `/api/users?company_id=${encodeURIComponent(companyId)}` : "/api/users";
      return apiGet<UserProfile[]>(url);
    },
  });
}
export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (u: Partial<UserProfile> & { id?: string }) => {
      if (u.id) {
        const { id, ...rest } = u;
        await apiPut(`/api/users/${id}`, rest);
      } else {
        await apiPost("/api/users", u);
      }
    },
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ["users", variables?.company_id] }),
  });
}
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/api/users/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", undefined] });
    },
  });
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ["company_settings"],
    queryFn: async (): Promise<CompanySettings | null> => {
      return apiGet<CompanySettings | null>("/api/company-settings");
    },
  });
}
export function useSaveCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<CompanySettings> & { id: string }) => {
      const { id, ...rest } = s;
      await apiPut(`/api/company-settings/${id}`, rest);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company_settings"] }),
  });
}

// ---------------- Materials ----------------
export function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: async (): Promise<Material[]> => {
      return apiGet<Material[]>("/api/materials");
    },
  });
}
export function useSaveMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<Material> & { id?: string }) => {
      if (m.id) {
        const { id, ...rest } = m;
        await apiPut(`/api/materials/${id}`, rest);
      } else {
        await apiPost("/api/materials", m);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["stock_on_hand"] });
      qc.invalidateQueries({ queryKey: ["stock_ledger"] });
    },
  });
}
export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/api/materials/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["stock_on_hand"] });
    },
  });
}

// ---------------- Stock ----------------
export function useStockOnHand() {
  return useQuery({
    queryKey: ["stock_on_hand"],
    queryFn: async (): Promise<StockOnHand[]> => {
      return apiGet<StockOnHand[]>("/api/stock-on-hand");
    },
  });
}
export function useStockLedger() {
  return useQuery({
    queryKey: ["stock_ledger"],
    queryFn: async (): Promise<Array<StockMovement & { materials: { name: string; stock_unit: string } | null }>> => {
      return apiGet<Array<StockMovement & { materials: { name: string; stock_unit: string } | null }>>("/api/stock-movements");
    },
  });
}
export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<StockMovement>) => {
      await apiPost("/api/stock-movements", m);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_on_hand"] });
      qc.invalidateQueries({ queryKey: ["stock_ledger"] });
    },
  });
}

// ---------------- Invoices ----------------
export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      return apiGet<Array<Invoice & { customers: { name: string; mobile: string | null; gstin: string | null } | null }>>("/api/invoices");
    },
  });
}
export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoice", id],
    enabled: !!id,
    queryFn: async () => {
      return apiGet<{
        invoice: Invoice & { customers: Customer };
        items: Array<InvoiceItem & { materials?: { name: string | null } }>;
      }>(`/api/invoices/${id}`);
    },
  });
}
export async function generateInvoiceNo(): Promise<string> {
  return apiGet<string>("/api/invoices/next-number");
}

export type InvoiceDraft = Omit<Invoice, "id" | "created_at"> & {
  items: Omit<InvoiceItem, "id" | "invoice_id">[];
};

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: InvoiceDraft) => {
      const response = await apiPost<{ invoice: Invoice; items: InvoiceItem[] }>("/api/invoices", draft);
      return response.invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["stock_on_hand"] });
      qc.invalidateQueries({ queryKey: ["stock_ledger"] });
    },
  });
}
export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/api/invoices/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["stock_on_hand"] });
      qc.invalidateQueries({ queryKey: ["stock_ledger"] });
    },
  });
}

// ---------------- Dashboard ----------------
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const rows = await apiGet<any[]>("/api/invoices");
      const total_invoices = rows.length;
      const total_sales = rows.reduce((s, r) => s + Number(r.grand_total ?? 0), 0);
      const total_kg = rows.reduce((s, r) => s + Number(r.total_kg ?? 0), 0);
      const total_ton = rows.reduce((s, r) => s + Number(r.total_ton ?? 0), 0);
      const total_meter = rows.reduce((s, r) => s + Number(r.total_meter ?? 0), 0);

      const months: Record<string, number> = {};
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
        months[key] = 0;
      }
      for (const r of rows) {
        const d = new Date(r.invoice_date);
        if (now.getTime() - d.getTime() > 366 * 24 * 3600 * 1000) continue;
        const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
        if (key in months) months[key] += Number(r.grand_total ?? 0);
      }
      const monthly = Object.entries(months).map(([month, revenue]) => ({ month, revenue }));

      return {
        total_invoices, total_sales, total_kg, total_ton, total_meter,
        monthly, recent: rows.slice(0, 10),
      };
    },
  });
}
