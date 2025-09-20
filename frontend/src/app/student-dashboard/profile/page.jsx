"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/student/ui/avatar";
import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { Separator } from "@/components/dashboard/student/ui/separator";
import { Textarea } from "@/components/dashboard/student/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/utils/api";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Building, CheckCircle, Edit3, Lock, Mail, Phone, RefreshCw, Save, Shield, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, Suspense, useCallback, useEffect, useState } from "react";

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// ✅ PERFORMANCE: Lazy loading components will be implemented when needed
// For now, we'll use the existing inline components for better performance

// Define a loading component for the Suspense fallback
function ProfileLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gray-300"></div>
              <div className="space-y-2">
                <div className="h-6 w-32 bg-gray-300 rounded"></div>
                <div className="h-4 w-24 bg-gray-300 rounded"></div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-4 w-20 bg-gray-300 rounded"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-20 bg-gray-300 rounded"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ PERFORMANCE: Memoized component to prevent unnecessary re-renders
const ProfilePageContent = memo(function ProfilePageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading, isInitialized } = useAuth();

  // All state variables moved to top to avoid hoisting issues
  const [profileData, setProfileData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ PERFORMANCE: Performance monitoring (minimal logging)
  useEffect(() => {
    const startTime = performance.now();
    console.log('🚀 Profile: Component mounted');

    return () => {
      const endTime = performance.now();
      console.log(`⚡ Profile: Render time: ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, []);

  // State for editable fields - Already declared above

  // Robust error serializer for console/debug
  const serializeError = useCallback((err) => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return `${err.name}: ${err.message}`;
    try {
      return JSON.stringify(err);
    } catch (_) {
      return String(err);
    }
  }, []);

  // Helper function to get cached token
  const getCachedToken = useCallback(() => {
    if (typeof document !== "undefined") {
      const cookieVal = document.cookie
        .split("; ")
        .find((row) => row.startsWith("cedo_token="));
      if (cookieVal) {
        return cookieVal.split("=")[1];
      }
    }
    return null;
  }, []);

  // Enhanced function to get Google profile picture with higher resolution
  const getOptimizedProfilePicture = useCallback((userData) => {
    // Priority order for profile picture sources based on web search results
    const profilePictureSources = [
      // Google OAuth high-resolution profile picture from user_metadata
      userData?.user_metadata?.avatar_url,
      userData?.user_metadata?.picture,
      // Standard avatar properties
      userData?.avatar_url,
      userData?.avatar,
      userData?.profilePicture,
      userData?.picture,
      userData?.image,
      // Google's user metadata from raw_user_meta_data
      userData?.raw_user_meta_data?.avatar_url,
      userData?.raw_user_meta_data?.picture,
      // Database stored avatar
      userData?.profile_picture_url
    ].filter(Boolean);

    let profilePicUrl = profilePictureSources[0];

    // If we have a Google profile picture, optimize it for higher resolution
    if (profilePicUrl && profilePicUrl.includes('googleusercontent.com')) {
      // Remove existing size parameters and add high resolution
      profilePicUrl = profilePicUrl.replace(/=s\d+-c/g, '=s400-c');
      // If no size parameter exists, add one for high quality
      if (!profilePicUrl.includes('=s')) {
        profilePicUrl += '=s400-c';
      }
    }

    return profilePicUrl;
  }, []);

  // Enhanced function to get user's display name
  const getUserDisplayName = useCallback((userData) => {
    const nameOptions = [
      // Google OAuth metadata names
      userData?.user_metadata?.full_name,
      userData?.user_metadata?.name,
      userData?.raw_user_meta_data?.full_name,
      userData?.raw_user_meta_data?.name,
      // Standard name properties
      userData?.full_name,
      userData?.name,
      userData?.fullName,
      userData?.display_name,
      // Extract name from email if no other name is available
      userData?.email?.split('@')[0]?.replace(/[._]/g, ' ')
    ].filter(Boolean);

    return nameOptions[0] || 'Student';
  }, []);

  // Check if user is connected via Google OAuth
  const isGoogleAccount = useCallback((userData) => {
    const profilePicUrl = getOptimizedProfilePicture(userData);
    const hasGooglePicture = profilePicUrl && profilePicUrl.includes('googleusercontent.com');
    const hasGoogleProvider = userData?.app_metadata?.provider === 'google' ||
      userData?.identities?.some(identity => identity.provider === 'google');

    return hasGooglePicture || hasGoogleProvider;
  }, [getOptimizedProfilePicture]);

  // ✅ PERFORMANCE: Optimized data fetching
  const fetchLatestProfileData = useCallback(async (showLoadingState = false) => {
    if (!user?.id) {
      console.log("👤 Profile: No user ID available, skipping fetch");
      return;
    }

    if (showLoadingState) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      console.log("👤 Profile: Fetching profile data...");

      // ✅ PERFORMANCE: Use apiRequest utility with timeout to prevent hanging requests
      const data = await Promise.race([
        apiRequest('/profile'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        )
      ]);

      if (data && data.success && data.user) {
        // ✅ PERFORMANCE: Simplified data merging for faster processing
        const enhancedUserData = {
          ...data.user,
          // Preserve Google OAuth metadata from auth context
          user_metadata: user.user_metadata || {},
          raw_user_meta_data: user.raw_user_meta_data || {},
          app_metadata: user.app_metadata || {},
          identities: user.identities || [],
          // Ensure we have the latest Google profile data
          avatar_url: getOptimizedProfilePicture(user) || data.user.avatar_url,
          full_name: getUserDisplayName(user) || data.user.full_name
        };

        setProfileData(enhancedUserData);

        // ✅ PERFORMANCE: Update editable fields with latest data
        setOrganizationDescription(enhancedUserData.organizationDescription || enhancedUserData.organization_description || '');

        // Handle different phone number property names
        const phone = enhancedUserData.phoneNumber ||
          enhancedUserData.phone_number ||
          enhancedUserData.contactPhone ||
          enhancedUserData.contact_phone || '';
        setPhoneNumber(phone);

        console.log(`👤 Profile: Successfully loaded profile for ${getUserDisplayName(enhancedUserData)}`);
      } else {
        const apiMsg = data?.error || data?.message || 'Invalid profile response format';
        setError(apiMsg);
        throw new Error(apiMsg);
      }
    } catch (err) {
      console.error('👤 Profile: Error fetching profile data:', serializeError(err));
      const friendly = (err && err.message) ? err.message : 'Failed to load profile. Please try again.';
      setError(friendly);
    } finally {
      if (showLoadingState) setIsRefreshing(false);
    }
  }, [user?.id, user?.user_metadata, user?.raw_user_meta_data, user?.app_metadata, user?.identities, getOptimizedProfilePicture, getUserDisplayName, serializeError]);

  // ✅ PERFORMANCE: Optimized initial loading
  useEffect(() => {
    if (isInitialized && !authLoading && user?.id) {
      console.log("👤 Profile: User authenticated, initializing profile...");

      // ✅ PERFORMANCE: Initialize immediately with auth context data for instant display
      if (user) {
        const enhancedUserData = {
          ...user,
          avatar_url: getOptimizedProfilePicture(user) || user.avatar_url,
          full_name: getUserDisplayName(user) || user.full_name
        };

        setProfileData(enhancedUserData);
        setOrganizationDescription(enhancedUserData.organizationDescription || enhancedUserData.organization_description || '');

        const phone = enhancedUserData.phoneNumber ||
          enhancedUserData.phone_number ||
          enhancedUserData.contactPhone ||
          enhancedUserData.contact_phone || '';
        setPhoneNumber(phone);
      }

      // ✅ PERFORMANCE: Fetch additional data in background with request deduplication
      const timeoutId = setTimeout(() => {
        fetchLatestProfileData();
      }, 50); // Reduced delay for faster background loading

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isInitialized, authLoading, user?.id, user?.user_metadata, getOptimizedProfilePicture, getUserDisplayName, fetchLatestProfileData]);

  // ✅ OPTIMIZATION: Removed auto-refresh to improve performance
  // Auto-refresh can be added back if needed, but it was causing performance issues

  // Validate phone number format before saving
  const validatePhoneNumber = (phone) => {
    if (!phone) {
      setPhoneError('Phone number cannot be empty.');
      return false;
    }
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Phone number must be exactly 11 digits and start with 09.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const digitOnly = value.replace(/\D/g, '').slice(0, 11);
    setPhoneNumber(digitOnly);

    if (digitOnly.length > 0) {
      validatePhoneNumber(digitOnly);
    } else {
      setPhoneError('');
    }
  };

  const handleSaveOrganization = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // ✅ FIX: Use apiRequest utility which automatically includes Authorization header
      const data = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({ organizationDescription })
      });

      if (data.success) {
        setIsEditingOrg(false);

        // Update local state immediately
        setProfileData(prev => ({
          ...prev,
          organizationDescription: organizationDescription
        }));

        // Refresh from database to ensure consistency
        await fetchLatestProfileData();

        console.log('👤 Profile: Organization description saved and refreshed');
      } else {
        throw new Error(data.error || 'Failed to save organization description');
      }
    } catch (err) {
      console.error('👤 Profile: Failed to save organization description:', serializeError(err));
      const friendly = (err && err.message) ? err.message : 'Failed to save organization. Please try again.';
      setError(friendly);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhone = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return; // Stop if validation fails
    }

    setIsSaving(true);
    setPhoneError(''); // Clear previous errors before trying

    try {
      // ✅ FIX: Use apiRequest utility which automatically includes Authorization header
      const data = await apiRequest('/profile/phone', {
        method: 'PUT',
        body: JSON.stringify({ phoneNumber })
      });

      if (!data.success) {
        setPhoneError(data.error || 'An unexpected error occurred.');
        return;
      }

      // --- Success Case ---
      setIsEditingPhone(false);
      setPhoneError('');

      // Update local state immediately
      setProfileData(prev => ({
        ...prev,
        phoneNumber: phoneNumber
      }));

      // Refresh from database to ensure consistency
      await fetchLatestProfileData();

      console.log('👤 Profile: Phone number saved and refreshed');

    } catch (err) {
      // This now only catches UNEXPECTED errors (e.g., network failure)
      console.error('👤 Profile: A network or server error occurred:', serializeError(err));
      setPhoneError('Could not connect to the server. Please try again.');
    } finally {
      setIsSaving(false); // Ensure the button is re-enabled on error or success
    }
  };

  const handleRefresh = () => {
    fetchLatestProfileData(true);
  };

  const handleClose = () => {
    router.back();
  };

  // Render state logging removed - profile page is working properly

  // Debug panel removed - profile page is now working properly

  // ✅ PERFORMANCE: Show profile immediately if user data is available
  if (!isInitialized || authLoading) {
    // ✅ PERFORMANCE: If we have user data, show it immediately instead of loading
    if (user?.id) {
      console.log('⚡ Profile: Showing immediate profile with auth data');
      // Show profile with available data while auth initializes
      const currentUserData = user;
      const userEmail = currentUserData?.email || currentUserData?.contactEmail || currentUserData?.contact_email;
      const optimizedAvatar = getOptimizedProfilePicture(currentUserData);
      const displayName = getUserDisplayName(currentUserData);
      const isGoogleUser = isGoogleAccount(currentUserData);

      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1 }}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          >

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Overview Card */}
              <div className="lg:col-span-1">
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Profile Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative group">
                        <Avatar className="h-20 w-20 border-2 border-cedo-blue/20 ring-2 ring-offset-2 ring-transparent group-hover:ring-cedo-blue/30 transition-all duration-200">
                          <AvatarImage
                            src={optimizedAvatar}
                            alt={displayName}
                            className="object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <AvatarFallback className="bg-cedo-blue text-white text-lg font-semibold">
                            {displayName?.split(" ").map((n) => n[0]).join("").toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {isGoogleUser && (
                          <div className="absolute -top-1 -right-1 bg-white rounded-full p-1.5 shadow-md border border-gray-200">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="font-semibold text-lg text-gray-900">{displayName}</h3>
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Badge variant="secondary" className="bg-cedo-blue/10 text-cedo-blue border-cedo-blue/20">
                            <UserCircle size={12} className="mr-1" />
                            Student
                          </Badge>
                          <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                            <CheckCircle size={12} className="mr-1" />
                            Active
                          </Badge>
                          {isGoogleUser && (
                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                              <Shield size={12} className="mr-1" />
                              Google Account
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Profile Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Personal Information</CardTitle>
                    <p className="text-sm text-gray-600">Your basic account details</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-cedo-blue mr-2" />
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="email"
                          value={userEmail || ''}
                          className="flex-1 bg-gray-50 border-gray-200"
                          readOnly
                        />
                        <Button variant="outline" size="sm" disabled className="text-gray-500">
                          {isGoogleUser ? 'Google' : 'Protected'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    // Show loading only if no user data available
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-cedo-blue mx-auto mb-4" />
          <p className="text-gray-600">Initializing profile...</p>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
            <Button onClick={() => router.push('/sign-in')} className="bg-cedo-blue hover:bg-cedo-blue/90">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use profileData if available, otherwise fall back to user from auth context
  const currentUserData = profileData || user;
  const userEmail = currentUserData?.email || currentUserData?.contactEmail || currentUserData?.contact_email;

  // Get optimized profile picture and display name
  const optimizedAvatar = getOptimizedProfilePicture(currentUserData);
  const displayName = getUserDisplayName(currentUserData);
  const isGoogleUser = isGoogleAccount(currentUserData);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
      >

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
          {isRefreshing && (
            <p className="text-sm text-gray-500 mt-2">Refreshing profile data...</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Profile Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Enhanced profile header with Google integration */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative group">
                    <Avatar className="h-20 w-20 border-2 border-cedo-blue/20 ring-2 ring-offset-2 ring-transparent group-hover:ring-cedo-blue/30 transition-all duration-200">
                      <AvatarImage
                        src={optimizedAvatar}
                        alt={displayName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-cedo-blue text-white text-lg font-semibold">
                        {displayName?.split(" ").map((n) => n[0]).join("").toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Google Auth indicator for profile picture */}
                    {isGoogleUser && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-1.5 shadow-md border border-gray-200">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {displayName}
                    </h3>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Badge variant="secondary" className="bg-cedo-blue/10 text-cedo-blue border-cedo-blue/20">
                        <UserCircle size={12} className="mr-1" />
                        Student
                      </Badge>
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                        <CheckCircle size={12} className="mr-1" />
                        Active
                      </Badge>
                      {isGoogleUser && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                          <Shield size={12} className="mr-1" />
                          Google Account
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Profile Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Information Card */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Personal Information</CardTitle>
                <p className="text-sm text-gray-600">Your basic account details</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-cedo-blue mr-2" />
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      id="email"
                      value={userEmail || ''}
                      className="flex-1 bg-gray-50 border-gray-200"
                      readOnly
                    />
                    <Button variant="outline" size="sm" disabled className="text-gray-500">
                      {isGoogleUser ? 'Google' : 'Protected'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isGoogleUser
                      ? 'Email is managed through your Google account and cannot be changed here.'
                      : 'Email is protected and cannot be changed here.'
                    }
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-cedo-blue mr-2" />
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      id="password"
                      type="password"
                      value="••••••••"
                      className="flex-1 bg-gray-50 border-gray-200"
                      readOnly
                    />
                    <Button variant="outline" size="sm" disabled className="text-gray-500">
                      {isGoogleUser ? 'Google Auth' : 'Protected'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isGoogleUser
                      ? 'Authentication is handled through Google OAuth. No password needed.'
                      : 'Password is managed securely and cannot be changed here.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information Card */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Contact Information</CardTitle>
                <p className="text-sm text-gray-600">Your contact details and organization</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Organization Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-cedo-blue mr-2" />
                      <Label htmlFor="organization" className="text-sm font-medium text-gray-700">Organization Description</Label>
                    </div>
                    {!isEditingOrg && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingOrg(true)}
                        className="text-cedo-blue hover:text-cedo-blue/80"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditingOrg ? (
                    <div className="space-y-3">
                      <Textarea
                        id="organization"
                        value={organizationDescription}
                        onChange={(e) => setOrganizationDescription(e.target.value)}
                        placeholder="Enter your organization description..."
                        className="min-h-[100px] resize-none border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue"
                        disabled={isSaving}
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleSaveOrganization}
                          disabled={isSaving}
                          className="bg-cedo-blue hover:bg-cedo-blue/90 text-white"
                        >
                          {isSaving ? (
                            <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-3 w-3" />
                          )}
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSaving}
                          onClick={() => {
                            setIsEditingOrg(false);
                            setOrganizationDescription(currentUserData.organizationDescription || currentUserData.organization_description || '');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 min-h-[100px]">
                      <p className="text-sm text-gray-700">
                        {organizationDescription || 'No organization description provided'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-cedo-blue mr-2" />
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    </div>
                    {!isEditingPhone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingPhone(true)}
                        className="text-cedo-blue hover:text-cedo-blue/80"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditingPhone ? (
                    <div className="space-y-3">
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="09XXXXXXXXX"
                        maxLength={11}
                        disabled={isSaving}
                        className="border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue"
                      />
                      {phoneError && (
                        <p className="text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {phoneError}
                        </p>
                      )}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleSavePhone}
                          disabled={!!phoneError || phoneNumber.length !== 11 || isSaving}
                          className="bg-cedo-blue hover:bg-cedo-blue/90 text-white"
                        >
                          {isSaving ? (
                            <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-3 w-3" />
                          )}
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSaving}
                          onClick={() => {
                            setIsEditingPhone(false);
                            const phone = currentUserData.phoneNumber ||
                              currentUserData.phone_number ||
                              currentUserData.contactPhone ||
                              currentUserData.contact_phone || '';
                            setPhoneNumber(phone);
                            setPhoneError('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Input
                        id="phone"
                        value={phoneNumber || 'No phone number provided'}
                        className="flex-1 bg-gray-50 border-gray-200"
                        readOnly
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Information Card */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Account Information</CardTitle>
                <p className="text-sm text-gray-600">Your account role and permissions</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserCircle className="h-4 w-4 text-cedo-blue mr-2" />
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">Account Role</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-cedo-blue/10 text-cedo-blue px-4 py-3 rounded-lg text-sm font-medium flex-1 border border-cedo-blue/20">
                      <div className="flex items-center">
                        <UserCircle className="h-4 w-4 mr-2" />
                        {currentUserData.role || 'Student'}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Your role determines your permissions within the system.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}