"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { InfoIcon, LockIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getFieldClasses } from "../../validation";

/**
 * Shared Organization Section Component
 * Collects organization information for both school and community events
 */
export const OrganizationSection = ({
    formData = {},
    handleInputChange,
    onNext,
    onPrevious,
    disabled = false,
    validationErrors = {},
    eventType = 'school-based', // 'school-based' or 'community-based'
    showOrganizationType = true, // Whether to show organization type selection
}) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [userProfileData, setUserProfileData] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    // 🔧 CRITICAL FIX: Ensure formData is always an object
    const safeFormData = formData || {};

    // 🔧 DEBUG: Log formData status and eventType prop
    useEffect(() => {
        console.log('🔍 DEBUG OrganizationSection:');
        console.log('  - eventType prop received:', eventType);
        console.log('  - formData isDefined:', !!formData);
        console.log('  - formData keys:', formData ? Object.keys(formData) : []);
        console.log('  - organizationName:', safeFormData?.organizationName);
    }, [formData, safeFormData, eventType]);

    // Load user profile data
    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user?.id) return;

            setIsLoadingProfile(true);
            try {
                console.log('🔍 Loading user profile data for user ID:', user.id);

                // Get token from cookies (primary method used by auth context)
                let token = null;
                const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("cedo_token="));
                if (cookieValue) {
                    token = cookieValue.split("=")[1];
                }

                // Fallback to localStorage/sessionStorage if cookie not found
                if (!token) {
                    token = localStorage.getItem('cedo_token') || sessionStorage.getItem('cedo_token') ||
                        localStorage.getItem('authToken') || sessionStorage.getItem('authToken') ||
                        localStorage.getItem('token');
                }

                if (!token) {
                    console.error('❌ No authentication token found');
                    return;
                }

                console.log('🔑 Found authentication token from:', cookieValue ? 'cookies' : 'localStorage/sessionStorage');

                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch profile: ${response.status}`);
                }

                const result = await response.json();
                console.log('🔍 Raw API response:', result);

                if (result.success && result.user) {
                    const profileData = {
                        id: result.user.id,
                        organizationName: result.user.organization || result.user.organizationName || '',
                        contactName: result.user.name || result.user.contactName || '',
                        contactEmail: result.user.email || '',
                        organizationDescription: result.user.organizationDescription || '',
                        contactPhone: result.user.phoneNumber || result.user.phone_number || ''
                    };

                    console.log('✅ Complete user profile data loaded from API:', profileData);
                    console.log('🔍 Profile fields check:');
                    console.log('  - organizationDescription:', profileData.organizationDescription);
                    console.log('  - contactPhone:', profileData.contactPhone);
                    console.log('  - organizationName:', profileData.organizationName);

                    setUserProfileData(profileData);
                }
            } catch (error) {
                console.error('❌ Error loading user profile:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadUserProfile();
    }, [user?.id]);

    // Pre-fill form with user profile data
    useEffect(() => {
        if (userProfileData && !safeFormData.organizationName) {
            console.log('🔐 Pre-filling form with user profile data:', userProfileData);

            // Pre-fill organization fields
            const fieldsToUpdate = {
                organizationName: userProfileData.organizationName,
                contactName: userProfileData.contactName,
                contactEmail: userProfileData.contactEmail,
                organizationDescription: userProfileData.organizationDescription,
                contactPhone: userProfileData.contactPhone
            };

            // Update form data
            Object.entries(fieldsToUpdate).forEach(([key, value]) => {
                if (value && !safeFormData[key]) {
                    handleInputChange({
                        target: { name: key, value }
                    });
                }
            });

            console.log('✅ Form pre-filled with user profile and existing data');
        }
    }, [userProfileData, safeFormData, handleInputChange]);

    const renderFieldError = useCallback((fieldName) => {
        if (!validationErrors[fieldName]) return null;
        return (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {validationErrors[fieldName]}
            </p>
        );
    }, [validationErrors]);

    const handleSubmit = useCallback(async () => {
        // Validate required fields
        const requiredFields = {
            organizationName: safeFormData.organizationName,
            contactName: safeFormData.contactName,
            contactEmail: safeFormData.contactEmail
        };

        const missingFields = Object.entries(requiredFields).filter(([key, value]) => {
            return !value || (typeof value === 'string' && value.trim() === '');
        });

        if (missingFields.length > 0) {
            const fieldNameMap = {
                organizationName: 'Organization Name',
                contactName: 'Contact Name',
                contactEmail: 'Contact Email'
            };

            const readableFieldNames = missingFields.map(([key]) => fieldNameMap[key] || key).join(', ');
            toast({
                title: "Missing Required Fields",
                description: `Please fill in: ${readableFieldNames}`,
                variant: "destructive",
            });
            return;
        }

        // Proceed to next section
        if (onNext) {
            onNext();
        }
    }, [safeFormData, onNext, toast]);

    // Autofill handler
    const handleAutoFill = () => {
        // Use user profile data if available, otherwise use sample data
        const autoFillData = userProfileData ? {
            organizationName: userProfileData.organizationName || "Your Organization",
            organizationDescription: userProfileData.organizationDescription || "Organization description",
            contactName: userProfileData.contactName || user?.name || "Your Name",
            contactEmail: userProfileData.contactEmail || user?.email || "your.email@example.com",
            contactPhone: userProfileData.contactPhone || "09123456789"
        } : {
            organizationName: "ISDA Carmen",
            organizationDescription: "A student organization focused on science and technology outreach.",
            contactName: "Juan Dela Cruz",
            contactEmail: "contact@isdacarmen.edu.ph",
            contactPhone: "09123456789"
        };

        Object.entries(autoFillData).forEach(([key, value]) => {
            handleInputChange({ target: { name: key, value } });
        });

        toast({
            title: "Auto-Fill Complete",
            description: userProfileData
                ? "Organization fields have been populated with your profile data."
                : "Organization fields have been populated with sample data.",
            variant: "default",
        });
    };

    return (
        <Card className="w-full max-w-3xl mx-auto shadow-lg border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-xl font-bold text-cedo-blue dark:text-cedo-gold">
                            Organization Information
                        </CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">
                            Provide details about your organization for the {eventType === 'community-based' ? 'community' : 'school'}-based event.
                        </CardDescription>
                    </div>
                    {disabled && (
                        <div className="flex items-center text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-3 py-1.5 rounded-md font-medium self-start sm:self-center">
                            <LockIcon className="h-4 w-4 mr-2" />
                            <span>Read-only Mode</span>
                        </div>
                    )}
                    {/* Auto-fill button */}
                    {!disabled && (
                        <Button type="button" variant="outline" onClick={handleAutoFill} className="ml-2">
                            Auto Fill from Profile
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {isLoadingProfile && (
                    <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200">
                        <InfoIcon className="h-5 w-5" />
                        <AlertTitle className="font-semibold">Loading Profile</AlertTitle>
                        <AlertDescription className="text-sm">
                            Loading your organization information...
                        </AlertDescription>
                    </Alert>
                )}

                {/* Organization Type (if enabled) */}
                {showOrganizationType && (
                    <div className="space-y-2">
                        <Label className="font-semibold text-gray-800 dark:text-gray-200">
                            Event Type
                        </Label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {eventType === 'community-based' ? 'Community-Based Event' : 'School-Based Event'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Organization Name */}
                <div className="space-y-2">
                    <Label htmlFor="organizationName" className="font-semibold text-gray-800 dark:text-gray-200">
                        Organization Name <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                        id="organizationName"
                        name="organizationName"
                        value={safeFormData.organizationName || ""}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your organization name"
                        className={cn(
                            "mt-1",
                            getFieldClasses("organizationName", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")
                        )}
                    />
                    {renderFieldError("organizationName")}
                </div>

                {/* Contact Name */}
                <div className="space-y-2">
                    <Label htmlFor="contactName" className="font-semibold text-gray-800 dark:text-gray-200">
                        Contact Name <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                        id="contactName"
                        name="contactName"
                        value={safeFormData.contactName || ""}
                        onChange={handleInputChange}
                        required
                        className={cn(
                            "mt-1",
                            getFieldClasses("contactName", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")
                        )}
                    />
                    {renderFieldError("contactName")}
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="font-semibold text-gray-800 dark:text-gray-200">
                        Contact Email <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                        id="contactEmail"
                        name="contactEmail"
                        value={safeFormData.contactEmail || ""}
                        onChange={handleInputChange}
                        required
                        className={cn(
                            "mt-1",
                            getFieldClasses("contactEmail", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")
                        )}
                    />
                    {renderFieldError("contactEmail")}
                </div>

                {/* Organization Description */}
                <div className="space-y-2">
                    <Label htmlFor="organizationDescription" className="font-semibold text-gray-800 dark:text-gray-200">
                        Organization Description
                    </Label>
                    <Textarea
                        id="organizationDescription"
                        name="organizationDescription"
                        value={safeFormData.organizationDescription || ""}
                        onChange={handleInputChange}
                        className={cn(
                            "mt-1",
                            getFieldClasses("organizationDescription", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")
                        )}
                        rows={3}
                    />
                    {renderFieldError("organizationDescription")}
                </div>

                {/* Contact Phone */}
                <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="font-semibold text-gray-800 dark:text-gray-200">
                        Contact Phone
                    </Label>
                    <Input
                        id="contactPhone"
                        name="contactPhone"
                        value={safeFormData.contactPhone || ""}
                        onChange={handleInputChange}
                        className={cn(
                            "mt-1",
                            getFieldClasses("contactPhone", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")
                        )}
                    />
                    {renderFieldError("contactPhone")}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex gap-2">
                    {onPrevious && (
                        <Button type="button" variant="outline" onClick={onPrevious} disabled={disabled}>
                            Previous
                        </Button>
                    )}
                    {onNext && (
                        <Button type="button" onClick={handleSubmit} disabled={disabled}>
                            Next
                        </Button>
                    )}
                </div>
                <div>
                    {/* Removed onWithdraw prop */}
                </div>
            </CardFooter>
        </Card>
    );
};

export default OrganizationSection; 