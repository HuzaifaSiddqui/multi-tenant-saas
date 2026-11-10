const AuditLog = require('../models/AuditLog');
const { getPlan } = require('../config/plans');

/**
 * Get audit logs for the current organization
 * Free plan: limited to recent 10 logs
 * Pro/Business plan: full logs with pagination
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const planConfig = getPlan(req.organization.plan);
    const isLimited = planConfig.features.activityLogs === 'limited';

    let queryLimit = limit;
    if (isLimited) {
      queryLimit = 10;
    }

    const totalLogs = await AuditLog.countDocuments({
      organizationId: req.tenantId,
    });

    const logs = await AuditLog.find({ organizationId: req.tenantId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(isLimited ? 0 : skip)
      .limit(queryLimit);

    res.json({
      success: true,
      logs: logs.map((log) => ({
        id: log._id,
        action: log.action,
        details: log.details,
        user: log.userId
          ? {
              id: log.userId._id,
              name: log.userId.name,
              email: log.userId.email,
              avatar: log.userId.avatar,
            }
          : { name: 'System / Automated' },
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })),
      pagination: {
        page: isLimited ? 1 : page,
        limit: queryLimit,
        total: isLimited ? Math.min(totalLogs, 10) : totalLogs,
        hasMore: isLimited ? false : skip + logs.length < totalLogs,
      },
      isLimited,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
