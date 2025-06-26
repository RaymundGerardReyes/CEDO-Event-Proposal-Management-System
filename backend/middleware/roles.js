// Middleware to check if user has required role(s)
const checkRole = (...allowedRoles) => {
    // Flatten the array of roles if it's passed as a nested array
    const roles = allowedRoles.flat();

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: No user data found in request' })
        }

        // Add detailed logging for debugging
        console.log(`🔐 Role Check: User role is "${req.user.role}", Allowed roles are "${roles.join(', ')}"`);

        if (!roles.includes(req.user.role)) {
            console.log(`🚫 Access Denied: User role "${req.user.role}" is not in the allowed list.`);
            return res.status(403).json({
                message: 'Forbidden: Insufficient permissions',
                requiredRoles: roles,
                userRole: req.user.role
            })
        }

        console.log(`✅ Access Granted: User role "${req.user.role}" is authorized.`);
        next()
    }
}

module.exports = checkRole 