const { getPlan } = require('../config/plans');
const OrganizationMembership = require('../models/OrganizationMembership');

/**
 * Middleware to check if the organization's plan entitles them to a feature
 * @param {string} featureName
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    const plan = getPlan(req.organization?.plan || 'free');

    const featureValue = plan.features[featureName];
    if (!featureValue) {
      return res.status(403).json({
        success: false,
        message: `Feature '${featureName}' is not included in the current plan (${plan.name}). Please upgrade to unlock this feature.`,
        requiredPlan: featureName === 'customWorkspaceSettings' ? 'business' : 'pro',
      });
    }

    next();
  };
};

/**
 * Middleware to check seat limits before inviting or adding a new member
 */
const checkSeatLimit = async (req, res, next) => {
  try {
    const plan = getPlan(req.organization?.plan || 'free');
    const currentMemberCount = await OrganizationMembership.countDocuments({
      organizationId: req.tenantId,
    });

    if (currentMemberCount >= plan.maxMembers) {
      return res.status(403).json({
        success: false,
        message: `Seat limit reached (${currentMemberCount}/${plan.maxMembers} seats used). Upgrade your organization plan to invite more members.`,
        currentCount: currentMemberCount,
        maxSeats: plan.maxMembers,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireFeature,
  checkSeatLimit,
};
