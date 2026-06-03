import type { Product } from "../types";
import { getSupabase } from "./supabase-client";
import { starterProducts } from "./seed-data";

type ProductInsert = Omit<Product, "id" | "user_id">;
type ProductUpdate = Partial<ProductInsert>;

function mapProduct(row: Product): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    quantity: Number(row.quantity),
    category: row.category,
    user_id: row.user_id,
  };
}

async function getCurrentUserId() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user?.id;
}

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

  async getAll() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,quantity,category,user_id")
      .order("id", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapProduct(row as Product));
  },

  async insert(data: ProductInsert) {
    const supabase = getSupabase();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("You must be logged in to add products.");
    }

    const { data: row, error } = await supabase
      .from("products")
      .insert({ ...data, user_id: userId })
      .select("id,name,price,quantity,category,user_id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapProduct(row as Product);
  },

  async seedStarterProducts() {
    const supabase = getSupabase();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("You must be logged in to load sample products.");
    }

    const { data, error } = await supabase
      .from("products")
      .insert(starterProducts.map((product) => ({ ...product, user_id: userId })))
      .select("id,name,price,quantity,category,user_id");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapProduct(row as Product));
  },

  async update(id: number, data: ProductUpdate) {
    const supabase = getSupabase();
    const { data: row, error } = await supabase
      .from("products")
      .update(data)
      .eq("id", id)
      .select("id,name,price,quantity,category,user_id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapProduct(row as Product);
  },

  async remove(id: number) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  },
};
