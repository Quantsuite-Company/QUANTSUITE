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
      alpha_metrics: {
        Row: {
          alpha_id: string
          created_at: string | null
          date: string
          half_life_days: number | null
          ic: number | null
          ic_sharpe: number | null
          id: string
          is_healthy: boolean | null
          lookback_days: number | null
          user_id: string | null
        }
        Insert: {
          alpha_id: string
          created_at?: string | null
          date: string
          half_life_days?: number | null
          ic?: number | null
          ic_sharpe?: number | null
          id?: string
          is_healthy?: boolean | null
          lookback_days?: number | null
          user_id?: string | null
        }
        Update: {
          alpha_id?: string
          created_at?: string | null
          date?: string
          half_life_days?: number | null
          ic?: number | null
          ic_sharpe?: number | null
          id?: string
          is_healthy?: boolean | null
          lookback_days?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      alpha_signals: {
        Row: {
          alpha_id: string
          created_at: string | null
          date: string
          id: string
          percentile_rank: number | null
          raw_value: number | null
          ticker: string
          universe: string
          user_id: string | null
          zscore: number | null
        }
        Insert: {
          alpha_id: string
          created_at?: string | null
          date: string
          id?: string
          percentile_rank?: number | null
          raw_value?: number | null
          ticker: string
          universe?: string
          user_id?: string | null
          zscore?: number | null
        }
        Update: {
          alpha_id?: string
          created_at?: string | null
          date?: string
          id?: string
          percentile_rank?: number | null
          raw_value?: number | null
          ticker?: string
          universe?: string
          user_id?: string | null
          zscore?: number | null
        }
        Relationships: []
      }
      backtests: {
        Row: {
          completed_at: string | null
          config: Json
          created_at: string
          error_message: string | null
          id: string
          results: Json | null
          status: string
          strategy_id: string | null
          strategy_name: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          config: Json
          created_at?: string
          error_message?: string | null
          id?: string
          results?: Json | null
          status?: string
          strategy_id?: string | null
          strategy_name: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          results?: Json | null
          status?: string
          strategy_id?: string | null
          strategy_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backtests_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_drawings: {
        Row: {
          color: string
          created_at: string
          drawing_type: string
          id: string
          label: string | null
          points: Json
          symbol: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          drawing_type: string
          id?: string
          label?: string | null
          points: Json
          symbol: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          drawing_type?: string
          id?: string
          label?: string | null
          points?: Json
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_logs: {
        Row: {
          actions_suggested: string[] | null
          content: string
          created_at: string | null
          emotion_detected: string | null
          id: string
          intent_detected: string | null
          message_type: string
          user_id: string | null
        }
        Insert: {
          actions_suggested?: string[] | null
          content: string
          created_at?: string | null
          emotion_detected?: string | null
          id?: string
          intent_detected?: string | null
          message_type: string
          user_id?: string | null
        }
        Update: {
          actions_suggested?: string[] | null
          content?: string
          created_at?: string | null
          emotion_detected?: string | null
          id?: string
          intent_detected?: string | null
          message_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          created_at: string
          data: Json
          date: string
          id: string
          source: string
          ticker: string
          timeframe: string
        }
        Insert: {
          created_at?: string
          data: Json
          date: string
          id?: string
          source: string
          ticker: string
          timeframe?: string
        }
        Update: {
          created_at?: string
          data?: Json
          date?: string
          id?: string
          source?: string
          ticker?: string
          timeframe?: string
        }
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
          alpha_weights: Json
          created_at: string | null
          date: string
          id: string
          metrics: Json | null
          user_id: string | null
          weights: Json
        }
        Insert: {
          alpha_weights: Json
          created_at?: string | null
          date: string
          id?: string
          metrics?: Json | null
          user_id?: string | null
          weights: Json
        }
        Update: {
          alpha_weights?: Json
          created_at?: string | null
          date?: string
          id?: string
          metrics?: Json | null
          user_id?: string | null
          weights?: Json
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          positions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          positions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          positions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      screener_results: {
        Row: {
          created_at: string | null
          expires_at: string | null
          filters: Json
          id: string
          results: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          filters: Json
          id?: string
          results: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          filters?: Json
          id?: string
          results?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      shared_reports: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          owner_id: string
          report_id: string
          report_type: string
          share_token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id: string
          report_id: string
          report_type: string
          share_token: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string
          report_id?: string
          report_type?: string
          share_token?: string
          view_count?: number
        }
        Relationships: []
      }
      strategies: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          strategy_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          strategy_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          strategy_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_alpha_signals: {
        Row: {
          combined_score: number | null
          created_at: string
          date: string
          id: string
          portfolio_id: string | null
          signals: Json
          ticker: string
          user_id: string
        }
        Insert: {
          combined_score?: number | null
          created_at?: string
          date: string
          id?: string
          portfolio_id?: string | null
          signals: Json
          ticker: string
          user_id: string
        }
        Update: {
          combined_score?: number | null
          created_at?: string
          date?: string
          id?: string
          portfolio_id?: string | null
          signals?: Json
          ticker?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_alpha_signals_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_contexts: {
        Row: {
          conversation_history: Json | null
          created_at: string | null
          id: string
          last_analysis_data: Json | null
          preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_history?: Json | null
          created_at?: string | null
          id?: string
          last_analysis_data?: Json | null
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_history?: Json | null
          created_at?: string | null
          id?: string
          last_analysis_data?: Json | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      walk_forward_results: {
        Row: {
          config: Json
          created_at: string | null
          cumulative_returns: number | null
          id: string
          max_drawdown: number | null
          out_of_sample_metrics: Json | null
          sharpe_ratio: number | null
          user_id: string | null
          windows: Json
        }
        Insert: {
          config: Json
          created_at?: string | null
          cumulative_returns?: number | null
          id?: string
          max_drawdown?: number | null
          out_of_sample_metrics?: Json | null
          sharpe_ratio?: number | null
          user_id?: string | null
          windows: Json
        }
        Update: {
          config?: Json
          created_at?: string | null
          cumulative_returns?: number | null
          id?: string
          max_drawdown?: number | null
          out_of_sample_metrics?: Json | null
          sharpe_ratio?: number | null
          user_id?: string | null
          windows?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_screener_results: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "free" | "pro" | "enterprise" | "admin"
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
      app_role: ["free", "pro", "enterprise", "admin"],
    },
  },
} as const
