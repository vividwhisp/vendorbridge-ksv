"use client";

import Link from "next/link";
import { appConfig } from "../lib/config";
import Navbar from "./navbar";

const { pill, heroAccent, features, howItWorks, useCases } = appConfig.landing;

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-14">
        <div className="animate-fadeInUp">
          <span className="text-fg text-[10px] tracking-[3px] uppercase font-mono border border-border bg-surface/60 rounded-full px-3 py-1 inline-block mb-7">
            {pill}
          </span>
        </div>
        <h1 className="animate-fadeInUp delay-1 text-fg text-5xl sm:text-6xl md:text-7xl font-light tracking-tight mb-5 leading-[1.05]">
          {appConfig.tagline}
          <br />
          <span className="font-medium text-accent">{heroAccent}</span>
        </h1>
        <p className="animate-fadeInUp delay-2 text-muted text-base sm:text-lg max-w-[460px] mb-10 leading-relaxed">
          {appConfig.description}
        </p>
        <div className="animate-fadeInUp delay-3 flex flex-col sm:flex-row gap-3 w-full max-w-[320px]">
          <Link href="/signup" className="flex-1 bg-accent hover:bg-accent-hover text-bg text-sm font-semibold px-5 py-3.5 rounded-xl transition-all hover:scale-[1.02] text-center">
            Start for free
          </Link>
          <Link href="/login" className="flex-1 border border-border text-fg hover:border-muted text-sm font-medium px-5 py-3.5 rounded-xl transition-all hover:bg-surface text-center">
            See the demo
          </Link>
        </div>
        <p className="animate-fadeInUp delay-4 text-muted text-xs mt-6 font-mono">
          demo: <span className="text-subtle">kori@dev.com</span> / <span className="text-subtle">1234</span>
        </p>

        <div className="animate-fadeInUp delay-5 mt-20 sm:mt-28 max-w-4xl w-full">
          <div className="border border-border rounded-2xl bg-surface/60 backdrop-blur p-3 shadow-2xl">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <span className="text-muted text-[10px] font-mono ml-2">app/dashboard</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5">
              {[
                { label: "Total Items", value: "12" },
                { label: "Value", value: "$1.2M" },
                { label: "Low Stock", value: "3" },
                { label: "In Stock", value: "9" },
              ].map((stat, i) => (
                <div key={stat.label} className={`animate-fadeInUp bg-bg border border-border rounded-lg px-3 py-3`} style={{ animationDelay: `${0.6 + i * 0.05}s` }}>
                  <p className="text-muted text-[9px] uppercase tracking-wider font-medium mb-1">{stat.label}</p>
                  <p className={`text-lg font-semibold ${stat.label === "Value" ? "text-accent" : stat.label === "Low Stock" ? "text-danger" : "text-fg"}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="px-2.5 pb-2.5 space-y-1.5">
              {[
                { id: "01", name: "MacBook Air M3", price: "$99,999", status: "ok" },
                { id: "02", name: "iPhone 15 Pro", price: "$134,999", status: "low" },
                { id: "03", name: "AirPods Pro", price: "$24,999", status: "ok" },
              ].map((row, i) => (
                <div key={row.id} className="animate-slideInLeft flex items-center gap-3 bg-bg border border-border rounded-lg px-3.5 py-2.5" style={{ animationDelay: `${0.8 + i * 0.05}s` }}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.status === "low" ? "bg-danger" : "bg-accent"}`} />
                  <span className="text-muted text-[10px] font-mono">{row.id}</span>
                  <span className="text-fg text-xs flex-1 truncate">{row.name}</span>
                  <span className="text-subtle text-xs font-mono">{row.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 sm:py-32 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <span className="text-accent text-xs font-mono tracking-widest uppercase">Features</span>
            <h2 className="text-fg text-3xl sm:text-4xl font-light mt-3 mb-4">Everything you need, nothing you don&apos;t</h2>
            <p className="text-muted text-sm max-w-md mx-auto">Auth, CRUD, search, AI, voice, toasts — all wired together so you can focus on the unique parts of your product.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map((f, i) => (
              <div key={f.title} className={`animate-fadeInUp delay-${Math.min(i + 1, 8)} bg-surface border border-border rounded-xl p-5 sm:p-6 hover:border-muted transition-all hover:-translate-y-0.5`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-accent text-xs font-mono">0{i + 1}</span>
                  <span className="text-muted text-[10px] font-mono uppercase tracking-wider">Feature</span>
                </div>
                <h3 className="text-fg text-base font-medium mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-24 sm:py-32 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <span className="text-accent text-xs font-mono tracking-widest uppercase">How it works</span>
            <h2 className="text-fg text-3xl sm:text-4xl font-light mt-3">Three steps to ship</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 relative">
            {howItWorks.map((s, i) => (
              <div key={s.num} className={`animate-fadeInUp delay-${Math.min(i * 2 + 1, 8)} relative`}>
                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 h-full">
                  <div className="text-accent text-3xl sm:text-4xl font-light font-mono mb-5">{s.num}</div>
                  <h3 className="text-fg text-lg font-medium mb-2">{s.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="usecases" className="py-24 sm:py-32 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <span className="text-accent text-xs font-mono tracking-widest uppercase">Use cases</span>
            <h2 className="text-fg text-3xl sm:text-4xl font-light mt-3 mb-4">Build anything with data</h2>
            <p className="text-muted text-sm max-w-md mx-auto">The starter ships with inventory, but the patterns apply to any structured data you want to manage.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 animate-fadeInUp delay-1">
            {useCases.map((uc, i) => (
              <div key={uc} className="bg-surface border border-border rounded-xl px-4 py-5 hover:border-muted hover:bg-bg transition-all group cursor-default" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="text-muted group-hover:text-accent text-[10px] font-mono mb-2 transition-colors">0{i + 1}</div>
                <div className="text-fg text-sm font-medium">{uc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center animate-fadeInUp">
          <h2 className="text-fg text-4xl sm:text-5xl font-light tracking-tight mb-5">
            Ready to build?
          </h2>
          <p className="text-muted text-base max-w-md mx-auto mb-9">
            Start with a working app in under a minute. No boilerplate, no setup, just <code className="text-accent">npm run dev</code>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="bg-accent hover:bg-accent-hover text-bg text-sm font-semibold px-7 py-3.5 rounded-xl transition-all hover:scale-[1.02]">
              Create free account
            </Link>
            <Link href="/login" className="border border-border text-fg hover:border-muted text-sm font-medium px-7 py-3.5 rounded-xl transition-all hover:bg-surface">
              Try the demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-accent">&#9632;</span>
            <span className="text-fg text-sm font-semibold">{appConfig.name}</span>
            <span className="text-muted text-xs ml-2">&copy; 2026</span>
          </div>
          <div className="flex gap-6 text-xs text-muted">
            <Link href="/settings" className="hover:text-fg transition-colors">Settings</Link>
            <Link href="/profile" className="hover:text-fg transition-colors">Profile</Link>
            <a href="#features" className="hover:text-fg transition-colors">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
