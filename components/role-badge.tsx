export const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PROCUREMENT_OFFICER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  MANAGER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  VENDOR: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

export function RoleBadge({ role, className = "" }: { role: string; className?: string }) {
  const style = ROLE_STYLES[role] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  const label = role === "PROCUREMENT_OFFICER" ? "PROCUREMENT OFFICER" : role

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  )
}
