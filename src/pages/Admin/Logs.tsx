import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Activity, Clock, User, Terminal, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface SystemLog {
  id: string;
  admin_id: string;
  action: string;
  details: any;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*, profiles:admin_id(full_name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Logs fetch error:', error);
        // Fallback: fetch without join if join fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setLogs(fallbackData || []);
        toast.warning('Logs loaded without admin names due to system limitation');
      } else {
        setLogs(data || []);
      }
    } catch (err: any) {
      console.error('Critical logs error:', err);
      toast.error('Failed to fetch logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="SYSTEM_AUDIT_LOGS">
      <div className="cyber-card mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted opacity-30" />
          <input 
            type="text"
            placeholder="FILTER_LOGS_BY_ACTION_OR_ADMIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cyber-input pl-12 h-14 bg-card-main border-border-main placeholder:text-text-muted/60"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-text-muted opacity-30 font-mono animate-pulse">SCANNING_AUDIT_TRAIL...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 cyber-card border-dashed border-border-main">
            <p className="text-text-muted opacity-30 font-mono uppercase">No logs detected in current session</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="cyber-card group hover:border-cyber-purple/30 transition-all py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-card-main border border-border-main flex items-center justify-center shrink-0">
                    <Terminal className="w-5 h-5 text-cyber-purple" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-tight text-text-main opacity-90">{log.action}</span>
                      <span className="text-[10px] font-mono text-cyber-purple bg-cyber-purple/10 px-2 border border-cyber-purple/20">
                        SUCCESS
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-text-muted uppercase">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Admin: {log.profiles?.full_name || 'System'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/40 p-3 border border-border-main rounded font-mono text-[9px] text-text-muted max-w-md overflow-hidden">
                  <code className="block truncate">
                    {JSON.stringify(log.details)}
                  </code>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
