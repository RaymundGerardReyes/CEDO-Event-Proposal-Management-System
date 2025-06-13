/**
 * EditUserModal Component - Dynamic Modal for User Editing
 * 
 * This component provides a comprehensive modal interface for editing user data.
 * It's designed to be dynamically imported to improve performance and follows
 * best practices for database interaction through API abstraction.
 * 
 * Features:
 * - Complete user data editing in a modal popup
 * - Form validation and error handling
 * - Real-time validation feedback
 * - Responsive design for all screen sizes
 * - Proper separation from database access
 * - Loading states and optimistic updates
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
    AlertTriangle,
    ChevronDown,
    Edit,
    Mail,
    Save,
    User,
    X
} from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';

// Available user roles
const USER_ROLES = ["head_admin", "manager", "student", "reviewer", "partner"];

const EditUserModal = memo(({
    isOpen,
    onClose,
    onSave,
    user,
    isSaving = false
}) => {
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        organization: ''
    });

    // Form validation errors
    const [errors, setErrors] = useState({});

    // Track if form has been modified
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize form data when user changes
    useEffect(() => {
        if (user) {
            const initialData = {
                name: user.name || '',
                email: user.email || '',
                role: user.role || '',
                organization: user.organization || ''
            };
            setFormData(initialData);
            setErrors({});
            setHasChanges(false);
        }
    }, [user]);

    // Get user initials for avatar
    const getUserInitials = (name) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
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

    // Format role display
    const formatRole = (role) => {
        return role
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    // Handle input changes
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Check if there are changes from original
            const hasModifications = Object.keys(newData).some(key =>
                newData[key] !== (user?.[key] || '')
            );
            setHasChanges(hasModifications);

            return newData;
        });

        // Clear error for this field if it exists
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [user, errors]);

    // Validate form data
    const validateForm = useCallback(() => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Role validation
        if (!formData.role) {
            newErrors.role = 'Please select a role';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    // Handle form submission
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast({
                title: "Validation Error",
                description: "Please fix the errors before saving.",
                variant: "destructive",
            });
            return;
        }

        try {
            await onSave(user.id, formData);

            toast({
                title: "User Updated",
                description: `Successfully updated ${formData.name}'s information.`,
                variant: "default",
            });

            onClose();
        } catch (error) {
            console.error('Failed to update user:', error);
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update user information.",
                variant: "destructive",
            });
        }
    }, [formData, user, onSave, onClose, validateForm, toast]);

    // Handle modal close with confirmation if there are unsaved changes
    const handleClose = useCallback(() => {
        if (hasChanges && !isSaving) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    }, [hasChanges, isSaving, onClose]);

    // Custom select component
    const CustomSelect = ({ value, onChange, options, placeholder, error }) => (
        <div className="relative">
            <select
                className={`appearance-none h-11 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 ${error ? 'border-destructive ring-destructive/10' : 'border-input bg-background'
                    }`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {formatRole(option)}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={!isSaving ? handleClose : undefined}>
            <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-center sm:text-left">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                            <Edit className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-foreground">Edit User Information</span>
                    </DialogTitle>
                    <DialogDescription className="text-base mt-2">
                        Update user details and access permissions. Changes will take effect immediately.
                    </DialogDescription>
                </DialogHeader>

                {/* Current User Info Display */}
                <div className="my-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 bg-cedo-blue text-white flex-shrink-0">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="bg-cedo-blue text-white text-sm font-semibold">
                                {getUserInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground text-lg truncate">
                                    {user.name}
                                </h4>
                                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                    {formatRole(user.role)}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                            </p>
                            {user.organization && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                    {user.organization}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                            Full Name <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                className={`pl-9 h-11 text-sm ${errors.name ? "border-destructive ring-destructive/10" : ""}`}
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    {/* Email Address */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                            Email Address <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                className={`pl-9 h-11 text-sm ${errors.email ? "border-destructive ring-destructive/10" : ""}`}
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium">
                            Role <span className="text-destructive">*</span>
                        </Label>
                        <CustomSelect
                            value={formData.role}
                            onChange={(value) => handleInputChange('role', value)}
                            options={USER_ROLES}
                            placeholder="Select a role"
                            error={errors.role}
                        />
                        {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                    </div>

                    {/* Organization */}
                    <div className="space-y-2">
                        <Label htmlFor="organization" className="text-sm font-medium">
                            Organization
                        </Label>
                        <Input
                            id="organization"
                            type="text"
                            placeholder="University or Organization"
                            className="h-11 text-sm"
                            value={formData.organization}
                            onChange={(e) => handleInputChange('organization', e.target.value)}
                            disabled={isSaving}
                        />
                    </div>

                    {/* Warning for role changes */}
                    {formData.role !== user.role && formData.role && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-medium mb-1">Role Change Warning</p>
                                    <p>
                                        Changing the user's role from <strong>{formatRole(user.role)}</strong> to{' '}
                                        <strong>{formatRole(formData.role)}</strong> will update their access permissions immediately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving || !hasChanges}
                        className="w-full sm:w-auto bg-cedo-blue hover:bg-cedo-blue/90"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

EditUserModal.displayName = 'EditUserModal';

export default EditUserModal; 