import { supabase } from './supabase';

export const login = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signup = (email, password, data = {}) => supabase.auth.signUp({ 
  email, 
  password,
  options: {
    data
  }
});
export const loginWithGoogle = () => supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
  }
});
export const logout = () => supabase.auth.signOut();
