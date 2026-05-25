import { useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, Send, LogOut, Loader2, HardHat, Camera, CheckCircle } from 'lucide-react';
import { identifyWaste } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

export default function LaborDashboard({ profile }: { profile: UserProfile | null }) {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState<'tons' | 'kg'>('tons');
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low'>('low');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => signOut(auth);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      const identifiedCategory = await identifyWaste(base64);
      setCategory(identifiedCategory);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Location detected with accuracy: ${accuracy} meters`);

        setLocation({
          lat: latitude,
          lng: longitude,
          address: "Identifying pinpoint location..."
        });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'EcoBuild-Waste-Management-App'
              }
            }
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            const addressParts = data.display_name.split(',');
            const pinpointName = addressParts.slice(0, 3).join(',').trim();
            setLocation({
              lat: latitude,
              lng: longitude,
              address: pinpointName || data.display_name
            });
          } else {
            setLocation({
              lat: latitude,
              lng: longitude,
              address: `Site at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocation({
            lat: latitude,
            lng: longitude,
            address: `Site at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(`Unable to retrieve location: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
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

  return (
    <div className="min-h-screen relative">
      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-accent/10 rounded-full blur-[100px]"
        />
      </div>

      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-brand-secondary p-2 rounded-xl">
            <HardHat className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tight leading-tight">EcoBuild <span className="text-brand-primary italic">Labor</span></span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">{auth.currentUser?.email}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-white p-3 rounded-2xl text-stone-400 hover:text-red-500 transition-all art-shadow border border-stone-100"
        >
          <LogOut className="h-6 w-6" />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Status & Info */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bento-card bg-brand-secondary text-white"
            >
              <HardHat className="h-10 w-10 mb-6 text-brand-primary" />
              <h1 className="text-3xl font-display font-bold leading-tight mb-4">Site Disposal Log</h1>
              <p className="text-stone-400 text-sm leading-relaxed">
                Quickly document and categorize construction waste for professional recycling pickup.
              </p>
            </motion.div>

            <div className="bento-card bg-white">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Site Status</div>
              <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="text-sm font-bold text-stone-600 uppercase tracking-wider">Active Site Connection</div>
              </div>
            </div>
          </div>

          {/* Right Column: Reporting Form */}
          <div className="lg:col-span-8">
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className="mb-6 p-6 bg-emerald-500 text-white rounded-3xl art-shadow flex items-center gap-4 border border-emerald-400"
                >
                  <div className="bg-white/20 p-2 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-display font-bold text-lg">Your report has been successfully submitted</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bento-card bg-white"
            >
              <div className="space-y-8">
                {/* Image Capture */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-all overflow-hidden relative group"
                >
                  {image ? (
                    <img src={image} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="bg-white p-6 rounded-3xl art-shadow mb-4 group-hover:scale-110 transition-transform">
                        <Camera className="h-10 w-10 text-brand-primary" />
                      </div>
                      <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">Take Photo of Waste</span>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  {loading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin h-10 w-10 text-brand-primary" />
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Waste Category</label>
                    <select 
                      className="w-full bg-transparent border-none focus:ring-0 text-xl font-display font-bold text-brand-secondary appearance-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      <option value="Concrete">Concrete</option>
                      <option value="Metal">Metal</option>
                      <option value="Wood">Wood</option>
                      <option value="Plastic">Plastic</option>
                      <option value="Hazardous">Hazardous</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Amount</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        placeholder="0.00"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-xl font-display font-bold text-brand-secondary placeholder:text-stone-300"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <select 
                        className="bg-white border border-stone-100 rounded-xl px-2 py-1 text-xs font-bold text-brand-secondary outline-none"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as 'tons' | 'kg')}
                      >
                        <option value="tons">Tons</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Urgency Level</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setUrgency('high')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        urgency === 'high' ? "bg-red-500 text-white border-red-600 art-shadow" : "bg-white text-stone-500 border-stone-100"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded-full bg-red-500", urgency === 'high' && "ring-2 ring-white")} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">High</span>
                    </button>
                    <button
                      onClick={() => setUrgency('medium')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        urgency === 'medium' ? "bg-amber-500 text-white border-amber-600 art-shadow" : "bg-white text-stone-500 border-stone-100"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded-full bg-amber-500", urgency === 'medium' && "ring-2 ring-white")} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Medium</span>
                    </button>
                    <button
                      onClick={() => setUrgency('low')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        urgency === 'low' ? "bg-stone-100 text-stone-600 border-stone-200 art-shadow" : "bg-white text-stone-500 border-stone-100"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded-full bg-white border border-stone-300", urgency === 'low' && "ring-2 ring-stone-400")} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Low</span>
                    </button>
                  </div>
                </div>

                {/* Location Detection */}
                <div className="space-y-4">
                  <button 
                    onClick={handleGetLocation}
                    className="w-full flex items-center justify-center p-6 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-primary/90 transition-all art-shadow gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <MapPin className="h-6 w-6" />}
                    {location ? "Location Verified" : "Verify Site Location (GPS)"}
                  </button>
                  {location && (
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="bg-emerald-500 text-white p-2 rounded-xl">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="text-emerald-800 font-bold text-sm">Verified Site Location</div>
                        </div>
                        <a 
                          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" /> View on Map
                        </a>
                      </div>
                      <textarea 
                        className="w-full bg-transparent border-none focus:ring-0 text-stone-600 font-medium text-sm p-0 resize-none h-20"
                        value={location.address}
                        onChange={(e) => setLocation(prev => prev ? { ...prev, address: e.target.value } : null)}
                        placeholder="Refine address if needed..."
                      />
                    </div>
                  )}
                </div>

                <button 
                  disabled={loading || !category || !amount || !location}
                  onClick={handleSubmit}
                  className="w-full bg-brand-secondary text-white py-6 rounded-2xl font-bold hover:bg-brand-primary disabled:opacity-20 transition-all flex items-center justify-center gap-3 art-shadow text-lg"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Send className="h-6 w-6" /> Submit Disposal Log</>}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Floating Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: "-50%" }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 z-50 p-6 bg-emerald-600 text-white rounded-3xl shadow-2xl flex items-center gap-4 border border-emerald-400 max-w-md w-[calc(100%-2rem)]"
          >
            <div className="bg-white/20 p-2.5 rounded-2xl shrink-0">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-base leading-tight">Your report has been successfully submitted</p>
              <p className="text-xs text-white/85 mt-0.5 font-medium">EcoBuild site managers have been notified.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
