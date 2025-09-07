import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject, useUpdateProject, useProjectVersions } from '../hooks/useProjects';
import { useAuthStore } from '../store/authStore';
import { Project } from '../types';
import { 
  ArrowLeft, Edit, Save, X, Calendar, MapPin, Building2, 
  Folder, DollarSign, Clock, CheckCircle, AlertCircle, 
  Tag, FileText, Settings, Eye, History, Shield
} from 'lucide-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id!);
  const { data: versions, isLoading: versionsLoading } = useProjectVersions(id!);
  const { hasRole } = useAuthStore();
  const updateProjectMutation = useUpdateProject();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Project>>({});
  const [showVersions, setShowVersions] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<any>(null);

  const canEdit = hasRole('localadmin');

  const handleEdit = () => {
    if (project) {
      setEditData(project);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      await updateProjectMutation.mutateAsync({ id, data: editData });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleViewVersion = (version: any) => {
    setViewingVersion(version);
  };

  const handleCloseVersionView = () => {
    setViewingVersion(null);
  };

  const handleJsonChange = (field: 'metadata' | 'documents', value: string) => {
    try {
      const parsed = JSON.parse(value);
      setEditData(prev => ({ ...prev, [field]: parsed }));
    } catch (error) {
      // Invalid JSON, but keep the string for editing
      setEditData(prev => ({ ...prev, [field]: value }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 mr-2" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 mr-2" />;
      case 'planning':
        return <AlertCircle className="w-4 h-4 mr-2" />;
      default:
        return <Settings className="w-4 h-4 mr-2" />;
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h3>
          <p className="text-gray-500 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Link 
            to="/projects" 
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Projects</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentData = isEditing ? editData : project;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link
                to="/projects"
                className="flex items-center space-x-2 text-white hover:text-emerald-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Projects</span>
              </Link>
              <div className="h-8 w-px bg-white bg-opacity-30"></div>
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
                <p className="text-xl text-emerald-100">Project Details & Management</p>
                {project.version && (
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white">
                      <Shield className="w-4 h-4 mr-2" />
                      Version {project.version}
                    </span>
                    {versions && versions.length > 0 && (
                      <button
                        onClick={() => setShowVersions(!showVersions)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors"
                      >
                        <History className="w-4 h-4 mr-2" />
                        {versions.length} archived version{versions.length !== 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {canEdit && (
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={updateProjectMutation.isLoading}
                      className="flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 text-white hover:bg-opacity-30 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30"
                    >
                      <Save className="h-5 w-5" />
                      <span className="font-medium">
                        {updateProjectMutation.isLoading ? 'Saving...' : 'Save Changes'}
                      </span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-6 py-3 bg-red-500 bg-opacity-20 text-white hover:bg-opacity-30 rounded-xl transition-all duration-200 backdrop-blur-sm border border-red-300 border-opacity-30"
                    >
                      <X className="h-5 w-5" />
                      <span className="font-medium">Cancel</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 text-white hover:bg-opacity-30 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30"
                  >
                    <Edit className="h-5 w-5" />
                    <span className="font-medium">Edit Project</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <div className="mt-2">
                {isEditing ? (
                  <select
                    value={currentData.status || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status || 'unknown')}`}>
                    {getStatusIcon(project.status || 'unknown')}
                    {project.status || 'Unknown'}
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Budget Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget</p>
              <div className="mt-2">
                {isEditing ? (
                  <input
                    type="number"
                    value={currentData.budget || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                  </p>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Organization Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Organization</p>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {(project as any).organization_name || 'Not assigned'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Category Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Category</p>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {(project as any).category_name || 'Not categorized'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Folder className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-emerald-600" />
              Project Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900 font-medium">{project.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.owner_name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, owner_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900 font-medium">{project.owner_name || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-3 text-emerald-600" />
              Location Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.address || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900 font-medium">{project.address || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.city || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900 font-medium">{project.city || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.state || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900 font-medium">{project.state || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.postal_code || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900 font-medium">{project.postal_code || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          {(project as any).tag_names && (project as any).tag_names.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Tag className="w-6 h-6 mr-3 text-emerald-600" />
                Project Tags
              </h2>
              <div className="flex flex-wrap gap-3">
                {(project as any).tag_names.map((tagName: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 text-sm font-medium text-white rounded-full shadow-sm"
                    style={{ backgroundColor: (project as any).tag_colors?.[index] || '#6B7280' }}
                  >
                    {tagName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* JSON Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-3 text-emerald-600" />
                Project Metadata
              </h2>
              {isEditing ? (
                <AceEditor
                  mode="json"
                  theme="github"
                  value={JSON.stringify(currentData.metadata || {}, null, 2)}
                  onChange={(value) => handleJsonChange('metadata', value)}
                  height="300px"
                  width="100%"
                  fontSize={14}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={true}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                  }}
                />
              ) : (
                <pre className="bg-gray-50 p-6 rounded-lg text-sm overflow-auto max-h-80 border border-gray-200">
                  {JSON.stringify(project.metadata || {}, null, 2)}
                </pre>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-emerald-600" />
                Project Documents
              </h2>
              {isEditing ? (
                <AceEditor
                  mode="json"
                  theme="github"
                  value={JSON.stringify(currentData.documents || {}, null, 2)}
                  onChange={(value) => handleJsonChange('documents', value)}
                  height="300px"
                  width="100%"
                  fontSize={14}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={true}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                  }}
                />
              ) : (
                <pre className="bg-gray-50 p-6 rounded-lg text-sm overflow-auto max-h-80 border border-gray-200">
                  {JSON.stringify(project.documents || {}, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-emerald-600" />
              Project Timeline
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={currentData.start_date || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900 font-medium">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={currentData.end_date || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900 font-medium">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Eye className="w-6 h-6 mr-3 text-emerald-600" />
              Project Information
            </h2>
            <div className="space-y-6">
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Created</span>
                <p className="text-lg text-gray-900 font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Last Updated</span>
                <p className="text-lg text-gray-900 font-medium">{new Date(project.updated_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Project ID</span>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-3 rounded-lg break-all">{project.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Versions Section */}
      {showVersions && versions && versions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <History className="w-6 h-6 mr-3 text-emerald-600" />
            Project Version History
          </h2>
          
          {versionsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div key={version.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        Version {version.version}
                      </span>
                      <span className="text-sm text-gray-500">
                        Archived {new Date(version.archived_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {index === 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Previous Version
                        </span>
                      )}
                      <button
                        onClick={() => handleViewVersion(version)}
                        className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Version
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <p className="text-gray-900">{version.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <p className="text-gray-900">{version.status}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Budget:</span>
                      <p className="text-gray-900">
                        {version.budget ? `$${version.budget.toLocaleString()}` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Owner:</span>
                      <p className="text-gray-900">{version.owner_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <p className="text-gray-900">
                        {version.city && version.state ? `${version.city}, ${version.state}` : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Updated:</span>
                      <p className="text-gray-900">{new Date(version.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {version.description && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-900 mt-1">{version.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Version View Modal */}
      {viewingVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <History className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {viewingVersion.name} - Version {viewingVersion.version}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Archived on {new Date(viewingVersion.archived_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseVersionView}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Project Name</span>
                      <p className="text-lg text-gray-900 font-medium">{viewingVersion.name}</p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Status</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        viewingVersion.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : viewingVersion.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : viewingVersion.status === 'planning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingVersion.status || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Priority</span>
                      <p className="text-gray-900">{viewingVersion.priority || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Budget</span>
                      <p className="text-lg text-gray-900 font-medium">
                        {viewingVersion.budget ? `$${viewingVersion.budget.toLocaleString()}` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Owner</span>
                      <p className="text-gray-900">{viewingVersion.owner_name || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Location Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Address</span>
                      <p className="text-gray-900">{viewingVersion.address || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">City</span>
                      <p className="text-gray-900">{viewingVersion.city || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">State</span>
                      <p className="text-gray-900">{viewingVersion.state || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Postal Code</span>
                      <p className="text-gray-900">{viewingVersion.postal_code || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline and Metadata */}
              <div className="space-y-6">
                {/* Timeline */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Timeline
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Start Date</span>
                      <p className="text-gray-900">
                        {viewingVersion.start_date ? new Date(viewingVersion.start_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">End Date</span>
                      <p className="text-gray-900">
                        {viewingVersion.end_date ? new Date(viewingVersion.end_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Created</span>
                      <p className="text-gray-900">{new Date(viewingVersion.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Last Updated</span>
                      <p className="text-gray-900">{new Date(viewingVersion.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {viewingVersion.description && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Description
                    </h4>
                    <p className="text-gray-900">{viewingVersion.description}</p>
                  </div>
                )}

                {/* Metadata */}
                {viewingVersion.metadata && Object.keys(viewingVersion.metadata).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-blue-600" />
                      Metadata
                    </h4>
                    <pre className="bg-white p-4 rounded-lg text-sm overflow-auto max-h-40 border">
                      {JSON.stringify(viewingVersion.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Documents */}
                {viewingVersion.documents && Object.keys(viewingVersion.documents).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Documents
                    </h4>
                    <pre className="bg-white p-4 rounded-lg text-sm overflow-auto max-h-40 border">
                      {JSON.stringify(viewingVersion.documents, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleCloseVersionView}
                className="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

