/**
 * Enhanced StepOrganizer Component
 * Section 2 - Organizer & Contact with modern UI/UX
 * 
 * Key approaches: react-hook-form integration, organization autocomplete, enhanced UX
 */

"use client";

import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/utils/api';
import {
    AlertCircle,
    Building2,
    CheckCircle,
    Edit3,
    Lock,
    Mail,
    Phone,
    User,
    Users
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useEventForm } from '../contexts/EventFormContext';

export default function StepOrganizer({ methods, onNext, onPrevious, isLastStep }) {
    const { register, formState: { errors }, watch, setValue, trigger, reset } = useFormContext();
    const { eventUuid, getShortUuid, getFormAge } = useEventForm();
    const { user } = useAuth();
    const [organizationSuggestions, setOrganizationSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
    const [isLoadingUserData, setIsLoadingUserData] = useState(false);
    const [hasAutoFilled, setHasAutoFilled] = useState(false);
    const [contactPersonError, setContactPersonError] = useState('');
    const [contactPhoneError, setContactPhoneError] = useState('');

    const watchedValues = watch();

    // Validation functions
    const validateContactPerson = (name) => {
        // Remove extra spaces and trim
        const cleanName = name.trim().replace(/\s+/g, ' ');

        // Check if empty
        if (!cleanName) {
            setContactPersonError('Contact person name is required');
            return false;
        }

        // Check length (minimum 2 characters, maximum 50)
        if (cleanName.length < 2) {
            setContactPersonError('Name must be at least 2 characters long');
            return false;
        }

        if (cleanName.length > 50) {
            setContactPersonError('Name must be less than 50 characters');
            return false;
        }

        // Check for valid name pattern (letters, spaces, hyphens, apostrophes only)
        // Allows: John, Mary-Jane, O'Connor, Jean Paul, etc.
        const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
        if (!nameRegex.test(cleanName)) {
            setContactPersonError('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
            return false;
        }

        // Check for consecutive special characters
        if (/[\-']{2,}|\.{2,}/.test(cleanName)) {
            setContactPersonError('Name cannot have consecutive special characters');
            return false;
        }

        // Check if name starts or ends with special characters
        if (/^[\-']|[\-']$/.test(cleanName)) {
            setContactPersonError('Name cannot start or end with special characters');
            return false;
        }

        setContactPersonError('');
        return true;
    };

    const validateContactPhone = (phone) => {
        // Remove all non-digit characters for validation
        const digitsOnly = phone.replace(/\D/g, '');

        // Check if empty
        if (!phone.trim()) {
            setContactPhoneError(''); // Phone is optional, so no error for empty
            return true;
        }

        // Check if it starts with 09
        if (!digitsOnly.startsWith('09')) {
            setContactPhoneError('Phone number must start with 09');
            return false;
        }

        // Check if it's exactly 11 digits
        if (digitsOnly.length !== 11) {
            setContactPhoneError('Phone number must be exactly 11 digits (09XX-XXX-XXXX)');
            return false;
        }

        // Check for valid format: 09XX-XXX-XXXX
        const phoneRegex = /^09\d{2}-\d{3}-\d{4}$/;
        if (!phoneRegex.test(phone)) {
            setContactPhoneError('Invalid phone format. Use: 09XX-XXX-XXXX');
            return false;
        }

        setContactPhoneError('');
        return true;
    };

    const formatPhoneNumber = (value) => {
        // Remove all non-digit characters
        const digitsOnly = value.replace(/\D/g, '');

        // Limit to 11 digits
        const limitedDigits = digitsOnly.slice(0, 11);

        // Format as 09XX-XXX-XXXX
        if (limitedDigits.length <= 2) {
            return limitedDigits;
        } else if (limitedDigits.length <= 5) {
            return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2)}`;
        } else {
            return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2, 5)}-${limitedDigits.slice(5)}`;
        }
    };

    // Load user profile data and populate form fields (only once)
    useEffect(() => {
        const loadUserData = async () => {
            if (!user?.id || hasAutoFilled) return;

            setIsLoadingUserData(true);
            try {
                console.log('🏢 Organization: Loading user profile data for auto-fill...');
                const response = await apiRequest('/profile');

                if (response.success && response.user) {
                    const userData = response.user;
                    console.log('🏢 Organization: User data loaded:', userData);

                    // Auto-populate form fields with user data (only if fields are empty)
                    if (userData.organization) {
                        setValue('organizationName', userData.organization);
                        console.log('🏢 Organization: Auto-filled organization name:', userData.organization);
                    }

                    if (userData.name) {
                        setValue('contactPerson', userData.name);
                        console.log('🏢 Organization: Auto-filled contact person:', userData.name);
                    }

                    if (userData.email) {
                        setValue('contactEmail', userData.email);
                        console.log('🏢 Organization: Auto-filled contact email:', userData.email);
                    }

                    if (userData.phoneNumber) {
                        setValue('contactPhone', userData.phoneNumber);
                        console.log('🏢 Organization: Auto-filled contact phone:', userData.phoneNumber);
                    }

                    // Mark as auto-filled to prevent re-running
                    setHasAutoFilled(true);
                } else {
                    console.warn('🏢 Organization: No user data available for auto-fill');
                    setHasAutoFilled(true);
                }
            } catch (error) {
                console.error('🏢 Organization: Error loading user data:', error);
                setHasAutoFilled(true);
            } finally {
                setIsLoadingUserData(false);
            }
        };

        loadUserData();
    }, [user?.id, setValue, hasAutoFilled]);

    // Load all organizations on component mount
    useEffect(() => {
        const loadOrganizations = async () => {
            setIsLoadingOrganizations(true);
            try {
                const response = await apiRequest('/organizations');
                if (response.success) {
                    setAllOrganizations(response.organizations);
                } else {
                    console.error('Failed to load organizations:', response.error);
                }
            } catch (error) {
                console.error('Error loading organizations:', error);
            } finally {
                setIsLoadingOrganizations(false);
            }
        };

        loadOrganizations();
    }, []);

    const handleOrganizationChange = async (value) => {
        // Prevent changes if field is restricted
        if (watchedValues.organizationName && user?.organization) {
            return;
        }

        setValue('organizationName', value);

        if (value.length > 2) {
            // First try to filter from already loaded organizations
            const localFiltered = allOrganizations.filter(org =>
                org.name.toLowerCase().includes(value.toLowerCase())
            );

            if (localFiltered.length > 0) {
                setOrganizationSuggestions(localFiltered);
                setShowSuggestions(true);
            } else {
                // If no local matches, try API search
                try {
                    const response = await apiRequest(`/organizations/search?q=${encodeURIComponent(value)}`);
                    if (response.success) {
                        setOrganizationSuggestions(response.organizations);
                        setShowSuggestions(true);
                    } else {
                        console.error('Failed to fetch organizations:', response.error);
                        setOrganizationSuggestions([]);
                        setShowSuggestions(false);
                    }
                } catch (error) {
                    console.error('Error fetching organizations:', error);
                    setOrganizationSuggestions([]);
                    setShowSuggestions(false);
                }
            }
        } else {
            setShowSuggestions(false);
            setSelectedOrganization(null);
        }
    };

    const handleOrganizationSelect = (org) => {
        setValue('organizationName', org.name);
        setSelectedOrganization(org);
        setShowSuggestions(false);
    };

    const handleContactPersonChange = (value) => {
        // Sanitize input - remove numbers, special characters, emojis
        const sanitized = value.replace(/[0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?~`]/g, '').replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

        setValue('contactPerson', sanitized);
        validateContactPerson(sanitized);
    };

    const handleContactPhoneChange = (value) => {
        // Format phone number as user types
        const formatted = formatPhoneNumber(value);
        setValue('contactPhone', formatted);
        validateContactPhone(formatted);
    };

    // Function to clear auto-filled data
    const clearAutoFilledData = () => {
        setValue('contactPerson', '');
        setValue('contactPhone', '');
        setContactPersonError('');
        setContactPhoneError('');
        console.log('🏢 Organization: Cleared auto-filled contact data');
    };

    const isStepValid = () => {
        const hasRequiredFields = watchedValues.organizationName &&
            watchedValues.contactPerson &&
            watchedValues.contactEmail;

        const hasNoValidationErrors = !contactPersonError && !contactPhoneError;

        return hasRequiredFields && hasNoValidationErrors;
    };

    // ------- LocalStorage Auto-save & Restore -------
    const storageKey = useMemo(() => eventUuid ? `eventForm:${eventUuid}:organization` : null, [eventUuid]);

    // Load saved values on mount/uuid change
    useEffect(() => {
        if (!storageKey) return;
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return;
            const saved = JSON.parse(raw);
            const { values = {}, selectedOrg = null } = saved || {};

            if (values && Object.keys(values).length) {
                reset({
                    ...watch(),
                    ...values
                });
            }

            if (selectedOrg) {
                setSelectedOrganization(selectedOrg);
            }
        } catch (e) {
            console.warn('Failed to load saved Organization:', e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    // Debounced save on changes
    useEffect(() => {
        if (!storageKey) return;
        const timeout = setTimeout(() => {
            try {
                const valuesToSave = {
                    organizationName: watchedValues.organizationName || '',
                    contactPerson: watchedValues.contactPerson || '',
                    contactEmail: watchedValues.contactEmail || '',
                    contactPhone: watchedValues.contactPhone || '',
                    organizationRegistrationNo: watchedValues.organizationRegistrationNo || ''
                };
                const payload = {
                    values: valuesToSave,
                    selectedOrg: selectedOrganization
                };
                localStorage.setItem(storageKey, JSON.stringify(payload));
            } catch (e) {
                console.warn('Failed to save Organization:', e);
            }
        }, 500);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, watchedValues, selectedOrganization]);

    return (
        <div className="space-y-8">
            {/* Step Header */}
            <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Organizer & Contact</h2>
                <p className="text-gray-600">Provide organization and contact information</p>

                {/* UUID Display */}
                {eventUuid && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Event ID:</strong> <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">{getShortUuid()}</code>
                            <span className="ml-2 text-blue-600">• Created {getFormAge()}</span>
                        </p>
                    </div>
                )}

                {/* Auto-fill indicator */}
                {isLoadingUserData ? (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5"></div>
                            <div>
                                <h3 className="text-sm font-semibold text-blue-800">Loading your profile data...</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    We're fetching your organization and contact information to auto-fill this form.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (watchedValues.organizationName || watchedValues.contactPerson || watchedValues.contactEmail || watchedValues.contactPhone) && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-green-800">Auto-filled with your profile data</h3>
                                <p className="text-sm text-green-700 mt-1">
                                    We've automatically filled in your organization and contact information from your profile.
                                    <span className="block mt-1 text-blue-700">
                                        <strong>Note:</strong> Organization Name and Contact Email are locked to your profile data for security.
                                    </span>
                                    <span className="block mt-1 text-green-700">
                                        <strong>Editable:</strong> Contact Person and Contact Phone can be updated here.
                                    </span>
                                </p>
                                <button
                                    type="button"
                                    onClick={clearAutoFilledData}
                                    className="mt-2 px-3 py-1 text-xs bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                                >
                                    Clear Editable Fields
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
                {/* Organization Name */}
                <div className="space-y-2">
                    <label htmlFor="organizationName" className="block text-sm font-semibold text-gray-700">
                        Organization Name *
                    </label>
                    <div className="relative">
                        <input
                            id="organizationName"
                            type="text"
                            {...register('organizationName')}
                            onChange={(e) => handleOrganizationChange(e.target.value)}
                            placeholder={isLoadingUserData ? "Loading your data..." : isLoadingOrganizations ? "Loading organizations..." : "Enter organization name"}
                            disabled={isLoadingUserData || isLoadingOrganizations || (watchedValues.organizationName && user?.organization)}
                            readOnly={watchedValues.organizationName && user?.organization}
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.organizationName ? 'border-red-500' : 'border-gray-300'
                                } ${(isLoadingUserData || isLoadingOrganizations || (watchedValues.organizationName && user?.organization)) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
                        <Building2 className={`absolute left-3 top-3 h-5 w-5 ${isLoadingOrganizations ? 'text-gray-300' : 'text-gray-400'}`} />
                        {/* Lock icon for restricted field */}
                        {(watchedValues.organizationName && user?.organization) && (
                            <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                        )}

                        {/* Organization suggestions dropdown - only show if field is not restricted */}
                        {showSuggestions && organizationSuggestions.length > 0 && !(watchedValues.organizationName && user?.organization) && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {organizationSuggestions.map((org, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                        onClick={() => handleOrganizationSelect(org)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">{org.name}</div>
                                                <div className="text-sm text-gray-500">{org.type || org.organizationType}</div>
                                            </div>
                                            {org.verified && (
                                                <div className="flex items-center text-green-600 text-sm">
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Verified
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {errors.organizationName && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.organizationName.message}
                        </div>
                    )}

                    {/* Restricted field info */}
                    {(watchedValues.organizationName && user?.organization) && (
                        <div className="flex items-center text-blue-600 text-sm bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <Lock className="h-4 w-4 mr-2" />
                            <span>This field is locked to your profile organization. To change it, update your profile first.</span>
                        </div>
                    )}

                    {/* Selected Organization Info */}
                    {selectedOrganization && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        {selectedOrganization.name}
                                    </p>
                                    <p className="text-xs text-green-600">
                                        {selectedOrganization.type || selectedOrganization.organizationType}
                                        {selectedOrganization.verified && ' • Verified Organization'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                    <label htmlFor="contactPerson" className="block text-sm font-semibold text-gray-700">
                        Contact Person *
                    </label>
                    <div className="relative">
                        <input
                            id="contactPerson"
                            type="text"
                            {...register('contactPerson')}
                            onChange={(e) => handleContactPersonChange(e.target.value)}
                            placeholder={isLoadingUserData ? "Loading your name..." : "Full name of primary contact"}
                            disabled={isLoadingUserData}
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.contactPerson || contactPersonError ? 'border-red-500' : 'border-gray-300'
                                } ${isLoadingUserData ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        {/* Edit icon for editable field */}
                        {!isLoadingUserData && (
                            <Edit3 className="absolute right-3 top-3 h-4 w-4 text-blue-500" />
                        )}
                    </div>
                    {(errors.contactPerson || contactPersonError) && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.contactPerson?.message || contactPersonError}
                        </div>
                    )}

                    {/* Editable field info */}
                    {!contactPersonError && !errors.contactPerson && !isLoadingUserData && (
                        <div className="flex items-center text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-2">
                            <Edit3 className="h-4 w-4 mr-2" />
                            <span>This field is editable. You can update your contact person information here.</span>
                        </div>
                    )}
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                    <label htmlFor="contactEmail" className="block text-sm font-semibold text-gray-700">
                        Contact Email *
                    </label>
                    <div className="relative">
                        <input
                            id="contactEmail"
                            type="email"
                            {...register('contactEmail')}
                            placeholder={isLoadingUserData ? "Loading your email..." : "contact@organization.com"}
                            disabled={isLoadingUserData || (watchedValues.contactEmail && user?.email)}
                            readOnly={watchedValues.contactEmail && user?.email}
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                                } ${(isLoadingUserData || (watchedValues.contactEmail && user?.email)) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        {/* Lock icon for restricted field */}
                        {(watchedValues.contactEmail && user?.email) && (
                            <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                        )}
                    </div>
                    {errors.contactEmail && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.contactEmail.message}
                        </div>
                    )}

                    {/* Restricted field info */}
                    {(watchedValues.contactEmail && user?.email) && (
                        <div className="flex items-center text-blue-600 text-sm bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <Lock className="h-4 w-4 mr-2" />
                            <span>This field is locked to your profile email. To change it, update your profile first.</span>
                        </div>
                    )}
                </div>

                {/* Contact Phone */}
                <div className="space-y-2">
                    <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700">
                        Contact Phone
                    </label>
                    <div className="relative">
                        <input
                            id="contactPhone"
                            type="tel"
                            {...register('contactPhone')}
                            onChange={(e) => handleContactPhoneChange(e.target.value)}
                            placeholder={isLoadingUserData ? "Loading your phone..." : "09XX-XXX-XXXX"}
                            disabled={isLoadingUserData}
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.contactPhone || contactPhoneError ? 'border-red-500' : 'border-gray-300'
                                } ${isLoadingUserData ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        {/* Edit icon for editable field */}
                        {!isLoadingUserData && (
                            <Edit3 className="absolute right-3 top-3 h-4 w-4 text-blue-500" />
                        )}
                    </div>
                    {(errors.contactPhone || contactPhoneError) && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.contactPhone?.message || contactPhoneError}
                        </div>
                    )}

                    {/* Phone format helper */}
                    {!contactPhoneError && !errors.contactPhone && (
                        <div className="text-xs text-gray-500">
                            Format: 09XX-XXX-XXXX (Philippine mobile number)
                        </div>
                    )}

                    {/* Editable field info */}
                    {!contactPhoneError && !errors.contactPhone && !isLoadingUserData && (
                        <div className="flex items-center text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-2">
                            <Edit3 className="h-4 w-4 mr-2" />
                            <span>This field is editable. You can update your phone number here.</span>
                        </div>
                    )}

                </div>


            </div>

            {/* Step Validation Status */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {isStepValid() ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        )}
                        <div>
                            <h4 className="font-medium text-gray-900">Step 2 Progress</h4>
                            <p className="text-sm text-gray-600">
                                Complete all required fields to proceed
                            </p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${isStepValid()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {isStepValid() ? 'Complete' : 'Incomplete'}
                    </div>
                </div>
            </div>
        </div>
    );
}
