const mongoose = require('mongoose');

const organizationMembershipSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee that a user has at most one membership per organization
organizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('OrganizationMembership', organizationMembershipSchema);
