import { cn } from "@/lib/utils"

export function FormGrid({
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

  return <div className={cn("grid", gridCols, gap, className)}>{children}</div>
}

export function FormGridItem({
  children,
  className,
  colSpan = {
    default: 1,
    sm: undefined,
    md: undefined,
    lg: undefined,
  },
}) {
  // Convert colSpan object to tailwind col-span classes
  const colSpanClasses = [
    `col-span-${colSpan.default}`,
    colSpan.sm && `sm:col-span-${colSpan.sm}`,
    colSpan.md && `md:col-span-${colSpan.md}`,
    colSpan.lg && `lg:col-span-${colSpan.lg}`,
    colSpan.xl && `xl:col-span-${colSpan.xl}`,
  ]
    .filter(Boolean)
    .join(" ")

  return <div className={cn(colSpanClasses, className)}>{children}</div>
}
