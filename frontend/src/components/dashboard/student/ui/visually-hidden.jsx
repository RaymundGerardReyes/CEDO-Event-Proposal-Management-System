// student/ui/visually-hidden.jsx
import { cn } from "@/lib/utils";
import * as React from "react";

const VisuallyHidden = React.forwardRef(({ asChild = false, className, ...props }, ref) => {
  const visuallyHiddenClasses = "absolute h-px w-px p-0 overflow-hidden whitespace-nowrap border-0";

  if (asChild) {
    // When asChild is true, clone the first child and apply classes to it
    const child = React.Children.only(props.children);
    return React.cloneElement(child, {
      ...props,
      ref,
      className: cn(visuallyHiddenClasses, className, child.props.className)
    });
  }

  // Default behavior: wrap in span
  return (
    <span
      ref={ref}
      className={cn(visuallyHiddenClasses, className)}
      {...props}
    />
  )
})
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden };

