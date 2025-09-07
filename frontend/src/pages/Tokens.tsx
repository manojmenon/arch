import { useState } from 'react';
import { useApiTokens, useCreateToken, useRevokeToken, useExportToken } from '../hooks/useTokens';
import { useAuthStore } from '../store/authStore';
import { CreateTokenRequest } from '../types';
import { Plus, Key, Download, Trash2, Clock, Eye, EyeOff, AlertTriangle, X } from 'lucide-react';

const Tokens = () => {
  const { data: tokens, isLoading } = useApiTokens();
  const { hasRole } = useAuthStore();
  const createTokenMutation = useCreateToken();
  const revokeTokenMutation = useRevokeToken();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newToken, setNewToken] = useState<CreateTokenRequest>({
    name: '',
    expires_in_hours: 4,
  });
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [createError, setCreateError] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<{ id: string; name: string } | null>(null);

  const canCreate = hasRole('user');
  const canRevoke = hasRole('user');

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await createTokenMutation.mutateAsync(newToken);
      setNewToken({ name: '', expires_in_hours: 4 });
      setShowCreateForm(false);
    } catch (error: any) {
      console.error('Failed to create token:', error);
      setCreateError(error.response?.data?.error || 'Failed to create token');
    }
  };

  const handleRevokeToken = (tokenId: string, tokenName: string) => {
    setTokenToRevoke({ id: tokenId, name: tokenName });
    setShowRevokeModal(true);
  };

  const confirmRevokeToken = async () => {
    if (!tokenToRevoke) return;
    
    try {
      await revokeTokenMutation.mutateAsync(tokenToRevoke.id);
      setShowRevokeModal(false);
      setTokenToRevoke(null);
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  };

  const cancelRevokeToken = () => {
    setShowRevokeModal(false);
    setTokenToRevoke(null);
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setVisibleTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatExpiryDate = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours <= 0) {
      return 'Expired';
    } else if (diffHours < 24) {
      return `${diffHours} hours remaining`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `${diffDays} days remaining`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">
                API Tokens 🔑
              </h1>
              <p className="text-xl text-purple-100">
                Manage your API access tokens for secure application integration
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setCreateError(null);
                }}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm border border-white border-opacity-30"
              >
                <Plus className="w-5 h-5" />
                <span>Create Token</span>
              </button>
            )}
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>

      {/* Create Token Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Token</h2>
          
          {createError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {createError}
            </div>
          )}
          
          <form onSubmit={handleCreateToken} className="space-y-4">
            <div>
              <label htmlFor="tokenName" className="block text-sm font-medium text-gray-700 mb-1">
                Token Name
              </label>
              <input
                id="tokenName"
                type="text"
                value={newToken.name}
                onChange={(e) => setNewToken(prev => ({ ...prev, name: e.target.value }))}
                className="input"
                placeholder="e.g., My API Token"
                required
              />
            </div>

            <div>
              <label htmlFor="expiresIn" className="block text-sm font-medium text-gray-700 mb-1">
                Expires In (hours)
              </label>
              <select
                id="expiresIn"
                value={newToken.expires_in_hours}
                onChange={(e) => setNewToken(prev => ({ ...prev, expires_in_hours: parseInt(e.target.value) }))}
                className="input"
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={8}>8 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={createTokenMutation.isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {createTokenMutation.isLoading ? 'Creating...' : 'Create Token'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tokens List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : tokens && tokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              isVisible={visibleTokens.has(token.id)}
              canRevoke={canRevoke}
              onToggleVisibility={() => toggleTokenVisibility(token.id)}
              onRevoke={() => handleRevokeToken(token.id, token.name)}
              onExport={useExportToken(token.token, `${token.name}-token.txt`)}
              isExpired={isTokenExpired(token.expires_at)}
              expiryText={formatExpiryDate(token.expires_at)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">No API Tokens</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You haven't created any API tokens yet. Create your first token to start integrating with our API.
          </p>
          {canCreate && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Token</span>
            </button>
          )}
        </div>
      )}

      {/* Revoke Token Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Revoke API Token</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={cancelRevokeToken}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-8">
              <p className="text-gray-700 mb-4">
                Are you sure you want to revoke the API token <span className="font-semibold text-gray-900">"{tokenToRevoke?.name}"</span>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Warning:</p>
                    <ul className="space-y-1 text-red-700">
                      <li>• This token will be permanently deleted</li>
                      <li>• Any applications using this token will stop working</li>
                      <li>• You'll need to create a new token to restore access</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelRevokeToken}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevokeToken}
                disabled={revokeTokenMutation.isLoading}
                className="flex-1 px-6 py-3 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-medium flex items-center justify-center space-x-2"
              >
                {revokeTokenMutation.isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Revoking...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Revoke Token</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TokenCardProps {
  token: any;
  isVisible: boolean;
  canRevoke: boolean;
  onToggleVisibility: () => void;
  onRevoke: () => void;
  onExport: () => void;
  isExpired: boolean;
  expiryText: string;
}

const TokenCard = ({
  token,
  isVisible,
  canRevoke,
  onToggleVisibility,
  onRevoke,
  onExport,
  isExpired,
  expiryText,
}: TokenCardProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{token.name}</h3>
          <p className="text-sm text-gray-500">
            Created {new Date(token.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isExpired
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}>
            <Clock className="h-3 w-3 mr-1" />
            {expiryText}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-gray-50 p-3 rounded-lg text-sm font-mono break-all border">
              {isVisible ? token.token : '••••••••••••••••••••••••••••••••'}
            </code>
            <button
              onClick={onToggleVisibility}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {token.last_used_at && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Used
            </label>
            <p className="text-sm text-gray-900">
              {new Date(token.last_used_at).toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={onExport}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>

          {canRevoke && (
            <button
              onClick={onRevoke}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Revoke
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tokens;

