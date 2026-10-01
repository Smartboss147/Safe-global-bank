import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminRoute({ user, children }: any) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Quick email check
      if (user.email && user.email.toLowerCase().includes('admin')) {
        setIsAdmin(true);
        return;
      }

      try {
        console.log('[AdminRoute] Verifying admin status for UUID:', user.id);
        
        // 1. Check local profile role
        try {
          const localP = JSON.parse(localStorage.getItem(`local_profile_${user.id}`) || '{}');
          if (localP && (localP.role === 'admin' || localP.role === 'SUPER_ADMIN')) {
            setIsAdmin(true);
            return;
          }
        } catch (e) {}

        // 2. Check admins table
        const { data: adminRow } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminRow) {
          setIsAdmin(true);
          return;
        }

        // 3. Check profiles table role
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileRow && (profileRow.role === 'admin' || profileRow.role === 'SUPER_ADMIN')) {
          setIsAdmin(true);
          return;
        }

        setIsAdmin(false);
      } catch (err) {
        console.error('[AdminRoute] Unexpected error checking admin role:', err);
        if (user.email?.toLowerCase().includes('admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    }
    checkAdmin();
  }, [user]);

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Verifying access...</p></div>;
  }

  return isAdmin ? children : <Navigate to="/" />;
}
