const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // SSO / Domain placeholder foundation for Enterprise readiness (Section 3)
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    ssoEnabled: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free',
      required: true,
    },
    stripeCustomerId: {
      type: String,
      default: null,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'trialing', 'incomplete'],
      default: 'active',
    },
    settings: {
      customBranding: {
        type: String,
        default: '',
      },
      supportEmail: {
        type: String,
        default: '',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Organization', organizationSchema);
