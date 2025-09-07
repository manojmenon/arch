import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserAvatar } from '../components/UserAvatar';
import { User, LogOut, Save, X } from 'lucide-react';

const Profile = () => {
  const { user, logout, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      window.location.href = '/login';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Authenticated</h1>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
              <p className="text-xl text-indigo-100">Manage your account information and preferences</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 text-white hover:bg-opacity-30 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              <UserAvatar user={user} size="lg" className="w-24 h-24" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user.username || 'User'}
              </h2>
              <p className="text-gray-600 text-lg">{user.email}</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 mt-3">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {user.role}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-3">
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter username"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-gray-900 font-medium">{user.username || 'Not set'}</p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter email"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Role
                </label>
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <p className="text-blue-900 font-medium capitalize">{user.role}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Member Since
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-900 font-medium">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-700 hover:bg-white rounded-xl transition-all duration-200 disabled:opacity-50 border border-gray-300 hover:border-gray-400"
                >
                  <X className="w-4 h-4" />
                  <span className="font-medium">Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Save className="w-4 h-4" />
                  <span className="font-medium">{isLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <User className="w-4 h-4" />
                <span className="font-medium">Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
