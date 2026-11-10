const express = require('express');
const router = express.Router();
const {
  createOrganization,
  getUserOrganizations,
  getOrganizationDetails,
  updateOrganization,
  deleteOrganization,
} = require('../controllers/orgController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { requireOwner, requireAdminOrOwner } = require('../middleware/rbacMiddleware');

// All organization routes require authentication
router.use(authenticate);

// List user's organizations and create new organization
router.get('/', getUserOrganizations);
router.post('/', createOrganization);

// Tenant-scoped routes
router.get('/:orgId', requireTenant, getOrganizationDetails);
router.put('/:orgId', requireTenant, requireAdminOrOwner, updateOrganization);
router.delete('/:orgId', requireTenant, requireOwner, deleteOrganization);

module.exports = router;
