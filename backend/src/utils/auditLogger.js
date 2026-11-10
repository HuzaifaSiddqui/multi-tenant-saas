const AuditLog = require('../models/AuditLog');

/**
 * Record an audit log event for an organization
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} [params.userId]
 * @param {string} params.action
 * @param {object} [params.details]
 * @param {string} [params.ipAddress]
 */
const logActivity = async ({ organizationId, userId, action, details = {}, ipAddress = '' }) => {
  try {
    await AuditLog.create({
      organizationId,
      userId,
      action,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error(`[AuditLog Error] Failed to log activity ${action}:`, error.message);
  }
};

module.exports = {
  logActivity,
};
