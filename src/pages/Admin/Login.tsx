import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || '11@@11';
    
    if (password === adminPass) {
      localStorage.setItem('admin_auth', 'true');
      toast.success('ACCESS_GRANTED: Welcome Admin');
      navigate('/admin');
    } else {
      toast.error('ACCESS_DENIED: Invalid Credentials');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="cyber-card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cyber-purple/20 border border-cyber-purple flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(188,19,254,0.3)]">
            <Shield className="w-8 h-8 text-cyber-purple" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase text-text-main">ADMIN_OVERRIDE</h1>
          <p className="text-text-muted opacity-40 text-xs font-mono mt-2">RESTRICTED_AREA: AUTHORIZATION_REQUIRED</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-muted opacity-50 uppercase">System Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
              <input 
                type="password" 
                required
                className="cyber-input pl-10 bg-card-main border-border-main"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="cyber-button w-full flex items-center justify-center gap-2">
            INITIALIZE_SESSION
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
