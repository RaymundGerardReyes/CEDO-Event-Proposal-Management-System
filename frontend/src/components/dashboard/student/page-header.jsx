// frontend/src/components/dashboard/student/page-header.jsx
"use client";

import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, className, subtitle = "", ...props }) {
  return (
    <div
      className={cn("mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}
      {...props}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 md:flex-nowrap">{actions}</div>}
    </div>
  );
}