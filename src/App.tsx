/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import LoginForm from './components/LoginForm';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser as any);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="p-4 bg-white shadow-sm flex justify-between items-center">
          <Link to="/" className="font-bold text-xl">Safe Global Bank</Link>
          <div className="flex gap-4 items-center">
            {user && (
              <Link to="/admin" className="text-gray-600 hover:text-gray-900 font-medium">Admin</Link>
            )}
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
            <Route path="/admin" element={user ? <AdminDashboard user={user} /> : <LoginForm />} />
            <Route path="/login" element={<LoginForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
