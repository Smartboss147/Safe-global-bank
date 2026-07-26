import { supabase } from './supabase';

export const login = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signup = (email, password) => supabase.auth.signUp({ email, password });
export const logout = () => supabase.auth.signOut();
