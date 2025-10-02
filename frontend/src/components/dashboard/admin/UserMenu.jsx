/**
 * ===================================================================
 * USER MENU COMPONENT
 * ===================================================================
 * Purpose: Reusable user menu with Google profile picture support
 * Key approaches: Clean separation, accessibility, responsive design
 * Features: Google account indicator, profile actions, logout
 * ===================================================================
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/admin/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const UserMenu = ({ className = "" }) => {
    const { user: authUser, signOut } = useAuth();
    const router = useRouter();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [profileImageError, setProfileImageError] = useState(false);

    // Enhanced function to get optimized Google profile picture URL
    const getOptimizedProfileImage = (user) => {
        if (!user) return null;

        // Check multiple possible sources for profile picture
        const possibleSources = [
            user.user_metadata?.avatar_url,
            user.user_metadata?.picture,
            user.user_metadata?.profile_picture,
            user.raw_user_meta_data?.avatar_url,
            user.raw_user_meta_data?.picture,
            user.raw_user_meta_data?.profile_picture,
            user.picture,
            user.avatar_url,
            user.profile_picture
        ];

        for (const source of possibleSources) {
            if (source && typeof source === 'string') {
                // Optimize Google profile pictures for better quality and performance
                if (source.includes('googleusercontent.com')) {
                    // Remove existing size parameters and add optimized ones
                    const baseUrl = source.split('=')[0];
                    return `${baseUrl}=s400-c`; // 400x400 pixels, cropped to square
                }

                // Return other profile pictures as-is
                return source;
            }
        }

        return null;
    };

    // Enhanced function to get user display name
    const getUserDisplayName = (user) => {
        if (!user) return "User";

        const possibleNames = [
            user.user_metadata?.full_name,
            user.user_metadata?.name,
            user.raw_user_meta_data?.full_name,
            user.raw_user_meta_data?.name,
            user.name,
            user.full_name,
            user.email?.split('@')[0] // Fallback to email username
        ];

        for (const name of possibleNames) {
            if (name && typeof name === 'string' && name.trim()) {
                return name.trim();
            }
        }

        return "User";
    };

    // Enhanced function to get user initials
    const getUserInitials = (user) => {
        const displayName = getUserDisplayName(user);

        if (displayName === "User") return "U";

        const nameParts = displayName.split(' ').filter(part => part.length > 0);

        if (nameParts.length >= 2) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        } else if (nameParts.length === 1) {
            return nameParts[0].substring(0, 2).toUpperCase();
        }

        return displayName.substring(0, 2).toUpperCase();
    };

    // Check if user is authenticated via Google OAuth
    const isGoogleAuth = (user) => {
        if (!user) return false;

        const provider = user.app_metadata?.provider || user.user_metadata?.provider;
        const providers = user.app_metadata?.providers || [];

        return provider === 'google' || providers.includes('google') ||
            (user.email && user.user_metadata?.avatar_url?.includes('googleusercontent.com'));
    };

    const profileImageUrl = getOptimizedProfileImage(authUser);
    const displayName = getUserDisplayName(authUser);
    const userInitials = getUserInitials(authUser);
    const isFromGoogle = isGoogleAuth(authUser);

    // Handle logout
    const handleLogout = async () => {
        try {
            await signOut();
            console.log("Logging out...");
            router.push("/sign-in");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        if (!isUserMenuOpen) return;

        const handleClickOutside = (event) => {
            const userMenuContent = document.getElementById('user-menu-content');
            const userMenuButton = document.getElementById('user-menu-button');

            // Check if click is outside both the menu content and the button
            if (userMenuContent && userMenuButton &&
                !userMenuContent.contains(event.target) &&
                !userMenuButton.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isUserMenuOpen]);

    if (!authUser) return null;

    return (
        <div className={`relative ${className}`}>
            <button
                id="user-menu-button"
                className="flex items-center gap-2 rounded-xl p-2 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 min-h-[44px] border border-gray-200/60 hover:border-gray-300/80"
                aria-label="Open user menu"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-controls="user-menu-content"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
                {/* Enhanced Avatar with Google Profile Picture Support */}
                <div className="relative h-8 w-8 flex-shrink-0">
                    <Avatar className="h-full w-full border-2 border-white shadow-sm">
                        {profileImageUrl && !profileImageError ? (
                            <AvatarImage
                                src={profileImageUrl}
                                alt={`${displayName}'s profile picture`}
                                className="object-cover"
                                onError={() => setProfileImageError(true)}
                            />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-semibold">
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Google Account Indicator */}
                    {isFromGoogle && (
                        <div
                            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-white rounded-full flex items-center justify-center border-2 border-gray-100 shadow-md"
                            title="Google Account"
                        >
                            <svg className="h-2 w-2 sm:h-2.5 sm:w-2.5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        </div>
                    )}
                </div>

                <span className="hidden sm:inline font-medium truncate max-w-[100px] md:max-w-[140px] text-sm text-gray-700">
                    {displayName}
                </span>
                <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 text-gray-500 ${isUserMenuOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                />
            </button>

            {isUserMenuOpen && (
                <div
                    id="user-menu-content"
                    className="absolute right-0 mt-3 w-56 rounded-2xl border border-gray-200/60 bg-white shadow-xl z-50 backdrop-blur-sm"
                    role="menu"
                    aria-labelledby="user-menu-button"
                >
                    {/* Enhanced User Info with Google Account Indicator */}
                    <div className="py-4 px-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-gray-900 truncate flex-1">{displayName}</p>
                            {isFromGoogle && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                    <svg className="h-3 w-3" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span className="font-medium">Google</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">{authUser?.email || "User Email"}</p>
                    </div>

                    {/* Enhanced Menu Items */}
                    <div className="py-2" role="none">
                        <Link
                            href="/admin-dashboard/profile"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg mx-2"
                            role="menuitem"
                            onClick={() => setIsUserMenuOpen(false)}
                        >
                            <User className="h-4 w-4 flex-shrink-0 text-gray-500" />
                            <span className="font-medium">Profile</span>
                        </Link>

                        <Link
                            href="/admin-dashboard/settings"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg mx-2"
                            role="menuitem"
                            onClick={() => setIsUserMenuOpen(false)}
                        >
                            <Settings className="h-4 w-4 flex-shrink-0 text-gray-500" />
                            <span className="font-medium">Settings</span>
                        </Link>
                    </div>

                    {/* Enhanced Logout Button */}
                    <div className="border-t border-gray-100 py-2" role="none">
                        <button
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-2 font-medium"
                            role="menuitem"
                            onClick={(event) => {
                                event.preventDefault();
                                setIsUserMenuOpen(false);
                                handleLogout();
                            }}
                        >
                            <LogOut className="h-4 w-4 flex-shrink-0" />
                            <span>Sign out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
