import { useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, Send, LogOut, Loader2, HardHat, Camera, CheckCircle, Upload, Sparkles, AlertTriangle } from 'lucide-react';
import { identifyWaste } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

const CATEGORIES = ['Concrete', 'Metal', 'Wood', 'Plastic', 'Hazardous', 'Glass', 'Organic', 'Other'];

const URGENCY_CONFIG = {
  high:   { label: 'Critical',  color: 'bg-red-500 text-white border-red-600',   inactive: 'bg-white text-stone-500 border-stone-200', dot: 'bg-red-400', glow: 'shadow-red-500/30' },
  medium: { label: 'Moderate',  color: 'bg-amber-500 text-white border-amber-600', inactive: 'bg-white text-stone-500 border-stone-200', dot: 'bg-amber-400', glow: 'shadow-amber-500/30' },
  low:    { label: 'Routine',   color: 'bg-emerald-500 text-white border-emerald-600', inactive: 'bg-white text-stone-500 border-stone-200', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/30' },
} as const;

export default function LaborDashboard({ profile }: { profile: UserProfile | null }) {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState<'tons' | 'kg'>('tons');
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low'>('low');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiDetecting, setAiDetecting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => signOut(auth);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setAiDetecting(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      const identifiedCategory = await identifyWaste(base64);
      setCategory(identifiedCategory);
      setLoading(false);
      setAiDetecting(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Location detected with accuracy: ${accuracy} meters`);
        setLocation({ lat: latitude, lng: longitude, address: "Identifying pinpoint location..." });
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'EcoBuild-Waste-Management-App' } }
          );
          const data = await response.json();
          if (data?.display_name) {
            const addressParts = data.display_name.split(',');
            const pinpointName = addressParts.slice(0, 3).join(',').trim();
            setLocation({ lat: latitude, lng: longitude, address: pinpointName || data.display_name });
          } else {
            setLocation({ lat: latitude, lng: longitude, address: `Site at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocation({ lat: latitude, lng: longitude, address: `Site at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(`Unable to retrieve location: ${error.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  const handleSubmit = async () => {
    if (!category || !amount || !location) {
      alert("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: auth.currentUser?.uid,
        'company id': profile?.['company id'],
        type: 'professional',
        category,
        urgency,
        amount: parseFloat(amount),
        unit,
        location,
        imageUrl: image,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setShowSuccess(false), 6000);
      setImage(null);
      setCategory('');
      setAmount('');
      setUnit('tons');
      setLocation(null);
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && !!category && !!amount && !!location;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950" />
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-brand-primary/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-brand-primary to-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-brand-primary/30">
              <HardHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white leading-tight block">
                EcoBuild <span className="text-emerald-400 italic">Labor</span>
              </span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none block">
                {auth.currentUser?.email}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all text-sm font-bold border border-white/10"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* ── Left Sidebar ── */}
          <div className="lg:col-span-4 space-y-5">
            {/* Hero Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, hsl(160 60% 25%) 0%, hsl(200 50% 15%) 100%)' }}
            >
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, hsl(160 80% 60% / 0.4) 0%, transparent 60%)' }} />
              <div className="relative p-8">
                <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                  <HardHat className="h-7 w-7 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-display font-bold text-white leading-tight mb-3">
                  Site Disposal<br />Log
                </h1>
                <p className="text-white/50 text-sm leading-relaxed">
                  Document and categorize construction waste for professional recycling pickup.
                </p>
              </div>
            </motion.div>

            {/* Status Cards */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 space-y-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Site Status</p>
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <div className="relative">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                  <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-50" />
                </div>
                <span className="text-emerald-300 text-sm font-bold">Active Site Connection</span>
              </div>
              {profile && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Worker ID</p>
                  <p className="text-white/80 text-sm font-bold truncate">{auth.currentUser?.uid?.slice(0, 12)}…</p>
                </div>
              )}
            </motion.div>

            {/* Quick Guide */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Steps to Log</p>
              <ol className="space-y-3">
                {['Capture waste photo', 'Select category & amount', 'Verify GPS location', 'Submit log'].map((step, i) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-primary/60 to-emerald-600/60 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-white/60 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>

          {/* ── Right Form ── */}
          <div className="lg:col-span-8 space-y-5">
            {/* Success Banner */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className="p-5 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl backdrop-blur-sm flex items-center gap-4"
                >
                  <div className="bg-emerald-500/30 p-2.5 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-300 font-bold">Report submitted successfully!</p>
                    <p className="text-emerald-400/60 text-sm">EcoBuild site managers have been notified.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Capture */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video relative cursor-pointer group"
              >
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-cover" alt="Waste capture" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {aiDetecting && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                        <Sparkles className="h-8 w-8 text-emerald-400 animate-pulse" />
                        <p className="text-white font-bold text-sm">AI Identifying Waste…</p>
                      </div>
                    )}
                    {!aiDetecting && category && (
                      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                        <span className="text-white text-sm font-bold">{category}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-white/5 to-white/2 group-hover:from-white/10 transition-all">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="bg-white/10 border border-white/20 p-6 rounded-3xl"
                    >
                      <Camera className="h-10 w-10 text-emerald-400" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-white/60 font-bold text-sm mb-1">Tap to Capture Waste Photo</p>
                      <p className="text-white/30 text-xs">AI will automatically identify the waste type</p>
                    </div>
                    <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white/70 transition-colors border border-white/10 rounded-lg px-3 py-1.5">
                      <Upload className="h-3 w-3" /> Browse files
                    </button>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
            </motion.div>

            {/* Category & Amount */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid md:grid-cols-2 gap-5">
              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Waste Category *</label>
                <select
                  className="w-full bg-transparent border-none focus:ring-0 text-lg font-display font-bold text-white appearance-none outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" className="bg-slate-800 text-white/60">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>)}
                </select>
                <div className="mt-3 h-px bg-white/10" />
                {!category && <p className="text-white/30 text-xs mt-2">Required field</p>}
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Amount *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="0.00"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-display font-bold text-white placeholder:text-white/20 outline-none"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <select
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold text-white/80 outline-none"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as 'tons' | 'kg')}
                  >
                    <option value="tons" className="bg-slate-800">Tons</option>
                    <option value="kg" className="bg-slate-800">kg</option>
                  </select>
                </div>
                <div className="mt-3 h-px bg-white/10" />
              </div>
            </motion.div>

            {/* Urgency */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-5">Priority Level</label>
              <div className="grid grid-cols-3 gap-4">
                {(['high', 'medium', 'low'] as const).map((level) => {
                  const cfg = URGENCY_CONFIG[level];
                  const active = urgency === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setUrgency(level)}
                      className={cn(
                        "flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all",
                        active
                          ? `${cfg.color} shadow-lg ${cfg.glow}`
                          : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn("w-3.5 h-3.5 rounded-full", active ? "bg-white" : cfg.dot)} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">{cfg.label}</span>
                      {level === 'high' && <AlertTriangle className="h-3 w-3 opacity-70" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* GPS Location */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
              <button
                onClick={handleGetLocation}
                disabled={loading}
                className={cn(
                  "w-full flex items-center justify-center gap-3 p-5 rounded-2xl font-bold text-base transition-all",
                  location
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
                    : "bg-gradient-to-r from-brand-primary to-emerald-500 text-white shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 hover:scale-[1.01]",
                  "disabled:opacity-50"
                )}
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                {location ? "Location Verified ✓" : "Verify Site Location via GPS"}
              </button>

              <AnimatePresence>
                {location && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/30 p-2 rounded-xl">
                          <MapPin className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="text-emerald-300 font-bold text-sm">Verified Site Location</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-emerald-400/70 hover:text-emerald-400 transition-colors"
                      >
                        View on Map →
                      </a>
                    </div>
                    <textarea
                      className="w-full bg-transparent border-none focus:ring-0 text-emerald-200/80 text-sm resize-none h-16 outline-none"
                      value={location.address}
                      onChange={(e) => setLocation(prev => prev ? { ...prev, address: e.target.value } : null)}
                      placeholder="Refine address if needed..."
                    />
                    <p className="text-[10px] font-mono text-emerald-400/50">
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-brand-secondary to-brand-primary text-white py-6 rounded-2xl font-bold text-lg hover:scale-[1.01] disabled:opacity-30 disabled:scale-100 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-secondary/30"
            >
              {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <><Send className="h-5 w-5" /> Submit Disposal Log</>}
            </motion.button>

            {!canSubmit && !loading && (
              <p className="text-center text-white/30 text-xs">
                Complete all required fields to enable submission
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-8 right-8 z-50 p-5 bg-emerald-600 text-white rounded-3xl shadow-2xl flex items-center gap-4 border border-emerald-400 max-w-sm"
          >
            <div className="bg-white/20 p-2.5 rounded-2xl shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-sm">Report submitted!</p>
              <p className="text-xs text-white/80 mt-0.5">Site managers have been notified.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
