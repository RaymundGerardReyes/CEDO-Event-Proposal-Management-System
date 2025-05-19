// student/ui/visually-hidden.jsx
import { cn } from "@/lib/utils"
import * as React from "react"

const VisuallyHidden = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn("absolute h-px w-px p-0 overflow-hidden whitespace-nowrap border-0", className)}
      {...props}
    />
  )
})
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
