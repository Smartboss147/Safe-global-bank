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

      try {
        console.log('[AdminRoute] Verifying admin status for UUID:', user.id);
        
        // Check admins table - strictly UUID based
        const { data: adminRow, error: adminError } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminError) {
          console.error('[AdminRoute] Admin table query error:', adminError);
          setIsAdmin(false);
          return;
        }

        if (adminRow) {
          console.log('[AdminRoute] Admin verification successful for UUID:', user.id);
          setIsAdmin(true);
          return;
        }

        console.warn('[AdminRoute] UUID not found in admins table:', user.id);
        setIsAdmin(false);
      } catch (err) {
        console.error('[AdminRoute] Unexpected error checking admin role:', err);
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [user]);

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Verifying access...</p></div>;
  }

  return isAdmin ? children : <Navigate to="/" />;
}
