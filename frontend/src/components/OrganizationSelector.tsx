import React, { useEffect } from 'react';
import { useOrganizationStore } from '../store/organizationStore';
import { Building2, Users, Crown, Shield, UserCheck, User } from 'lucide-react';

export const OrganizationSelector: React.FC = () => {
  const {
    organizations,
    userOrganizations,
    selectedOrganization,
    loading,
    error,
    fetchOrganizations,
    fetchUserOrganizations,
    selectOrganization,
    switchToUserOrganization,
  } = useOrganizationStore();

  useEffect(() => {
    fetchOrganizations();
    fetchUserOrganizations();
  }, [fetchOrganizations, fetchUserOrganizations]);

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
      
      <div className="space-y-4">
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

        {/* My Organizations Section */}
        {userOrganizations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-green-600" />
              <h4 className="text-sm font-semibold text-gray-700">My Organizations</h4>
            </div>
            <div className="space-y-2">
              {userOrganizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => switchToUserOrganization(org.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedOrganization?.id === org.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{org.name}</div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          org.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                          org.role === 'admin' ? 'bg-red-100 text-red-800' :
                          org.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {org.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                          {org.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                          {org.role === 'manager' && <UserCheck className="h-3 w-3 mr-1" />}
                          {org.role === 'viewer' && <User className="h-3 w-3 mr-1" />}
                          {org.role}
                        </span>
                      </div>
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
          </div>
        )}

        {/* All Organizations Section */}
        {organizations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-700">All Organizations</h4>
            </div>
            <div className="space-y-2">
              {organizations
                .filter(org => !userOrganizations.some(userOrg => userOrg.id === org.id))
                .map((org) => (
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
          </div>
        )}
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
