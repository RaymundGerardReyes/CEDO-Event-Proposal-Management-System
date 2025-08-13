'use client';
// frontend/src/app/admin-dashboard/settings/components/ConfirmationDialog.jsx

/**
 * ConfirmationDialog Component - Enhanced Pre-Deletion Confirmation Modal
 * 
 * This component provides a safety mechanism for user deletion operations.
 * It displays comprehensive user information and requires explicit confirmation
 * before proceeding with the destructive action.
 * 
 * Features:
 * - Clear user information display with responsive layout
 * - Explicit confirmation requirement
 * - Loading states during deletion
 * - Accessible keyboard navigation
 * - Mobile-responsive design with adaptive sizing
 * - Optimized with React.memo for performance
 * - Modern UI patterns following best practices
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
import { AlertTriangle, Building, Mail, Trash2, X } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';

const ConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    user,
    isDeleting = false,
    title = "Confirm User Deletion",
    description = "This action cannot be undone. Please confirm that you want to remove this user from the whitelist.",
    confirmButtonText = "Delete User",
    cancelButtonText = "Cancel"
}) => {
    const confirmButtonRef = useRef(null);

    // Focus the confirm button when dialog opens for keyboard navigation
    useEffect(() => {
        if (isOpen && confirmButtonRef.current) {
            // Small delay to ensure dialog is fully rendered
            setTimeout(() => {
                confirmButtonRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Handle keyboard events
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isDeleting) {
            e.preventDefault();
            onConfirm();
        } else if (e.key === 'Escape' && !isDeleting) {
            e.preventDefault();
            onClose();
        }
    };

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

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={!isDeleting ? onClose : undefined}>
            <DialogContent
                className="sm:max-w-lg w-full max-w-[95vw] max-h-[90vh] overflow-y-auto"
                onKeyDown={handleKeyDown}
                aria-describedby="confirmation-description"
            >
                <DialogHeader className="text-center sm:text-left space-y-3">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <span className="text-foreground leading-tight">{title}</span>
                    </DialogTitle>
                    <DialogDescription id="confirmation-description" className="text-base">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {/* Enhanced User Information Card */}
                <div className="my-4 p-4 sm:p-6 bg-muted/30 rounded-xl border border-border/50 shadow-sm">
                    {/* Mobile-first responsive layout */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Avatar Section */}
                        <div className="flex-shrink-0">
                            <Avatar className="h-16 w-16 sm:h-14 sm:w-14 bg-cedo-blue text-white ring-2 ring-background shadow-md">
                                <AvatarImage
                                    src={user.avatar || "/placeholder.svg"}
                                    alt={`${user.name}'s avatar`}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-cedo-blue text-white text-lg sm:text-base font-semibold">
                                    {getUserInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* User Details Section */}
                        <div className="flex-1 min-w-0 text-center sm:text-left space-y-2 w-full">
                            {/* Name and Role */}
                            <div className="space-y-2 sm:space-y-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    <h4 className="font-semibold text-foreground text-lg sm:text-base leading-tight break-words">
                                        {user.name}
                                    </h4>
                                    <Badge
                                        variant={getRoleBadgeVariant(user.role)}
                                        className="text-xs px-2 py-1 w-fit mx-auto sm:mx-0"
                                    >
                                        {formatRole(user.role)}
                                    </Badge>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-1.5 text-sm">
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                                    <Mail className="w-4 h-4 flex-shrink-0" />
                                    <span className="break-all">{user.email}</span>
                                </div>

                                {user.organization && (
                                    <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                                        <Building className="w-4 h-4 flex-shrink-0" />
                                        <span className="break-words">{user.organization}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional User Info (if available) */}
                    {(user.lastLogin || user.createdAt) && (
                        <div className="mt-4 pt-3 border-t border-border/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                {user.lastLogin && (
                                    <div>
                                        <span className="font-medium">Last Login:</span> {user.lastLogin}
                                    </div>
                                )}
                                {user.createdAt && (
                                    <div>
                                        <span className="font-medium">Member Since:</span> {user.createdAt}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Enhanced Warning Message */}
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-destructive space-y-1">
                            <p className="font-semibold">⚠️ Final Warning</p>
                            <p className="leading-relaxed">
                                Once you confirm, <strong className="font-semibold">{user.name}</strong> will be permanently removed
                                from the whitelist and will lose access to the system immediately. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full sm:w-auto min-w-[100px] order-2 sm:order-1"
                    >
                        <X className="w-4 h-4 mr-2" />
                        {cancelButtonText}
                    </Button>

                    <Button
                        ref={confirmButtonRef}
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full sm:w-auto min-w-[120px] bg-destructive hover:bg-destructive/90 order-1 sm:order-2"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                {confirmButtonText}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

ConfirmationDialog.displayName = 'ConfirmationDialog';

export default memo(ConfirmationDialog); 