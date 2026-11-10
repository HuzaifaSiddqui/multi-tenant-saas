const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      default: null,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
      index: true,
    },
    planId: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'],
      default: 'active',
    },
    seatsIncluded: {
      type: Number,
      default: 3,
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
