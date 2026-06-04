export type User = {
  id: string;
  email: string;
  role?: import("./lib/rbac").Role;
};

export type Row = Record<string, unknown>;

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
