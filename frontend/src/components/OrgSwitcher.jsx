import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { RoleBadge } from './Badge';
import { Building2, ChevronDown, Check, Plus, Layers } from 'lucide-react';

export const OrgSwitcher = () => {
  const { organizations } = useAuth();
  const { currentOrg, activeOrgId, switchOrganization } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrg = (orgId) => {
    switchOrganization(orgId);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    navigate('/organizations/new');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
      >
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {currentOrg?.name?.charAt(0)?.toUpperCase() || 'W'}
          </div>
          <div className="text-left truncate">
            <span className="block truncate font-semibold text-xs tracking-tight text-slate-900">
              {currentOrg?.name || 'Select Workspace'}
            </span>
            <span className="block text-[11px] text-slate-500 capitalize">
              {currentOrg?.plan || 'Free'} Plan
            </span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspaces
          </div>

          {organizations.map((org) => {
            const isSelected = org.id === activeOrgId;
            return (
              <button
                key={org.id}
                type="button"
                onClick={() => handleSelectOrg(org.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition ${
                  isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-semibold ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{org.name}</span>
                </div>
                <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                  <RoleBadge role={org.role} />
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 ml-1" />}
                </div>
              </button>
            );
          })}

          <div className="border-t border-slate-100 my-1 pt-1">
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-blue-600 font-medium hover:bg-blue-50 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
