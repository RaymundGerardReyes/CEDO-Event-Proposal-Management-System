/**
 * Reusable Status Badge Component
 * Displays various status states with appropriate styling and icons
 */

import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";

/**
 * Status badge component with different variants
 * @param {Object} props - Component props
 * @param {string} props.variant - Badge variant: 'saving', 'saved', 'error', 'online', 'offline'
 * @param {string} props.text - Text to display
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.title - Optional tooltip text
 * @param {boolean} props.animate - Whether to animate the badge
 * @returns {JSX.Element} Status badge component
 */
export const StatusBadge = ({
    variant = 'saved',
    text,
    onClick,
    title,
    animate = false
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'saving':
                return {
                    className: `text-blue-600 bg-blue-50 ${animate ? 'animate-pulse' : ''}`,
                    icon: <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                };
            case 'saved':
                return {
                    className: 'text-green-600 bg-green-50',
                    icon: <CheckCircle className="w-3 h-3 mr-1" />
                };
            case 'error':
                return {
                    className: 'text-red-600 bg-red-50',
                    icon: <AlertCircle className="w-3 h-3 mr-1" />
                };
            case 'online':
                return {
                    className: 'text-green-600 bg-green-50',
                    icon: <Wifi className="w-3 h-3 mr-1" />
                };
            case 'offline':
                return {
                    className: 'text-red-600 bg-red-50',
                    icon: <WifiOff className="w-3 h-3 mr-1" />
                };
            default:
                return {
                    className: 'text-gray-600 bg-gray-50',
                    icon: null
                };
        }
    };

    const { className, icon } = getVariantStyles();

    return (
        <span
            className={`text-xs px-2 py-1 rounded flex items-center ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={onClick}
            title={title}
        >
            {icon}
            {text}
        </span>
    );
};

/**
 * Field-level status indicator for form inputs
 * @param {Object} props - Component props
 * @param {boolean} props.isSaving - Whether field is being saved
 * @param {boolean} props.lastSaved - Last save timestamp
 * @param {string} props.saveError - Save error message
 * @returns {JSX.Element} Field status indicator
 */
export const FieldStatusIndicator = ({ isSaving, lastSaved, saveError }) => {
    if (isSaving) {
        return <RefreshCw className="w-3 h-3 ml-2 animate-spin text-blue-500" />;
    }

    if (saveError) {
        return <AlertCircle className="w-3 h-3 ml-2 text-red-500" title={saveError} />;
    }

    if (lastSaved) {
        return <CheckCircle className="w-3 h-3 ml-2 text-green-500" title={`Saved at ${new Date(lastSaved).toLocaleTimeString()}`} />;
    }

    return null;
};

/**
 * Progress bar component with enhanced styling
 * @param {Object} props - Component props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {boolean} props.isComplete - Whether progress is complete
 * @returns {JSX.Element} Progress bar component
 */
export const ProgressBar = ({ progress = 0, isComplete = false }) => {
    return (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
                className={`h-2 rounded-full transition-all duration-500 ${isComplete
                    ? 'bg-gradient-to-r from-green-400 to-green-600'
                    : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
        </div>
    );
};

/**
 * Connection status indicator
 * @returns {JSX.Element} Connection status component
 */
export const ConnectionStatus = () => {
    if (typeof navigator === 'undefined' || navigator.onLine === undefined) {
        return null;
    }

    return (
        <StatusBadge
            variant={navigator.onLine ? 'online' : 'offline'}
            text={navigator.onLine ? 'Online' : 'Offline'}
        />
    );
};

export default StatusBadge; 