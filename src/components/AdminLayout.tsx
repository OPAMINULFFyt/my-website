import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Shield, MessageSquare, Activity, Megaphone, Crown } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('admin_auth');
      toast.info('SESSION_TERMINATED');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', roles: ['owner', 'admin', 'developer'] },
    { label: 'Products', icon: Package, path: '/admin/products', roles: ['owner', 'admin', 'developer'] },
    { label: 'Orders', icon: ShoppingCart, path: '/admin/orders', roles: ['owner', 'admin'] },
    { label: 'Users', icon: Shield, path: '/admin/users', roles: ['owner', 'admin'] },
    { label: 'Reviews', icon: MessageSquare, path: '/admin/reviews', roles: ['owner', 'admin'] },
    { label: 'Announcements', icon: Megaphone, path: '/admin/announcements', roles: ['owner', 'admin'] },
    { label: 'System Logs', icon: Activity, path: '/admin/logs', roles: ['owner', 'admin', 'developer'] },
    { label: 'Settings', icon: Settings, path: '/admin/settings', roles: ['owner'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 px-4 md:px-6">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out shrink-0",
        isSidebarOpen ? "w-full md:w-64" : "w-0 overflow-hidden opacity-0 md:w-0"
      )}>
        <div className="cyber-card p-4 h-full">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-card-main border border-border-main overflow-hidden flex items-center justify-center relative group">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : profile?.role === 'owner' ? (
                  <Crown className="w-6 h-6 text-yellow-500" />
                ) : (
                  <Shield className="w-6 h-6 text-cyber-purple" />
                )}
                <div className="absolute inset-0 border border-cyber-purple opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h2 className="font-bold text-[10px] tracking-widest uppercase text-text-main">
                  {profile?.role === 'owner' ? 'OWNER_CONSOLE' : 'ADMIN_PANEL'}
                </h2>
                <p className="text-[8px] font-mono text-text-muted uppercase truncate max-w-[120px]">
                  {profile?.full_name || 'OPERATIVE'}
                </p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-2 rounded-r-lg",
                  location.pathname === item.path
                    ? "bg-cyber-purple/10 border-cyber-purple text-cyber-purple shadow-[inset_4px_0_10px_rgba(188,19,254,0.1)]"
                    : "border-transparent text-text-muted hover:text-text-main hover:bg-card-main"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all border-l-2 border-transparent mt-8 rounded-r-lg"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow space-y-6 min-w-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-card-main border border-border-main hover:border-cyber-purple transition-colors rounded-lg group"
              title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              <Activity className={cn("w-4 h-4 transition-transform", !isSidebarOpen && "rotate-180")} />
            </button>
            <h1 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3">
              <span className="w-2 h-8 bg-cyber-purple inline-block rounded-full" />
              {title}
            </h1>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
