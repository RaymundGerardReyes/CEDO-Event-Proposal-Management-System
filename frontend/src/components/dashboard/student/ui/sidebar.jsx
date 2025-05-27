// src/components/dashboard/student/ui/sidebar.jsx
"use client"

import { cn } from "@/lib/utils";
import { Slot } from '@radix-ui/react-slot'; // Import Slot
import Link from "next/link";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

const SidebarContext = createContext({
  isMobile: false,
  isOpen: false,
  onOpen: () => { },
  onClose: () => { },
});

const SidebarProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return <SidebarContext.Provider value={{ isMobile, isOpen, onOpen, onClose }}>{children}</SidebarContext.Provider>;
};

const useSidebar = () => useContext(SidebarContext);

const Sidebar = React.forwardRef(({ className, ...props }, ref) => (
  <aside ref={ref} className={cn("bg-white border-r w-64", className)} {...props} />
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
  ({ className, isActive, href, icon, children, asChild = false, ...props }, ref) => {
    // Determine the component to render. If asChild, it will be Slot.
    // If not asChild and has href, it's a NextLink (handled by <Link>).
    // If not asChild and no href, it's a button.
    const Comp = asChild ? Slot : "div"; // Fallback for non-asChild, actual tag decided later

    // These are the styles that should be applied to the root interactive element
    const combinedClassName = cn(
      "flex items-center w-full p-2 rounded-md text-sidebar-foreground transition-colors duration-200",
      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      "focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-1", // Ensure ring-offset matches your theme
      isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
      className // User-provided className for the button itself, will be merged
    );

    if (asChild) {
      // If asChild is true, 'children' (passed from the consuming component, e.g., app-sidebar.jsx)
      // is the actual interactive component (e.g., a <Link>).
      // Slot passes 'combinedClassName', 'ref', and other '...props' to this child.
      // The child <Link> from app-sidebar.jsx is responsible for its own content (icon, label).
      return (
        <Slot ref={ref} className={combinedClassName} {...props}>
          {children}
        </Slot>
      );
    }

    // If not asChild, SidebarMenuButton renders its own structure (Link or button).
    // 'children' here refers to the label/text content for the button.
    const buttonContent = (
      <>
        {icon && <span className="mr-3 h-5 w-5 flex-shrink-0">{icon}</span>}
        <span className="flex-1 truncate">{children}</span>
      </>
    );

    if (href) {
      // Render Next.js Link directly if not asChild
      return (
        <Link href={href} ref={ref} className={combinedClassName} {...props}>
          {buttonContent}
        </Link>
      );
    }

    // Render a button if not asChild and no href
    return (
      <button ref={ref} type="button" className={combinedClassName} {...props}>
        {buttonContent}
      </button>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";


const SidebarTrigger = () => {
  const { isOpen, onOpen, onClose } = useSidebar();
  // Example trigger, you might want to style it or use an icon
  return <button onClick={isOpen ? onClose : onOpen} className="p-2">{isOpen ? "Close Menu" : "Open Menu"}</button>;
};

export {
  Sidebar, SidebarContent,
  SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar
};
