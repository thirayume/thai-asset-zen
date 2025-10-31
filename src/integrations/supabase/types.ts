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
      auto_trade_executions: {
        Row: {
          action: Database["public"]["Enums"]["trade_action"]
          broker_order_id: string | null
          confidence_score: number | null
          created_at: string | null
          executed_at: string | null
          execution_price: number | null
          failure_reason: string | null
          id: string
          price: number
          retry_count: number | null
          shares: number
          signal_id: string | null
          status: Database["public"]["Enums"]["execution_status"] | null
          stock_name: string
          stock_symbol: string
          stop_loss: number | null
          take_profit: number | null
          total_value: number
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["trade_action"]
          broker_order_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          executed_at?: string | null
          execution_price?: number | null
          failure_reason?: string | null
          id?: string
          price: number
          retry_count?: number | null
          shares: number
          signal_id?: string | null
          status?: Database["public"]["Enums"]["execution_status"] | null
          stock_name: string
          stock_symbol: string
          stop_loss?: number | null
          take_profit?: number | null
          total_value: number
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["trade_action"]
          broker_order_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          executed_at?: string | null
          execution_price?: number | null
          failure_reason?: string | null
          id?: string
          price?: number
          retry_count?: number | null
          shares?: number
          signal_id?: string | null
          status?: Database["public"]["Enums"]["execution_status"] | null
          stock_name?: string
          stock_symbol?: string
          stop_loss?: number | null
          take_profit?: number | null
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_trade_executions_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_credentials: {
        Row: {
          account_no: string
          app_code: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_no: string
          app_code: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_no?: string
          app_code?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_price_alerts: {
        Row: {
          alert_type: string
          condition_value: number
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_triggered: boolean | null
          notes: string | null
          notification_sent: boolean | null
          stock_name: string
          stock_symbol: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          condition_value: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_triggered?: boolean | null
          notes?: string | null
          notification_sent?: boolean | null
          stock_name: string
          stock_symbol: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          condition_value?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_triggered?: boolean | null
          notes?: string | null
          notification_sent?: boolean | null
          stock_name?: string
          stock_symbol?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gold_price_history: {
        Row: {
          created_at: string | null
          gold_type: string
          id: string
          price_per_baht: number
          price_per_gram: number
          price_type: string
          recorded_at: string
        }
        Insert: {
          created_at?: string | null
          gold_type: string
          id?: string
          price_per_baht: number
          price_per_gram: number
          price_type: string
          recorded_at: string
        }
        Update: {
          created_at?: string | null
          gold_type?: string
          id?: string
          price_per_baht?: number
          price_per_gram?: number
          price_type?: string
          recorded_at?: string
        }
        Relationships: []
      }
      gold_prices: {
        Row: {
          created_at: string | null
          gold_type: string
          id: string
          price_per_baht: number
          price_per_gram: number
          price_type: string
          recorded_at: string
        }
        Insert: {
          created_at?: string | null
          gold_type: string
          id?: string
          price_per_baht: number
          price_per_gram: number
          price_type: string
          recorded_at?: string
        }
        Update: {
          created_at?: string | null
          gold_type?: string
          id?: string
          price_per_baht?: number
          price_per_gram?: number
          price_type?: string
          recorded_at?: string
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
      monitored_positions: {
        Row: {
          active: boolean | null
          created_at: string | null
          current_price: number | null
          entry_price: number
          exit_reason: string | null
          exited_at: string | null
          highest_price_seen: number | null
          id: string
          last_checked_at: string | null
          position_id: string | null
          stop_loss_price: number | null
          take_profit_price: number | null
          trailing_stop_enabled: boolean | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          current_price?: number | null
          entry_price: number
          exit_reason?: string | null
          exited_at?: string | null
          highest_price_seen?: number | null
          id?: string
          last_checked_at?: string | null
          position_id?: string | null
          stop_loss_price?: number | null
          take_profit_price?: number | null
          trailing_stop_enabled?: boolean | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number
          exit_reason?: string | null
          exited_at?: string | null
          highest_price_seen?: number | null
          id?: string
          last_checked_at?: string | null
          position_id?: string | null
          stop_loss_price?: number | null
          take_profit_price?: number | null
          trailing_stop_enabled?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitored_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "user_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      mt5_ticks: {
        Row: {
          ask: number
          bid: number
          created_at: string | null
          id: number
          spread: number | null
          symbol: string
          timestamp: string
          volume: number | null
        }
        Insert: {
          ask: number
          bid: number
          created_at?: string | null
          id?: number
          spread?: number | null
          symbol: string
          timestamp?: string
          volume?: number | null
        }
        Update: {
          ask?: number
          bid?: number
          created_at?: string | null
          id?: number
          spread?: number | null
          symbol?: string
          timestamp?: string
          volume?: number | null
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
      stock_price_history: {
        Row: {
          close_price: number | null
          created_at: string | null
          high_price: number | null
          id: string
          low_price: number | null
          open_price: number | null
          recorded_at: string
          stock_name: string
          stock_symbol: string
          volume: number | null
        }
        Insert: {
          close_price?: number | null
          created_at?: string | null
          high_price?: number | null
          id?: string
          low_price?: number | null
          open_price?: number | null
          recorded_at: string
          stock_name: string
          stock_symbol: string
          volume?: number | null
        }
        Update: {
          close_price?: number | null
          created_at?: string | null
          high_price?: number | null
          id?: string
          low_price?: number | null
          open_price?: number | null
          recorded_at?: string
          stock_name?: string
          stock_symbol?: string
          volume?: number | null
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
          close_price: number | null
          created_at: string | null
          current_price: number | null
          dividend_yield: number | null
          high_price: number | null
          id: string
          industry: string | null
          last_updated: string | null
          low_price: number | null
          market_cap: number | null
          name: string
          open_price: number | null
          pe_ratio: number | null
          sector: string | null
          symbol: string
          volume: number | null
        }
        Insert: {
          change_percent?: number | null
          close_price?: number | null
          created_at?: string | null
          current_price?: number | null
          dividend_yield?: number | null
          high_price?: number | null
          id?: string
          industry?: string | null
          last_updated?: string | null
          low_price?: number | null
          market_cap?: number | null
          name: string
          open_price?: number | null
          pe_ratio?: number | null
          sector?: string | null
          symbol: string
          volume?: number | null
        }
        Update: {
          change_percent?: number | null
          close_price?: number | null
          created_at?: string | null
          current_price?: number | null
          dividend_yield?: number | null
          high_price?: number | null
          id?: string
          industry?: string | null
          last_updated?: string | null
          low_price?: number | null
          market_cap?: number | null
          name?: string
          open_price?: number | null
          pe_ratio?: number | null
          sector?: string | null
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
      trade_executions: {
        Row: {
          action: string
          closed_at: string | null
          created_at: string | null
          current_price: number | null
          entry_price: number | null
          error_message: string | null
          executed_at: string | null
          id: string
          order_id: string | null
          profit_loss: number | null
          signal_id: string | null
          status: string
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          user_id: string | null
          volume: number
        }
        Insert: {
          action: string
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          order_id?: string | null
          profit_loss?: number | null
          signal_id?: string | null
          status: string
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          user_id?: string | null
          volume: number
        }
        Update: {
          action?: string
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          order_id?: string | null
          profit_loss?: number | null
          signal_id?: string | null
          status?: string
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          user_id?: string | null
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "trade_executions_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_bot_config: {
        Row: {
          allowed_signal_types: string[] | null
          auto_stop_loss: boolean | null
          auto_take_profit: boolean | null
          broker_name: string | null
          created_at: string | null
          daily_loss_limit: number | null
          enabled: boolean | null
          id: string
          max_daily_trades: number | null
          max_portfolio_drawdown: number | null
          max_position_size: number | null
          max_total_exposure: number | null
          min_confidence_score: number | null
          mode: Database["public"]["Enums"]["trading_mode"] | null
          trailing_stop_percent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_signal_types?: string[] | null
          auto_stop_loss?: boolean | null
          auto_take_profit?: boolean | null
          broker_name?: string | null
          created_at?: string | null
          daily_loss_limit?: number | null
          enabled?: boolean | null
          id?: string
          max_daily_trades?: number | null
          max_portfolio_drawdown?: number | null
          max_position_size?: number | null
          max_total_exposure?: number | null
          min_confidence_score?: number | null
          mode?: Database["public"]["Enums"]["trading_mode"] | null
          trailing_stop_percent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_signal_types?: string[] | null
          auto_stop_loss?: boolean | null
          auto_take_profit?: boolean | null
          broker_name?: string | null
          created_at?: string | null
          daily_loss_limit?: number | null
          enabled?: boolean | null
          id?: string
          max_daily_trades?: number | null
          max_portfolio_drawdown?: number | null
          max_position_size?: number | null
          max_total_exposure?: number | null
          min_confidence_score?: number | null
          mode?: Database["public"]["Enums"]["trading_mode"] | null
          trailing_stop_percent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trading_signals: {
        Row: {
          confidence_score: number
          created_at: string | null
          current_price: number | null
          expires_at: string | null
          id: string
          indicators: Json | null
          reasoning: string
          signal_type: string
          stock_name: string
          stock_symbol: string
          stop_loss: number | null
          target_price: number | null
        }
        Insert: {
          confidence_score: number
          created_at?: string | null
          current_price?: number | null
          expires_at?: string | null
          id?: string
          indicators?: Json | null
          reasoning: string
          signal_type: string
          stock_name: string
          stock_symbol: string
          stop_loss?: number | null
          target_price?: number | null
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          current_price?: number | null
          expires_at?: string | null
          id?: string
          indicators?: Json | null
          reasoning?: string
          signal_type?: string
          stock_name?: string
          stock_symbol?: string
          stop_loss?: number | null
          target_price?: number | null
        }
        Relationships: []
      }
      user_gold_positions: {
        Row: {
          created_at: string | null
          gold_type: string
          id: string
          notes: string | null
          portfolio_id: string | null
          purchase_date: string
          purchase_price_per_baht: number
          sold_at: string | null
          sold_price_per_baht: number | null
          status: string | null
          total_cost: number
          user_id: string
          weight_in_baht: number
          weight_in_grams: number
        }
        Insert: {
          created_at?: string | null
          gold_type: string
          id?: string
          notes?: string | null
          portfolio_id?: string | null
          purchase_date?: string
          purchase_price_per_baht: number
          sold_at?: string | null
          sold_price_per_baht?: number | null
          status?: string | null
          total_cost: number
          user_id: string
          weight_in_baht: number
          weight_in_grams: number
        }
        Update: {
          created_at?: string | null
          gold_type?: string
          id?: string
          notes?: string | null
          portfolio_id?: string | null
          purchase_date?: string
          purchase_price_per_baht?: number
          sold_at?: string | null
          sold_price_per_baht?: number | null
          status?: string | null
          total_cost?: number
          user_id?: string
          weight_in_baht?: number
          weight_in_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_gold_positions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "user_portfolios"
            referencedColumns: ["id"]
          },
        ]
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
      cleanup_expired_suggestions: { Args: never; Returns: undefined }
      cleanup_old_ticks: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_cron_jobs: {
        Args: never
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
      execution_status: "pending" | "executed" | "failed" | "cancelled"
      trade_action: "BUY" | "SELL"
      trading_mode: "paper" | "live"
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
      execution_status: ["pending", "executed", "failed", "cancelled"],
      trade_action: ["BUY", "SELL"],
      trading_mode: ["paper", "live"],
    },
  },
} as const
