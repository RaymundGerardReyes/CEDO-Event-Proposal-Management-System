// student/ui/toggle-group.jsx
"use client"

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import * as React from "react"
// Removed: import type { VariantProps } from "class-variance-authority"

import { toggleVariants } from "@/components/ui/toggle"; // Assuming this path is correct for your project
import { cn } from "@/lib/utils"

const ToggleGroupContext = React.createContext({ // Removed type annotation
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef(
  ({ className, variant, size, children, ...props }, ref) => ( // Removed type annotations
    <ToggleGroupPrimitive.Root ref={ref} className={cn("flex items-center justify-center gap-1", className)} {...props}>
      <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
);
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef(
  ({ className, children, variant, size, ...props }, ref) => { // Removed type annotations
    const context = React.useContext(ToggleGroupContext)

    return (
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(
          toggleVariants({
            variant: context.variant || variant,
            size: context.size || size,
          }),
          className,
        )}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Item>
    )
  }
);
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
