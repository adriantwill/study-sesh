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
      account: {
        Row: {
          accessToken: string | null
          accessTokenExpiresAt: string | null
          accountId: string
          createdAt: string
          id: string
          idToken: string | null
          password: string | null
          providerId: string
          refreshToken: string | null
          refreshTokenExpiresAt: string | null
          scope: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId: string
          createdAt?: string
          id: string
          idToken?: string | null
          password?: string | null
          providerId: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId?: string
          createdAt?: string
          id?: string
          idToken?: string | null
          password?: string | null
          providerId?: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          created_at: string
          due_date: string | null
          id: number
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: number
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: number
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_text: string
          created_at: string | null
          deleted: boolean
          display_order: number | null
          id: string
          image_url: string | null
          ocr_text: string | null
          options: string[]
          original_answer_text: string | null
          original_question_text: string | null
          page_number: number | null
          question_text: string
          upload_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          deleted?: boolean
          display_order?: number | null
          id?: string
          image_url?: string | null
          ocr_text?: string | null
          options?: string[]
          original_answer_text?: string | null
          original_question_text?: string | null
          page_number?: number | null
          question_text: string
          upload_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          deleted?: boolean
          display_order?: number | null
          id?: string
          image_url?: string | null
          ocr_text?: string | null
          options?: string[]
          original_answer_text?: string | null
          original_question_text?: string | null
          page_number?: number | null
          question_text?: string
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          ipAddress: string | null
          token: string
          updatedAt: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          ipAddress?: string | null
          token: string
          updatedAt: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          token?: string
          updatedAt?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      table_uploads: {
        Row: {
          created_at: string | null
          filename: string
          folder_id: string | null
          id: string
          parsed_data: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filename: string
          folder_id?: string | null
          id?: string
          parsed_data?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filename?: string
          folder_id?: string | null
          id?: string
          parsed_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_uploads_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          created_at: string | null
          description: string
          filename: string
          folder_id: string | null
          id: string
          status: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string
          filename: string
          folder_id?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string
          filename?: string
          folder_id?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          createdAt: string
          email: string
          emailVerified: boolean
          id: string
          image: string | null
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          emailVerified: boolean
          id: string
          image?: string | null
          name: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          emailVerified?: boolean
          id?: string
          image?: string | null
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      verification: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string
          value: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt?: string
          value: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      normalize_question_display_order: {
        Args: { p_upload_id: string }
        Returns: undefined
      }
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
