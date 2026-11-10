import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div
            className={`p-2 rounded-full flex-shrink-0 ${
              danger ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{message}</p>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition shadow-sm ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
