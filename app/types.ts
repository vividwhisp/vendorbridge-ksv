export type User = {
  id: number;
  email: string;
  password: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
};

export type LogEntry = {
  id: number;
  layer: string;
  msg: string;
  ok: boolean;
  err: boolean;
};

export type LogFn = (
  layer: string,
  msg: string,
  ok?: boolean,
  err?: boolean,
) => void;

export type PageView = "landing" | "login" | "signup" | "dashboard";
export type AuthMode = "login" | "signup";
