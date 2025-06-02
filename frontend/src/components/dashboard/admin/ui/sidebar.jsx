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
  <aside ref={ref} className={cn("bg-white border-r", className)} {...props} />
));
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 border-b", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 border-t", className)} {...props} />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("space-y-2", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef(
  ({ className, isActive, href, icon, children, asChild = false, tooltip, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";

    const combinedClassName = cn(
      "flex items-center w-full p-2 rounded-md text-sidebar-foreground transition-colors duration-200",
      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      "focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-1",
      isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
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
        {icon && <span className="mr-3 h-5 w-5 flex-shrink-0">{icon}</span>}
        <span className="flex-1 truncate">{children}</span>
      </>
    );

    if (href) {
      return (
        <Link href={href} ref={ref} className={combinedClassName} {...props}>
          {buttonContent}
        </Link>
      );
    }

    return (
      <button ref={ref} type="button" className={combinedClassName} {...props}>
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
        className={cn("p-2 rounded-md hover:bg-accent", className)}
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

