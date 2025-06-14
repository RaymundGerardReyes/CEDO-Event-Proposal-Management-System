"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/student/ui/avatar";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { Separator } from "@/components/dashboard/student/ui/separator";
import { Textarea } from "@/components/dashboard/student/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import { AlertCircle, Building, Camera, Lock, Mail, Phone, RefreshCw, Save, UserCircle, X } from "lucide-react";
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
          setProfileData(data.user);

          // Update editable fields with latest data
          setOrganizationDescription(data.user.organizationDescription || data.user.organization_description || '');

          // Handle different phone number property names
          const phone = data.user.phoneNumber ||
            data.user.phone_number ||
            data.user.contactPhone ||
            data.user.contact_phone || '';
          setPhoneNumber(phone);

          console.log(`👤 Profile: Successfully loaded profile for ${data.user.name}`, {
            orgDesc: data.user.organizationDescription,
            phone: phone,
            availableKeys: Object.keys(data.user)
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
  }, [user?.id, getCachedToken]);

  // Initial data load and sync with auth context
  useEffect(() => {
    if (isInitialized && !authLoading && user?.id) {
      console.log("👤 Profile: User authenticated, fetching latest profile data...");

      // Initialize with auth context data first
      if (user) {
        setProfileData(user);
        setOrganizationDescription(user.organizationDescription || user.organization_description || '');

        const phone = user.phoneNumber ||
          user.phone_number ||
          user.contactPhone ||
          user.contact_phone || '';
        setPhoneNumber(phone);
      }

      // Then fetch latest from database
      fetchLatestProfileData();
    }
  }, [isInitialized, authLoading, user?.id, fetchLatestProfileData]);

  // Auto-refresh profile data every 30 seconds for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      console.log("👤 Profile: Auto-refreshing profile data...");
      fetchLatestProfileData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, fetchLatestProfileData]);

  const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const phoneRegex = /^09\d{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return 'Phone number must be exactly 11 digits starting with 09 (e.g., 09123456789)';
    }
    return '';
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const digitOnly = value.replace(/\D/g, '').slice(0, 11);
    setPhoneNumber(digitOnly);

    if (digitOnly.length > 0) {
      const error = validatePhoneNumber(digitOnly);
      setPhoneError(error);
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
    const error = validatePhoneNumber(phoneNumber);
    if (error) {
      setPhoneError(error);
      return;
    }

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

      console.log('👤 Profile: Saving phone number...', phoneNumber);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/phone`,
        {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({ phoneNumber })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save phone number: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
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
      } else {
        throw new Error(data.error || 'Failed to save phone number');
      }
    } catch (err) {
      console.error('👤 Profile: Failed to save phone number:', err);
      setPhoneError(err.message);
    } finally {
      setIsSaving(false);
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

            <div className="flex flex-col items-center justify-center space-y-3">
              <Avatar className="h-24 w-24 border-2 border-cedo-blue/20">
                <AvatarImage src={currentUserData.avatar || "/placeholder.svg"} alt={currentUserData.name} />
                <AvatarFallback className="bg-cedo-blue text-white text-xl">
                  {currentUserData.name?.split(" ").map((n) => n[0]).join("") || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="mt-2">
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>
            <Separator />

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              </div>
              <div className="flex space-x-2">
                <Input id="email" value={userEmail || ''} className="flex-1" readOnly />
                <Button variant="outline" size="sm">Change</Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Lock className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              </div>
              <div className="flex space-x-2">
                <Input id="password" type="password" value="••••••••" className="flex-1" readOnly />
                <Button variant="outline" size="sm">Change</Button>
              </div>
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
                        setOrganizationDescription(currentUserData.organizationDescription || '');
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
                  <div className="space-y-1">
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="09123456789"
                      className={`flex-1 ${phoneError ? 'border-red-500' : ''}`}
                      maxLength={11}
                      disabled={isSaving}
                    />
                    {phoneError && (
                      <div className="flex items-center text-red-500 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {phoneError}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Format: 11 digits starting with 09 (e.g., 09123456789)
                    </p>
                  </div>
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
                  {currentUserData.role || 'N/A'}
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