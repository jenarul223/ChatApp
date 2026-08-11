import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { MainLayout } from './components/layout/MainLayout';
import { MessageSquare } from 'lucide-react';

const AuthGate: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | 'forgot'>('login');

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-pulse shadow-2xl">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to WhatsApp Web...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (authScreen === 'signup') {
      return <SignUp onSwitchToLogin={() => setAuthScreen('login')} />;
    }
    if (authScreen === 'forgot') {
      return <ForgotPassword onSwitchToLogin={() => setAuthScreen('login')} />;
    }
    return (
      <Login
        onSwitchToSignUp={() => setAuthScreen('signup')}
        onSwitchToForgotPassword={() => setAuthScreen('forgot')}
      />
    );
  }

  return (
    <ChatProvider>
      <MainLayout />
    </ChatProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
