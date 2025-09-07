import React, { useEffect } from 'react';
import { useOrganizationStore } from '../store/organizationStore';
import { Building2 } from 'lucide-react';

export const OrganizationSelector: React.FC = () => {
  const {
    organizations,
    selectedOrganization,
    loading,
    error,
    fetchOrganizations,
    selectOrganization,
  } = useOrganizationStore();

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading organizations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
      </div>
      
      <div className="space-y-2">
        {/* All Organizations Option */}
        <button
          onClick={() => selectOrganization(null)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            !selectedOrganization
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <div className="font-medium">All Organizations</div>
              <div className="text-sm text-gray-500">View all projects across organizations</div>
            </div>
          </div>
        </button>

        {/* Organization List */}
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => selectOrganization(org)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedOrganization?.id === org.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{org.name}</div>
                <div className="text-sm text-gray-500">
                  {org.type} • {org.project_count || 0} projects
                </div>
                {org.city && (
                  <div className="text-xs text-gray-400">{org.city}, {org.state}</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No organizations found</p>
        </div>
      )}
    </div>
  );
};
