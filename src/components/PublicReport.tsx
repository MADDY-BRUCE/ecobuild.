import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Send, Loader2, CheckCircle2, Upload, Phone, Mail, User, ChevronDown, AlertCircle, Recycle, ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { identifyWaste } from '../services/geminiService';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

const WASTE_CATEGORIES = [
  "Plastic", "Metal", "Glass", "Paper & Cardboard",
  "Construction & Demolition", "Organic / Food",
  "Electronic (E-waste)", "Hazardous", "Textiles", "Other"
];

const URGENCY_CONFIG = {
  low:    { label: 'Low',    color: 'from-emerald-400 to-teal-500',    bg: 'bg-emerald-50',    border: 'border-emerald-300',    text: 'text-emerald-700',    dot: 'bg-emerald-500' },
  medium: { label: 'Medium', color: 'from-amber-400 to-orange-500',    bg: 'bg-amber-50',      border: 'border-amber-300',      text: 'text-amber-700',      dot: 'bg-amber-500' },
  high:   { label: 'High',   color: 'from-red-400 to-rose-600',        bg: 'bg-red-50',        border: 'border-red-300',        text: 'text-red-700',        dot: 'bg-red-500' },
} as const;

export default function PublicReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');
  const [locationText, setLocationText] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiDetecting, setAiDetecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setAiDetecting(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      try {
        const identified = await identifyWaste(base64);
        setCategory(identified);
      } catch {}
      setLoading(false);
      setAiDetecting(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'EcoBuild-App' } }
          );
          const data = await res.json();
          setLocationText(data.display_name?.split(',').slice(0, 3).join(', ') || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setLocationText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setLoading(false);
      },
      (err) => { alert(err.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 30000 }
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!userData.name.trim()) e.name = 'Full name is required';
    if (!userData.email.trim() || !/\S+@\S+\.\S+/.test(userData.email)) e.email = 'Valid email required';
    if (!category) e.category = 'Please select a waste category';
    if (!quantity.trim()) e.quantity = 'Quantity / load description is required';
    if (!locationText.trim()) e.location = 'Please provide location details';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: 'public-user',
        type: 'illegal',
        category,
        urgency,
        quantity,
        location: { lat: coords?.lat || 0, lng: coords?.lng || 0, address: locationText },
        imageUrl: image,
        timestamp: serverTimestamp(),
        status: 'pending',
        reporterDetails: { name: userData.name, email: userData.email, phone: userData.phone },
        destination: 'recycling-center'
      });
      setSubmitted(true);
    } catch {
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success Screen ── */
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="max-w-md w-full text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40"
          >
            <CheckCircle2 className="h-16 w-16 text-white" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">Report Submitted</p>
            <h2 className="text-4xl font-display font-bold text-white mb-4 leading-tight">Ticket Filed<br />Successfully!</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-10">
              Your report has been submitted and forwarded to the nearest recycling center for action. Thank you for helping keep our environment clean.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex flex-col gap-3">
            <button
              onClick={() => { setSubmitted(false); setUserData({ name: '', email: '', phone: '' }); setCategory(''); setQuantity(''); setLocationText(''); setImage(null); setCoords(null); setUrgency('low'); }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-bold transition-all"
            >
              Submit Another Report
            </button>
            <button onClick={() => navigate('/')} className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold transition-all border border-white/10">
              Back to Home
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ── Main Form ── */
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-stone-50 to-emerald-50/30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[100px]" />
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 py-16 px-6">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, hsl(160 60% 40% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(200 60% 30% / 0.3) 0%, transparent 50%)' }} />
        <div className="max-w-3xl mx-auto relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/50 hover:text-white/90 transition-colors text-sm font-bold uppercase tracking-widest mb-10"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-2.5 rounded-2xl">
              <AlertCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-[0.25em]">Public Reporting Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight mb-3">
            File a Waste<br />Incident Report
          </h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-md">
            Reports are forwarded directly to the nearest recycling center. Help us build a cleaner community.
          </p>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 space-y-6">

        {/* Step 1 — Contact Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bento-card bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-emerald-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-brand-primary/30">1</div>
            <h2 className="text-sm font-bold text-stone-600 uppercase tracking-[0.18em]">Contact Information</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Full Name <span className="text-red-400">*</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={userData.name}
                  onChange={(e) => { setUserData({ ...userData, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                  className={cn("w-full pl-10 pr-4 py-3 rounded-xl border bg-stone-50 text-sm focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all",
                    errors.name ? "border-red-300 bg-red-50" : "border-stone-200")}
                />
                {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Email Address <span className="text-red-400">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                <input
                  type="email"
                  placeholder="john@email.com"
                  value={userData.email}
                  onChange={(e) => { setUserData({ ...userData, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                  className={cn("w-full pl-10 pr-4 py-3 rounded-xl border bg-stone-50 text-sm focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all",
                    errors.email ? "border-red-300 bg-red-50" : "border-stone-200")}
                />
                {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Callback Phone <span className="text-stone-300">(Optional)</span></label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Step 2 — Disposal Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="bento-card bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-amber-400/30">2</div>
            <h2 className="text-sm font-bold text-stone-600 uppercase tracking-[0.18em]">Disposal Details</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Waste Category <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setErrors({ ...errors, category: '' }); }}
                  className={cn("w-full appearance-none pr-9 pl-4 py-3 rounded-xl border bg-stone-50 text-sm focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all",
                    errors.category ? "border-red-300 bg-red-50" : "border-stone-200",
                    !category && "text-stone-400")}
                >
                  <option value="">-- Pick Category --</option>
                  {WASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                {errors.category && <p className="text-red-500 text-[11px] mt-1">{errors.category}</p>}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Quantity / Load <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="e.g. 5 black bags, full truck load"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setErrors({ ...errors, quantity: '' }); }}
                className={cn("w-full px-4 py-3 rounded-xl border bg-stone-50 text-sm focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all",
                  errors.quantity ? "border-red-300 bg-red-50" : "border-stone-200")}
              />
              {errors.quantity && <p className="text-red-500 text-[11px] mt-1">{errors.quantity}</p>}
            </div>
          </div>

          {/* Urgency Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">Urgency Level</label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((level) => {
                const cfg = URGENCY_CONFIG[level];
                const active = urgency === level;
                return (
                  <button
                    key={level}
                    onClick={() => setUrgency(level)}
                    className={cn(
                      "relative overflow-hidden py-3.5 rounded-2xl font-bold text-sm border-2 transition-all",
                      active ? `${cfg.bg} ${cfg.border} ${cfg.text}` : "bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="urgency-indicator"
                        className={`absolute inset-0 bg-gradient-to-br ${cfg.color} opacity-10 rounded-xl`}
                      />
                    )}
                    <div className="relative flex flex-col items-center gap-1.5">
                      <div className={cn("w-2.5 h-2.5 rounded-full", active ? cfg.dot : "bg-stone-300")} />
                      {cfg.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Detection Badge */}
          <AnimatePresence>
            {(category || aiDetecting) && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 p-4 bg-gradient-to-r from-brand-primary/5 to-emerald-400/5 rounded-2xl border border-brand-primary/15 flex items-center gap-3"
              >
                {aiDetecting ? (
                  <Loader2 className="h-5 w-5 text-brand-primary animate-spin flex-shrink-0" />
                ) : (
                  <Sparkles className="h-5 w-5 text-brand-primary flex-shrink-0" />
                )}
                <div>
                  <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">AI-Detected Category</p>
                  <p className="text-sm font-bold text-brand-secondary">{aiDetecting ? 'Analyzing image…' : category}</p>
                </div>
                <Recycle className="h-4 w-4 text-brand-primary/30 ml-auto" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Step 3 — Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bento-card bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-blue-400/30">3</div>
            <h2 className="text-sm font-bold text-stone-600 uppercase tracking-[0.18em]">Incident Location</h2>
          </div>

          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Address / Coordinates <span className="text-red-400">*</span></label>
            <button
              onClick={handleGetLocation}
              disabled={loading}
              className="flex items-center gap-1.5 text-[11px] font-bold text-brand-primary hover:text-brand-primary/70 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
              Use GPS
            </button>
          </div>
          <textarea
            placeholder="e.g. Near highway intersection 4, behind the public park fence"
            value={locationText}
            onChange={(e) => { setLocationText(e.target.value); setErrors({ ...errors, location: '' }); }}
            rows={3}
            className={cn("w-full px-4 py-3 rounded-xl border bg-stone-50 text-sm focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all resize-none",
              errors.location ? "border-red-300 bg-red-50" : "border-stone-200")}
          />
          {errors.location && <p className="text-red-500 text-[11px] mt-1">{errors.location}</p>}
          {coords && (
            <p className="text-[11px] text-stone-400 mt-2 font-mono bg-stone-50 border border-stone-100 rounded-lg px-3 py-1.5 inline-block">
              📍 GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </motion.div>

        {/* Step 4 — Image */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bento-card bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-purple-400/30">4</div>
            <h2 className="text-sm font-bold text-stone-600 uppercase tracking-[0.18em]">Visual Evidence <span className="text-stone-300 font-normal normal-case tracking-normal">(optional)</span></h2>
          </div>

          <AnimatePresence mode="wait">
            {image ? (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative rounded-2xl overflow-hidden aspect-video">
                <img src={image} className="w-full h-full object-cover" alt="Incident" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-stone-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white transition-all"
                >
                  Change Photo
                </button>
                {aiDetecting && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin h-8 w-8 text-white" />
                    <p className="text-white text-sm font-bold">AI Identifying Waste…</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="border-2 border-dashed border-stone-200 rounded-2xl p-10 text-center hover:border-brand-primary/40 hover:bg-brand-primary/2 transition-all">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-stone-100 p-4 rounded-2xl">
                      <Upload className="h-7 w-7 text-stone-400" />
                    </div>
                    <p className="text-sm text-stone-500">
                      Drag & drop your photo, or{' '}
                      <button onClick={() => fileInputRef.current?.click()} className="text-brand-primary font-bold hover:underline">browse file</button>
                    </p>
                    <div className="flex items-center gap-3 w-full max-w-xs">
                      <div className="flex-1 h-px bg-stone-200" />
                      <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">or snap live</span>
                      <div className="flex-1 h-px bg-stone-200" />
                    </div>
                    <button
                      onClick={() => webcamRef.current?.click()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-stone-200 rounded-xl text-sm font-bold text-stone-600 hover:border-brand-primary hover:text-brand-primary transition-all"
                    >
                      <Camera className="h-4 w-4" /> Use Camera
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <input ref={webcamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full relative overflow-hidden bg-gradient-to-r from-brand-secondary to-brand-primary text-white py-5 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:scale-[1.01]"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
          File Ticket Information
        </motion.button>

        <p className="text-center text-[11px] text-stone-400 pb-8">
          Your report is encrypted and handled in accordance with our privacy policy.
        </p>
      </div>
    </div>
  );
}
