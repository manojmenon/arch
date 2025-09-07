import { useProjects } from '../hooks/useProjects';
import { useAuthStore } from '../store/authStore';
import { UserAvatar } from '../components/UserAvatar';
import { FolderOpen, DollarSign, MapPin, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { data: projects, isLoading } = useProjects();
  const { user } = useAuthStore();

  const stats = [
    {
      name: 'Total Projects',
      value: projects?.length || 0,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      name: 'Total Budget',
      value: (() => {
        const totalBudget = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
        const millions = totalBudget / 1000000;
        return millions >= 1 ? `$${millions.toFixed(1)}M` : `$${totalBudget.toLocaleString()}`;
      })(),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
      change: '+8.2%',
      changeType: 'positive' as const,
    },
    {
      name: 'Active Projects',
      value: projects?.filter(p => p.status === 'active').length || 0,
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      name: 'Locations',
      value: new Set(projects?.map(p => p.city).filter(Boolean)).size || 0,
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      change: '+3',
      changeType: 'positive' as const,
    },
  ];

  const recentProjects = projects?.slice(0, 5) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {user?.username || 'User'}! 👋
              </h1>
              <p className="text-xl text-blue-100">
                Here's what's happening with your projects today.
              </p>
            </div>
            {user && (
              <div className="hidden md:block">
                <UserAvatar user={user} size="lg" className="w-20 h-20 bg-white bg-opacity-20 text-white border-4 border-white border-opacity-30" />
              </div>
            )}
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor} border ${stat.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      stat.changeType === 'positive' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
            <a
              href="/projects"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              View all
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No projects found.</p>
              <p className="text-gray-400 text-sm mt-1">Create your first project to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div 
                  key={project.id} 
                  className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <FolderOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {project.city && project.state && `${project.city}, ${project.state}`}
                        {project.budget && (() => {
                          const millions = project.budget / 1000000;
                          const budgetText = millions >= 1 ? `$${millions.toFixed(1)}M` : `$${project.budget.toLocaleString()}`;
                          return ` • ${budgetText}`;
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : project.status === 'completed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {project.status === 'active' && <Clock className="w-3 h-3 mr-1" />}
                      {project.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {project.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

