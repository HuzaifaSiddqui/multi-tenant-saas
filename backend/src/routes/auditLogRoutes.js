const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

// Tenant audit logs
router.get('/', authenticate, requireTenant, getAuditLogs);

module.exports = router;
