const express = require('express');
const router = express.Router();
const {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

// Projects require auth and tenant isolation
router.use(authenticate, requireTenant);

router.get('/', listProjects);
router.post('/', createProject);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

module.exports = router;
