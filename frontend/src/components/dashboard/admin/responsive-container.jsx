import { cn } from "@/lib/utils"

export function ResponsiveContainer({ children, className, maxWidth = "max-w-7xl", padding = "px-4 sm:px-6 lg:px-8" }) {
  return <div className={cn("w-full mx-auto", maxWidth, padding, className)}>{children}</div>
}
