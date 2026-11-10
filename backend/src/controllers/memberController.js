const crypto = require('crypto');
const User = require('../models/User');
const OrganizationMembership = require('../models/OrganizationMembership');
const Invitation = require('../models/Invitation');
const { getPlan } = require('../config/plans');
const { logActivity } = require('../utils/auditLogger');

/**
 * List all members and pending invitations for the current organization
 */
const listMembers = async (req, res, next) => {
  try {
    const members = await OrganizationMembership.find({
      organizationId: req.tenantId,
    })
      .populate('userId', 'name email avatar createdAt')
      .sort({ role: 1, joinedAt: 1 });

    const formattedMembers = members
      .filter((m) => m.userId)
      .map((m) => ({
        membershipId: m._id,
        userId: m.userId._id,
        name: m.userId.name,
        email: m.userId.email,
        avatar: m.userId.avatar,
        role: m.role,
        joinedAt: m.joinedAt,
      }));

    // Retrieve pending invitations
    const pendingInvitations = await Invitation.find({
      organizationId: req.tenantId,
      status: 'pending',
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    const formattedInvites = pendingInvitations.map((inv) => ({
      id: inv._id,
      email: inv.email,
      role: inv.role,
      token: inv.token,
      invitedBy: inv.invitedBy
        ? { id: inv.invitedBy._id, name: inv.invitedBy.name, email: inv.invitedBy.email }
        : null,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    }));

    const planConfig = getPlan(req.organization.plan);

    res.json({
      success: true,
      members: formattedMembers,
      invitations: formattedInvites,
      totalMembers: formattedMembers.length,
      maxSeats: planConfig.maxMembers,
      availableSeats: Math.max(0, planConfig.maxMembers - formattedMembers.length),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invite a user via email to join the organization
 */
const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required to send an invitation.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Invitations can only assign "admin" or "member".',
      });
    }

    // Check seat limit
    const planConfig = getPlan(req.organization.plan);
    const currentMemberCount = await OrganizationMembership.countDocuments({
      organizationId: req.tenantId,
    });

    if (currentMemberCount >= planConfig.maxMembers) {
      return res.status(403).json({
        success: false,
        message: `Plan seat limit reached (${currentMemberCount}/${planConfig.maxMembers}). Upgrade to invite additional members.`,
      });
    }

    // Check if the user is already a member
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const isMember = await OrganizationMembership.findOne({
        organizationId: req.tenantId,
        userId: existingUser._id,
      });

      if (isMember) {
        return res.status(409).json({
          success: false,
          message: 'This user is already an active member of this organization.',
        });
      }
    }

    // Check if pending invitation already exists for this email
    const existingInvite = await Invitation.findOne({
      organizationId: req.tenantId,
      email: cleanEmail,
      status: 'pending',
    });

    if (existingInvite) {
      return res.status(409).json({
        success: false,
        message: 'A pending invitation has already been issued to this email address.',
        invitationToken: existingInvite.token,
      });
    }

    // Generate token valid for 7 days
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      organizationId: req.tenantId,
      email: cleanEmail,
      role,
      token,
      invitedBy: req.user._id,
      expiresAt,
    });

    await logActivity({
      organizationId: req.tenantId,
      userId: req.user._id,
      action: 'member.invited',
      details: { email: cleanEmail, role, invitationId: invitation._id },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Invitation successfully sent to ${cleanEmail}.`,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        inviteUrl: `/invite/${invitation.token}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a member's role (Owner only)
 */
const updateMemberRole = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Target role must be either "admin" or "member".',
      });
    }

    const membership = await OrganizationMembership.findOne({
      _id: memberId,
      organizationId: req.tenantId,
    }).populate('userId', 'name email');

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Organization member not found.',
      });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Owner role cannot be changed through this endpoint.',
      });
    }

    const previousRole = membership.role;
    membership.role = role;
    await membership.save();

    await logActivity({
      organizationId: req.tenantId,
      userId: req.user._id,
      action: 'member.role_changed',
      details: {
        targetUserId: membership.userId._id,
        targetEmail: membership.userId.email,
        fromRole: previousRole,
        toRole: role,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Member role updated to ${role}.`,
      member: {
        membershipId: membership._id,
        userId: membership.userId._id,
        name: membership.userId.name,
        email: membership.userId.email,
        role: membership.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a member from the organization
 */
const removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const membership = await OrganizationMembership.findOne({
      _id: memberId,
      organizationId: req.tenantId,
    }).populate('userId', 'name email');

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this organization.',
      });
    }

    if (membership.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'The organization owner cannot be removed.',
      });
    }

    // Admins cannot remove other Admins
    if (req.userRole === 'admin' && membership.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot remove other Admins. Only the Owner can perform this action.',
      });
    }

    await OrganizationMembership.findByIdAndDelete(memberId);

    await logActivity({
      organizationId: req.tenantId,
      userId: req.user._id,
      action: 'member.removed',
      details: {
        targetUserId: membership.userId._id,
        targetEmail: membership.userId.email,
        role: membership.role,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Member ${membership.userId.name} removed from the organization.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invitation details by token (public or authenticated)
 */
const getInvitationByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate('organizationId', 'name slug plan')
      .populate('invitedBy', 'name email');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found.',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}.`,
        status: invitation.status,
      });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(410).json({
        success: false,
        message: 'This invitation has expired.',
      });
    }

    res.json({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organizationId.name,
        organizationPlan: invitation.organizationId.plan,
        invitedBy: invitation.invitedBy?.name || 'A team member',
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept an invitation
 */
const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = req.user;

    const invitation = await Invitation.findOne({ token, status: 'pending' });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or has already been used.',
      });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(410).json({
        success: false,
        message: 'This invitation has expired.',
      });
    }

    // Check if user is already a member
    const existingMembership = await OrganizationMembership.findOne({
      organizationId: invitation.organizationId,
      userId: user._id,
    });

    if (existingMembership) {
      invitation.status = 'accepted';
      await invitation.save();
      return res.json({
        success: true,
        message: 'You are already a member of this organization.',
        organizationId: invitation.organizationId,
      });
    }

    // Check seat limit at time of acceptance
    const planConfig = getPlan(req.organization?.plan || 'free');
    const memberCount = await OrganizationMembership.countDocuments({
      organizationId: invitation.organizationId,
    });

    if (memberCount >= planConfig.maxMembers) {
      return res.status(403).json({
        success: false,
        message: 'This organization has reached its seat limit. Please ask the owner to upgrade.',
      });
    }

    // Create membership
    await OrganizationMembership.create({
      organizationId: invitation.organizationId,
      userId: user._id,
      role: invitation.role,
    });

    invitation.status = 'accepted';
    await invitation.save();

    await logActivity({
      organizationId: invitation.organizationId,
      userId: user._id,
      action: 'member.joined',
      details: { email: user.email, role: invitation.role },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Invitation accepted! You have joined the organization.',
      organizationId: invitation.organizationId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke/delete a pending invitation
 */
const revokeInvitation = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    const invitation = await Invitation.findOne({
      _id: inviteId,
      organizationId: req.tenantId,
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found.',
      });
    }

    await Invitation.findByIdAndDelete(inviteId);

    await logActivity({
      organizationId: req.tenantId,
      userId: req.user._id,
      action: 'member.invite_revoked',
      details: { email: invitation.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Invitation revoked successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  getInvitationByToken,
  acceptInvitation,
  revokeInvitation,
};
