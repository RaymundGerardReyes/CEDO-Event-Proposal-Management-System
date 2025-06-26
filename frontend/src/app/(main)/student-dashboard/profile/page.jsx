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
import { motion } from "framer-motion";
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

      const token = getCachedToken();
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile?t=${Date.now()}`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-cache' // Ensure fresh data
        }
      );

      console.log(`👤 Profile: API response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('👤 Profile: Raw API response:', data);

        if (data.success && data.user) {
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
          throw new Error('Invalid profile response format');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch profile: ${response.status}`);
      }
    } catch (err) {
      console.error('👤 Profile: Error fetching profile data:', err);
      setError(err.message);
    } finally {
      if (showLoadingState) setIsRefreshing(false);
    }
  }, [user?.id, user?.user_metadata, user?.raw_user_meta_data, user?.app_metadata, user?.identities, getCachedToken, getOptimizedProfilePicture, getUserDisplayName, isGoogleAccount]);

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
      const token = getCachedToken();
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('👤 Profile: Saving organization description...', organizationDescription);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/organization`,
        {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({ organizationDescription })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save organization description: ${response.status}`);
      }

      const data = await response.json();

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
      console.error('👤 Profile: Failed to save organization description:', err);
      setError(err.message);
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
      const token = getCachedToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/phone`,
        {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({ phoneNumber })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Expected backend validation error (e.g., duplicate phone).
        // Set the error state and return, DON'T throw an exception.
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
      console.error('👤 Profile: A network or server error occurred:', err);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="z-10 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-cedo-blue/20 shadow-lg">
          <CardHeader className="relative pb-2">
            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-between pr-12">
              <CardTitle className="text-xl text-cedo-blue">Profile Credentials</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="ml-2"
                title="Refresh profile data"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {isRefreshing && (
              <p className="text-xs text-muted-foreground">Refreshing profile data...</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
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
                <Avatar className="h-24 w-24 border-2 border-cedo-blue/20 ring-2 ring-offset-2 ring-transparent group-hover:ring-cedo-blue/30 transition-all duration-200">
                  <AvatarImage
                    src={optimizedAvatar}
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-cedo-blue text-white text-xl font-semibold">
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
                <h3 className="font-semibold text-lg text-cedo-blue">
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

            <Separator />

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              </div>
              <div className="flex space-x-2">
                <Input
                  id="email"
                  value={userEmail || ''}
                  className="flex-1 bg-gray-50"
                  readOnly
                />
                <Button variant="outline" size="sm" disabled>
                  {isGoogleUser ? 'Google' : 'Protected'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
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
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              </div>
              <div className="flex space-x-2">
                <Input
                  id="password"
                  type="password"
                  value="••••••••"
                  className="flex-1 bg-gray-50"
                  readOnly
                />
                <Button variant="outline" size="sm" disabled>
                  {isGoogleUser ? 'Google Auth' : 'Protected'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isGoogleUser
                  ? 'Authentication is handled through Google OAuth. No password needed.'
                  : 'Password is managed securely and cannot be changed here.'
                }
              </p>
            </div>

            {/* Organization Description */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Building className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="organization" className="text-sm font-medium">Organization Description</Label>
              </div>
              {isEditingOrg ? (
                <div className="space-y-2">
                  <Textarea
                    id="organization"
                    value={organizationDescription}
                    onChange={(e) => setOrganizationDescription(e.target.value)}
                    placeholder="Enter your organization description..."
                    className="min-h-[80px] resize-none"
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
                      {isSaving ? 'Saving...' : 'Save'}
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
                <div className="flex space-x-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex-1 min-h-[80px]">
                    <p className="text-sm text-gray-700">
                      {organizationDescription || 'No organization description provided'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingOrg(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              </div>
              {isEditingPhone ? (
                <div className="space-y-2">
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="09..."
                    maxLength={11}
                    disabled={isSaving}
                  />
                  {phoneError && (
                    <p className="text-sm text-red-500">{phoneError}</p>
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
                      {isSaving ? 'Saving...' : 'Save'}
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
                    className="flex-1"
                    readOnly
                  />
                  <Button variant="outline" size="sm" onClick={() => setIsEditingPhone(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <div className="flex items-center">
                <UserCircle className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="role" className="text-sm font-medium">Role</Label>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-cedo-blue/10 text-cedo-blue px-3 py-2 rounded-md text-sm font-medium flex-1">
                  {currentUserData.role || 'Student'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Your role determines your permissions within the system.</p>
            </div>

            <div className="flex justify-end pt-4">
              <Button className="bg-cedo-blue hover:bg-cedo-blue/90 text-white" onClick={handleClose}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
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