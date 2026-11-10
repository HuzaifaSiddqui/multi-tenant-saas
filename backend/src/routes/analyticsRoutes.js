const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

// Tenant analytics
router.get('/', authenticate, requireTenant, getAnalytics);

module.exports = router;
