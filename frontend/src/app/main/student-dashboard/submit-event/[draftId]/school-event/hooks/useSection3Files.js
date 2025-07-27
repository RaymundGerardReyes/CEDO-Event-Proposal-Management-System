import { useCallback, useEffect, useState } from "react";
import { downloadFileFromMongoDB, fetchProposalIdFromDatabase, getAllFiles } from "../schoolEventUtils";

/**
 * Custom hook to manage Section 3 file operations
 */
export const useSection3Files = ({
    proposalIdForFiles,
    organizationDataForFiles,
    componentMountedRef,
    formData,
    toast
}) => {

    // File state
    const [existingFiles, setExistingFiles] = useState({});
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Load existing files when component mounts or proposalId changes
    useEffect(() => {
        const loadExistingFiles = async () => {
            console.log('📁 LOAD EXISTING FILES: Starting file loading process', {
                proposalIdForFiles,
                organizationDataForFiles,
                componentMounted: componentMountedRef.current
            });

            // Use memoized proposal ID
            let proposalId = proposalIdForFiles;

            // If no ID found in formData, try to search database
            if (!proposalId && organizationDataForFiles.organizationName && organizationDataForFiles.contactEmail) {
                try {
                    console.log('🔍 LOAD EXISTING FILES: Searching for proposal ID in database...', {
                        organizationName: organizationDataForFiles.organizationName,
                        contactEmail: organizationDataForFiles.contactEmail
                    });
                    proposalId = await fetchProposalIdFromDatabase(organizationDataForFiles);
                    console.log('✅ LOAD EXISTING FILES: Found proposal ID from database:', proposalId);
                } catch (error) {
                    console.warn('⚠️ LOAD EXISTING FILES: Could not fetch proposal ID for file loading:', error.message);
                    // Don't return here, continue with empty state
                }
            }

            if (!proposalId) {
                console.log('📁 LOAD EXISTING FILES: No proposal ID found for file loading, using empty state');
                setExistingFiles({}); // Set empty state explicitly
                return;
            }

            setLoadingFiles(true);
            console.log('🔄 LOAD EXISTING FILES: Starting file fetch for proposal:', proposalId);

            try {
                console.log('📁 LOAD EXISTING FILES: Calling getAllFiles API...');
                const files = await getAllFiles(proposalId);
                console.log('📁 LOAD EXISTING FILES: Successfully loaded files from MongoDB:', {
                    proposalId,
                    filesFound: Object.keys(files || {}).length,
                    files: files
                });

                // Log each file found
                if (files && Object.keys(files).length > 0) {
                    Object.entries(files).forEach(([fileType, fileInfo]) => {
                        console.log(`📄 FOUND FILE: ${fileType}`, {
                            originalName: fileInfo.originalName,
                            filename: fileInfo.filename,
                            size: fileInfo.size ? `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
                            uploadedAt: fileInfo.uploadedAt
                        });
                    });
                } else {
                    console.log('📁 LOAD EXISTING FILES: No files found in MongoDB for proposal:', proposalId);
                }

                setExistingFiles(files || {}); // Ensure it's always an object
            } catch (error) {
                console.error('❌ LOAD EXISTING FILES: Error loading existing files:', {
                    proposalId,
                    error: error.message,
                    stack: error.stack
                });
                setExistingFiles({}); // Set empty state on error
                // Don't show error toast here as this is background loading
            } finally {
                setLoadingFiles(false);
                console.log('🔄 LOAD EXISTING FILES: File loading process completed');
            }
        };

        // Only load files if we have the necessary data and component is mounted
        if (componentMountedRef.current) {
            console.log('📁 LOAD EXISTING FILES: Component mounted, initiating file load');
            // Wrap in try-catch to prevent any uncaught errors
            try {
                loadExistingFiles();
            } catch (error) {
                console.error('❌ LOAD EXISTING FILES: Unexpected error in loadExistingFiles:', error);
                setLoadingFiles(false);
                setExistingFiles({});
            }
        } else {
            console.log('📁 LOAD EXISTING FILES: Component not mounted, skipping file load');
        }
    }, [proposalIdForFiles, organizationDataForFiles, componentMountedRef]);

    // Enhanced file download handler
    const handleFileDownload = useCallback(async (fileType) => {
        console.log('📥 FILE DOWNLOAD: Initiating download process', {
            fileType,
            proposalIds: {
                proposalId: formData.proposalId,
                id: formData.id,
                _id: formData._id,
                submissionId: formData.submissionId
            },
            organizationData: {
                organizationName: formData.organizationName,
                contactEmail: formData.contactEmail
            }
        });

        let proposalId = formData.proposalId || formData.id || formData._id || formData.submissionId;

        // If no ID found in formData, try to search database
        if (!proposalId && formData.organizationName && formData.contactEmail) {
            try {
                console.log('🔍 FILE DOWNLOAD: Searching for proposal ID in database...', {
                    organizationName: formData.organizationName,
                    contactEmail: formData.contactEmail
                });
                proposalId = await fetchProposalIdFromDatabase(formData);
                console.log('✅ FILE DOWNLOAD: Found proposal ID from database:', proposalId);
            } catch (error) {
                console.error('❌ FILE DOWNLOAD: Could not fetch proposal ID for download:', error);
            }
        }

        if (!proposalId) {
            console.error('❌ FILE DOWNLOAD: No proposal ID found, cannot download file', {
                fileType,
                formDataKeys: Object.keys(formData),
                hasOrgName: !!formData.organizationName,
                hasContactEmail: !!formData.contactEmail
            });
            toast({
                title: "Download Error",
                description: "No proposal ID found. Cannot download file.",
                variant: "destructive",
            });
            return;
        }

        console.log('🔄 FILE DOWNLOAD: Starting download from MongoDB', {
            proposalId,
            fileType
        });

        try {
            const result = await downloadFileFromMongoDB(proposalId, fileType);
            console.log('✅ FILE DOWNLOAD: Download successful', {
                proposalId,
                fileType,
                filename: result.filename,
                size: result.size
            });
            toast({
                title: "Download Complete",
                description: `Successfully downloaded ${result.filename}`,
                variant: "default",
            });
        } catch (error) {
            console.error('❌ FILE DOWNLOAD: Download failed', {
                proposalId,
                fileType,
                error: error.message,
                stack: error.stack
            });
            toast({
                title: "Download Failed",
                description: error.message || "Failed to download file",
                variant: "destructive",
            });
        }
    }, [formData.proposalId, formData.id, formData._id, formData.submissionId, formData.organizationName, formData.contactEmail, toast]);

    return {
        existingFiles,
        loadingFiles,
        handleFileDownload
    };
}; 