import { useState } from 'react';
import { useApiTokens, useCreateToken, useRevokeToken, useExportToken } from '../hooks/useTokens';
import { useAuthStore } from '../store/authStore';
import { CreateTokenRequest } from '../types';
import { Plus, Key, Download, Trash2, Clock, Eye, EyeOff } from 'lucide-react';

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

  const canCreate = hasRole('user');
  const canRevoke = hasRole('user');

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTokenMutation.mutateAsync(newToken);
      setNewToken({ name: '', expires_in_hours: 4 });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create token:', error);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (window.confirm('Are you sure you want to revoke this token?')) {
      try {
        await revokeTokenMutation.mutateAsync(tokenId);
      } catch (error) {
        console.error('Failed to revoke token:', error);
      }
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Tokens</h1>
          <p className="text-gray-600">Manage your API access tokens</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Token
          </button>
        )}
      </div>

      {/* Create Token Form */}
      {showCreateForm && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Token</h2>
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
                className="btn btn-primary"
              >
                {createTokenMutation.isLoading ? 'Creating...' : 'Create Token'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
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
        <div className="space-y-4">
          {tokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              isVisible={visibleTokens.has(token.id)}
              canRevoke={canRevoke}
              onToggleVisibility={() => toggleTokenVisibility(token.id)}
              onRevoke={() => handleRevokeToken(token.id)}
              onExport={useExportToken(token.token, `${token.name}-token.txt`)}
              isExpired={isTokenExpired(token.expires_at)}
              expiryText={formatExpiryDate(token.expires_at)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Key className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No API tokens</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first API token.
          </p>
          {canCreate && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Token
              </button>
            </div>
          )}
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
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{token.name}</h3>
          <p className="text-sm text-gray-500">
            Created {new Date(token.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
            <code className="flex-1 bg-gray-50 p-2 rounded text-sm font-mono break-all">
              {isVisible ? token.token : '••••••••••••••••••••••••••••••••'}
            </code>
            <button
              onClick={onToggleVisibility}
              className="text-gray-400 hover:text-gray-600"
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

        <div className="flex items-center justify-between pt-3 border-t">
          <button
            onClick={onExport}
            className="btn btn-secondary flex items-center text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>

          {canRevoke && (
            <button
              onClick={onRevoke}
              className="btn btn-danger flex items-center text-sm"
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

