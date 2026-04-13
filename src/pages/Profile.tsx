import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { User, Phone, MapPin, Save, Package, Clock, CheckCircle, XCircle, TrendingUp, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '../lib/utils';
import { useLocalization } from '../context/LocalizationContext';
import Badge from '../components/Badge';
import { AnnouncementsList } from '../components/Announcements';

const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { convertPrice } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rank, setRank] = useState<number | string>('--');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);

      // Fetch rank
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, points')
        .order('points', { ascending: false });
      
      if (allProfiles) {
        const userRank = allProfiles.findIndex(p => p.id === user.id) + 1;
        setRank(userRank);
      }
    };
    fetchOrders();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast.error('Update failed: ' + error.message);
    } else {
      toast.success('Profile updated successfully!');
      await refreshProfile();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Profile Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="cyber-card flex items-center gap-6 p-6">
          <div className="w-16 h-16 bg-cyber-purple/10 border border-cyber-purple/30 flex items-center justify-center">
            <User className="w-8 h-8 text-cyber-purple" />
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-tight text-xl text-text-main">{profile?.full_name || 'Anonymous'}</h3>
            {profile && <Badge role={profile.role} className="mt-1" />}
          </div>
        </div>
        <div className="cyber-card flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyber-purple/5 border border-border-main flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-cyber-purple" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-text-muted opacity-30 uppercase tracking-widest">Network_XP</p>
              <p className="text-2xl font-black text-text-main">{profile?.points || 0}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-text-muted opacity-30 uppercase tracking-widest">Rank</p>
            <p className="text-xl font-bold text-cyber-purple italic">#{rank}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="md:col-span-1 space-y-6">
          <div className="cyber-card">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyber-purple">
              <User className="w-5 h-5" />
              IDENTITY_DATA
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                  <input 
                    type="text" 
                    required
                    className="cyber-input pl-10"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                  <input 
                    type="tel" 
                    required
                    className="cyber-input pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Shipping Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-cyber-purple/50" />
                  <textarea 
                    required
                    rows={3}
                    className="cyber-input pl-10"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="cyber-button w-full flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'SYNCING...' : 'SAVE_PROFILE'}
              </button>
            </form>
          </div>

          <div className="cyber-card">
            <AnnouncementsList />
          </div>
        </div>

        {/* Orders List */}
        <div className="md:col-span-2 space-y-6">
          <div className="cyber-card">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyber-purple">
              <Package className="w-5 h-5" />
              ACQUISITION_HISTORY
            </h2>
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-10 text-text-muted opacity-30 font-mono text-sm">
                  NO_TRANSACTIONS_RECORDED
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-4 border border-cyber-purple/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-cyber-purple/20 flex items-center justify-center border border-cyber-purple/30">
                        <Package className="w-6 h-6 text-cyber-purple" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text-main">{(order as any).products?.title}</h4>
                        <p className="text-[10px] font-mono text-text-muted opacity-40">ID: {order.id.slice(0, 8)} | TrxID: {order.trx_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-sm font-bold text-cyber-purple">{convertPrice((order as any).products?.price || 0)}</p>
                        <p className="text-[10px] text-text-muted opacity-40">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      <div className={`flex items-center gap-1 px-3 py-1 border text-[10px] font-bold uppercase ${
                        order.status === 'approved' ? 'border-green-500/30 text-green-500 bg-green-500/10' :
                        order.status === 'pending' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10' :
                        'border-red-500/30 text-red-500 bg-red-500/10'
                      }`}>
                        {order.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : 
                         order.status === 'pending' ? <Clock className="w-3 h-3" /> : 
                         <XCircle className="w-3 h-3" />}
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
