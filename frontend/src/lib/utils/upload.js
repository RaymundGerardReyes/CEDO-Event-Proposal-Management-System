/**
 * Unified File Upload Helper
 * Purpose: Centralized file upload functionality for event proposals
 * Key approaches: Single upload endpoint, comprehensive validation, error handling
 */


// ===================================================================
// FILE VALIDATION
// ===================================================================

/**
 * File type validation rules
 */
const FILE_VALIDATION_RULES = {
    gpoaFile: {
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        maxSize: 5 * 1024 * 1024, // 5MB
        required: true,
        message: 'GPOA document must be a PDF or image file (JPEG, PNG) under 5MB'
    },
    proposalFile: {
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 10 * 1024 * 1024, // 10MB
        required: false,
        message: 'Proposal document must be a PDF or Word document under 10MB'
    },
    preRegistrationList: {
        allowedTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        maxSize: 5 * 1024 * 1024, // 5MB
        required: false,
        message: 'Pre-registration list must be a PDF or Excel file under 5MB'
    },
    finalAttendanceList: {
        allowedTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        maxSize: 5 * 1024 * 1024, // 5MB
        required: false,
        message: 'Final attendance list must be a PDF or Excel file under 5MB'
    }
};

/**
 * Validate a single file
 * @param {File} file - File to validate
 * @param {string} fileType - Type of file ('image', 'document', 'pdf', 'all')
 * @returns {Object} Validation result
 */
function validateFile(file, fileType) {
    if (!file) {
        return { isValid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > FILE_VALIDATION_RULES.maxSize) {
        return { isValid: false, error: `File size must be less than ${formatFileSize(FILE_VALIDATION_RULES.maxSize)}` };
    }

    // Check file type based on fileType parameter
    switch (fileType) {
        case 'image':
            if (!isImageFile(file)) {
                return { isValid: false, error: 'Please select an image file (JPG, PNG, GIF)' };
            }
            break;
        case 'document':
            if (!isDocumentFile(file)) {
                return { isValid: false, error: 'Please select a document file (Word, Excel)' };
            }
            break;
        case 'pdf':
            if (!isPdfFile(file)) {
                return { isValid: false, error: 'Please select a PDF file' };
            }
            break;
        case 'all':
            if (!isImageFile(file) && !isDocumentFile(file) && !isPdfFile(file)) {
                return { isValid: false, error: 'Please select a valid file type (image, document, or PDF)' };
            }
            break;
        default:
            return { isValid: false, error: 'Invalid file type specified' };
    }

    return { isValid: true, error: null };
}

/**
 * Validate multiple files
 * @param {FileList} files - Files to validate
 * @returns {Object} Validation result
 */
function validateFiles(files) {
    if (!files || files.length === 0) {
        return { isValid: false, error: 'No files provided' };
    }

    const errors = [];
    let isValid = true;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateFile(file, 'all');

        if (!validation.isValid) {
            errors.push(`File ${i + 1}: ${validation.error}`);
            isValid = false;
        }
    }

    return {
        isValid,
        error: isValid ? null : errors.join('; ')
    };
}

// ===================================================================
// FILE UPLOAD FUNCTIONS
// ===================================================================

/**
 * Upload files to the server
 * @param {string} draftId - Draft ID
 * @param {Object} files - Object containing files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
async function uploadFiles(draftId, files, options = {}) {
    try {
        console.log('📤 Uploading files...', { draftId, fileCount: Object.keys(files).length });

        const formData = new FormData();
        formData.append('draftId', draftId);

        // Add files to form data
        Object.entries(files).forEach(([key, file]) => {
            if (file) {
                formData.append(key, file);
            }
        });

        // Add additional data if provided
        if (options.additionalData) {
            Object.entries(options.additionalData).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Files uploaded successfully:', result);

        return result;
    } catch (error) {
        console.error('❌ Error uploading files:', error);
        throw error;
    }
}

/**
 * Upload event proposal files
 * @param {string} draftId - Draft ID
 * @param {FormData} formData - Form data containing files
 * @param {string} eventType - Event type ('school-based' or 'community-based')
 * @returns {Promise<Object>} Upload result
 */
async function uploadEventProposalFiles(draftId, formData, eventType) {
    try {
        console.log('📤 Uploading event proposal files...', { draftId, eventType });

        const response = await fetch(`/api/proposals/${draftId}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Event proposal files uploaded successfully:', result);

        return result;
    } catch (error) {
        console.error('❌ Error uploading event proposal files:', error);
        throw error;
    }
}

/**
 * Upload reporting files
 * @param {string} draftId - Draft ID
 * @param {FormData} formData - Form data containing files
 * @returns {Promise<Object>} Upload result
 */
async function uploadReportingFiles(draftId, formData) {
    try {
        console.log('📤 Uploading reporting files...', { draftId });

        const response = await fetch(`/api/proposals/${draftId}/reporting`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Reporting files uploaded successfully:', result);

        return result;
    } catch (error) {
        console.error('❌ Error uploading reporting files:', error);
        throw error;
    }
}

// ===================================================================
// FILE UTILITY FUNCTIONS
// ===================================================================

/**
 * Convert file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} File extension
 */
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Check if file is an image
 * @param {File} file - The file to check
 * @returns {boolean} True if file is an image
 */
function isImageFile(file) {
    return file.type.startsWith('image/');
}

/**
 * Check if file is a PDF
 * @param {File} file - The file to check
 * @returns {boolean} True if file is a PDF
 */
function isPdfFile(file) {
    return file.type === 'application/pdf';
}

/**
 * Check if file is a document (Word, Excel, etc.)
 * @param {File} file - The file to check
 * @returns {boolean} True if file is a document
 */
function isDocumentFile(file) {
    const documentTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return documentTypes.includes(file.type);
}

/**
 * Create a preview URL for a file
 * @param {File} file - The file to create preview for
 * @returns {string} Preview URL
 */
function createFilePreview(file) {
    if (isImageFile(file)) {
        return URL.createObjectURL(file);
    }
    return null;
}

/**
 * Clean up file preview URL
 * @param {string} url - The preview URL to clean up
 */
function cleanupFilePreview(url) {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

// ===================================================================
// EXPORTS
// ===================================================================

export {
    cleanupFilePreview, createFilePreview, FILE_VALIDATION_RULES, formatFileSize,
    getFileExtension, isDocumentFile, isImageFile,
    isPdfFile, uploadEventProposalFiles, uploadFiles, uploadReportingFiles, validateFile,
    validateFiles
};

