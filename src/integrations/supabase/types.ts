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
      consent_records: {
        Row: {
          accepted_at: string
          created_at: string
          document_slug: string
          document_version: string
          id: string
          request_id: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at: string
          created_at?: string
          document_slug: string
          document_version: string
          id?: string
          request_id?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          created_at?: string
          document_slug?: string
          document_version?: string
          id?: string
          request_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "estimate_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_requests: {
        Row: {
          calculator_mode: string | null
          calculator_snapshot: Json | null
          consent_accepted_at: string
          consent_version: string
          contact_name: string
          created_at: string
          email: string | null
          id: string
          message: string | null
          phone: string | null
          price_version: string | null
          request_number: string
          service_slug: string | null
          source_path: string
          status: string
          submission_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          calculator_mode?: string | null
          calculator_snapshot?: Json | null
          consent_accepted_at: string
          consent_version: string
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          price_version?: string | null
          request_number: string
          service_slug?: string | null
          source_path: string
          status?: string
          submission_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          calculator_mode?: string | null
          calculator_snapshot?: Json | null
          consent_accepted_at?: string
          consent_version?: string
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          price_version?: string | null
          request_number?: string
          service_slug?: string | null
          source_path?: string
          status?: string
          submission_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_camera_sources: {
        Row: {
          camera_id: string
          configuration_reference: string | null
          created_at: string
          provider: string
          provider_camera_id: string
          updated_at: string
        }
        Insert: {
          camera_id: string
          configuration_reference?: string | null
          created_at?: string
          provider: string
          provider_camera_id: string
          updated_at?: string
        }
        Update: {
          camera_id?: string
          configuration_reference?: string | null
          created_at?: string
          provider?: string
          provider_camera_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_camera_sources_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: true
            referencedRelation: "project_cameras"
            referencedColumns: ["id"]
          },
        ]
      }
      project_cameras: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_checked_at: string | null
          name: string
          project_id: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          last_checked_at?: string | null
          name: string
          project_id: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_checked_at?: string | null
          name?: string
          project_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_cameras_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_daily_report_documents: {
        Row: {
          created_at: string
          document_id: string
          report_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          document_id: string
          report_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          document_id?: string
          report_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_daily_report_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "project_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_daily_report_documents_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "project_daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      project_daily_reports: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          issues: string[]
          next_steps: string[]
          project_id: string
          published_at: string | null
          report_date: string
          summary: string
          title: string
          updated_at: string
          work_completed: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          issues?: string[]
          next_steps?: string[]
          project_id: string
          published_at?: string | null
          report_date: string
          summary: string
          title: string
          updated_at?: string
          work_completed?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          issues?: string[]
          next_steps?: string[]
          project_id?: string
          published_at?: string | null
          report_date?: string
          summary?: string
          title?: string
          updated_at?: string
          work_completed?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "project_daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string
          description: string | null
          document_category: string | null
          document_date: string | null
          file_name: string
          id: string
          is_visible_to_client: boolean
          mime_type: string
          project_id: string
          size_bytes: number
          storage_path: string
          title: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_category?: string | null
          document_date?: string | null
          file_name: string
          id?: string
          is_visible_to_client?: boolean
          mime_type: string
          project_id: string
          size_bytes: number
          storage_path: string
          title?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_category?: string | null
          document_date?: string | null
          file_name?: string
          id?: string
          is_visible_to_client?: boolean
          mime_type?: string
          project_id?: string
          size_bytes?: number
          storage_path?: string
          title?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          member_role: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          member_role?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          member_role?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          message_type: string
          project_id: string
          sender_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          message_type?: string
          project_id: string
          sender_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          message_type?: string
          project_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_payments: {
        Row: {
          amount: number | null
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          project_id: string
          stage_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          project_id: string
          stage_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          project_id?: string
          stage_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_payments_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stage_acceptances: {
        Row: {
          attempt_number: number
          client_comment: string | null
          created_at: string
          id: string
          requested_at: string
          requested_by: string | null
          responded_at: string | null
          responded_by: string | null
          stage_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_number: number
          client_comment?: string | null
          created_at?: string
          id?: string
          requested_at?: string
          requested_by?: string | null
          responded_at?: string | null
          responded_by?: string | null
          stage_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          client_comment?: string | null
          created_at?: string
          id?: string
          requested_at?: string
          requested_by?: string | null
          responded_at?: string | null
          responded_by?: string | null
          stage_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stage_acceptances_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string
          description: string | null
          id: string
          planned_end: string | null
          planned_start: string | null
          project_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          description?: string | null
          id?: string
          planned_end?: string | null
          planned_start?: string | null
          project_id: string
          sort_order: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          description?: string | null
          id?: string
          planned_end?: string | null
          planned_start?: string | null
          project_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_demo: boolean
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      submission_rate_limits: {
        Row: {
          attempt_count: number
          expires_at: string
          key_hash: string
          window_started_at: string
        }
        Insert: {
          attempt_count: number
          expires_at: string
          key_hash: string
          window_started_at: string
        }
        Update: {
          attempt_count?: number
          expires_at?: string
          key_hash?: string
          window_started_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_rate_limits: { Args: never; Returns: number }
      consume_submission_rate_limit: {
        Args: { _key_hash: string; _max_attempts: number; _window_ms: number }
        Returns: {
          allowed: boolean
          attempt_count: number
          retry_after_seconds: number
        }[]
      }
      create_estimate_request_transaction: {
        Args: { _payload: Json }
        Returns: {
          created: boolean
          request_number: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      respond_to_stage_acceptance: {
        Args: { acceptance_id: string; comment: string; decision: string }
        Returns: {
          acceptance_id_out: string
          stage_id_out: string
          stage_status_out: string
          status_out: string
        }[]
      }
    }
    Enums: {
      app_role: "client" | "admin"
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
      app_role: ["client", "admin"],
    },
  },
} as const
