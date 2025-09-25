/**
 * Proposal Data Mapper
 * 
 * Maps localStorage form data to PostgreSQL database schema
 * Handles data transformation between frontend form structure and backend database structure
 */

import { loadFormData } from './storage-utils.js';

/**
 * Map form data from localStorage to PostgreSQL proposal schema
 * @param {string} uuid - The event UUID
 * @param {Object} options - Additional options for mapping
 * @returns {Object} Mapped data ready for database insertion
 */
export async function mapFormDataToProposal(uuid, options = {}) {
    try {
        // Load data from both Organization and EventInformation steps
        const orgData = loadFormData(uuid, 'organization') || {};
        const eventData = loadFormData(uuid, 'eventInformation') || {};

        console.log('📊 Mapping form data to proposal schema:', { uuid, orgData, eventData, options });

        // Extract values from nested structure
        const orgValues = orgData.values || {};
        const eventValues = eventData.values || {};

        // Check if we have any data to save
        const hasOrgData = Object.keys(orgValues).length > 0;
        const hasEventData = Object.keys(eventValues).length > 0 ||
            eventData.selectedTargetAudiences?.length > 0 ||
            eventData.gpoa || eventData.projectProposal;

        if (!hasOrgData && !hasEventData) {
            console.log('⚠️ No form data found to map');
            return null;
        }

        // Map to updated PostgreSQL schema (matches frontend form structure)
        const proposalData = {
            // Basic proposal info
            uuid: uuid,

            // Organization Information (from Organization.jsx)
            organization_name: orgValues.organizationName || '',
            organization_type: mapOrganizationType(orgValues.organizationType || 'school'),
            organization_description: orgValues.organizationDescription || '',
            organization_registration_no: orgValues.organizationRegistrationNo || '',

            // Contact Information (from Organization.jsx)
            contact_person: orgValues.contactPerson || '',
            contact_email: orgValues.contactEmail || '',
            contact_phone: orgValues.contactPhone || '',

            // Event Information (from EventInformation.jsx)
            event_name: eventValues.eventName || '',
            event_venue: eventValues.venue || '',
            event_start_date: formatDateForDB(eventValues.startDate),
            event_end_date: formatDateForDB(eventValues.endDate),
            event_start_time: eventValues.startTime || null,
            event_end_time: eventValues.endTime || null,
            event_mode: mapEventMode(eventValues.eventMode || 'offline'),

            // Event Type and Classification (from EventInformation.jsx)
            event_type: eventValues.eventType || '',
            target_audience: eventData.selectedTargetAudiences || [],
            sdp_credits: eventValues.sdpCredits || null,

            // File Uploads (from EventInformation.jsx)
            gpoa_file_name: eventData.gpoa?.name || null,
            gpoa_file_size: eventData.gpoa?.size || null,
            gpoa_file_type: eventData.gpoa?.type || null,
            gpoa_file_path: eventData.gpoa?.filePath || null,

            project_proposal_file_name: eventData.projectProposal?.name || null,
            project_proposal_file_size: eventData.projectProposal?.size || null,
            project_proposal_file_type: eventData.projectProposal?.type || null,
            project_proposal_file_path: eventData.projectProposal?.filePath || null,

            // Form state - ensure current_section is always a valid value
            current_section: validateCurrentSection(options.currentSection || mapCurrentSection(orgValues, eventValues)),
            proposal_status: options.status || 'draft',
            form_completion_percentage: calculateCompletionPercentage(orgValues, eventValues, eventData),

            // Note: File references are handled separately via proposal_files table
        };

        console.log('✅ Mapped proposal data:', proposalData);
        return proposalData;

    } catch (error) {
        console.error('❌ Error mapping form data to proposal:', error);
        throw new Error(`Failed to map form data: ${error.message}`);
    }
}

/**
 * Map organization type to database enum
 */
function mapOrganizationType(orgType) {
    const typeMap = {
        'school': 'school-based',
        'community': 'community-based',
        'government': 'external',
        'ngo': 'external',
        'private': 'external',
        'internal': 'internal',
        'external': 'external',
        'school-based': 'school-based',
        'community-based': 'community-based'
    };
    return typeMap[orgType] || 'school-based';
}

/**
 * Map event mode to database enum
 */
function mapEventMode(eventMode) {
    const modeMap = {
        'offline': 'offline',
        'online': 'online',
        'hybrid': 'hybrid'
    };
    return modeMap[eventMode] || 'offline';
}

/**
 * Map school event type to database enum
 */
function mapSchoolEventType(eventType) {
    // Valid school event types: 'academic-enhancement', 'workshop-seminar-webinar', 'conference', 'competition', 'cultural-show', 'sports-fest', 'other'
    const schoolTypeMap = {
        'academic-enhancement': 'academic-enhancement',
        'workshop': 'workshop-seminar-webinar',
        'seminar': 'workshop-seminar-webinar',
        'webinar': 'workshop-seminar-webinar',
        'workshop-seminar-webinar': 'workshop-seminar-webinar',
        'conference': 'conference',
        'competition': 'competition',
        'cultural-show': 'cultural-show',
        'sports-fest': 'sports-fest',
        'other': 'other'
    };
    return schoolTypeMap[eventType] || null;
}

/**
 * Map community event type to database enum
 */
function mapCommunityEventType(eventType) {
    // Valid community event types: 'academic-enhancement', 'seminar-webinar', 'general-assembly', 'leadership-training', 'others'
    const communityTypeMap = {
        'academic-enhancement': 'academic-enhancement',
        'seminar': 'seminar-webinar',
        'webinar': 'seminar-webinar',
        'seminar-webinar': 'seminar-webinar',
        'general-assembly': 'general-assembly',
        'leadership-training': 'leadership-training',
        'others': 'others'
    };
    return communityTypeMap[eventType] || null;
}

/**
 * Map target audience array to JSONB format
 */
function mapTargetAudience(audiences) {
    if (!Array.isArray(audiences) || audiences.length === 0) {
        return null;
    }

    // Map frontend values to database values
    const audienceMap = {
        '1st-year': '1st_year',
        '2nd-year': '2nd_year',
        '3rd-year': '3rd_year',
        '4th-year': '4th_year',
        'all-levels': 'all_levels',
        'leaders': 'leaders',
        'alumni': 'alumni'
    };

    return audiences.map(aud => audienceMap[aud] || aud);
}

/**
 * Format date for database insertion
 */
function formatDateForDB(dateString) {
    if (!dateString) return null;

    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
        console.warn('Invalid date format:', dateString);
        return null;
    }
}

/**
 * Calculate form completion percentage
 */
function calculateCompletionPercentage(orgValues, eventValues, eventData) {
    const requiredFields = [
        'organizationName', 'contactPerson', 'contactEmail',
        'eventName', 'venue', 'startDate', 'endDate', 'startTime', 'endTime', 'eventType'
    ];

    const fileFields = ['gpoa', 'projectProposal'];

    let completedFields = 0;
    let totalFields = requiredFields.length + fileFields.length;

    // Check required fields
    requiredFields.forEach(field => {
        if (orgValues[field] || eventValues[field]) {
            completedFields++;
        }
    });

    // Check file fields
    fileFields.forEach(field => {
        if (eventData[field] && eventData[field].name) {
            completedFields++;
        }
    });

    return Math.round((completedFields / totalFields) * 100);
}

/**
 * Prepare file data for upload
 * @param {string} uuid - The event UUID
 * @returns {Object} File data ready for upload (metadata only, no dataUrl)
 */
export async function prepareFileDataForUpload(uuid) {
    try {
        const eventData = loadFormData(uuid, 'eventInformation') || {};

        const fileData = {};

        // Prepare GPOA file metadata (exclude dataUrl to prevent 413 errors)
        if (eventData.gpoa && eventData.gpoa.name) {
            fileData.gpoa = {
                name: eventData.gpoa.name,
                size: eventData.gpoa.size,
                type: eventData.gpoa.type,
                timestamp: eventData.gpoa.timestamp,
                hasData: !!eventData.gpoa.dataUrl // Indicate if file data exists
            };
        }

        // Prepare Project Proposal file metadata (exclude dataUrl to prevent 413 errors)
        if (eventData.projectProposal && eventData.projectProposal.name) {
            fileData.projectProposal = {
                name: eventData.projectProposal.name,
                size: eventData.projectProposal.size,
                type: eventData.projectProposal.type,
                timestamp: eventData.projectProposal.timestamp,
                hasData: !!eventData.projectProposal.dataUrl // Indicate if file data exists
            };
        }

        console.log('📎 Prepared file metadata for upload (dataUrl excluded):', fileData);
        return fileData;

    } catch (error) {
        console.error('❌ Error preparing file data:', error);
        throw new Error(`Failed to prepare file data: ${error.message}`);
    }
}

/**
 * Prepare file data with dataUrl for actual file upload
 * @param {string} uuid - The event UUID
 * @returns {Object} File data with dataUrl for upload
 */
export async function prepareFileDataWithContent(uuid) {
    try {
        const eventData = loadFormData(uuid, 'eventInformation') || {};

        const fileData = {};

        // Prepare GPOA file with dataUrl
        if (eventData.gpoa && eventData.gpoa.name && eventData.gpoa.dataUrl) {
            fileData.gpoa = {
                name: eventData.gpoa.name,
                size: eventData.gpoa.size,
                type: eventData.gpoa.type,
                dataUrl: eventData.gpoa.dataUrl,
                timestamp: eventData.gpoa.timestamp
            };
        }

        // Prepare Project Proposal file with dataUrl
        if (eventData.projectProposal && eventData.projectProposal.name && eventData.projectProposal.dataUrl) {
            fileData.projectProposal = {
                name: eventData.projectProposal.name,
                size: eventData.projectProposal.size,
                type: eventData.projectProposal.type,
                dataUrl: eventData.projectProposal.dataUrl,
                timestamp: eventData.projectProposal.timestamp
            };
        }

        console.log('📎 Prepared file data with content for upload:', {
            gpoa: fileData.gpoa ? { name: fileData.gpoa.name, size: fileData.gpoa.size } : null,
            projectProposal: fileData.projectProposal ? { name: fileData.projectProposal.name, size: fileData.projectProposal.size } : null
        });
        return fileData;

    } catch (error) {
        console.error('❌ Error preparing file data with content:', error);
        throw new Error(`Failed to prepare file data with content: ${error.message}`);
    }
}

/**
 * Validate current section to ensure it matches PostgreSQL CHECK constraint
 */
function validateCurrentSection(section) {
    // Valid current_section values according to PostgreSQL CHECK constraint
    const validSections = ['overview', 'orgInfo', 'schoolEvent', 'communityEvent', 'reporting'];

    if (validSections.includes(section)) {
        return section;
    }

    // If invalid section (like 'submitted'), default to 'orgInfo' for safety
    console.warn(`⚠️ Invalid current_section: "${section}". Defaulting to "orgInfo".`);
    return 'orgInfo';
}

/**
 * Map current section to valid database values
 */
function mapCurrentSection(orgValues, eventValues) {
    // Valid current_section values: 'overview', 'orgInfo', 'schoolEvent', 'communityEvent', 'reporting'
    const sectionMap = {
        'overview': 'overview',
        'orgInfo': 'orgInfo',
        'organization': 'orgInfo',
        'eventInformation': 'schoolEvent', // Default to schoolEvent for eventInformation
        'schoolEvent': 'schoolEvent',
        'communityEvent': 'communityEvent',
        'reporting': 'reporting'
    };

    // Determine section based on data
    if (eventValues && Object.keys(eventValues).length > 0) {
        // Check organization type to determine if it's school or community event
        const orgType = orgValues?.organizationType || 'school';
        if (orgType === 'community' || orgType === 'community-based') {
            return 'communityEvent';
        } else {
            return 'schoolEvent';
        }
    } else if (orgValues && Object.keys(orgValues).length > 0) {
        return 'orgInfo';
    }
    return 'overview';
}

/**
 * Validate mapped data before sending to backend
 * @param {Object} proposalData - Mapped proposal data
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with success status and errors
 */
export function validateProposalData(proposalData, options = {}) {
    const { strict = false, isDraft = true } = options;
    const errors = [];

    // For drafts, we only validate fields that are present
    // For final submission, we validate all required fields
    if (strict || !isDraft) {
        // Strict validation for final submission
        const requiredFields = [
            'uuid', 'organization_name', 'contact_person', 'contact_email',
            'event_name', 'event_venue', 'event_start_date', 'event_end_date',
            'event_start_time', 'event_end_time', 'event_type', 'target_audience', 'sdp_credits'
        ];

        requiredFields.forEach(field => {
            if (!proposalData[field]) {
                errors.push(`${field} is required`);
            }
        });

        // Special validation for array fields
        if (proposalData.target_audience && !Array.isArray(proposalData.target_audience)) {
            errors.push('target_audience must be an array');
        }

        if (proposalData.target_audience && proposalData.target_audience.length === 0) {
            errors.push('target_audience cannot be empty');
        }

        // Validate SDP credits
        if (proposalData.sdp_credits && ![1, 2].includes(proposalData.sdp_credits)) {
            errors.push('sdp_credits must be 1 or 2');
        }
    } else {
        // Loose validation for drafts - only validate fields that have values
        if (proposalData.contact_email && !isValidEmail(proposalData.contact_email)) {
            errors.push('Invalid email format');
        }
    }

    // Date validation (only if both dates are present)
    if (proposalData.event_start_date && proposalData.event_end_date) {
        const startDate = new Date(proposalData.event_start_date);
        const endDate = new Date(proposalData.event_end_date);

        if (startDate >= endDate) {
            errors.push('End date must be after start date');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Simple email validation
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
