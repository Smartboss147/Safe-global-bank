/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import LoginForm from './components/LoginForm';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('User loaded:', currentUser?.email);
      setUser(currentUser as any);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Loading...</p></div>;
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
            <Route path="/admin" element={user ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
