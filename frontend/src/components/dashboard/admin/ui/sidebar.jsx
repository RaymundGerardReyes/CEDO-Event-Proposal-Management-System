import React, { useState, useEffect, createContext, useContext, useCallback, useMemo, forwardRef } from 'react';

// --- Polyfills/Mocks for missing dependencies ---

// Mock for cn (classnames utility)
const cn = (...inputs) => {
  return inputs.filter(Boolean).join(' ');
};

// Mock for useIsMobile hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

// Mock for lucide-react PanelLeft icon
const PanelLeft = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

// Mock for @radix-ui/react-slot Slot component
const Slot = forwardRef((props, ref) => {
    const { children, asChild, ...slotProps } = props;
    if (asChild) {
        if (React.Children.count(children) > 1) {
            console.error("Slot's asChild prop can only be used with a single child.");
            return <div {...slotProps} ref={ref}>{children}</div>; // Fallback or throw error
        }
        if (!React.isValidElement(children)) {
             console.error("Slot's asChild prop was provided but children is not a valid React element.");
             return <div {...slotProps} ref={ref}>{children}</div>; // Fallback or throw error
        }
        return React.cloneElement(children, {
            ...slotProps,
            ...children.props,
            ref: ref ? (node) => {
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
                if (children.ref) {
                    if (typeof children.ref === 'function') children.ref(node);
                    else if (children.ref) children.ref.current = node;
                }
            } : children.ref,
            className: cn(slotProps.className, children.props.className),
        });
    }
    return <div {...slotProps} ref={ref}>{children}</div>;
});
Slot.displayName = 'Slot';


// Mock for class-variance-authority cva
const cva = (base, config) => {
  return (props) => {
    let classNames = [base];
    if (config && config.variants) {
      for (const variantKey in config.variants) {
        const variantValue = props ? props[variantKey] : undefined;
        if (variantValue && config.variants[variantKey][variantValue]) {
          classNames.push(config.variants[variantKey][variantValue]);
        } else if (config.defaultVariants && config.defaultVariants[variantKey] && config.variants[variantKey][config.defaultVariants[variantKey]]) {
          // Apply default variant if prop not provided
          classNames.push(config.variants[variantKey][config.defaultVariants[variantKey]]);
        }
      }
    }
     // Apply default variants if not overridden by props
    if (config && config.defaultVariants) {
        for (const defaultVariantKey in config.defaultVariants) {
            // Check if this variant was already processed (either by direct prop or by earlier default application)
            // This logic is a bit simplified; CVA has more complex precedence.
            let alreadyApplied = false;
            if (props && props[defaultVariantKey] !== undefined) {
                alreadyApplied = true;
            }

            if (!alreadyApplied && config.variants && config.variants[defaultVariantKey]) {
                const defaultValue = config.defaultVariants[defaultVariantKey];
                if (config.variants[defaultVariantKey][defaultValue]) {
                    // Avoid duplicate application if already handled by the loop above
                    if (!classNames.includes(config.variants[defaultVariantKey][defaultValue])) {
                         classNames.push(config.variants[defaultVariantKey][defaultValue]);
                    }
                }
            }
        }
    }
    return cn(...classNames.filter(Boolean));
  };
};

// Mock UI Components (basic placeholders)
const Button = forwardRef(({ children, className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn('px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2', variant === 'ghost' ? 'hover:bg-gray-100' : 'bg-blue-500 text-white hover:bg-blue-600', size === 'icon' ? 'p-2' : '', className)} {...props}>
    {children}
  </button>
));
Button.displayName = 'Button';

const Input = forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500', className)} {...props} />
));
Input.displayName = 'Input';

const Separator = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('h-[1px] bg-gray-200 my-2', className)} {...props} />
));
Separator.displayName = 'Separator';

const Sheet = ({ open, onOpenChange, children, ...props }) => {
  if (!open) return null;
  // Basic modal-like behavior for Sheet
  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => onOpenChange(false)}>
      {children}
    </div>
  );
};

const SheetContent = forwardRef(({ children, className, side = 'left', ...props }, ref) => (
  // Stop propagation to prevent closing when clicking inside the sheet
  <div
    ref={ref}
    onClick={(e) => e.stopPropagation()}
    className={cn(
      'fixed top-0 h-full bg-white shadow-xl z-50 p-4 overflow-y-auto transition-transform transform',
      side === 'left' ? 'left-0' : 'right-0',
      // Add animation classes if desired, e.g., 'duration-300 ease-in-out'
      // For simplicity, direct style for transform based on open state would be in Sheet
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SheetContent.displayName = 'SheetContent';


const Skeleton = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('bg-gray-200 animate-pulse rounded', className)} {...props} />
));
Skeleton.displayName = 'Skeleton';

const TooltipProvider = ({ children, delayDuration }) => <>{children}</>; // Simplified
const Tooltip = ({ children }) => <div className="relative inline-block">{children}</div>; // Simplified
const TooltipTrigger = ({ children, asChild }) => { // Simplified
    if (asChild) return children;
    return <span className="cursor-pointer">{children}</span>;
};
const TooltipContent = forwardRef(({ children, className, hidden, side, align, ...props }, ref) => { // Simplified
  if (hidden) return null;
  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-10 p-2 text-sm bg-gray-800 text-white rounded-md shadow-lg whitespace-nowrap',
        // Basic positioning, more complex logic needed for side/align
        side === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : 'bottom-full mb-2 left-1/2 -translate-x-1/2',
        align === 'center' ? '' : '', // Add more alignment if needed
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipContent.displayName = 'TooltipContent';


// --- Start of converted sidebar.jsx code ---

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

const SidebarContext = createContext(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

const SidebarProvider = forwardRef(
  ({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
    const { isMobile } = useIsMobile();
    const [openMobile, setOpenMobile] = useState(false);

    const [_open, _setOpen] = useState(() => {
        if (typeof document !== 'undefined') {
            const cookieValue = document.cookie
                .split('; ')
                .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
                ?.split('=')[1];
            if (cookieValue) {
                return cookieValue === 'true';
            }
        }
        return defaultOpen;
    });

    const open = openProp !== undefined ? openProp : _open;

    const setOpen = useCallback(
      (value) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
        if (typeof document !== 'undefined') {
            document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open]
    );

    const toggleSidebar = useCallback(() => {
      return isMobile ? setOpenMobile((currentOpen) => !currentOpen) : setOpen((currentOpen) => !currentOpen);
    }, [isMobile, setOpen, setOpenMobile]);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const handleKeyDown = (event) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    const state = open ? "expanded" : "collapsed";

    const contextValue = useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={{
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            }}
            className={cn("group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar", className)} // Note: 'has-[...]' might need specific Tailwind config
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = forwardRef(
  ({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === "none") {
      return (
        <div
          className={cn("flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground", className)} // Ensure bg-sidebar and text-sidebar-foreground are defined in your Tailwind config
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden" // Ensure these classes are defined
            style={{
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            }}
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground" // Ensure text-sidebar-foreground is defined
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]" // theme(spacing.4) needs Tailwind
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]" // theme(spacing.4)
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow" // Ensure these classes are defined
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

const SidebarTrigger = forwardRef(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();

    return (
      <Button
        ref={ref}
        data-sidebar="trigger"
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", className)}
        onClick={(event) => {
          if (onClick) onClick(event);
          toggleSidebar();
        }}
        {...props}
      >
        <PanelLeft />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    );
  }
);
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = forwardRef(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();

    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className={cn(
          "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
          "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
          "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
          "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
          "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
          "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarRail.displayName = "SidebarRail";

const SidebarInset = forwardRef(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background", // Ensure bg-background is defined
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow", // theme(spacing.4)
        className
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = "SidebarInset";

const SidebarInput = forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        data-sidebar="input"
        className={cn(
          "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring", // Ensure these classes are defined
          className
        )}
        {...props}
      />
    );
  }
);
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <Separator
        ref={ref}
        data-sidebar="separator"
        className={cn("mx-2 w-auto bg-sidebar-border", className)} // Ensure bg-sidebar-border is defined
        {...props}
      />
    );
  }
);
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        "px-2 py-3",
        "items-center sm:items-stretch",
        "[&>*]:mx-auto [&>*]:w-full [&>*:not(:first-child)]:mt-1",
        "[&_button]:justify-center sm:[&_button]:justify-start",
        "[&_svg]:size-5 [&_svg]:shrink-0",
        "[&_a]:flex [&_a]:items-center [&_a]:gap-3",
        "group-data-[collapsible=icon]:[&_span]:hidden",
        "group-data-[collapsible=icon]:[&_button]:justify-center",
        "group-data-[collapsible=icon]:[&_svg]:mx-auto",
        className
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = forwardRef(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";

    return (
      <Comp
        ref={ref}
        data-sidebar="group-label"
        className={cn(
          "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", // Ensure these classes are defined
          "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = forwardRef(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-sidebar="group-action"
        className={cn(
          "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", // Ensure these classes are defined
          "after:absolute after:-inset-2 after:md:hidden",
          "group-data-[collapsible=icon]:hidden",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props} />
  )
);
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0", // Ensure these classes are defined
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]", // Ensure these CSS vars are defined
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const SidebarMenuButton = forwardRef(
  ({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();

    const buttonElement = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size, className }))} // Pass className here
        {...props}
      />
    );

    if (!tooltip) {
      return buttonElement;
    }

    let tooltipProps = {};
    if (typeof tooltip === "string") {
      tooltipProps = { children: tooltip };
    } else {
      tooltipProps = tooltip;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile} {...tooltipProps} />
      </Tooltip>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = forwardRef(
  ({ className, asChild = false, showOnHover = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-sidebar="menu-action"
        className={cn(
          "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0", // Ensure these classes are defined
          "after:absolute after:-inset-2 after:md:hidden",
          "peer-data-[size=sm]/menu-button:top-1",
          "peer-data-[size=default]/menu-button:top-1.5",
          "peer-data-[size=lg]/menu-button:top-2.5",
          "group-data-[collapsible=icon]:hidden",
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn(
        "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none", // Ensure text-sidebar-foreground is defined
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground", // Ensure text-sidebar-accent-foreground is defined
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = forwardRef(
  ({ className, showIcon = false, ...props }, ref) => {
    const width = useMemo(() => {
      return `${Math.floor(Math.random() * 40) + 50}%`;
    }, []);

    return (
      <div
        ref={ref}
        data-sidebar="menu-skeleton"
        className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
        {...props}
      >
        {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
        <Skeleton
          className="h-4 flex-1 max-w-[--skeleton-width]"
          data-sidebar="menu-skeleton-text"
          style={{
            "--skeleton-width": width,
          }}
        />
      </div>
    );
  }
);
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = forwardRef(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5", // Ensure border-sidebar-border is defined
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
);
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = forwardRef(({ ...props }, ref) => (
  <li ref={ref} {...props} />
));
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = forwardRef(
  ({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a"; // Typically 'a' for navigation

    return (
      <Comp
        ref={ref}
        data-sidebar="menu-sub-button"
        data-size={size}
        data-active={isActive}
        className={cn(
          "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground", // Ensure these classes are defined
          "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          "group-data-[collapsible=icon]:hidden",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

const SidebarButton = forwardRef(
  ({ className, icon, active, variant = "default", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-sidebar="button"
        data-active={active}
        data-variant={variant}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring", // Ensure ring-sidebar-ring is defined
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-sidebar-accent/10 hover:bg-sidebar-accent/20 text-sidebar-foreground", // Ensure these classes are defined
          variant === "ghost" && "hover:bg-sidebar-accent/10 text-sidebar-foreground/80 hover:text-sidebar-foreground",
          variant === "subtle" &&
            "bg-sidebar-accent/5 hover:bg-sidebar-accent/10 text-sidebar-foreground/70 hover:text-sidebar-foreground",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </button>
    );
  }
);
SidebarButton.displayName = "SidebarButton";

// --- End of converted sidebar.jsx code ---

// Example App to demonstrate the sidebar
function App() {
  // Define some mock theme colors for Tailwind placeholders
  const style = `
    :root {
      --sidebar-width: 16rem;
      --sidebar-width-icon: 3rem;
      /* Define HSL values for Tailwind color placeholders if not using actual Tailwind */
      --sidebar-DEFAULT: 240 5.9% 90%; /* bg-sidebar (e.g., light gray) */
      --sidebar-foreground-DEFAULT: 240 10% 3.9%; /* text-sidebar-foreground (e.g., dark gray) */
      --sidebar-border-DEFAULT: 240 5.9% 80%; /* border-sidebar-border */
      --sidebar-accent-DEFAULT: 240 4.8% 95.9%; /* bg-sidebar-accent */
      --sidebar-accent-foreground-DEFAULT: 240 5.9% 10%; /* text-sidebar-accent-foreground */
      --sidebar-ring-DEFAULT: 240 5% 64.9%; /* ring-sidebar-ring */
      --background-DEFAULT: 0 0% 100%; /* bg-background (e.g., white) */
    }
    .bg-sidebar { background-color: hsl(var(--sidebar-DEFAULT)); }
    .text-sidebar-foreground { color: hsl(var(--sidebar-foreground-DEFAULT)); }
    .border-sidebar-border { border-color: hsl(var(--sidebar-border-DEFAULT)); }
    .bg-sidebar-accent { background-color: hsl(var(--sidebar-accent-DEFAULT)); }
    .text-sidebar-accent-foreground { color: hsl(var(--sidebar-accent-foreground-DEFAULT)); }
    .ring-sidebar-ring { /* For focus rings, often box-shadow */ box-shadow: 0 0 0 2px hsl(var(--sidebar-ring-DEFAULT)); }
    .bg-background { background-color: hsl(var(--background-DEFAULT)); }

    /* Basic styling for demonstration */
    body { margin: 0; font-family: sans-serif; background-color: #f0f0f0; }
    .min-h-svh { min-height: 100vh; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
    .p-4 { padding: 1rem; }
    .m-2 { margin: 0.5rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .shadow { box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06); }

    /* Placeholder for theme(spacing.4) - typically 1rem in Tailwind */
    /* This is a CSS variable approach. You might need to adjust based on how theme() is used. */
    :root {
        --theme-spacing-4: 1rem;
    }
    /* Example usage in calc() */
    /* .w-\[calc\(var\(--sidebar-width-icon\)_+_\theme\(spacing\.4\)\)\] { width: calc(var(--sidebar-width-icon) + var(--theme-spacing-4)); } */

    /* Add other Tailwind utility classes as needed for the demo or use a CDN */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-1 { flex: 1 1 0%; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .p-2 { padding: 0.5rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .h-full { height: 100%; }
    .w-full { width: 100%; }
    .fixed { position: fixed; }
    .inset-0 { top:0; right:0; bottom:0; left:0; }
    .z-10 { z-index: 10; }
    .z-20 { z-index: 20; }
    .z-40 { z-index: 40; }
    .z-50 { z-index: 50; }
    .hidden { display: none; }
    @media (min-width: 768px) {
      .md\:block { display: block; }
      .md\:flex { display: flex; }
      .md\:m-2 { margin: 0.5rem; }
      .md\:ml-0 { margin-left: 0; }
      .md\:ml-2 { margin-left: 0.5rem; }
      .md\:rounded-xl { border-radius: 0.75rem; }
      .md\:shadow { box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06); }
      .after\:md\:hidden::after { display: none; }
    }
    .sm\:flex { display: flex; }
    .sm\:items-stretch { align-items: stretch; }
    .sm\:\[\&_button\]\:justify-start button { justify-content: flex-start; }

    .group\/sidebar-wrapper:has([data-variant="inset"]) {
        /* Placeholder for has selector, might not be supported everywhere */
        /* background-color: hsl(var(--sidebar-DEFAULT)); */
    }
    /* Add more styles for data attributes if not using full Tailwind */
  `;

  const [sidebarOpen, setSidebarOpen] = useState(true); // Example of controlled state

  // Mock icons for menu items
  const HomeIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>;
  const SettingsIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.566.379-1.566 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.566 2.6 1.566 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.566-.379 1.566-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>;
  const PlusIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path></svg>;


  return (
    <>
      <style>{style}</style>
      <SidebarProvider defaultOpen={true} /* open={sidebarOpen} onOpenChange={setSidebarOpen} */ >
        <Sidebar collapsible="icon" variant="sidebar" side="left">
          <SidebarRail />
          <SidebarHeader>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">My App</h2>
                <SidebarTrigger className="md:hidden" /> {/* Show trigger on mobile inside header */}
            </div>
            <SidebarInput placeholder="Search..." className="group-data-[collapsible=icon]:hidden"/>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Home" isActive={true}>
                  <HomeIcon />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Analytics">
                  <SettingsIcon /> {/* Placeholder icon */}
                  <span>Analytics</span>
                  <SidebarMenuBadge>New</SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarGroup>
                <SidebarGroupLabel asChild>
                    <h3>Projects</h3>
                </SidebarGroupLabel>
                 <SidebarGroupAction tooltip="Add Project"><PlusIcon /></SidebarGroupAction>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="sm" tooltip="Project Alpha">
                                <SettingsIcon /> {/* Placeholder */}
                                <span>Project Alpha</span>
                            </SidebarMenuButton>
                            <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton href="#" isActive>Task 1</SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton href="#">Task 2</SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton size="sm" tooltip="Project Beta">
                                <SettingsIcon /> {/* Placeholder */}
                                <span>Project Beta</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton />
            </SidebarMenu>
          </SidebarContent>

          <SidebarSeparator />

          <SidebarFooter>
            <SidebarButton icon={<SettingsIcon />} variant="ghost">
              Settings
            </SidebarButton>
            <div className="text-xs text-sidebar-foreground/70 p-2 group-data-[collapsible=icon]:hidden">
                © 2024 My App
            </div>
            <div className="text-xs text-sidebar-foreground/70 p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center hidden">
                ©
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset> {/* Main content area */}
          <header className="bg-background p-4 border-b border-gray-200 flex items-center">
            <SidebarTrigger className="hidden md:flex mr-4"/> {/* Show trigger for desktop */}
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </header>
          <div className="p-4">
            <p>Main content goes here. Resize the window or use Ctrl/Cmd + B to toggle the sidebar.</p>
            <p>The sidebar state is saved in a cookie.</p>
            <p>Current sidebar state (from context): {useSidebar().state}</p>
            <p>Is mobile (from context): {useSidebar().isMobile.toString()}</p>
            <button onClick={() => useSidebar().setOpen(true)} className="p-2 bg-blue-500 text-white rounded mr-2 mt-2">Expand Sidebar</button>
            <button onClick={() => useSidebar().setOpen(false)} className="p-2 bg-red-500 text-white rounded mt-2">Collapse Sidebar</button>

             <div className="mt-8">
                <h2 className="text-lg font-bold mb-2">Test Buttons:</h2>
                <SidebarButton icon={<HomeIcon />} active>Active Button</SidebarButton>
                <div className="my-2" />
                <SidebarButton icon={<SettingsIcon />} variant="ghost">Ghost Button</SidebarButton>
                 <div className="my-2" />
                <SidebarButton icon={<PanelLeft />} variant="subtle">Subtle Button</SidebarButton>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

export default App;