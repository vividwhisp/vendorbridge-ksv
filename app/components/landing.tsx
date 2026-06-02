"use client";

import { useState } from "react";
import type { PageView } from "../types";

type LandingProps = {
  go: (page: PageView) => void;
};

export default function Landing({ go }: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      title: "Real-time Inventory",
      desc: "Track stock levels, prices, and categories across your entire catalog with live Supabase sync.",
      icon: "01",
    },
    {
      title: "AI-Powered Agent",
      desc: "Ask questions or give commands in plain English or Hindi. The agent updates your database in real time.",
      icon: "02",
    },
    {
      title: "Voice Commands",
      desc: "Use your voice to search, update stock, or delete products. Supports speech recognition and synthesis.",
      icon: "03",
    },
    {
      title: "Bilingual Interface",
      desc: "Switch between English and Hindi seamlessly. Everything from the UI to the AI agent adapts instantly.",
      icon: "04",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="fixed top-0 inset-x-0 z-30 bg-bg/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <span className="text-fg font-semibold tracking-tight">Inventory AI</span>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-muted hover:text-fg text-sm transition-colors">Features</a>
            <a href="#about" className="text-muted hover:text-fg text-sm transition-colors">About</a>
            <a href="#contact" className="text-muted hover:text-fg text-sm transition-colors">Contact</a>
          </div>
          <div className="hidden sm:flex items-center gap-2.5">
            <button onClick={() => go("login")} className="text-sm text-muted hover:text-fg border border-border rounded-lg px-3.5 py-1.5 transition-colors">Log In</button>
            <button onClick={() => go("signup")} className="text-sm text-bg font-medium bg-accent hover:bg-accent-hover rounded-lg px-3.5 py-1.5 transition-colors">Sign Up</button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden text-fg text-xl">&#9776;</button>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-surface animate-fadeIn">
            <div className="flex flex-col px-4 py-3 gap-3">
              <a href="#features" onClick={() => setMenuOpen(false)} className="text-muted hover:text-fg text-sm transition-colors">Features</a>
              <a href="#about" onClick={() => setMenuOpen(false)} className="text-muted hover:text-fg text-sm transition-colors">About</a>
              <a href="#contact" onClick={() => setMenuOpen(false)} className="text-muted hover:text-fg text-sm transition-colors">Contact</a>
              <div className="flex gap-2 pt-1">
                <button onClick={() => go("login")} className="flex-1 text-sm text-muted hover:text-fg border border-border rounded-lg py-1.5 transition-colors">Log In</button>
                <button onClick={() => go("signup")} className="flex-1 text-sm text-bg font-medium bg-accent hover:bg-accent-hover rounded-lg py-1.5 transition-colors">Sign Up</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center pt-14">
        <div className="animate-fadeInUp">
          <span className="text-muted text-[10px] tracking-[3px] uppercase font-mono border border-border rounded-full px-3 py-1 inline-block mb-6">
            Next.js + Supabase + AI Agent
          </span>
        </div>
        <h1 className="animate-fadeInUp delay-1 text-fg text-4xl sm:text-5xl font-light tracking-tight mb-3">
          Inventory
          <br />
          <span className="font-medium text-accent">with AI Agent</span>
        </h1>
        <p className="animate-fadeInUp delay-2 text-muted text-sm max-w-[280px] mb-10 leading-relaxed">
          Full-stack demo with search, edit, and an AI agent that can take actions in your database.
        </p>
        <div className="animate-fadeInUp delay-3 flex flex-col sm:flex-row gap-3 w-full max-w-[280px]">
          <button onClick={() => go("login")} className="w-full bg-accent hover:bg-accent-hover text-bg text-sm font-semibold px-5 py-3 rounded-lg transition-colors">
            Get Started
          </button>
          <a href="#features" className="w-full border border-border text-subtle hover:text-fg hover:border-muted text-sm font-medium px-5 py-3 rounded-lg transition-colors text-center">
            Learn More
          </a>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-28 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 animate-fadeInUp">
            <span className="text-accent text-xs font-mono tracking-widest uppercase">Features</span>
            <h2 className="text-fg text-2xl sm:text-3xl font-light mt-3">Everything you need to manage inventory</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {features.map((f, i) => (
              <div key={f.title} className={`animate-fadeInUp delay-${i + 2} bg-surface border border-border rounded-xl p-5 sm:p-6 hover:border-muted transition-colors`}>
                <span className="text-accent text-xs font-mono">{f.icon}</span>
                <h3 className="text-fg text-base font-medium mt-3 mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-20 sm:py-28 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center animate-fadeInUp">
          <span className="text-accent text-xs font-mono tracking-widest uppercase">About</span>
          <h2 className="text-fg text-2xl sm:text-3xl font-light mt-3 mb-6">Built with modern stack</h2>
          <p className="text-muted text-sm max-w-2xl mx-auto leading-relaxed">
            This demo showcases a full-stack application using Next.js 16, React 19, Supabase for authentication and database,
            and an AI agent powered by OpenRouter. The AI can understand natural language queries and execute database operations
            like updating stock, adding products, or deleting items &mdash; all through text or voice commands in English and Hindi.
          </p>
        </div>
      </section>

      <section id="contact" className="py-20 sm:py-28 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center animate-fadeInUp">
          <span className="text-accent text-xs font-mono tracking-widest uppercase">Contact</span>
          <h2 className="text-fg text-2xl sm:text-3xl font-light mt-3 mb-6">Get in touch</h2>
          <p className="text-muted text-sm mb-8">
            Have questions or feedback? Reach out to the team.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="mailto:hello@example.com" className="text-muted hover:text-accent transition-colors">Email</a>
            <a href="#" className="text-muted hover:text-accent transition-colors">Twitter</a>
            <a href="#" className="text-muted hover:text-accent transition-colors">GitHub</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-muted text-xs">&copy; 2026 Inventory AI. All rights reserved.</span>
          <div className="flex gap-5 text-xs text-muted">
            <a href="#" className="hover:text-fg transition-colors">Privacy</a>
            <a href="#" className="hover:text-fg transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
