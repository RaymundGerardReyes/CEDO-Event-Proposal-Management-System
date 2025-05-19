// student/ui/skeleton.jsx
// Removed: import type React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) { // Removed type React.HTMLAttributes<HTMLDivElement>
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}

export { Skeleton }
