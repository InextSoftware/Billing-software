export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      company_settings: {
        Row: {
          address: string | null
          bill_style: string
          company_name: string
          default_gst_pct: number
          default_hsn: string | null
          default_insurance_pct: number
          email: string | null
          gstin: string | null
          home_state: string | null
          id: string
          jurisdiction: string | null
          office_line: string | null
          phone: string | null
          round_off_enabled: boolean
          state_code: string | null
          tagline: string | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bill_style?: string
          company_name?: string
          default_gst_pct?: number
          default_hsn?: string | null
          default_insurance_pct?: number
          email?: string | null
          gstin?: string | null
          home_state?: string | null
          id?: string
          jurisdiction?: string | null
          office_line?: string | null
          phone?: string | null
          round_off_enabled?: boolean
          state_code?: string | null
          tagline?: string | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bill_style?: string
          company_name?: string
          default_gst_pct?: number
          default_hsn?: string | null
          default_insurance_pct?: number
          email?: string | null
          gstin?: string | null
          home_state?: string | null
          id?: string
          jurisdiction?: string | null
          office_line?: string | null
          phone?: string | null
          round_off_enabled?: boolean
          state_code?: string | null
          tagline?: string | null
          terms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          mobile: string | null
          name: string
          state: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          mobile?: string | null
          name: string
          state?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          mobile?: string | null
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      invoice_counters: {
        Row: {
          last_seq: number
          year_month: string
        }
        Insert: {
          last_seq?: number
          year_month: string
        }
        Update: {
          last_seq?: number
          year_month?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          basis: string
          gsm: number | null
          id: string
          invoice_id: string
          length_m: number | null
          material_id: string | null
          paper_type: string | null
          qty_pcs: number | null
          qty_rolls: number | null
          rate_kg: number
          rate_meter: number
          rate_pcs: number
          rate_ton: number
          sort_order: number
          weight_kg: number
          weight_ton: number
          width_mm: number | null
        }
        Insert: {
          amount?: number
          basis?: string
          gsm?: number | null
          id?: string
          invoice_id: string
          length_m?: number | null
          material_id?: string | null
          paper_type?: string | null
          qty_pcs?: number | null
          qty_rolls?: number | null
          rate_kg?: number
          rate_meter?: number
          rate_pcs?: number
          rate_ton?: number
          sort_order?: number
          weight_kg?: number
          weight_ton?: number
          width_mm?: number | null
        }
        Update: {
          amount?: number
          basis?: string
          gsm?: number | null
          id?: string
          invoice_id?: string
          length_m?: number | null
          material_id?: string | null
          paper_type?: string | null
          qty_pcs?: number | null
          qty_rolls?: number | null
          rate_kg?: number
          rate_meter?: number
          rate_pcs?: number
          rate_ton?: number
          sort_order?: number
          weight_kg?: number
          weight_ton?: number
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stock_on_hand"
            referencedColumns: ["material_id"]
          },
        ]
      }
      invoices: {
        Row: {
          advance_freight: number
          cgst: number
          challan_no: string | null
          created_at: string
          customer_id: string
          grand_total: number
          gst_pct: number
          hsn_code: string | null
          id: string
          igst: number
          insurance_pct: number
          invoice_date: string
          invoice_no: string
          lr_date: string | null
          lr_no: string | null
          notes: string | null
          order_date: string | null
          order_no: string | null
          payment_terms: string | null
          round_off: number
          sgst: number
          subtotal: number
          total_kg: number
          total_meter: number
          total_pcs: number
          total_ton: number
          transport_name: string | null
          vehicle_no: string | null
        }
        Insert: {
          advance_freight?: number
          cgst?: number
          challan_no?: string | null
          created_at?: string
          customer_id: string
          grand_total?: number
          gst_pct?: number
          hsn_code?: string | null
          id?: string
          igst?: number
          insurance_pct?: number
          invoice_date?: string
          invoice_no: string
          lr_date?: string | null
          lr_no?: string | null
          notes?: string | null
          order_date?: string | null
          order_no?: string | null
          payment_terms?: string | null
          round_off?: number
          sgst?: number
          subtotal?: number
          total_kg?: number
          total_meter?: number
          total_pcs?: number
          total_ton?: number
          transport_name?: string | null
          vehicle_no?: string | null
        }
        Update: {
          advance_freight?: number
          cgst?: number
          challan_no?: string | null
          created_at?: string
          customer_id?: string
          grand_total?: number
          gst_pct?: number
          hsn_code?: string | null
          id?: string
          igst?: number
          insurance_pct?: number
          invoice_date?: string
          invoice_no?: string
          lr_date?: string | null
          lr_no?: string | null
          notes?: string | null
          order_date?: string | null
          order_no?: string | null
          payment_terms?: string | null
          round_off?: number
          sgst?: number
          subtotal?: number
          total_kg?: number
          total_meter?: number
          total_pcs?: number
          total_ton?: number
          transport_name?: string | null
          vehicle_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          default_basis: string
          default_rate: number
          gsm: number | null
          hsn_code: string | null
          id: string
          name: string
          notes: string | null
          opening_stock: number
          reorder_level: number
          stock_unit: string
          updated_at: string
          width_mm: number | null
        }
        Insert: {
          created_at?: string
          default_basis?: string
          default_rate?: number
          gsm?: number | null
          hsn_code?: string | null
          id?: string
          name: string
          notes?: string | null
          opening_stock?: number
          reorder_level?: number
          stock_unit?: string
          updated_at?: string
          width_mm?: number | null
        }
        Update: {
          created_at?: string
          default_basis?: string
          default_rate?: number
          gsm?: number | null
          hsn_code?: string | null
          id?: string
          name?: string
          notes?: string | null
          opening_stock?: number
          reorder_level?: number
          stock_unit?: string
          updated_at?: string
          width_mm?: number | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          invoice_id: string | null
          material_id: string
          movement_date: string
          notes: string | null
          qty: number
          reference: string | null
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          material_id: string
          movement_date?: string
          notes?: string | null
          qty: number
          reference?: string | null
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          material_id?: string
          movement_date?: string
          notes?: string | null
          qty?: number
          reference?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stock_on_hand"
            referencedColumns: ["material_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          designation: string | null
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          designation?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          designation?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      stock_on_hand: {
        Row: {
          material_id: string | null
          name: string | null
          on_hand: number | null
          reorder_level: number | null
          stock_unit: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      next_invoice_no: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
