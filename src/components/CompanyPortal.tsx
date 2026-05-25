import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Lock, User, Loader2, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole } from '../types';
import { cn } from '../lib/utils';

export default function CompanyPortal() {
  const navigate = useNavigate();
  const [view, setView] = useState<'company-login' | 'role-selection' | 'admin-login'>('company-login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const handleCompanyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      
      const data = docSnap.data();
      const role = data?.role;
      const companyId = data?.['company id'];

      if (docSnap.exists() && (role === 'company' || role === 'labor')) {
        setActiveCompanyId(companyId || null);
        setView('role-selection');
        setEmail('');
        setPassword('');
      } else {
        setError('Invalid Login Credentials');
        await auth.signOut();
      }
    } catch (err: any) {
      setError('Invalid Login Credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      const data = docSnap.data();
      const adminCompanyId = data?.['company id'];
      
      if (docSnap.exists() && data?.role === 'admin') {
        // Multi-tenant check: Admin's company id must match the first logged-in session's company id
        if (adminCompanyId === activeCompanyId) {
          navigate('/admin-dashboard');
        } else {
          setError('Invalid Login Credentials');
          await auth.signOut();
        }
      } else {
        setError('Invalid Login Credentials');
        await auth.signOut();
      }
    } catch (err: any) {
      setError('Invalid Login Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-accent/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="max-w-md w-full relative z-10">
        <button 
          onClick={() => {
            if (view === 'company-login') navigate('/');
            else if (view === 'role-selection') setView('company-login');
            else setView('role-selection');
          }}
          className="group mb-12 text-stone-400 hover:text-brand-secondary flex items-center transition-all font-bold text-sm uppercase tracking-widest"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
          {view === 'company-login' ? 'Back to Home' : 'Back'}
        </button>

        <motion.div 
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card bg-white"
        >
          {view === 'company-login' && (
            <>
              <div className="flex items-center justify-center mb-8">
                <div className="bg-brand-secondary p-4 rounded-2xl art-shadow">
                  <Building className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-display font-bold text-center text-brand-secondary mb-2">Company Login</h1>
              <p className="text-stone-400 text-center mb-10 font-medium">Enter company credentials to proceed.</p>
              
              <form onSubmit={handleCompanyLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Company Email</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                    <input 
                      type="email"
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-100 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-medium"
                      placeholder="company@ecobuild.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                    <input 
                      type="password"
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-100 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-medium"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                {error && <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">{error}</div>}
                {success && <div className="text-emerald-600 text-xs font-bold bg-emerald-50 p-3 rounded-xl">{success}</div>}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-secondary text-white py-5 rounded-2xl font-bold hover:bg-brand-primary transition-all flex items-center justify-center art-shadow text-lg"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Company Login"}
                </button>
              </form>
            </>
          )}

          {view === 'role-selection' && (
            <>
              <h1 className="text-3xl font-display font-bold text-center text-brand-secondary mb-2">Access Options</h1>
              <p className="text-stone-400 text-center mb-10 font-medium">Choose how you want to proceed</p>
              
              <div className="grid gap-4">
                <button 
                  onClick={() => setView('admin-login')}
                  className="group p-6 bg-stone-50 border border-stone-100 rounded-[2rem] hover:bg-brand-primary hover:border-brand-primary transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <div className="bg-white p-3 rounded-xl w-fit mb-4 group-hover:bg-white/20 transition-colors">
                      <ShieldCheck className="h-6 w-6 text-brand-primary group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-secondary group-hover:text-white">Login as Admin</h3>
                    <p className="text-stone-400 text-sm group-hover:text-white/70">Requires administrative credentials</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-stone-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button 
                  onClick={() => navigate('/labor-dashboard')}
                  className="group p-6 bg-stone-50 border border-stone-100 rounded-[2rem] hover:bg-brand-primary hover:border-brand-primary transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <div className="bg-white p-3 rounded-xl w-fit mb-4 group-hover:bg-white/20 transition-colors">
                      <User className="h-6 w-6 text-brand-primary group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-secondary group-hover:text-white">Continue as Labor</h3>
                    <p className="text-stone-400 text-sm group-hover:text-white/70">Access site logs directly</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-stone-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </>
          )}

          {view === 'admin-login' && (
            <>
              <h1 className="text-3xl font-display font-bold text-center text-brand-secondary mb-2">Admin Authentication</h1>
              <p className="text-stone-400 text-center mb-10 font-medium">Enter your personal admin credentials</p>

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Admin Email</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                    <input 
                      type="email"
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-100 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-medium"
                      placeholder="admin@yourcompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                    <input 
                      type="password"
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-100 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-medium"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && <div className="text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl">{error}</div>}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-secondary text-white py-5 rounded-2xl font-bold hover:bg-brand-primary disabled:opacity-50 transition-all flex items-center justify-center art-shadow text-lg"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Verify Admin Access"}
                </button>
              </form>
            </>
          )}

          <div className="mt-10 pt-8 border-t border-stone-50 text-center">
            <p className="text-[10px] text-stone-300 uppercase tracking-[0.3em] font-black">
              Enterprise Secure Portal
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
