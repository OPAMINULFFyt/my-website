import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Package, ShoppingCart, Users, TrendingUp, Activity, Shield, AlertCircle, CheckCircle2, ShieldCheck, Crown, Zap } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    totalUsers: 0,
    revenue: 0,
    totalReviews: 0,
    activeAnnouncements: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Basic Stats
      const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: reviewsCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
      const { count: activeAnnouncements } = await supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('is_active', true);
      
      const { data: approvedOrders } = await supabase
        .from('orders')
        .select('created_at, products:product_id(price, category)')
        .eq('status', 'approved');
      
      const revenue = approvedOrders?.reduce((acc, curr: any) => acc + (curr.products?.price || 0), 0) || 0;

      setStats({
        totalProducts: productsCount || 0,
        pendingOrders: pendingCount || 0,
        totalUsers: usersCount || 0,
        revenue,
        totalReviews: reviewsCount || 0,
        activeAnnouncements: activeAnnouncements || 0
      });

      // Process Chart Data (Revenue over time)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const dailyRevenue = last7Days.map(date => {
        const dayTotal = approvedOrders?.filter(o => o.created_at.startsWith(date))
          .reduce((acc, curr: any) => acc + (curr.products?.price || 0), 0) || 0;
        return { name: date.split('-').slice(1).join('/'), revenue: dayTotal };
      });
      setChartData(dailyRevenue);

      // Category Distribution
      const categories = ['course', 'file', 'hardware'];
      const catStats = categories.map(cat => ({
        name: cat.toUpperCase(),
        value: approvedOrders?.filter(o => (o.products as any)?.category === cat).length || 0
      }));
      setCategoryData(catStats);

      // Recent Logs
      const { data: logs } = await supabase
        .from('system_logs')
        .select('*, profiles:admin_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentLogs(logs || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'TOTAL_PRODUCTS', value: stats.totalProducts, icon: Package, color: 'text-blue-500', trend: '+12%' },
    { label: 'PENDING_ORDERS', value: stats.pendingOrders, icon: ShoppingCart, color: 'text-yellow-500', trend: 'ACTION_REQ' },
    { label: 'TOTAL_USERS', value: stats.totalUsers, icon: Users, color: 'text-cyber-purple', trend: '+5%' },
    { label: 'TOTAL_REVENUE', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-green-500', trend: '+24%' },
  ];

  const COLORS = ['#bc13fe', '#3b82f6', '#eab308', '#ef4444'];

  return (
    <AdminDashboardLayout title="DASHBOARD_OVERVIEW">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="cyber-card group hover:border-cyber-purple/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 bg-card-main border border-border-main rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono text-cyber-purple bg-cyber-purple/10 px-2 border border-cyber-purple/20">
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-mono text-text-muted uppercase mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold tracking-tighter text-text-main">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 cyber-card">
          <div className="flex justify-between items-center mb-8 border-b border-border-main pb-4">
            <h3 className="text-sm font-bold uppercase flex items-center gap-2 text-text-main">
              <Activity className="w-4 h-4 text-cyber-purple" />
              Revenue_Stream_Analysis
            </h3>
            <span className="text-[10px] font-mono text-text-muted">LAST_7_DAYS</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#bc13fe" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#bc13fe" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border-main opacity-20" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="currentColor" 
                  className="text-text-muted opacity-40"
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="currentColor" 
                  className="text-text-muted opacity-40"
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `৳${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '0' }}
                  itemStyle={{ color: '#bc13fe', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#bc13fe" 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cyber-card">
          <h3 className="text-sm font-bold uppercase mb-8 border-b border-border-main pb-4 text-text-main">Sales_By_Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-text-muted">{cat.name}</span>
                </div>
                <span className="text-text-main">{cat.value} SALES</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="cyber-card">
          <div className="flex justify-between items-center mb-6 border-b border-border-main pb-2">
            <h3 className="text-sm font-bold uppercase text-text-main">Recent_System_Activity</h3>
            <Activity className="w-4 h-4 text-cyber-purple animate-pulse" />
          </div>
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <p className="text-center py-10 text-text-muted font-mono text-xs">NO_RECENT_LOGS</p>
            ) : (
              recentLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-4 text-[10px] font-mono text-text-muted border-b border-border-main pb-3 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyber-purple mt-1" />
                  <div className="flex-grow">
                    <p className="text-text-main uppercase font-bold">{log.action}</p>
                    <p className="text-text-muted">Admin: {log.profiles?.full_name || 'System'}</p>
                  </div>
                  <span className="shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="cyber-card">
          <h3 className="text-sm font-bold uppercase mb-6 border-b border-border-main pb-2 text-text-main">Infrastructure_Health</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-card-main border border-border-main space-y-2 rounded-xl">
              <div className="flex justify-between items-center">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-[10px] font-mono text-green-500">SECURE</span>
              </div>
              <p className="text-[10px] font-mono text-text-muted uppercase">Database_Sync</p>
              <p className="text-lg font-bold text-text-main">100%</p>
            </div>
            <div className="p-4 bg-card-main border border-border-main space-y-2 rounded-xl">
              <div className="flex justify-between items-center">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-[10px] font-mono text-yellow-500">ACTIVE</span>
              </div>
              <p className="text-[10px] font-mono text-text-muted uppercase">Announcements</p>
              <p className="text-lg font-bold text-text-main">{stats.activeAnnouncements}</p>
            </div>
            <div className="p-4 bg-card-main border border-border-main space-y-2 rounded-xl">
              <div className="flex justify-between items-center">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-mono text-blue-500">STABLE</span>
              </div>
              <p className="text-[10px] font-mono text-text-muted uppercase">Pending_Orders</p>
              <p className="text-lg font-bold text-text-main">{stats.pendingOrders}</p>
            </div>
            <div className="p-4 bg-card-main border border-border-main space-y-2 rounded-xl">
              <div className="flex justify-between items-center">
                <Activity className="w-4 h-4 text-cyber-purple" />
                <span className="text-[10px] font-mono text-cyber-purple">LIVE</span>
              </div>
              <p className="text-[10px] font-mono text-text-muted uppercase">Total_Reviews</p>
              <p className="text-lg font-bold text-text-main">{stats.totalReviews}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Role Permissions Guide */}
      <div className="mt-8 cyber-card">
        <h3 className="text-sm font-bold uppercase mb-6 border-b border-border-main pb-2 flex items-center gap-2 text-text-main">
          <Shield className="w-4 h-4 text-cyber-purple" />
          System_Access_Protocol_Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 space-y-3 rounded-xl">
            <div className="flex items-center gap-2 text-yellow-500">
              <Crown className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">System_Owner</span>
            </div>
            <ul className="text-[10px] font-mono text-text-muted space-y-1 list-disc pl-4">
              <li>Full Administrative Access</li>
              <li>User Role Management</li>
              <li>System Settings Control</li>
              <li>Financial Data Access</li>
            </ul>
          </div>
          <div className="p-4 bg-cyber-purple/5 border border-cyber-purple/20 space-y-3 rounded-xl">
            <div className="flex items-center gap-2 text-cyber-purple">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">System_Admin</span>
            </div>
            <ul className="text-[10px] font-mono text-text-muted space-y-1 list-disc pl-4">
              <li>Product & Asset Management</li>
              <li>Order Verification & Approval</li>
              <li>Announcement Control</li>
              <li>User Moderation (Ban/Unban)</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 space-y-3 rounded-xl">
            <div className="flex items-center gap-2 text-blue-400">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Core_Developer</span>
            </div>
            <ul className="text-[10px] font-mono text-text-muted space-y-1 list-disc pl-4">
              <li>Technical Asset Management</li>
              <li>System Log Monitoring</li>
              <li>Infrastructure Health Tracking</li>
              <li>No Order/Financial Access</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

// Wrapper to fix the missing layout import if needed or just use AdminLayout
const AdminDashboardLayout: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
  <AdminLayout title={title}>{children}</AdminLayout>
);

export default AdminDashboard;
