"use client"

import * as React from "react";

/**
 * Visually hidden component for accessibility.
 * Hides content visually while keeping it available to screen readers.
 * Supports the `asChild` prop pattern used by Radix UI components.
 */
export const VisuallyHidden = React.forwardRef(({ asChild = false, children, ...props }, ref) => {
    const visuallyHiddenStyles = {
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
    };

    if (asChild) {
        // When asChild is true, clone the first child and apply styles to it
        const child = React.Children.only(children);
        return React.cloneElement(child, {
            ...props,
            ref,
            style: {
                ...visuallyHiddenStyles,
                ...child.props.style,
                ...props.style
            }
        });
    }

    // Default behavior: wrap in span
    return (
        <span
            ref={ref}
            style={{
                ...visuallyHiddenStyles,
                ...props.style
            }}
            {...props}
        >
            {children}
        </span>
    );
})
VisuallyHidden.displayName = "VisuallyHidden" 