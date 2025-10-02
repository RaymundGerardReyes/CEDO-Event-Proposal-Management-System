"use client"

import { AvatarProfile } from "@/components/ui/avatar-origin";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import Notifications from "./notifications";
// Removed framer-motion imports for simpler dropdown implementation
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Enhanced responsive breakpoints with zoom awareness  
const RESPONSIVE_BREAKPOINTS = {
  xs: 320,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
  zoom125: 1536,  // Handles 125% zoom
  zoom150: 1280,  // Handles 150% zoom
  zoom200: 960,   // Handles 200% zoom
}


export function AppHeader() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showProfile, setShowProfile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const profileRef = useRef(null);

  const { user, signOut } = useAuth();


  // Enhanced responsive monitoring
  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth
      const screenWidth = window.screen.width
      const zoom = width / screenWidth

      setViewportWidth(width)
      setZoomLevel(zoom)
    }

    updateResponsiveState()
    window.addEventListener("resize", updateResponsiveState, { passive: true })

    return () => window.removeEventListener("resize", updateResponsiveState)
  }, [])

  // Enhanced click outside handler for profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      const isOutsideProfile = profileRef.current && !profileRef.current.contains(event.target);
      if (isOutsideProfile) {
        setShowProfile(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside, { passive: true, capture: true });
    return () => document.removeEventListener("mousedown", handleClickOutside, { capture: true });
  }, []);


  const handleNavigation = (path) => {
    router.push(path);
    setShowProfile(false);
  };

  if (!user) {
    return (
      <div
        className="
          flex items-center justify-end 
          bg-white/95 backdrop-blur-md
          border-b border-gray-200/60 shadow-sm
          transition-all duration-300 ease-out
        "
        style={{
          height: `clamp(3.5rem, 8vh, 5rem)`,
          padding: `0 clamp(1rem, 3vw, 2rem)`,
        }}
      >
        <Button
          variant="outline"
          onClick={() => router.push('/sign-in')}
          className="
            border-gray-300 hover:border-gray-400
            transition-all duration-300 hover:scale-105
          "
          style={{
            minHeight: `clamp(2.5rem, 5vh, 3rem)`,
            padding: `clamp(0.5rem, 1.5vw, 1rem) clamp(1rem, 3vw, 1.5rem)`,
            fontSize: `clamp(0.875rem, 1.5vw, 1rem)`,
          }}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div
      className="
        flex items-center justify-between 
        bg-white/95 backdrop-blur-md
        border-b border-gray-200/60 shadow-sm
        transition-all duration-300 ease-out
      "
      style={{
        height: `clamp(3.5rem, 8vh, 5rem)`,
        padding: `0 clamp(1rem, 3vw, 2rem)`,
      }}
    >
      {/* Enhanced left section with responsive brand */}
      <div className="flex items-center min-w-0 flex-1">
        <h1
          className="font-semibold text-gray-900 truncate transition-all duration-300"
          style={{
            fontSize: `clamp(1.25rem, 3vw, 2rem)`,
            lineHeight: 1.2
          }}
        >
          <span className="hidden md:inline">CEDO Admin</span>
          <span className="md:hidden">Admin</span>
        </h1>
      </div>

      {/* Enhanced right section with responsive spacing */}
      <div
        className="flex items-center ml-auto"
        style={{ gap: `clamp(0.5rem, 2vw, 1.25rem)` }}
      >
        {/* Notifications Component */}
        <Notifications onNavigate={handleNavigation} />

        {/* Enhanced profile dropdown with Google OAuth Avatar using AvatarProfile */}
        <div className="relative" ref={profileRef}>
          <Button
            variant="ghost"
            className="
              flex items-center cursor-pointer rounded-xl
              hover:bg-gray-100 active:bg-gray-200 
              transition-all duration-300 hover:scale-105 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-yellow-400/50
            "
            style={{
              height: `clamp(2.5rem, 5vw, 3rem)`,
              padding: `clamp(0.5rem, 1vw, 0.75rem)`,
              gap: `clamp(0.5rem, 1.5vw, 1rem)`,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Profile button clicked, current state:', showProfile);
              setShowProfile(!showProfile);
            }}
            aria-label="Toggle user profile menu"
          >
            <AvatarProfile
              src={user.avatar || user.profilePicture || user.image}
              name={user.name}
              role={user.role}
              size="default"
              showGoogleIndicator={true}
              className="ring-2 ring-transparent hover:ring-primary/20 transition-all duration-300"
              style={{
                width: `clamp(2rem, 4vw, 2.5rem)`,
                height: `clamp(2rem, 4vw, 2.5rem)`,
              }}
            />

            {/* Enhanced user info with responsive visibility */}
            <div
              className="hidden sm:block text-left min-w-0"
              style={{ maxWidth: `clamp(120px, 15vw, 200px)` }}
            >
              <p
                className="font-medium leading-none text-gray-900 truncate"
                style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
              >
                {user.name}
              </p>
              <p
                className="text-gray-500 truncate mt-0.5"
                style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
              >
                {user.role}
              </p>
            </div>

            <ChevronDown
              className="hidden sm:block text-gray-500 transition-transform duration-300"
              style={{
                width: `clamp(1rem, 2vw, 1.25rem)`,
                height: `clamp(1rem, 2vw, 1.25rem)`,
              }}
            />
          </Button>

          {showProfile && (
            console.log('Rendering profile dropdown'),
            <div
              className="
                absolute right-0 mt-2 
                bg-white rounded-xl shadow-xl border border-gray-200
                overflow-hidden z-[9999] 
              "
              style={{ width: `clamp(256px, 32vw, 384px)` }}
            >
              {/* Enhanced profile header with Google OAuth Avatar using AvatarProfile */}
              <div
                className="border-b border-gray-200 bg-gray-50"
                style={{ padding: `clamp(1rem, 3vw, 1.5rem)` }}
              >
                <div
                  className="flex items-center"
                  style={{ gap: `clamp(0.75rem, 2vw, 1rem)` }}
                >
                  <AvatarProfile
                    src={user.avatar || user.profilePicture || user.image}
                    name={user.name}
                    role={user.role}
                    size="xl"
                    showGoogleIndicator={true}
                    className="ring-2 ring-primary/20"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-medium text-gray-900 truncate"
                      style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                    >
                      {user.name}
                    </p>
                    <p
                      className="text-gray-500 truncate"
                      style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced profile menu */}
              <div style={{ padding: `clamp(0.5rem, 1.5vw, 0.75rem)` }}>
                <Button
                  variant="ghost"
                  className="
                      w-full justify-start cursor-pointer rounded-lg
                      text-gray-700 hover:bg-gray-100 active:bg-gray-200
                      transition-all duration-300
                    "
                  style={{
                    height: `clamp(2.5rem, 5vh, 3rem)`,
                    fontSize: `clamp(0.875rem, 1.5vw, 1rem)`,
                    gap: `clamp(0.5rem, 1.5vw, 0.75rem)`,
                  }}
                  onClick={() => handleNavigation("/admin-dashboard/profile")}
                >
                  <User
                    style={{
                      width: `clamp(1rem, 2vw, 1.25rem)`,
                      height: `clamp(1rem, 2vw, 1.25rem)`,
                    }}
                  />
                  My Profile
                </Button>

                {user.role === "head_admin" && (
                  <Button
                    variant="ghost"
                    className="
                        w-full justify-start cursor-pointer rounded-lg
                        text-gray-700 hover:bg-gray-100 active:bg-gray-200
                        transition-all duration-300
                      "
                    style={{
                      height: `clamp(2.5rem, 5vh, 3rem)`,
                      fontSize: `clamp(0.875rem, 1.5vw, 1rem)`,
                      gap: `clamp(0.5rem, 1.5vw, 0.75rem)`,
                    }}
                    onClick={() => handleNavigation("/admin-dashboard/settings")}
                  >
                    <Settings
                      style={{
                        width: `clamp(1rem, 2vw, 1.25rem)`,
                        height: `clamp(1rem, 2vw, 1.25rem)`,
                      }}
                    />
                    Settings
                  </Button>
                )}

                <div className="border-t my-1" />

                <Button
                  variant="ghost"
                  className="
                      w-full justify-start cursor-pointer rounded-lg
                      text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100
                      transition-all duration-300
                    "
                  style={{
                    height: `clamp(2.5rem, 5vh, 3rem)`,
                    fontSize: `clamp(0.875rem, 1.5vw, 1rem)`,
                    gap: `clamp(0.5rem, 1.5vw, 0.75rem)`,
                  }}
                  onClick={async () => {
                    try {
                      setShowProfile(false);
                      await signOut();
                    } catch (error) {
                      console.warn('Sign-out error:', error);
                      setShowProfile(false);
                    }
                  }}
                >
                  <LogOut
                    style={{
                      width: `clamp(1rem, 2vw, 1.25rem)`,
                      height: `clamp(1rem, 2vw, 1.25rem)`,
                    }}
                  />
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
