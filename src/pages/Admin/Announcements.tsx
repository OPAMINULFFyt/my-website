import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  is_active: boolean;
  created_at: string;
}

const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info' as const,
    is_active: true
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch announcements: ' + error.message);
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('announcements').insert([newAnnouncement]);

    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success('Announcement broadcasted');
      setIsAdding(false);
      setNewAnnouncement({ title: '', content: '', type: 'info', is_active: true });
      fetchAnnouncements();
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Update error:', error);
      toast.error('Update failed: ' + error.message);
    } else {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed: ' + error.message);
    } else {
      toast.success('Announcement removed');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5';
      case 'success': return 'text-green-500 border-green-500/30 bg-green-500/5';
      case 'danger': return 'text-red-500 border-red-500/30 bg-red-500/5';
      default: return 'text-blue-500 border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <AdminLayout title="BROADCAST_CENTER">
      <div className="flex justify-end mb-8">
        <button 
          onClick={() => setIsAdding(true)}
          className="cyber-button flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          NEW_ANNOUNCEMENT
        </button>
      </div>

      {isAdding && (
        <div className="cyber-card mb-8 border-cyber-purple/50">
          <h3 className="text-sm font-bold uppercase mb-6 border-b border-border-main pb-2 text-text-main">Create Broadcast</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Broadcast Title</label>
              <input 
                type="text"
                required
                className="cyber-input bg-card-main border-border-main"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                placeholder="e.g., System Maintenance, New Update..."
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Message Content</label>
              <textarea 
                required
                className="cyber-input min-h-[100px] bg-card-main border-border-main"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                placeholder="Enter the message for all users..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Alert Type</label>
                <select 
                  className="cyber-input bg-bg-main border-border-main"
                  value={newAnnouncement.type}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                >
                  <option value="info">Information (Blue)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="success">Success (Green)</option>
                  <option value="danger">Critical (Red)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="cyber-button w-full">INITIALIZE_BROADCAST</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-text-muted opacity-30 font-mono animate-pulse">SYNCING_BROADCAST_CHANNELS...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 cyber-card border-dashed border-border-main">
            <p className="text-text-muted opacity-30 font-mono uppercase">No active broadcasts found</p>
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className={`cyber-card border-l-4 ${getTypeColor(a.type)}`}>
              <div className="flex justify-between items-start gap-6">
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-tighter text-text-main">
                      {a.title}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted opacity-60">
                      • {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-main opacity-90 leading-relaxed">{a.content}</p>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <button 
                    onClick={() => toggleStatus(a.id, a.is_active)}
                    className={`p-2 transition-colors ${a.is_active ? 'text-green-500' : 'text-text-muted opacity-20'}`}
                    title={a.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {a.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button 
                    onClick={() => handleDelete(a.id)}
                    className="p-2 text-text-muted opacity-60 hover:text-red-500 hover:opacity-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
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

export default AdminAnnouncements;
