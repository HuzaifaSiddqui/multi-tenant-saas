const express = require('express');
const router = express.Router();
const {
  getBillingOverview,
  createCheckoutSession,
  testModeChangePlan,
  cancelSubscription,
} = require('../controllers/billingController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { requireOwner } = require('../middleware/rbacMiddleware');

// All billing endpoints require authentication and tenant context
router.use(authenticate, requireTenant);

// View current plan & billing status (accessible to all members of the tenant)
router.get('/', getBillingOverview);

// Upgrade / Checkout / Cancel (restricted to Owner only)
router.post('/checkout', requireOwner, createCheckoutSession);
router.post('/test-upgrade', requireOwner, testModeChangePlan);
router.post('/cancel', requireOwner, cancelSubscription);

module.exports = router;
