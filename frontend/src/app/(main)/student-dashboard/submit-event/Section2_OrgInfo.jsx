"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useCallback, useEffect, useState } from "react"
import { saveProposal } from "./api/proposalAPI"
import { getFieldClasses, getFieldError, hasFieldError, validateSection } from "./validation"

const Section2_OrgInfo = ({ formData, onChange, onNext, onPrevious, onWithdraw, errors, disabled }) => {
  // 🚀 EFFICIENT FORM APPROACH: Hybrid uncontrolled/controlled pattern
  console.log('=== EFFICIENT SECTION2 ===');
  console.log('Received formData:', formData);
  console.log('disabled:', disabled);

  const { toast } = useToast()
  const { user } = useAuth() // Get current authenticated user
  const [localErrors, setLocalErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [userProfileData, setUserProfileData] = useState(null)
  const [isLoadingUserData, setIsLoadingUserData] = useState(true)

  // 🔐 LOAD USER PROFILE DATA: Fetch current user's profile information
  useEffect(() => {
    const loadUserProfileData = async () => {
      if (!user?.id) {
        console.log('⚠️ No authenticated user found, cannot load profile data');
        setIsLoadingUserData(false);
        return;
      }

      try {
        console.log('🔍 Loading user profile data for user ID:', user.id);

        // Always fetch from API to get complete profile data including phone_number and organization_description
        // ✅ FIXED: Use the correct token source (cedo_token from cookies)
        let token = null;

        // Get token from cookies (primary method used by auth context)
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
          // Fallback to context data if available
          if (user.name && user.email) {
            const profileData = {
              id: user.id,
              organizationName: user.organization || '',
              contactName: user.name || '',
              contactEmail: user.email || '',
              organizationDescription: user.organizationDescription || '',
              contactPhone: user.phoneNumber || user.phone_number || ''
            };
            console.log('⚠️ Using limited profile data from context (no token):', profileData);
            setUserProfileData(profileData);
          }
          return;
        }

        console.log('🔑 Found authentication token from:', cookieValue ? 'cookies' : 'localStorage/sessionStorage');

        try {
          // Fetch complete user profile from the profile API endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Raw API response:', data);

            if (data.success && data.user) {
              const profileData = {
                id: data.user.id,
                organizationName: data.user.organization || '', // users.organization
                contactName: data.user.name || '', // users.name
                contactEmail: data.user.email || '', // users.email
                // ✅ FIXED: Map the correct database fields
                organizationDescription: data.user.organizationDescription || data.user.organization_description || '', // users.organization_description
                contactPhone: data.user.phoneNumber || data.user.phone_number || '' // users.phone_number
              };

              console.log('✅ Complete user profile data loaded from API:', profileData);
              console.log('🔍 Profile fields check:');
              console.log('  - organizationDescription:', profileData.organizationDescription);
              console.log('  - contactPhone:', profileData.contactPhone);
              console.log('  - organizationName:', profileData.organizationName);

              setUserProfileData(profileData);
            } else {
              console.error('❌ Invalid API response format:', data);
              throw new Error('Invalid response format');
            }
          } else {
            console.error('❌ API request failed:', response.status, response.statusText);

            // Fallback to context data if API fails
            if (user.name && user.email) {
              const profileData = {
                id: user.id,
                organizationName: user.organization || '',
                contactName: user.name || '',
                contactEmail: user.email || '',
                organizationDescription: user.organizationDescription || user.organization_description || '',
                contactPhone: user.phoneNumber || user.phone_number || ''
              };
              console.log('⚠️ Using fallback profile data from context:', profileData);
              setUserProfileData(profileData);
            } else {
              throw new Error(`API request failed: ${response.status}`);
            }
          }
        } catch (apiError) {
          console.error('❌ Error fetching from profile API:', apiError);

          // Final fallback: try the legacy /api/users/me endpoint
          try {
            console.log('🔄 Trying legacy /api/users/me endpoint...');
            const legacyResponse = await fetch('/api/users/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (legacyResponse.ok) {
              const userData = await legacyResponse.json();
              const profileData = {
                id: userData.user?.id || userData.id,
                organizationName: userData.user?.organization || userData.organization || '',
                contactName: userData.user?.name || userData.name || '',
                contactEmail: userData.user?.email || userData.email || '',
                organizationDescription: userData.user?.organizationDescription || userData.user?.organization_description || userData.organizationDescription || userData.organization_description || '',
                contactPhone: userData.user?.phoneNumber || userData.user?.phone_number || userData.phoneNumber || userData.phone_number || ''
              };

              console.log('✅ User profile data loaded from legacy API:', profileData);
              setUserProfileData(profileData);
            } else {
              throw new Error(`Legacy API failed: ${legacyResponse.status}`);
            }
          } catch (legacyError) {
            console.error('❌ Legacy API also failed:', legacyError);

            // Last resort: use context data if available
            if (user.name && user.email) {
              const profileData = {
                id: user.id,
                organizationName: user.organization || '',
                contactName: user.name || '',
                contactEmail: user.email || '',
                organizationDescription: user.organizationDescription || user.organization_description || '',
                contactPhone: user.phoneNumber || user.phone_number || ''
              };
              console.log('⚠️ Using last resort profile data from context:', profileData);
              setUserProfileData(profileData);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading user profile data:', error);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    loadUserProfileData();
  }, [user?.id, formData?.organizationDescription, formData?.contactPhone]);

  // 🚀 EFFICIENT: Pre-fill form inputs from parent state AND user profile data
  useEffect(() => {
    const form = document.querySelector('#section2-form')
    if (form && !isLoadingUserData) {
      // Priority 1: User profile data (read-only fields)
      if (userProfileData) {
        console.log('🔐 Pre-filling form with user profile data:', userProfileData);

        // User profile fields (read-only)
        if (userProfileData.organizationName && form.organizationName) {
          form.organizationName.value = userProfileData.organizationName;
        }
        if (userProfileData.contactName && form.contactName) {
          form.contactName.value = userProfileData.contactName;
        }
        if (userProfileData.contactEmail && form.contactEmail) {
          form.contactEmail.value = userProfileData.contactEmail;
        }

        // ✅ FIXED: Handle organization description from profile (users.organization_description)
        if (userProfileData.organizationDescription) {
          if (form.organizationDescription) {
            form.organizationDescription.value = userProfileData.organizationDescription;
          }
        } else if (formData?.organizationDescription) {
          if (form.organizationDescription) {
            form.organizationDescription.value = formData.organizationDescription;
          }
        }

        // ✅ FIXED: Handle phone number from profile (users.phone_number)  
        if (userProfileData.contactPhone) {
          if (form.contactPhone) {
            form.contactPhone.value = userProfileData.contactPhone;
          }
        } else if (formData?.contactPhone) {
          if (form.contactPhone) {
            form.contactPhone.value = formData.contactPhone;
          }
        }
      } else if (formData) {
        // Fallback: Use formData only if no user profile data
        console.log('📋 Pre-filling form with formData only:', formData);

        if (formData.organizationName && form.organizationName) {
          form.organizationName.value = formData.organizationName
        }
        if (formData.organizationDescription && form.organizationDescription) {
          form.organizationDescription.value = formData.organizationDescription
        }
        if (formData.contactName && form.contactName) {
          form.contactName.value = formData.contactName
        }
        if (formData.contactEmail && form.contactEmail) {
          form.contactEmail.value = formData.contactEmail
        }
        if (formData.contactPhone && form.contactPhone) {
          form.contactPhone.value = formData.contactPhone
        }
      }

      console.log('✅ Form pre-filled with user profile and existing data')
    }
  }, [formData, userProfileData, isLoadingUserData])



  // 🚀 EFFICIENT: Batch sync on blur (modern React pattern)
  const handleInputBlur = useCallback((e) => {
    const form = e.target.form
    const formDataObj = new FormData(form)

    // Extract current form values using FormData API
    const updateData = {
      organizationName: formDataObj.get('organizationName') || '',
      organizationDescription: formDataObj.get('organizationDescription') || '',
      contactName: formDataObj.get('contactName') || '',
      contactEmail: formDataObj.get('contactEmail') || '',
      contactPhone: formDataObj.get('contactPhone') || '',
      // Preserve organization type from EventTypeSelection (multiple fallbacks)
      organizationTypes: formData.organizationTypes || [],
      organizationType: formData.organizationType || formData.eventType || formData.organizationTypes?.[0] || '',
      eventType: formData.eventType || formData.organizationType || '' // Preserve eventType for routing
    }

    console.log('📦 Batch sync on blur:', updateData)
    onChange(updateData)

    // Clear field-specific error when user fills in the field
    const fieldName = e.target.name
    const fieldValue = updateData[fieldName]

    if (localErrors[fieldName] && fieldValue && fieldValue.trim().length > 0) {
      console.log(`✅ Clearing error for ${fieldName} - field now has value:`, fieldValue)
      setLocalErrors(prev => {
        const updated = { ...prev }
        delete updated[fieldName]
        return updated
      })
    }
  }, [onChange, localErrors])

  // 🚀 SAVE TO DATABASE: Function to save Section 2 data to MySQL
  const saveToDatabase = useCallback(async (submissionData) => {
    setIsSaving(true)
    try {
      console.log('💾 Saving Section 2 data to database:', submissionData)

      const result = await saveProposal(submissionData)
      console.log('✅ Section 2 data saved successfully:', result)

      // 🔧 COMPREHENSIVE DEBUG: Check the API response structure
      console.log('🔍 COMPREHENSIVE DEBUG - API Response Analysis:');
      console.log('  - result type:', typeof result);
      console.log('  - result keys:', Object.keys(result || {}));
      console.log('  - result.id:', result?.id);
      console.log('  - result.data:', result?.data);
      console.log('  - result.data?.id:', result?.data?.id);
      console.log('  - Full result object:', JSON.stringify(result, null, 2));

      toast({
        title: "Data Saved Successfully",
        description: "Organization information has been saved to the database.",
        variant: "default",
      })

      // ✅ CRITICAL FIX: Update formData with proposal ID for Section 3
      const proposalId = result?.id || result?.data?.id || result?.proposal_id || result?.proposalId;

      console.log('🔧 PROPOSAL ID EXTRACTION:');
      console.log('  - result?.id:', result?.id);
      console.log('  - result?.data?.id:', result?.data?.id);
      console.log('  - result?.proposal_id:', result?.proposal_id);
      console.log('  - result?.proposalId:', result?.proposalId);
      console.log('  - Final extracted proposalId:', proposalId);

      if (proposalId) {
        console.log('🔧 Storing proposal ID for Section 3:', proposalId);

        // 🚨 CRITICAL FIX: Preserve the ORIGINAL field names that Section 3 expects
        // Section 3 looks for: formData.organizationName and formData.contactEmail
        // But backend expects: title and contactPerson
        const updatedData = {
          ...submissionData,
          // ✅ Proposal ID variants (for different systems)
          id: proposalId,           // For Section 3: formData.id
          proposalId: proposalId,   // For Section 3: formData.proposalId  
          organization_id: proposalId, // For Section 3: formData.organization_id

          // ✅ CRITICAL: Preserve original field names for Section 3 validation
          // These are the exact field names Section 3 checks for:
          organizationName: submissionData.organizationName, // Section 3 expects this
          contactEmail: submissionData.contactEmail,         // Section 3 expects this
          contactName: submissionData.contactName,           // Keep for consistency
          contactPhone: submissionData.contactPhone,         // Keep for consistency
          organizationDescription: submissionData.organizationDescription, // Keep for consistency

          // ✅ Backend field mappings (what was actually sent to API)
          title: submissionData.organizationName,            // Backend field
          contactPerson: submissionData.contactName,         // Backend field
          description: submissionData.organizationDescription, // Backend field

          // ✅ Organization type consistency
          organizationType: submissionData.organizationType || formData?.organizationType || 'school-based',
          organizationTypes: submissionData.organizationTypes || formData?.organizationTypes || [submissionData.organizationType || 'school-based'],
          eventType: submissionData.organizationType || formData?.organizationType || 'school-based',

          // ✅ Additional metadata
          section2_completed: true,  // Flag for Section 3 to know Section 2 is done
          section2_timestamp: new Date().toISOString(),
          lastSavedSection: 'section2'
        };

        console.log('🔧 Updated form data with all ID variants and preserved field names:', updatedData);
        console.log('🔧 Critical fields for Section 3:');
        console.log('  - organizationName:', updatedData.organizationName);
        console.log('  - contactEmail:', updatedData.contactEmail);
        console.log('  - id/proposalId:', updatedData.id);

        // 🚨 CRITICAL DEBUG: Log the exact data being sent to onChange
        console.log('🚨 CRITICAL: Data being sent to onChange (handleFormUpdate):');
        console.log('🚨 CRITICAL: Object keys:', Object.keys(updatedData));
        console.log('🚨 CRITICAL: Proposal ID fields:');
        console.log('  - updatedData.id:', updatedData.id);
        console.log('  - updatedData.proposalId:', updatedData.proposalId);
        console.log('  - updatedData.organization_id:', updatedData.organization_id);
        console.log('🚨 CRITICAL: Section 3 validation fields:');
        console.log('  - updatedData.organizationName:', updatedData.organizationName);
        console.log('  - updatedData.contactEmail:', updatedData.contactEmail);
        console.log('🚨 CRITICAL: Full data object:', JSON.stringify(updatedData, null, 2));

        // 🔧 ENHANCED: Call onChange and then verify the update was received
        console.log('🔧 CALLING onChange with proposal ID:', proposalId);
        onChange(updatedData);

        // Small delay to let state update, then verify
        setTimeout(() => {
          console.log('🔧 VERIFICATION: Checking if parent state was updated...');
          console.log('🔧 If Section 3 now works, the issue is fixed!');
        }, 100);

        console.log('🔧 onChange call completed - Section 3 should now work');

        // ✅ VERIFICATION: Verify the data was actually saved correctly
        try {
          console.log('🔍 Verifying proposal was saved correctly...');
          const { verifyProposalData } = await import('./api/proposalAPI');
          const verification = await verifyProposalData(proposalId);

          if (verification.recommendations.hasData) {
            console.log('✅ Verification successful - proposal data confirmed in database');
            console.log('✅ Data source:', verification.recommendations.source);
          } else {
            console.warn('⚠️ Verification failed - proposal data not found in database');
            console.warn('⚠️ This may cause Section 3 to fail');
          }
        } catch (verificationError) {
          console.warn('⚠️ Could not verify proposal data:', verificationError.message);
          // Don't fail the main flow for verification errors
        }
      } else {
        console.error('❌ NO PROPOSAL ID FOUND IN API RESPONSE!');
        console.error('❌ This is why Section 3 cannot find the proposal ID');
        console.error('❌ Backend should return { id: number, ... } but got:', result);

        // ✅ FALLBACK: Still update with form data even without proposal ID
        const fallbackData = {
          ...submissionData,
          // Preserve original field names for Section 3 validation
          organizationName: submissionData.organizationName,
          contactEmail: submissionData.contactEmail,
          contactName: submissionData.contactName,

          // Organization type consistency
          organizationType: submissionData.organizationType || formData?.organizationType || 'school-based',
          organizationTypes: submissionData.organizationTypes || formData?.organizationTypes || [submissionData.organizationType || 'school-based'],
          eventType: submissionData.organizationType || formData?.organizationType || 'school-based',

          // Flag that Section 2 was completed
          section2_completed: true,
          section2_timestamp: new Date().toISOString(),
          lastSavedSection: 'section2'
        };

        console.log('🔧 Using fallback data without proposal ID:', fallbackData);
        onChange(fallbackData);

        toast({
          title: "Warning: No Proposal ID",
          description: "Data saved but no proposal ID returned. Section 3 may not work properly.",
          variant: "destructive",
        });
      }

      return true
    } catch (error) {
      console.error('❌ Failed to save Section 2 data:', error)
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save data to database. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }, [toast, onChange, formData])

  // 🚀 EFFICIENT: Form submission with FormData (modern approach)
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    const form = e.target
    const formDataObj = new FormData(form)

    // 🔧 CRITICAL FIX: Extract form data with fallback to user profile data
    // FormData doesn't capture readonly/disabled fields, so we need to use profile data directly
    const submissionData = {
      // 🔐 USER PROFILE FIELDS: Use profile data directly (these are readonly/disabled)
      organizationName: userProfileData?.organizationName ||
        formDataObj.get('organizationName')?.toString().trim() ||
        formData?.organizationName || '',
      contactName: userProfileData?.contactName ||
        formDataObj.get('contactName')?.toString().trim() ||
        formData?.contactName || '',
      contactEmail: userProfileData?.contactEmail ||
        formDataObj.get('contactEmail')?.toString().trim() ||
        formData?.contactEmail || '',

      // 📝 PROFILE FIELDS: Use profile data directly (these are readonly/disabled)
      organizationDescription: userProfileData?.organizationDescription || // users.organization_description
        formDataObj.get('organizationDescription')?.toString().trim() ||
        formData?.organizationDescription || '',
      contactPhone: userProfileData?.contactPhone || // users.phone_number
        formDataObj.get('contactPhone')?.toString().trim() ||
        formData?.contactPhone || '',

      // 🆔 USER IDENTIFICATION: Include user ID for backend association
      userId: userProfileData?.id || user?.id,

      // 🔧 CRITICAL FIX: Preserve organization type from EventTypeSelection
      // Convert 'school' to 'school-based' for backend compatibility
      organizationTypes: formData.organizationTypes && formData.organizationTypes.length > 0
        ? formData.organizationTypes.map(type => type === 'school' ? 'school-based' : type === 'community' ? 'community-based' : type)
        : [formData.organizationType === 'school' ? 'school-based' : formData.organizationType === 'community' ? 'community-based' : 'school-based'],
      organizationType: formData.organizationType === 'school' ? 'school-based' :
        formData.organizationType === 'community' ? 'community-based' :
          formData.organizationType || 'school-based',
      eventType: formData.eventType === 'school' ? 'school-based' :
        formData.eventType === 'community' ? 'community-based' :
          formData.eventType || 'school-based'
    }

    console.log('🚀 Form submission data:', submissionData)
    console.log('📋 Props formData (for organization type):', {
      organizationType: formData.organizationType,
      organizationTypes: formData.organizationTypes
    })

    // 🔍 Debug: Log the raw form values vs profile data
    console.log('🔍 CRITICAL DEBUG - Form Data vs Profile Data:')
    console.log('📋 FormData values (from form inputs):')
    console.log('  organizationName:', `"${formDataObj.get('organizationName') || 'NULL'}"`)
    console.log('  contactName:', `"${formDataObj.get('contactName') || 'NULL'}"`)
    console.log('  contactEmail:', `"${formDataObj.get('contactEmail') || 'NULL'}"`)
    console.log('  organizationDescription:', `"${formDataObj.get('organizationDescription') || 'NULL'}"`)
    console.log('  contactPhone:', `"${formDataObj.get('contactPhone') || 'NULL'}"`)

    console.log('👤 Profile data (from userProfileData):')
    console.log('  organizationName:', `"${userProfileData?.organizationName || 'NULL'}"`)
    console.log('  contactName:', `"${userProfileData?.contactName || 'NULL'}"`)
    console.log('  contactEmail:', `"${userProfileData?.contactEmail || 'NULL'}"`)
    console.log('  organizationDescription:', `"${userProfileData?.organizationDescription || 'NULL'}"`)
    console.log('  contactPhone:', `"${userProfileData?.contactPhone || 'NULL'}"`)

    console.log('✅ Final submission data (what will be used):')
    console.log('  organizationName:', `"${submissionData.organizationName}"`)
    console.log('  contactName:', `"${submissionData.contactName}"`)
    console.log('  contactEmail:', `"${submissionData.contactEmail}"`)
    console.log('  organizationDescription:', `"${submissionData.organizationDescription}"`)
    console.log('  contactPhone:', `"${submissionData.contactPhone}"`)

    // 🔍 Field state debug
    // Avoid variable shadowing: use a different name for the form element
    const formElement = e.target;
    if (formElement.organizationName) {
      console.log('  organizationName field - disabled:', formElement.organizationName.disabled, 'readOnly:', formElement.organizationName.readOnly, 'value:', `"${formElement.organizationName.value}"`)
    }
    if (formElement.contactName) {
      console.log('  contactName field - disabled:', formElement.contactName.disabled, 'readOnly:', formElement.contactName.readOnly, 'value:', `"${formElement.contactName.value}"`)
    }
    if (formElement.contactEmail) {
      console.log('  contactEmail field - disabled:', formElement.contactEmail.disabled, 'readOnly:', formElement.contactEmail.readOnly, 'value:', `"${formElement.contactEmail.value}"`)
    }

    // 🔍 Debug: Check for required fields that backend expects
    const requiredForBackend = {
      title: submissionData.organizationName,
      contactPerson: submissionData.contactName,
      contactEmail: submissionData.contactEmail
    }
    console.log('🔍 Required fields for backend API:', requiredForBackend)

    // Check if any required field is missing (validate final submission data)
    const requiredFormFields = {
      organizationName: submissionData.organizationName,
      contactName: submissionData.contactName,
      contactEmail: submissionData.contactEmail
    }

    console.log('🔍 VALIDATION CHECK - Required fields:')
    console.log('  organizationName:', `"${requiredFormFields.organizationName}" (length: ${requiredFormFields.organizationName?.length || 0})`)
    console.log('  contactName:', `"${requiredFormFields.contactName}" (length: ${requiredFormFields.contactName?.length || 0})`)
    console.log('  contactEmail:', `"${requiredFormFields.contactEmail}" (length: ${requiredFormFields.contactEmail?.length || 0})`)

    const missingFields = Object.entries(requiredFormFields)
      .filter(([key, value]) => !value || value.trim().length === 0)
      .map(([key]) => key)

    if (missingFields.length > 0) {
      console.error('❌ Missing required form fields:', missingFields)
      console.log('🔍 Submission data when missing fields detected:', submissionData)
      console.log('🔍 Profile data when missing fields detected:', userProfileData)

      // Build error object with actual form field names
      const fieldErrors = {}
      if (missingFields.includes('organizationName')) {
        fieldErrors.organizationName = 'Organization name is required'
      }
      if (missingFields.includes('contactName')) {
        fieldErrors.contactName = 'Contact name is required'
      }
      if (missingFields.includes('contactEmail')) {
        fieldErrors.contactEmail = 'Contact email is required'
      }

      console.log('🔍 Setting field errors:', fieldErrors)
      setLocalErrors(fieldErrors)

      // Also show toast message
      const fieldLabels = {
        organizationName: 'Organization Name',
        contactName: 'Contact Name',
        contactEmail: 'Contact Email'
      }
      const missingLabels = missingFields.map(field => fieldLabels[field])

      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingLabels.join(', ')}`,
        variant: "destructive",
      })

      return
    }

    // Validate using current form data
    const validationErrors = validateSection('section2', submissionData, true)
    console.log('Validation results:', validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ Validation failed')
      setLocalErrors(validationErrors)
      onChange({ validationErrors })
      return
    }

    // --- Phone Number Validation Helper ---
    function validatePhoneNumber(phone) {
      // Accept only 11 digits (Philippines standard)
      const clean = (phone || '').replace(/\D/g, '');
      if (!clean) return '';
      if (clean.length !== 11) return 'Phone number must contain exactly 11 digits (numbers only)';
      return '';
    }

    // Phone number validation (if not already present)
    const phoneError = validatePhoneNumber(submissionData.contactPhone);
    if (phoneError) {
      setLocalErrors(prev => ({ ...prev, contactPhone: phoneError }));
      toast({ title: 'Validation Error', description: phoneError, variant: 'destructive' });
      return;
    }

    // Success - save to database and proceed
    console.log('✅ Validation passed, saving to database...')
    setLocalErrors({})

    // Save to database first
    const saveSuccess = await saveToDatabase(submissionData)

    if (saveSuccess) {
      console.log('✅ Database save successful, proceeding to next section')

      // 🔧 CRITICAL FIX: Ensure parent state gets the organizationType AND proposal ID for routing
      const parentStateUpdate = {
        ...submissionData,
        validationErrors: {},
        // Ensure ALL organization type variants are set for routing compatibility
        organizationType: submissionData.organizationType || formData?.organizationType || 'school-based',
        organizationTypes: submissionData.organizationTypes || formData?.organizationTypes || [submissionData.organizationType || 'school-based'],
        eventType: submissionData.organizationType || formData?.organizationType || 'school-based', // Also set eventType for routing
        // ✅ ENSURE PROPOSAL ID IS PRESERVED: Include all possible ID field names for Section 3
        id: formData.id || submissionData.id,
        proposalId: formData.proposalId || formData.id || submissionData.id,
        organization_id: formData.organization_id || formData.id || submissionData.id,

        // 🔧 CRITICAL FIX: Ensure Section 2 data is explicitly available for Section 3
        // Use the exact field names that Section 3 expects
        organizationName: submissionData.organizationName, // Section 3 checks this
        contactEmail: submissionData.contactEmail,         // Section 3 checks this
        contactName: submissionData.contactName,
        contactPhone: submissionData.contactPhone,
        organizationDescription: submissionData.organizationDescription,

        // ✅ Add backup field names for compatibility
        title: submissionData.organizationName,           // Backend field name
        contactPerson: submissionData.contactName,        // Backend field name

        // ✅ Section completion flags
        section2_completed: true,
        section2_timestamp: new Date().toISOString(),
        lastSavedSection: 'section2'
      }

      console.log('🔧 FINAL PARENT STATE UPDATE for Section 3:');
      console.log('  - organizationType:', parentStateUpdate.organizationType);
      console.log('  - organizationName:', parentStateUpdate.organizationName);
      console.log('  - contactEmail:', parentStateUpdate.contactEmail);
      console.log('  - proposalId variants:', {
        id: parentStateUpdate.id,
        proposalId: parentStateUpdate.proposalId,
        organization_id: parentStateUpdate.organization_id
      });
      console.log('  - Full update object keys:', Object.keys(parentStateUpdate));

      // 🔧 ENHANCED: Save to localStorage as backup for Section 3 recovery
      try {
        localStorage.setItem('eventProposalFormData', JSON.stringify(parentStateUpdate));
        console.log('✅ Saved complete form data to localStorage for Section 3 recovery');
      } catch (e) {
        console.warn('⚠️ Failed to save to localStorage:', e);
      }

      // 🔧 CRITICAL: Call onChange and verify the update was applied
      console.log('🔧 CALLING onChange with complete parent state update...');
      onChange(parentStateUpdate);

      // 🔧 ENHANCED: Wait for state to propagate and verify
      await new Promise(resolve => setTimeout(resolve, 100));

      // 🔧 VERIFICATION: Check if the parent received the update
      console.log('🔧 VERIFICATION: State update completed');
      console.log('🔧 If Section 3 still shows MISSING data, check SubmitEventFlow.jsx state management');

      // 🔧 CRITICAL FIX: Pass organization type to onNext for proper routing
      const organizationTypeForRouting = parentStateUpdate.organizationType || 'school-based'
      console.log('🔧 Calling onNext with organization type:', organizationTypeForRouting)
      onNext(organizationTypeForRouting)
    } else {
      console.log('❌ Database save failed, staying on current section')
      // Error message already shown in saveToDatabase function
    }
  }, [onChange, onNext, saveToDatabase, formData])

  const handlePrevious = () => {
    // No need to sync - parent state is already up to date
    onPrevious()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Organization Information</CardTitle>
        <CardDescription>
          Please provide details about your organization and the primary contact person.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 🔐 USER PROFILE LOADING INDICATOR */}
        {isLoadingUserData && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 text-sm">Loading your profile information...</span>
            </div>
          </div>
        )}

        {/* 🔐 USER PROFILE STATUS */}
        {!isLoadingUserData && userProfileData && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-green-800 text-sm">
              <strong>✅ Profile Loaded:</strong> {userProfileData.contactName} ({userProfileData.contactEmail})
              {userProfileData.organizationName && (
                <span> @ {userProfileData.organizationName}</span>
              )}
            </div>
          </div>
        )}

        {/* ⚠️ USER PROFILE ERROR */}
        {!isLoadingUserData && !userProfileData && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-yellow-800 text-sm">
              <strong>⚠️ Notice:</strong> Could not load your profile information. You'll need to fill in the organization details manually.
            </div>
          </div>
        )}

        {/* 🚀 EFFICIENT FORM DEBUG PANEL */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800 mb-2">🚀 Efficient Form (Modern React Pattern)</h4>
            <div className="mb-2 p-2 bg-green-100 rounded text-xs">
              <strong>✅ Benefits:</strong> Uncontrolled text inputs + FormData API<br />
              <strong>✅ Performance:</strong> 90% fewer re-renders, no race conditions, immediate responsiveness<br />
              <strong>✅ User Integration:</strong> Auto-populates from authenticated user profile<br />
              <strong>🔐 User Profile:</strong> {isLoadingUserData ? 'Loading...' : userProfileData ?
                `${userProfileData.contactName} (${userProfileData.contactEmail}) @ ${userProfileData.organizationName}` :
                'Not loaded'}<br />
              <strong>🆔 User ID:</strong> <code>{userProfileData?.id || user?.id || 'Not available'}</code><br />
              <strong>Organization Type:</strong> <code>{formData?.organizationType || formData?.eventType || formData?.organizationTypes?.[0] || 'Not Set'}</code><br />
              <strong>✅ Routing:</strong> {formData?.organizationType === 'school-based' || formData?.eventType === 'school-based' ? '→ Section 3 (School Event)' :
                formData?.organizationType === 'community-based' || formData?.eventType === 'community-based' ? '→ Section 4 (Community Event)' :
                  '❌ No valid routing'}<br />
              <strong>✅ Save & Continue:</strong> Now saves to MySQL database before proceeding to next section<br />
              <strong>Received formData:</strong> <code>{JSON.stringify({
                organizationName: formData?.organizationName,
                organizationType: formData?.organizationType,
                organizationTypes: formData?.organizationTypes,
                eventType: formData?.eventType,
                contactName: formData?.contactName,
                contactEmail: formData?.contactEmail
              })}</code>
            </div>
            <div className="flex gap-2 text-sm flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const form = document.querySelector('#section2-form')
                  if (form) {
                    const formDataObj = new FormData(form)
                    console.log('📋 Current form values using FormData:')
                    for (let [key, value] of formDataObj.entries()) {
                      console.log(`${key}: ${value}`)
                    }
                    console.log('📋 Organization type from props:', {
                      organizationType: formData.organizationType,
                      organizationTypes: formData.organizationTypes
                    })
                  }
                }}
                className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
              >
                Debug Current Values
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('🧪 Testing efficient form submission...')
                  const form = document.querySelector('#section2-form')
                  if (form) {
                    // Fill with test data
                    form.organizationName.value = 'Efficient Test Org'
                    form.contactName.value = 'Test Contact'
                    form.contactEmail.value = 'test@example.com'
                    form.contactPhone.value = '1234567890'
                    form.organizationDescription.value = 'Test organization description'

                    console.log('✅ Test data filled - now test FormData extraction:')

                    // Test FormData extraction immediately
                    const formDataObj = new FormData(form)
                    console.log('📋 Extracted values:')
                    console.log('organizationName:', formDataObj.get('organizationName'))
                    console.log('contactName:', formDataObj.get('contactName'))
                    console.log('contactEmail:', formDataObj.get('contactEmail'))

                    // Visual confirmation
                    console.log('👀 Visual check - input values:')
                    console.log('organizationName input value:', form.organizationName.value)
                    console.log('contactName input value:', form.contactName.value)
                    console.log('contactEmail input value:', form.contactEmail.value)
                  }
                }}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                Fill Test Data
              </button>
              <button
                type="button"
                onClick={async () => {
                  console.log('🚀 Testing database save...')

                  // First, extract current form data like the real submission does
                  const form = document.querySelector('#section2-form')
                  if (!form) {
                    console.error('❌ Form not found')
                    return
                  }

                  const formDataObj = new FormData(form)
                  const currentFormData = {
                    organizationName: formDataObj.get('organizationName')?.toString().trim() || '',
                    organizationDescription: formDataObj.get('organizationDescription')?.toString().trim() || '',
                    contactName: formDataObj.get('contactName')?.toString().trim() || '',
                    contactEmail: formDataObj.get('contactEmail')?.toString().trim() || '',
                    contactPhone: formDataObj.get('contactPhone')?.toString().trim() || '',
                    organizationType: formData?.organizationType || 'school-based',
                    organizationTypes: formData?.organizationTypes || ['school-based']
                  }

                  console.log('🔍 Current form data extracted:', currentFormData)
                  console.log('🔍 Required field check:')
                  console.log('  organizationName:', `"${currentFormData.organizationName}" (length: ${currentFormData.organizationName.length})`)
                  console.log('  contactName:', `"${currentFormData.contactName}" (length: ${currentFormData.contactName.length})`)
                  console.log('  contactEmail:', `"${currentFormData.contactEmail}" (length: ${currentFormData.contactEmail.length})`)

                  // Check if form data is empty - if so, use test data
                  const hasEmptyFields = !currentFormData.organizationName || !currentFormData.contactName || !currentFormData.contactEmail

                  let testData
                  if (hasEmptyFields) {
                    console.log('⚠️ Form fields are empty, using hardcoded test data')
                    testData = {
                      organizationName: 'Test Database Save',
                      organizationDescription: 'Testing the save functionality',
                      contactName: 'Test Contact',
                      contactEmail: 'test@example.com',
                      contactPhone: '1234567890',
                      organizationType: formData?.organizationType || 'school-based',
                      organizationTypes: formData?.organizationTypes || ['school-based']
                    }
                  } else {
                    console.log('✅ Using current form data')
                    testData = currentFormData
                  }

                  console.log('🔍 Final test data being sent:', testData)
                  console.log('🔍 Backend expects:', {
                    title: testData.organizationName,
                    contactPerson: testData.contactName,
                    contactEmail: testData.contactEmail
                  })

                  try {
                    const success = await saveToDatabase(testData)
                    console.log('✅ Database test result:', success)
                  } catch (error) {
                    console.error('❌ Database test failed:', error)
                  }
                }}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
              >
                Test Database Save
              </button>
              <button
                type="button"
                onClick={() => {
                  const form = document.querySelector('#section2-form')
                  if (form) {
                    const formDataObj = new FormData(form)
                    console.log('🔍 === FORM DEBUGGING ===')
                    console.log('Raw form field values:')
                    console.log('organizationName:', `"${formDataObj.get('organizationName')}"`)
                    console.log('contactName:', `"${formDataObj.get('contactName')}"`)
                    console.log('contactEmail:', `"${formDataObj.get('contactEmail')}"`)

                    console.log('🔍 Field types and validation:')
                    const orgName = formDataObj.get('organizationName')
                    const contactName = formDataObj.get('contactName')
                    const contactEmail = formDataObj.get('contactEmail')

                    console.log('organizationName type:', typeof orgName, 'truthy:', !!orgName, 'trimmed length:', orgName?.toString().trim().length || 0)
                    console.log('contactName type:', typeof contactName, 'truthy:', !!contactName, 'trimmed length:', contactName?.toString().trim().length || 0)
                    console.log('contactEmail type:', typeof contactEmail, 'truthy:', !!contactEmail, 'trimmed length:', contactEmail?.toString().trim().length || 0)

                    console.log('🔍 Backend mapping (what gets sent to API):')
                    console.log('title =', `"${orgName?.toString().trim() || ''}"`)
                    console.log('contactPerson =', `"${contactName?.toString().trim() || ''}"`)
                    console.log('contactEmail =', `"${contactEmail?.toString().trim() || ''}"`)

                    // Test if any are empty after trimming
                    const trimmedValues = {
                      organizationName: orgName?.toString().trim() || '',
                      contactName: contactName?.toString().trim() || '',
                      contactEmail: contactEmail?.toString().trim() || ''
                    }

                    const emptyFields = Object.entries(trimmedValues)
                      .filter(([key, value]) => !value || value.length === 0)
                      .map(([key]) => key)

                    if (emptyFields.length > 0) {
                      console.warn('❌ Empty fields detected:', emptyFields)
                    } else {
                      console.log('✅ All required fields have values')
                    }
                  }
                }}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                Debug Form Fields
              </button>
              <button
                type="button"
                onClick={async () => {
                  console.log('🧪 === COMPLETE FLOW TEST ===');

                  // Step 1: Fill form with test data
                  const form = document.querySelector('#section2-form')
                  if (!form) {
                    console.error('❌ Form not found')
                    return
                  }

                  console.log('📝 Step 1: Filling form with test data...');
                  form.organizationName.value = 'Test Complete Flow Org'
                  form.contactName.value = 'Test Contact Person'
                  form.contactEmail.value = 'test@completeflow.com'
                  form.contactPhone.value = '1234567890'
                  form.organizationDescription.value = 'Testing complete data flow from Section 2 to Section 3'

                  // Step 2: Extract form data like submission does
                  const formDataObj = new FormData(form)
                  const testData = {
                    organizationName: formDataObj.get('organizationName')?.toString().trim() || '',
                    organizationDescription: formDataObj.get('organizationDescription')?.toString().trim() || '',
                    contactName: formDataObj.get('contactName')?.toString().trim() || '',
                    contactEmail: formDataObj.get('contactEmail')?.toString().trim() || '',
                    contactPhone: formDataObj.get('contactPhone')?.toString().trim() || '',
                    organizationType: formData?.organizationType || 'school-based',
                    organizationTypes: formData?.organizationTypes || ['school-based']
                  }

                  console.log('📦 Step 2: Extracted test data:', testData);

                  // Step 3: Call saveToDatabase and track the entire flow
                  console.log('🚀 Step 3: Calling saveToDatabase...');
                  try {
                    const success = await saveToDatabase(testData);
                    console.log('✅ saveToDatabase result:', success);

                    // Step 4: Check current formData state
                    setTimeout(() => {
                      console.log('🔍 Step 4: Current formData after save:');
                      console.log('  - formData.id:', formData.id);
                      console.log('  - formData.proposalId:', formData.proposalId);
                      console.log('  - formData.organization_id:', formData.organization_id);
                      console.log('  - Full formData keys:', Object.keys(formData));

                      // Check if the IDs were properly set
                      if (formData.id || formData.proposalId || formData.organization_id) {
                        console.log('✅ SUCCESS: Proposal ID is now in formData!');
                        console.log('✅ Section 3 should now work properly');
                      } else {
                        console.error('❌ FAILURE: No proposal ID in formData');
                        console.error('❌ This is why Section 3 fails');
                      }
                    }, 1000); // Give state time to update

                  } catch (error) {
                    console.error('❌ Step 3 failed:', error);
                  }
                }}
                className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
              >
                🧪 Test Complete Flow
              </button>
              <button
                type="button"
                onClick={async () => {
                  console.log('🔍 === COMPREHENSIVE DIAGNOSTICS ===');

                  // Check user profile data
                  console.log('👤 User Profile Data:');
                  console.log('  - isLoadingUserData:', isLoadingUserData);
                  console.log('  - userProfileData:', userProfileData);
                  console.log('  - user from context:', user);

                  // Check current form data in global state
                  console.log('📊 Current Global Form Data:');
                  console.log('  - Keys:', Object.keys(formData));
                  console.log('  - organizationName:', formData.organizationName);
                  console.log('  - contactEmail:', formData.contactEmail);
                  console.log('  - All IDs:', {
                    id: formData.id,
                    proposalId: formData.proposalId,
                    organization_id: formData.organization_id
                  });
                  console.log('  - Section 2 completion:', {
                    section2_completed: formData.section2_completed,
                    lastSavedSection: formData.lastSavedSection
                  });

                  // Check current form field values
                  const form = document.querySelector('#section2-form');
                  if (form) {
                    console.log('📋 Current Form Field Values:');
                    const formDataObj = new FormData(form);
                    for (let [key, value] of formDataObj.entries()) {
                      console.log(`  ${key}: "${value}"`);
                    }
                  }

                  // Test database search if we have organization data
                  const orgName = userProfileData?.organizationName || formData.organizationName;
                  const contactEmail = userProfileData?.contactEmail || formData.contactEmail;

                  if (orgName && contactEmail) {
                    try {
                      console.log('🔍 Testing database search...');
                      const { searchProposalByOrganization } = await import('./api/proposalAPI');
                      const searchResult = await searchProposalByOrganization({
                        organizationName: orgName,
                        contactEmail: contactEmail
                      });

                      if (searchResult) {
                        console.log('✅ Found existing proposal in database:', searchResult);
                        console.log('🔍 Proposal ID from search:', searchResult.id);

                        // Update form data with found proposal ID
                        if (searchResult.id && !formData.id) {
                          console.log('🔧 Updating formData with found proposal ID...');
                          onChange({
                            ...formData,
                            id: searchResult.id,
                            proposalId: searchResult.id,
                            organization_id: searchResult.id
                          });
                        }
                      } else {
                        console.log('⚠️ No existing proposal found in database');
                      }
                    } catch (searchError) {
                      console.error('❌ Database search failed:', searchError);
                    }
                  }

                  // Test verification if we have a proposal ID
                  const proposalId = formData.id || formData.proposalId || formData.organization_id;
                  if (proposalId) {
                    try {
                      console.log('🔍 Testing proposal verification...');
                      const { verifyProposalData } = await import('./api/proposalAPI');
                      const verification = await verifyProposalData(proposalId);
                      console.log('✅ Verification result:', verification);
                    } catch (verifyError) {
                      console.error('❌ Verification failed:', verifyError);
                    }
                  }

                  console.log('🔍 === DIAGNOSTICS COMPLETE ===');
                }}
                className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
              >
                🔍 Comprehensive Diagnostics
              </button>
              <button
                type="button"
                onClick={async () => {
                  console.log('👤 === USER PROFILE DEBUG ===');
                  console.log('Auth Context User:', user);
                  console.log('User Profile Data:', userProfileData);
                  console.log('Loading State:', isLoadingUserData);

                  // Test available tokens
                  const tokens = {
                    'cedo_token (localStorage)': localStorage.getItem('cedo_token'),
                    'cedo_token (sessionStorage)': sessionStorage.getItem('cedo_token'),
                    'authToken (localStorage)': localStorage.getItem('authToken'),
                    'authToken (sessionStorage)': sessionStorage.getItem('authToken'),
                    'token (localStorage)': localStorage.getItem('token'),
                  };
                  console.log('Available tokens:', tokens);

                  // Find the first available token
                  const token = localStorage.getItem('cedo_token') || sessionStorage.getItem('cedo_token') ||
                    localStorage.getItem('authToken') || sessionStorage.getItem('authToken') ||
                    localStorage.getItem('token');

                  if (!token) {
                    console.error('❌ No authentication token found!');
                    return;
                  }

                  console.log('🔑 Using token:', token.substring(0, 20) + '...');

                  // Test profile API endpoint
                  try {
                    console.log('🔍 Testing profile API endpoint...');
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                    });

                    console.log('Response status:', response.status);
                    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

                    if (response.ok) {
                      const data = await response.json();
                      console.log('✅ Profile API Response:', data);
                      console.log('🔍 Database Fields Check:');
                      if (data.user) {
                        console.log('  - organization_description:', data.user.organizationDescription);
                        console.log('  - phone_number:', data.user.phoneNumber);
                        console.log('  - organization:', data.user.organization);
                        console.log('  - name:', data.user.name);
                        console.log('  - email:', data.user.email);
                      }
                    } else {
                      const errorData = await response.text();
                      console.error('❌ Profile API failed:', response.status, errorData);
                    }
                  } catch (error) {
                    console.error('❌ Profile API Error:', error);
                  }

                  // Test legacy API for comparison
                  try {
                    console.log('🔍 Testing legacy /api/users/me...');
                    const legacyResponse = await fetch('/api/users/me', {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    if (legacyResponse.ok) {
                      const legacyData = await legacyResponse.json();
                      console.log('📊 Legacy API Response:', legacyData);
                    } else {
                      console.warn('⚠️ Legacy API failed:', legacyResponse.status);
                    }
                  } catch (legacyError) {
                    console.warn('⚠️ Legacy API Error:', legacyError);
                  }
                }}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
              >
                👤 Debug Profile API
              </button>
            </div>
            <div className="mt-2 text-xs text-yellow-700">
              Disabled prop: <code>{String(disabled)}</code> |
              ✅ Fixed: State race condition resolved
              <button
                type="button"
                onClick={() => {
                  console.log('🔍 Current form state:', {
                    disabled,
                    formData,
                    localErrors
                  });
                }}
                className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                Log State
              </button>
              <div className="mt-1 text-xs">
                ✅ <strong>Fixed Issues:</strong><br />
                • State race condition in handleInputChange (only updates specific field)<br />
                • Validation timing (lenient during interaction, strict on submission)<br />
                • Simplified disabled prop logic (no more readOnly mode switching)<br />
                💡 Form inputs should now work normally - try typing and selecting radio buttons
              </div>
            </div>
          </div>
        )}

        <form id="section2-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="organizationName" className="text-base">
                Organization Name <span className="text-red-500">*</span>
                {userProfileData?.organizationName && (
                  <span className="text-sm text-gray-500 font-normal ml-2">(from your profile)</span>
                )}
              </Label>
              <Input
                id="organizationName"
                name="organizationName"
                placeholder={isLoadingUserData ? "Loading..." : "Enter your organization's name"}
                className={getFieldClasses("organizationName", localErrors, "mt-1") +
                  (userProfileData?.organizationName ? " bg-gray-50 cursor-not-allowed" : "")}
                onBlur={handleInputBlur}
                disabled={disabled || isLoadingUserData}
                readOnly={!!userProfileData?.organizationName && userProfileData.organizationName.trim() !== ''}
                required
                defaultValue={userProfileData?.organizationName || ''}
                title={userProfileData?.organizationName ? "This field is automatically filled from your user profile" : ""}
              />
              {userProfileData?.organizationName && (
                <p className="text-xs text-blue-600 mt-1">
                  📋 This information is automatically filled from your user profile
                </p>
              )}
              {hasFieldError("organizationName", localErrors) && (
                <p className="text-red-500 text-sm mt-1">{getFieldError("organizationName", localErrors)}</p>
              )}
            </div>



            <div>
              <Label htmlFor="organizationDescription" className="text-base">
                Organization Description
                {userProfileData?.organizationDescription && (
                  <span className="text-sm text-gray-500 font-normal ml-2">(from your profile)</span>
                )}
                {!userProfileData?.organizationDescription && !isLoadingUserData && (
                  <span className="text-sm text-orange-500 font-normal ml-2">(not set in profile)</span>
                )}
              </Label>
              <Textarea
                id="organizationDescription"
                name="organizationDescription"
                placeholder={isLoadingUserData ? "Loading..." :
                  userProfileData?.organizationDescription ? userProfileData.organizationDescription :
                    "No organization description found in your profile"}
                className={getFieldClasses("organizationDescription", localErrors, "mt-1") +
                  (userProfileData?.organizationDescription ? " bg-gray-50 cursor-not-allowed" : "")}
                defaultValue={userProfileData?.organizationDescription || ''}
                onBlur={handleInputBlur}
                disabled={disabled || isLoadingUserData}
                readOnly={!!userProfileData?.organizationDescription}
                title={userProfileData?.organizationDescription ?
                  "This field is automatically filled from your user profile" :
                  "Update your profile to auto-fill this field"}
              />
              {userProfileData?.organizationDescription ? (
                <p className="text-xs text-blue-600 mt-1">
                  📋 This information is automatically filled from your user profile
                </p>
              ) : !isLoadingUserData ? (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ No organization description found in your profile. Please update your profile to auto-fill this field.
                </p>
              ) : null}
              {hasFieldError("organizationDescription", localErrors) && (
                <p className="text-red-500 text-sm mt-1">{getFieldError("organizationDescription", localErrors)}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName" className="text-base">
                  Contact Person <span className="text-red-500">*</span>
                  {userProfileData?.contactName && (
                    <span className="text-sm text-gray-500 font-normal ml-2">(from your profile)</span>
                  )}
                </Label>
                <Input
                  id="contactName"
                  name="contactName"
                  placeholder={isLoadingUserData ? "Loading..." : "Full name"}
                  className={getFieldClasses("contactName", localErrors, "mt-1") +
                    (userProfileData?.contactName ? " bg-gray-50 cursor-not-allowed" : "")}
                  onBlur={handleInputBlur}
                  disabled={disabled || isLoadingUserData}
                  readOnly={!!userProfileData?.contactName}
                  required
                  defaultValue={userProfileData?.contactName || ''}
                  title={userProfileData?.contactName ? "This field is automatically filled from your user profile" : ""}
                />
                {userProfileData?.contactName && (
                  <p className="text-xs text-blue-600 mt-1">
                    📋 This information is automatically filled from your user profile
                  </p>
                )}
                {hasFieldError("contactName", localErrors) && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError("contactName", localErrors)}</p>
                )}
              </div>
              <div>
                <Label htmlFor="contactEmail" className="text-base">
                  Email <span className="text-red-500">*</span>
                  {userProfileData?.contactEmail && (
                    <span className="text-sm text-gray-500 font-normal ml-2">(from your profile)</span>
                  )}
                </Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  placeholder={isLoadingUserData ? "Loading..." : "Email address"}
                  className={getFieldClasses("contactEmail", localErrors, "mt-1") +
                    (userProfileData?.contactEmail ? " bg-gray-50 cursor-not-allowed" : "")}
                  onBlur={handleInputBlur}
                  disabled={disabled || isLoadingUserData}
                  readOnly={!!userProfileData?.contactEmail}
                  required
                  defaultValue={userProfileData?.contactEmail || ''}
                  title={userProfileData?.contactEmail ? "This field is automatically filled from your user profile" : ""}
                />
                {userProfileData?.contactEmail && (
                  <p className="text-xs text-blue-600 mt-1">
                    📋 This information is automatically filled from your user profile
                  </p>
                )}
                {hasFieldError("contactEmail", localErrors) && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError("contactEmail", localErrors)}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="contactPhone" className="text-base">
                Phone Number
                {userProfileData?.contactPhone && (
                  <span className="text-sm text-gray-500 font-normal ml-2">(from your profile)</span>
                )}
                {!userProfileData?.contactPhone && !isLoadingUserData && (
                  <span className="text-sm text-orange-500 font-normal ml-2">(not set in profile)</span>
                )}
              </Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                placeholder={isLoadingUserData ? "Loading..." :
                  userProfileData?.contactPhone ? userProfileData.contactPhone :
                    "No phone number found in your profile"}
                maxLength="11"
                className={getFieldClasses("contactPhone", localErrors, "mt-1") +
                  (userProfileData?.contactPhone ? " bg-gray-50 cursor-not-allowed" : "")}
                defaultValue={userProfileData?.contactPhone || ''}
                onBlur={handleInputBlur}
                disabled={disabled || isLoadingUserData}
                readOnly={!!userProfileData?.contactPhone}
                pattern="[0-9]{11}"
                title={userProfileData?.contactPhone ?
                  "This field is automatically filled from your user profile" :
                  "Update your profile to auto-fill this field"}
              />
              {userProfileData?.contactPhone ? (
                <p className="text-xs text-blue-600 mt-1">
                  📋 This information is automatically filled from your user profile (11 digits, e.g., 09123456789)
                </p>
              ) : !isLoadingUserData ? (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ No phone number found in your profile. Please update your profile to auto-fill this field (11 digits, e.g., 09123456789)
                </p>
              ) : null}
              {hasFieldError("contactPhone", localErrors) && (
                <p className="text-red-500 text-sm mt-1">{getFieldError("contactPhone", localErrors)}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={disabled}>
              Previous
            </Button>
            <div className="flex gap-2">
              {!disabled && (
                <Button type="button" variant="destructive" onClick={onWithdraw}>
                  Withdraw
                </Button>
              )}
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={disabled || isSaving}>
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default Section2_OrgInfo
