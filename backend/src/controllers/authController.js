const User = require('../models/User');
const Organization = require('../models/Organization');
const OrganizationMembership = require('../models/OrganizationMembership');
const Subscription = require('../models/Subscription');
const { generateToken } = require('../utils/jwt');
const { logActivity } = require('../utils/auditLogger');

/**
 * Register a new user and optionally create an initial default organization
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    let initialOrg = null;

    // If organizationName is supplied during signup, create workspace immediately
    if (organizationName && organizationName.trim()) {
      const slug = organizationName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

      initialOrg = await Organization.create({
        name: organizationName.trim(),
        slug,
        owner: user._id,
        plan: 'free',
      });

      // Assign owner membership
      await OrganizationMembership.create({
        organizationId: initialOrg._id,
        userId: user._id,
        role: 'owner',
      });

      // Default free subscription
      await Subscription.create({
        organizationId: initialOrg._id,
        planId: 'free',
        status: 'active',
        seatsIncluded: 3,
      });

      await logActivity({
        organizationId: initialOrg._id,
        userId: user._id,
        action: 'organization.created',
        details: { name: initialOrg.name, plan: 'free' },
        ipAddress: req.ip,
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      organization: initialOrg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign in user with email and password
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    // Retrieve user's organizations
    const memberships = await OrganizationMembership.find({ userId: user._id })
      .populate('organizationId')
      .sort({ createdAt: -1 });

    const organizations = memberships
      .filter((m) => m.organizationId) // Guard against any deleted orgs
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
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      organizations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve authenticated user profile and memberships
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    const memberships = await OrganizationMembership.find({ userId: user._id })
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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      organizations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect current password.',
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        });
      }
      user.passwordHash = await User.hashPassword(newPassword);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
