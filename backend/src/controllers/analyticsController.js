const OrganizationMembership = require('../models/OrganizationMembership');
const AuditLog = require('../models/AuditLog');
const Project = require('../models/Project');
const { getPlan } = require('../config/plans');

/**
 * Get organization analytics and usage statistics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const orgId = req.tenantId;
    const planConfig = getPlan(req.organization.plan);
    const hasAdvancedAnalytics = Boolean(planConfig.features.advancedAnalytics);

    // Basic Metrics (All plans)
    const [totalMembers, totalProjects, projectStatusCounts] = await Promise.all([
      OrganizationMembership.countDocuments({ organizationId: orgId }),
      Project.countDocuments({ organizationId: orgId }),
      Project.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = { planning: 0, 'in-progress': 0, completed: 0, archived: 0 };
    projectStatusCounts.forEach((item) => {
      if (item._id) statusMap[item._id] = item.count;
    });

    // Role breakdown
    const roleCounts = await OrganizationMembership.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const rolesMap = { owner: 0, admin: 0, member: 0 };
    roleCounts.forEach((r) => {
      if (r._id) rolesMap[r._id] = r.count;
    });

    let advancedData = null;

    if (hasAdvancedAnalytics) {
      // Member join history over past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [memberGrowth, activityBreakdown] = await Promise.all([
        OrganizationMembership.aggregate([
          {
            $match: {
              organizationId: orgId,
              joinedAt: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$joinedAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        AuditLog.aggregate([
          { $match: { organizationId: orgId } },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
      ]);

      advancedData = {
        memberGrowth,
        activityBreakdown,
      };
    }

    res.json({
      success: true,
      hasAdvancedAnalytics,
      plan: req.organization.plan,
      overview: {
        totalMembers,
        maxSeats: planConfig.maxMembers,
        usedSeats: totalMembers,
        availableSeats: Math.max(0, planConfig.maxMembers - totalMembers),
        seatUtilizationPercentage: Math.round((totalMembers / planConfig.maxMembers) * 100),
        totalProjects,
      },
      roles: rolesMap,
      projectStatus: statusMap,
      advanced: advancedData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
