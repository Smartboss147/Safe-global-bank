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
import UserProfile from './components/UserProfile';

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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="p-4 bg-white shadow-sm flex justify-between items-center">
          <Link to="/" className="font-bold text-xl">Safe Global Bank</Link>
          <div className="flex gap-4 items-center">
            {user && user.email === 'admin@example.com' && (
              <Link to="/admin" className="text-gray-600 hover:text-gray-900 font-medium">Admin Panel</Link>
            )}
            {user ? (
              <Link to="/profile" className="text-gray-600 hover:text-gray-900 font-medium">Profile</Link>
            ) : null}
            {user ? (
              <button onClick={() => signOut(auth)} className="text-red-600 font-medium">Sign Out</button>
            ) : (
              <Link to="/login" className="text-blue-600 font-medium">Login</Link>
            )}
          </div>
        </nav>
        <main className="flex-grow p-4">
          <Routes>
            <Route path="/" element={user ? <Dashboard user={user} /> : <LandingPage />} />
            <Route path="/admin" element={user ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
