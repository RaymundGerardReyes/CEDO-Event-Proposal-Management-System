import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/student/ui/alert";
import { Button } from "@/components/dashboard/student/ui/button";
import { AlertCircle } from "lucide-react";

/**
 * Debug Panel Component
 */
export const DebugPanel = ({
    formData,
    localStorageFormData,
    recoveryAttempted,
    componentMountedRef,
    onNext,
    handleAutoFill,
    handleClearFields,
    handleQuickTest,
    handleTestNavigation,
    handleDirectNavigationTest,
    handleBackendTest,
    handleSaveTest,
    toast
}) => {
    const handleAnalyzeParentState = () => {
        console.log('🔍 === COMPLETE PARENT STATE ANALYSIS ===');
        console.log('1. Parent formData received by Section 3:');
        console.log('   - Keys:', Object.keys(formData || {}));
        console.log('   - organizationName:', formData?.organizationName);
        console.log('   - contactEmail:', formData?.contactEmail);
        console.log('   - proposalId variants:', {
            id: formData?.id,
            proposalId: formData?.proposalId,
            organization_id: formData?.organization_id
        });
        console.log('   - Full object:', formData);

        console.log('2. LocalStorage check:');
        const possibleKeys = ['eventProposalFormData', 'cedoFormData', 'formData', 'submitEventFormData'];
        possibleKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`   - ${key}:`, {
                        hasOrgName: !!parsed.organizationName,
                        hasContactEmail: !!parsed.contactEmail,
                        orgName: parsed.organizationName,
                        contactEmail: parsed.contactEmail
                    });
                } catch (e) {
                    console.log(`   - ${key}: Invalid JSON`);
                }
            } else {
                console.log(`   - ${key}: Not found`);
            }
        });

        console.log('3. Component state:');
        console.log('   - recoveryAttempted:', recoveryAttempted);
        console.log('   - localStorageFormData:', localStorageFormData);
        console.log('   - componentMounted:', componentMountedRef.current);

        console.log('4. onNext function analysis:');
        console.log('   - onNext type:', typeof onNext);
        console.log('   - onNext function:', onNext);
        console.log('   - onNext toString:', onNext?.toString?.());
        console.log('   - onNext name:', onNext?.name);

        console.log('5. Recommendations:');
        if (!formData?.organizationName || !formData?.contactEmail) {
            console.log('   ❌ Parent formData is missing Section 2 data');
            console.log('   🔧 Solution: Check SubmitEventFlow.jsx state management');
            console.log('   🔧 Alternative: Click "Force Recovery" button to recover from localStorage');
        } else {
            console.log('   ✅ Parent formData contains required Section 2 data');
        }
    };

    const handleForceRecovery = async () => {
        console.log('🔄 FORCE RECOVERY: Manually triggering recovery process...');

        try {
            const possibleKeys = [
                'eventProposalFormData',
                'cedoFormData',
                'formData',
                'submitEventFormData'
            ];

            let recoveredData = null;

            for (const key of possibleKeys) {
                const savedData = localStorage.getItem(key);
                if (savedData) {
                    try {
                        const parsedData = JSON.parse(savedData);
                        console.log(`🔍 MANUAL RECOVERY: Checking ${key}:`, parsedData);

                        if (parsedData.organizationName && parsedData.contactEmail) {
                            recoveredData = parsedData;
                            console.log(`✅ MANUAL RECOVERY: Found complete data in ${key}`);
                            break;
                        }
                    } catch (parseError) {
                        console.warn(`Failed to parse ${key}:`, parseError);
                    }
                }
            }

            if (recoveredData) {
                console.log('✅ MANUAL RECOVERY: Successfully recovered data:', recoveredData);
                toast({
                    title: "Recovery Successful",
                    description: `Recovered organization data: ${recoveredData.organizationName}`,
                    variant: "default",
                });
            } else {
                console.warn('⚠️ MANUAL RECOVERY: No data found in localStorage');
                toast({
                    title: "No Recovery Data",
                    description: "No organization data found in localStorage. Please complete Section 2 first.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('❌ MANUAL RECOVERY FAILED:', error);
            toast({
                title: "Recovery Failed",
                description: "Manual recovery failed. Please complete Section 2 first.",
                variant: "destructive",
            });
        }
    };

    return (
        <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-600">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Section 3 Debug Information</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
                <div><strong>Parent FormData Status:</strong></div>
                <div className="ml-4 text-xs">
                    - Organization Name: <code className={formData?.organizationName ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {formData?.organizationName || 'MISSING ❌'}
                    </code><br />
                    - Contact Email: <code className={formData?.contactEmail ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {formData?.contactEmail || 'MISSING ❌'}
                    </code><br />
                    - Proposal ID: <code className={(formData?.id || formData?.proposalId) ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {formData?.id || formData?.proposalId || 'MISSING ❌'}
                    </code><br />
                    - Form Data Keys ({Object.keys(formData || {}).length}): <code>{Object.keys(formData || {}).join(', ')}</code><br />
                    - <strong>Section 2 Data Complete:</strong> <code className={(formData?.organizationName && formData?.contactEmail) ? 'text-green-600 font-semibold bg-green-100 px-1 rounded' : 'text-red-600 font-semibold bg-red-100 px-1 rounded'}>
                        {(formData?.organizationName && formData?.contactEmail) ? 'YES ✅' : 'NO ❌ CRITICAL ISSUE'}
                    </code>
                </div>
                <div><strong>Recovery Status:</strong></div>
                <div className="ml-4 text-xs">
                    - Recovery Attempted: <code>{String(recoveryAttempted)}</code><br />
                    - LocalStorage Data Available: <code>{String(!!localStorageFormData)}</code><br />
                    {localStorageFormData && (
                        <>
                            - Recovered Org Name: <code>{localStorageFormData.organizationName || 'N/A'}</code><br />
                            - Recovered Email: <code>{localStorageFormData.contactEmail || 'N/A'}</code><br />
                            - Recovered Proposal ID: <code>{localStorageFormData.id || localStorageFormData.proposalId || 'N/A'}</code>
                        </>
                    )}
                </div>
                <div className="flex gap-2 mt-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoFill}
                        className="text-xs bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/50"
                    >
                        🧪 Auto-Fill All Fields
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearFields}
                        className="text-xs bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/50"
                    >
                        🗑️ Clear All Fields
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleQuickTest}
                        className="text-xs bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/50"
                    >
                        ⚡ Quick Test (Fill + Save)
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestNavigation}
                        className="text-xs bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-600 dark:hover:bg-purple-900/50"
                    >
                        🚀 Test Navigation (Fill + Next)
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDirectNavigationTest}
                        className="text-xs"
                    >
                        🚀 Test Navigation Only
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBackendTest}
                        className="text-xs"
                    >
                        🔌 Test Backend
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSaveTest}
                        className="text-xs"
                    >
                        🧪 Test Save Function
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAnalyzeParentState}
                        className="text-xs"
                    >
                        🔍 Analyze Parent State
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleForceRecovery}
                        className="text-xs"
                    >
                        🔄 Force Recovery
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}; 