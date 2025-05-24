import { cn } from "@/lib/utils"

/**
 * FormGrid component for creating responsive grid layouts in forms
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in the grid
 * @param {Object} props.cols - Number of columns at different breakpoints
 * @param {number} props.cols.default - Default number of columns (mobile)
 * @param {number} props.cols.sm - Number of columns at small screens
 * @param {number} props.cols.md - Number of columns at medium screens
 * @param {number} props.cols.lg - Number of columns at large screens
 * @param {number} props.cols.xl - Number of columns at extra large screens
 * @param {string} props.gap - Gap between grid items (Tailwind spacing class)
 * @param {string} props.className - Additional CSS classes
 */
export function FormGrid({ children, cols = { default: 1, sm: 2 }, gap = "4", className }) {
    // Generate grid template columns classes based on the cols prop
    const gridColsClasses = Object.entries(cols)
        .map(([breakpoint, colCount]) => {
            if (breakpoint === "default") {
                return `grid-cols-${colCount}`
            }
            return `${breakpoint}:grid-cols-${colCount}`
        })
        .join(" ")

    return <div className={cn("grid", gridColsClasses, `gap-${gap}`, className)}>{children}</div>
}

/**
 * FormGridItem component for individual items within a FormGrid
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {number} props.colSpan - Number of columns this item should span
 * @param {string} props.className - Additional CSS classes
 */
export function FormGridItem({ children, colSpan, className }) {
    return <div className={cn(colSpan && `col-span-${colSpan}`, className)}>{children}</div>
}
