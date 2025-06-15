// frontend/src/app/(main)/admin-dashboard/settings/page.jsx

"use client"

// Force dynamic rendering to prevent SSR issues with the whitelist hook
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

// Dynamic imports for better performance
import NextDynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

// Custom Hook and Components
import ConfirmationDialog from "./components/ConfirmationDialog";
import UserTable from "./components/UserTable";
import { useWhitelist } from "./hooks/useWhitelist";

// Dynamically import EditUserModal to improve initial page load performance
const EditUserModal = NextDynamic(() => import('./components/EditUserModal'), {
    loading: () => <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cedo-blue"></div>
    </div>,
    ssr: false
});

// UI Components
import { PageHeader } from "@/components/dashboard/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
    AlertTriangle,
    Check,
    ChevronDown,
    Copy,
    Download,
    Eye,
    EyeOff,
    Key,
    Mail,
    Plus,
    RefreshCw,
    Search,
    User,
    Users,
    X
} from "lucide-react";

const WhitelistManagementPage = memo(() => {
    const { user: authUser, loading: authLoading, isInitialized, ROLES: AuthRoles } = useAuth()
    const router = useRouter()

    // Use the custom whitelist hook for all business logic
    const whitelist = useWhitelist(authUser)

    // Edit modal state
    const [editModal, setEditModal] = useState({
        isOpen: false,
        user: null,
        isSaving: false
    })

    // Fix: Move authorization check to useEffect to prevent render-time router updates
    useEffect(() => {
        if (!authLoading && isInitialized && (!authUser || authUser.role !== AuthRoles.HEAD_ADMIN)) {
            router.replace("/sign-in");
        }
    }, [authLoading, isInitialized, authUser, AuthRoles, router]);

    // Destructure needed values from the hook
    const {
        users,
        isLoading,
        searchTerm,
        setSearchTerm,
        selectedRole,
        setSelectedRole,
        clearFilters,
        exportUsers,
        newUser,
        setNewUser,
        formErrors,
        isAddingUser,
        addUserSuccess,
        handleAddUser,
        generatedPassword,
        showPassword,
        setShowPassword,
        passwordCopied,
        handleGeneratePassword,
        copyPasswordToClipboard,
        handleRoleChange,
        deleteConfirmation,
        initiateDeleteUser,
        confirmDeleteUser,
        cancelDeleteUser,
        saveEdit, // We'll use this for the modal save
        USER_ROLES,
        userCount,
        filteredCount
    } = whitelist

    // Memoized handlers for better performance
    const handleEditUser = useCallback((user) => {
        setEditModal({
            isOpen: true,
            user: user,
            isSaving: false
        });
    }, []);

    const handleCloseEditModal = useCallback(() => {
        if (!editModal.isSaving) {
            setEditModal({
                isOpen: false,
                user: null,
                isSaving: false
            });
        }
    }, [editModal.isSaving]);

    // Memoized save handler for edit modal
    const handleSaveUserEdit = useCallback(async (userId, formData) => {
        setEditModal(prev => ({ ...prev, isSaving: true }));
        try {
            await saveEdit(userId, 'name', formData.name);
            await saveEdit(userId, 'email', formData.email);
            await saveEdit(userId, 'role', formData.role);
            await saveEdit(userId, 'organization', formData.organization);
        } finally {
            setEditModal(prev => ({ ...prev, isSaving: false }));
        }
    }, [saveEdit]);

    // Memoized form handlers
    const handleInputChange = useCallback((field, value) => {
        setNewUser(prev => ({ ...prev, [field]: value }));
    }, [setNewUser]);

    // Memoized role options for better performance
    const roleOptions = useMemo(() => USER_ROLES, [USER_ROLES]);

    // Memoized loading state
    const isPageLoading = useMemo(() => {
        return authLoading || !isInitialized;
    }, [authLoading, isInitialized]);

    // Show loading state
    if (isPageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="flex items-center justify-center mb-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedo-blue"></div>
                    </div>
                    <p className="text-center text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Show access denied if not authorized
    if (!authUser || authUser.role !== AuthRoles.HEAD_ADMIN) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Alert variant="destructive" className="shadow-lg">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-base sm:text-lg">Access Denied</AlertTitle>
                        <AlertDescription className="text-sm sm:text-base mt-2">
                            You do not have permission to view this page. Only head administrators can manage the user whitelist.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        )
    }

    // Custom select input with dropdown icon (Enhanced with responsive design)
    const CustomSelect = ({ value, onChange, options, placeholder }) => (
        <div className="relative">
            <select
                className="appearance-none h-10 w-full min-w-[120px] sm:min-w-[180px] lg:min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
    )

    return (
        <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
            <PageHeader
                title="User Whitelist Management"
                subtitle="View and manage all users authorized to access the system"
            />

            {/* Main content - CSS Grid responsive layout (from article examples) */}
            <div className="mt-6">
                <Tabs defaultValue="whitelist" className="w-full">
                    {/* Responsive tabs - mobile-first design */}
                    <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-auto">
                        <TabsTrigger
                            value="whitelist"
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm md:text-base"
                        >
                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline sm:hidden lg:inline">View Whitelist</span>
                            <span className="xs:hidden sm:inline lg:hidden">Whitelist</span>
                            <span className="hidden sm:inline">({userCount})</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="add-user"
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm md:text-base"
                        >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline sm:hidden lg:inline">Add New User</span>
                            <span className="xs:hidden sm:inline lg:hidden">Add User</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Whitelist View Tab - Implementing responsive grid patterns */}
                    <TabsContent value="whitelist" className="space-y-4 sm:space-y-6">
                        <Card className="border border-gray-100 shadow-sm rounded-lg bg-white transition-all duration-200 hover:shadow-md">
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-medium text-cedo-blue mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                                    <span>Whitelisted Users</span>
                                    <Badge variant="secondary" className="ml-auto text-xs sm:text-sm">
                                        {userCount}
                                    </Badge>
                                </CardTitle>
                                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                                    Users authorized to access the system
                                </p>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                                {/* Responsive search and filters - CSS Grid layout */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:gap-6 lg:gap-8">
                                    {/* Search bar - responsive width */}
                                    <div className="relative sm:col-span-6 lg:col-span-8">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search users..."
                                            className="pl-9 w-full h-10 sm:h-11 text-sm sm:text-base"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* Filters - responsive positioning */}
                                    <div className="sm:col-span-6 lg:col-span-4">
                                        <CustomSelect
                                            value={selectedRole}
                                            onChange={setSelectedRole}
                                            options={roleOptions}
                                            placeholder="All Roles"
                                        />
                                    </div>
                                </div>

                                {/* Action buttons - responsive flex layout */}
                                <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                        disabled={!searchTerm && !selectedRole}
                                        className="w-full xs:w-auto text-xs sm:text-sm"
                                    >
                                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                        Clear Filters
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={exportUsers}
                                        disabled={filteredCount === 0}
                                        className="w-full xs:w-auto text-xs sm:text-sm"
                                    >
                                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                        <span className="hidden sm:inline">Export</span>
                                        <span className="sm:hidden">Export JSON</span>
                                    </Button>
                                </div>

                                {/* Enhanced User Table with Modal Editing */}
                                <UserTable
                                    users={users}
                                    isLoading={isLoading}
                                    onEditUser={handleEditUser}
                                    onDeleteUser={initiateDeleteUser}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Add User Tab - Responsive form design */}
                    <TabsContent value="add-user" className="space-y-4 sm:space-y-6">
                        <Card className="border border-gray-100 shadow-sm rounded-lg bg-white transition-all duration-200 hover:shadow-md">
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-medium text-cedo-blue mb-2 flex items-center gap-2">
                                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                                    Add New User to Whitelist
                                </CardTitle>
                                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                                    Manually authorize a new user to access the system
                                </p>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <form onSubmit={handleAddUser} className="space-y-4 sm:space-y-6">
                                    {/* Responsive form grid - following article patterns */}
                                    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                                                Email Address <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="user@example.com"
                                                    className={`pl-8 sm:pl-9 h-10 sm:h-11 text-sm sm:text-base ${formErrors.email ? "border-destructive ring-destructive/10" : ""}`}
                                                    value={newUser.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                />
                                            </div>
                                            {formErrors.email && <p className="text-xs sm:text-sm text-destructive">{formErrors.email}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
                                                Full Name <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    placeholder="John Doe"
                                                    className={`pl-8 sm:pl-9 h-10 sm:h-11 text-sm sm:text-base ${formErrors.name ? "border-destructive ring-destructive/10" : ""}`}
                                                    value={newUser.name}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                />
                                            </div>
                                            {formErrors.name && <p className="text-xs sm:text-sm text-destructive">{formErrors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-xs sm:text-sm font-medium">
                                                Role <span className="text-destructive">*</span>
                                            </Label>
                                            <CustomSelect
                                                value={newUser.role}
                                                onChange={handleRoleChange}
                                                options={roleOptions}
                                                placeholder="Select a role"
                                            />
                                            {formErrors.role && <p className="text-xs sm:text-sm text-destructive">{formErrors.role}</p>}
                                        </div>

                                        {/* Manager Password Generation Section */}
                                        {newUser.role === "manager" && (
                                            <div className="col-span-full space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Key className="h-4 w-4 text-blue-600" />
                                                    <Label className="text-sm font-medium text-blue-900">
                                                        Manager Password Generation
                                                    </Label>
                                                </div>
                                                <p className="text-xs text-blue-700">
                                                    A secure temporary password will be generated for this manager account.
                                                </p>

                                                {generatedPassword && (
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-medium text-blue-900">
                                                            Generated Password:
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                type={showPassword ? "text" : "password"}
                                                                value={generatedPassword}
                                                                readOnly
                                                                className="pr-20 font-mono text-sm bg-white border-blue-300 focus:border-blue-500"
                                                            />
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 hover:bg-blue-100"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                >
                                                                    {showPassword ? (
                                                                        <EyeOff className="h-3 w-3" />
                                                                    ) : (
                                                                        <Eye className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 hover:bg-blue-100"
                                                                    onClick={copyPasswordToClipboard}
                                                                >
                                                                    {passwordCopied ? (
                                                                        <Check className="h-3 w-3 text-green-600" />
                                                                    ) : (
                                                                        <Copy className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handleGeneratePassword}
                                                                className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                                Regenerate
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={copyPasswordToClipboard}
                                                                className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                                            >
                                                                {passwordCopied ? (
                                                                    <>
                                                                        <Check className="h-3 w-3 mr-1 text-green-600" />
                                                                        Copied!
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="h-3 w-3 mr-1" />
                                                                        Copy Password
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>

                                                        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                                                            <p className="font-medium mb-1">Important:</p>
                                                            <ul className="space-y-1 text-blue-700">
                                                                <li>• This password will be sent to the manager via email</li>
                                                                <li>• They should change it upon first login</li>
                                                                <li>• Copy this password before submitting the form</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="organization" className="text-xs sm:text-sm font-medium">
                                                Organization
                                            </Label>
                                            <Input
                                                id="organization"
                                                type="text"
                                                placeholder="University or Organization"
                                                className="h-10 sm:h-11 text-sm sm:text-base"
                                                value={newUser.organization}
                                                onChange={(e) => handleInputChange('organization', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Responsive form actions */}
                                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setNewUser({
                                                    email: "",
                                                    name: "",
                                                    role: "",
                                                    organization: "",
                                                })
                                            }}
                                            disabled={isAddingUser}
                                            className="w-full sm:w-auto text-xs sm:text-sm"
                                        >
                                            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                            Clear Form
                                        </Button>
                                        <Button
                                            type="submit"
                                            className={`${addUserSuccess
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-cedo-blue hover:bg-cedo-blue/90"
                                                } text-white w-full sm:w-auto text-xs sm:text-sm transition-all duration-300`}
                                            disabled={isAddingUser}
                                        >
                                            {isAddingUser ? (
                                                <>
                                                    <div className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    Adding...
                                                </>
                                            ) : addUserSuccess ? (
                                                <>
                                                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-white" />
                                                    Added Successfully!
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                                    Add to Whitelist
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Success Notification Card */}
                        {addUserSuccess && (
                            <Card className="border-green-200 bg-green-50 transition-all duration-500 animate-in slide-in-from-top-5">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <Check className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-green-800 text-sm sm:text-base">
                                                ✅ User Added Successfully!
                                            </h4>
                                            <p className="text-xs sm:text-sm text-green-700 mt-1">
                                                The new user has been successfully added to the whitelist and can now access the system.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Information Card - Responsive design */}
                        <Card className="border-cedo-blue/20 bg-cedo-blue/5">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-start gap-3">
                                    <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-cedo-blue/10 flex items-center justify-center flex-shrink-0 mt-1">
                                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-cedo-blue" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold text-cedo-blue mb-2 text-sm sm:text-base">Important Information</h4>
                                        <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                                            <li>• Only users added to this whitelist can access the system</li>
                                            <li>• Users cannot self-register or request access</li>
                                            <li>• All access control is managed through this interface</li>
                                            <li>• Changes take effect immediately</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Confirmation Dialog for User Deletion */}
            <ConfirmationDialog
                isOpen={deleteConfirmation.isOpen}
                onClose={cancelDeleteUser}
                onConfirm={confirmDeleteUser}
                user={deleteConfirmation.user}
                isDeleting={deleteConfirmation.isDeleting}
            />

            {/* Edit User Modal - Dynamically Loaded */}
            <EditUserModal
                isOpen={editModal.isOpen}
                onClose={handleCloseEditModal}
                onSave={handleSaveUserEdit}
                user={editModal.user}
                isSaving={editModal.isSaving}
            />
        </div>
    )
})

WhitelistManagementPage.displayName = 'WhitelistManagementPage';

export default WhitelistManagementPage
