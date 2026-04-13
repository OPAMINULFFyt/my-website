import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield, Mail, Lock, User, Phone, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [configError, setConfigError] = useState<string | null>(null);
  const [projectRef, setProjectRef] = useState<string>('');

  useEffect(() => {
    const checkConfig = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (url) {
        try {
          const ref = new URL(url).hostname.split('.')[0];
          setProjectRef(ref);
        } catch (e) {
          setProjectRef('INVALID_URL');
        }
      }

      if (!url || !key || url.includes('YOUR_') || key.includes('YOUR_')) {
        setConfigError('Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Settings.');
      }
    };
    // ... rest of useEffect

    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('settings').select('key').limit(1);
        if (error) throw error;
        setConnectionStatus('ok');
      } catch (err: any) {
        console.error('Supabase Connection Failed:', err);
        // If it's a 401 or 403, it might just be RLS, which is fine for connection check
        if (err.code === 'PGRST301' || err.status === 401 || err.status === 403) {
          setConnectionStatus('ok');
        } else {
          setConnectionStatus('error');
        }
      }
    };
    
    checkConfig();
    checkConnection();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (configError) {
      return toast.error(configError);
    }

    if (connectionStatus === 'error') {
      return toast.error('DATABASE_OFFLINE: Could not connect to Supabase. Check your URL.');
    }

    if (!isLogin && password !== confirmPassword) {
      return toast.error('Passwords do not match!');
    }

    if (!isLogin && password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      console.log(`Attempting ${isLogin ? 'Login' : 'Registration'} for:`, email);
      
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('Login Error:', error);
          if (error.message.includes('Email not confirmed')) {
            throw new Error('ACCESS_DENIED: Email verification pending. Please check your inbox.');
          }
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('AUTH_FAILURE: Invalid email or password. Check your credentials.');
          }
          throw error;
        }

        if (data.user) {
          console.log('Login Success:', data.user.id);
          toast.success('System access granted. Welcome back.');
          navigate(from, { replace: true });
        }
      } else {
        // Sign up with metadata for the trigger
        console.log('Sending Registration Data:', { fullName, phone, address });
        const referredByCode = sessionStorage.getItem('referred_by_code');
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              address: address,
              referred_by: referredByCode || null
            }
          }
        });

        if (signUpError) {
          console.error('Registration Error:', signUpError);
          throw signUpError;
        }

        if (data.user) {
          console.log('Registration Success:', data.user.id);
          // If confirmation is disabled, session will be present
          if (data.session) {
            toast.success('Identity created. System access authorized.');
            setTimeout(() => navigate(from, { replace: true }), 500);
          } else {
            toast.success('Identity registered. Please check your email to verify your account.');
            setIsLogin(true);
            setPassword('');
            setConfirmPassword('');
          }
        }
      }
    } catch (error: any) {
      console.error('Auth Process Failed:', error);
      toast.error(error.message || 'CRITICAL_AUTH_ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-cyber-purple/10 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-cyber-purple/10 rounded-full blur-[100px] -z-10 animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="cyber-card max-w-lg w-full p-10 relative border-cyber-purple/30 bg-cyber-black/80 backdrop-blur-md"
      >
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-purple" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-purple" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-purple" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-purple" />
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-purple/10 border border-cyber-purple/40 mb-6 relative group">
            <div className="absolute inset-0 bg-cyber-purple/20 scale-0 group-hover:scale-100 transition-transform duration-500" />
            <Shield className="w-10 h-10 text-cyber-purple relative z-10 animate-pulse" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-2 italic">
            {isLogin ? 'AUTH_LOGIN' : 'REG_IDENTITY'}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-cyber-purple/50" />
            <p className="text-[10px] font-mono text-cyber-purple uppercase tracking-[0.4em]">
              {isLogin ? 'Secure_Access_Protocol' : 'New_User_Initialization'}
            </p>
            <div className="h-px w-8 bg-cyber-purple/50" />
          </div>
          
          {/* Connection Status Indicator */}
          <div className="mt-4 flex flex-col items-center justify-center gap-2 text-[8px] font-mono uppercase">
            <div className="flex items-center gap-2">
              <span className="text-text-muted opacity-20">DB_STATUS:</span>
              {connectionStatus === 'checking' && <span className="text-yellow-500 animate-pulse">CONNECTING...</span>}
              {connectionStatus === 'ok' && <span className="text-green-500">ONLINE</span>}
              {connectionStatus === 'error' && <span className="text-red-500">OFFLINE</span>}
              <span className="text-text-muted opacity-20 ml-2">REF:</span>
              <span className="text-cyber-purple">{projectRef}</span>
            </div>
            {configError && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 text-red-500 text-center leading-tight max-w-[250px]">
                {configError}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden pb-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className="block text-[9px] font-mono text-text-muted opacity-40 uppercase mb-1 ml-1">Full_Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                      <input 
                        type="text"
                        placeholder="ADMIN_NAME"
                        required={!isLogin}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="cyber-input pl-10 h-12 bg-white/5 border-border-main focus:border-cyber-purple/50 text-text-main"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-[9px] font-mono text-text-muted opacity-40 uppercase mb-1 ml-1">Contact_Node</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                      <input 
                        type="tel"
                        placeholder="+880..."
                        required={!isLogin}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="cyber-input pl-10 h-12 bg-white/5 border-border-main focus:border-cyber-purple/50 text-text-main"
                      />
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-[9px] font-mono text-text-muted opacity-40 uppercase mb-1 ml-1">Physical_Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                    <input 
                      type="text"
                      placeholder="SECTOR_X_STREET_Y"
                      required={!isLogin}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="cyber-input pl-10 h-12 bg-white/5 border-border-main focus:border-cyber-purple/50 text-text-main"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <label className="block text-[9px] font-mono text-text-muted opacity-40 uppercase mb-1 ml-1">Email_Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
              <input 
                type="email"
                placeholder="USER@NETWORK.COM"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cyber-input pl-10 h-12 bg-white/5 border-border-main focus:border-cyber-purple/50 text-text-main"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="relative">
              <label className="block text-[9px] font-mono text-text-muted opacity-40 uppercase mb-1 ml-1">Access_Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                <input 
                  type="password"
                  placeholder="********"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input pl-10 h-12 bg-white/5 border-border-main focus:border-cyber-purple/50 text-text-main"
                />
              </div>
            </div>
            {!isLogin && (
              <div className="relative">
                <label className="block text-[9px] font-mono text-text-muted opacity-40 uppercase mb-1 ml-1">Verify_Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                  <input 
                    type="password"
                    placeholder="********"
                    required={!isLogin}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="cyber-input pl-10 h-12 bg-white/5 border-border-main focus:border-cyber-purple/50 text-text-main"
                  />
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="cyber-button w-full h-14 flex items-center justify-center gap-3 group relative overflow-hidden mt-4"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span className="font-bold tracking-[0.2em]">
                  {isLogin ? 'AUTHORIZE_ACCESS' : 'INITIALIZE_IDENTITY'}
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-[10px] font-mono text-text-muted opacity-30 hover:text-cyber-purple uppercase tracking-[0.2em] transition-all hover:tracking-[0.3em]"
          >
            {isLogin ? "No identity detected? Create_New_Profile" : "Identity exists? Access_System_Core"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
