import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/Badge';
import {
  FolderKanban,
  Plus,
  Trash2,
  Edit2,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export const Projects = () => {
  const { currentOrg, role } = useTenant();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) {
      fetchProjects();
    }
  }, [currentOrg]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status || 'planning',
      priority: project.priority || 'medium',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formData);
        setSuccess('Project updated successfully.');
      } else {
        await api.post('/projects', formData);
        setSuccess('Project created successfully.');
      }
      setIsModalOpen(false);
      await fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${deleteTarget.id}`);
      setSuccess('Project deleted.');
      setDeleteTarget(null);
      await fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Projects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Data items strictly isolated to <strong className="text-slate-800">{currentOrg?.name}</strong>.
            Switching workspaces provides distinct tenant data isolation.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 rounded-lg text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No projects yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by creating your first project within this tenant workspace.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 rounded-lg text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {project.priority} priority
                  </span>
                  <StatusBadge status={project.status} />
                </div>

                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{project.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center space-x-1 truncate">
                  <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{project.createdBy?.name || 'Member'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(project)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Edit Workspace Project' : 'Create New Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Q3 Cloud Architecture Migration"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summary of project goals and deliverables..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Workspace Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete Project"
      />
    </div>
  );
};
