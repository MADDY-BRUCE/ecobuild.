import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Lock, User, Loader2, ShieldCheck, ArrowLeft, ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CompanyPortal() {
  const navigate = useNavigate();
  const [view, setView] = useState<'company-login' | 'role-selection' | 'admin-login'>('company-login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success] = useState('');

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
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10 selection:bg-brand-primary/20">
      {/* Dynamic Background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            x: [0, 60, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-80 h-80 bg-brand-primary/5 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-[140px]"
        />
      </div>

      <div className="max-w-md w-full relative">
        <motion.button 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            if (view === 'company-login') navigate('/');
            else if (view === 'role-selection') setView('company-login');
            else setView('role-selection');
            setError('');
          }}
          className="group mb-8 text-stone-400 hover:text-brand-secondary flex items-center transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer bg-white/40 border border-stone-200/50 backdrop-blur-md px-5 py-2.5 rounded-2xl w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
          {view === 'company-login' ? 'Back to Home' : 'Back'}
        </motion.button>

        <AnimatePresence mode="wait">
          <motion.div 
            key={view}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="glass-card bg-white/80 border border-white/50 shadow-2xl relative overflow-hidden"
          >
            {view === 'company-login' && (
              <form onSubmit={handleCompanyLogin}>
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-brand-secondary p-4.5 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/10">
                    <Building className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl font-display font-extrabold text-center text-brand-secondary mb-2">Company Portal</h1>
                <p className="text-stone-450 text-center mb-10 text-sm font-medium">Log in using verified enterprise credentials.</p>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Company Email</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                      <input 
                        type="email"
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 bg-white/60 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-medium text-sm"
                        placeholder="company@ecobuild.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                      <input 
                        type="password"
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 bg-white/60 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-medium text-sm"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-red-650 text-xs font-bold bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-650" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <div className="text-emerald-700 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">{success}</div>
                  )}
                  
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-secondary text-white py-4.5 rounded-2xl font-extrabold hover:bg-brand-primary hover:-translate-y-0.5 transition-all flex items-center justify-center shadow-lg shadow-brand-secondary/15 hover:shadow-brand-primary/20 text-base cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Identity"}
                  </button>
                </div>
              </form>
            )}

            {view === 'role-selection' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-brand-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3">
                    Identity Verified
                  </span>
                  <h1 className="text-3xl font-display font-extrabold text-brand-secondary mb-2">Access Portal</h1>
                  <p className="text-stone-450 text-sm font-medium">Select your permission profile to continue.</p>
                </div>
                
                <div className="grid gap-4">
                  <button 
                    onClick={() => setView('admin-login')}
                    className="group p-5 bg-stone-50/70 border border-stone-200/60 rounded-3xl hover:bg-brand-primary hover:border-brand-primary transition-all text-left flex items-center justify-between cursor-pointer hover:shadow-xl hover:shadow-brand-primary/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-2xl shadow-md border border-stone-100 group-hover:bg-white/10 transition-colors">
                        <ShieldCheck className="h-6 w-6 text-brand-primary group-hover:text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-brand-secondary group-hover:text-white">Admin Console</h3>
                        <p className="text-stone-450 text-xs group-hover:text-white/80">Submit logs & audit reports</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-stone-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>

                  <button 
                    onClick={() => navigate('/labor-dashboard')}
                    className="group p-5 bg-stone-50/70 border border-stone-200/60 rounded-3xl hover:bg-brand-primary hover:border-brand-primary transition-all text-left flex items-center justify-between cursor-pointer hover:shadow-xl hover:shadow-brand-primary/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-2xl shadow-md border border-stone-100 group-hover:bg-white/10 transition-colors">
                        <User className="h-6 w-6 text-brand-primary group-hover:text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-brand-secondary group-hover:text-white">Labor Disposal Log</h3>
                        <p className="text-stone-450 text-xs group-hover:text-white/80">Quickly submit photo logs</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-stone-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            )}

            {view === 'admin-login' && (
              <form onSubmit={handleAdminLogin}>
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-brand-primary/10 p-4.5 rounded-3xl border border-brand-primary/20 shadow-xl shadow-brand-primary/5">
                    <KeyRound className="h-7 w-7 text-brand-primary" />
                  </div>
                </div>
                <h1 className="text-3xl font-display font-extrabold text-center text-brand-secondary mb-2">Admin Auth</h1>
                <p className="text-stone-450 text-center mb-10 text-sm font-medium">Verify your administrative key profile.</p>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Admin Email</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                      <input 
                        type="email"
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 bg-white/60 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-medium text-sm"
                        placeholder="admin@yourcompany.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                      <input 
                        type="password"
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 bg-white/60 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-medium text-sm"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-red-655 text-xs font-bold bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-650" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-secondary text-white py-4.5 rounded-2xl font-extrabold hover:bg-brand-primary hover:-translate-y-0.5 transition-all flex items-center justify-center shadow-lg shadow-brand-secondary/15 hover:shadow-brand-primary/20 text-base cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Credentials"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-10 pt-6 border-t border-stone-200/50 text-center">
              <p className="text-[9px] text-stone-400 uppercase tracking-[0.25em] font-bold">
                Enterprise Encrypted Environment
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

