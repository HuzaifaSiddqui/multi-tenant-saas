const Organization = require('../models/Organization');
const OrganizationMembership = require('../models/OrganizationMembership');
const Subscription = require('../models/Subscription');
const Invitation = require('../models/Invitation');
const AuditLog = require('../models/AuditLog');
const Project = require('../models/Project');
const { getPlan } = require('../config/plans');
const { logActivity } = require('../utils/auditLogger');

/**
 * Create a new workspace / organization
 */
const createOrganization = async (req, res, next) => {
  try {
    const { name, domain } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Organization name is required.',
      });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const organization = await Organization.create({
      name: name.trim(),
      slug,
      domain: domain ? domain.trim().toLowerCase() : '',
      owner: req.user._id,
      plan: 'free',
    });

    // Create owner membership
    const membership = await OrganizationMembership.create({
      organizationId: organization._id,
      userId: req.user._id,
      role: 'owner',
    });

    // Default subscription
    await Subscription.create({
      organizationId: organization._id,
      planId: 'free',
      status: 'active',
      seatsIncluded: 3,
    });

    await logActivity({
      organizationId: organization._id,
      userId: req.user._id,
      action: 'organization.created',
      details: { name: organization.name, plan: 'free' },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully.',
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        role: membership.role,
        domain: organization.domain,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all organizations the authenticated user belongs to
 */
const getUserOrganizations = async (req, res, next) => {
  try {
    const memberships = await OrganizationMembership.find({ userId: req.user._id })
      .populate('organizationId')
      .sort({ createdAt: -1 });

    const organizations = memberships
      .filter((m) => m.organizationId)
      .map((m) => ({
        id: m.organizationId._id,
        name: m.organizationId.name,
        slug: m.organizationId.slug,
        plan: m.organizationId.plan,
        role: m.role,
        joinedAt: m.joinedAt,
      }));

    res.json({
      success: true,
      organizations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get details for current organization
 */
const getOrganizationDetails = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.tenantId).populate(
      'owner',
      'name email avatar'
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.',
      });
    }

    const memberCount = await OrganizationMembership.countDocuments({
      organizationId: organization._id,
    });

    const planConfig = getPlan(organization.plan);

    res.json({
      success: true,
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        domain: organization.domain,
        ssoEnabled: organization.ssoEnabled,
        plan: organization.plan,
        planDetails: planConfig,
        owner: organization.owner,
        subscriptionStatus: organization.subscriptionStatus,
        settings: organization.settings,
        memberCount,
        availableSeats: Math.max(0, planConfig.maxMembers - memberCount),
        currentUserRole: req.userRole,
        createdAt: organization.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update organization settings and metadata
 */
const updateOrganization = async (req, res, next) => {
  try {
    const { name, domain, ssoEnabled, settings } = req.body;
    const organization = req.organization;
    const planConfig = getPlan(organization.plan);

    const changes = {};

    if (name && name.trim()) {
      changes.name = { from: organization.name, to: name.trim() };
      organization.name = name.trim();
    }

    if (domain !== undefined) {
      organization.domain = domain.trim().toLowerCase();
      changes.domain = organization.domain;
    }

    if (ssoEnabled !== undefined) {
      organization.ssoEnabled = Boolean(ssoEnabled);
      changes.ssoEnabled = organization.ssoEnabled;
    }

    if (settings) {
      // Check custom workspace settings entitlement
      if (!planConfig.features.customWorkspaceSettings && (settings.customBranding || settings.supportEmail)) {
        return res.status(403).json({
          success: false,
          message: 'Custom workspace branding and support email settings are exclusive to the Business plan.',
          requiredPlan: 'business',
        });
      }

      organization.settings = {
        ...organization.settings,
        ...settings,
      };
      changes.settings = organization.settings;
    }

    await organization.save();

    await logActivity({
      organizationId: organization._id,
      userId: req.user._id,
      action: 'organization.settings_updated',
      details: changes,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Organization updated successfully.',
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        domain: organization.domain,
        ssoEnabled: organization.ssoEnabled,
        plan: organization.plan,
        settings: organization.settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete organization (Owner only)
 */
const deleteOrganization = async (req, res, next) => {
  try {
    const orgId = req.tenantId;

    // Remove memberships, projects, invitations, audit logs, and the org
    await Promise.all([
      OrganizationMembership.deleteMany({ organizationId: orgId }),
      Invitation.deleteMany({ organizationId: orgId }),
      Project.deleteMany({ organizationId: orgId }),
      Subscription.deleteOne({ organizationId: orgId }),
      AuditLog.deleteMany({ organizationId: orgId }),
      Organization.findByIdAndDelete(orgId),
    ]);

    res.json({
      success: true,
      message: 'Organization and all associated workspace data permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganizationDetails,
  updateOrganization,
  deleteOrganization,
};
