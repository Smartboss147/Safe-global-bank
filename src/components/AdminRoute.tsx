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
        
        const { data, error } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
          
        if (data) {
          setIsAdmin(true);

        } else {
          setIsAdmin(false);
        }
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
