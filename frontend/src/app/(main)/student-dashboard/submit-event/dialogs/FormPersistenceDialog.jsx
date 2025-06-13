"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ClockIcon, InfoIcon, SettingsIcon, UserIcon } from "lucide-react"
import { useEffect, useState } from "react"

/**
 * Enhanced Dialog to inform users about restored form data
 * Now includes configuration options to disable persistence entirely
 */
export function FormPersistenceDialog({
    open,
    onOpenChange,
    onContinue,
    onStartFresh,
    restoredData = {}
}) {
    const [config, setConfig] = useState(null);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // Load configuration
    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('../FormPersistenceConfig').then(({ getPersistenceConfig }) => {
                setConfig(getPersistenceConfig());
            });
        }
    }, []);

    // If persistence is disabled via config, don't show the dialog
    useEffect(() => {
        if (config && typeof window !== 'undefined') {
            import('../FormPersistenceConfig').then(({ shouldShowPersistenceDialog }) => {
                if (!shouldShowPersistenceDialog()) {
                    console.log('🚫 DIALOG BLOCKED: Persistence disabled via configuration');
                    onOpenChange(false);
                }
            });
        }
    }, [config, onOpenChange]);

    // Count meaningful data points
    const dataSummary = {
        organizationName: restoredData.organizationName || '',
        eventNames: [
            restoredData.schoolEventName,
            restoredData.communityEventName
        ].filter(Boolean),
        lastSection: restoredData.currentSection || 'overview',
        contactInfo: restoredData.contactName || restoredData.contactEmail ? 'Available' : 'Not set'
    };

    const hasData = dataSummary.organizationName || dataSummary.eventNames.length > 0;
    const dataCount = [
        dataSummary.organizationName && 'Organization info',
        dataSummary.eventNames.length > 0 && 'Event details',
        dataSummary.contactInfo === 'Available' && 'Contact info'
    ].filter(Boolean).length;

    // Handle disabling persistence entirely
    const handleDisablePersistence = async () => {
        if (typeof window !== 'undefined') {
            const { nukeAllFormData, FORM_PERSISTENCE_CONFIG, PERSISTENCE_MODES } = await import('../FormPersistenceConfig');

            // Update configuration to disable persistence
            FORM_PERSISTENCE_CONFIG.mode = PERSISTENCE_MODES.DISABLED;
            FORM_PERSISTENCE_CONFIG.forceCleanStart = true;
            FORM_PERSISTENCE_CONFIG.disableDialogs = true;
            FORM_PERSISTENCE_CONFIG.clearDataOnPageLoad = true;

            // Clear all existing data
            nukeAllFormData();

            console.log('🚫 PERSISTENCE COMPLETELY DISABLED');
            console.log('📋 New config:', FORM_PERSISTENCE_CONFIG);

            // Close dialog and start fresh
            onOpenChange(false);
            onStartFresh();
        }
    };

    // Handle never asking again for this session
    const handleNeverAskAgain = () => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('formSessionChoice', 'never_ask');
            sessionStorage.setItem('neverShowPersistenceDialog', 'true');
            console.log('⏭️ NEVER ASK AGAIN: Set for this session');
        }
        onStartFresh();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-cedo-blue">
                        <ClockIcon className="h-5 w-5" />
                        Previous Session Found
                    </DialogTitle>
                    <DialogDescription>
                        We found form data from your previous session. What would you like to do?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {hasData && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <InfoIcon className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-medium">Restored data preview:</p>
                                    <div className="text-sm space-y-1">
                                        {dataSummary.organizationName && (
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-3 w-3" />
                                                <span>Organization: {dataSummary.organizationName}</span>
                                            </div>
                                        )}
                                        {dataSummary.eventNames.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <InfoIcon className="h-3 w-3" />
                                                <span>Events: {dataSummary.eventNames.join(', ')}</span>
                                            </div>
                                        )}
                                        {restoredData.contactName && (
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-3 w-3" />
                                                <span>Contact: {restoredData.contactName}</span>
                                            </div>
                                        )}
                                        {restoredData.organizationType && (
                                            <div className="flex items-center gap-2">
                                                <InfoIcon className="h-3 w-3" />
                                                <span>Type: {restoredData.organizationType.replace('-', ' ')}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <ClockIcon className="h-3 w-3" />
                                            <span>Last section: {dataSummary.lastSection}</span>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-2">
                                            Found {dataCount} section{dataCount !== 1 ? 's' : ''} with data
                                            {restoredData.schoolGPOAFile && <span> • Files attached</span>}
                                        </div>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> If you choose "Start Fresh", all previously saved data will be permanently lost.
                        </p>
                    </div>

                    {/* Advanced Options Toggle */}
                    <div className="border-t pt-3">
                        <button
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                            <SettingsIcon className="h-4 w-4" />
                            Advanced Options
                        </button>

                        {showAdvancedOptions && (
                            <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-600 mb-2">
                                    These options will change how the form handles data persistence:
                                </p>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNeverAskAgain}
                                    className="w-full text-xs"
                                >
                                    Never Ask Again (This Session)
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDisablePersistence}
                                    className="w-full text-xs border-red-200 text-red-700 hover:bg-red-50"
                                >
                                    🚫 Completely Disable Form Persistence
                                </Button>

                                <p className="text-xs text-red-600 mt-1">
                                    ⚠️ "Disable Persistence" will prevent all form data saving and ensure you always start with a clean form.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={onStartFresh}
                        className="w-full sm:w-auto"
                    >
                        Start Fresh
                    </Button>
                    <Button
                        onClick={onContinue}
                        className="w-full sm:w-auto bg-cedo-blue hover:bg-cedo-blue/90"
                    >
                        Continue Previous Session
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 