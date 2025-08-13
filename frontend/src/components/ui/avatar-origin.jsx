import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { Camera, UserRoundIcon } from "lucide-react"
import React from "react"

// Base Avatar component
const Avatar = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
            className
        )}
        {...props}
    />
))
Avatar.displayName = "Avatar"

// Avatar Image component
const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
    <img
        ref={ref}
        className={cn("aspect-square h-full w-full object-cover", className)}
        {...props}
    />
))
AvatarImage.displayName = "AvatarImage"

// Avatar Fallback component
const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium",
            className
        )}
        {...props}
    >
        {children || <UserRoundIcon size={16} className="opacity-60" aria-hidden="true" />}
    </div>
))
AvatarFallback.displayName = "AvatarFallback"

// Enhanced Profile Avatar component with Google OAuth integration
export function AvatarProfile({
    className,
    src,
    alt,
    size = "default",
    showGoogleIndicator = true,
    fallbackText,
    name,
    role,
    showEdit = false,
    onEdit,
    ...props
}) {
    const { user } = useAuth();
    const [imageError, setImageError] = React.useState(false);

    // Size variants for different use cases
    const sizeClasses = {
        sm: "h-6 w-6",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
        "3xl": "h-24 w-24",
        "4xl": "h-32 w-32"
    };

    // Enhanced function to get optimized Google profile picture URL
    const getOptimizedProfileImage = React.useCallback((userData) => {
        if (!userData) return null;

        // Check multiple possible sources for profile picture based on OAuth 2.0 standards
        const possibleSources = [
            src, // Explicit src prop takes priority
            // Google OAuth high-resolution profile pictures
            userData.user_metadata?.avatar_url,
            userData.user_metadata?.picture,
            userData.user_metadata?.profile_picture,
            userData.raw_user_meta_data?.avatar_url,
            userData.raw_user_meta_data?.picture,
            userData.raw_user_meta_data?.profile_picture,
            // Standard OAuth profile picture properties
            userData.picture,
            userData.avatar_url,
            userData.profile_picture,
            userData.image
        ];

        for (const source of possibleSources) {
            if (source && typeof source === 'string') {
                // Optimize Google profile pictures for better quality and performance
                if (source.includes('googleusercontent.com')) {
                    // Remove existing size parameters and add optimized ones
                    const baseUrl = source.split('=')[0];
                    return `${baseUrl}=s400-c`; // 400x400 pixels, cropped to square
                }

                // Return other OAuth provider profile pictures as-is
                return source;
            }
        }

        return null;
    }, [src]);

    // Enhanced function to get user display name from OAuth data
    const getUserDisplayName = React.useCallback((userData) => {
        if (!userData) return name || "User";

        const possibleNames = [
            name, // Explicit name prop takes priority
            // Google OAuth metadata names
            userData.user_metadata?.full_name,
            userData.user_metadata?.name,
            userData.raw_user_meta_data?.full_name,
            userData.raw_user_meta_data?.name,
            // Standard OAuth name properties
            userData.name,
            userData.full_name,
            userData.display_name,
            userData.given_name ? `${userData.given_name} ${userData.family_name || ''}`.trim() : null,
            // Extract name from email if no other name is available
            userData.email?.split('@')[0]?.replace(/[._]/g, ' ')
        ];

        for (const displayName of possibleNames) {
            if (displayName && typeof displayName === 'string' && displayName.trim()) {
                return displayName.trim();
            }
        }

        return "User";
    }, [name]);

    // Enhanced function to get minimalist user initials
    const getUserInitials = React.useCallback((userData) => {
        const displayName = getUserDisplayName(userData);

        if (displayName === "User") return "U";

        // Clean the name and split into parts
        const nameParts = displayName
            .replace(/[^\w\s]/g, '') // Remove special characters
            .split(' ')
            .filter(part => part.length > 0);

        if (nameParts.length >= 2) {
            // Use first letter of first and last name
            return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        } else if (nameParts.length === 1) {
            // Use first two letters of single name
            return nameParts[0].substring(0, 2).toUpperCase();
        }

        // Fallback to first two characters of display name
        return displayName.substring(0, 2).toUpperCase();
    }, [getUserDisplayName]);

    // Check if user is authenticated via Google OAuth
    const isGoogleAuth = React.useCallback((userData) => {
        if (!userData) return false;

        const provider = userData.app_metadata?.provider || userData.user_metadata?.provider;
        const providers = userData.app_metadata?.providers || [];
        const profilePicUrl = getOptimizedProfileImage(userData);

        return provider === 'google' ||
            providers.includes('google') ||
            (profilePicUrl && profilePicUrl.includes('googleusercontent.com')) ||
            userData.identities?.some(identity => identity.provider === 'google');
    }, [getOptimizedProfileImage]);

    // Get computed values
    const profileImageUrl = getOptimizedProfileImage(user);
    const shouldShowImage = profileImageUrl && !imageError;
    const userInitials = fallbackText || getUserInitials(user);
    const isFromGoogle = isGoogleAuth(user);

    // Enhanced color scheme based on Google Auth status
    const getAvatarColors = React.useCallback(() => {
        if (isFromGoogle) {
            // Google brand colors for Google-authenticated users
            return {
                background: "bg-gradient-to-br from-[#4285F4] to-[#34A853]",
                text: "text-white",
                border: "border-[#4285F4]/20"
            };
        } else {
            // Minimalist design for non-Google users
            return {
                background: "bg-gradient-to-br from-slate-600 to-slate-700",
                text: "text-white",
                border: "border-slate-300"
            };
        }
    }, [isFromGoogle]);

    const colors = getAvatarColors();

    return (
        <div className="relative group">
            <div
                className={cn(
                    "relative flex shrink-0 overflow-hidden rounded-full",
                    sizeClasses[size],
                    size === "2xl" || size === "3xl" || size === "4xl" ? "ring-4 ring-primary/10" : "",
                    className
                )}
                {...props}
            >
                {shouldShowImage ? (
                    <img
                        src={profileImageUrl}
                        alt={alt || `${getUserDisplayName(user)}'s profile picture`}
                        className="aspect-square h-full w-full object-cover"
                        onError={() => setImageError(true)}
                        onLoad={() => setImageError(false)}
                    />
                ) : (
                    <div
                        className={cn(
                            "flex h-full w-full items-center justify-center rounded-full",
                            colors.background,
                            colors.text,
                            "font-medium text-sm",
                            "shadow-sm",
                            "transition-all duration-200",
                            "hover:shadow-md"
                        )}
                    >
                        <span className="select-none" aria-label={`${getUserDisplayName(user)}'s initials`}>
                            {userInitials}
                        </span>
                    </div>
                )}

                {/* Google Account Indicator for minimalist design */}
                {isFromGoogle && showGoogleIndicator && (
                    <div
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm"
                        title="Google Account"
                        aria-label="Google Account"
                    >
                        <svg className="h-2 w-2" viewBox="0 0 24 24" aria-hidden="true">
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

                {/* Edit button for profile avatars */}
                {showEdit && onEdit && (
                    <button
                        onClick={onEdit}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                        aria-label="Edit profile picture"
                    >
                        <Camera className="h-4 w-4 text-white" />
                    </button>
                )}
            </div>
        </div>
    );
}

// Avatar with Status indicator - SINGLE IMPLEMENTATION
export function AvatarStatus({
    className,
    status = "online",
    src,
    alt,
    fallback,
    size = "default",
    ...props
}) {
    const { user } = useAuth();
    const [imageError, setImageError] = React.useState(false);

    const sizeClasses = {
        sm: "h-6 w-6",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16"
    };

    const statusSizes = {
        sm: "h-1.5 w-1.5",
        default: "h-2.5 w-2.5",
        lg: "h-3 w-3",
        xl: "h-3.5 w-3.5"
    };

    const statusColors = {
        online: "bg-green-500",
        offline: "bg-gray-400",
        away: "bg-yellow-500",
        busy: "bg-red-500"
    };

    // Enhanced function to get optimized Google profile picture URL
    const getOptimizedProfileImage = React.useCallback((userData) => {
        if (!userData) return null;

        const possibleSources = [
            src,
            userData.user_metadata?.avatar_url,
            userData.user_metadata?.picture,
            userData.raw_user_meta_data?.avatar_url,
            userData.raw_user_meta_data?.picture,
            userData.picture,
            userData.avatar_url
        ];

        for (const source of possibleSources) {
            if (source && typeof source === 'string') {
                if (source.includes('googleusercontent.com')) {
                    const baseUrl = source.split('=')[0];
                    return `${baseUrl}=s400-c`;
                }
                return source;
            }
        }

        return null;
    }, [src]);

    const profileImageUrl = getOptimizedProfileImage(user);
    const shouldShowImage = profileImageUrl && !imageError;

    // Get user initials
    const getUserInitials = (userData) => {
        const name = userData?.name || userData?.user_metadata?.name || userData?.raw_user_meta_data?.name || "User";
        const nameParts = name.split(' ').filter(part => part.length > 0);

        if (nameParts.length >= 2) {
            return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="relative">
            <div
                className={cn(
                    "relative flex shrink-0 overflow-hidden rounded-full",
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                {shouldShowImage ? (
                    <img
                        src={profileImageUrl}
                        alt={alt || "Profile picture"}
                        className="aspect-square h-full w-full object-cover"
                        onError={() => setImageError(true)}
                        onLoad={() => setImageError(false)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white font-medium text-sm">
                        <span className="select-none">
                            {fallback || getUserInitials(user)}
                        </span>
                    </div>
                )}
            </div>

            {/* Status indicator */}
            <div
                className={cn(
                    "absolute bottom-0 right-0 rounded-full border-2 border-background",
                    statusSizes[size],
                    statusColors[status]
                )}
                aria-label={`Status: ${status}`}
            />
        </div>
    );
}

// Avatar Group component - ADDED BACK
export function AvatarGroup({
    children,
    max = 4,
    size = "default",
    className,
    ...props
}) {
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = childrenArray.slice(0, max);
    const remainingCount = childrenArray.length - max;

    const sizeClasses = {
        sm: "h-6 w-6",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16"
    };

    return (
        <div className={cn("flex -space-x-2", className)} {...props}>
            {visibleChildren.map((child, index) => (
                <div key={index} className="ring-2 ring-background rounded-full">
                    {React.cloneElement(child, { size })}
                </div>
            ))}
            {remainingCount > 0 && (
                <div className="ring-2 ring-background rounded-full">
                    <AvatarBasic
                        size={size}
                        fallback={`+${remainingCount}`}
                        className="bg-muted text-muted-foreground"
                    />
                </div>
            )}
        </div>
    );
}

// Basic Avatar component
export function AvatarBasic({
    src,
    alt,
    fallback,
    size = "default",
    className,
    ...props
}) {
    const { user } = useAuth();
    const [imageError, setImageError] = React.useState(false);

    const sizeClasses = {
        sm: "h-6 w-6",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16"
    };

    // Enhanced function to get optimized Google profile picture URL
    const getOptimizedProfileImage = React.useCallback((userData) => {
        if (!userData) return null;

        const possibleSources = [
            src,
            userData.user_metadata?.avatar_url,
            userData.user_metadata?.picture,
            userData.raw_user_meta_data?.avatar_url,
            userData.raw_user_meta_data?.picture,
            userData.picture,
            userData.avatar_url
        ];

        for (const source of possibleSources) {
            if (source && typeof source === 'string') {
                if (source.includes('googleusercontent.com')) {
                    const baseUrl = source.split('=')[0];
                    return `${baseUrl}=s400-c`;
                }
                return source;
            }
        }

        return null;
    }, [src]);

    const profileImageUrl = getOptimizedProfileImage(user);
    const shouldShowImage = profileImageUrl && !imageError;

    const getInitials = (name) => {
        if (!name) return "";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    return (
        <div
            className={cn(
                "relative flex shrink-0 overflow-hidden rounded-full",
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {shouldShowImage ? (
                <img
                    src={profileImageUrl}
                    alt={alt || "Avatar"}
                    className="aspect-square h-full w-full object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                    {fallback || getInitials(alt) || <UserRoundIcon size={size === "sm" ? 14 : 16} className="opacity-60" />}
                </div>
            )}
        </div>
    );
}

// Export all components
export {
    Avatar, AvatarFallback, AvatarImage
}

