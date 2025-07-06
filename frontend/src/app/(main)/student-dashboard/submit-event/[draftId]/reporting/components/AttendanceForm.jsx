/**
 * Attendance Form Component
 * Handles file uploads for attendance tracking in Section 5
 * Now loads data from MySQL database based on proposal ID
 */

import { Label } from "@/components/dashboard/student/ui/label";
import { Textarea } from "@/components/dashboard/student/ui/textarea";
import { config } from "@/lib/utils";
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AccomplishmentReportUpload, FinalAttendanceProofUpload, FinalAttendanceUpload, PreRegistrationUpload } from "./FileUploadInput.jsx";

/**
 * Attendance form component for file uploads with database integration
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Object} props.errors - Form validation errors
 * @param {Object} props.uploadedFiles - Currently uploaded files
 * @param {Object} props.uploadProgress - Upload progress for each file
 * @param {Function} props.onFieldChange - Field change handler
 * @param {Function} props.onFileUpload - File upload handler
 * @param {boolean} props.disabled - Whether form is disabled
 * @param {string|number} props.proposalId - Proposal ID from URL params
 * @returns {JSX.Element} Attendance form component
 */
export const AttendanceForm = ({
    formData = {},
    errors = {},
    uploadedFiles = {},
    uploadProgress = {},
    onFieldChange,
    onFileUpload,
    disabled = false,
    proposalId
}) => {
    // Database state management
    const [databaseData, setDatabaseData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dbError, setDbError] = useState(null);
    const [lastFetched, setLastFetched] = useState(null);

    /**
     * Fetch proposal data from MySQL database
     */
    const fetchProposalData = useCallback(async () => {
        if (!proposalId) {
            setDbError('No proposal ID provided');
            return;
        }

        setLoading(true);
        setDbError(null);

        try {
            console.log('🔍 AttendanceForm: Fetching proposal data for ID:', proposalId);

            // Make request directly to backend server, not through Next.js API routing
            const backendUrl = config.backendUrl;
            // Prefer the hybrid endpoint that works in both MySQL + MongoDB stacks
            let apiUrl = `${backendUrl}/api/mongodb-unified/proposal/${proposalId}`;

            // Fallback to old debug endpoint if the unified one returns 404

            console.log('🌐 AttendanceForm: Backend URL env var:', config.backendUrl);
            console.log('🌐 AttendanceForm: Using backend URL:', backendUrl);
            console.log('🌐 AttendanceForm: Full API URL:', apiUrl);

            let response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            console.log('📡 AttendanceForm: Backend response status:', response.status, response.statusText);

            if (!response.ok) {
                // If unified endpoint 404, try legacy MySQL debug path
                if (response.status === 404 && apiUrl.includes('/api/mongodb-unified/')) {
                    console.warn('Unified proposal endpoint returned 404 – falling back to /api/proposals/debug/:id');
                    apiUrl = `${backendUrl}/api/proposals/debug/${proposalId}`;
                    response = await fetch(apiUrl, {
                        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
                    });
                }

                const errorData = await response.json().catch(() => ({}));
                if (response.status === 404) {
                    const errorMessage = errorData.debug?.recentProposalIds?.length > 0
                        ? `Proposal ID ${proposalId} not found. Available proposals: ${errorData.debug.recentProposalIds.join(', ')}`
                        : 'Proposal not found in database. Please check if the proposal has been created.';
                    throw new Error(errorMessage);
                } else if (response.status === 403) {
                    throw new Error('Not authorized to view this proposal');
                } else {
                    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch proposal data');
            }

            console.log('✅ AttendanceForm: Database data loaded successfully');
            setDatabaseData(result.proposal);
            setLastFetched(new Date());

            // Auto-populate form fields from database if not already set
            if (onFieldChange && result.proposal) {
                const dbData = result.proposal;

                // Only update if current form data is empty or missing
                if (!formData.reportDescription && dbData.reportDescription) {
                    onFieldChange('reportDescription', dbData.reportDescription);
                }
                if (!formData.attendanceCount && dbData.attendanceCount) {
                    onFieldChange('attendanceCount', dbData.attendanceCount.toString());
                }
                if (!formData.organizationName && dbData.organizationName) {
                    onFieldChange('organizationName', dbData.organizationName);
                }
            }

        } catch (err) {
            console.error('❌ AttendanceForm: Error fetching proposal data:', err);
            setDbError(err.message);
        } finally {
            setLoading(false);
        }
    }, [proposalId, onFieldChange, formData]);

    /**
     * Handle file selection for different file types
     */
    const handleFileSelect = (fileType) => (file, error) => {
        if (onFileUpload) {
            onFileUpload(fileType, file, error);
        }
    };

    /**
     * Get effective form data combining props and database data
     */
    const getEffectiveFormData = useCallback(() => {
        if (!databaseData) return formData;

        return {
            ...formData,
            // Use database values as fallbacks
            organizationName: formData.organizationName || databaseData.organizationName,
            reportDescription: formData.reportDescription || databaseData.reportDescription,
            attendanceCount: formData.attendanceCount || (databaseData.attendanceCount ? databaseData.attendanceCount.toString() : ''),
            // File references from database
            accomplishment_report_file_name: databaseData.accomplishmentReportFileName,
            accomplishment_report_file_path: databaseData.accomplishmentReportFilePath,
            pre_registration_file_name: databaseData.preRegistrationFileName,
            pre_registration_file_path: databaseData.preRegistrationFilePath,
            final_attendance_file_name: databaseData.finalAttendanceFileName,
            final_attendance_file_path: databaseData.finalAttendanceFilePath,
        };
    }, [formData, databaseData]);

    /**
     * Refresh data from database
     */
    const refreshData = useCallback(() => {
        fetchProposalData();
    }, [fetchProposalData]);

    // Load data when component mounts or proposalId changes
    useEffect(() => {
        if (proposalId) {
            fetchProposalData();
        }
    }, [proposalId, fetchProposalData]);

    const effectiveFormData = getEffectiveFormData();

    return (
        <div className="space-y-6">
            {/* Database Status Indicator */}
            {proposalId && (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {loading ? (
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin text-blue-600" />
                            ) : dbError ? (
                                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                            ) : databaseData ? (
                                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                            ) : null}

                            <div>
                                <h4 className="font-medium text-blue-800">
                                    Database Connection Status
                                </h4>
                                <p className="text-sm text-blue-600">
                                    {loading ? 'Loading proposal data...' :
                                        dbError ? `Error: ${dbError}` :
                                            databaseData ? `Data loaded from proposal ID: ${proposalId}` :
                                                'No data loaded'}
                                </p>
                                {lastFetched && (
                                    <p className="text-xs text-blue-500">
                                        Last updated: {lastFetched.toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {!loading && (
                            <button
                                onClick={refreshData}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                disabled={loading}
                            >
                                Refresh
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Database File Status */}
            {databaseData && (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Files in Database</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                            {databaseData.accomplishmentReportFileName ? (
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                            )}
                            <span>Accomplishment Report: {databaseData.accomplishmentReportFileName || 'Not uploaded'}</span>
                        </div>
                        <div className="flex items-center">
                            {databaseData.preRegistrationFileName ? (
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                            )}
                            <span>Pre-Registration List: {databaseData.preRegistrationFileName || 'Not uploaded'}</span>
                        </div>
                        <div className="flex items-center">
                            {databaseData.finalAttendanceFileName ? (
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                            )}
                            <span>Final Attendance List: {databaseData.finalAttendanceFileName || 'Not uploaded'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Notes Section */}
            <div>
                <Label htmlFor="description" className="flex items-center">
                    Additional Notes (optional)
                    {databaseData?.reportDescription && (
                        <span className="ml-2 text-xs text-green-600">(Loaded from database)</span>
                    )}
                </Label>
                <Textarea
                    id="description"
                    name="reportDescription"
                    placeholder="Additional notes about your post-event report"
                    value={effectiveFormData.reportDescription || ""}
                    onChange={(e) => onFieldChange(e.target.name, e.target.value)}
                    className="min-h-[100px]"
                    disabled={disabled}
                />
            </div>

            {/* Attendance Tracking Section */}
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <h3 className="font-medium mb-4 text-amber-800">Attendance Tracking</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pre-Registration List */}
                    <div>
                        <PreRegistrationUpload
                            id="preRegistrationFile"
                            onFileSelect={handleFileSelect('preRegistrationList')}
                            disabled={disabled}
                            required={false}
                            error={errors.preRegistrationList}
                            selectedFile={uploadedFiles.preRegistrationList}
                            uploadProgress={uploadProgress.preRegistrationList}
                            existingFileName={effectiveFormData.pre_registration_file_name}
                            existingFilePath={effectiveFormData.pre_registration_file_path}
                            organizationName={effectiveFormData.organizationName}
                        />
                    </div>

                    {/* Final Attendance List */}
                    <div>
                        <FinalAttendanceUpload
                            id="finalAttendanceFile"
                            onFileSelect={handleFileSelect('finalAttendanceList')}
                            disabled={disabled}
                            required={false}
                            error={errors.finalAttendanceList}
                            selectedFile={uploadedFiles.finalAttendanceList}
                            uploadProgress={uploadProgress.finalAttendanceList}
                            existingFileName={effectiveFormData.final_attendance_file_name}
                            existingFilePath={effectiveFormData.final_attendance_file_path}
                            organizationName={effectiveFormData.organizationName}
                        />
                    </div>
                </div>

                {/* Final Attendance Proof */}
                <div className="mt-6">
                    <FinalAttendanceProofUpload
                        id="finalAttendanceProofFile"
                        onFileSelect={handleFileSelect('finalAttendanceProof')}
                        disabled={disabled}
                        required={true}
                        error={errors.finalAttendanceProof}
                        selectedFile={uploadedFiles.finalAttendanceProof}
                        uploadProgress={uploadProgress.finalAttendanceProof}
                        existingFileName={effectiveFormData.final_attendance_proof_file_name}
                        existingFilePath={effectiveFormData.final_attendance_proof_file_path}
                        organizationName={effectiveFormData.organizationName}
                    />
                </div>

                {/* Attendance Count Input */}
                <div className="mt-4">
                    <Label htmlFor="attendanceCount" className="flex items-center">
                        Final Attendance Count (optional)
                        {databaseData?.attendanceCount && (
                            <span className="ml-2 text-xs text-green-600">
                                (Database: {databaseData.attendanceCount})
                            </span>
                        )}
                    </Label>
                    <input
                        id="attendanceCount"
                        name="attendanceCount"
                        type="number"
                        min="0"
                        placeholder="Enter total number of attendees"
                        value={effectiveFormData.attendanceCount || ""}
                        onChange={(e) => onFieldChange(e.target.name, e.target.value)}
                        className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1"
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This should match the count in your final attendance list
                    </p>
                </div>
            </div>

            {/* Accomplishment Report Section */}
            <div>
                <AccomplishmentReportUpload
                    id="accomplishmentReport"
                    onFileSelect={handleFileSelect('accomplishmentReport')}
                    disabled={disabled}
                    required={true}
                    error={errors.accomplishmentReport}
                    selectedFile={uploadedFiles.accomplishmentReport}
                    uploadProgress={uploadProgress.accomplishmentReport}
                    existingFileName={effectiveFormData.accomplishment_report_file_name}
                    existingFilePath={effectiveFormData.accomplishment_report_file_path}
                    organizationName={effectiveFormData.organizationName}
                />
            </div>

            {/* File Upload Guidelines */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">File Upload Guidelines</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• All files must be under 10MB in size</li>
                    <li>• CSV files should include headers and be properly formatted</li>
                    <li>• Accomplishment reports should be comprehensive and include event photos if available</li>
                    <li>• File names should follow the suggested format for easier identification</li>
                    <li>• Ensure all uploaded files are final versions before submission</li>
                    <li>• Files are automatically saved to the database upon successful upload</li>
                </ul>
            </div>

            {/* Upload Summary */}
            {(uploadedFiles.accomplishmentReport || uploadedFiles.preRegistrationList || uploadedFiles.finalAttendanceList) && (
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Upload Summary</h4>
                    <div className="text-sm text-green-700 space-y-1">
                        {uploadedFiles.accomplishmentReport && (
                            <p>✓ Accomplishment Report: {uploadedFiles.accomplishmentReport.name}</p>
                        )}
                        {uploadedFiles.preRegistrationList && (
                            <p>✓ Pre-Registration List: {uploadedFiles.preRegistrationList.name}</p>
                        )}
                        {uploadedFiles.finalAttendanceList && (
                            <p>✓ Final Attendance List: {uploadedFiles.finalAttendanceList.name}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceForm; 