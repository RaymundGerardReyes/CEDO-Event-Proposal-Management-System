"use client";

import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";

// Export Radix UI Dialog components directly
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close; // Correctly exported
export const DialogOverlay = DialogPrimitive.Overlay; // Correctly exported

export const DialogContent = DialogPrimitive.Content;
export const DialogHeader = ({ className, ...props }) => (
  <div className={cn("mb-4", className)} {...props} />
);
export const DialogFooter = ({ className, ...props }) => (
  <div className={cn("mt-4 flex justify-end", className)} {...props} />
);
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;