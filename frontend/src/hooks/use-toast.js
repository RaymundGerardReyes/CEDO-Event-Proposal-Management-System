"use client";

import { toast as sonnerToast } from "sonner";

// Direct Sonner wrapper to avoid circular imports
export function useToast() {
    return {
        toast: ({ title, description, variant = "default", ...props }) => {
            if (variant === "destructive") {
                return sonnerToast.error(title || "Error", {
                    description,
                    ...props
                });
            }

            if (variant === "success") {
                return sonnerToast.success(title || "Success", {
                    description,
                    ...props
                });
            }

            return sonnerToast(title || "Notification", {
                description,
                ...props
            });
        },
        dismiss: (id) => {
            if (id) {
                sonnerToast.dismiss(id);
            } else {
                sonnerToast.dismiss();
            }
        },
        toasts: [] // Not used with Sonner, but kept for compatibility
    };
}
