/**
 * Role checking middleware with legacy support
 * @param {string|symbol|number|boolean|Array} allowedRoles - Single or array of allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const role = req?.user?.role;

    if (!req.user || role === undefined) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const roles = Array.isArray(allowedRoles)
      ? allowedRoles
      : Array.from(arguments);

    if (roles.length === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const hasAccess = roles.some(r => {
      if (typeof r === 'symbol') return role === r;
      return role === r;
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      console.log(`[ACCESS GRANTED] role=${String(role)}`);
    } catch (e) {
      console.warn('[SECURITY EVENT] Failed to log access grant:', e.message);
    }

    next();
  };
}

module.exports = requireRole;
