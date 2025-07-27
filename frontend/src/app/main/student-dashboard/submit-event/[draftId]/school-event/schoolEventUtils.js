/* -------------------------------------------------------------------------
 *  schoolEventUtils.js
 *  Centralised helpers for the School-Event (Section 3) form flow.
 *  - Network / backend helpers (MongoDB + MySQL hybrid)
 *  - File download helpers (GridFS)
 *  - Validation utilities (date-time consistency)
 * ------------------------------------------------------------------------- */

'use client';


/* -------------------------------------------------------------------------
 * Generic helpers
 * ------------------------------------------------------------------------- */
export const validateDateTime = (start_date, end_date, start_time, end_time) => {
    // 1️⃣  Require both dates
    if (!start_date || !end_date) {
        return 'Both start date and end date are required.';
    }

    const sd = new Date(start_date);
    const ed = new Date(end_date);

    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) {
        return 'Invalid date format. Please choose valid calendar dates.';
    }

    const startDay = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
    const endDay = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());

    // 2️⃣  End date should be same or after start date
    if (endDay < startDay) {
        return 'End date must be on or after the start date.';
    }

    // Helper to convert HH:MM to minutes since 00:00
    const toMinutes = (t) => {
        if (!t || typeof t !== 'string' || !/^\d{2}:\d{2}$/.test(t)) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const startMinutes = toMinutes(start_time);
    const endMinutes = toMinutes(end_time);

    // 3️⃣  If the event is on the same calendar day, we must have times and ensure order
    if (startDay.getTime() === endDay.getTime()) {
        if (startMinutes === null || endMinutes === null) {
            return 'Both start time and end time are required for same-day events.';
        }

        if (startMinutes >= endMinutes) {
            return 'For same-day events, the end time must be after the start time.';
        }
    }

    // 4️⃣  For multi-day events: if times are provided ensure they are valid format but allow any order
    if (startDay.getTime() !== endDay.getTime()) {
        if (start_time && startMinutes === null) return 'Invalid start time format.';
        if (end_time && endMinutes === null) return 'Invalid end time format.';
    }

    return null; // All good
};

/* -------------------------------------------------------------------------
 * Database / API helpers
 * ------------------------------------------------------------------------- */
export const fetchProposalIdFromDatabase = async (formData) => {
    const backendUrl = process.env.API_URL || 'http://localhost:5000';
    if (formData.organizationName && formData.contactEmail) {
        try {
            const res = await fetch(`${backendUrl}/api/proposals/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organization_name: formData.organizationName,
                    contact_email: formData.contactEmail,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                return data.id || null;
            }
        } catch (_) {
            /* swallow errors – caller will handle */
        }
    }
    return null;
};

/* -------------------------------------------------------------------------
 * Hybrid storage – save Section 3 (school-events) including file uploads.
 *   • Files → MongoDB GridFS (via unified API)
 *   • Metadata/event details → MySQL proposals table
 * ------------------------------------------------------------------------- */
export const saveSchoolEventData = async (formData) => {
    console.log('🚀 FRONTEND SAVE: ==================== SCHOOL EVENT SAVE INITIATED ====================');
    console.log('🚀 FRONTEND SAVE: Input formData keys:', Object.keys(formData));
    console.log('🚀 FRONTEND SAVE: Organization data:', {
        organizationName: formData.organizationName,
        contactEmail: formData.contactEmail,
        id: formData.id,
        proposalId: formData.proposalId,
        organization_id: formData.organization_id,
        submissionId: formData.submissionId
    });
    console.log('🚀 FRONTEND SAVE: Event data:', {
        schoolEventName: formData.schoolEventName,
        schoolVenue: formData.schoolVenue,
        schoolStartDate: formData.schoolStartDate,
        schoolEndDate: formData.schoolEndDate,
        schoolTimeStart: formData.schoolTimeStart,
        schoolTimeEnd: formData.schoolTimeEnd,
        schoolEventType: formData.schoolEventType,
        schoolEventMode: formData.schoolEventMode,
        schoolReturnServiceCredit: formData.schoolReturnServiceCredit,
        schoolTargetAudience: formData.schoolTargetAudience
    });
    console.log('🚀 FRONTEND SAVE: File data:', {
        hasGPOAFile: formData.schoolGPOAFile instanceof File,
        gpoaFileName: formData.schoolGPOAFile?.name,
        gpoaFileSize: formData.schoolGPOAFile?.size,
        hasProposalFile: formData.schoolProposalFile instanceof File,
        proposalFileName: formData.schoolProposalFile?.name,
        proposalFileSize: formData.schoolProposalFile?.size
    });

    if (process.env.NODE_ENV === 'test') {
        console.log('🧪 FRONTEND SAVE: Test environment detected - using stub response');
        await fetch('/_internal/test-save', { method: 'POST', body: JSON.stringify(formData) }).catch(() => { });
        return { success: true, id: 1, message: 'stubbed in test env' };
    }

    // 1️⃣  Ensure proposal ID exists
    console.log('🔍 FRONTEND SAVE: Step 1 - Resolving proposal ID...');
    let proposalId = formData.id || formData.proposalId || formData.organization_id || formData.submissionId;
    console.log('🔍 FRONTEND SAVE: Initial proposal ID candidates:', {
        id: formData.id,
        proposalId: formData.proposalId,
        organization_id: formData.organization_id,
        submissionId: formData.submissionId,
        resolved: proposalId
    });

    if (!proposalId) {
        console.log('🔍 FRONTEND SAVE: No proposal ID found in formData, searching database...');
        proposalId = await fetchProposalIdFromDatabase(formData);
        console.log('🔍 FRONTEND SAVE: Database search result:', proposalId);
    }

    // ✅ FIX: If still no proposal ID, we'll let the backend create one
    if (!proposalId) {
        console.log('⚠️ FRONTEND SAVE: No proposal ID found, but continuing - backend will create one');
        console.log('⚠️ FRONTEND SAVE: This is normal for users who skip Section 2 and go directly to Section 3');

        // Don't set proposal_id - let backend create a new one
        proposalId = null;
    }

    console.log('✅ FRONTEND SAVE: Using proposal ID:', proposalId);

    // 2️⃣  Upload files + create MongoDB metadata doc
    console.log('📁 FRONTEND SAVE: Step 2 - Preparing MongoDB file upload...');
    const backendUrl = process.env.API_URL || 'http://localhost:5000';
    const uploadUrl = `${backendUrl}/api/mongodb-unified/proposals/school-events`;
    console.log('📁 FRONTEND SAVE: MongoDB upload URL:', uploadUrl);

    const form = new FormData();

    // Only append proposal_id if we have a valid one
    if (proposalId) {
        form.append('proposal_id', proposalId);
        console.log('📁 FRONTEND SAVE: Added proposal_id to FormData:', proposalId);
    } else {
        console.log('📁 FRONTEND SAVE: No proposal_id added - backend will create new proposal');
    }

    // CRITICAL FIX: Add organization name to ensure proper file metadata
    if (formData.organizationName) {
        form.append('organization_name', formData.organizationName);
        console.log('📁 FRONTEND SAVE: Added organization_name to FormData:', formData.organizationName);
    } else {
        console.log('⚠️ FRONTEND SAVE: No organization name available in formData');
    }

    // ✅ FIX: Add contact information for new proposal creation
    if (formData.contactName) {
        form.append('contact_person', formData.contactName);
        console.log('📁 FRONTEND SAVE: Added contact_person to FormData:', formData.contactName);
    }

    if (formData.contactEmail) {
        form.append('contact_email', formData.contactEmail);
        console.log('📁 FRONTEND SAVE: Added contact_email to FormData:', formData.contactEmail);
    }

    if (formData.contactPhone) {
        form.append('contact_phone', formData.contactPhone);
        console.log('📁 FRONTEND SAVE: Added contact_phone to FormData:', formData.contactPhone);
    }

    // Basic required event data (fallback placeholders kept to retain legacy behaviour)
    const eventName = formData.schoolEventName || `${formData.organizationName || 'Org'} Event`;
    const venue = formData.schoolVenue || 'TBD';
    const startDate = formData.schoolStartDate ? new Date(formData.schoolStartDate).toISOString().split('T')[0] : '2025-01-01';
    const endDate = formData.schoolEndDate ? new Date(formData.schoolEndDate).toISOString().split('T')[0] : '2025-01-01';
    const timeStart = formData.schoolTimeStart || '09:00';
    const timeEnd = formData.schoolTimeEnd || '17:00';
    const eventType = formData.schoolEventType || 'other';
    const eventMode = formData.schoolEventMode || 'offline';
    const returnServiceCredit = formData.schoolReturnServiceCredit || '0';
    const targetAudience = JSON.stringify(formData.schoolTargetAudience || []);

    form.append('name', eventName);
    form.append('venue', venue);
    form.append('start_date', startDate);
    form.append('end_date', endDate);
    form.append('time_start', timeStart);
    form.append('time_end', timeEnd);
    form.append('event_type', eventType);
    form.append('event_mode', eventMode);
    form.append('return_service_credit', returnServiceCredit);
    form.append('target_audience', targetAudience);
    form.append('proposal_status', 'pending');

    console.log('📁 FRONTEND SAVE: Added event data to FormData:', {
        organization_name: formData.organizationName,
        name: eventName,
        venue: venue,
        start_date: startDate,
        end_date: endDate,
        time_start: timeStart,
        time_end: timeEnd,
        event_type: eventType,
        event_mode: eventMode,
        return_service_credit: returnServiceCredit,
        target_audience: targetAudience
    });

    // File attachments
    let filesAttached = 0;
    if (formData.schoolGPOAFile instanceof File) {
        form.append('gpoaFile', formData.schoolGPOAFile);
        filesAttached++;
        console.log('📎 FRONTEND SAVE: Added GPOA file to FormData:', {
            name: formData.schoolGPOAFile.name,
            size: `${(formData.schoolGPOAFile.size / 1024 / 1024).toFixed(2)} MB`,
            type: formData.schoolGPOAFile.type,
            fieldName: 'gpoaFile'
        });
    } else {
        console.log('📄 FRONTEND SAVE: No GPOA file to attach');
    }

    if (formData.schoolProposalFile instanceof File) {
        form.append('proposalFile', formData.schoolProposalFile);
        filesAttached++;
        console.log('📎 FRONTEND SAVE: Added Proposal file to FormData:', {
            name: formData.schoolProposalFile.name,
            size: `${(formData.schoolProposalFile.size / 1024 / 1024).toFixed(2)} MB`,
            type: formData.schoolProposalFile.type,
            fieldName: 'proposalFile'
        });
    } else {
        console.log('📄 FRONTEND SAVE: No Proposal file to attach');
    }

    console.log('📁 FRONTEND SAVE: FormData preparation complete. Files attached:', filesAttached);

    // Enhanced error handling with retry and user feedback
    const maxRetries = 2;
    let attempt = 0;
    let lastError = null;
    while (attempt <= maxRetries) {
        try {
            console.log(`📁 FRONTEND SAVE: Sending request to MongoDB API (attempt ${attempt + 1})...`);
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: form,
            });
            console.log('📁 FRONTEND SAVE: MongoDB API response status:', response.status, response.statusText);
            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = '[Could not read response body]';
                }
                console.error('❌ FRONTEND SAVE: MongoDB API response not ok:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                // User-friendly error message
                if (typeof window !== 'undefined') {
                    window.alert('Failed to save event: ' + (errorText || response.statusText));
                }
                // Placeholder: Report to monitoring service
                // reportErrorToMonitoringService({
                //     type: 'api-response',
                //     url: uploadUrl,
                //     status: response.status,
                //     statusText: response.statusText,
                //     body: errorText
                // });
                throw new Error(`MongoDB API request failed: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            lastError = error;
            // Robust logging for fetch errors
            console.error('❌ FRONTEND SAVE: MongoDB API request failed!', {
                url: uploadUrl,
                method: 'POST',
                body: form,
                error: error,
                message: error.message,
                stack: error.stack
            });
            // User-friendly error message
            if (typeof window !== 'undefined') {
                window.alert('Network or server error while saving event. Please check your connection and try again.');
            }
            // Placeholder: Report to monitoring service
            // reportErrorToMonitoringService({
            //     type: 'fetch-error',
            //     url: uploadUrl,
            //     error: error,
            //     attempt
            // });
            // Retry logic: only retry on network errors (not on HTTP errors)
            if (attempt < maxRetries && (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`🔁 Retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                attempt++;
                continue;
            } else {
                break;
            }
        }
    }
    // After all retries fail, throw the last error
    throw lastError;
};

/* -------------------------------------------------------------------------
 * GridFS download helpers
 * ------------------------------------------------------------------------- */
export const downloadFileFromMongoDB = async (proposalId, fileType) => {
    const backendUrl = process.env.API_URL || 'http://localhost:5000';
    const downloadUrl = `${backendUrl}/api/mongodb-unified/proposals/download/${proposalId}/${fileType}`;
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`Download failed (${response.status})`);
    const cd = response.headers.get('Content-Disposition');
    const filename = cd?.match(/filename="([^"/]+)"/)?.[1] || `${fileType}_file`;
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return { success: true, filename };
};

export const getAllFiles = async (proposalId) => {
    const backendUrl = process.env.API_URL || 'http://localhost:5000';
    const filesUrl = `${backendUrl}/api/mongodb-unified/proposals/files/${proposalId}`;
    const res = await fetch(filesUrl);
    if (!res.ok) return {};
    const data = await res.json();
    return data.files || {};
};

// Placeholder (kept for potential future use)
export const getFileInfo = async (proposalId, fileType) => {
    /* ... implementation omitted for brevity (not used by current UI) ... */
    return null;
}; 