import { supabase } from './supabase';

export const login = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signup = (email, password, data = {}) => supabase.auth.signUp({ 
  email, 
  password,
  options: {
    data
  }
});
export const logout = () => supabase.auth.signOut();
