import type { Product, User } from "../types";

const DB: { users: User[]; products: Product[] } = {
  users: [{ id: 1, email: "kori@dev.com", password: "1234" }],
  products: [
    { id: 1, name: "MacBook Air M3", price: 99999, quantity: 12, category: "Laptops" },
    { id: 2, name: "iPhone 15 Pro", price: 134999, quantity: 3, category: "Phones" },
    { id: 3, name: "AirPods Pro", price: 24999, quantity: 89, category: "Audio" },
    { id: 4, name: "iPad Mini", price: 49999, quantity: 7, category: "Tablets" },
    { id: 5, name: "Apple Watch S9", price: 41999, quantity: 2, category: "Wearables" },
    { id: 6, name: "Magic Keyboard", price: 11999, quantity: 45, category: "Accessories" },
  ],
};

let nextId = 7;

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const db = {
  async signIn(email: string, password: string) {
    await wait(900);
    const user = DB.users.find((item) => item.email === email && item.password === password);

    if (!user) {
      return { user: null, error: "Invalid credentials" };
    }

    return { user, error: null };
  },

  async signUp(email: string, password: string) {
    await wait(900);

    if (DB.users.find((item) => item.email === email)) {
      return { user: null, error: "User already exists" };
    }

    const user = { id: DB.users.length + 1, email, password };
    DB.users.push(user);

    return { user, error: null };
  },

  async signOut() {
    await wait(300);
  },

  async getAll() {
    await wait(600);
    return [...DB.products];
  },

  snapshot() {
    return [...DB.products];
  },

  async insert(data: Omit<Product, "id">) {
    await wait(700);
    const row = { id: nextId++, ...data };
    DB.products.push(row);
    return row;
  },

  async update(id: number, data: Partial<Omit<Product, "id">>) {
    await wait(600);
    const index = DB.products.findIndex((product) => product.id === id);

    if (index !== -1) {
      DB.products[index] = { ...DB.products[index], ...data };
    }

    return DB.products[index] ?? null;
  },

  async remove(id: number) {
    await wait(500);
    const index = DB.products.findIndex((product) => product.id === id);

    if (index !== -1) {
      DB.products.splice(index, 1);
    }
  },
};
