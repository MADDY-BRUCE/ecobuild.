import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut as signOutPrimary, createUserWithEmailAndPassword, signOut as signOutSecondary } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth as primaryAuth } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert, Mail, Lock, Loader2, ArrowLeft, LogOut, Recycle, Building2, UserPlus,
  CheckCircle, AlertCircle, Sparkles, KeyRound, ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

// Helper to get secondary Firebase instance
const getSecondaryFirebase = () => {
  const appName = 'SecondaryApp';
  let app;
  if (getApps().some(a => a.name === appName)) {
    app = getApp(appName);
  } else {
    app = initializeApp(firebaseConfig, appName);
  }
  const authSec = getAuth(app);
  const dbId = (firebaseConfig as any).firestoreDatabaseId ?? '(default)';
  const dbSec = getFirestore(app, dbId);
  return { authSec, dbSec };
};

export default function SuperAdminPortal() {
  const navigate = useNavigate();
  const ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'senthamzils@gmail.com';
  
  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    primaryAuth.currentUser?.email === ADMIN_EMAIL
  );
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'recycling' | 'new-company' | 'existing-company'>('recycling');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Center name or Company name
  const [companyId, setCompanyId] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail !== ADMIN_EMAIL) {
      setLoginError('Access Denied. Only the Super Administrator can access this portal.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(primaryAuth, loginEmail, loginPassword);
      setIsAdminLoggedIn(true);
      setLoginPassword('');
    } catch (err: any) {
      setLoginError('Invalid Administrator credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await signOutPrimary(primaryAuth);
    setIsAdminLoggedIn(false);
    setError('');
    setSuccessMsg('');
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setCompanyId('');
    setError('');
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (activeTab !== 'existing-company' && !name) || (activeTab !== 'recycling' && !companyId)) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { authSec, dbSec } = getSecondaryFirebase();

      const cred = await createUserWithEmailAndPassword(authSec, email, password);
      const newUid = cred.user.uid;

      if (activeTab === 'recycling') {
        await setDoc(doc(dbSec, 'recyclingCenters', newUid), {
          name,
          email,
          role: 'recycling-center',
          uid: newUid,
          createdAt: serverTimestamp()
        });
        setSuccessMsg(`Recycling Center "${name}" registered successfully!`);
      } else {
        const compId = companyId.trim().toLowerCase().replace(/\s+/g, '-');
        const role = activeTab === 'new-company' ? 'company' : 'admin';
        
        await setDoc(doc(dbSec, 'users', newUid), {
          email,
          role: role,
          'company id': compId,
          name: activeTab === 'new-company' ? name : (name || ""),
          uid: newUid,
          createdAt: serverTimestamp()
        });

        const successText = activeTab === 'new-company' 
          ? `Company "${name}" (ID: ${compId}) registered successfully!`
          : `Additional Admin registered for Company ID: "${compId}"!`;
        setSuccessMsg(successText);
      }

      await signOutSecondary(authSec);
      resetForm();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered in the system.');
      } else {
        setError(err.message || 'An error occurred while creating the account.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── SUPER ADMIN LOGIN VIEW ──────────────────────────────────────────────
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative z-10 selection:bg-brand-primary/20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, 50, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px]"
          />
        </div>

        <div className="w-full max-w-md">
          <motion.button 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/')} 
            className="group mb-8 text-stone-400 hover:text-brand-secondary flex items-center transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer bg-white/40 border border-stone-200/50 backdrop-blur-md px-5 py-2.5 rounded-2xl w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card bg-white/80 border border-white/50 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-amber-500 p-4.5 rounded-3xl border border-amber-600 shadow-xl shadow-amber-500/10">
                <ShieldAlert className="h-7 w-7 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-display font-extrabold text-center text-brand-secondary mb-2">Super Admin</h1>
            <p className="text-stone-450 text-center mb-10 font-medium text-sm">System management console.</p>

            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 bg-white/60 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-medium text-sm"
                    placeholder="admin@ecobuild.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
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
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
              </div>

              {loginError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-red-650 text-xs font-bold bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-2.5"
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-brand-secondary text-white py-4.5 rounded-2xl font-extrabold hover:bg-brand-primary hover:-translate-y-0.5 transition-all flex items-center justify-center shadow-lg shadow-brand-secondary/15 hover:shadow-brand-primary/20 text-base cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Authenticate Admin"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── SUPER ADMIN DASHBOARD VIEW ──────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10 selection:bg-brand-primary/20">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-10 w-96 h-96 bg-brand-primary/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-brand-secondary p-4 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/10 text-white">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-3xl font-display font-extrabold text-brand-secondary">
                  Super Admin Console
                </h1>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-brand-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  System Core
                </span>
              </div>
              <p className="text-xs text-stone-450 mt-1 font-medium">Provision user identities and database credentials.</p>
            </div>
          </div>
          
          <button 
            onClick={handleAdminLogout} 
            className="flex items-center gap-2 text-stone-500 hover:text-red-500 transition-colors text-xs font-bold bg-white border border-stone-200/60 p-3.5 rounded-2xl shadow-sm cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" /> Sign Out
          </button>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Tab Selector & Alerts */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card bg-slate-900 border-slate-850 text-white p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Sparkles className="h-32 w-32 text-brand-primary" />
              </div>
              <h2 className="text-xl font-display font-extrabold mb-3 flex items-center gap-2">
                Enrollment Hub
              </h2>
              <p className="text-stone-400 text-xs leading-relaxed mb-6 font-medium">
                Register verified accounts below. Credentials generated will link to production database schemas directly.
              </p>
              
              <div className="space-y-2.5 relative z-10">
                {[
                  { id: 'recycling', label: 'Recycling Hub', icon: Recycle },
                  { id: 'new-company', label: 'New Client Co.', icon: Building2 },
                  { id: 'existing-company', label: 'Co. Admin Add', icon: UserPlus },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id as any); resetForm(); }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer",
                        activeTab === tab.id
                          ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                          : "bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0" />
                        {tab.label}
                      </span>
                      <ArrowRight className={cn("w-3.5 h-3.5 opacity-0 -translate-x-2 transition-all", activeTab === tab.id && "opacity-100 translate-x-0")} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card bg-amber-500/5 border border-amber-500/10 p-6">
              <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                <KeyRound className="h-4.5 w-4.5 text-amber-600" /> Administrative Notice
              </h3>
              <p className="text-amber-800/80 text-xs leading-relaxed font-medium">
                Identity provisioning is completed securely. The new credential records bypass the default self-registration pathways.
              </p>
            </div>
          </div>

          {/* Right Column: Enrollment Form */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="glass-card bg-white/80 border border-white/50 shadow-2xl"
              >
                <h2 className="text-2xl font-display font-extrabold text-brand-secondary mb-1">
                  {activeTab === 'recycling' && "Register Recycling Hub"}
                  {activeTab === 'new-company' && "Create Client Credentials"}
                  {activeTab === 'existing-company' && "Add Company Admin Key"}
                </h2>
                <p className="text-xs text-stone-450 mb-8 font-medium">
                  {activeTab === 'recycling' && "Registers authorization tokens under the recyclingCenters collection."}
                  {activeTab === 'new-company' && "Provisions brand new client companies with administrator clearances."}
                  {activeTab === 'existing-company' && "Appends additional administrator login credentials under a corporate tenant ID."}
                </p>

                <form onSubmit={handleCreateAccount} className="space-y-5">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-stone-450 uppercase tracking-widest ml-1">
                      {activeTab === 'recycling' && "Recycling Hub Name"}
                      {activeTab === 'new-company' && "Company Name"}
                      {activeTab === 'existing-company' && "Admin Full Name"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        activeTab === 'recycling' 
                          ? "e.g. Green Valley Facility" 
                          : activeTab === 'new-company' 
                            ? "e.g. Apex Builders Group" 
                            : "e.g. Sarah Connor"
                      }
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl border border-stone-200 bg-white/50 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  {/* Company ID Slug */}
                  {activeTab !== 'recycling' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-stone-450 uppercase tracking-widest ml-1">
                        {activeTab === 'new-company' ? "New Company ID (slug)" : "Existing Company ID"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. apex-builders"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl border border-stone-200 bg-white/50 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all text-sm font-mono"
                      />
                      <p className="text-[10px] text-stone-400 ml-1">Lowercase alphanumeric text and hyphens only.</p>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-stone-450 uppercase tracking-widest ml-1">Login Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. facility@hub.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl border border-stone-200 bg-white/50 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-stone-450 uppercase tracking-widest ml-1">Temporary Password</label>
                    <input
                      type="password"
                      required
                      placeholder="•••••••• (Minimum 6 symbols)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl border border-stone-200 bg-white/50 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  {/* Message displays */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-650 text-xs font-bold bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-2.5"
                      >
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-emerald-700 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-2.5"
                      >
                        <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                        <span>{successMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-secondary text-white py-4.5 rounded-2xl font-extrabold hover:bg-brand-primary hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-secondary/15 hover:shadow-brand-primary/20 text-base cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : null}
                    Provision Credentials
                  </button>
                </form>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

