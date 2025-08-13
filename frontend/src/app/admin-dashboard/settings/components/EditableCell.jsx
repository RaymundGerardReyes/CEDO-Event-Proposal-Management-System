'use client';
// frontend/src/app/admin-dashboard/settings/components/EditableCell.jsx

/**
 * EditableCell Component - Inline Editable Table Cell
 * 
 * This component provides inline editing functionality for table cells.
 * It handles different field types (text, email, select) and provides
 * a seamless editing experience with keyboard navigation and validation.
 * 
 * Features:
 * - Click or double-click to edit
 * - Save on Enter key or blur event
 * - Cancel on Escape key
 * - Visual feedback for editing state
 * - Support for different input types
 * - Role-based select dropdown
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Edit3, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { USER_ROLES } from '../hooks/useWhitelist';

const EditableCell = ({
    value,
    userId,
    field,
    type = 'text',
    isEditing,
    isSaving,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    className = '',
    disabled = false,
    placeholder = '',
    maxLength = null
}) => {
    const [editValue, setEditValue] = useState(value);
    const [hasChanges, setHasChanges] = useState(false);
    const inputRef = useRef(null);

    // Update local state when prop value changes
    useEffect(() => {
        setEditValue(value);
        setHasChanges(false);
    }, [value]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (type === 'text' || type === 'email') {
                inputRef.current.select();
            }
        }
    }, [isEditing, type]);

    // Handle value changes
    const handleChange = (newValue) => {
        setEditValue(newValue);
        setHasChanges(newValue !== value);
    };

    // Handle save operation
    const handleSave = () => {
        if (hasChanges && editValue.trim() !== '') {
            onSaveEdit(userId, field, editValue.trim());
        } else {
            onCancelEdit();
        }
    };

    // Handle cancel operation
    const handleCancel = () => {
        setEditValue(value);
        setHasChanges(false);
        onCancelEdit();
    };

    // Handle keyboard events
    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                handleSave();
                break;
            case 'Escape':
                e.preventDefault();
                handleCancel();
                break;
            case 'Tab':
                // Allow default tab behavior but save changes
                if (hasChanges) {
                    handleSave();
                } else {
                    onCancelEdit();
                }
                break;
        }
    };

    // Handle blur event
    const handleBlur = () => {
        // Small delay to allow button clicks to register
        setTimeout(() => {
            if (hasChanges) {
                handleSave();
            } else {
                onCancelEdit();
            }
        }, 150);
    };

    // Get role badge variant
    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case "head_admin":
                return "destructive";
            case "manager":
                return "default";
            case "student":
                return "secondary";
            case "partner":
                return "outline";
            case "reviewer":
                return "default";
            default:
                return "secondary";
        }
    };

    // Format display value
    const getDisplayValue = () => {
        if (!value) return '—';

        if (field === 'role') {
            return value
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        }

        return value;
    };

    // Render editing mode
    if (isEditing) {
        return (
            <div className="flex items-center gap-2 min-w-0">
                {type === 'select' && field === 'role' ? (
                    <select
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => handleChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        disabled={isSaving}
                    >
                        {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                                {role
                                    .split("_")
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(" ")}
                            </option>
                        ))}
                    </select>
                ) : (
                    <Input
                        ref={inputRef}
                        type={type}
                        value={editValue}
                        onChange={(e) => handleChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        className="h-8 text-sm"
                        placeholder={placeholder}
                        disabled={isSaving}
                        maxLength={maxLength}
                    />
                )}

                {/* Action buttons for mobile/accessibility */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        title="Save changes"
                    >
                        <Check className="h-3 w-3" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleCancel}
                        disabled={isSaving}
                        title="Cancel editing"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    }

    // Render display mode
    return (
        <div
            className={`group flex items-center gap-2 min-w-0 cursor-pointer transition-colors duration-200 hover:bg-muted/30 rounded px-2 py-1 -mx-2 -my-1 ${className} ${disabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
            onClick={() => !disabled && onStartEdit(userId, field, value)}
            title={disabled ? 'Cannot edit this field' : 'Click to edit'}
        >
            <div className="flex-1 min-w-0">
                {field === 'role' ? (
                    <Badge variant={getRoleBadgeVariant(value)} className="text-xs">
                        {getDisplayValue()}
                    </Badge>
                ) : (
                    <span className="text-sm truncate block">
                        {getDisplayValue()}
                    </span>
                )}
            </div>

            {!disabled && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Edit3 className="h-3 w-3 text-muted-foreground" />
                </div>
            )}
        </div>
    );
};

export default EditableCell; 