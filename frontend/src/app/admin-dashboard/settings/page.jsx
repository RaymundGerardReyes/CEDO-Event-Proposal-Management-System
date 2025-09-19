// frontend/src/app/admin-dashboard/settings/page.jsx

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

    // Global error handling for unhandled promise rejections
    useEffect(() => {
        const handleUnhandledRejection = (event) => {
            console.error('🚨 Unhandled Promise Rejection:', event.reason);

            // Prevent the default browser behavior
            event.preventDefault();

            // Log the error for debugging
            console.error('Error details:', {
                message: event.reason?.message,
                stack: event.reason?.stack,
                name: event.reason?.name,
                code: event.reason?.code
            });

            // Show user-friendly error message
            if (typeof window !== 'undefined') {
                // You could show a toast notification here
                console.warn('⚠️ Unhandled promise rejection caught and handled');
            }
        };

        // Add global error handler
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // Cleanup on unmount
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

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

    // Destructure needed values from the hook with safety checks
    const {
        users = [],
        isLoading = false,
        searchTerm = "",
        setSearchTerm,
        selectedRole = "",
        setSelectedRole,
        clearFilters,
        exportUsers,
        newUser = { email: "", name: "", role: "", organization: "" },
        setNewUser,
        formErrors = {},
        isAddingUser = false,
        addUserSuccess = false,
        handleAddUser,
        generatedPassword = "",
        showPassword = false,
        setShowPassword,
        passwordCopied = false,
        handleGeneratePassword,
        copyPasswordToClipboard,
        handleRoleChange,
        deleteConfirmation = { isOpen: false, user: null, isDeleting: false },
        initiateDeleteUser,
        confirmDeleteUser,
        cancelDeleteUser,
        saveEdit, // We'll use this for the modal save
        USER_ROLES = [],
        userCount = 0,
        filteredCount = 0
    } = whitelist || {}

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
                {options.map((option, index) => (
                    <option key={option || `option-${index}`} value={option}>
                        {option && typeof option === 'string'
                            ? option
                                .split("_")
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ")
                            : option || 'Unknown'
                        }
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Enhanced Page Header with responsive spacing */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <PageHeader
                        title="User Whitelist Management"
                        subtitle="View and manage all users authorized to access the system"
                    />
                </div>
            </div>

            {/* Main content with enhanced responsive grid layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Tabs defaultValue="whitelist" className="w-full">
                    {/* Enhanced responsive tabs with better grid layout */}
                    <div className="mb-6 sm:mb-8">
                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 h-auto bg-white/50 backdrop-blur-sm border border-gray-200/60 shadow-sm">
                            <TabsTrigger
                                value="whitelist"
                                className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="text-xs sm:text-sm lg:text-base">View Whitelist</span>
                                    <span className="text-xs sm:text-sm bg-cedo-blue/10 text-cedo-blue px-2 py-1 rounded-full font-semibold">
                                        {userCount}
                                    </span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="add-user"
                                className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                <span className="text-xs sm:text-sm lg:text-base">Add New User</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Whitelist View Tab - Enhanced responsive grid layout */}
                    <TabsContent value="whitelist" className="space-y-6 sm:space-y-8">
                        {/* Main content grid container */}
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
                            {/* Left column - Main content */}
                            <div className="xl:col-span-3 space-y-6">
                                <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                                    <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                                        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-cedo-blue mb-3 flex items-center gap-3">
                                            <div className="p-2 sm:p-3 rounded-xl bg-cedo-blue/10">
                                                <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-cedo-blue" />
                                            </div>
                                            <div className="flex-1">
                                                <span>Whitelisted Users</span>
                                                <Badge variant="secondary" className="ml-3 text-sm sm:text-base bg-cedo-blue/20 text-cedo-blue border-cedo-blue/30">
                                                    {userCount} Users
                                                </Badge>
                                            </div>
                                        </CardTitle>
                                        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                                            Manage users authorized to access the system
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                                        {/* Enhanced search and filters grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                            {/* Search bar */}
                                            <div className="sm:col-span-2 lg:col-span-2">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                    <Input
                                                        type="search"
                                                        placeholder="Search users by name, email, or role..."
                                                        className="pl-12 pr-4 h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Role filter */}
                                            <div className="sm:col-span-1 lg:col-span-1">
                                                <CustomSelect
                                                    value={selectedRole}
                                                    onChange={setSelectedRole}
                                                    options={roleOptions}
                                                    placeholder="Filter by role"
                                                />
                                            </div>
                                        </div>

                                        {/* Action buttons grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={clearFilters}
                                                disabled={!searchTerm && !selectedRole}
                                                className="w-full h-12 sm:h-14 text-sm sm:text-base border-gray-300 hover:border-cedo-blue hover:text-cedo-blue rounded-xl transition-all duration-300"
                                            >
                                                <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                Clear Filters
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={exportUsers}
                                                disabled={filteredCount === 0}
                                                className="w-full h-12 sm:h-14 text-sm sm:text-base border-gray-300 hover:border-cedo-blue hover:text-cedo-blue rounded-xl transition-all duration-300"
                                            >
                                                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                Export Data
                                            </Button>
                                        </div>

                                        {/* User Table */}
                                        <div className="border border-gray-200/60 rounded-xl overflow-hidden">
                                            <UserTable
                                                users={users}
                                                isLoading={isLoading}
                                                onEditUser={handleEditUser}
                                                onDeleteUser={initiateDeleteUser}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right column - Stats and quick actions */}
                            <div className="xl:col-span-1 space-y-6">
                                {/* Quick Stats Card */}
                                <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-gradient-to-br from-cedo-blue/5 to-cedo-blue/10 backdrop-blur-sm">
                                    <CardHeader className="p-4 sm:p-6">
                                        <CardTitle className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-cedo-blue/20">
                                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                                            </div>
                                            Quick Stats
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 sm:p-4 bg-white/60 rounded-lg border border-gray-200/60">
                                                <div className="text-2xl sm:text-3xl font-bold text-cedo-blue">{userCount}</div>
                                                <div className="text-xs sm:text-sm text-gray-600">Total Users</div>
                                            </div>
                                            <div className="text-center p-3 sm:p-4 bg-white/60 rounded-lg border border-gray-200/60">
                                                <div className="text-2xl sm:text-3xl font-bold text-green-600">{filteredCount}</div>
                                                <div className="text-xs sm:text-sm text-gray-600">Filtered</div>
                                            </div>
                                        </div>
                                        <div className="text-center p-3 sm:p-4 bg-white/60 rounded-lg border border-gray-200/60">
                                            <div className="text-lg sm:text-xl font-bold text-cedo-blue">{roleOptions.length}</div>
                                            <div className="text-xs sm:text-sm text-gray-600">Available Roles</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Quick Actions Card */}
                                <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm">
                                    <CardHeader className="p-4 sm:p-6">
                                        <CardTitle className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-cedo-blue/20">
                                                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                                            </div>
                                            Quick Actions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="w-full h-12 sm:h-14 text-sm sm:text-base border-cedo-blue/30 text-cedo-blue hover:bg-cedo-blue hover:text-white rounded-xl transition-all duration-300"
                                            onClick={() => {
                                                // Switch to add user tab
                                                const addUserTab = document.querySelector('[value="add-user"]');
                                                if (addUserTab) addUserTab.click();
                                            }}
                                        >
                                            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                            Add New User
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={exportUsers}
                                            disabled={filteredCount === 0}
                                            className="w-full h-12 sm:h-14 text-sm sm:text-base border-gray-300 text-gray-600 hover:border-cedo-blue hover:text-cedo-blue rounded-xl transition-all duration-300"
                                        >
                                            <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                            Export Users
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Add User Tab - Enhanced responsive grid layout */}
                    <TabsContent value="add-user" className="space-y-6 sm:space-y-8">
                        {/* Main form grid container */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                            {/* Left column - Main form */}
                            <div className="xl:col-span-2 space-y-6">
                                <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                                    <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                                        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-cedo-blue mb-3 flex items-center gap-3">
                                            <div className="p-2 sm:p-3 rounded-xl bg-cedo-blue/10">
                                                <Plus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-cedo-blue" />
                                            </div>
                                            <div>
                                                <span>Add New User to Whitelist</span>
                                                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-normal">
                                                    Manually authorize a new user to access the system
                                                </p>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 sm:p-8">
                                        <form onSubmit={handleAddUser} className="space-y-6 sm:space-y-8">
                                            {/* Enhanced form grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                                {/* Email field */}
                                                <div className="space-y-3">
                                                    <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-gray-700">
                                                        Email Address <span className="text-red-500">*</span>
                                                    </Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            placeholder="user@example.com"
                                                            className={`pl-12 pr-4 h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl transition-all duration-300 ${formErrors.email ? "border-red-500 ring-red-500/20" : ""}`}
                                                            value={newUser.email}
                                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                                        />
                                                    </div>
                                                    {formErrors.email && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{formErrors.email}</p>}
                                                </div>

                                                {/* Name field */}
                                                <div className="space-y-3">
                                                    <Label htmlFor="name" className="text-sm sm:text-base font-semibold text-gray-700">
                                                        Full Name <span className="text-red-500">*</span>
                                                    </Label>
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                        <Input
                                                            id="name"
                                                            type="text"
                                                            placeholder="John Doe"
                                                            className={`pl-12 pr-4 h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl transition-all duration-300 ${formErrors.name ? "border-red-500 ring-red-500/20" : ""}`}
                                                            value={newUser.name}
                                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                                        />
                                                    </div>
                                                    {formErrors.name && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{formErrors.name}</p>}
                                                </div>

                                                {/* Role field */}
                                                <div className="space-y-3">
                                                    <Label htmlFor="role" className="text-sm sm:text-base font-semibold text-gray-700">
                                                        Role <span className="text-red-500">*</span>
                                                    </Label>
                                                    <CustomSelect
                                                        value={newUser.role}
                                                        onChange={handleRoleChange}
                                                        options={roleOptions}
                                                        placeholder="Select a role"
                                                    />
                                                    {formErrors.role && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{formErrors.role}</p>}
                                                    {(newUser.role === "manager" || newUser.role === "head_admin") && (
                                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                                            <p className="text-sm text-blue-700">
                                                                <span className="font-semibold">{newUser.role === "head_admin" ? "Head Admin" : "Manager"} Account:</span> A secure password will be automatically generated for this account.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Organization field */}
                                                <div className="space-y-3">
                                                    <Label htmlFor="organization" className="text-sm sm:text-base font-semibold text-gray-700">
                                                        Organization
                                                    </Label>
                                                    <Input
                                                        id="organization"
                                                        type="text"
                                                        placeholder="University or Organization"
                                                        className="h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl transition-all duration-300"
                                                        value={newUser.organization}
                                                        onChange={(e) => handleInputChange('organization', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Manager/Head Admin Password Generation Section */}
                                            {(newUser.role === "manager" || newUser.role === "head_admin") && (
                                                <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-blue-200">
                                                            <Key className="h-5 w-5 text-blue-700" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-blue-900">
                                                                {newUser.role === "head_admin" ? "Head Admin" : "Manager"} Password Generation
                                                            </h3>
                                                            <p className="text-sm text-blue-700">
                                                                A secure temporary password will be generated for this {newUser.role === "head_admin" ? "head admin" : "manager"} account.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {generatedPassword && (
                                                        <div className="space-y-4">
                                                            <div className="space-y-3">
                                                                <Label className="text-sm font-semibold text-blue-900">
                                                                    Generated Password:
                                                                </Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        type={showPassword ? "text" : "password"}
                                                                        value={generatedPassword}
                                                                        readOnly
                                                                        className="pr-24 h-12 sm:h-14 font-mono text-sm sm:text-base bg-white border-blue-300 focus:border-blue-500 rounded-xl"
                                                                    />
                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg"
                                                                            onClick={() => setShowPassword(!showPassword)}
                                                                        >
                                                                            {showPassword ? (
                                                                                <EyeOff className="h-4 w-4" />
                                                                            ) : (
                                                                                <Eye className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg"
                                                                            onClick={copyPasswordToClipboard}
                                                                        >
                                                                            {passwordCopied ? (
                                                                                <Check className="h-4 w-4 text-green-600" />
                                                                            ) : (
                                                                                <Copy className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="lg"
                                                                    onClick={handleGeneratePassword}
                                                                    className="h-12 sm:h-14 text-sm sm:text-base border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-300"
                                                                >
                                                                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                                    Regenerate
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="lg"
                                                                    onClick={copyPasswordToClipboard}
                                                                    className="h-12 sm:h-14 text-sm sm:text-base border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-300"
                                                                >
                                                                    {passwordCopied ? (
                                                                        <>
                                                                            <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                                                                            Copied!
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Copy className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                                            Copy Password
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>

                                                            <div className="p-4 bg-blue-200/50 border border-blue-300 rounded-xl">
                                                                <p className="font-semibold text-blue-900 mb-2">Important:</p>
                                                                <ul className="space-y-1 text-sm text-blue-800">
                                                                    <li>• This password will be sent to the {newUser.role === "head_admin" ? "head admin" : "manager"} via email</li>
                                                                    <li>• They should change it upon first login</li>
                                                                    <li>• Copy this password before submitting the form</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Enhanced form actions */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200/60">
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
                                                    className="h-12 sm:h-14 text-sm sm:text-base border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600 rounded-xl transition-all duration-300"
                                                >
                                                    <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                    Clear Form
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    className={`h-12 sm:h-14 text-sm sm:text-base rounded-xl transition-all duration-300 ${addUserSuccess
                                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                                        : "bg-cedo-blue hover:bg-cedo-blue/90 text-white"
                                                        }`}
                                                    disabled={isAddingUser}
                                                >
                                                    {isAddingUser ? (
                                                        <>
                                                            <div className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                            Adding User...
                                                        </>
                                                    ) : addUserSuccess ? (
                                                        <>
                                                            <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                            Added Successfully!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                            Add to Whitelist
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right column - Help and guidelines */}
                            <div className="xl:col-span-1 space-y-6">
                                {/* User Guidelines Card */}
                                <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-gradient-to-br from-cedo-blue/5 to-cedo-blue/10 backdrop-blur-sm">
                                    <CardHeader className="p-4 sm:p-6">
                                        <CardTitle className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-cedo-blue/20">
                                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                                            </div>
                                            User Guidelines
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                                        <div className="space-y-3">
                                            <div className="p-3 bg-white/60 rounded-lg border border-gray-200/60">
                                                <h4 className="font-semibold text-gray-800 text-sm">Required Fields</h4>
                                                <p className="text-xs text-gray-600 mt-1">Email, Name, and Role are mandatory</p>
                                            </div>
                                            <div className="p-3 bg-white/60 rounded-lg border border-gray-200/60">
                                                <h4 className="font-semibold text-gray-800 text-sm">Role Permissions</h4>
                                                <p className="text-xs text-gray-600 mt-1">Each role has specific system access levels</p>
                                            </div>
                                            <div className="p-3 bg-white/60 rounded-lg border border-gray-200/60">
                                                <h4 className="font-semibold text-gray-800 text-sm">Password Generation</h4>
                                                <p className="text-xs text-gray-600 mt-1">Auto-generated for Manager and Head Admin roles</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Quick Tips Card */}
                                <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm">
                                    <CardHeader className="p-4 sm:p-6">
                                        <CardTitle className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-cedo-blue/20">
                                                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                                            </div>
                                            Quick Tips
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                                        <div className="text-sm text-gray-600 space-y-2">
                                            <p>• Use valid email addresses for user notifications</p>
                                            <p>• Assign appropriate roles based on user responsibilities</p>
                                            <p>• Copy generated passwords before submitting</p>
                                            <p>• Users will receive login credentials via email</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Enhanced Success Notification */}
                        {addUserSuccess && (
                            <Card className="border-green-300 bg-gradient-to-r from-green-50 to-green-100 shadow-lg transition-all duration-500 animate-in slide-in-from-top-5 rounded-xl">
                                <CardContent className="p-6 sm:p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                                            <Check className="h-6 w-6 sm:h-7 sm:w-7 text-green-700" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-green-800 text-lg sm:text-xl">
                                                ✅ User Added Successfully!
                                            </h4>
                                            <p className="text-sm sm:text-base text-green-700 mt-2">
                                                The new user has been successfully added to the whitelist and can now access the system.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Enhanced Information Card */}
                        <Card className="border-cedo-blue/30 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 shadow-lg rounded-xl">
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-cedo-blue/20 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-cedo-blue" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-cedo-blue mb-3 text-lg sm:text-xl">Important Information</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-cedo-blue mt-2 flex-shrink-0"></div>
                                                    <p className="text-sm sm:text-base text-gray-700">Only whitelisted users can access the system</p>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-cedo-blue mt-2 flex-shrink-0"></div>
                                                    <p className="text-sm sm:text-base text-gray-700">No self-registration available</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-cedo-blue mt-2 flex-shrink-0"></div>
                                                    <p className="text-sm sm:text-base text-gray-700">All access control managed here</p>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-cedo-blue mt-2 flex-shrink-0"></div>
                                                    <p className="text-sm sm:text-base text-gray-700">Changes take effect immediately</p>
                                                </div>
                                            </div>
                                        </div>
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
