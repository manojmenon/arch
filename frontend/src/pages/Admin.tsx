import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Users, Shield, Settings, Activity, Search, Plus, Edit, Trash2, Eye } from 'lucide-react';

const Admin = () => {
  const { user: _user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', name: 'Users', icon: Users },
    { id: 'roles', name: 'Roles', icon: Shield },
    { id: 'system', name: 'System', icon: Settings },
    { id: 'activity', name: 'Activity', icon: Activity },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersTab />;
      case 'roles':
        return <RolesTab />;
      case 'system':
        return <SystemTab />;
      case 'activity':
        return <ActivityTab />;
      default:
        return <UsersTab />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Console</h1>
            <p className="text-blue-100 text-lg">Manage users, roles, and system settings</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">System</div>
              <div className="text-blue-100 text-sm">Management Portal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
        <nav className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

const UsersTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users] = useState([
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'superuser',
      created_at: '2024-01-01T00:00:00Z',
      last_login: '2024-01-15T10:30:00Z',
      status: 'active',
    },
    {
      id: '2',
      username: 'manager',
      email: 'manager@example.com',
      role: 'localadmin',
      created_at: '2024-01-02T00:00:00Z',
      last_login: '2024-01-14T15:45:00Z',
      status: 'active',
    },
    {
      id: '3',
      username: 'user1',
      email: 'user1@example.com',
      role: 'user',
      created_at: '2024-01-03T00:00:00Z',
      last_login: '2024-01-13T09:20:00Z',
      status: 'active',
    },
    {
      id: '4',
      username: 'suspended_user',
      email: 'suspended@example.com',
      role: 'user',
      created_at: '2024-01-04T00:00:00Z',
      last_login: '2024-01-12T08:15:00Z',
      status: 'suspended',
    },
  ]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superuser':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sysadmin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'localadmin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'org-admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'guest':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.last_login).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {filteredUsers.length} of {users.length} users
        </div>
        <div className="flex items-center space-x-4">
          <span>Active: {users.filter(u => u.status === 'active').length}</span>
          <span>Suspended: {users.filter(u => u.status === 'suspended').length}</span>
        </div>
      </div>
    </div>
  );
};

const RolesTab = () => {
  const roles = [
    {
      name: 'superuser',
      description: 'Full system access with all permissions',
      permissions: ['*'],
      users: 1,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
    },
    {
      name: 'sysadmin',
      description: 'System administration with most permissions',
      permissions: ['users:manage', 'projects:manage', 'system:configure'],
      users: 0,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
    },
    {
      name: 'localadmin',
      description: 'Local administration with project management',
      permissions: ['projects:manage', 'users:view'],
      users: 1,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
    },
    {
      name: 'org-admin',
      description: 'Organization administration with project management',
      permissions: ['projects:manage', 'users:view', 'organizations:manage'],
      users: 2,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800',
    },
    {
      name: 'user',
      description: 'Standard user with basic project access',
      permissions: ['projects:view', 'projects:create', 'tokens:manage'],
      users: 1,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
    },
    {
      name: 'guest',
      description: 'Limited read-only access',
      permissions: ['projects:view'],
      users: 0,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-800',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Role Hierarchy */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Role Hierarchy</h2>
            <p className="text-gray-600 mt-1">System roles and their permissions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role, index) => (
            <div key={role.name} className={`${role.bgColor} rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-r ${role.color} rounded-full flex items-center justify-center text-white font-bold`}>
                  {index + 1}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${role.textColor} capitalize`}>{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.users} user{role.users !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">{role.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {role.permissions.includes('*') ? 'All permissions' : `${role.permissions.length} permission${role.permissions.length !== 1 ? 's' : ''}`}
                </span>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${role.textColor} ${role.bgColor} border`}>
                  Level {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Permission Matrix</h2>
            <p className="text-gray-600 mt-1">Detailed permission breakdown by role</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission
                </th>
                {roles.map((role) => (
                  <th key={role.name} className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex flex-col items-center">
                      <span className="capitalize">{role.name}</span>
                      <span className="text-xs text-gray-400">({role.users} users)</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                'projects:view', 
                'projects:create', 
                'projects:manage', 
                'users:view', 
                'users:manage', 
                'organizations:manage',
                'tokens:manage', 
                'system:configure'
              ].map((permission) => (
                <tr key={permission} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {permission}
                  </td>
                  {roles.map((role) => (
                    <td key={role.name} className="px-6 py-4 whitespace-nowrap text-center">
                      {role.permissions.includes('*') || role.permissions.includes(permission) ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          ✓ Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          ✗ Denied
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SystemTab = () => {
  return (
    <div className="space-y-8">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">System Version</p>
              <p className="text-2xl font-bold">1.0.0</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Settings className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Uptime</p>
              <p className="text-2xl font-bold">2d 14h</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Database</p>
              <p className="text-2xl font-bold">PostgreSQL</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Environment</p>
              <p className="text-2xl font-bold">Development</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* System Information & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">System Information</h2>
              <p className="text-gray-600 mt-1">Current system status and configuration</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-3">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Application Version</h3>
                <p className="text-sm text-gray-500">Current software version</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">1.0.0</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Database Version</h3>
                <p className="text-sm text-gray-500">PostgreSQL database version</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">15.4</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Node.js Version</h3>
                <p className="text-sm text-gray-500">Runtime environment</p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">18.17.0</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Memory Usage</h3>
                <p className="text-sm text-gray-500">Current memory consumption</p>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">45%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
              <p className="text-gray-600 mt-1">Current security configuration</p>
            </div>
            <div className="bg-red-100 rounded-xl p-3">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Token Expiration</h3>
                <p className="text-sm text-gray-500">Default API token lifetime</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">4 hours</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Password Policy</h3>
                <p className="text-sm text-gray-500">Minimum password requirements</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">8+ chars</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Session Timeout</h3>
                <p className="text-sm text-gray-500">User session duration</p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">24 hours</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Login Attempts</h3>
                <p className="text-sm text-gray-500">Max failed attempts before lockout</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">5 attempts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityTab = () => {
  const activities = [
    {
      id: '1',
      user: 'admin',
      action: 'Created project',
      target: 'Residential Complex A',
      timestamp: '2024-01-15T10:30:00Z',
      type: 'create',
      icon: 'Plus',
    },
    {
      id: '2',
      user: 'manager',
      action: 'Updated project',
      target: 'Office Building B',
      timestamp: '2024-01-15T09:15:00Z',
      type: 'update',
      icon: 'Edit',
    },
    {
      id: '3',
      user: 'user1',
      action: 'Generated API token',
      target: 'My API Token',
      timestamp: '2024-01-15T08:45:00Z',
      type: 'token',
      icon: 'Shield',
    },
    {
      id: '4',
      user: 'admin',
      action: 'Deleted project',
      target: 'Old Project',
      timestamp: '2024-01-14T16:20:00Z',
      type: 'delete',
      icon: 'Trash2',
    },
    {
      id: '5',
      user: 'org-admin',
      action: 'Invited user',
      target: 'newuser@example.com',
      timestamp: '2024-01-14T14:30:00Z',
      type: 'invite',
      icon: 'Users',
    },
    {
      id: '6',
      user: 'localadmin',
      action: 'Suspended account',
      target: 'suspended_user',
      timestamp: '2024-01-14T12:15:00Z',
      type: 'suspend',
      icon: 'Shield',
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'token':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'invite':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'suspend':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'Plus':
        return <Plus className="h-4 w-4" />;
      case 'Edit':
        return <Edit className="h-4 w-4" />;
      case 'Trash2':
        return <Trash2 className="h-4 w-4" />;
      case 'Shield':
        return <Shield className="h-4 w-4" />;
      case 'Users':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">System Activity</h2>
          <p className="text-gray-600 mt-1">Recent actions and system events</p>
        </div>
        <div className="bg-blue-100 rounded-xl p-3">
          <Activity className="h-6 w-6 text-blue-600" />
        </div>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.icon)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  <span className="font-semibold text-blue-600">{activity.user}</span> {activity.action}
                </p>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Target: <span className="font-medium">{activity.target}</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActivityColor(activity.type)}`}>
                {activity.type}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Activity Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {activities.filter(a => a.type === 'create').length}
            </div>
            <div className="text-sm text-gray-500">Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {activities.filter(a => a.type === 'update').length}
            </div>
            <div className="text-sm text-gray-500">Updated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {activities.filter(a => a.type === 'delete').length}
            </div>
            <div className="text-sm text-gray-500">Deleted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {activities.filter(a => a.type === 'token').length}
            </div>
            <div className="text-sm text-gray-500">Tokens</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

