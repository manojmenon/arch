import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useDeleteProject } from '../hooks/useProjects';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';
import { Project } from '../types';
import { OrganizationSelector } from '../components/OrganizationSelector';
import { ProjectFilters } from '../components/ProjectFilters';
import { Plus, Edit, Trash2, Eye, Folder, MapPin, DollarSign, Calendar, Clock, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

const Projects: FC = () => {
  const { filters } = useOrganizationStore();
  const { data: projects, isLoading } = useProjects(filters);
  const { hasRole } = useAuthStore();
  const deleteProjectMutation = useDeleteProject();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProjectMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const canEdit = hasRole('localadmin');
  const canDelete = hasRole('localadmin');

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">Project Portfolio</h1>
              <p className="text-xl text-emerald-100">Manage and track your residential development projects</p>
            </div>
            {canEdit && (
              <Link
                to="/projects/new"
                className="flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 text-white hover:bg-opacity-30 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Project</span>
              </Link>
            )}
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>

      {/* Filters and Organization Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <OrganizationSelector />
        </div>
        <div className="lg:col-span-3">
          <ProjectFilters />
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span>Active: {projects?.filter(p => p.status === 'active').length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Completed: {projects?.filter(p => p.status === 'completed').length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>Planning: {projects?.filter(p => p.status === 'planning').length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Total: {projects?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Folder className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6">
            No projects match your current filters. Try adjusting your search criteria or organization selection.
          </p>
          {canEdit && (
            <Link 
              to="/projects/new" 
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create New Project</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              canEdit={canEdit}
              canDelete={canDelete}
              onDelete={handleDelete}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  index: number;
}

const ProjectCard = ({ project, canEdit, canDelete, onDelete, index }: ProjectCardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'planning':
        return <AlertCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div 
      className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
              {project.name}
            </h3>
            {project.address && (
              <p className="text-sm text-gray-500 truncate mt-1">{project.address}</p>
            )}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status || 'unknown')}`}>
            {getStatusIcon(project.status || 'unknown')}
            {project.status || 'Unknown'}
          </span>
        </div>

        <div className="space-y-3">
          {/* Organization */}
          {(project as any).organization_name && (
            <div className="flex items-center text-sm text-gray-600">
              <Building2 className="w-4 h-4 mr-2 text-gray-400" />
              <span>{(project as any).organization_name}</span>
            </div>
          )}
          
          {/* Category */}
          {(project as any).category_name && (
            <div className="flex items-center text-sm text-gray-600">
              <Folder className="w-4 h-4 mr-2 text-gray-400" />
              <span>{(project as any).category_name}</span>
            </div>
          )}
          
          {project.city && project.state && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span>{project.city}, {project.state}</span>
            </div>
          )}
          
          {project.budget && (
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
              <span>${project.budget.toLocaleString()}</span>
            </div>
          )}
          
          {project.start_date && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>Started {new Date(project.start_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {(project as any).tag_names && (project as any).tag_names.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {(project as any).tag_names.map((tagName: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium text-white rounded-full"
                style={{ backgroundColor: (project as any).tag_colors?.[index] || '#6B7280' }}
              >
                {tagName}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center space-x-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 font-medium"
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Link
                to={`/projects/${project.id}/edit`}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Edit project"
              >
                <Edit className="h-4 w-4" />
              </Link>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(project.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Delete project"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;

