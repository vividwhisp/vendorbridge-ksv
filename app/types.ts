export type User = {
  id: string;
  email: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  user_id?: string;
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

export type AuthMode = "login" | "signup";
