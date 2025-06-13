/**
 * useWhitelist Hook - Business Logic for User Whitelist Management
 * 
 * This custom hook encapsulates all business logic for the whitelist management system,
 * providing a clean separation between UI components and data management.
 * 
 * Features:
 * - Complete CRUD operations for users
 * - Advanced search and filtering
 * - Inline editing capabilities
 * - Form validation and error handling
 * - Password generation for managers
 * - State management with optimistic updates
 * - Comprehensive error handling and recovery
 */

import { useToast } from '@/components/ui/use-toast';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { userApi } from '../api/user-api';

// User roles configuration
export const USER_ROLES = ["student", "head_admin", "manager", "partner", "reviewer"];

/**
 * Custom hook for managing user whitelist operations
 * 
 * @param {Object} authUser - Current authenticated user
 * @returns {Object} Hook state and functions
 */
export const useWhitelist = (authUser) => {
    const { toast } = useToast();

    // Core state management
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Search and filtering state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Form state for adding new users
    const [newUser, setNewUser] = useState({
        email: "",
        name: "",
        role: "",
        organization: "",
    });
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [addUserSuccess, setAddUserSuccess] = useState(false);

    // Password generation state (for manager role)
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordCopied, setPasswordCopied] = useState(false);

    // Deletion confirmation state
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        user: null,
        isDeleting: false
    });

    // Inline editing state
    const [editingCell, setEditingCell] = useState({
        userId: null,
        field: null,
        value: "",
        originalValue: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    /**
     * Load all users from the API
     */
    const loadUsers = useCallback(async (showRefreshLoader = false) => {
        try {
            if (showRefreshLoader) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            console.log('🔄 [useWhitelist] Loading users...');

            const response = await userApi.getAllUsers({
                search: searchTerm,
                role: selectedRole,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.direction
            });

            // Transform API response to expected format
            const transformedUsers = response.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organization: user.organization || '',
                addedAt: user.created_at || new Date().toISOString(),
                addedBy: authUser?.email || 'system',
                is_approved: user.is_approved
            }));

            setUsers(transformedUsers);
            console.log('✅ [useWhitelist] Successfully loaded', transformedUsers.length, 'users');

        } catch (error) {
            console.error('❌ [useWhitelist] Failed to load users:', error);
            setError(error.message || 'Failed to load users');

            toast({
                title: "Error Loading Users",
                description: error.message || "Failed to load whitelisted users.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [searchTerm, selectedRole, sortConfig, authUser?.email, toast]);

    /**
     * Initial load on mount
     */
    useEffect(() => {
        if (authUser) {
            loadUsers();
        }
    }, [authUser, loadUsers]);

    /**
     * Filtered and sorted users (memoized for performance)
     */
    const filteredUsers = useMemo(() => {
        let filtered = [...users];

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                (user.organization && user.organization.toLowerCase().includes(searchLower))
            );
        }

        // Apply role filter
        if (selectedRole) {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        // Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (sortConfig.direction === 'desc') {
                    return bVal.localeCompare(aVal);
                }
                return aVal.localeCompare(bVal);
            });
        }

        return filtered;
    }, [users, searchTerm, selectedRole, sortConfig]);

    /**
     * Form validation for new user
     */
    const validateForm = useCallback(() => {
        const errors = {};

        if (!newUser.email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
            errors.email = "Please enter a valid email address";
        } else if (users.some(user => user.email.toLowerCase() === newUser.email.toLowerCase())) {
            errors.email = "This email is already whitelisted";
        }

        if (!newUser.name.trim()) {
            errors.name = "Full name is required";
        }

        if (!newUser.role) {
            errors.role = "Role is required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [newUser, users]);

    /**
     * Password generation utilities
     */
    const generateSecurePassword = useCallback(() => {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        const allChars = uppercase + lowercase + numbers + symbols;
        let password = '';

        // Ensure at least one character from each category
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];

        // Fill the rest randomly (total length: 16 characters)
        for (let i = 4; i < 16; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }, []);

    const handleGeneratePassword = useCallback(() => {
        const newPassword = generateSecurePassword();
        setGeneratedPassword(newPassword);
        setPasswordCopied(false);
    }, [generateSecurePassword]);

    const copyPasswordToClipboard = useCallback(async () => {
        if (generatedPassword) {
            try {
                await navigator.clipboard.writeText(generatedPassword);
                setPasswordCopied(true);
                toast({
                    title: "Password Copied",
                    description: "The generated password has been copied to your clipboard.",
                    variant: "default",
                });
                setTimeout(() => setPasswordCopied(false), 3000);
            } catch (error) {
                toast({
                    title: "Copy Failed",
                    description: "Failed to copy password to clipboard. Please copy manually.",
                    variant: "destructive",
                });
            }
        }
    }, [generatedPassword, toast]);

    /**
     * Handle role change and auto-generate password for managers
     */
    const handleRoleChange = useCallback((role) => {
        setNewUser(prev => ({ ...prev, role }));

        if (role === "manager") {
            const autoPassword = generateSecurePassword();
            setGeneratedPassword(autoPassword);
            setPasswordCopied(false);
        } else {
            setGeneratedPassword("");
            setPasswordCopied(false);
        }
    }, [generateSecurePassword]);

    /**
     * Add new user to whitelist
     */
    const handleAddUser = useCallback(async (e) => {
        if (e) e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsAddingUser(true);
        try {
            console.log('🆕 [useWhitelist] Adding new user:', newUser.email);

            const userData = {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                organization: newUser.organization || null,
                organization_type: null,
                ...(newUser.role === "manager" && generatedPassword && {
                    temporary_password: generatedPassword
                })
            };

            const response = await userApi.createUser(userData);

            // Add to local state (optimistic update)
            const newWhitelistedUser = {
                id: response.user.id,
                email: response.user.email,
                name: response.user.name,
                role: response.user.role,
                organization: response.user.organization || '',
                addedAt: response.user.created_at,
                addedBy: authUser.email,
                is_approved: response.user.is_approved
            };

            setUsers(prev => [...prev, newWhitelistedUser]);

            // Reset form and show success state
            setNewUser({
                email: "",
                name: "",
                role: "",
                organization: "",
            });
            setFormErrors({});
            setGeneratedPassword("");
            setPasswordCopied(false);
            setShowPassword(false);
            setAddUserSuccess(true);

            // Clear success state after 3 seconds
            setTimeout(() => setAddUserSuccess(false), 3000);

            toast({
                title: "✅ Added Successfully",
                description: newUser.role === "manager"
                    ? `${newUser.name} (${newUser.email}) has been added with a generated password and successfully added to the whitelist.`
                    : `${newUser.name} (${newUser.email}) has been successfully added to the whitelist.`,
                variant: "default",
                duration: 4000,
            });

            console.log('✅ [useWhitelist] Successfully added user:', newUser.name);

        } catch (error) {
            console.error('❌ [useWhitelist] Failed to add user:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to add user to whitelist.",
                variant: "destructive",
            });
        } finally {
            setIsAddingUser(false);
        }
    }, [newUser, validateForm, generatedPassword, authUser, toast]);

    /**
     * Initiate user deletion with confirmation
     */
    const initiateDeleteUser = useCallback((user) => {
        console.log('🗑️ [useWhitelist] Initiating deletion for user:', user.name);
        setDeleteConfirmation({
            isOpen: true,
            user: user,
            isDeleting: false
        });
    }, []);

    /**
     * Confirm and execute user deletion
     */
    const confirmDeleteUser = useCallback(async () => {
        if (!deleteConfirmation.user) return;

        setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));

        try {
            console.log('🗑️ [useWhitelist] Confirming deletion for user:', deleteConfirmation.user.name);

            await userApi.deleteUser(deleteConfirmation.user.id);

            // Remove from local state (optimistic update)
            setUsers(prev => prev.filter(user => user.id !== deleteConfirmation.user.id));

            toast({
                title: "User Removed",
                description: `${deleteConfirmation.user.name} (${deleteConfirmation.user.email}) has been removed from the whitelist.`,
                variant: "default",
            });

            console.log('✅ [useWhitelist] Successfully deleted user:', deleteConfirmation.user.name);

        } catch (error) {
            console.error('❌ [useWhitelist] Failed to delete user:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to remove user from whitelist.",
                variant: "destructive",
            });
        } finally {
            setDeleteConfirmation({
                isOpen: false,
                user: null,
                isDeleting: false
            });
        }
    }, [deleteConfirmation.user, toast]);

    /**
     * Cancel user deletion
     */
    const cancelDeleteUser = useCallback(() => {
        console.log('❌ [useWhitelist] Cancelled deletion');
        setDeleteConfirmation({
            isOpen: false,
            user: null,
            isDeleting: false
        });
    }, []);

    /**
     * Start inline editing for a cell
     */
    const startEditing = useCallback((userId, field, currentValue) => {
        console.log('✏️ [useWhitelist] Starting edit for user:', userId, 'field:', field);
        setEditingCell({
            userId,
            field,
            value: currentValue,
            originalValue: currentValue
        });
    }, []);

    /**
     * Cancel inline editing
     */
    const cancelEditing = useCallback(() => {
        console.log('❌ [useWhitelist] Cancelled editing');
        setEditingCell({
            userId: null,
            field: null,
            value: "",
            originalValue: ""
        });
    }, []);

    /**
     * Save inline edit changes
     */
    const saveEdit = useCallback(async (userId, field, newValue) => {
        // Don't save if value hasn't changed
        if (newValue === editingCell.originalValue) {
            cancelEditing();
            return;
        }

        setIsSaving(true);
        try {
            console.log('💾 [useWhitelist] Saving edit for user:', userId, 'field:', field, 'value:', newValue);

            const updateData = { [field]: newValue };
            const response = await userApi.updateUser(userId, updateData);

            // Update local state (optimistic update)
            setUsers(prev => prev.map(user =>
                user.id === userId
                    ? { ...user, [field]: newValue, updated_at: response.user.updated_at }
                    : user
            ));

            toast({
                title: "User Updated",
                description: `Successfully updated ${field} for user.`,
                variant: "default",
            });

            console.log('✅ [useWhitelist] Successfully saved edit');

        } catch (error) {
            console.error('❌ [useWhitelist] Failed to save edit:', error);
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update user information.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
            cancelEditing();
        }
    }, [editingCell.originalValue, cancelEditing, toast]);

    /**
     * Clear all filters and search
     */
    const clearFilters = useCallback(() => {
        setSearchTerm("");
        setSelectedRole("");
        setSortConfig({ key: null, direction: 'asc' });
    }, []);

    /**
     * Handle sorting
     */
    const handleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    /**
     * Export filtered users to JSON
     */
    const exportUsers = useCallback(() => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredUsers, null, 2));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "whitelist.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        toast({
            title: "Export Complete",
            description: `Exported ${filteredUsers.length} users to whitelist.json`,
            variant: "default",
        });
    }, [filteredUsers, toast]);

    /**
     * Refresh users data
     */
    const refreshUsers = useCallback(() => {
        loadUsers(true);
    }, [loadUsers]);

    // Return all state and functions for use in components
    return {
        // Core state
        users: filteredUsers,
        isLoading,
        isRefreshing,
        error,

        // Search and filtering
        searchTerm,
        setSearchTerm,
        selectedRole,
        setSelectedRole,
        sortConfig,
        handleSort,
        clearFilters,

        // User statistics
        userCount: users.length,
        filteredCount: filteredUsers.length,

        // Add user form
        newUser,
        setNewUser,
        formErrors,
        isAddingUser,
        addUserSuccess,
        handleAddUser,
        validateForm,

        // Password generation
        generatedPassword,
        showPassword,
        setShowPassword,
        passwordCopied,
        handleGeneratePassword,
        copyPasswordToClipboard,
        handleRoleChange,

        // User deletion
        deleteConfirmation,
        initiateDeleteUser,
        confirmDeleteUser,
        cancelDeleteUser,

        // Inline editing
        editingCell,
        isSaving,
        startEditing,
        cancelEditing,
        saveEdit,

        // Utility functions
        exportUsers,
        refreshUsers,
        loadUsers,

        // Constants
        USER_ROLES
    };
};

export default useWhitelist; 