import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, UserCheck, UserX } from "lucide-react";

/**
 * Reusable Admin User Details Dialog
 */
const AdminUserDetailsDialog = ({
  user,
  open,
  onOpenChange,
  isUpdating,
  onApprovalChange
}) => {
  if (!user) return null;

  const formatRole = (role) =>
    role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');

  const roleVariants = {
    head_admin: 'destructive',
    manager: 'info',
    student: 'secondary',
    partner: 'outline',
    reviewer: 'default'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            User Details: {user.name} (ID: {user.id})
          </DialogTitle>
          <DialogDescription>
            Role: {formatRole(user.role)} | Joined: {new Date(user.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
          {/** Full Name */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Full Name:</Label><p>{user.name}</p>
          </div>
          {/** Email */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Email Address:</Label><p>{user.email}</p>
          </div>
          {/** Role Badge */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Role:</Label>
            <Badge variant={roleVariants[user.role] || 'secondary'}>
              {formatRole(user.role)}
            </Badge>
          </div>
          {/** Organization */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Organization:</Label><p>{user.organization || 'N/A'}</p>
          </div>
          {/** Org Type */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Organization Type:</Label>
            <p>{user.organization_type ? user.organization_type.charAt(0).toUpperCase() + user.organization_type.slice(1) : 'N/A'}</p>
          </div>
          {/** Approval Status */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Approval Status:</Label>
            <Badge variant={user.is_approved ? 'success' : 'warning'}>
              {user.is_approved ? 'Approved' : 'Pending Approval'}
            </Badge>
          </div>
          {user.is_approved && user.approved_by && (
            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
              <Label>Approved By (ID):</Label><p>{user.approved_by}</p>
            </div>
          )}
          {user.is_approved && user.approved_at && (
            <div className="grid grid-cols-[150px_1fr] items-center gap-2">
              <Label>Approved At:</Label><p>{new Date(user.approved_at).toLocaleString()}</p>
            </div>
          )}
          {/** Google ID */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Google ID:</Label><p>{user.google_id || 'Not linked'}</p>
          </div>
          {/** Avatar URL */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Avatar URL:</Label><p className="truncate">{user.avatar || 'No avatar'}</p>
          </div>
          {/** Created / Updated */}
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Account Created:</Label><p>{new Date(user.created_at).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Last Updated:</Label><p>{new Date(user.updated_at).toLocaleString()}</p>
          </div>
        </div>

        <DialogFooter className="mt-2 flex flex-col sm:flex-row sm:justify-between items-center">
          <div className="flex gap-2 mb-2 sm:mb-0">
            {!user.is_approved ? (
              <Button
                variant="success"
                size="sm"
                onClick={() => onApprovalChange(user, true)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Approve User
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onApprovalChange(user, false)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                Revoke Approval
              </Button>
            )}
          </div>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isUpdating}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserDetailsDialog;
