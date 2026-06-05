import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import {
  Truck, LogOut, FileText, MapPin, CheckCircle, Clock,
  AlertCircle, LayoutDashboard, Search, Filter,
  Check, Play, Phone, TrendingUp, Activity, ChevronDown
} from 'lucide-react';
import { WasteReport, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     icon: Clock,       pill: 'bg-amber-100 text-amber-700 border-amber-200',  dot: 'bg-amber-400' },
  'in-progress': { label: 'In Progress', icon: Play,        pill: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-400' },
  resolved:    { label: 'Resolved',    icon: CheckCircle, pill: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
} as const;

const URGENCY_CONFIG = {
  high:   { pill: 'bg-red-100 text-red-700',    dot: 'bg-red-400' },
  medium: { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  low:    { pill: 'bg-stone-100 text-stone-600', dot: 'bg-stone-400' },
} as const;

function timeAgo(ts: any) {
  if (!ts?.seconds) return 'Just now';
  const diff = (Date.now() - ts.seconds * 1000) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminDashboard({ profile }: { profile: UserProfile | null }) {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);

  useEffect(() => {
    if (!profile?.['company id']) return;
    const professionalQuery = query(
      collection(db, 'reports'),
      where('company id', '==', profile['company id']),
      where('type', '==', 'professional')
    );
    const unsubscribeProfessional = onSnapshot(professionalQuery, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WasteReport));
      fetched.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setReports(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching professional reports:", error);
      setLoading(false);
    });
    return () => { unsubscribeProfessional(); };
  }, [profile]);

  const handleLogout = () => signOut(auth);

  const handleUpdateStatus = async (reportId: string, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    setUpdatingId(reportId);
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Check permissions.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = reports.filter(r => {
    const matchSearch = !search ||
      r.category?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.address?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchUrgency = filterUrgency === 'all' || r.urgency === filterUrgency;
    return matchSearch && matchStatus && matchUrgency;
  });

  const stats = [
    { label: 'Total Reports', value: reports.length, icon: FileText, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600', sub: 'All time' },
    { label: 'Pending Tasks', value: reports.filter(r => r.status === 'pending').length, icon: Clock, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600', sub: 'Needs action' },
    { label: 'In Progress', value: reports.filter(r => r.status === 'in-progress').length, icon: Activity, color: 'from-blue-400 to-sky-500', bg: 'bg-sky-50', text: 'text-sky-600', sub: 'Being handled' },
    { label: 'Resolved', value: reports.filter(r => r.status === 'resolved').length, icon: CheckCircle, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600', sub: 'Completed' },
  ];

  return (
    <div className="min-h-screen flex relative bg-stone-50/50">
      {/* Subtle Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-stone-50 to-blue-50/20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/3 rounded-full blur-[150px]" />
      </div>

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-stone-100 flex-col p-8 sticky top-0 h-screen shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-gradient-to-br from-brand-secondary to-brand-primary p-2.5 rounded-2xl shadow-lg shadow-brand-primary/20">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-tight block leading-tight">
              EcoBuild <span className="text-brand-primary italic">Admin</span>
            </span>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Dashboard</span>
          </div>
        </div>

        {/* Company Badge */}
        {profile && (
          <div className="mb-8 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Company</p>
            <p className="text-sm font-bold text-brand-secondary truncate">{profile['company id'] || 'N/A'}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="space-y-1 flex-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-primary/10 text-brand-primary font-bold text-sm">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </button>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-stone-400 hover:text-red-500 hover:bg-red-50 font-bold text-sm transition-all"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <p className="text-[11px] font-bold text-brand-primary uppercase tracking-[0.25em] mb-1">Admin Console</p>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-secondary leading-tight">System Overview</h1>
            <p className="text-stone-400 text-sm mt-1">Real-time monitoring of waste reports and recycling logs.</p>
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search reports…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-stone-200 focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all text-sm shadow-sm"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none pl-4 pr-8 py-3 rounded-2xl bg-white border border-stone-200 focus:ring-2 focus:ring-brand-primary/30 outline-none text-sm font-bold text-stone-600 shadow-sm cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            </div>
            <button className="p-3 bg-white rounded-2xl border border-stone-200 text-stone-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-sm">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bento-card bg-white group hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.text)} />
                </div>
                <TrendingUp className="h-4 w-4 text-stone-200 group-hover:text-stone-300 transition-colors" />
              </div>
              <div className={cn("text-3xl font-display font-bold mb-1", stat.text)}>{stat.value}</div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">{stat.label}</div>
              <div className="text-[10px] text-stone-300 mt-0.5">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bento-card bg-white p-0 overflow-hidden"
        >
          {/* Table Header */}
          <div className="px-8 py-5 border-b border-stone-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-brand-secondary">Recent Activity</h2>
              <p className="text-xs text-stone-400 mt-0.5">{filtered.length} report{filtered.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-stone-400 text-sm font-medium">Loading reports…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="bg-stone-100 p-5 rounded-3xl">
                <FileText className="h-8 w-8 text-stone-300" />
              </div>
              <p className="text-stone-400 font-medium text-sm">No reports match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-50">
                    {['Category', 'Reporter', 'Urgency', 'Amount', 'Location', 'Status', 'Time', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-stone-300 uppercase tracking-[0.12em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((report, idx) => {
                    const statusCfg = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG];
                    const urgencyCfg = URGENCY_CONFIG[report.urgency as keyof typeof URGENCY_CONFIG];
                    const StatusIcon = statusCfg?.icon ?? Clock;
                    return (
                      <motion.tr
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-stone-50 last:border-0 hover:bg-stone-50/80 transition-colors group"
                      >
                        {/* Category */}
                        <td className="px-5 py-4">
                          <div className="font-display font-bold text-brand-secondary text-sm">{report.category}</div>
                          <div className="text-[10px] text-stone-300 uppercase tracking-wider mt-0.5">
                            {report.type === 'illegal' ? 'Public' : 'Professional'}
                          </div>
                        </td>

                        {/* Reporter */}
                        <td className="px-5 py-4">
                          {report.reporterDetails ? (
                            <div>
                              <div className="text-sm font-bold text-brand-secondary">{report.reporterDetails.name}</div>
                              <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" /> {report.reporterDetails.mobile || '—'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-300 italic">Site Worker</span>
                          )}
                        </td>

                        {/* Urgency */}
                        <td className="px-5 py-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", urgencyCfg?.pill)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", urgencyCfg?.dot)} />
                            {report.urgency}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4">
                          <div className="text-sm font-bold text-stone-600">
                            {report.amount ? `${report.amount} ${report.unit || 'tons'}` : <span className="text-stone-300">—</span>}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4 max-w-[160px]">
                          <div className="flex items-start gap-1.5 text-stone-500 text-xs">
                            <MapPin className="h-3.5 w-3.5 text-brand-primary/40 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{report.location?.address || '—'}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", statusCfg?.pill)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg?.dot)} />
                            {statusCfg?.label}
                          </span>
                        </td>

                        {/* Time */}
                        <td className="px-5 py-4 text-stone-400 text-xs whitespace-nowrap">
                          {timeAgo(report.timestamp)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {report.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(report.id!, 'in-progress')}
                                disabled={updatingId === report.id}
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Mark In Progress"
                              >
                                <Play className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {report.status !== 'resolved' && (
                              <button
                                onClick={() => handleUpdateStatus(report.id!, 'resolved')}
                                disabled={updatingId === report.id}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                title="Mark Resolved"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {report.status !== 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(report.id!, 'pending')}
                                disabled={updatingId === report.id}
                                className="p-2 bg-stone-50 text-stone-400 rounded-xl hover:bg-stone-100 transition-colors disabled:opacity-50"
                                title="Reset to Pending"
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {updatingId === report.id && (
                              <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
