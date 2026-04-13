import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, User, Shield, MoreVertical, X, ShoppingBag, Zap, BookOpen, FileCode, Cpu, Trophy, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Badge from './Badge';
import { useTheme } from '../context/ThemeContext';

const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    name: 'OP AMINUL FF',
    logo: ''
  });

  React.useEffect(() => {
    const fetchSiteSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
        setSiteSettings({
          name: settingsMap.site_name || 'OP AMINUL FF',
          logo: settingsMap.site_logo || ''
        });
      }
    };
    fetchSiteSettings();
  }, []);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const setFilter = (category: string) => {
    if (category === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
    navigate('/' + (category === 'all' ? '' : `?category=${category}`));
    setIsMobileMenuOpen(false);
  };

  const categories = [
    { id: 'all', label: 'All Assets', icon: Zap },
    { id: 'course', label: 'Courses', icon: BookOpen },
    { id: 'file', label: 'Project Files', icon: FileCode },
    { id: 'hardware', label: 'Hardware Kits', icon: Cpu },
  ];

  return (
    <nav className="border-b border-border-main bg-card-main sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle (Left Side) */}
          <button 
            onClick={toggleMenu}
            className="md:hidden p-2 text-cyber-purple hover:bg-cyber-purple/10 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MoreVertical className="w-6 h-6" />}
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="w-8 h-8 bg-cyber-purple flex items-center justify-center rounded-lg group-hover:shadow-[0_0_15px_rgba(188,19,254,0.8)] transition-all overflow-hidden"
            >
              {siteSettings.logo ? (
                <img src={siteSettings.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Shield className="w-5 h-5 text-white" />
              )}
            </motion.div>
            <span className="font-mono font-bold text-xl tracking-tighter text-text-main group-hover:text-cyber-purple transition-colors">
              {siteSettings.name.split(' ').slice(0, -1).join(' ')} <span className="text-cyber-purple">{siteSettings.name.split(' ').slice(-1)}</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-text-main hover:text-cyber-purple transition-colors uppercase tracking-widest relative group/link">
              Marketplace
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyber-purple transition-all group-hover/link:w-full" />
            </Link>
            
            <Link to="/leaderboard" className="text-sm font-medium text-text-main hover:text-cyber-purple transition-colors uppercase tracking-widest flex items-center gap-2 relative group/link">
              <Trophy className="w-4 h-4" />
              Ranking
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyber-purple transition-all group-hover/link:w-full" />
            </Link>

            {/* Theme Toggle */}
            <div className="flex items-center gap-1 p-1 bg-card-main border border-border-main rounded-full">
              <button 
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-cyber-purple text-white shadow-[0_0_10px_rgba(188,19,254,0.5)]' : 'text-text-muted hover:text-text-main'}`}
                title="Light Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-cyber-purple text-white shadow-[0_0_10px_rgba(188,19,254,0.5)]' : 'text-text-muted hover:text-text-main'}`}
                title="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-full transition-all ${theme === 'system' ? 'bg-cyber-purple text-white shadow-[0_0_10px_rgba(188,19,254,0.5)]' : 'text-text-muted hover:text-text-main'}`}
                title="System Preference"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 text-sm text-text-main hover:text-cyber-purple transition-colors">
                  <User className="w-4 h-4" />
                  <span>{profile?.full_name || 'Complete Profile'}</span>
                  {profile && <Badge role={profile.role} showIcon={false} className="scale-75 origin-left" />}
                </Link>
                <button 
                  onClick={() => { signOut(); navigate('/'); }}
                  className="p-2 text-text-muted hover:text-cyber-purple transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/auth"
                className="cyber-button flex items-center gap-2 text-xs"
              >
                <LogIn className="w-4 h-4" />
                Connect System
              </Link>
            )}

            {user && (profile?.role === 'admin' || profile?.role === 'developer' || profile?.role === 'owner') && (
              <Link to="/admin" className="p-2 text-text-muted hover:text-cyber-purple transition-colors" title="Admin Panel">
                <Shield className="w-5 h-5" />
              </Link>
            )}
          </div>

          {/* User Icon for Mobile (Right Side) */}
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-cyber-purple"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            {user ? (
              <Link to="/profile" className="p-2 text-cyber-purple">
                <User className="w-6 h-6" />
              </Link>
            ) : (
              <Link to="/auth" className="p-2 text-cyber-purple">
                <LogIn className="w-6 h-6" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="md:hidden fixed inset-y-0 left-0 w-64 bg-card-main border-r border-border-main z-[60] shadow-[10px_0_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-between items-center mb-8">
                <span className="font-mono font-bold text-cyber-purple">SYSTEM_MENU</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-text-muted">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`w-full flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${
                          (searchParams.get('category') || 'all') === cat.id
                            ? 'bg-cyber-purple/20 text-cyber-purple border-l-2 border-cyber-purple'
                            : 'text-text-muted hover:bg-card-main'
                        }`}
                      >
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border-main">
                  <h3 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-4">Community</h3>
                  <div className="space-y-2">
                    <Link 
                      to="/leaderboard" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-widest text-text-muted hover:bg-card-main rounded-lg"
                    >
                      <Trophy className="w-4 h-4" />
                      Leaderboard
                    </Link>
                  </div>
                </div>

                <div className="pt-6 border-t border-border-main">
                  <h3 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-4">Account</h3>
                  <div className="space-y-2">
                    <Link 
                      to="/profile" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-widest text-text-muted hover:bg-card-main rounded-lg"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    {(profile?.role === 'admin' || profile?.role === 'developer' || profile?.role === 'owner') && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-widest text-text-muted hover:bg-card-main rounded-lg"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    {user && (
                      <button 
                        onClick={() => { signOut(); navigate('/'); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
          />
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;


