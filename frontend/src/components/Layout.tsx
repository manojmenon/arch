import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserAvatar } from './UserAvatar';
import RoleSwitcher from './RoleSwitcher';
import { 
  Home, 
  FolderOpen, 
  Key, 
  Settings, 
  LogOut, 
  User 
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout, hasRole } = useAuthStore();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'API Tokens', href: '/tokens', icon: Key },
  ];

  if (hasRole('localadmin')) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Settings });
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl border-r border-gray-200">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Project Manager</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors ${
                    isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center mb-4">
              {user && <UserAvatar user={user} size="sm" className="mr-3" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            {/* Role Switcher */}
            <div className="mb-4">
              <RoleSwitcher />
            </div>
            <div className="space-y-1">
              <Link
                to="/profile"
                className="group flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-gray-900 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <User className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                Profile
              </Link>
              <button
                onClick={logout}
                className="group flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-red-600 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <LogOut className="mr-3 h-4 w-4 text-gray-400 group-hover:text-red-600" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-8 min-h-screen">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

