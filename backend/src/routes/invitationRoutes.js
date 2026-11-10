const express = require('express');
const router = express.Router();
const {
  getInvitationByToken,
  acceptInvitation,
} = require('../controllers/memberController');
const { authenticate } = require('../middleware/authMiddleware');

// Public route to view invite metadata (org name, inviter)
router.get('/:token', getInvitationByToken);

// Authenticated route to accept invitation
router.post('/:token/accept', authenticate, acceptInvitation);

module.exports = router;
