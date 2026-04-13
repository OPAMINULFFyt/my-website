import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { User, Shield, ShieldCheck, Mail, Phone, MapPin, Loader2, Search, TrendingUp, Ban, Unlock, Crown } from 'lucide-react';
import { toast } from 'sonner';
import Badge from '../../components/Badge';
import { useAuth } from '../../App';

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  role: 'user' | 'admin' | 'developer' | 'owner';
  points: number;
  is_banned: boolean;
  avatar_url?: string;
  updated_at: string;
}

const AdminUsers: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const logAction = async (action: string, details: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('system_logs').insert([{
        admin_id: user.id,
        action,
        details
      }]);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [confirmingOwnerId, setConfirmingOwnerId] = useState<string | null>(null);

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'developer' | 'owner') => {
    if (currentUserProfile?.role !== 'owner' && (newRole === 'admin' || newRole === 'owner')) {
      return toast.error('Only SYSTEM_OWNER can assign ADMIN or OWNER roles');
    }

    if (newRole === 'owner' && confirmingOwnerId !== userId) {
      setConfirmingOwnerId(userId);
      toast.warning('Click "OWNER" again to confirm promotion. This is a critical action!');
      return;
    }

    setUpdatingId(userId);
    setConfirmingOwnerId(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      await logAction('UPDATE_USER_ROLE', { userId, newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`User role updated to ${newRole.toUpperCase()}`);
    } catch (error: any) {
      toast.error('Update failed: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleBan = async (userId: string, currentStatus: boolean, targetRole: string) => {
    if (targetRole === 'owner' || (targetRole === 'admin' && currentUserProfile?.role !== 'owner')) {
      return toast.error('Insufficient permissions to ban this user');
    }

    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      await logAction(currentStatus ? 'UNBAN_USER' : 'BAN_USER', { userId });
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
      toast.success(currentStatus ? 'User unbanned' : 'User banned from system');
    } catch (error: any) {
      toast.error('Operation failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm) ||
    u.id.includes(searchTerm)
  );

  return (
    <AdminLayout title="USER_MANAGEMENT">
      <div className="cyber-card mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted opacity-30" />
          <input 
            type="text"
            placeholder="SEARCH_BY_NAME_OR_ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cyber-input pl-12 h-14 bg-card-main border-border-main"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-cyber-purple animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 cyber-card">
            <p className="text-text-muted opacity-30 font-mono uppercase tracking-widest">No users found in database</p>
          </div>
        ) : (
          filteredUsers.map((profile) => (
            <div key={profile.id} className="cyber-card group hover:border-cyber-purple/50 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-card-main border border-border-main overflow-hidden flex items-center justify-center shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : profile.role === 'owner' ? (
                      <Crown className="w-6 h-6 text-yellow-500" />
                    ) : profile.role === 'admin' ? (
                      <ShieldCheck className="w-6 h-6 text-cyber-purple" />
                    ) : profile.role === 'developer' ? (
                      <Shield className="w-6 h-6 text-blue-500" />
                    ) : (
                      <User className="w-6 h-6 text-text-muted opacity-40" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold uppercase tracking-tight text-text-main">{profile.full_name || 'Anonymous User'}</h3>
                      <Badge role={profile.role} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-mono text-text-muted opacity-40 uppercase">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-cyber-purple" />
                        XP: {profile.points || 0}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {profile.phone || 'NO_PHONE'}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {profile.address || 'NO_ADDRESS'}
                      </div>
                      <div className="flex items-center gap-2 col-span-full">
                        <Mail className="w-3 h-3" />
                        ID: {profile.id}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={updatingId === profile.id}
                    onClick={() => updateUserRole(profile.id, 'user')}
                    className={cn(
                      "px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all",
                      profile.role === 'user' 
                        ? "bg-cyber-purple/10 border-cyber-purple text-cyber-purple" 
                        : "border-border-main text-text-muted opacity-30 hover:border-border-main hover:text-text-main"
                    )}
                  >
                    User
                  </button>
                  <button
                    disabled={updatingId === profile.id}
                    onClick={() => updateUserRole(profile.id, 'developer')}
                    className={cn(
                      "px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all",
                      profile.role === 'developer' 
                        ? "bg-blue-500/20 border-blue-500 text-blue-500" 
                        : "border-border-main text-text-muted opacity-30 hover:border-blue-500/50 hover:text-blue-500"
                    )}
                  >
                    Dev
                  </button>
                  <button
                    disabled={updatingId === profile.id}
                    onClick={() => updateUserRole(profile.id, 'admin')}
                    className={cn(
                      "px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all",
                      profile.role === 'admin' 
                        ? "bg-cyber-purple/20 border-cyber-purple text-cyber-purple" 
                        : "border-border-main text-text-muted opacity-30 hover:border-cyber-purple/50 hover:text-cyber-purple"
                    )}
                  >
                    Admin
                  </button>
                  {currentUserProfile?.role === 'owner' && (
                    <button
                      disabled={updatingId === profile.id}
                      onClick={() => updateUserRole(profile.id, 'owner')}
                      className={cn(
                        "px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all",
                        profile.role === 'owner' 
                          ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" 
                          : confirmingOwnerId === profile.id
                          ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse"
                          : "border-border-main text-text-muted opacity-30 hover:border-yellow-500/50 hover:text-yellow-500"
                      )}
                    >
                      {confirmingOwnerId === profile.id ? 'Confirm?' : 'Owner'}
                    </button>
                  )}
                  <button
                    disabled={updatingId === profile.id}
                    onClick={() => toggleBan(profile.id, profile.is_banned, profile.role)}
                    className={cn(
                      "p-2 border transition-all",
                      profile.is_banned 
                        ? "bg-red-500/20 border-red-500 text-red-500" 
                        : "border-border-main text-text-muted opacity-30 hover:border-red-500/50 hover:text-red-500"
                    )}
                    title={profile.is_banned ? 'Unban User' : 'Ban User'}
                  >
                    {profile.is_banned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

// Utility for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default AdminUsers;
