export type User = {
  id: string;
  email: string;
  role?: import("./lib/rbac").Role;
};

export type Row = Record<string, unknown>;

export type AuthMode = "login" | "signup";
