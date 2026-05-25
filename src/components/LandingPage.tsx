import { useNavigate } from 'react-router-dom';
import { Truck, AlertCircle, Building, ArrowRight, Leaf, ShieldCheck, Recycle } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen selection:bg-brand-primary/20">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-screen pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full border-[100px] border-brand-primary/5 rounded-full blur-2xl"
        />
      </div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-brand-primary p-2 rounded-xl">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">EcoBuild</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-500">
          <a href="#" className="hover:text-brand-primary transition-colors">How it works</a>
          <a href="#" className="hover:text-brand-primary transition-colors">Impact</a>
          <a href="#" className="hover:text-brand-primary transition-colors">Centers</a>
        </div>
        <button 
          onClick={() => navigate('/company-portal')}
          className="bg-brand-secondary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-brand-primary transition-all art-shadow"
        >
          Portal Login
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 bento-card flex flex-col justify-center relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
              <Recycle className="h-64 w-64 text-brand-primary" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-brand-primary px-4 py-2 rounded-full text-xs font-bold mb-6">
                <Leaf className="h-3 w-3" />
                SUSTAINABLE WASTE SOLUTIONS
              </div>
              <h1 className="text-6xl md:text-7xl font-display font-bold leading-[0.9] mb-8 text-balance">
                Building a <span className="text-brand-primary italic">greener</span> future, one site at a time.
              </h1>
              <p className="text-xl text-stone-500 max-w-xl mb-10 leading-relaxed">
                The intelligent bridge between construction sites, the public, and recycling centers. 
                Report, identify, and dispose of waste with AI precision.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate('/public-report')}
                  className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-primary/90 transition-all flex items-center gap-2 art-shadow"
                >
                  Report Illegal Dumping <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Side Bento Cards */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bento-card bg-brand-secondary text-white flex-1 relative overflow-hidden group"
            >
              <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Building className="h-48 w-48" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Company Portal</h3>
              <p className="text-stone-400 text-sm mb-8 leading-relaxed">
                Professional-grade tools for construction companies to manage waste logs and site compliance.
              </p>
              <button 
                onClick={() => navigate('/company-portal')}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-white hover:text-brand-secondary transition-all"
              >
                Access Portal
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bento-card bg-amber-50 border-amber-100 flex-1"
            >
              <div className="bg-amber-500/10 p-3 rounded-xl w-fit mb-6">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-amber-900 mb-2">Verified Reporting</h3>
              <p className="text-amber-700/70 text-sm">
                Every report is strictly verified to ensure genuine environmental impact and accountability.
              </p>
            </motion.div>
          </div>

          {/* Bottom Bento Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 bento-card bg-stone-900 text-stone-400"
          >
            <div className="text-4xl font-display font-bold text-white mb-2">98%</div>
            <div className="text-sm uppercase tracking-widest font-bold text-brand-primary mb-4">Recycling Rate</div>
            <p className="text-sm leading-relaxed">
              Our network ensures that almost all reported waste reaches authorized recycling centers.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-8 bento-card flex items-center justify-between gap-8 bg-white"
          >
            <div className="max-w-md">
              <h3 className="text-2xl font-bold mb-4">AI Waste Identification</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Using advanced Gemini AI to instantly categorize waste from photos, ensuring correct disposal protocols.
              </p>
            </div>
            <div className="hidden md:block w-48 h-32 bg-stone-50 rounded-2xl border border-stone-100 flex-shrink-0 relative overflow-hidden">
              <img 
                src="https://picsum.photos/seed/waste/400/300" 
                alt="AI Scan"
                className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 border-2 border-brand-primary/30 rounded-2xl animate-pulse"></div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-stone-200 mt-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2 opacity-50">
          <Truck className="h-5 w-5" />
          <span className="font-display font-bold tracking-tight">EcoBuild</span>
        </div>
        <div className="flex gap-8 text-sm text-stone-400">
          <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-brand-primary transition-colors">Contact Us</a>
        </div>
        <div className="text-stone-400 text-sm">
          © 2026 EcoBuild. Empowering sustainable construction.
        </div>
      </footer>
    </div>
  );
}
