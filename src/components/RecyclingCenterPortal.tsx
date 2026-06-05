import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Mail, Lock, Loader2, AlertCircle, Clock,
  MapPin, Trash2, ArrowLeft, LogOut, ChevronDown, ChevronUp,
  FileText, Filter, Phone, User, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  collection, query, onSnapshot, doc,
  updateDoc, getDoc, serverTimestamp, where
} from 'firebase/firestore';
import { cn } from '../lib/utils';

interface Report {
  id: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  quantity: string;
  location: { lat: number; lng: number; address: string };
  imageUrl?: string;
  status: 'pending' | 'in-progress' | 'resolved';
  timestamp: any;
  reporterDetails?: { name: string; email: string; phone?: string };
}

const STATUS_COLORS = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'in-progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

const URGENCY_COLORS = {
  low: 'bg-stone-100 text-stone-600 border border-stone-200/50',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200/50',
  high: 'bg-red-550/10 text-red-600 border border-red-550/20',
};

function timeAgo(ts: any): string {
  if (!ts?.toDate) return 'Just now';
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RecyclingCenterPortal() {
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [centerProfile, setCenterProfile] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'reports'), where('type', '==', 'illegal'));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Report));
      fetched.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setReports(fetched);
    });
    return () => unsub();
  }, [currentUser]);

  const handleLogin = async () => {
    if (!email || !password) return setError('Please fill in all fields');
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const docSnap = await getDoc(doc(db, 'recyclingCenters', cred.user.uid));
      if (!docSnap.exists()) {
        await signOut(auth);
        return setError('No recycling center account found. Please contact the administrator.');
      }
      setCenterProfile(docSnap.data());
      setCurrentUser(cred.user);
      setView('dashboard');
    } catch (e: any) {
      setError(e.code === 'auth/invalid-credential' ? 'Invalid email or password' : e.message);
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null); setCenterProfile(null);
    setReports([]); setView('login');
    setEmail(''); setPassword('');
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, 'reports', id), { status, updatedAt: serverTimestamp() });
    } finally { setUpdatingId(null); }
  };

  const filtered = filterStatus === 'all' ? reports : reports.filter(r => r.status === filterStatus);
  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    'in-progress': reports.filter(r => r.status === 'in-progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  // ── LOGIN VIEW ──────────────────────────────────────────────────────────
  if (view !== 'dashboard') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative z-10 selection:bg-brand-primary/20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <motion.div
            animate={{ x: [0, 45, 0], y: [0, 35, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 right-1/4 w-80 h-80 bg-brand-primary/5 rounded-full blur-[100px]"
          />
        </div>

        <div className="w-full max-w-md">
          <motion.button 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/')} 
            className="group mb-8 text-stone-400 hover:text-brand-secondary flex items-center transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer bg-white/40 border border-stone-200/50 backdrop-blur-md px-5 py-2.5 rounded-2xl w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
          </motion.button>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card bg-white/80 border border-white/50 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-brand-primary/10 p-4.5 rounded-3xl border border-brand-primary/25 text-brand-primary shadow-lg shadow-brand-primary/5">
                <Recycle className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-extrabold text-brand-secondary">Center Portal</h1>
                <p className="text-xs text-stone-450 font-medium">Log in to process incoming materials</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <input
                    type="email"
                    placeholder="center@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 bg-white/60 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 bg-white/60 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2.5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-650 text-xs font-bold"
                >
                  <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-brand-secondary text-white py-4.5 rounded-2xl font-extrabold hover:bg-brand-primary hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-secondary/15 hover:shadow-brand-primary/20 text-base cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign In to Portal"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD VIEW ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10 selection:bg-brand-primary/20">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/3 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-brand-primary p-3 rounded-2xl border border-brand-primary/10 text-white shadow-lg shadow-brand-primary/10">
              <Recycle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-extrabold text-brand-secondary">
                {centerProfile?.name || 'Recycling Center'}
              </h1>
              <p className="text-xs text-stone-450 mt-0.5 font-medium">Materials Routing & Public Incident Dashboard</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-stone-500 hover:text-red-500 transition-colors text-xs font-bold bg-white border border-stone-200/60 p-3.5 rounded-2xl shadow-sm cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" /> Sign Out
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Reports', count: counts.all, color: 'bg-white border border-stone-200/60 hover:border-stone-300', ring: 'ring-stone-400', val: 'all' },
            { label: 'Pending', count: counts.pending, color: 'bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/35 text-amber-700', ring: 'ring-amber-400', val: 'pending' },
            { label: 'In Progress', count: counts['in-progress'], color: 'bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/35 text-blue-700', ring: 'ring-blue-400', val: 'in-progress' },
            { label: 'Resolved', count: counts.resolved, color: 'bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/35 text-emerald-700', ring: 'ring-brand-primary', val: 'resolved' },
          ].map(s => (
            <button 
              key={s.val} 
              onClick={() => setFilterStatus(s.val)}
              className={cn(
                "p-5 rounded-3xl text-left transition-all duration-300 hover:-translate-y-0.5 cursor-pointer shadow-sm", 
                s.color,
                filterStatus === s.val && "ring-4 " + s.ring
              )}
            >
              <p className="text-3xl font-display font-black text-brand-secondary">{s.count}</p>
              <p className="text-[10px] font-black uppercase tracking-wider mt-1 text-stone-400">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filter bar status indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-400" />
            <span className="text-xs font-black uppercase tracking-wider text-stone-500">
              Filtering: <span className="text-brand-secondary underline decoration-brand-primary decoration-2 underline-offset-4">{filterStatus === 'all' ? 'All Reports' : `${filterStatus}`}</span>
              {' '}({filtered.length})
            </span>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card bg-white/50 text-center py-20 text-stone-400 border border-stone-200/50"
              >
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30 text-brand-primary" />
                <p className="font-bold text-base text-brand-secondary">No reports match filter criteria</p>
                <p className="text-xs mt-1 text-stone-400">All incoming reports have been successfully categorized.</p>
              </motion.div>
            ) : (
              filtered.map((report) => (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "glass-card bg-white/80 border border-stone-200/60 p-6 overflow-hidden hover:shadow-xl hover:border-stone-300 transition-all duration-300",
                    expandedId === report.id && "bg-white border-brand-primary/20 shadow-2xl scale-[1.01]"
                  )}
                >
                  {/* Card Header clickable block */}
                  <div
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                  >
                    {report.imageUrl ? (
                      <img src={report.imageUrl} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 bg-stone-150 border border-stone-200/40 shadow-inner" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center flex-shrink-0 border border-stone-200/40">
                        <Trash2 className="h-6 w-6 text-stone-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-extrabold text-brand-secondary text-sm">{report.category || 'Unknown Category'}</span>
                        <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider", URGENCY_COLORS[report.urgency])}>
                          {report.urgency}
                        </span>
                        <span className={cn("text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider", STATUS_COLORS[report.status])}>
                          {report.status}
                        </span>
                      </div>
                      {report.location?.address && (
                        <p className="text-xs text-stone-500 flex items-start gap-1 mb-2 font-medium">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-brand-primary" />
                          <span className="line-clamp-1">{report.location.address}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-stone-350" /> {timeAgo(report.timestamp)}
                        </span>
                        {report.quantity && (
                          <span className="truncate bg-stone-100/75 px-2 py-0.5 rounded-md text-[9px]">Load: {report.quantity}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-stone-400 mt-1">
                      {expandedId === report.id ? <ChevronUp className="h-5 w-5 text-brand-secondary" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>

                  {/* Expandable Details Container */}
                  <AnimatePresence>
                    {expandedId === report.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-stone-150/80 mt-5 pt-5 space-y-5">
                          {/* Reporter info */}
                          {report.reporterDetails && (
                            <div className="p-4.5 bg-stone-50/70 border border-stone-200/50 rounded-2xl">
                              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3">Reporter Information</p>
                              <div className="grid sm:grid-cols-3 gap-3.5 text-xs text-stone-600 font-semibold">
                                {report.reporterDetails.name && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-stone-400" />
                                    {report.reporterDetails.name}
                                  </div>
                                )}
                                {report.reporterDetails.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-stone-400" />
                                    {report.reporterDetails.email}
                                  </div>
                                )}
                                {report.reporterDetails.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-stone-400" />
                                    {report.reporterDetails.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Map Coordinates button */}
                          {report.location?.lat !== 0 && report.location?.lat && (
                            <a
                              href={`https://www.google.com/maps?q=${report.location.lat},${report.location.lng}`}
                              target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 text-brand-primary text-xs font-bold hover:underline bg-brand-primary/10 border border-brand-primary/10 px-4 py-2.5 rounded-xl hover:-translate-y-0.5 transition-all"
                            >
                              <MapPin className="h-4 w-4" /> View Map Location <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Full size attached image with nice frame */}
                          {report.imageUrl && (
                            <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-inner max-h-72 bg-black/5 flex items-center justify-center">
                              <img src={report.imageUrl} className="w-full h-full object-cover max-h-72 hover:scale-[1.01] transition-transform duration-500" />
                            </div>
                          )}

                          {/* Update status action control */}
                          <div>
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3 ml-0.5">Assign Status Level</p>
                            <div className="grid grid-cols-3 gap-3">
                              {(['pending', 'in-progress', 'resolved'] as const).map((s) => (
                                <button
                                  key={s}
                                  disabled={report.status === s || updatingId === report.id}
                                  onClick={() => updateStatus(report.id, s)}
                                  className={cn(
                                    "py-3 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer select-none",
                                    report.status === s
                                      ? s === 'pending' ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10"
                                        : s === 'in-progress' ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10"
                                        : "bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/10"
                                      : "bg-white text-stone-500 border-stone-200 hover:border-brand-primary hover:text-brand-primary disabled:opacity-40"
                                  )}
                                >
                                  {updatingId === report.id ? (
                                    <Loader2 className="animate-spin h-4 w-4 mx-auto" />
                                  ) : (
                                    s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
