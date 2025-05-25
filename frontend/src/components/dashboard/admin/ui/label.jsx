"use client"

import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70")

const Label = React.forwardRef((props, ref) => {
  // Accept any props, fallback to empty object
  const className = props && typeof props === 'object' && 'className' in props ? props.className : undefined;
  // Remove className from rest
  const rest = { ...props };
  if (rest && typeof rest === 'object' && 'className' in rest) delete rest.className;
  return (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...rest} />
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label }

