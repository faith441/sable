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
      brand_api_logs: {
        Row: {
          brand_id: string | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          response_body: Json | null
          status_code: number | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_api_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_orders: {
        Row: {
          brand_id: string | null
          brand_order_id: string
          created_at: string | null
          fulfillment_status: string | null
          id: string
          items: Json
          metadata: Json | null
          order_status: string
          payment_status: string | null
          shipping_address: Json | null
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          brand_order_id: string
          created_at?: string | null
          fulfillment_status?: string | null
          id?: string
          items: Json
          metadata?: Json | null
          order_status: string
          payment_status?: string | null
          shipping_address?: Json | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          brand_order_id?: string
          created_at?: string | null
          fulfillment_status?: string | null
          id?: string
          items?: Json
          metadata?: Json | null
          order_status?: string
          payment_status?: string | null
          shipping_address?: Json | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          api_key_hash: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          order_tracking_enabled: boolean | null
          payment_provider: string | null
          updated_at: string
          webhook_url: string | null
          website_url: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          api_key_hash?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          order_tracking_enabled?: boolean | null
          payment_provider?: string | null
          updated_at?: string
          webhook_url?: string | null
          website_url?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          api_key_hash?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          order_tracking_enabled?: boolean | null
          payment_provider?: string | null
          updated_at?: string
          webhook_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      capsule_wardrobes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          season: string | null
          total_pieces: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          season?: string | null
          total_pieces?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          season?: string | null
          total_pieces?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_data: Json | null
          product_id: string
          quantity: number
          session_id: string | null
          size: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_data?: Json | null
          product_id: string
          quantity?: number
          session_id?: string | null
          size?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_data?: Json | null
          product_id?: string
          quantity?: number
          session_id?: string | null
          size?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      garment_metadata: {
        Row: {
          care_instructions: string[] | null
          closure_type: string | null
          created_at: string | null
          fabric_composition: Json | null
          fit_type: string | null
          formality_level: string | null
          id: string
          layering_position: string | null
          leg_opening: string | null
          neckline: string | null
          occasion: string[] | null
          pattern: string | null
          product_id: string | null
          rise: string | null
          season: string[] | null
          silhouette: string | null
          sleeve_length: string | null
          style_tags: string[] | null
          updated_at: string | null
          versatility_score: number | null
        }
        Insert: {
          care_instructions?: string[] | null
          closure_type?: string | null
          created_at?: string | null
          fabric_composition?: Json | null
          fit_type?: string | null
          formality_level?: string | null
          id?: string
          layering_position?: string | null
          leg_opening?: string | null
          neckline?: string | null
          occasion?: string[] | null
          pattern?: string | null
          product_id?: string | null
          rise?: string | null
          season?: string[] | null
          silhouette?: string | null
          sleeve_length?: string | null
          style_tags?: string[] | null
          updated_at?: string | null
          versatility_score?: number | null
        }
        Update: {
          care_instructions?: string[] | null
          closure_type?: string | null
          created_at?: string | null
          fabric_composition?: Json | null
          fit_type?: string | null
          formality_level?: string | null
          id?: string
          layering_position?: string | null
          leg_opening?: string | null
          neckline?: string | null
          occasion?: string[] | null
          pattern?: string | null
          product_id?: string | null
          rise?: string | null
          season?: string[] | null
          silhouette?: string | null
          sleeve_length?: string | null
          style_tags?: string[] | null
          updated_at?: string | null
          versatility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "garment_metadata_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_plans: {
        Row: {
          created_at: string
          day_of_week: string | null
          id: string
          image_url: string | null
          items: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: string | null
          id?: string
          image_url?: string | null
          items: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: string | null
          id?: string
          image_url?: string | null
          items?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_compatibility: {
        Row: {
          compatibility_reasons: Json | null
          compatibility_score: number | null
          compatible_with: string | null
          created_at: string | null
          id: string
          product_id: string | null
          updated_at: string | null
        }
        Insert: {
          compatibility_reasons?: Json | null
          compatibility_score?: number | null
          compatible_with?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          compatibility_reasons?: Json | null
          compatibility_score?: number | null
          compatible_with?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_compatibility_compatible_with_fkey"
            columns: ["compatible_with"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string
          category: string
          colors: string[] | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          product_url: string
          sizes: string[] | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          category: string
          colors?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          product_url: string
          sizes?: string[] | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category?: string
          colors?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          product_url?: string
          sizes?: string[] | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      style_preferences: {
        Row: {
          body_type: string | null
          budget_range: string
          color_preferences: string[] | null
          created_at: string
          favorite_brands: string[] | null
          id: string
          lifestyle: string
          occasions: string[] | null
          sizes: Json | null
          style_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body_type?: string | null
          budget_range: string
          color_preferences?: string[] | null
          created_at?: string
          favorite_brands?: string[] | null
          id?: string
          lifestyle: string
          occasions?: string[] | null
          sizes?: Json | null
          style_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body_type?: string | null
          budget_range?: string
          color_preferences?: string[] | null
          created_at?: string
          favorite_brands?: string[] | null
          id?: string
          lifestyle?: string
          occasions?: string[] | null
          sizes?: Json | null
          style_type?: string
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_wardrobe: {
        Row: {
          custom_brand: string | null
          custom_category: string | null
          custom_description: string | null
          custom_image_url: string | null
          custom_size: string | null
          id: string
          is_custom: boolean | null
          notes: string | null
          product_id: string | null
          purchased_at: string
          user_id: string
        }
        Insert: {
          custom_brand?: string | null
          custom_category?: string | null
          custom_description?: string | null
          custom_image_url?: string | null
          custom_size?: string | null
          id?: string
          is_custom?: boolean | null
          notes?: string | null
          product_id?: string | null
          purchased_at?: string
          user_id: string
        }
        Update: {
          custom_brand?: string | null
          custom_category?: string | null
          custom_description?: string | null
          custom_image_url?: string | null
          custom_size?: string | null
          id?: string
          is_custom?: boolean | null
          notes?: string | null
          product_id?: string | null
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wardrobe_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wardrobe_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          wardrobe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          wardrobe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          wardrobe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wardrobe_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wardrobe_items_wardrobe_id_fkey"
            columns: ["wardrobe_id"]
            isOneToOne: false
            referencedRelation: "capsule_wardrobes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
