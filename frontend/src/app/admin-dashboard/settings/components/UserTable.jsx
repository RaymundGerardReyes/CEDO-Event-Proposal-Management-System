'use client';
// frontend/src/app/admin-dashboard/settings/components/UserTable.jsx

/**
 * UserTable Component - Enhanced User Display with Inline Editing
 * 
 * This component provides a comprehensive table view for user management with
 * full inline editing capabilities. It integrates the EditableCell component
 * to allow administrators to modify user data directly in the table.
 * 
 * Features:
 * - Responsive table design with mobile-first approach
 * - Full inline editing for all user fields
 * - Visual feedback for editing and saving states
 * - Loading states and skeleton placeholders
 * - Empty state handling
 * - Hover effects and visual cues
 * - Keyboard navigation support
 * - Optimized with React.memo for performance
 */

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, UserX } from 'lucide-react';
import { memo } from 'react';
import UserAvatar from './UserAvatar';

const UserTable = memo(({
    users,
    isLoading,
    onEditUser,
    onDeleteUser,
    className = ''
}) => {
    // Get user initials for avatar
    const getUserInitials = (name) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Format role display
    const formatRole = (role) => {
        if (!role || typeof role !== 'string') {
            return 'Unknown';
        }
        return role
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    // Render loading skeleton
    const renderLoadingSkeleton = () => {
        return [...Array(3)].map((_, i) => (
            <TableRow key={i}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 sm:h-4 w-[120px] sm:w-[150px]" />
                            <Skeleton className="h-3 w-[100px] sm:w-[120px] md:hidden" />
                        </div>
                    </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-3 sm:h-4 w-[180px] sm:w-[200px]" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-5 sm:h-6 w-[60px] sm:w-[80px]" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-3 sm:h-4 w-[100px] sm:w-[120px]" />
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                    <Skeleton className="h-3 sm:h-4 w-[80px] sm:w-[100px]" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-6 sm:h-8 w-[60px] sm:w-[80px] ml-auto" />
                </TableCell>
            </TableRow>
        ));
    };

    // Render empty state
    const renderEmptyState = () => {
        return (
            <TableRow key="empty-state">
                <TableCell colSpan={6} className="text-center py-8 sm:py-12">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
                            <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                                No users found
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                                No users match your current search criteria. Try adjusting your filters.
                            </p>
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        );
    };

    return (
        <div className={`w-full overflow-x-auto ${className}`}>
            <div className="rounded-lg border border-border min-w-[600px]">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-cedo-blue text-xs sm:text-sm">
                                User
                            </TableHead>
                            <TableHead className="font-semibold text-cedo-blue text-xs sm:text-sm hidden md:table-cell">
                                Email
                            </TableHead>
                            <TableHead className="font-semibold text-cedo-blue text-xs sm:text-sm">
                                Role
                            </TableHead>
                            <TableHead className="font-semibold text-cedo-blue text-xs sm:text-sm hidden lg:table-cell">
                                Organization
                            </TableHead>
                            <TableHead className="font-semibold text-cedo-blue text-xs sm:text-sm hidden xl:table-cell">
                                Added
                            </TableHead>
                            <TableHead className="text-right font-semibold text-cedo-blue text-xs sm:text-sm">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            renderLoadingSkeleton()
                        ) : users.length > 0 ? (
                            users.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="hover:bg-muted/30 group transition-colors"
                                >
                                    {/* User Column with Avatar and Name */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={user} size="md" />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-foreground truncate">
                                                    {user.name}
                                                </div>
                                                {/* Show email on mobile */}
                                                <div className="md:hidden mt-1 text-xs text-muted-foreground truncate">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Email Column (hidden on mobile) */}
                                    <TableCell className="hidden md:table-cell">
                                        <div className="text-sm text-foreground truncate max-w-[200px]">
                                            {user.email}
                                        </div>
                                    </TableCell>

                                    {/* Role Column */}
                                    <TableCell>
                                        <div className="text-sm text-foreground">
                                            {formatRole(user.role)}
                                        </div>
                                    </TableCell>

                                    {/* Organization Column (hidden on smaller screens) */}
                                    <TableCell className="hidden lg:table-cell">
                                        <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                                            {user.organization || 'N/A'}
                                        </div>
                                    </TableCell>

                                    {/* Added Date Column (hidden on smaller screens) */}
                                    <TableCell className="hidden xl:table-cell">
                                        <div className="text-xs sm:text-sm text-muted-foreground">
                                            {new Date(user.addedAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>

                                    {/* Actions Column */}
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEditUser(user)}
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                title={`Edit ${user.name}`}
                                            >
                                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                                <span className="sr-only">Edit user</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeleteUser(user)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                title={`Delete ${user.name}`}
                                            >
                                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                <span className="sr-only">Delete user</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            renderEmptyState()
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
});

UserTable.displayName = 'UserTable';

export default UserTable; 