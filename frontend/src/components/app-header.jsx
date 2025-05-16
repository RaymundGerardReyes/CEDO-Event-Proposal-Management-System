"use client"

import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun, User, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function AppHeader() {
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [theme, setTheme] = useState("light")
    const pathname = usePathname()

    // Initialize theme from localStorage on component mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light"
        setTheme(savedTheme)
        document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark"
        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)
        document.documentElement.classList.toggle("dark", newTheme === "dark")
    }

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen)
    }

    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen)
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const isActive = (path) => {
        return pathname.startsWith(path)
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4 md:px-6">
            <div className="flex items-center gap-2 lg:hidden">
                <button
                    onClick={toggleMobileMenu}
                    className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    <span className="sr-only">Toggle menu</span>
                </button>
            </div>

            <div className="flex items-center gap-2">
                <Link href="/admin-dashboard" className="flex items-center gap-2 font-semibold text-lg text-primary">
                    <span className="hidden md:inline-flex">ProposeConnect</span>
                </Link>
            </div>

            <div className="flex-1 md:flex md:justify-center md:gap-10">
                <div className={`${isSearchOpen ? "flex" : "hidden md:flex"} items-center w-full max-w-sm`}>
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search..."
                            className="w-full bg-background rounded-md border border-input pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSearch}
                    className="inline-flex md:hidden items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                </button>

                <button
                    onClick={toggleTheme}
                    className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span className="sr-only">Toggle theme</span>
                </button>

                <Link
                    href="/admin-dashboard/notifications"
                    className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground relative"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500"></span>
                    <span className="sr-only">Notifications</span>
                </Link>

                <div className="relative">
                    <button
                        onClick={toggleProfile}
                        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <div className="relative h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                            <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="hidden text-sm font-medium md:inline-flex">Admin User</span>
                        <ChevronDown className="hidden h-4 w-4 md:inline-flex" />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div className="py-1 border rounded-md">
                                <div className="px-4 py-2 text-sm border-b">
                                    <p className="font-medium">Admin User</p>
                                    <p className="text-muted-foreground">admin@example.com</p>
                                </div>
                                <Link
                                    href="/admin-dashboard/profile"
                                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                                >
                                    <User className="h-4 w-4" />
                                    Profile
                                </Link>
                                <Link
                                    href="/admin-dashboard/settings"
                                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                                >
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Link>
                                <Link
                                    href="/sign-out"
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-accent"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-16 z-50 bg-background/95 backdrop-blur-sm lg:hidden">
                    <div className="container h-full py-4">
                        <nav className="flex flex-col gap-4">
                            <Link
                                href="/admin-dashboard"
                                className={`flex items-center gap-2 text-lg font-medium ${isActive("/admin-dashboard") && !isActive("/admin-dashboard/")
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    } hover:text-primary`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/admin-dashboard/proposals"
                                className={`flex items-center gap-2 text-lg font-medium ${isActive("/admin-dashboard/proposals") ? "text-primary" : "text-muted-foreground"
                                    } hover:text-primary`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Proposals
                            </Link>
                            <Link
                                href="/admin-dashboard/events"
                                className={`flex items-center gap-2 text-lg font-medium ${isActive("/admin-dashboard/events") ? "text-primary" : "text-muted-foreground"
                                    } hover:text-primary`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Events
                            </Link>
                            <Link
                                href="/admin-dashboard/reports"
                                className={`flex items-center gap-2 text-lg font-medium ${isActive("/admin-dashboard/reports") ? "text-primary" : "text-muted-foreground"
                                    } hover:text-primary`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Reports
                            </Link>
                            <Link
                                href="/admin-dashboard/reviews"
                                className={`flex items-center gap-2 text-lg font-medium ${isActive("/admin-dashboard/reviews") ? "text-primary" : "text-muted-foreground"
                                    } hover:text-primary`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Reviews
                            </Link>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    )
}
