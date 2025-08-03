// middleware/checkRole.js

/**
 * Role-based access control middleware.
 * Accepts a list of allowed roles and checks user access.
 */

module.exports = function checkRole(...allowedRoles) {
  const roles = allowedRoles.flat(Infinity);

  return function (req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ msg: 'Not authorized. No user in request.' });
      }

      if (req.user.role === null) {
        return res.status(401).json({ msg: 'Not authorized. Role is null.' });
      }

      if (typeof req.user.role === 'undefined') {
        return res.status(403).json({ msg: 'Access denied. Role is undefined.' });
      }

      if (!roles.length) {
        return res.status(403).json({ msg: 'Access denied. No roles configured.' });
      }

      const hasAccess = roles.some(role => {
        return typeof role === 'symbol'
          ? role.toString() === req.user.role?.toString?.()
          : role === req.user.role;
      });

      if (!hasAccess) {
        return res.status(403).json({ msg: 'Access denied. Role not permitted.' });
      }

      const roleStr = (() => {
        try {
          return typeof req.user.role === 'symbol' ? req.user.role.toString() : String(req.user.role);
        } catch {
          return '[unprintable]';
        }
      })();

      console.log(`✅ Access granted for role '${roleStr}' on ${req.method} ${req.path}`);
      next();
    } catch (err) {
      console.error('checkRole middleware error:', err.message || err);
      res.status(500).json({ msg: 'Internal server error' });
    }
  };
};
