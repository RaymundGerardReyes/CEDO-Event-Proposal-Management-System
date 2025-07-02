export function ResponsiveGrid({ children, cols, className = "", ...props }) {
    // Default column configuration
    const defaultCols = {
        default: 1, // 1 column by default
        sm: 2, // 2 columns on small screens
        md: 3, // 3 columns on medium screens
        lg: 4, // 4 columns on large screens
    }

    // Merge provided cols with defaults
    const gridCols = { ...defaultCols, ...(cols || {}) }

    // Generate Tailwind grid classes
    const gridClasses = [
        `grid`,
        `grid-cols-${gridCols.default}`,
        `sm:grid-cols-${gridCols.sm}`,
        `md:grid-cols-${gridCols.md}`,
        `lg:grid-cols-${gridCols.lg}`,
        `gap-4`,
        className,
    ].join(" ")

    return (
        <div className={gridClasses} {...props}>
            {children}
        </div>
    )
}
