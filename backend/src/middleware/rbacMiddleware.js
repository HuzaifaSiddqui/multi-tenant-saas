/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the user's role in the current tenant fulfills the required permission level.
 */

/**
 * Require one of the specified roles within the tenant
 * @param {string[]} allowedRoles E.g. ['owner', 'admin'] or ['owner']
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        success: false,
        message: 'No tenant role context found. Ensure requireTenant middleware is executed first.',
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. This action requires one of the following roles: [${allowedRoles.join(', ')}]. Your current role is '${req.userRole}'.`,
      });
    }

    next();
  };
};

const requireOwner = requireRole(['owner']);
const requireAdminOrOwner = requireRole(['owner', 'admin']);

module.exports = {
  requireRole,
  requireOwner,
  requireAdminOrOwner,
};
