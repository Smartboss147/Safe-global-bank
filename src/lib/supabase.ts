import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Validate Supabase URL construction to prevent "string did not match expected pattern" error
try {
  const parsedUrl = new URL(supabaseUrl);
  if (parsedUrl.protocol !== 'https:') {
    console.error('Supabase URL must use HTTPS protocol');
  }
} catch (e) {
  console.error('Invalid Supabase URL configuration:', supabaseUrl);
}

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder') &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

