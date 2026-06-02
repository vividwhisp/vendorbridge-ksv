import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          price: number;
          quantity: number;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          name: string;
          price?: number;
          quantity?: number;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string;
          price?: number;
          quantity?: number;
          category?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let client: ReturnType<typeof createClient<Database, "public">> | null = null;

export function getSupabase() {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
  }

  client = createClient<Database, "public">(supabaseUrl, supabaseAnonKey);

  return client;
}
