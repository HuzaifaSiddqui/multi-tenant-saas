/**
 * Subscription Plan Definitions and Feature Entitlements
 */
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for small teams and prototyping.',
    maxMembers: 3,
    priceMonthly: 0,
    priceId: null,
    features: {
      basicDashboard: true,
      activityLogs: 'limited', // limited to last 10 logs
      advancedAnalytics: false,
      customWorkspaceSettings: false,
    },
    limits: {
      projects: 5,
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams requiring analytics and collaboration.',
    maxMembers: 10,
    priceMonthly: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    features: {
      basicDashboard: true,
      activityLogs: 'full',
      advancedAnalytics: true,
      customWorkspaceSettings: false,
    },
    limits: {
      projects: 50,
    }
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For organizations that need maximum capacity and custom control.',
    maxMembers: 25,
    priceMonthly: 99,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business_monthly',
    features: {
      basicDashboard: true,
      activityLogs: 'full',
      advancedAnalytics: true,
      customWorkspaceSettings: true,
    },
    limits: {
      projects: 200,
    }
  }
};

/**
 * Get plan details by plan identifier
 * @param {string} planId
 * @returns {object}
 */
const getPlan = (planId) => {
  return PLANS[planId] || PLANS.free;
};

module.exports = {
  PLANS,
  getPlan
};
