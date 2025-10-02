// frontend/src/utils/permissions.js

/**
 * checkPermissions
 * Lightweight client-side guard. Server must still enforce roles.
 */
export function checkPermissions(user, action) {
    if (!user) return false;
    const role = user.role || user.user_role || 'student';
    const adminActions = new Set(['approve', 'deny', 'bulkApprove', 'bulkDeny', 'viewAdmin']);
    if (adminActions.has(action)) return role === 'admin' || role === 'superadmin';
    return true;
}

