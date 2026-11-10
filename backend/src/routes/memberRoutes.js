const express = require('express');
const router = express.Router();
const {
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  revokeInvitation,
} = require('../controllers/memberController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { requireOwner, requireAdminOrOwner } = require('../middleware/rbacMiddleware');
const { checkSeatLimit } = require('../middleware/entitlementMiddleware');

// All member routes require auth and tenant isolation
router.use(authenticate, requireTenant);

// List members & invitations
router.get('/', listMembers);

// Invite a new member (Admin or Owner only + Seat limit enforcement)
router.post('/invite', requireAdminOrOwner, checkSeatLimit, inviteMember);

// Change member role (Owner only)
router.patch('/:memberId/role', requireOwner, updateMemberRole);

// Remove member (Admin or Owner)
router.delete('/:memberId', requireAdminOrOwner, removeMember);

// Revoke an invitation (Admin or Owner)
router.delete('/invitations/:inviteId', requireAdminOrOwner, revokeInvitation);

module.exports = router;
