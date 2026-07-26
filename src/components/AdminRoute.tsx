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

      // Check local profile first
      try {
        const localP = JSON.parse(localStorage.getItem(`local_profile_${user.id}`) || '{}');
        if (localP && localP.role === 'admin') {
          setIsAdmin(true);
          return;
        }
      } catch (e) {}

      // Check email rule
      if (user.email && user.email.toLowerCase().includes('admin')) {
        setIsAdmin(true);
        return;
      }

      try {
        // Check admins table
        const { data: adminRow } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminRow) {
          setIsAdmin(true);
          return;
        }

        // Check profiles table
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileRow && profileRow.role === 'admin') {
          setIsAdmin(true);
          return;
        }

        setIsAdmin(false);
      } catch (err) {
        console.error('Error checking admin role:', err);
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
