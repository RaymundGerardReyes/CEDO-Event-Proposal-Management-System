"use client"

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

/**
 * Quick toggle component for developers to easily control persistence behavior
 * This can be temporarily added to any page for testing purposes
 */
export function PersistenceQuickToggle() {
    const [config, setConfig] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('./FormPersistenceConfig').then(({ getPersistenceConfig }) => {
                setConfig(getPersistenceConfig());
            });

            // Show toggle in development mode
            setIsVisible(process.env.NODE_ENV === 'development');
        }
    }, []);

    const applyPreset = async (presetName) => {
        if (typeof window !== 'undefined') {
            const { applyPresetConfig, nukeAllFormData, initializePersistenceSystem } = await import('./FormPersistenceConfig');

            // Apply the preset
            applyPresetConfig(presetName);

            // Clear existing data
            nukeAllFormData();

            // Reinitialize system
            initializePersistenceSystem();

            // Refresh the page to apply changes
            window.location.reload();
        }
    };

    const clearAllData = async () => {
        if (typeof window !== 'undefined') {
            const { nukeAllFormData } = await import('./FormPersistenceConfig');
            nukeAllFormData();
            window.location.reload();
        }
    };

    if (!isVisible || !config) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
            <h3 className="text-sm font-bold mb-2 text-gray-800">🔧 Persistence Control</h3>
            <p className="text-xs text-gray-600 mb-3">
                Current Mode: <span className="font-mono font-bold">{config.mode}</span>
            </p>

            <div className="space-y-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset('DEVELOPMENT')}
                    className="w-full text-xs"
                >
                    🧪 DEVELOPMENT MODE
                    <br />
                    <span className="text-xs text-gray-500">(Always start clean)</span>
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset('USER_FRIENDLY')}
                    className="w-full text-xs"
                >
                    😊 USER FRIENDLY
                    <br />
                    <span className="text-xs text-gray-500">(Auto-save, no dialogs)</span>
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset('PRODUCTION')}
                    className="w-full text-xs"
                >
                    🚀 PRODUCTION
                    <br />
                    <span className="text-xs text-gray-500">(Full persistence)</span>
                </Button>

                <Button
                    size="sm"
                    variant="destructive"
                    onClick={clearAllData}
                    className="w-full text-xs"
                >
                    🗑️ CLEAR ALL DATA
                </Button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
                Changes will reload the page
            </p>
        </div>
    );
}

export default PersistenceQuickToggle; 