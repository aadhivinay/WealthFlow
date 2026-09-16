import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, rememberMe: boolean) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const REMEMBER_KEY = 'wf_remember_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user previously chose "Remember Me"
    const remember = localStorage.getItem(REMEMBER_KEY) === 'true';

    supabase.auth.getSession().then(({ data }) => {
      // If session exists but user didn't want to be remembered, sign them out
      if (data.session && !remember) {
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    // If "Remember Me" was NOT checked, clear session when app/process closes
    const handleBeforeUnload = () => {
      if (localStorage.getItem(REMEMBER_KEY) !== 'true') {
        // Clear the stored session so it doesn't persist on next launch
        try {
          localStorage.removeItem('sb-' + (import.meta.env.VITE_SUPABASE_URL as string).replace(/[^a-z0-9]/gi, '') + '-auth-token');
        } catch {
          // best-effort
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const signUp = async (email: string, password: string, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
      localStorage.setItem(REMEMBER_KEY, 'false');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: email.split('@')[0] } },
    });
    if (error) {
      if (error.message.toLowerCase().includes('weak') || error.message.toLowerCase().includes('breach') || error.message.toLowerCase().includes('known')) {
        return { error: 'This password has been found in a known data breach. Please use a different, more unique password.', needsConfirmation: false };
      }
      return { error: error.message, needsConfirmation: false };
    }
    // If user exists but no session, email confirmation is required
    if (data.user && !data.session) {
      return { error: null, needsConfirmation: true };
    }
    return { error: null, needsConfirmation: false };
  };

  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
      localStorage.setItem(REMEMBER_KEY, 'false');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    localStorage.removeItem(REMEMBER_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
