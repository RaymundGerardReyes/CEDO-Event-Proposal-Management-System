// frontend/src/components/dashboard/student/ui/avatar.jsx
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => {
  const { user } = useAuth();

  // Enhanced function to get optimized Google profile picture URL
  const getOptimizedProfileImage = React.useCallback((userData) => {
    if (!userData) return null;

    // Check multiple possible sources for profile picture based on OAuth 2.0 standards
    const possibleSources = [
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
  }, []);

  // Enhanced function to get user display name from OAuth data
  const getUserDisplayName = React.useCallback((userData) => {
    if (!userData) return "User";

    const possibleNames = [
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

    for (const name of possibleNames) {
      if (name && typeof name === 'string' && name.trim()) {
        return name.trim();
      }
    }

    return "User";
  }, []);

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
  const userInitials = getUserInitials(user);
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

  // If children are provided, use them (for custom content)
  if (children) {
    return (
      <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full",
          colors.background,
          colors.text,
          "font-medium text-sm",
          "shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </AvatarPrimitive.Fallback>
    );
  }

  // Default minimalist avatar with initials
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full",
        colors.background,
        colors.text,
        "font-medium text-sm",
        "shadow-sm",
        "transition-all duration-200",
        "hover:shadow-md",
        className
      )}
      {...props}
    >
      <span className="select-none" aria-label={`${getUserDisplayName(user)}'s initials`}>
        {userInitials}
      </span>

      {/* Google Account Indicator for minimalist design */}
      {isFromGoogle && (
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
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Enhanced Avatar component with smart Google OAuth integration
const SmartAvatar = React.forwardRef(({
  className,
  src,
  alt,
  fallbackText,
  showGoogleIndicator = true,
  size = "default",
  ...props
}, ref) => {
  const { user } = useAuth();
  const [imageError, setImageError] = React.useState(false);

  // Size variants for different use cases
  const sizeClasses = {
    sm: "h-6 w-6",
    default: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
    "2xl": "h-20 w-20"
  };

  // Enhanced function to get optimized profile image
  const getOptimizedProfileImage = React.useCallback((userData) => {
    if (!userData) return null;

    const possibleSources = [
      src, // Explicit src prop takes priority
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

  return (
    <Avatar
      ref={ref}
      className={cn(sizeClasses[size], className)}
      {...props}
    >
      {shouldShowImage && (
        <AvatarImage
          src={profileImageUrl}
          alt={alt || `Profile picture`}
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      )}
      <AvatarFallback showGoogleIndicator={showGoogleIndicator}>
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
});
SmartAvatar.displayName = "SmartAvatar";

export { Avatar, AvatarFallback, AvatarImage, SmartAvatar };

