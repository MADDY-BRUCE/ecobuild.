import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Building2, ShieldAlert, ArrowRight, Leaf,
  Sparkles, MapPin, BarChart3, Zap, Globe, CheckCircle2,
  ChevronDown, Camera, Send, Users
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';

/* ── Animated counter hook ── */
function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => {
          start = Math.min(start + step, target);
          setCount(Math.floor(start));
          if (start >= target) clearInterval(t);
        }, 16);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

/* ── Floating particle ── */
function Particle({ delay, size, x, y, duration }: { delay: number; size: number; x: number; y: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-emerald-400/20 pointer-events-none"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
      animate={{ y: [-20, 20, -20], opacity: [0.2, 0.6, 0.2] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

const PARTICLES = [
  { delay: 0, size: 6, x: 10, y: 20, duration: 6 },
  { delay: 1, size: 10, x: 80, y: 15, duration: 8 },
  { delay: 2, size: 4, x: 60, y: 70, duration: 5 },
  { delay: 0.5, size: 8, x: 30, y: 80, duration: 7 },
  { delay: 1.5, size: 5, x: 90, y: 55, duration: 9 },
  { delay: 3, size: 12, x: 5, y: 60, duration: 6.5 },
  { delay: 2.5, size: 7, x: 50, y: 10, duration: 7.5 },
];

const FEATURES = [
  {
    icon: Camera,
    title: 'AI Waste Detection',
    desc: 'Snap a photo — Gemini Vision instantly identifies the waste type, estimates volume, and routes it to the nearest facility.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: MapPin,
    title: 'Real-time GPS Tracking',
    desc: 'High-accuracy geolocation pins every incident to the exact address, enabling fast dispatch and verification.',
    color: 'from-blue-500 to-sky-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: Send,
    title: 'Instant Dispatch',
    desc: 'Reports are routed live to the nearest recycling center. Site managers get notified within seconds.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Full visibility into pending, in-progress, and resolved reports with priority-tiered management controls.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
];

const PORTALS = [
  {
    icon: Users,
    label: 'Public Citizen',
    desc: 'Report an illegal dump site near you — no login required.',
    cta: 'File a Report',
    route: '/public-report',
    gradient: 'from-emerald-600 to-teal-700',
    accent: 'bg-emerald-400/20 border-emerald-400/30',
    ring: 'ring-emerald-500/30',
  },
  {
    icon: Building2,
    label: 'Construction Company',
    desc: 'Log professional waste for certified recycling pickup.',
    cta: 'Company Portal',
    route: '/company-portal',
    gradient: 'from-slate-700 to-slate-900',
    accent: 'bg-white/10 border-white/20',
    ring: 'ring-slate-400/20',
  },
  {
    icon: Recycle,
    label: 'Recycling Center',
    desc: 'Manage incoming incident tickets and mark resolutions.',
    cta: 'Center Login',
    route: '/recycling-center',
    gradient: 'from-blue-700 to-indigo-800',
    accent: 'bg-blue-400/20 border-blue-400/30',
    ring: 'ring-blue-500/20',
  },
  {
    icon: ShieldAlert,
    label: 'Super Admin',
    desc: 'Global configuration panel to enroll companies, recycling hubs, and credentials.',
    cta: 'System Login',
    route: '/super-admin',
    gradient: 'from-amber-600 to-orange-700',
    accent: 'bg-amber-300/20 border-amber-300/30',
    ring: 'ring-amber-500/30',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 140]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const reports = useCounter(12480);
  const rate = useCounter(98);
  const centers = useCounter(340);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setScrolled(v > 50));
    return unsub;
  }, [scrollY]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white selection:bg-emerald-200/60">

      {/* ══════════ NAVBAR ══════════ */}
      <motion.header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-stone-100 shadow-sm' : 'bg-transparent'}`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <Recycle className="h-5 w-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-emerald-400/30 blur-md group-hover:blur-lg transition-all" />
            </div>
            <span className={`font-display font-extrabold text-2xl tracking-tight ${scrolled ? 'text-brand-secondary' : 'text-white'}`}>
              Eco<span className="text-emerald-400">Build</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Platform', 'Features', 'Portals'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`text-sm font-semibold transition-colors ${scrolled ? 'text-stone-500 hover:text-emerald-600' : 'text-white/70 hover:text-white'}`}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/public-report')}
              className={`hidden md:block text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${scrolled ? 'text-stone-600 hover:text-emerald-600' : 'text-white/80 hover:text-white'}`}
            >
              Report Dumping
            </button>
            <button
              onClick={() => navigate('/company-portal')}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/35 hover:-translate-y-0.5"
            >
              Portal Login
            </button>
          </div>
        </div>
      </motion.header>

      {/* ══════════ HERO ══════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, hsl(160 70% 35% / 0.25) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(200 60% 25% / 0.3) 0%, transparent 50%)',
          }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
        </div>

        {/* Floating Particles */}
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

        {/* Animated orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[100px] pointer-events-none"
        />

        {/* Hero Content */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md text-emerald-300 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Powered by Gemini AI · Smart Waste Management
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 22 }}
            className="text-6xl md:text-7xl lg:text-8xl font-display font-extrabold text-white leading-[0.9] tracking-tight mb-8"
          >
            Building a{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent italic font-normal">
                greener
              </span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400 to-emerald-400/0 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              />
            </span>
            {' '}future,<br />
            <span className="text-white/60 font-light">one site at a time.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-12"
          >
            The smart nexus linking construction firms, public citizens, and recycling facilities. Report illegal dump sites or log professional waste instantly.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/public-report')}
              className="group relative bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-400/50 hover:-translate-y-1 transition-all"
            >
              <Leaf className="h-5 w-5" />
              Report Illegal Dumping
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/company-portal')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 hover:-translate-y-1 transition-all"
            >
              <Building2 className="h-5 w-5" />
              Company Login
            </button>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-20 flex flex-col items-center gap-2"
          >
            <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Scroll to explore</span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown className="h-5 w-5 text-white/30" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ STATS STRIP ══════════ */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-700 py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center text-white">
          {[
            { hook: reports, suffix: '+', label: 'Waste Reports Filed', icon: Send },
            { hook: rate, suffix: '%', label: 'Material Recycling Rate', icon: Recycle },
            { hook: centers, suffix: '+', label: 'Recycling Centers Enrolled', icon: Globe },
          ].map(({ hook, suffix, label, icon: Icon }) => (
            <motion.div
              key={label}
              ref={hook.ref as React.RefObject<HTMLDivElement>}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-2"
            >
              <Icon className="h-6 w-6 text-emerald-200/60 mb-1" />
              <div className="text-5xl md:text-6xl font-display font-black tracking-tight">
                {hook.count.toLocaleString()}{suffix}
              </div>
              <div className="text-emerald-100/70 text-sm font-bold uppercase tracking-widest">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ PORTAL CARDS ══════════ */}
      <section id="portals" className="py-24 px-6 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-5">
              <Zap className="h-3.5 w-3.5" /> Choose Your Portal
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-brand-secondary mb-4 leading-tight">
              One platform.<br />Three entry points.
            </h2>
            <p className="text-stone-400 max-w-lg mx-auto text-base">
              Whether you're a concerned citizen, construction manager, or recycling facility — there's a dedicated experience for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PORTALS.map((portal, i) => (
              <motion.div
                key={portal.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(portal.route)}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${portal.gradient} p-8 cursor-pointer group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ring-1 ${portal.ring}`}
              >
                {/* Background shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${portal.accent} border flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <portal.icon className="h-7 w-7 text-white" />
                </div>

                {/* Ghost icon */}
                <div className="absolute -bottom-8 -right-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <portal.icon className="h-48 w-48 text-white" />
                </div>

                <p className="text-white/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">{portal.label}</p>
                <h3 className="text-2xl font-display font-extrabold text-white mb-3">{portal.cta}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-8">{portal.desc}</p>

                <div className="flex items-center gap-2 text-white/80 text-sm font-bold group-hover:text-white group-hover:gap-3 transition-all">
                  {portal.cta} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Core Capabilities
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-brand-secondary mb-4">
              Engineered for<br />impact at every level
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`p-7 rounded-3xl ${f.bg} border ${f.border} hover:shadow-lg transition-all group`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-display font-bold text-brand-secondary mb-3">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ AI SHOWCASE ══════════ */}
      <section id="platform" className="py-24 px-6 bg-gradient-to-br from-slate-900 to-emerald-950 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 30% 70%, hsl(160 60% 40% / 0.3) 0%, transparent 50%)',
        }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Gemini Vision AI
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-6 leading-tight">
                AI that sees,<br />understands, and acts.
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-10">
                Just take a photo. Our Gemini-powered engine instantly classifies the waste type, estimates volume, assigns urgency, and triggers the nearest recycling center — all in seconds.
              </p>
              <div className="space-y-4">
                {[
                  'Automatic waste category identification',
                  'Volume and load estimation from photos',
                  'Priority routing to nearest facility',
                  'Real-time status updates & notifications',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-white/70 text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Card Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                {/* Scanning laser */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-800 mb-5">
                  <img
                    src="https://picsum.photos/seed/ecosite/800/450"
                    alt="AI scanning waste site"
                    className="w-full h-full object-cover opacity-50 grayscale"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  {/* Scanner UI overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-400/60 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-emerald-400 animate-pulse" />
                    </div>
                    <span className="text-emerald-300 text-sm font-bold animate-pulse">Analyzing waste type…</span>
                  </div>
                  {/* Moving scan line */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                {/* Results */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Category', value: 'Construction', color: 'text-emerald-400' },
                    { label: 'Urgency', value: 'High', color: 'text-red-400' },
                    { label: 'Volume Est.', value: '~4 tons', color: 'text-blue-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                      <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">{label}</div>
                      <div className={`text-sm font-bold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-5 -right-5 bg-emerald-500 text-white rounded-2xl px-4 py-2 text-xs font-bold shadow-xl shadow-emerald-500/40 flex items-center gap-2"
              >
                <Zap className="h-3.5 w-3.5" /> Gemini AI Powered
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-28 px-6 bg-white text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30">
            <Leaf className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-extrabold text-brand-secondary mb-6 leading-tight">
            Ready to make<br />a difference?
          </h2>
          <p className="text-stone-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Join thousands of citizens and companies already using EcoBuild to keep construction sites clean and communities healthy.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/public-report')}
              className="group bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl shadow-emerald-500/30 hover:-translate-y-1 hover:shadow-emerald-500/50 transition-all"
            >
              <Leaf className="h-5 w-5" />
              Report Now — It's Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/company-portal')}
              className="bg-stone-100 hover:bg-stone-200 text-brand-secondary px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all hover:-translate-y-1"
            >
              <Building2 className="h-5 w-5" /> Company Portal
            </button>
          </div>
        </motion.div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Recycle className="h-5 w-5 text-white" />
                </div>
                <span className="font-display font-extrabold text-xl">Eco<span className="text-emerald-400">Build</span></span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                Empowering sustainable construction through AI-powered waste management and community reporting.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-white/30 font-bold uppercase tracking-widest text-[10px] mb-4">Portals</p>
                <ul className="space-y-3">
                  <li><button onClick={() => navigate('/public-report')} className="text-white/60 hover:text-emerald-400 transition-colors font-medium">Public Report</button></li>
                  <li><button onClick={() => navigate('/company-portal')} className="text-white/60 hover:text-emerald-400 transition-colors font-medium">Company Portal</button></li>
                  <li><button onClick={() => navigate('/recycling-center')} className="text-white/60 hover:text-emerald-400 transition-colors font-medium">Recycling Center</button></li>
                </ul>
              </div>
              <div>
                <p className="text-white/30 font-bold uppercase tracking-widest text-[10px] mb-4">System</p>
                <ul className="space-y-3">
                  <li><button onClick={() => navigate('/super-admin')} className="text-white/60 hover:text-emerald-400 transition-colors font-medium">Super Admin</button></li>
                  <li><a href="#" className="text-white/60 hover:text-emerald-400 transition-colors font-medium">Privacy Policy</a></li>
                  <li><a href="#" className="text-white/60 hover:text-emerald-400 transition-colors font-medium">Terms of Service</a></li>
                </ul>
              </div>
              <div>
                <p className="text-white/30 font-bold uppercase tracking-widest text-[10px] mb-4">Contact</p>
                <ul className="space-y-3">
                  <li><a href="#" className="text-white/60 hover:text-emerald-400 transition-colors font-medium">Help Center</a></li>
                  <li><a href="#" className="text-white/60 hover:text-emerald-400 transition-colors font-medium">Contact Us</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">© 2026 EcoBuild. Empowering sustainable construction.</p>
            <div className="flex items-center gap-2 text-white/30 text-sm">
              <Sparkles className="h-4 w-4 text-emerald-500/60" />
              <span>Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
