const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const OrganizationMembership = require('../models/OrganizationMembership');

/**
 * Tenant Isolation Middleware
 * Resolves the active organization context and strictly verifies that
 * the authenticated user is a valid member of this organization.
 */
const requireTenant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to tenant verification.',
      });
    }

    // Determine target organization ID from headers, route parameters, or query
    const targetOrgId =
      req.headers['x-organization-id'] ||
      req.params.orgId ||
      req.params.organizationId ||
      req.query.organizationId;

    if (!targetOrgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization context missing. Please provide x-organization-id header or orgId parameter.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetOrgId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization identifier format.',
      });
    }

    // Check membership - NEVER trust client ID without verification
    const membership = await OrganizationMembership.findOne({
      organizationId: targetOrgId,
      userId: req.user._id,
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not an authorized member of this organization.',
      });
    }

    const organization = await Organization.findById(targetOrgId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found or has been deactivated.',
      });
    }

    // Attach tenant context to the request
    req.tenantId = organization._id;
    req.organization = organization;
    req.membership = membership;
    req.userRole = membership.role;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireTenant,
};
