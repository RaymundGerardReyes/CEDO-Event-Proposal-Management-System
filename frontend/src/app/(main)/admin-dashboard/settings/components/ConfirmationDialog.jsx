/**
 * ConfirmationDialog Component - Enhanced Pre-Deletion Confirmation Modal
 * 
 * This component provides a safety mechanism for user deletion operations.
 * It displays comprehensive user information and requires explicit confirmation
 * before proceeding with the destructive action.
 * 
 * Features:
 * - Clear user information display
 * - Explicit confirmation requirement
 * - Loading states during deletion
 * - Accessible keyboard navigation
 * - Mobile-responsive design
 * - Optimized with React.memo for performance
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
import { AlertTriangle, Trash2, X } from 'lucide-react';
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
                className="sm:max-w-md"
                onKeyDown={handleKeyDown}
                aria-describedby="confirmation-description"
            >
                <DialogHeader className="text-center sm:text-left">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <span className="text-foreground">{title}</span>
                    </DialogTitle>
                    <DialogDescription id="confirmation-description" className="text-base mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {/* User Information Card */}
                <div className="my-6 p-4 bg-muted/30 rounded-lg border border-border">
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

                {/* Warning Message */}
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-destructive">
                            <p className="font-medium mb-1">⚠️ Final Warning</p>
                            <p>
                                Once you confirm, <strong>{user.name}</strong> will be permanently removed
                                from the whitelist and will lose access to the system immediately.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full sm:w-auto"
                    >
                        <X className="w-4 h-4 mr-2" />
                        {cancelButtonText}
                    </Button>

                    <Button
                        ref={confirmButtonRef}
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
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