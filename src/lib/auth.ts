import { supabase, isSupabaseConfigured } from './supabase';

export const login = async (email: string, password: string) => {
  if (!isSupabaseConfigured) {
    const users = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    let user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = { 
        id: 'demo-' + Date.now(), 
        email, 
        first_name: email.split('@')[0], 
        last_name: 'Customer',
        display_name: email.split('@')[0],
        role: email.toLowerCase().includes('admin') ? 'admin' : 'user' 
      };
      users.push(user);
      localStorage.setItem('all_registered_users', JSON.stringify(users));
    }
    const session = { user, access_token: 'demo-token-' + Date.now() };
    localStorage.setItem('safe_bank_demo_session', JSON.stringify(session));
    return { data: session, error: null };
  }

  try {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) throw res.error;
    return res;
  } catch (err: any) {
    console.warn('Supabase login failed, using local demo fallback:', err);
    if (err.message?.includes('Load failed') || err.message?.includes('Failed to fetch') || !isSupabaseConfigured) {
      const users = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
      let user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        user = { 
          id: 'demo-' + Date.now(), 
          email, 
          first_name: email.split('@')[0], 
          last_name: 'Customer',
          display_name: email.split('@')[0],
          role: email.toLowerCase().includes('admin') ? 'admin' : 'user' 
        };
        users.push(user);
        localStorage.setItem('all_registered_users', JSON.stringify(users));
      }
      const session = { user, access_token: 'demo-token-' + Date.now() };
      localStorage.setItem('safe_bank_demo_session', JSON.stringify(session));
      return { data: session, error: null };
    }
    throw err;
  }
};

export const signup = async (email: string, password: string, data = {}) => {
  if (!isSupabaseConfigured) {
    const users = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    const user = { id: 'demo-' + Date.now(), email, ...data, role: email.toLowerCase().includes('admin') ? 'admin' : 'user' };
    users.push(user);
    localStorage.setItem('all_registered_users', JSON.stringify(users));
    const session = { user, access_token: 'demo-token-' + Date.now() };
    localStorage.setItem('safe_bank_demo_session', JSON.stringify(session));
    return { data: session, error: null };
  }

  try {
    const res = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data }
    });
    if (res.error) throw res.error;
    return res;
  } catch (err: any) {
    console.warn('Supabase signup failed, using local demo fallback:', err);
    if (err.message?.includes('Load failed') || err.message?.includes('Failed to fetch') || !isSupabaseConfigured) {
      const users = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
      const user = { id: 'demo-' + Date.now(), email, ...data, role: email.toLowerCase().includes('admin') ? 'admin' : 'user' };
      users.push(user);
      localStorage.setItem('all_registered_users', JSON.stringify(users));
      const session = { user, access_token: 'demo-token-' + Date.now() };
      localStorage.setItem('safe_bank_demo_session', JSON.stringify(session));
      return { data: session, error: null };
    }
    throw err;
  }
};

export const loginWithGoogle = async () => {
  if (!isSupabaseConfigured) {
    const email = 'google.user@safeglobalbank.com';
    const users = JSON.parse(localStorage.getItem('all_registered_users') || '[]');
    let user = users.find((u: any) => u.email === email);
    if (!user) {
      user = { id: 'demo-google-' + Date.now(), email, first_name: 'Google User', role: 'user' };
      users.push(user);
      localStorage.setItem('all_registered_users', JSON.stringify(users));
    }
    const session = { user, access_token: 'demo-token-' + Date.now() };
    localStorage.setItem('safe_bank_demo_session', JSON.stringify(session));
    window.location.reload();
    return { data: session, error: null };
  }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  });
};

export const logout = async () => {
  try {
    localStorage.removeItem('safe_bank_demo_session');
    // Also clear any cached supabase session keys in localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token') || key.includes('auth-token'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  } catch (e) {
    console.error('Error clearing storage on logout:', e);
  }

  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Supabase signOut warning:', e);
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};
