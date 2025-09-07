import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useLogin } from '../hooks/useAuth';
import { LoginRequest } from '../types';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [suspensionInfo, setSuspensionInfo] = useState<{
    suspended_until: string;
    suspension_reason: string;
  } | null>(null);
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    try {
      setSuspensionInfo(null);
      await loginMutation.mutateAsync(data);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle suspension errors
      if (error.response?.status === 423) {
        setSuspensionInfo({
          suspended_until: error.response.data.suspended_until,
          suspension_reason: error.response.data.suspension_reason
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-6 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <LogIn className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                {...register('username', { required: 'Username is required' })}
                type="text"
                id="username"
                className="input mt-1"
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="input pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {loginMutation.error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                {loginMutation.error.message || 'Login failed. Please try again.'}
              </p>
            </div>
          )}

          {suspensionInfo && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Account Suspended
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>{suspensionInfo.suspension_reason}</p>
                    <p className="mt-1">
                      <strong>Suspended until:</strong> {new Date(suspensionInfo.suspended_until).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs">
                      Contact your administrator to unlock your account, or wait for automatic unlock.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loginMutation.isLoading}
              className="btn btn-primary w-full"
            >
              {loginMutation.isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

