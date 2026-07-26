import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import LoginForm from './components/LoginForm';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import AdminLogin from './components/AdminLogin';
import { syncRegisteredUser } from './utils/profile';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          syncRegisteredUser(currentUser);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            syncRegisteredUser(currentUser);
          }
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } catch (err: any) {
      console.error('Auth setup error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl max-w-md w-full border border-red-100">
          <h2 className="font-bold text-xl mb-2">Configuration Error</h2>
          <p className="mb-4 text-sm">{error}</p>
          <p className="text-xs text-red-500">If you are on Vercel, make sure you have added your Firebase environment variables in the project settings.</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {!user && (
          <nav className="p-4 bg-white shadow-sm flex justify-between items-center relative z-50">
            <Link to="/" className="font-bold text-xl tracking-tight">Safe Global Bank</Link>
            <div className="flex gap-4 items-center">
              <Link to="/login" className="text-blue-600 font-bold hover:text-blue-800">Sign In</Link>
            </div>
          </nav>
        )}
        <main className={`flex-grow ${!user ? 'p-4' : 'p-0 pb-20'}`}>
          <Routes>
            <Route path="/" element={user ? <Dashboard user={user} /> : <LandingPage />} />
            <Route path="/admin" element={<AdminRoute user={user}><AdminDashboard user={user} /></AdminRoute>} />
            <Route path="/admin-login" element={<AdminLogin user={user} />} />
            <Route path="/login" element={<LoginForm user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
