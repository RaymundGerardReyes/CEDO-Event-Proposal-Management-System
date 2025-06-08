"use client"

import * as React from "react"

/**
 * Visually hidden component for accessibility.
 * Hides content visually while keeping it available to screen readers.
 */
export const VisuallyHidden = React.forwardRef(({ children, ...props }, ref) => (
    <span
        ref={ref}
        style={{
            position: 'absolute',
            border: 0,
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            wordWrap: 'normal',
        }}
        {...props}
    >
        {children}
    </span>
))
VisuallyHidden.displayName = "VisuallyHidden" 