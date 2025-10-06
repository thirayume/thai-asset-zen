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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          id: string
          record_id: string | null
          table_name: string | null
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investment_suggestions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          holding_period: string | null
          id: string
          profit_potential: number | null
          reasoning: string | null
          recommended_entry: number | null
          recommended_exit: number | null
          risk_level: string
          stock_name: string
          stock_symbol: string
          stop_loss: number | null
          suggestion_type: string
          target_audience: string | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          holding_period?: string | null
          id?: string
          profit_potential?: number | null
          reasoning?: string | null
          recommended_entry?: number | null
          recommended_exit?: number | null
          risk_level: string
          stock_name: string
          stock_symbol: string
          stop_loss?: number | null
          suggestion_type: string
          target_audience?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          holding_period?: string | null
          id?: string
          profit_potential?: number | null
          reasoning?: string | null
          recommended_entry?: number | null
          recommended_exit?: number | null
          risk_level?: string
          stock_name?: string
          stock_symbol?: string
          stop_loss?: number | null
          suggestion_type?: string
          target_audience?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      market_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          severity: string | null
          stock_symbol: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          severity?: string | null
          stock_symbol?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string | null
          stock_symbol?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_high_risk: boolean | null
          created_at: string | null
          default_budget: number | null
          email: string | null
          full_name: string | null
          id: string
          max_position_size_percent: number | null
          preferred_language: string | null
          updated_at: string | null
        }
        Insert: {
          allow_high_risk?: boolean | null
          created_at?: string | null
          default_budget?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          max_position_size_percent?: number | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_high_risk?: boolean | null
          created_at?: string | null
          default_budget?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          max_position_size_percent?: number | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      thai_stocks: {
        Row: {
          change_percent: number | null
          created_at: string | null
          current_price: number | null
          dividend_yield: number | null
          id: string
          last_updated: string | null
          market_cap: number | null
          name: string
          pe_ratio: number | null
          symbol: string
          volume: number | null
        }
        Insert: {
          change_percent?: number | null
          created_at?: string | null
          current_price?: number | null
          dividend_yield?: number | null
          id?: string
          last_updated?: string | null
          market_cap?: number | null
          name: string
          pe_ratio?: number | null
          symbol: string
          volume?: number | null
        }
        Update: {
          change_percent?: number | null
          created_at?: string | null
          current_price?: number | null
          dividend_yield?: number | null
          id?: string
          last_updated?: string | null
          market_cap?: number | null
          name?: string
          pe_ratio?: number | null
          symbol?: string
          volume?: number | null
        }
        Relationships: []
      }
      trade_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          current_price: number | null
          id: string
          is_read: boolean | null
          message: string
          position_id: string | null
          stock_name: string
          stock_symbol: string
          trigger_price: number | null
          user_id: string
          watchlist_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          current_price?: number | null
          id?: string
          is_read?: boolean | null
          message: string
          position_id?: string | null
          stock_name: string
          stock_symbol: string
          trigger_price?: number | null
          user_id: string
          watchlist_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          current_price?: number | null
          id?: string
          is_read?: boolean | null
          message?: string
          position_id?: string | null
          stock_name?: string
          stock_symbol?: string
          trigger_price?: number | null
          user_id?: string
          watchlist_id?: string | null
        }
        Relationships: []
      }
      user_portfolios: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          total_cash: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          total_cash?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          total_cash?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_positions: {
        Row: {
          average_entry_price: number
          created_at: string | null
          id: string
          notes: string | null
          portfolio_id: string | null
          purchase_date: string
          shares_owned: number
          sold_at: string | null
          sold_price: number | null
          status: string | null
          stock_name: string
          stock_symbol: string
          stop_loss: number | null
          target_price: number | null
          user_id: string
        }
        Insert: {
          average_entry_price: number
          created_at?: string | null
          id?: string
          notes?: string | null
          portfolio_id?: string | null
          purchase_date: string
          shares_owned: number
          sold_at?: string | null
          sold_price?: number | null
          status?: string | null
          stock_name: string
          stock_symbol: string
          stop_loss?: number | null
          target_price?: number | null
          user_id: string
        }
        Update: {
          average_entry_price?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          portfolio_id?: string | null
          purchase_date?: string
          shares_owned?: number
          sold_at?: string | null
          sold_price?: number | null
          status?: string | null
          stock_name?: string
          stock_symbol?: string
          stop_loss?: number | null
          target_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_positions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "user_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          stock_name: string
          stock_symbol: string
          target_entry_price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          stock_name: string
          stock_symbol: string
          target_entry_price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          stock_name?: string
          stock_symbol?: string
          target_entry_price?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_suggestions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_cron_jobs: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          command: string
          database: string
          jobid: number
          jobname: string
          nodename: string
          nodeport: number
          schedule: string
          username: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const
