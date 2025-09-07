import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Users, Shield, Settings, Activity } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
        <p className="text-gray-600">Manage users, roles, and system settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

const UsersTab = () => {
  const [users] = useState([
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'superuser',
      created_at: '2024-01-01T00:00:00Z',
      last_login: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      username: 'manager',
      email: 'manager@example.com',
      role: 'localadmin',
      created_at: '2024-01-02T00:00:00Z',
      last_login: '2024-01-14T15:45:00Z',
    },
    {
      id: '3',
      username: 'user1',
      email: 'user1@example.com',
      role: 'user',
      created_at: '2024-01-03T00:00:00Z',
      last_login: '2024-01-13T09:20:00Z',
    },
  ]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superuser':
        return 'bg-red-100 text-red-800';
      case 'sysadmin':
        return 'bg-orange-100 text-orange-800';
      case 'localadmin':
        return 'bg-yellow-100 text-yellow-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'guest':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">Users</h2>
        <button className="btn btn-primary">
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.last_login).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    },
    {
      name: 'sysadmin',
      description: 'System administration with most permissions',
      permissions: ['users:manage', 'projects:manage', 'system:configure'],
      users: 0,
    },
    {
      name: 'localadmin',
      description: 'Local administration with project management',
      permissions: ['projects:manage', 'users:view'],
      users: 1,
    },
    {
      name: 'user',
      description: 'Standard user with basic project access',
      permissions: ['projects:view', 'projects:create', 'tokens:manage'],
      users: 1,
    },
    {
      name: 'guest',
      description: 'Limited read-only access',
      permissions: ['projects:view'],
      users: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Role Hierarchy</h2>
        <div className="space-y-4">
          {roles.map((role, index) => (
            <div key={role.name} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 capitalize">{role.name}</h3>
                <p className="text-sm text-gray-500">{role.description}</p>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    {role.users} user{role.users !== 1 ? 's' : ''} • {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Permission Matrix</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission
                </th>
                {roles.map((role) => (
                  <th key={role.name} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {['projects:view', 'projects:create', 'projects:manage', 'users:view', 'users:manage', 'tokens:manage', 'system:configure'].map((permission) => (
                <tr key={permission}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {permission}
                  </td>
                  {roles.map((role) => (
                    <td key={role.name} className="px-6 py-4 whitespace-nowrap text-center">
                      {role.permissions.includes('*') || role.permissions.includes(permission) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          ✗
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Version:</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Environment:</span>
            <span className="text-sm font-medium">Development</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Database:</span>
            <span className="text-sm font-medium">PostgreSQL 15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Uptime:</span>
            <span className="text-sm font-medium">2 days, 14 hours</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Token Expiration</h3>
              <p className="text-sm text-gray-500">Default API token lifetime</p>
            </div>
            <span className="text-sm font-medium">4 hours</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Password Policy</h3>
              <p className="text-sm text-gray-500">Minimum password requirements</p>
            </div>
            <span className="text-sm font-medium">8 characters</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Session Timeout</h3>
              <p className="text-sm text-gray-500">User session duration</p>
            </div>
            <span className="text-sm font-medium">24 hours</span>
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
    },
    {
      id: '2',
      user: 'manager',
      action: 'Updated project',
      target: 'Office Building B',
      timestamp: '2024-01-15T09:15:00Z',
    },
    {
      id: '3',
      user: 'user1',
      action: 'Generated API token',
      target: 'My API Token',
      timestamp: '2024-01-15T08:45:00Z',
    },
    {
      id: '4',
      user: 'admin',
      action: 'Deleted project',
      target: 'Old Project',
      timestamp: '2024-01-14T16:20:00Z',
    },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;

