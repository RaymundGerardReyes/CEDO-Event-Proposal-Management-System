import { useCallback } from "react";

/**
 * Custom hook to manage Section 3 debug functionality
 */
export const useSection3Debug = ({
    setLocalFormData,
    setFilePreviews,
    handleSaveData,
    handleNext,
    onNext,
    toast
}) => {

    // 🧪 AUTO-FILLER: Function to populate all fields with sample data for testing
    const handleAutoFill = useCallback(() => {
        console.log('🧪 AUTO-FILLER: Starting auto-fill process for testing...');

        // Create sample files for testing
        const createTestFile = (filename, content, type) => {
            const blob = new Blob([content], { type });
            return new File([blob], filename, { type });
        };

        // Create test files
        const testGPOAFile = createTestFile(
            'ISDA_Carmen_GPOA.pdf',
            'This is a test GPOA file content for debugging purposes.',
            'application/pdf'
        );

        const testProposalFile = createTestFile(
            'ISDA_Carmen_PP.pdf',
            'This is a test Project Proposal file content for debugging purposes.',
            'application/pdf'
        );

        // Sample data for all fields
        const sampleData = {
            schoolEventName: "Annual Science and Technology Fair 2024",
            schoolVenue: "University Gymnasium, Main Campus",
            schoolStartDate: new Date('2024-12-15'),
            schoolEndDate: new Date('2024-12-16'),
            schoolTimeStart: "09:00",
            schoolTimeEnd: "17:00",
            schoolEventType: "academic-enhancement",
            schoolEventMode: "offline",
            schoolReturnServiceCredit: "2",
            schoolTargetAudience: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Faculty"],
            schoolGPOAFile: testGPOAFile,
            schoolProposalFile: testProposalFile,
        };

        console.log('🧪 AUTO-FILLER: Sample data prepared:', sampleData);

        // Update local form data
        setLocalFormData(sampleData);

        // Update file previews
        setFilePreviews({
            schoolGPOAFile: testGPOAFile.name,
            schoolProposalFile: testProposalFile.name,
        });

        console.log('🧪 AUTO-FILLER: All fields populated with sample data');

        toast({
            title: "Auto-Fill Complete",
            description: "All fields have been populated with sample data for testing.",
            variant: "default",
        });
    }, [setLocalFormData, setFilePreviews, toast]);

    // 🧪 CLEAR FIELDS: Function to clear all fields for testing
    const handleClearFields = useCallback(() => {
        console.log('🧪 CLEAR FIELDS: Starting clear process for testing...');

        // Clear all form data
        const emptyData = {
            schoolEventName: "",
            schoolVenue: "",
            schoolStartDate: null,
            schoolEndDate: null,
            schoolTimeStart: "",
            schoolTimeEnd: "",
            schoolEventType: "",
            schoolEventMode: "",
            schoolReturnServiceCredit: "",
            schoolTargetAudience: [],
            schoolGPOAFile: null,
            schoolProposalFile: null,
        };

        console.log('🧪 CLEAR FIELDS: Clearing all fields with empty data');

        // Update local form data
        setLocalFormData(emptyData);

        // Update file previews
        setFilePreviews({
            schoolGPOAFile: "",
            schoolProposalFile: "",
        });

        // Clear file inputs
        const gpoaInput = document.getElementById('schoolGPOAFile');
        const proposalInput = document.getElementById('schoolProposalFile');
        if (gpoaInput) gpoaInput.value = "";
        if (proposalInput) proposalInput.value = "";

        console.log('🧪 CLEAR FIELDS: All fields cleared');

        toast({
            title: "Fields Cleared",
            description: "All fields have been cleared for testing.",
            variant: "default",
        });
    }, [setLocalFormData, setFilePreviews, toast]);

    // 🧪 QUICK TEST: Function to auto-fill and save for quick testing
    const handleQuickTest = useCallback(async () => {
        console.log('🧪 QUICK TEST: Starting quick test process (auto-fill + save)...');

        try {
            // First auto-fill the fields
            handleAutoFill();

            // Wait a moment for the state to update
            await new Promise(resolve => setTimeout(resolve, 500));

            // Then attempt to save
            console.log('🧪 QUICK TEST: Attempting to save auto-filled data...');
            const saveResult = await handleSaveData(true);

            if (saveResult) {
                console.log('🧪 QUICK TEST: Quick test completed successfully!');
                toast({
                    title: "Quick Test Success",
                    description: "Auto-fill and save completed successfully!",
                    variant: "default",
                });
            } else {
                console.log('🧪 QUICK TEST: Save failed during quick test');
                toast({
                    title: "Quick Test Failed",
                    description: "Auto-fill completed but save failed. Check console for details.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('🧪 QUICK TEST: Error during quick test:', error);
            toast({
                title: "Quick Test Error",
                description: "An error occurred during quick test. Check console for details.",
                variant: "destructive",
            });
        }
    }, [handleAutoFill, handleSaveData, toast]);

    // 🧪 TEST NAVIGATION: Function to test the navigation flow
    const handleTestNavigation = useCallback(async () => {
        console.log('🧪 TEST NAVIGATION: Starting navigation test...');

        try {
            // First auto-fill the fields
            handleAutoFill();

            // Wait a moment for the state to update
            await new Promise(resolve => setTimeout(resolve, 500));

            // Then test the navigation flow
            console.log('🧪 TEST NAVIGATION: Testing handleNext function...');
            await handleNext();

            console.log('🧪 TEST NAVIGATION: Navigation test completed');
            toast({
                title: "Navigation Test",
                description: "Navigation test completed. Check console for details.",
                variant: "default",
            });
        } catch (error) {
            console.error('🧪 TEST NAVIGATION: Error during navigation test:', error);
            toast({
                title: "Navigation Test Error",
                description: "An error occurred during navigation test. Check console for details.",
                variant: "destructive",
            });
        }
    }, [handleAutoFill, handleNext, toast]);

    // 🧪 DIRECT NAVIGATION TEST: Function to test navigation without save
    const handleDirectNavigationTest = useCallback(() => {
        console.log('🧪 DIRECT NAVIGATION TEST: Testing navigation without save...');
        if (typeof onNext === 'function') {
            console.log('🧪 DIRECT NAVIGATION TEST: Calling onNext(true) directly');
            try {
                onNext(true);
                console.log('✅ DIRECT NAVIGATION TEST: onNext(true) called successfully');
                toast({
                    title: "Navigation Test",
                    description: "Navigation called successfully!",
                    variant: "default",
                });
            } catch (error) {
                console.error('❌ DIRECT NAVIGATION TEST: Error calling onNext:', error);
                toast({
                    title: "Navigation Test Failed",
                    description: `Error: ${error?.message || 'Unknown error'}`,
                    variant: "destructive",
                });
            }
        } else {
            console.warn('⚠️ DIRECT NAVIGATION TEST: onNext function not available');
            toast({
                title: "Navigation Test Failed",
                description: "onNext function is not available",
                variant: "destructive",
            });
        }
    }, [onNext, toast]);

    // 🧪 BACKEND TEST: Function to test backend connectivity
    const handleBackendTest = useCallback(async () => {
        console.log('🧪 BACKEND TEST: Testing backend connectivity...');

        try {
            const backendUrl = process.env.API_URL || 'http://localhost:5000';
            const response = await fetch(`${backendUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ BACKEND TEST: Backend is running:', data);
                toast({
                    title: "Backend Test",
                    description: "Backend is running and responding!",
                    variant: "default",
                });
            } else {
                throw new Error(`Backend responded with status: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ BACKEND TEST: Backend test failed:', error);
            toast({
                title: "Backend Test Failed",
                description: `Backend is not responding: ${error.message}`,
                variant: "destructive",
            });
        }
    }, [toast]);

    // 🧪 SAVE TEST: Function to test save functionality
    const handleSaveTest = useCallback(async () => {
        console.log('🔄 TESTING SAVE WITH CURRENT DATA...');
        const success = await handleSaveData(true);
        console.log('Save test result:', success);
    }, [handleSaveData]);

    return {
        handleAutoFill,
        handleClearFields,
        handleQuickTest,
        handleTestNavigation,
        handleDirectNavigationTest,
        handleBackendTest,
        handleSaveTest
    };
}; 