import type { Product } from "../types";

type ProductInsert = Omit<Product, "id" | "user_id">;

export const starterProducts: ProductInsert[] = [
    { name: "MacBook Air M3", price: 99999, quantity: 12, category: "Laptops" },
    { name: "iPhone 15 Pro", price: 134999, quantity: 3, category: "Phones" },
    { name: "AirPods Pro", price: 24999, quantity: 89, category: "Audio" },
    { name: "iPad Mini", price: 49999, quantity: 7, category: "Tablets" },
    { name: "Apple Watch S9", price: 41999, quantity: 2, category: "Wearables" },
    { name: "Magic Keyboard", price: 11999, quantity: 45, category: "Accessories" },
];
