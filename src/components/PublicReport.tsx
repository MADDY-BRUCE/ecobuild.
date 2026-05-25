import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, ShieldCheck, Send, User, Mail, Trash2, Loader2, AlertCircle, ArrowLeft, CheckCircle2, ArrowRight, Recycle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { identifyWaste } from '../services/geminiService';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function PublicReport() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState<'tons' | 'kg'>('tons');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low'>('low');
  const [submitted, setSubmitted] = useState(false);

  const WASTE_CATEGORIES = [
    "Plastic",
    "Metal",
    "Glass",
    "Paper & Cardboard",
    "Construction & Demolition",
    "Organic / Food",
    "Electronic (E-waste)",
    "Hazardous",
    "Textiles",
    "Other"
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

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
              address: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocation({
            lat: latitude,
            lng: longitude,
            address: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(`Unable to retrieve your location: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  const generatedOtpRef = useRef<string>('');

  const handleSendEmailOtp = async () => {
    if (!userData.email || !userData.name) {
      alert("Please enter your name and email address");
      return;
    }
    setLoading(true);
    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      generatedOtpRef.current = generatedOtp;

      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: "ECO_BUILD",
          template_id: "template_ju2lh7e",
          user_id: "xcxddgN0xLTLrhCOt",
          template_params: {
            to_email: userData.email,
            to_name: userData.name,
            otp_code: generatedOtp,
          },
        }),
      });

      if (response.ok) {
        setOtpSent(true);
        alert("A verification code has been sent to your email address.");
      } else {
        const text = await response.text();
        console.error("EmailJS error:", text);
        alert("Failed to send OTP. Please check EmailJS configuration.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      if (otp === generatedOtpRef.current) {
        setVerified(true);
        alert("OTP verified successfully");
      } else {
        alert("Invalid OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log("Submitting report...", { image: !!image, location: !!location, verified });
    if (!location || !verified || !category || !amount) {
      alert("Missing required information. Please ensure email is verified, category is selected, and amount is entered.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: 'public-user',
        type: 'illegal',
        category,
        urgency,
        amount: amount ? parseFloat(amount) : null,
        unit: amount ? unit : null,
        location,
        imageUrl: image,
        timestamp: serverTimestamp(),
        status: 'pending',
        reporterDetails: userData
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 relative">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-brand-primary rounded-full blur-[120px]"
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="group mb-12 text-stone-400 hover:text-brand-secondary flex items-center transition-all font-bold text-sm uppercase tracking-widest"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bento-card bg-brand-primary text-white">
              <AlertCircle className="h-10 w-10 mb-6 opacity-50" />
              <h1 className="text-3xl font-display font-bold leading-tight mb-4">Report Illegal Dumping</h1>
              <p className="text-emerald-100/70 text-sm leading-relaxed">
                Help us keep our environment clean by reporting unauthorized waste disposal sites.
              </p>
            </div>
            
            <div className="bento-card bg-white">
              <div className="space-y-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                      step === s ? "bg-brand-primary text-white scale-110" : 
                      step > s ? "bg-emerald-100 text-brand-primary" : "bg-stone-100 text-stone-400"
                    )}>
                      {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                    </div>
                    <span className={cn(
                      "text-sm font-bold uppercase tracking-wider",
                      step === s ? "text-brand-secondary" : "text-stone-400"
                    )}>
                      {s === 1 ? 'Verification' : s === 2 ? 'Waste Details' : 'Location'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-8">
            <div className="bento-card bg-white min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 flex flex-col"
                  >
                    <h2 className="text-2xl font-bold mb-8">Identity Verification</h2>
                    <div className="space-y-6 flex-1">
                      {/* User Info Section */}
                      <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-6">
                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                            <input 
                              type="text"
                              placeholder="Enter your name"
                              disabled={verified}
                              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-brand-primary outline-none transition-all disabled:bg-stone-100"
                              value={userData.name}
                              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                            <input 
                              type="email"
                              placeholder="name@example.com"
                              disabled={verified}
                              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-brand-primary outline-none transition-all disabled:bg-stone-100"
                              value={userData.email}
                              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                            />
                          </div>
                        </div>

                        {!verified && (
                          <div className="pt-4 space-y-6">
                            {!otpSent ? (
                              <button 
                                onClick={handleSendEmailOtp}
                                disabled={loading || !userData.name || !userData.email}
                                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold hover:bg-brand-primary/90 transition-all art-shadow flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {loading ? <Loader2 className="animate-spin" /> : "Send OTP to Email"}
                              </button>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <ShieldCheck className="h-5 w-5 text-brand-primary" />
                                  <h3 className="font-bold text-brand-secondary">Enter Verification Code</h3>
                                </div>
                                <input 
                                  type="text"
                                  maxLength={6}
                                  placeholder="000000"
                                  className="w-full px-6 py-4 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-brand-primary outline-none transition-all font-mono text-center text-2xl tracking-[0.5em]"
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value)}
                                />
                                <button 
                                  onClick={handleVerifyEmailOtp}
                                  disabled={loading || otp.length !== 6}
                                  className="w-full bg-brand-secondary text-white py-4 rounded-2xl font-bold hover:bg-brand-primary transition-all art-shadow flex items-center justify-center gap-2"
                                >
                                  {loading ? <Loader2 className="animate-spin" /> : "Verify OTP"}
                                </button>
                                <button 
                                  onClick={handleSendEmailOtp}
                                  className="w-full text-xs font-bold text-stone-400 hover:text-brand-primary transition-colors uppercase tracking-widest"
                                >
                                  Resend OTP
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {verified && (
                          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            <span className="text-emerald-700 font-bold text-sm">Identity Verified via Gmail</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      disabled={!verified}
                      onClick={() => setStep(2)}
                      className="w-full bg-brand-secondary text-white py-5 rounded-2xl font-bold hover:bg-brand-primary disabled:opacity-20 transition-all mt-12 flex items-center justify-center gap-2"
                    >
                      Continue to Waste Details <ArrowRight className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 flex flex-col"
                  >
                    <h2 className="text-2xl font-bold mb-8">Waste Documentation</h2>
                    
                    <div className="space-y-8 flex-1">
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
                            <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">Capture or Upload Photo</span>
                          </>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        {loading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="animate-spin h-10 w-10 text-brand-primary" />
                          </div>
                        )}
                      </div>

                      {category && (
                        <div className="p-6 bg-brand-primary/5 rounded-3xl border border-brand-primary/10 flex items-center justify-between">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-1">AI Suggestion</label>
                            <div className="text-2xl font-display font-bold text-brand-secondary">{category}</div>
                          </div>
                          <div className="bg-brand-primary/10 p-3 rounded-2xl">
                            <Recycle className="h-6 w-6 text-brand-primary" />
                          </div>
                        </div>
                      )}

                      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Select Category Manually</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {WASTE_CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setCategory(cat)}
                              className={cn(
                                "px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                                category === cat 
                                  ? "bg-brand-secondary text-white border-brand-secondary art-shadow" 
                                  : "bg-white text-stone-500 border-stone-100 hover:border-brand-primary/30"
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Urgency Level</label>
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

                      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Estimated Amount</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="number"
                            placeholder="0.00"
                            className="flex-1 bg-transparent border-none focus:ring-0 text-xl font-display font-bold text-brand-secondary placeholder:text-stone-300"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                          />
                          <select 
                            className="bg-white border border-stone-100 rounded-xl px-4 py-2 text-sm font-bold text-brand-secondary outline-none"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value as 'tons' | 'kg')}
                          >
                            <option value="tons">Tons</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-12">
                      <button onClick={() => setStep(1)} className="flex-1 bg-stone-100 text-stone-600 py-5 rounded-2xl font-bold hover:bg-stone-200 transition-all">Back</button>
                      <button 
                        disabled={!category || !amount}
                        onClick={() => setStep(3)}
                        className="flex-1 bg-brand-secondary text-white py-5 rounded-2xl font-bold hover:bg-brand-primary disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                      >
                        Continue to Location <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && !submitted && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 flex flex-col"
                  >
                    <h2 className="text-2xl font-bold mb-8">Pinpoint Location</h2>
                    
                    <div className="space-y-8 flex-1">
                      <button 
                        onClick={handleGetLocation}
                        className="w-full flex items-center justify-center p-6 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-primary/90 transition-all art-shadow gap-3"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : <MapPin className="h-6 w-6" />}
                        Auto-Detect GPS Location
                      </button>

                      <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100">
                        <div className="flex justify-between items-center mb-4">
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Location Details</label>
                          {location?.lat !== 0 && (
                            <a 
                              href={`https://www.google.com/maps?q=${location?.lat},${location?.lng}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-1"
                            >
                              <MapPin className="h-3 w-3" /> View on Map
                            </a>
                          )}
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-0 top-0 h-6 w-6 text-brand-primary" />
                          <textarea 
                            placeholder="Describe the pinpoint location..."
                            className="w-full pl-10 bg-transparent border-none focus:ring-0 text-xl font-display font-medium h-32 resize-none placeholder:text-stone-300"
                            value={location?.address || ''}
                            onChange={(e) => setLocation(prev => prev ? { ...prev, address: e.target.value } : { lat: 0, lng: 0, address: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-12">
                      <button onClick={() => setStep(2)} className="flex-1 bg-stone-100 text-stone-600 py-5 rounded-2xl font-bold hover:bg-stone-200 transition-all">Back</button>
                      <button 
                        disabled={!location || loading}
                        onClick={handleSubmit}
                        className="flex-1 bg-brand-primary text-white py-5 rounded-2xl font-bold hover:bg-brand-primary/90 disabled:opacity-20 transition-all flex items-center justify-center gap-2 art-shadow"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : <><Send className="h-5 w-5" /> Submit Final Report</>}
                      </button>
                    </div>
                  </motion.div>
                )}

                {submitted && (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center py-12"
                  >
                    <div className="bg-emerald-100 p-8 rounded-[3rem] mb-8">
                      <CheckCircle2 className="h-20 w-20 text-emerald-600" />
                    </div>
                    <h2 className="text-4xl font-display font-bold text-brand-secondary mb-4">Report Submitted!</h2>
                    <p className="text-stone-400 font-medium max-w-sm mb-12">
                      Thank you for your contribution. Our team will verify the location and dispatch a recycling unit shortly.
                    </p>
                    <div className="flex flex-col w-full gap-4">
                      <button 
                        onClick={() => navigate('/')}
                        className="w-full bg-brand-secondary text-white py-5 rounded-2xl font-bold hover:bg-brand-primary transition-all art-shadow"
                      >
                        Return to Dashboard
                      </button>
                      <button 
                        onClick={() => {
                          setSubmitted(false);
                          setStep(1);
                          setImage(null);
                          setCategory('');
                          setAmount('');
                          setLocation(null);
                          setVerified(false);
                          setUserData({ name: '', email: '' });
                        }}
                        className="w-full bg-stone-100 text-stone-600 py-5 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                      >
                        Submit Another Report
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
