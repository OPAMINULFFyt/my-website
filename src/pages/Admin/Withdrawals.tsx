import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Withdrawal } from '../../types';
import { Check, X, User, CreditCard, RefreshCw, Search, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('withdrawals')
        .select('*, profiles:user_id(*)')
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) setWithdrawals(data);
    } catch (err: any) {
      toast.error('Failed to fetch withdrawals: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Update failed: ' + error.message);
    } else {
      toast.success(`Withdrawal ${status.toUpperCase()}`);
      fetchWithdrawals();
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    (w.profiles as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="WITHDRAWAL_REQUESTS">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 text-[10px] font-mono border uppercase transition-all ${
                filter === f 
                  ? 'bg-cyber-purple border-cyber-purple text-white shadow-[0_0_10px_rgba(188,19,254,0.3)]' 
                  : 'border-border-main text-text-muted opacity-40 hover:border-border-main hover:text-text-main'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button 
          onClick={() => fetchWithdrawals()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-mono border border-border-main text-text-muted opacity-40 hover:text-cyber-purple hover:border-cyber-purple/50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          REFRESH_STREAM
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-30" />
        <input 
          type="text"
          placeholder="SEARCH_BY_CUSTOMER_NAME_OR_METHOD..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="cyber-input pl-12 h-12 bg-card-main border-border-main"
        />
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 text-text-muted opacity-30 font-mono text-xs animate-pulse">INTERCEPTING_WITHDRAWAL_DATA...</div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border-main text-text-muted opacity-30 font-mono uppercase">No_Withdrawal_Requests_Found</div>
        ) : (
          filteredWithdrawals.map((w) => (
            <div key={w.id} className="cyber-card p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                {/* User Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-card-main border border-border-main overflow-hidden flex items-center justify-center">
                      {w.profiles?.avatar_url ? (
                        <img src={w.profiles.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-6 h-6 text-cyber-purple" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main uppercase">{w.profiles?.full_name || 'Unknown Operative'}</h4>
                      <p className="text-[10px] font-mono text-text-muted uppercase">UID: {w.user_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-cyber-purple/5 border border-cyber-purple/20 rounded-lg">
                    <Clock className="w-4 h-4 text-cyber-purple" />
                    <span className="text-[10px] font-mono text-text-muted uppercase">Requested: {new Date(w.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Amount & Method */}
                <div className="flex-1 space-y-4 border-l border-border-main pl-0 lg:pl-8">
                  <div>
                    <p className="text-[10px] font-mono text-text-muted uppercase mb-1">Withdrawal Amount</p>
                    <p className="text-2xl font-black text-cyber-purple tracking-tighter">{w.amount} OPX</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-text-muted" />
                      <span className="text-xs font-bold text-text-main uppercase">{w.method}</span>
                    </div>
                    <div className="p-3 bg-card-main border border-border-main rounded-lg">
                      <p className="text-[10px] font-mono text-text-muted uppercase mb-1">Payment Details</p>
                      <p className="text-xs text-text-main font-mono break-all">{w.details}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col justify-center gap-4 border-l border-border-main pl-0 lg:pl-8">
                  {w.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleStatus(w.id, 'approved')}
                        className="flex-1 lg:flex-none px-6 py-2 bg-green-500/20 border border-green-500 text-green-500 font-bold text-xs uppercase hover:bg-green-500 hover:text-white transition-all"
                      >
                        <Check className="w-4 h-4 inline mr-2" />
                        APPROVE
                      </button>
                      <button 
                        onClick={() => handleStatus(w.id, 'rejected')}
                        className="flex-1 lg:flex-none px-6 py-2 bg-red-500/20 border border-red-500 text-red-500 font-bold text-xs uppercase hover:bg-red-500 hover:text-white transition-all"
                      >
                        <X className="w-4 h-4 inline mr-2" />
                        REJECT
                      </button>
                    </>
                  ) : (
                    <div className={`px-6 py-2 border text-center font-bold text-xs uppercase ${
                      w.status === 'approved' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                    }`}>
                      {w.status}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg flex gap-4 items-start">
        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-[10px] font-mono text-yellow-500/80 leading-relaxed uppercase italic">
          Admin_Note: Approving a withdrawal request confirms that you have manually transferred the equivalent cash to the operative's provided payment details. This action is irreversible.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
