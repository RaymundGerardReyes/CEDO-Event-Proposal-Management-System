"use client"

import { Input } from "@/components/dashboard/admin/ui/input";
import { Label } from "@/components/dashboard/admin/ui/label";
import { Separator } from "@/components/dashboard/admin/ui/separator";
import { Textarea } from "@/components/dashboard/admin/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/student/ui/avatar";
import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/utils/api";
import { AlertCircle, Building, CheckCircle, Lock, Mail, Phone, RefreshCw, Save, Shield, UserCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// Define a loading component for the Suspense fallback
function ProfileLoadingSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div className="z-10 w-full max-w-md mx-auto p-4">
        <Card className="border-cedo-blue/20 shadow-lg">
          <CardHeader className="relative pb-2">
            <div className="h-6 w-3/4 bg-gray-300 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-24 w-24 rounded-full bg-gray-300 animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-300 rounded animate-pulse mt-2"></div>
            </div>
            <Separator />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="flex justify-end pt-4">
              <div className="h-10 w-20 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading, isInitialized } = useAuth();

  // Real-time profile state
  const [profileData, setProfileData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // State for editable fields
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  // Real-time profile data fetching
  const fetchLatestProfileData = useCallback(async (showLoadingState = false) => {
    if (!user?.id) {
      console.log("👤 Profile: No user ID available, skipping fetch");
      return;
    }

    if (showLoadingState) setIsRefreshing(true);
    setError(null);

    try {
      const userEmail = user?.email || user?.contactEmail || user?.contact_email;
      console.log(`👤 Profile: Fetching latest data for user ${user.id} (${userEmail})`);

      // ✅ FIX: Use apiRequest utility which automatically includes Authorization header
      const data = await apiRequest('/profile');
      console.log('👤 Profile: Raw API response:', data);

      if (data && data.success && data.user) {
        // Merge Google OAuth data with database data
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

        // Update editable fields with latest data
        setOrganizationDescription(enhancedUserData.organizationDescription || enhancedUserData.organization_description || '');

        // Handle different phone number property names
        const phone = enhancedUserData.phoneNumber ||
          enhancedUserData.phone_number ||
          enhancedUserData.contactPhone ||
          enhancedUserData.contact_phone || '';
        setPhoneNumber(phone);

        console.log(`👤 Profile: Successfully loaded enhanced profile for ${getUserDisplayName(enhancedUserData)}`, {
          hasGoogleAvatar: !!getOptimizedProfilePicture(enhancedUserData),
          avatarUrl: getOptimizedProfilePicture(enhancedUserData),
          displayName: getUserDisplayName(enhancedUserData),
          isGoogleUser: isGoogleAccount(enhancedUserData),
          orgDesc: enhancedUserData.organizationDescription,
          phone: phone,
          availableKeys: Object.keys(enhancedUserData)
        });
      } else {
        const apiMsg = data?.error || data?.message || 'Invalid profile response format';
        // Surface friendly error for UI
        setError(apiMsg);
        // Throw for logging path
        throw new Error(apiMsg);
      }
    } catch (err) {
      console.error('👤 Profile: Error fetching profile data:', serializeError(err));
      const friendly = (err && err.message) ? err.message : 'Failed to load profile. Please try again.';
      setError(friendly);
    } finally {
      if (showLoadingState) setIsRefreshing(false);
    }
  }, [user?.id, user?.user_metadata, user?.raw_user_meta_data, user?.app_metadata, user?.identities, getOptimizedProfilePicture, getUserDisplayName, isGoogleAccount, serializeError]);

  // Initial data load and sync with auth context
  useEffect(() => {
    if (isInitialized && !authLoading && user?.id) {
      console.log("👤 Profile: User authenticated, fetching latest profile data...");

      // Initialize with enhanced auth context data first
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

      // Then fetch latest from database
      fetchLatestProfileData();
    }
  }, [isInitialized, authLoading, user?.id, user?.user_metadata, fetchLatestProfileData, getOptimizedProfilePicture, getUserDisplayName]);

  // Auto-refresh profile data every 30 seconds for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      console.log("👤 Profile: Auto-refreshing profile data...");
      fetchLatestProfileData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, fetchLatestProfileData]);

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

  // Show loading while auth is initializing
  if (!isInitialized || authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <p className="z-10 text-white">Initializing profile...</p>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div className="z-10 bg-white p-4 rounded border-red-500 border">
          <p className="text-red-500">Authentication required. Please sign in.</p>
          <Button className="mt-2" onClick={() => router.push('/sign-in')}>
            Go to Sign In
          </Button>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 -m-4 sm:-m-6 md:-m-8 lg:-m-10">
      {/* Enhanced Page Header with responsive spacing */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cedo-blue">Profile Management</h1>
              <p className="mt-2 text-sm sm:text-base lg:text-lg text-gray-600">
                Manage your profile information and account settings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-cedo-blue/30 text-cedo-blue hover:bg-cedo-blue hover:text-white"
                title="Refresh profile data"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:inline">Close</span>
              </Button>
            </div>
          </div>
          {isRefreshing && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Refreshing profile data...
            </div>
          )}
        </div>
      </div>

      {/* Main content with enhanced responsive grid layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Left column - Main profile content */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
              <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-cedo-blue mb-3 flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-cedo-blue/10">
                    <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-cedo-blue" />
                  </div>
                  <div>
                    <span>Profile Information</span>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-normal">
                      View and manage your personal information
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mr-3" />
                      <p className="text-red-600 text-sm sm:text-base">{error}</p>
                    </div>
                  </div>
                )}

                {/* Enhanced profile header with Google integration */}
                <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-cedo-blue/20 ring-4 ring-offset-4 ring-transparent group-hover:ring-cedo-blue/30 transition-all duration-300 shadow-lg">
                      <AvatarImage
                        src={optimizedAvatar}
                        alt={displayName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-cedo-blue to-cedo-blue/80 text-white text-2xl sm:text-3xl font-bold">
                        {displayName?.split(" ").map((n) => n[0]).join("").toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Google Auth indicator for profile picture */}
                    {isGoogleUser && (
                      <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 sm:p-3 shadow-lg border-2 border-gray-200">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-4">
                    <h3 className="font-bold text-2xl sm:text-3xl text-cedo-blue">
                      {displayName}
                    </h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Badge variant="secondary" className="bg-cedo-blue/10 text-cedo-blue border-cedo-blue/20 px-4 py-2 text-sm sm:text-base">
                        <UserCircle size={16} className="mr-2" />
                        Student
                      </Badge>
                      <Badge variant="outline" className="text-sm sm:text-base border-green-200 text-green-700 bg-green-50 px-4 py-2">
                        <CheckCircle size={16} className="mr-2" />
                        Active
                      </Badge>
                      {isGoogleUser && (
                        <Badge variant="outline" className="text-sm sm:text-base text-blue-600 border-blue-200 bg-blue-50 px-4 py-2">
                          <Shield size={16} className="mr-2" />
                          Google Account
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-6 sm:my-8" />

                {/* Enhanced form fields with responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  {/* Email */}
                  <div className="sm:col-span-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cedo-blue/10">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                      </div>
                      <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-gray-700">Email Address</Label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        id="email"
                        value={userEmail || ''}
                        className="flex-1 h-12 sm:h-14 text-sm sm:text-base bg-gray-50 border-gray-300 rounded-xl"
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="lg"
                        disabled
                        className="h-12 sm:h-14 px-6 text-sm sm:text-base border-gray-300 text-gray-500"
                      >
                        {isGoogleUser ? 'Google' : 'Protected'}
                      </Button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {isGoogleUser
                        ? 'Email is managed through your Google account and cannot be changed here.'
                        : 'Email is protected and cannot be changed here.'
                      }
                    </p>
                  </div>

                  {/* Password */}
                  <div className="sm:col-span-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cedo-blue/10">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                      </div>
                      <Label htmlFor="password" className="text-sm sm:text-base font-semibold text-gray-700">Password</Label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        id="password"
                        type="password"
                        value="••••••••"
                        className="flex-1 h-12 sm:h-14 text-sm sm:text-base bg-gray-50 border-gray-300 rounded-xl"
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="lg"
                        disabled
                        className="h-12 sm:h-14 px-6 text-sm sm:text-base border-gray-300 text-gray-500"
                      >
                        {isGoogleUser ? 'Google Auth' : 'Protected'}
                      </Button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {isGoogleUser
                        ? 'Authentication is handled through Google OAuth. No password needed.'
                        : 'Password is managed securely and cannot be changed here.'
                      }
                    </p>
                  </div>

                  {/* Organization Description */}
                  <div className="sm:col-span-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cedo-blue/10">
                        <Building className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                      </div>
                      <Label htmlFor="organization" className="text-sm sm:text-base font-semibold text-gray-700">Organization Description</Label>
                    </div>
                    {isEditingOrg ? (
                      <div className="space-y-4">
                        <Textarea
                          id="organization"
                          value={organizationDescription}
                          onChange={(e) => setOrganizationDescription(e.target.value)}
                          placeholder="Enter your organization description..."
                          className="min-h-[120px] resize-none h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl"
                          disabled={isSaving}
                        />
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            size="lg"
                            onClick={handleSaveOrganization}
                            disabled={isSaving}
                            className="bg-cedo-blue hover:bg-cedo-blue/90 text-white h-12 sm:h-14 text-sm sm:text-base rounded-xl"
                          >
                            {isSaving ? (
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            disabled={isSaving}
                            onClick={() => {
                              setIsEditingOrg(false);
                              setOrganizationDescription(currentUserData.organizationDescription || currentUserData.organization_description || '');
                            }}
                            className="h-12 sm:h-14 text-sm sm:text-base border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600 rounded-xl"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 flex-1 min-h-[120px]">
                          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                            {organizationDescription || 'No organization description provided'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setIsEditingOrg(true)}
                          className="h-12 sm:h-14 px-6 text-sm sm:text-base border-cedo-blue/30 text-cedo-blue hover:bg-cedo-blue hover:text-white rounded-xl"
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="sm:col-span-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cedo-blue/10">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                      </div>
                      <Label htmlFor="phone" className="text-sm sm:text-base font-semibold text-gray-700">Phone Number</Label>
                    </div>
                    {isEditingPhone ? (
                      <div className="space-y-4">
                        <Input
                          id="phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          placeholder="09..."
                          maxLength={11}
                          disabled={isSaving}
                          className="h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl"
                        />
                        {phoneError && (
                          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{phoneError}</p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            size="lg"
                            onClick={handleSavePhone}
                            disabled={!!phoneError || phoneNumber.length !== 11 || isSaving}
                            className="bg-cedo-blue hover:bg-cedo-blue/90 text-white h-12 sm:h-14 text-sm sm:text-base rounded-xl"
                          >
                            {isSaving ? (
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
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
                            className="h-12 sm:h-14 text-sm sm:text-base border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600 rounded-xl"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          id="phone"
                          value={phoneNumber || 'No phone number provided'}
                          className="flex-1 h-12 sm:h-14 text-sm sm:text-base bg-gray-50 border-gray-300 rounded-xl"
                          readOnly
                        />
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setIsEditingPhone(true)}
                          className="h-12 sm:h-14 px-6 text-sm sm:text-base border-cedo-blue/30 text-cedo-blue hover:bg-cedo-blue hover:text-white rounded-xl"
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Role */}
                  <div className="sm:col-span-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cedo-blue/10">
                        <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                      </div>
                      <Label htmlFor="role" className="text-sm sm:text-base font-semibold text-gray-700">Role</Label>
                    </div>
                    <div className="bg-cedo-blue/10 text-cedo-blue px-4 py-3 rounded-xl text-sm sm:text-base font-medium border border-cedo-blue/20">
                      {currentUserData.role || 'Student'}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      Your role determines your permissions within the system.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Account info and quick actions */}
          <div className="xl:col-span-1 space-y-6">
            {/* Account Status Card */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-gradient-to-br from-cedo-blue/5 to-cedo-blue/10 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cedo-blue/20">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                  </div>
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-gray-200/60">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">Active</div>
                    <div className="text-xs sm:text-sm text-gray-600">Account Status</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-gray-200/60">
                    <div className="text-lg sm:text-xl font-bold text-cedo-blue">{currentUserData.role || 'Student'}</div>
                    <div className="text-xs sm:text-sm text-gray-600">User Role</div>
                  </div>
                </div>
                {isGoogleUser && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="font-semibold text-blue-900">Google Account</span>
                    </div>
                    <p className="text-sm text-blue-700">Your account is linked to Google OAuth for secure authentication.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cedo-blue/20">
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full h-12 sm:h-14 text-sm sm:text-base border-cedo-blue/30 text-cedo-blue hover:bg-cedo-blue hover:text-white rounded-xl transition-all duration-300"
                >
                  <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Profile
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleClose}
                  className="w-full h-12 sm:h-14 text-sm sm:text-base border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600 rounded-xl transition-all duration-300"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Close Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}