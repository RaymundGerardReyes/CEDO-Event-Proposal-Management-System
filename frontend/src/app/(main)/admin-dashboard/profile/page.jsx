// frontend/src/app/(main)/admin-dashboard/profile/page.jsx

"use client" // Keep this if the whole page structure relies on client interactions

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// src/app/(main)/admin-dashboard/profile/page.jsx
import { PageHeader } from "@/components/dashboard/admin/page-header";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card";
import { Separator } from "@/components/dashboard/admin/ui/separator";
import {
  AvatarGroup,
  AvatarProfile,
  AvatarStatus
} from "@/components/ui/avatar-origin";
import { useAuth } from "@/contexts/auth-context";
import {
  Building,
  Edit,
  Mail,
  Phone,
  Settings,
  Shield,
  UserCircle
} from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// Loading component for the profile content
function ProfileContentLoading() {
  return (
    <div className="space-y-6">
      {/* Profile Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="h-32 w-32 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto md:mx-0"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto md:mx-0"></div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mx-auto md:mx-0"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Profile section component that uses useSearchParams
function ProfileSectionContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'overview';
  const { user, isLoading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Mock admin team data for avatar group demonstration
  const adminTeam = [
    { id: 1, name: "John Admin", role: "Head Admin", status: "online" },
    { id: 2, name: "Jane Manager", role: "Manager", status: "away" },
    { id: 3, name: "Bob Supervisor", role: "Supervisor", status: "online" },
    { id: 4, name: "Alice Coordinator", role: "Coordinator", status: "offline" },
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        ...user,
        fullName: user.name || user.fullName || 'Admin User',
        role: user.role || 'Administrator',
        department: user.department || 'Administration',
        email: user.email || user.contactEmail || 'admin@cedo.edu.ph',
        phone: user.phone || user.phoneNumber || '+63 912 345 6789',
        joinDate: user.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        permissions: user.permissions || ['all_access', 'user_management', 'system_admin']
      });
    }
  }, [user]);

  const handleEditProfile = () => {
    console.log("Edit profile clicked");
  };

  const handleEditAvatar = () => {
    console.log("Edit avatar clicked");
  };

  if (authLoading || !profileData) {
    return <ProfileContentLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header with Origin UI Avatar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Enhanced Profile Avatar with Status */}
            <div className="relative">
              <AvatarProfile
                src={profileData.profilePicture || profileData.image}
                name={profileData.fullName}
                role={profileData.role}
                size="4xl"
                showEdit={true}
                onEdit={handleEditAvatar}
                className="ring-4 ring-primary/20"
              />
              {/* Online Status Indicator */}
              <div className="absolute -bottom-2 -right-2">
                <AvatarStatus
                  size="sm"
                  status={isOnline ? "online" : "offline"}
                  className="ring-2 ring-background"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {profileData.fullName}
                </h1>
                <div className="flex flex-col md:flex-row gap-2 items-center md:items-start">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    {profileData.role}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {profileData.department}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Managing CEDO Partnership System since {new Date(profileData.joinDate).getFullYear()}
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <Button onClick={handleEditProfile} className="gap-2">
                  <Edit size={16} />
                  Edit Profile
                </Button>
                <Button variant="outline" className="gap-2">
                  <Settings size={16} />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail size={20} />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-muted-foreground" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{profileData.phone}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Building size={16} className="text-muted-foreground" />
              <div>
                <p className="font-medium">Department</p>
                <p className="text-sm text-muted-foreground">{profileData.department}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Admin Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profileData.permissions?.map((permission, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {permission.replace('_', ' ')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Team Section with Avatar Group */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle size={20} />
            Admin Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <AvatarGroup max={4} size="md">
                {adminTeam.map((member) => (
                  <AvatarStatus
                    key={member.id}
                    alt={member.name}
                    status={member.status}
                    className="ring-2 ring-background"
                  />
                ))}
              </AvatarGroup>
              <div>
                <p className="font-medium">{adminTeam.length} Team Members</p>
                <p className="text-sm text-muted-foreground">
                  {adminTeam.filter(m => m.status === 'online').length} currently online
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminTeam.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <AvatarStatus
                    alt={member.name}
                    status={member.status}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section-specific content */}
      {section === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Security configuration and two-factor authentication settings would appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// The default export must be a client component and wrap everything in Suspense
export default function AdminProfilePage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="Admin Profile"
        subheading="Manage your administrator profile and team settings"
      />

      <Suspense fallback={<ProfileContentLoading />}>
        <ProfileSectionContent />
      </Suspense>
    </div>
  );
}