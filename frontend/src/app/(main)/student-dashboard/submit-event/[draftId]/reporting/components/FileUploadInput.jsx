/**
 * Reusable File Upload Input Component
 * Handles file validation, progress tracking, and error display
 */

import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { CheckCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { FILE_VALIDATION, validateFile } from "../utils/helpers.js";

/**
 * File upload input component with validation and progress
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.label - Label text
 * @param {string} props.description - Description text
 * @param {string} props.fileType - File type key for validation
 * @param {string[]} props.validFormats - Valid file formats
 * @param {string} props.namingPattern - Optional naming pattern
 * @param {string} props.organizationName - Organization name for pattern validation
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.required - Whether input is required
 * @param {string} props.error - Error message to display
 * @param {File} props.selectedFile - Currently selected file
 * @param {number} props.uploadProgress - Upload progress (0-100)
 * @param {string} props.existingFileName - Name of existing uploaded file
 * @param {string} props.existingFilePath - Path of existing uploaded file
 * @returns {JSX.Element} File upload input component
 */
export const FileUploadInput = ({
    id,
    label,
    description,
    fileType,
    validFormats = [],
    namingPattern = null,
    organizationName = '',
    onFileSelect,
    disabled = false,
    required = false,
    error = null,
    selectedFile = null,
    uploadProgress = 0,
    existingFileName = null,
    existingFilePath = null
}) => {
    const [dragOver, setDragOver] = useState(false);

    /**
     * Handle file selection with validation
     */
    const handleFileSelect = useCallback((file) => {
        if (!file || disabled) return;

        const validationErrors = validateFile(file, validFormats, namingPattern, organizationName);

        if (validationErrors.length > 0) {
            onFileSelect(null, validationErrors.join(', '));
            return;
        }

        onFileSelect(file, null);
    }, [validFormats, namingPattern, organizationName, onFileSelect, disabled]);

    /**
     * Handle input change event
     */
    const handleInputChange = useCallback((e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    }, [handleFileSelect]);

    /**
     * Handle drag and drop events
     */
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (!disabled) {
            setDragOver(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [disabled, handleFileSelect]);

    // Check if file is already uploaded
    const hasExistingFile = existingFilePath && existingFileName;
    const hasSelectedFile = selectedFile && !error;
    const isUploading = uploadProgress > 0 && uploadProgress < 100;

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="flex items-center">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {description && (
                <p className="text-sm text-gray-600">{description}</p>
            )}

            {/* Show existing file if already uploaded */}
            {hasExistingFile && !selectedFile && (
                <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <div>
                            <span className="font-medium">File uploaded: {existingFileName}</span>
                            {existingFilePath && (
                                <p className="text-xs text-green-600 mt-1">
                                    Stored in database: {existingFilePath.substring(0, 50)}...
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Download button for existing files */}
                    {existingFilePath && (
                        <button
                            type="button"
                            onClick={() => {
                                // Create download link - you'll need to implement the download endpoint
                                const downloadUrl = existingFilePath.startsWith('http')
                                    ? existingFilePath
                                    : `/api/proposals/files/download-legacy/${existingFilePath}`;
                                window.open(downloadUrl, '_blank');
                            }}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                            Download
                        </button>
                    )}
                </div>
            )}

            {/* Show file input if no existing file or user is changing file */}
            {(!hasExistingFile || selectedFile) && (
                <>
                    <div
                        className={`relative border-2 border-dashed rounded-md p-4 transition-colors ${dragOver
                            ? 'border-blue-400 bg-blue-50'
                            : disabled
                                ? 'border-gray-200 bg-gray-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <Input
                            id={id}
                            type="file"
                            accept={validFormats.join(',')}
                            onChange={handleInputChange}
                            disabled={disabled}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                {dragOver
                                    ? 'Drop file here'
                                    : 'Click to select file or drag and drop'
                                }
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Accepted formats: {validFormats.join(', ')}
                            </p>
                            {namingPattern && organizationName && (
                                <p className="text-xs text-gray-500">
                                    Expected format: {organizationName.replace(/\s+/g, "")}{namingPattern}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Upload progress */}
                    {isUploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    )}

                    {/* Selected file display */}
                    {hasSelectedFile && !isUploading && (
                        <div className="flex items-center text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span>{selectedFile.name}</span>
                            <span className="ml-2 text-gray-500">
                                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                        </div>
                    )}

                    {/* Error display */}
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                </>
            )}
        </div>
    );
};

/**
 * Predefined file upload components for common file types
 */

export const AccomplishmentReportUpload = (props) => (
    <FileUploadInput
        {...props}
        fileType="accomplishmentReport"
        validFormats={FILE_VALIDATION.ACCOMPLISHMENT_REPORT.formats}
        namingPattern={FILE_VALIDATION.ACCOMPLISHMENT_REPORT.namingPattern}
        label="Accomplishment Report Documentation"
        description="Must be in PDF or DOCS file format. File name format: OrganizationName_AR"
    />
);

export const PreRegistrationUpload = (props) => (
    <FileUploadInput
        {...props}
        fileType="preRegistrationList"
        validFormats={FILE_VALIDATION.CSV_FILES.formats}
        label="Pre-Registration Attendee List"
        description="Upload the list of expected participants (CSV format only)"
    />
);

export const FinalAttendanceProofUpload = (props) => (
    <FileUploadInput
        {...props}
        fileType="finalAttendanceProof"
        validFormats={["application/pdf", "image/png", "image/jpeg"]}
        label="Final Attendance Proof"
        description="Please upload a photo or PDF of the final attendance sheet."
    />
);

export const FinalAttendanceUpload = (props) => (
    <FileUploadInput
        {...props}
        fileType="finalAttendanceList"
        validFormats={FILE_VALIDATION.CSV_FILES.formats}
        label="Final Attendance List"
        description="Upload the final list of actual attendees (CSV format only)"
    />
);

export default FileUploadInput; 