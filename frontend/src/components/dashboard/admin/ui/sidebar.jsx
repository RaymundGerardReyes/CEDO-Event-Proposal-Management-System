// src/components/dashboard/student/ui/sidebar.jsx
"use client"

import { cn } from "@/lib/utils";
import { Slot } from '@radix-ui/react-slot';
import Link from "next/link";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

const SidebarContext = createContext({
  isMobile: false,
  isOpen: false,
  collapsed: false,
  onOpen: () => { },
  onClose: () => { },
  onToggleCollapse: () => { },
});

const SidebarProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false); // Close mobile sidebar when switching to mobile
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const onToggleCollapse = () => setCollapsed(prev => !prev);

  const value = {
    isMobile,
    isOpen,
    collapsed,
    onOpen,
    onClose,
    onToggleCollapse,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const Sidebar = React.forwardRef(({ className, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(
      "bg-white border-r transition-all duration-300 ease-out",
      className
    )}
    {...props}
  />
));
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-3 sm:p-4 border-b transition-all duration-200",
      className
    )}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-3 sm:p-4 flex-1 overflow-y-auto",
      className
    )}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-3 sm:p-4 border-t transition-all duration-200",
      className
    )}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      "space-y-1 sm:space-y-2",
      className
    )}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("", className)}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef(
  ({ className, isActive, href, icon, children, asChild = false, tooltip, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";

    const combinedClassName = cn(
      "flex items-center w-full transition-all duration-300 ease-out text-sidebar-foreground",
      "focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-1",
      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      "rounded-lg sm:rounded-xl",
      // Enhanced responsive padding and spacing
      "p-2 sm:p-3 gap-2 sm:gap-3",
      // Better touch targets for mobile
      "min-h-[44px] sm:min-h-[48px]",
      // Active state styling
      isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm",
      // Hover and focus states
      "hover:scale-[1.02] hover:shadow-sm",
      "active:scale-[0.98] active:transition-transform active:duration-100",
      className
    );

    if (asChild) {
      return (
        <Slot ref={ref} className={combinedClassName} {...props}>
          {children}
        </Slot>
      );
    }

    const buttonContent = (
      <>
        {icon && (
          <span className="flex-shrink-0 transition-transform duration-200 hover:scale-110">
            {React.cloneElement(icon, {
              className: cn("h-4 w-4 sm:h-5 sm:w-5", icon.props?.className)
            })}
          </span>
        )}
        <span className="flex-1 truncate text-sm sm:text-base font-medium">
          {children}
        </span>
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          ref={ref}
          className={combinedClassName}
          {...props}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        className={combinedClassName}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarTrigger = ({ className, ...props }) => {
  const { isOpen, onOpen, onClose, isMobile } = useSidebar();

  if (isMobile) {
    return (
      <button
        onClick={isOpen ? onClose : onOpen}
        className={cn(
          "inline-flex items-center justify-center rounded-lg sm:rounded-xl",
          "p-2 sm:p-3 hover:bg-accent transition-all duration-200",
          "min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px]",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "text-sm sm:text-base font-medium",
          className
        )}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        {...props}
      >
        {isOpen ? "Close Menu" : "Open Menu"}
      </button>
    );
  }

  return null; // Desktop collapse is handled by the sidebar itself
};

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
};

