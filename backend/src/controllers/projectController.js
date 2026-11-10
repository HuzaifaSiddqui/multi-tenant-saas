const Project = require('../models/Project');
const { logActivity } = require('../utils/auditLogger');

/**
 * List all projects belonging to the current organization (Tenant Isolated)
 */
const listProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      organizationId: req.tenantId,
    })
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects: projects.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        createdBy: p.createdBy
          ? { id: p.createdBy._id, name: p.createdBy.name, email: p.createdBy.email }
          : null,
        createdAt: p.createdAt,
      })),
      total: projects.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new project within the tenant
 */
const createProject = async (req, res, next) => {
  try {
    const { name, description, priority = 'medium', status = 'planning' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required.',
      });
    }

    const project = await Project.create({
      organizationId: req.tenantId,
      name: name.trim(),
      description: description ? description.trim() : '',
      priority,
      status,
      createdBy: req.user._id,
    });

    await logActivity({
      organizationId: req.tenantId,
      userId: req.user._id,
      action: 'project.created',
      details: { projectName: project.name, projectId: project._id },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        createdAt: project.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing project (Tenant Isolated)
 */
const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, status, priority } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      organizationId: req.tenantId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in this organization.',
      });
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status) project.status = status;
    if (priority) project.priority = priority;

    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully.',
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a project (Tenant Isolated)
 */
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOneAndDelete({
      _id: projectId,
      organizationId: req.tenantId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in this organization.',
      });
    }

    await logActivity({
      organizationId: req.tenantId,
      userId: req.user._id,
      action: 'project.deleted',
      details: { projectName: project.name, projectId: project._id },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
};
