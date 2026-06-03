import { getSupabase } from "./supabase-client";

export const db = {
  async signIn(email: string, password: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data.user ? { id: data.user.id, email: data.user.email ?? email } : null,
      error: error?.message ?? null,
    };
  },

  async signUp(email: string, password: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return {
      user: data.user ? { id: data.user.id, email: data.user.email ?? email } : null,
      error: error?.message ?? null,
    };
  },

  async signOut() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },
};
