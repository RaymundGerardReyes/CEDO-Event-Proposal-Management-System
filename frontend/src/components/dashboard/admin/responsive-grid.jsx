import { cn } from "@/lib/utils"

export function ResponsiveGrid({
  children,
  className,
  cols = {
    default: 1,
    sm: 2,
    md: 3,
    lg: 4,
  },
  gap = "gap-4",
}) {
  // Convert cols object to tailwind grid classes
  const gridCols = [
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ]
    .filter(Boolean)
    .join(" ")

  return <div className={cn("grid w-full", gridCols, gap, className)}>{children}</div>
}
