import { useState } from 'react';
import { useRoleStatus, useSwitchRole, useReturnRole } from '../hooks/useAuth';
import { Role } from '../types';
import { Shield, User, Settings, Clock, AlertCircle } from 'lucide-react';

const RoleSwitcher = () => {
  const { data: roleStatus, isLoading } = useRoleStatus();
  const switchRoleMutation = useSwitchRole();
  const returnRoleMutation = useReturnRole();
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expiresInHours, setExpiresInHours] = useState<number>(24);

  if (isLoading || !roleStatus) return null;

  const { original_role, effective_role, is_inheriting, inheritance, available_roles } = roleStatus;

  // Don't show switcher if user can't inherit any roles
  if (available_roles.length === 0) return null;

  const handleSwitchRole = async () => {
    if (!selectedRole) return;
    
    try {
      await switchRoleMutation.mutateAsync({
        target_role: selectedRole,
        expires_in_hours: expiresInHours
      });
      setShowModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  };

  const handleReturnRole = async () => {
    try {
      await returnRoleMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to return to original role:', error);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'superuser': return <Shield className="w-4 h-4" />;
      case 'localadmin': return <Settings className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'superuser': return 'bg-red-100 text-red-800 border-red-200';
      case 'localadmin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      {/* Role Status Display */}
      <div className="flex items-center space-x-2">
        {is_inheriting ? (
          <div className="flex items-center space-x-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(effective_role)}`}>
              {getRoleIcon(effective_role)}
              <span className="ml-1">{effective_role}</span>
            </div>
            <span className="text-xs text-gray-500">as</span>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(original_role)}`}>
              {getRoleIcon(original_role)}
              <span className="ml-1">{original_role}</span>
            </div>
            {inheritance?.expires_at && (
              <div className="flex items-center text-xs text-amber-600">
                <Clock className="w-3 h-3 mr-1" />
                <span>Expires: {new Date(inheritance.expires_at).toLocaleString()}</span>
              </div>
            )}
            <button
              onClick={handleReturnRole}
              disabled={returnRoleMutation.isLoading}
              className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
            >
              Return to {original_role}
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(effective_role)}`}>
              {getRoleIcon(effective_role)}
              <span className="ml-1">{effective_role}</span>
            </div>
            {available_roles.length > 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Switch Role
              </button>
            )}
          </div>
        )}
      </div>

      {/* Role Switch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Switch Role</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Role: {original_role}
                </label>
                <div className="space-y-2">
                  {available_roles.map((role) => (
                    <label key={role} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={(e) => setSelectedRole(e.target.value as Role)}
                        className="text-blue-600"
                      />
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(role)}`}>
                        {getRoleIcon(role)}
                        <span className="ml-1">{role}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires in (hours) - Leave empty for no expiration
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="24"
                />
              </div>

              <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>You will inherit the selected role's permissions and limitations (downgrade only).</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSwitchRole}
                disabled={!selectedRole || switchRoleMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {switchRoleMutation.isLoading ? 'Switching...' : 'Switch Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoleSwitcher;
