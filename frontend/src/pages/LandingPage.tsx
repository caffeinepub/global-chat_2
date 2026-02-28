import { useState, FormEvent } from 'react';
import { Globe, Eye, EyeOff } from 'lucide-react';
import { registerUser, loginUser, saveSession } from '../lib/auth';

interface LandingPageProps {
  onJoin: (name: string) => void;
}

type AuthMode = 'login' | 'create';

export default function LandingPage({ onJoin }: LandingPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'create') {
        const result = registerUser(trimmedUsername, password);
        if (!result.success) {
          setError(result.error || 'Failed to create account.');
          setIsLoading(false);
          return;
        }
        // Registration succeeded — save session and navigate
        saveSession(trimmedUsername);
        onJoin(trimmedUsername);
      } else {
        const result = loginUser(trimmedUsername, password);
        if (!result.success) {
          setError(result.error || 'Invalid username or password.');
          setIsLoading(false);
          return;
        }
        // Login succeeded — save session and navigate
        saveSession(trimmedUsername);
        onJoin(trimmedUsername);
      }
    } catch (err) {
      console.error('LandingPage: handleSubmit error', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-dc-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-dc-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-dc-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-dc-sidebar rounded-2xl shadow-2xl p-8 border border-white/5">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-dc-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-dc-accent/30">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Global Chat</h1>
            <p className="text-dc-muted mt-2 text-center text-sm">
              {mode === 'login'
                ? 'Welcome back! Sign in to continue.'
                : 'Create an account to join the chat.'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-dc-bg/60 rounded-lg p-1 mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-dc-accent text-white shadow-sm'
                  : 'text-dc-muted hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchMode('create')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                mode === 'create'
                  ? 'bg-dc-accent text-white shadow-sm'
                  : 'text-dc-muted hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-dc-text-secondary mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="Enter your username..."
                maxLength={32}
                autoFocus
                autoComplete="username"
                className="w-full bg-dc-input text-white placeholder:text-dc-muted rounded-lg px-4 py-3 text-sm border border-white/10 focus:outline-none focus:border-dc-accent focus:ring-1 focus:ring-dc-accent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dc-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={mode === 'create' ? 'Create a password...' : 'Enter your password...'}
                  autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                  className="w-full bg-dc-input text-white placeholder:text-dc-muted rounded-lg px-4 py-3 pr-11 text-sm border border-white/10 focus:outline-none focus:border-dc-accent focus:ring-1 focus:ring-dc-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dc-muted hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-dc-accent hover:bg-dc-accent-hover text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-dc-accent/25 active:scale-[0.98] text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                mode === 'login' ? 'Log In →' : 'Create Account →'
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-dc-muted mt-6">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'create' : 'login')}
              className="text-dc-accent hover:underline font-medium"
            >
              {mode === 'login' ? 'Create one' : 'Log in'}
            </button>
          </p>
        </div>

        {/* Attribution */}
        <p className="text-center text-xs text-dc-muted mt-6">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'global-chat')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dc-accent hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
