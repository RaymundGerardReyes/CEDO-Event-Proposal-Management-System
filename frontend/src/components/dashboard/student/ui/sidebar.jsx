// student/ui/sidebar.jsx
"use client"

import { cn } from "@/lib/utils";
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

const SidebarMenuButton = React.forwardRef(({ className, isActive, href, icon, children, ...props }, ref) => {
  const content = (
    <div
      className={cn(
        "flex items-center w-full p-2 rounded-md text-sidebar-foreground transition-colors duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-1",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        className, // This className from props is for the inner div styling
      )}
    >
      {icon && <span className="mr-3 h-5 w-5">{icon}</span>}
      <span className="flex-1">{children}</span>
    </div>
  );

  if (href) {
    return (
      // CORRECTED: Apply wrapper styles and props directly to Link
      // Remove legacyBehavior and passHref
      // Remove the child <a> tag
      // 'content' (the div) becomes the single child of Link
      <Link href={href} ref={ref} className="block w-full" {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button ref={ref} type="button" className="w-full" {...props}>
      {content}
    </button>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";


const SidebarTrigger = () => {
  const { isOpen, onOpen, onClose } = useSidebar();

  return <button onClick={isOpen ? onClose : onOpen}>{isOpen ? "Close" : "Open"}</button>;
};

export {
  Sidebar, SidebarContent,
  SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar
};

