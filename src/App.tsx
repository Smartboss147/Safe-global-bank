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

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="p-4 bg-white shadow-sm flex justify-between">
          <Link to="/" className="font-bold text-xl">Safe Global Bank</Link>
          {user ? (
            <button onClick={() => signOut(auth)} className="text-red-600">Sign Out</button>
          ) : (
            <Link to="/login" className="text-blue-600">Login</Link>
          )}
        </nav>
        <main className="flex-grow p-4">
          <Routes>
            <Route path="/" element={user ? <Dashboard user={user} /> : <LandingPage />} />

            <Route path="/login" element={<LoginForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
