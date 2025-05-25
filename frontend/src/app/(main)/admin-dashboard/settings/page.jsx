// src/app/(main)/admin-dashboard/settings/page.jsx
// This page displays User Data / User Monitoring information from the backend.
// It relies on a backend API to fetch from and update the 'cedo_auth.users' table.
"use client";

import { useAuth } from "@/contexts/auth-context"; // Assumes fetchAllUsers & updateUserApproval interact with your backend/DB
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// ShadCN UI Components & Lucide Icons
import { PageHeader as AdminPageHeader } from "@/components/dashboard/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/admin/ui/alert";
import { Badge } from "@/components/dashboard/admin/ui/badge"; // Used for user.role and user.is_approved
import { Button } from "@/components/dashboard/admin/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card";
import { useToast } from "@/components/dashboard/admin/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Uses user.avatar, user.name
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { AlertTriangle, Download, Loader2, Search, UserCheck, UserX, Users, Eye as ViewIcon, XCircle } from "lucide-react";

// USER_ROLES should align with the enum definition in your 'users' table for the 'role' column.
const USER_ROLES = ['student', 'head_admin', 'manager', 'partner', 'reviewer'];

const UserMonitoringPage = () => {
    // useAuth hook is critical. Its implementation must handle DB interactions via API calls.
    // AuthRoles.head_admin should correspond to 'head_admin' in your DB 'role' enum.
    const { user: authUser, loading: authLoading, fetchAllUsers, updateUserApproval, ROLES: AuthRoles } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [usersList, setUsersList] = useState([]); // Stores data likely from 'SELECT * FROM users'
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [fetchUsersError, setFetchUsersError] = useState(null);
    const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedApprovalStatus, setSelectedApprovalStatus] = useState("");

    const [selectedUser, setSelectedUser] = useState(null); // Holds one user object matching the DB schema
    const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);

    // Authorization and Redirection Effect - This is client-side. Middleware handles server-side.
    useEffect(() => {
        if (authLoading) return;
        // Ensure AuthRoles.head_admin matches the 'head_admin' string literal for DB role
        if (!authUser || authUser.role !== AuthRoles.head_admin) {
            router.replace("/");
        }
    }, [authUser, authLoading, router, AuthRoles?.head_admin]); // Added optional chaining for safety

    // Fetching Users Callback
    const loadUsers = useCallback(async () => {
        // Ensure current user is authorized to fetch all users
        if (!authLoading && authUser && authUser.role === AuthRoles.head_admin) {
            setIsLoadingUsers(true);
            setFetchUsersError(null);
            try {
                const response = await fetchAllUsers(); // This function in useAuth calls your backend API
                // Backend should return users data matching the 'users' table schema
                // e.g., each user object having id, name, email, role, is_approved, created_at, etc.
                setUsersList(response.users || response || []);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                setFetchUsersError(error.message || "An unexpected error occurred while fetching users.");
                setUsersList([]);
            }
            finally {
                setIsLoadingUsers(false);
            }
        } else if (!authLoading && (!authUser || authUser.role !== AuthRoles.head_admin)) {
            setUsersList([]); // Clear list if not authorized
            setIsLoadingUsers(false);
        }
    }, [authUser, authLoading, fetchAllUsers, AuthRoles?.head_admin]); // Added optional chaining

    useEffect(() => {
        if (AuthRoles) { // Ensure AuthRoles is loaded before attempting to load users
            loadUsers();
        }
    }, [loadUsers, AuthRoles]);

    const filteredUsers = useMemo(() => {
        return usersList.filter(user => {
            const searchTermLower = searchTerm.toLowerCase();
            // Assumes user object has name, email, organization fields from DB
            const matchesSearch =
                (user.name && user.name.toLowerCase().includes(searchTermLower)) ||
                (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
                (user.organization && user.organization.toLowerCase().includes(searchTermLower));

            const matchesRole = selectedRole ? user.role === selectedRole : true; // user.role from DB

            // user.is_approved (boolean/tinyint) from DB
            const userApprovalStatus = user.is_approved ? "approved" : "pending";
            const matchesApproval = selectedApprovalStatus ? userApprovalStatus === selectedApprovalStatus : true;

            return matchesSearch && matchesRole && matchesApproval;
        });
    }, [usersList, searchTerm, selectedRole, selectedApprovalStatus]);

    const handleViewUserDetails = (userToView) => {
        setSelectedUser(userToView); // userToView is an object from usersList
        setIsUserDetailOpen(true);
    };

    const handleApprovalChange = async (userToUpdate, newStatus) => {
        if (!userToUpdate || !userToUpdate.id) return; // userToUpdate.id is users.id PK
        setIsUpdatingApproval(true);
        try {
            // updateUserApproval in useAuth calls backend API to update 'is_approved', 'approved_by', 'approved_at'
            // It should pass userToUpdate.id and newStatus. Backend uses authUser.id for 'approved_by'.
            await updateUserApproval(userToUpdate.id, newStatus);
            toast({
                title: "User Updated",
                description: `${userToUpdate.name}'s approval status changed to ${newStatus ? 'Approved' : 'Pending'}.`,
                variant: "success",
            });
            await loadUsers(); // Refresh user list

            // Update details if the currently viewed user was the one updated
            if (selectedUser && selectedUser.id === userToUpdate.id) {
                setSelectedUser(prev => ({ ...prev, is_approved: newStatus }));
                // Optionally, you might want to re-fetch the single user's complete data if 'approved_by' and 'approved_at' are displayed and changed
            } else {
                // If a different user's detail was open, or if it should reset. Consider if this is desired.
                // Keeping it open might be fine if the list updates behind it.
                // setIsUserDetailOpen(false);
            }
        } catch (error) {
            console.error("Error updating user approval:", error);
            toast({
                title: "Update Failed",
                description: error.message || "Could not update user approval status.",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingApproval(false);
        }
    };

    const getApprovalBadgeVariant = (is_approved) => { // Based on user.is_approved from DB
        return is_approved ? "success" : "warning";
    };

    const getRoleBadgeVariant = (role) => { // Based on user.role from DB
        switch (role) {
            case 'head_admin': return "destructive";
            case 'manager': return "info";
            case 'student': return "secondary";
            case 'partner': return "outline";
            case 'reviewer': return "default"; // Assuming 'default' is a defined Badge variant
            default: return "secondary";
        }
    };

    const getUserInitial = (name) => { // Based on user.name from DB
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleDownloadUsers = () => {
        // filteredUsers contains objects that should mirror the DB structure
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredUsers, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "user_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedRole("");
        setSelectedApprovalStatus("");
    };

    // Loading state for initial auth check
    if (authLoading || !AuthRoles) { // Also wait for AuthRoles to be defined
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Access Denied if not head_admin (client-side check)
    if (!authUser || authUser.role !== AuthRoles.head_admin) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>You do not have permission to view this page. Redirecting...</AlertDescription>
                </Alert>
            </div>
        );
    }

    // Main Page Content
    return (
        <div className="p-4 md:p-6 space-y-6">
            <AdminPageHeader
                title="User Management & Monitoring"
                description="View, filter, and manage user accounts within the system."
            />

            {/* Filters Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters & Search Users</CardTitle>
                    <CardDescription>Refine user list by searching or selecting filters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name, email, organization..." // Matches user.name, user.email, user.organization
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Roles</SelectItem>
                                {USER_ROLES.map(role => ( // USER_ROLES matches DB enum for 'role'
                                    <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedApprovalStatus} onValueChange={setSelectedApprovalStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by Approval Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Statuses</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="pending">Pending Approval</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={clearFilters} variant="outline" className="w-full md:w-auto">
                            <XCircle className="mr-2 h-4 w-4" /> Clear Filters
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleDownloadUsers} disabled={isLoadingUsers || filteredUsers.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Download Filtered Users (JSON)
                    </Button>
                </CardFooter>
            </Card>

            {/* Loading Skeletons for Users Table */}
            {isLoadingUsers && (
                <Card>
                    <CardHeader><CardTitle>Loading User Data...</CardTitle></CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-2 border-b">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-6 w-24" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Error Fetching Users Alert */}
            {fetchUsersError && !isLoadingUsers && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Fetching Users</AlertTitle>
                    <AlertDescription>{fetchUsersError}</AlertDescription>
                </Alert>
            )}

            {/* Users Table */}
            {!isLoadingUsers && !fetchUsersError && (
                <Card>
                    <CardHeader>
                        <CardTitle>User Accounts ({filteredUsers.length})</CardTitle>
                        <CardDescription>List of registered users in the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-10">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No users found matching your criteria.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]">Avatar</TableHead> {/* user.avatar */}
                                        <TableHead>Name</TableHead> {/* user.name, user.id */}
                                        <TableHead>Email</TableHead> {/* user.email */}
                                        <TableHead>Role</TableHead> {/* user.role */}
                                        <TableHead>Organization</TableHead> {/* user.organization, user.organization_type */}
                                        <TableHead>Status</TableHead> {/* user.is_approved */}
                                        <TableHead>Joined</TableHead> {/* user.created_at */}
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => ( // Each 'user' object here matches the DB schema
                                        <TableRow key={user.id /* users.id */}>
                                            <TableCell>
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.avatar /* users.avatar */} alt={user.name} />
                                                    <AvatarFallback>{getUserInitial(user.name /* users.name */)}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {user.name /* users.name */}
                                                <div className="text-xs text-muted-foreground">ID: {user.id /* users.id */}</div>
                                            </TableCell>
                                            <TableCell>{user.email /* users.email */}</TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(user.role /* users.role */)}>
                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.organization || "N/A" /* users.organization */}
                                                {user.organization_type && <span className="text-xs text-muted-foreground block">({user.organization_type /* users.organization_type */})</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getApprovalBadgeVariant(user.is_approved /* users.is_approved */)}>
                                                    {user.is_approved ? "Approved" : "Pending"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{new Date(user.created_at /* users.created_at */).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewUserDetails(user)} disabled={isUpdatingApproval}>
                                                    <ViewIcon className="h-4 w-4 mr-1" /> View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                    {filteredUsers.length > 0 && (
                        <CardFooter>
                            <p className="text-xs text-muted-foreground">
                                Displaying {filteredUsers.length} of {usersList.length} total users.
                            </p>
                        </CardFooter>
                    )}
                </Card>
            )}

            {/* User Details Dialog */}
            {selectedUser && ( // selectedUser is an object matching DB schema
                <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>User Details: {selectedUser.name} (ID: {selectedUser.id})</DialogTitle>
                            <DialogDescription>
                                {/* Displaying user.role, user.created_at */}
                                Role: {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1).replace('_', ' ')} | Joined: {new Date(selectedUser.created_at).toLocaleString()}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 py-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
                            {/* All fields below are from selectedUser, matching DB columns */}
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Full Name:</Label><p>{selectedUser.name}</p>
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Email Address:</Label><p>{selectedUser.email}</p>
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Role:</Label>
                                <Badge variant={getRoleBadgeVariant(selectedUser.role)}>{selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1).replace('_', ' ')}</Badge>
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Organization:</Label><p>{selectedUser.organization || "N/A"}</p>
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Organization Type:</Label>
                                <p>{selectedUser.organization_type ? selectedUser.organization_type.charAt(0).toUpperCase() + selectedUser.organization_type.slice(1) : "N/A"}</p>
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Approval Status:</Label>
                                <Badge variant={getApprovalBadgeVariant(selectedUser.is_approved)}>{selectedUser.is_approved ? "Approved" : "Pending Approval"}</Badge>
                            </div>
                            {selectedUser.is_approved && selectedUser.approved_by && ( // users.approved_by
                                <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                    <Label>Approved By (ID):</Label>
                                    <p>{selectedUser.approved_by}</p>
                                </div>
                            )}
                            {selectedUser.is_approved && selectedUser.approved_at && ( // users.approved_at
                                <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                    <Label>Approved At:</Label>
                                    <p>{new Date(selectedUser.approved_at).toLocaleString()}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Google ID:</Label><p>{selectedUser.google_id || "Not linked"}</p> {/* users.google_id */}
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Avatar URL:</Label><p className="truncate">{selectedUser.avatar || "No avatar"}</p> {/* users.avatar */}
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Account Created:</Label><p>{new Date(selectedUser.created_at).toLocaleString()}</p> {/* users.created_at */}
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                                <Label>Last Updated:</Label><p>{new Date(selectedUser.updated_at).toLocaleString()}</p> {/* users.updated_at */}
                            </div>
                        </div>
                        <DialogFooter className="mt-2 flex flex-col sm:flex-row sm:justify-between items-center">
                            <div className="flex gap-2 mb-2 sm:mb-0">
                                {!selectedUser.is_approved ? (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleApprovalChange(selectedUser, true)}
                                        disabled={isUpdatingApproval}
                                    >
                                        {isUpdatingApproval ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                        Approve User
                                    </Button>
                                ) : (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleApprovalChange(selectedUser, false)}
                                        disabled={isUpdatingApproval}
                                    >
                                        {isUpdatingApproval ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                                        Revoke Approval
                                    </Button>
                                )}
                            </div>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isUpdatingApproval}>Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default UserMonitoringPage;