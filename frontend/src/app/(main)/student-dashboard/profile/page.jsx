"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/student/ui/avatar";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { Separator } from "@/components/dashboard/student/ui/separator";
import { Textarea } from "@/components/dashboard/student/ui/textarea";
import { motion } from "framer-motion";
import { AlertCircle, Building, Camera, Lock, Mail, Phone, Save, UserCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
            <div className="h-6 w-3/4 bg-gray-300 rounded animate-pulse"></div> {/* Placeholder for Title */}
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-24 w-24 rounded-full bg-gray-300 animate-pulse"></div> {/* Placeholder for Avatar */}
              <div className="h-8 w-32 bg-gray-300 rounded animate-pulse mt-2"></div> {/* Placeholder for Button */}
            </div>
            <Separator />
            {/* Simplified placeholders for other fields */}
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="flex justify-end pt-4">
              <div className="h-10 w-20 bg-gray-300 rounded animate-pulse"></div> {/* Placeholder for Done Button */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for editable fields
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get token from cookie (primary) or localStorage (fallback)
        let token = null;
        if (typeof document !== 'undefined') {
          const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
          if (cookieValue) {
            token = cookieValue.split('=')[1];
          } else {
            token = localStorage.getItem('cedo_token') || localStorage.getItem('token');
          }
        }
        // Only send Authorization header if token is a likely JWT
        const isLikelyJWT = token && typeof token === 'string' && token.split('.').length === 3;
        const headers = {
          'Content-Type': 'application/json',
        };
        if (isLikelyJWT) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            setOrganizationDescription(data.user.organizationDescription || '');
            setPhoneNumber(data.user.contactPhone || '');
          } else {
            throw new Error('Invalid response format');
          }
        } else {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const validatePhoneNumber = (phone) => {
    // Remove any spaces or dashes
    const cleanPhone = phone.replace(/[\s-]/g, '');

    // Check if it's exactly 11 digits and starts with '09'
    const phoneRegex = /^09\d{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return 'Phone number must be exactly 11 digits starting with 09 (e.g., 09123456789)';
    }
    return '';
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 11 characters
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
    try {
      // Get token from cookie (primary) or localStorage (fallback)
      let token = null;
      if (typeof document !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
          token = cookieValue.split('=')[1];
        } else {
          token = localStorage.getItem('cedo_token') || localStorage.getItem('token');
        }
      }
      const isLikelyJWT = token && typeof token === 'string' && token.split('.').length === 3;
      const headers = {
        'Content-Type': 'application/json',
      };
      if (isLikelyJWT) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/organization`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ organizationDescription })
      });

      if (!response.ok) {
        throw new Error(`Failed to save organization description: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setIsEditingOrg(false);
        // Update user object with new data
        setUser(prev => ({
          ...prev,
          organizationDescription: organizationDescription
        }));
        console.log('Organization description saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save organization description');
      }
    } catch (err) {
      console.error('Failed to save organization description:', err);
      setError(err.message);
    }
  };

  const handleSavePhone = async () => {
    const error = validatePhoneNumber(phoneNumber);
    if (error) {
      setPhoneError(error);
      return;
    }

    try {
      // Get token from cookie (primary) or localStorage (fallback)
      let token = null;
      if (typeof document !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
          token = cookieValue.split('=')[1];
        } else {
          token = localStorage.getItem('cedo_token') || localStorage.getItem('token');
        }
      }
      const isLikelyJWT = token && typeof token === 'string' && token.split('.').length === 3;
      const headers = {
        'Content-Type': 'application/json',
      };
      if (isLikelyJWT) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/phone`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        throw new Error(`Failed to save phone number: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setIsEditingPhone(false);
        setPhoneError('');
        // Update user object with new data
        setUser(prev => ({
          ...prev,
          phoneNumber: phoneNumber
        }));
        console.log('Phone number saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save phone number');
      }
    } catch (err) {
      console.error('Failed to save phone number:', err);
      setPhoneError(err.message);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <p className="z-10 text-white">Loading profile data...</p> {/* Simple loading text */}
    </div>
  );
  if (error) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <p className="z-10 text-red-500 bg-white p-4 rounded">Error: {error}</p>
    </div>
  );
  if (!user) return null; // Should not happen if loading and error are handled

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
            <CardTitle className="text-xl text-cedo-blue">Profile Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex flex-col items-center justify-center space-y-3">
              <Avatar className="h-24 w-24 border-2 border-cedo-blue/20">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-cedo-blue text-white text-xl">
                  {user.name?.split(" ").map((n) => n[0]).join("") || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="mt-2">
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              </div>
              <div className="flex space-x-2">
                <Input id="email" value={user.email || ''} className="flex-1" readOnly />
                <Button variant="outline" size="sm">Change</Button>
              </div>
            </div>
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
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleSaveOrganization}
                      className="bg-cedo-blue hover:bg-cedo-blue/90 text-white"
                    >
                      <Save className="mr-2 h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingOrg(false);
                        setOrganizationDescription(user.organizationDescription || '');
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
                      disabled={!!phoneError || phoneNumber.length !== 11}
                      className="bg-cedo-blue hover:bg-cedo-blue/90 text-white"
                    >
                      <Save className="mr-2 h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingPhone(false);
                        setPhoneNumber(user.phoneNumber || '');
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
            <div className="space-y-2">
              <div className="flex items-center">
                <UserCircle className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="role" className="text-sm font-medium">Role</Label>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-cedo-blue/10 text-cedo-blue px-3 py-2 rounded-md text-sm font-medium flex-1">
                  {user.role || 'N/A'}
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
  // The original `useEffect` for `setMounted(true)` is no longer needed here
  // as Suspense handles the client-side rendering aspect.
  return (
    <Suspense fallback={<ProfileLoadingSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}