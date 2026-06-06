"use client"

export function AnimatedBackground() {
  return (
    <>
      {/* Floating gradient orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl bg-animate-orb -z-10" />
      <div className="fixed top-1/3 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl bg-animate-orb-alt -z-10" />
      <div className="fixed bottom-32 left-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl bg-animate-orb -z-10" style={{ animationDelay: "2s" }} />
      <div className="fixed top-2/3 right-1/3 w-96 h-96 bg-accent/8 rounded-full blur-3xl bg-animate-orb-alt -z-10" style={{ animationDelay: "4s" }} />
    </>
  )
}
