import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject, useUpdateProject } from '../hooks/useProjects';
import { useAuthStore } from '../store/authStore';
import { Project } from '../types';
import { ArrowLeft, Edit, Save, X, Calendar, MapPin } from 'lucide-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id!);
  const { hasRole } = useAuthStore();
  const updateProjectMutation = useUpdateProject();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Project>>({});

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

  const handleJsonChange = (field: 'metadata' | 'documents', value: string) => {
    try {
      const parsed = JSON.parse(value);
      setEditData(prev => ({ ...prev, [field]: parsed }));
    } catch (error) {
      // Invalid JSON, but keep the string for editing
      setEditData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="card">
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
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
        <p className="text-gray-500">The project you're looking for doesn't exist.</p>
        <Link to="/projects" className="btn btn-primary mt-4">
          Back to Projects
        </Link>
      </div>
    );
  }

  const currentData = isEditing ? editData : project;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/projects"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">Project Details</p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateProjectMutation.isLoading}
                  className="btn btn-primary flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProjectMutation.isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="btn btn-primary flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{project.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {isEditing ? (
                  <select
                    value={currentData.status || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select Status</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : project.status === 'planning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status || 'Unknown'}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.owner_name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, owner_name: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{project.owner_name || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={currentData.budget || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                    className="input"
                    placeholder="0.00"
                  />
                ) : (
                  <p className="text-gray-900">
                    {project.budget ? `$${project.budget.toLocaleString()}` : 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.address || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{project.address || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.city || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{project.city || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.state || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{project.state || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.postal_code || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{project.postal_code || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* JSON Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Metadata</h2>
              {isEditing ? (
                <AceEditor
                  mode="json"
                  theme="github"
                  value={JSON.stringify(currentData.metadata || {}, null, 2)}
                  onChange={(value) => handleJsonChange('metadata', value)}
                  height="200px"
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
                <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto max-h-48">
                  {JSON.stringify(project.metadata || {}, null, 2)}
                </pre>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
              {isEditing ? (
                <AceEditor
                  mode="json"
                  theme="github"
                  value={JSON.stringify(currentData.documents || {}, null, 2)}
                  onChange={(value) => handleJsonChange('documents', value)}
                  height="200px"
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
                <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto max-h-48">
                  {JSON.stringify(project.documents || {}, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Timeline
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={currentData.start_date || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={currentData.end_date || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Info</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-900">{new Date(project.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <p className="text-gray-900">{new Date(project.updated_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Project ID:</span>
                <p className="text-gray-900 font-mono text-xs">{project.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

