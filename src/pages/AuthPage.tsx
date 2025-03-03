import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SignIn } from '@/components/auth/SignIn';
import { SignUp } from '@/components/auth/SignUp';
import { useAuth } from '@/lib/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the return URL from location state or default to home
  const from = location.state?.from?.pathname || '/';
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);
  
  // Handle successful authentication
  const handleAuthSuccess = () => {
    navigate(from, { replace: true });
  };
  
  // Toggle between sign in and sign up modes
  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Workout Voice Blocks</h1>
          <p className="text-muted-foreground mt-2">Track your workouts with voice commands</p>
        </div>
        
        {mode === 'signin' ? (
          <SignIn 
            onSuccess={handleAuthSuccess} 
            onSignUpClick={() => setMode('signup')} 
          />
        ) : (
          <SignUp 
            onSuccess={() => setMode('signin')} 
            onSignInClick={() => setMode('signin')} 
          />
        )}
      </div>
    </div>
  );
} 