"use client"

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div className="mb-4 sm:mb-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0c2d6b]">{title}</h1>
        {subtitle && <p className="text-sm sm:text-base text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
