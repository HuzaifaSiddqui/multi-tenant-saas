const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['planning', 'in-progress', 'completed', 'archived'],
      default: 'planning',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying projects by organization
projectSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
