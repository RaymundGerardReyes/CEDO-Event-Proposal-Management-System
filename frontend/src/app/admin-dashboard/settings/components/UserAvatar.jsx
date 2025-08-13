'use client';

import { AvatarFallback, AvatarImage, Avatar as UIAvatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { User } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

const avatarVariants = cva(
    'relative flex shrink-0 overflow-hidden rounded-full transition-all duration-200 border-2',
    {
        variants: {
            variant: {
                default: 'border-transparent',
                google: 'border-[#4285F4] shadow-sm shadow-[#4285F4]/20',
                admin: 'border-primary shadow-sm shadow-primary/20',
                local: 'border-gray-300',
            },
            size: {
                sm: 'h-8 w-8',
                md: 'h-10 w-10',
                lg: 'h-16 w-16',
                xl: 'h-20 w-20',
            }
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

/**
 * Enhanced UserAvatar component for displaying user profile pictures
 * Handles Google OAuth profile pictures with optimized URLs and fallbacks
 */
const UserAvatar = memo(({ user, size = 'md', className, showIndicator = false, ...props }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Memoize user ID to prevent unnecessary re-renders
    const userId = useMemo(() => user?.id, [user?.id]);
    const userAvatar = useMemo(() => user?.avatar, [user?.avatar]);

    // Reset states when user ID or avatar changes (more stable dependencies)
    useEffect(() => {
        setImageLoaded(false);
        setHasError(false);
    }, [userId, userAvatar]);

    // Memoize authentication provider detection
    const authProvider = useMemo(() => {
        if (!user) return 'unknown';

        // Check multiple indicators for Google authentication
        if (user.google_id ||
            user.authProvider === 'google' ||
            (user.avatar && user.avatar.includes('googleusercontent.com'))) {
            return 'google';
        }

        // Check for admin/manager roles
        if (user.role === 'head_admin' || user.role === 'manager') {
            return 'admin';
        }

        return 'local';
    }, [user?.google_id, user?.authProvider, user?.avatar, user?.role]);

    // Memoize Google URL optimization
    const optimizedAvatarUrl = useMemo(() => {
        if (!user?.avatar) return null;

        // Priority order for avatar sources
        const sources = [
            user.avatar,
            user.avatarUrl,
            user.profile_picture_url,
            user.picture,
        ].filter(Boolean);

        if (sources.length === 0) return null;

        const primaryUrl = sources[0];

        // Optimize Google URLs
        if (primaryUrl.includes('googleusercontent.com')) {
            try {
                const baseUrl = primaryUrl.split('=')[0];
                return `${baseUrl}=s400-c`;
            } catch (error) {
                console.warn('Failed to optimize Google avatar URL:', error);
                return primaryUrl;
            }
        }

        return primaryUrl;
    }, [user?.avatar, user?.avatarUrl, user?.profile_picture_url, user?.picture]);

    // Memoize user initials
    const userInitials = useMemo(() => {
        if (!user) return 'U';

        if (user.name) {
            return user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }

        if (user.email) {
            return user.email[0].toUpperCase();
        }

        return 'U';
    }, [user?.name, user?.email]);

    // Stable event handlers
    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
        setHasError(false);
    }, []);

    const handleImageError = useCallback(() => {
        setHasError(true);
        setImageLoaded(false);
    }, []);

    // Early return for no user
    if (!user) {
        return (
            <div className={cn(avatarVariants({ size }), 'bg-muted flex items-center justify-center', className)}>
                <User className="h-1/2 w-1/2 text-muted-foreground" />
            </div>
        );
    }

    const avatarUrl = !hasError ? optimizedAvatarUrl : null;
    const variant = authProvider === 'google' ? 'google' :
        authProvider === 'admin' ? 'admin' : 'local';

    return (
        <div className="relative">
            <UIAvatar
                className={cn(avatarVariants({ variant, size }), className)}
                {...props}
            >
                {avatarUrl && (
                    <AvatarImage
                        src={avatarUrl}
                        alt={`${user.name || user.email || 'User'}'s avatar`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        className="object-cover"
                    />
                )}
                <AvatarFallback
                    className={cn(
                        "flex items-center justify-center font-semibold text-sm",
                        variant === 'google' && "bg-[#4285F4] text-white",
                        variant === 'admin' && "bg-primary text-primary-foreground",
                        variant === 'local' && "bg-gray-100 text-gray-700"
                    )}
                >
                    {!imageLoaded && avatarUrl ? (
                        <Skeleton className="h-full w-full rounded-full" />
                    ) : (
                        userInitials
                    )}
                </AvatarFallback>
            </UIAvatar>

            {/* Authentication Provider Indicator */}
            {showIndicator && authProvider === 'google' && (
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#4285F4] border-2 border-white flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                </div>
            )}
        </div>
    );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar; 