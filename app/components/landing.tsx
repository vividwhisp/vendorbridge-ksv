import type { PageView } from "../types";

type LandingProps = {
  go: (page: PageView) => void;
};

export default function Landing({ go }: LandingProps) {
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "6px 18px", marginBottom: 20 }}>
        <span style={{ color: "#818cf8", fontSize: 10, letterSpacing: 3, textTransform: "uppercase" }}>Next.js + Supabase + AI Agent</span>
      </div>
      <h1 style={{ color: "white", fontSize: 30, fontWeight: 700, lineHeight: 1.3, marginBottom: 12, fontFamily: "Georgia,serif" }}>
        Inventory Manager
        <br />
        with AI Agent
      </h1>
      <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.7, maxWidth: 280, marginBottom: 28 }}>
        Full-stack demo with search, edit, and an AI agent that can take actions in your database.
      </p>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => go("login")} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: 9, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Log In
        </button>
        <button onClick={() => go("signup")} style={{ background: "transparent", color: "#818cf8", border: "1px solid #4338ca", borderRadius: 9, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Sign Up
        </button>
      </div>
      <p style={{ color: "#1e293b", fontSize: 11 }}>kori@dev.com / 1234</p>
    </div>
  );
}
