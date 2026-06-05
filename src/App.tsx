import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import LandingPage from './components/LandingPage';
import PublicReport from './components/PublicReport';
import CompanyPortal from './components/CompanyPortal';
import AdminDashboard from './components/AdminDashboard';
import LaborDashboard from './components/LaborDashboard';
import RecyclingCenterPortal from './components/RecyclingCenterPortal';
import SuperAdminPortal from './components/SuperAdminPortal';
import { UserProfile } from './types';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-brand-bg font-sans text-brand-secondary relative overflow-hidden">
        {/* Artistic Background Layer */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 mesh-gradient opacity-40" />
          <div className="absolute inset-0 grid-pattern opacity-30" />
          
          {/* Floating Abstract Shapes */}
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] left-[5%] w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-radial from-transparent via-transparent to-brand-bg/80" />
        </div>

        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/public-report" element={<PublicReport />} />
            <Route path="/company-portal" element={<CompanyPortal />} />
            <Route path="/recycling-center" element={<RecyclingCenterPortal />} />
            <Route path="/super-admin" element={<SuperAdminPortal />} />
            
            {/* Protected Routes */}
            <Route 
              path="/admin-dashboard" 
              element={profile?.role === 'admin' ? <AdminDashboard profile={profile} /> : <Navigate to="/company-portal" />} 
            />
            <Route 
              path="/labor-dashboard" 
              element={(profile?.role === 'labor' || profile?.role === 'company') ? <LaborDashboard profile={profile} /> : <Navigate to="/company-portal" />} 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
