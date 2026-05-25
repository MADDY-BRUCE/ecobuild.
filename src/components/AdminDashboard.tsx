import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Truck, LogOut, FileText, MapPin, CheckCircle, Clock, AlertCircle, LayoutDashboard, Search, Filter, MoreVertical, Check, Play, Phone } from 'lucide-react';
import { WasteReport, UserProfile } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function AdminDashboard({ profile }: { profile: UserProfile | null }) {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.['company id']) return;

    const allReports: { [id: string]: WasteReport } = {};

    // Show professional reports for THIS admin's company
    const professionalQuery = query(
      collection(db, 'reports'),
      where('company id', '==', profile['company id']),
      where('type', '==', 'professional'),
      orderBy('timestamp', 'desc')
    );

    // Show ALL public illegal dumping reports to all admins
    const publicQuery = query(
      collection(db, 'reports'),
      where('reporterUid', '==', 'public-user'),
      orderBy('timestamp', 'desc')
    );

    const updateReports = () => {
      setReports(Object.values(allReports).sort((a: any, b: any) =>
        (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
      ));
      setLoading(false);
    };

    const unsubscribeProfessional = onSnapshot(professionalQuery, (snapshot) => {
      snapshot.docs.forEach(doc => {
        allReports[doc.id] = { id: doc.id, ...doc.data() } as WasteReport;
      });
      updateReports();
    });

    const unsubscribePublic = onSnapshot(publicQuery, (snapshot) => {
      snapshot.docs.forEach(doc => {
        allReports[doc.id] = { id: doc.id, ...doc.data() } as WasteReport;
      });
      updateReports();
    });

    return () => {
      unsubscribeProfessional();
      unsubscribePublic();
    };
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

  return (
    <div className="min-h-screen flex relative">
      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full border-[100px] border-brand-primary/5 rounded-full blur-3xl"
        />
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-stone-100 flex-col p-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-brand-secondary p-2 rounded-xl">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">EcoBuild <span className="text-brand-primary italic">Admin</span></span>
        </div>

        <nav className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-primary/10 text-brand-primary font-bold text-sm transition-all">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </button>
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:text-red-500 font-bold text-sm transition-all"
        >
          <LogOut className="h-5 w-5" /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold text-brand-secondary mb-2">System Overview</h1>
            <p className="text-stone-400 font-medium">Real-time monitoring of waste reports and recycling logs.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search reports..." 
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-stone-100 focus:ring-2 focus:ring-brand-primary outline-none transition-all text-sm art-shadow"
              />
            </div>
            <button className="p-3 bg-white rounded-2xl border border-stone-100 text-stone-400 hover:text-brand-primary transition-all art-shadow">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bento-card bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-emerald-50 p-3 rounded-2xl text-brand-primary"><FileText className="h-6 w-6" /></div>
              <div className="text-3xl font-display font-bold text-brand-secondary">{reports.length}</div>
            </div>
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Total Reports</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bento-card bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-amber-50 p-3 rounded-2xl text-amber-600"><Clock className="h-6 w-6" /></div>
              <div className="text-3xl font-display font-bold text-brand-secondary">{reports.filter(r => r.status === 'pending').length}</div>
            </div>
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Pending Tasks</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bento-card bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><CheckCircle className="h-6 w-6" /></div>
              <div className="text-3xl font-display font-bold text-brand-secondary">{reports.filter(r => r.status === 'resolved').length}</div>
            </div>
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Resolved Logs</div>
          </motion.div>
        </div>

        {/* Table Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="bento-card bg-white overflow-hidden p-0"
        >
          <div className="p-8 border-b border-stone-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-brand-secondary">Recent Activity</h2>
            <button className="text-sm font-bold text-brand-primary hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-stone-400 text-[10px] uppercase tracking-[0.1em] font-bold">
                  <th className="px-3 py-4">Type</th>
                  <th className="px-3 py-4">Reporter</th>
                  <th className="px-3 py-4">Category</th>
                  <th className="px-3 py-4">Urgency</th>
                  <th className="px-3 py-4">Amount</th>
                  <th className="px-3 py-4">Pinpoint Location</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4">Timestamp</th>
                  <th className="px-3 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {reports.map((report) => (
                  <tr key={report.id} className="group hover:bg-stone-50/50 transition-colors">
                    <td className="px-3 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        report.type === 'illegal' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {report.type}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {report.reporterDetails ? (
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-brand-secondary">{report.reporterDetails.name}</div>
                          <div className="text-[10px] font-medium text-stone-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {report.reporterDetails.mobile}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-stone-300 italic">Professional Log</div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="font-display font-bold text-brand-secondary">{report.category}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit",
                        report.urgency === 'high' ? "bg-red-100 text-red-600" : 
                        report.urgency === 'medium' ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-600"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          report.urgency === 'high' ? "bg-red-500" : 
                          report.urgency === 'medium' ? "bg-amber-500" : "bg-white border border-stone-300"
                        )} />
                        {report.urgency}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm font-bold text-brand-secondary">
                        {report.amount ? `${report.amount} ${report.unit || 'tons'}` : '-'}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center text-stone-500 text-sm font-medium">
                        <MapPin className="h-4 w-4 mr-2 text-brand-primary opacity-50" />
                        {report.location.address}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className={cn(
                        "flex items-center text-xs font-bold uppercase tracking-widest",
                        report.status === 'pending' ? "text-amber-600" : 
                        report.status === 'in-progress' ? "text-blue-600" : "text-emerald-600"
                      )}>
                        {report.status === 'pending' ? <Clock className="h-3 w-3 mr-2" /> : 
                         report.status === 'in-progress' ? <Play className="h-3 w-3 mr-2" /> : <CheckCircle className="h-3 w-3 mr-2" />}
                        {report.status}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-stone-400 text-xs font-medium">
                      {report.timestamp ? new Date((report.timestamp as any).seconds * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        {report.status === 'pending' && (
                          <button 
                            onClick={() => handleUpdateStatus(report.id!, 'in-progress')}
                            disabled={updatingId === report.id}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Mark as In Progress"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {report.status !== 'resolved' && (
                          <button 
                            onClick={() => handleUpdateStatus(report.id!, 'resolved')}
                            disabled={updatingId === report.id}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Mark as Resolved"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {report.status !== 'pending' && (
                          <button 
                            onClick={() => handleUpdateStatus(report.id!, 'pending')}
                            disabled={updatingId === report.id}
                            className="p-2 bg-stone-50 text-stone-400 rounded-lg hover:bg-stone-100 transition-colors"
                            title="Reset to Pending"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
