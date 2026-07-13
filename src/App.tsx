import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Dashboard from './components/Dashboard';
import LoginForm from './components/LoginForm';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import AdminLogin from './components/AdminLogin';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        console.log('User loaded:', currentUser?.email);
        
        if (currentUser) {
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
              await setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || '',
                role: 'user',
                balance: 0,
                createdAt: serverTimestamp(),
                kycStatus: 'pending'
              });
            }
          } catch (docErr) {
            console.error("Error checking/creating user doc:", docErr);
          }
        }
        
        setUser(currentUser as any);
        setLoading(false);
      }, (err) => {
        console.error('Auth error:', err);
        setError(err.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Setup error:', err);
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
