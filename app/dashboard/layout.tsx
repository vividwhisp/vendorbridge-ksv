import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <Sidebar />
      </div>
      <div className="lg:pl-60">
        <Navbar />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>
    </div>
  )
}
