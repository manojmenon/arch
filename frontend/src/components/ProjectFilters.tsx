import React, { useState } from 'react';
import { useOrganizationStore } from '../store/organizationStore';
import { Search, Filter, X, Tag, Folder, AlertCircle } from 'lucide-react';

export const ProjectFilters: React.FC = () => {
  const {
    categories,
    tags,
    filters,
    updateFilters,
    clearFilters,
  } = useOrganizationStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateFilters({ search: value || undefined });
  };

  const handleStatusChange = (status: string) => {
    updateFilters({ status: status || undefined });
  };

  const handlePriorityChange = (priority: string) => {
    updateFilters({ priority: priority || undefined });
  };

  const handleCategoryChange = (categoryId: string) => {
    updateFilters({ category_id: categoryId || undefined });
  };

  const handleTagToggle = (tagName: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName];
    updateFilters({ tags: newTags.length > 0 ? newTags : undefined });
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.category_id ||
    (filters.tags && filters.tags.length > 0)
  );

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'on-hold', label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {showFilters && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(
                    filters.status === option.value ? '' : option.value
                  )}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.status === option.value
                      ? option.color
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePriorityChange(
                    filters.priority === option.value ? '' : option.value
                  )}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.priority === option.value
                      ? option.color
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Filter */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Folder className="h-4 w-4 inline mr-1" />
                Categories
              </label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(
                      filters.category_id === category.id ? '' : category.id
                    )}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${
                      filters.category_id === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span className="font-medium">{category.name}</span>
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.name)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.tags?.includes(tag.name)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: filters.tags?.includes(tag.name) ? tag.color : undefined,
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: "{filters.search}"
              </span>
            )}
            {filters.status && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
              </span>
            )}
            {filters.priority && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                Priority: {priorityOptions.find(p => p.value === filters.priority)?.label}
              </span>
            )}
            {filters.category_id && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                Category: {categories.find(c => c.id === filters.category_id)?.name}
              </span>
            )}
            {filters.tags && filters.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-white rounded-full text-xs"
                style={{ backgroundColor: tags.find(t => t.name === tag)?.color }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
