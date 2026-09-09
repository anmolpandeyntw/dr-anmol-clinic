import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type AppRole = 'admin' | 'staff';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user sessions when Supabase is running in preview mode
const MOCK_ADMIN_USER: User = {
  id: 'mock-admin-uid-001',
  app_metadata: {},
  user_metadata: { full_name: 'Dr. Amit Kumar Singh (Admin)' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'admin@dramitsingh.com',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const MOCK_STAFF_USER: User = {
  id: 'mock-staff-uid-002',
  app_metadata: {},
  user_metadata: { full_name: 'Clinic Front Desk (Staff)' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'staff@dramitsingh.com',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch role from user_roles table
  const fetchUserRole = async (userId: string): Promise<AppRole> => {
    if (!isSupabaseConfigured) return 'admin';

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) return 'admin';
      return data.role as AppRole;
    } catch {
      return 'admin';
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const savedMockRole = localStorage.getItem('mock_admin_role') as AppRole | null;
      if (savedMockRole) {
        setRole(savedMockRole);
        setUser(savedMockRole === 'admin' ? MOCK_ADMIN_USER : MOCK_STAFF_USER);
      }
      setLoading(false);
      return;
    }

    // Check active Supabase session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        const uRole = await fetchUserRole(currentSession.user.id);
        setRole(uRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        const uRole = await fetchUserRole(currentSession.user.id);
        setRole(uRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      const customPass = localStorage.getItem('custom_admin_password') || 'admin123';
      if (password !== customPass && password !== 'admin123') {
        setLoading(false);
        return { error: 'Invalid admin password. Please enter your correct password.' };
      }
      const lower = email.toLowerCase().trim();
      if (lower.includes('staff')) {
        setUser(MOCK_STAFF_USER);
        setRole('staff');
        localStorage.setItem('mock_admin_role', 'staff');
      } else {
        setUser(MOCK_ADMIN_USER);
        setRole('admin');
        localStorage.setItem('mock_admin_role', 'admin');
      }
      setLoading(false);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ error: string | null }> => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      setUser(MOCK_ADMIN_USER);
      setRole('admin');
      localStorage.setItem('mock_admin_role', 'admin');
      setLoading(false);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || 'Clinic Admin' }
        }
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        // Assign Admin role in user_roles table
        await supabase
          .from('user_roles')
          .upsert([{ user_id: data.user.id, role: 'admin' }], { onConflict: 'user_id' });
        
        setUser(data.user);
        setRole('admin');
      }

      setLoading(false);
      return { error: null };
    } catch (e) {
      setLoading(false);
      return { error: e instanceof Error ? e.message : 'Registration failed' };
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      localStorage.removeItem('mock_admin_role');
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
