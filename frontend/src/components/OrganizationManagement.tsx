import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import { 
  Users, UserPlus, Crown, Shield, UserCheck, User, 
  Edit3, Trash2, Mail, X, Save
} from 'lucide-react';

interface OrganizationMember {
  id: string;
  username: string;
  email: string;
  system_role: string;
  organization_role: string;
  permissions?: any;
  joined_at: string;
  updated_at: string;
}

interface OrganizationManagementProps {
  organizationId: string;
  organizationName: string;
  userRole: string;
}

export const OrganizationManagement: React.FC<OrganizationManagementProps> = ({
  organizationId,
  organizationName,
  userRole,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState({ email: '', role: 'member' });
  const [editRole, setEditRole] = useState('');

  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery<OrganizationMember[]>(
    ['organization', organizationId, 'members'],
    async () => {
      const response = await apiClient.get(`/organizations/${organizationId}/members`) as OrganizationMember[];
      return response;
    },
    {
      enabled: ['owner', 'admin'].includes(userRole),
    }
  );

  const inviteUserMutation = useMutation(
    async (data: { email: string; role: string }) => {
      const response = await apiClient.post(`/organizations/${organizationId}/invite`, data);
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['organization', organizationId, 'members']);
        setShowInviteModal(false);
        setInviteData({ email: '', role: 'member' });
      },
    }
  );

  const updateRoleMutation = useMutation(
    async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiClient.put(
        `/organizations/${organizationId}/members/${userId}/role`,
        { role }
      );
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['organization', organizationId, 'members']);
        setEditingMember(null);
        setEditRole('');
      },
    }
  );

  const removeUserMutation = useMutation(
    async (userId: string) => {
      const response = await apiClient.delete(
        `/organizations/${organizationId}/members/${userId}`
      );
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['organization', organizationId, 'members']);
      },
    }
  );

  const handleInviteUser = () => {
    inviteUserMutation.mutate(inviteData);
  };

  const handleUpdateRole = (userId: string) => {
    updateRoleMutation.mutate({ userId, role: editRole });
  };

  const handleRemoveUser = (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to remove ${username} from this organization?`)) {
      removeUserMutation.mutate(userId);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'manager': return <UserCheck className="w-4 h-4" />;
      case 'viewer': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  if (!['owner', 'admin'].includes(userRole)) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Members</h2>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading members...</span>
          </div>
        ) : members && members.length > 0 ? (
          <div className="space-y-4">
            {members.map((member: OrganizationMember) => (
              <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.username}</h3>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {editingMember === member.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                          {userRole === 'owner' && <option value="owner">Owner</option>}
                        </select>
                        <button
                          onClick={() => handleUpdateRole(member.id)}
                          disabled={updateRoleMutation.isLoading}
                          className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMember(null);
                            setEditRole('');
                          }}
                          className="p-1 text-gray-600 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.organization_role)}`}>
                          {getRoleIcon(member.organization_role)}
                          <span className="ml-1 capitalize">{member.organization_role}</span>
                        </span>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingMember(member.id);
                              setEditRole(member.organization_role);
                            }}
                            className="p-1 text-gray-600 hover:text-blue-600"
                            title="Edit role"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveUser(member.id, member.username)}
                            className="p-1 text-gray-600 hover:text-red-600"
                            title="Remove user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Members</h3>
            <p className="text-gray-500">This organization doesn't have any members yet.</p>
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invite User to {organizationName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  {userRole === 'owner' && <option value="owner">Owner</option>}
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleInviteUser}
                disabled={inviteUserMutation.isLoading || !inviteData.email}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>{inviteUserMutation.isLoading ? 'Inviting...' : 'Send Invite'}</span>
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteData({ email: '', role: 'member' });
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
