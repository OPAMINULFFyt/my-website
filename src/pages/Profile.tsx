import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { User, Phone, MapPin, Save, Package, Clock, CheckCircle, XCircle, TrendingUp, Megaphone, Facebook, Youtube, Send, MessageCircle, Lock, Mail, EyeOff, Eye, FileText, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '../lib/utils';
import { useLocalization } from '../context/LocalizationContext';
import Badge from '../components/Badge';
import { AnnouncementsList } from '../components/Announcements';
import { motion } from 'motion/react';

const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { convertPrice } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rank, setRank] = useState<number | string>('--');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    facebook_url: profile?.facebook_url || '',
    youtube_url: profile?.youtube_url || '',
    telegram_url: profile?.telegram_url || '',
    whatsapp_number: profile?.whatsapp_number || '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        facebook_url: profile.facebook_url || '',
        youtube_url: profile.youtube_url || '',
        telegram_url: profile.telegram_url || '',
        whatsapp_number: profile.whatsapp_number || '',
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update local state
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // Persist to database immediately so it doesn't disappear on refresh
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      toast.error('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error('Password update failed: ' + error.message);
    } else {
      toast.success('Password updated successfully!');
      setNewPassword('');
    }
    setPasswordLoading(false);
  };

  const calculateLevel = (points: number) => {
    if (points < 500) return { level: 1, name: 'NEOPHYTE', next: 500, color: 'text-text-muted' };
    if (points < 1000) return { level: 2, name: 'INFILTRATOR', next: 1000, color: 'text-blue-500' };
    if (points < 2000) return { level: 3, name: 'TECHNOMANCER', next: 2000, color: 'text-cyber-purple' };
    if (points < 5000) return { level: 4, name: 'GHOST_OPERATIVE', next: 5000, color: 'text-yellow-500' };
    return { level: 5, name: 'SYSTEM_ARCHITECT', next: 10000, color: 'text-red-500' };
  };

  const userLevel = calculateLevel(profile?.points || 0);
  const progressToNext = Math.min(100, Math.round(((profile?.points || 0) / userLevel.next) * 100));

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Profile Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="cyber-card md:col-span-2 flex flex-col sm:flex-row items-center gap-8 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/5 blur-3xl -z-10" />
          
          <div className="relative group">
            <div className="w-24 h-24 bg-card-main border border-cyber-purple/30 flex items-center justify-center overflow-hidden rounded-xl">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-cyber-purple animate-spin" />
              ) : formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-12 h-12 text-cyber-purple" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-cyber-purple p-1.5 rounded-lg border border-white/20 shadow-lg cursor-pointer hover:scale-110 transition-transform">
              <Camera className="w-3 h-3 text-white" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h3 className="font-black uppercase tracking-tighter text-3xl text-text-main italic">{profile?.full_name || 'Anonymous'}</h3>
              {profile && <Badge role={profile.role} />}
            </div>
            <p className="text-xs font-mono text-text-muted uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-3 h-3 text-cyber-purple" />
              {user?.email}
            </p>
            {profile?.bio && (
              <p className="text-xs text-text-muted font-mono line-clamp-2 max-w-md italic opacity-60">
                "{profile.bio}"
              </p>
            )}
          </div>
        </div>

        <div className="cyber-card flex flex-col justify-center gap-4 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyber-purple/10 border border-cyber-purple/30 flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(188,19,254,0.2)]">
                <TrendingUp className="w-6 h-6 text-cyber-purple" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-text-muted opacity-50 uppercase tracking-widest">System_Level</p>
                <p className={`text-xl font-black italic ${userLevel.color}`}>{userLevel.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono text-text-muted opacity-50 uppercase tracking-widest">Rank</p>
              <p className="text-xl font-black text-text-main italic">#{rank}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest">
              <span className="text-text-muted">XP: {profile?.points || 0}</span>
              <span className="text-cyber-purple">Next: {userLevel.next}</span>
            </div>
            <div className="h-2 bg-white/5 border border-border-main rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                className="h-full bg-cyber-purple shadow-[0_0_10px_rgba(188,19,254,0.5)]"
              />
            </div>
          </div>

          <div className="h-px bg-border-main my-2" />
          <div className="flex justify-around">
            {profile?.facebook_url && (
              <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-cyber-purple transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {profile?.youtube_url && (
              <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-cyber-purple transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            )}
            {profile?.telegram_url && (
              <a href={profile.telegram_url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-cyber-purple transition-colors">
                <Send className="w-5 h-5" />
              </a>
            )}
            {profile?.whatsapp_number && (
              <a href={`https://wa.me/${profile.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-cyber-purple transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Customization Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="cyber-card">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-cyber-purple">
              <User className="w-6 h-6" />
              PROFILE_CUSTOMIZATION
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-mono text-cyber-purple uppercase tracking-[0.3em] mb-4">Core_Identity</h3>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Full Name</label>
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
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Avatar URL</label>
                    <div className="relative">
                      <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                      <input 
                        type="url" 
                        placeholder="https://example.com/image.jpg"
                        className="cyber-input pl-10"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Phone Number</label>
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
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-mono text-cyber-purple uppercase tracking-[0.3em] mb-4">Location_&_Bio</h3>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Shipping Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-cyber-purple/50" />
                      <textarea 
                        required
                        rows={2}
                        className="cyber-input pl-10"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Short Bio</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-cyber-purple/50" />
                      <textarea 
                        rows={2}
                        placeholder="Tell the network about yourself..."
                        className="cyber-input pl-10"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4 pt-4 border-t border-border-main">
                <h3 className="text-[10px] font-mono text-cyber-purple uppercase tracking-[0.3em] mb-6">Network_Connections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Facebook URL</label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                      <input 
                        type="url" 
                        className="cyber-input pl-10"
                        value={formData.facebook_url}
                        onChange={(e) => setFormData({...formData, facebook_url: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">YouTube URL</label>
                    <div className="relative">
                      <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                      <input 
                        type="url" 
                        className="cyber-input pl-10"
                        value={formData.youtube_url}
                        onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Telegram URL</label>
                    <div className="relative">
                      <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                      <input 
                        type="url" 
                        className="cyber-input pl-10"
                        value={formData.telegram_url}
                        onChange={(e) => setFormData({...formData, telegram_url: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">WhatsApp Number</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                      <input 
                        type="text" 
                        placeholder="e.g. 8801700000000"
                        className="cyber-input pl-10"
                        value={formData.whatsapp_number}
                        onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="cyber-button w-full flex items-center justify-center gap-3 py-4"
              >
                <Save className="w-5 h-5" />
                {loading ? 'SYNCING_DATA...' : 'UPDATE_NETWORK_PROFILE'}
              </button>
            </form>
          </div>

          {/* Acquisition History */}
          <div className="cyber-card">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-cyber-purple">
              <Package className="w-6 h-6" />
              ACQUISITION_HISTORY
            </h2>
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 text-text-muted opacity-30 font-mono text-sm border border-dashed border-border-main">
                  NO_TRANSACTIONS_RECORDED_IN_DATABASE
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-5 border border-cyber-purple/10 bg-bg-main flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-cyber-purple/30 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-cyber-purple/20 flex items-center justify-center border border-cyber-purple/30 shrink-0">
                        <Package className="w-7 h-7 text-cyber-purple" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-text-main">{(order as any).products?.title}</h4>
                        <p className="text-[10px] font-mono text-text-muted opacity-40 mt-1">ID: {order.id.slice(0, 8)} | TrxID: {order.trx_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-8">
                      <div className="text-right">
                        <p className="text-base font-bold text-cyber-purple">{convertPrice((order as any).products?.price || 0)}</p>
                        <p className="text-[10px] text-text-muted opacity-40 font-mono">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-4 py-1.5 border text-[10px] font-bold uppercase tracking-widest ${
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

        {/* Sidebar: Security & Announcements */}
        <div className="space-y-8">
          {/* Security Settings */}
          <div className="cyber-card">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-cyber-purple">
              <Lock className="w-5 h-5" />
              SECURITY_PROTOCOLS
            </h2>
            
            <div className="space-y-6">
              <div className="p-4 bg-bg-main border border-border-main">
                <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Registered Email</label>
                <div className="flex items-center gap-3 text-sm font-mono text-text-main">
                  <Mail className="w-4 h-4 text-cyber-purple" />
                  {user?.email}
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Update Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New Password"
                      className="cyber-input pl-10 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-cyber-purple transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="cyber-button w-full flex items-center justify-center gap-2 text-[10px]"
                >
                  <Lock className="w-3 h-3" />
                  {passwordLoading ? 'UPDATING...' : 'CHANGE_PASSWORD'}
                </button>
              </form>
            </div>
          </div>

          <div className="cyber-card">
            <AnnouncementsList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
