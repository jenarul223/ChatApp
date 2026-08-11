import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Mail, Lock, ArrowRight, Sparkles, AlertCircle, UserCheck } from 'lucide-react';

interface LoginProps {
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToSignUp, onSwitchToForgotPassword }) => {
  const { login, loginWithGoogle, loginAsGuest, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('disabled')) {
        setError('Email/Password sign in is disabled in Firebase. Switched to Guest Mode.');
        await loginAsGuest();
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network block detected on auth server. Switched to Guest Mode for immediate access.');
        await loginAsGuest();
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign in failed. Please try again or use Guest mode.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsGuest();
    } catch (err: any) {
      console.error(err);
      setError('Guest login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoName: string) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(demoEmail, demoName);
    } catch (err: any) {
      console.error(err);
      setError('Demo login failed. Trying Guest mode instead...');
      try {
        await loginAsGuest(demoName);
      } catch (guestErr) {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 text-slate-100 p-4">
      {/* Container Card */}
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-2 border border-emerald-500/30">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="text-sm text-slate-400">Sign in to your WhatsApp Web account</p>
        </div>

        {/* Demo Accounts Banner */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> 1-Click Instant Profiles
          </div>
          <p className="text-xs text-slate-400">Try sending messages between 2 users in seconds:</p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('alice@whatsapp.demo', 'Alice Green')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              Alice Green
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('bob@whatsapp.demo', 'Bob Vance')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              Bob Vance
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('charlie@whatsapp.demo', 'Charlie Day')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              Charlie Day
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Auth Buttons (Google & Guest) */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-medium py-2.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleGuestLogin}
            className="w-full flex items-center justify-center gap-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-medium py-2 px-4 rounded-xl border border-slate-600/60 transition-all disabled:opacity-50 text-xs"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Continue as Guest (Instant Chat)
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-700 w-full" />
          <span className="bg-slate-800 px-3 text-xs text-slate-400 uppercase tracking-wider relative z-10">Or email</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-xs text-emerald-400 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In with Email
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-700/60">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-emerald-400 hover:underline font-semibold ml-1"
          >
            Sign up now
          </button>
        </div>
      </div>
    </div>
  );
};
