import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';
import { Check, X, User, Phone, MapPin, CreditCard, ExternalLink, RefreshCw, Search, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '../../lib/utils';
import { useLocalization } from '../../context/LocalizationContext';

const AdminOrders: React.FC = () => {
  const { convertPrice } = useLocalization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

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

  const [rewardSettings, setRewardSettings] = useState({
    referral_exp: 100,
    referral_opx: 10,
    affiliate_opx_percent: 5
  });

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch reward settings
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData) {
        const settingsMap = settingsData.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
        setRewardSettings({
          referral_exp: parseInt(settingsMap.referral_exp) || 100,
          referral_opx: parseInt(settingsMap.referral_opx) || 10,
          affiliate_opx_percent: parseInt(settingsMap.affiliate_opx_percent) || 5
        });
      }

      // Try fetching with joins first
      let query = supabase
        .from('orders')
        .select('*, profiles:user_id(*), products:product_id(*)')
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        console.error('Join Fetch Error:', fetchError);
        // Fallback: fetch without joins if join fails
        let fallbackQuery = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (filter !== 'all') {
          fallbackQuery = fallbackQuery.eq('status', filter);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
          
        if (fallbackError) throw fallbackError;
        
        // If fallback works, we at least have the orders
        if (fallbackData) {
          setOrders(fallbackData as any);
          toast.warning('Loaded orders without details due to system error');
        }
      } else if (data) {
        setOrders(data);
      }
    } catch (err: any) {
      console.error('Fetch Orders Error:', err);
      setError(err.message);
      toast.error('Failed to fetch orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleStatus = async (orderId: string, status: 'approved' | 'rejected', userId: string, price: number) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast.error('Update failed: ' + error.message);
    } else {
      await logAction(status === 'approved' ? 'APPROVE_ORDER' : 'REJECT_ORDER', { orderId });
      // Award points if approved
      if (status === 'approved') {
        const pointsToAward = Math.floor(price / 10) || 10; // 10% of price or min 10
        
        // 1. Award buyer points
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (buyerProfile) {
          await supabase
            .from('profiles')
            .update({ points: (buyerProfile.points || 0) + pointsToAward })
            .eq('id', userId);

          // 2. Handle Referral Rewards
          if (buyerProfile.referred_by) {
            // Check if this is the first approved order for this user
            const { count } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('status', 'approved');
            
            // If count is 1 (this order), it's the first one
            if (count === 1) {
              const { data: referrer } = await supabase
                .from('profiles')
                .select('*')
                .eq('referral_code', buyerProfile.referred_by)
                .single();
              
              if (referrer) {
                await supabase
                  .from('profiles')
                  .update({ 
                    points: (referrer.points || 0) + rewardSettings.referral_exp,
                    opx_coins: (referrer.opx_coins || 0) + rewardSettings.referral_opx
                  })
                  .eq('id', referrer.id);
                toast.success(`Referrer ${referrer.full_name} awarded ${rewardSettings.referral_exp} XP & ${rewardSettings.referral_opx} OPX!`);
              }
            }
          }
        }

        // 3. Handle Affiliate Rewards
        const order = orders.find(o => o.id === orderId);
        if (order?.affiliate_id) {
          const { data: affiliate } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', order.affiliate_id)
            .single();
          
          if (affiliate && affiliate.role === 'affiliate') {
            const affiliateCommission = Math.floor(price * (rewardSettings.affiliate_opx_percent / 100));
            if (affiliateCommission > 0) {
              await supabase
                .from('profiles')
                .update({ 
                  opx_coins: (affiliate.opx_coins || 0) + affiliateCommission
                })
                .eq('id', affiliate.id);
              toast.success(`Affiliate ${affiliate.full_name} awarded ${affiliateCommission} OPX!`);
            }
          }
        }
          
        toast.success(`Order APPROVED. User awarded ${pointsToAward} XP!`);
      } else {
        toast.success(`Order REJECTED`);
      }
      fetchOrders();
    }
  };

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    if (selectedOrders.length === 0) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .in('id', selectedOrders);

      if (error) throw error;
      
      await logAction(`BULK_${status.toUpperCase()}_ORDERS`, { count: selectedOrders.length, ids: selectedOrders });
      toast.success(`Bulk ${status} completed`);
      setSelectedOrders([]);
      fetchOrders();
    } catch (err: any) {
      toast.error('Bulk action failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredOrders = orders.filter(o => 
    o.trx_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.profiles as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.includes(searchTerm)
  );

  return (
    <AdminLayout title="ORDER_QUEUE">
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
          onClick={() => fetchOrders()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-mono border border-border-main text-text-muted opacity-40 hover:text-cyber-purple hover:border-cyber-purple/50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          REFRESH_STREAM
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-30" />
          <input 
            type="text"
            placeholder="SEARCH_BY_TRX_ID_OR_CUSTOMER_NAME..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cyber-input pl-12 h-12 bg-card-main border-border-main"
          />
        </div>
        <div className="flex gap-2">
          <button 
            disabled={selectedOrders.length === 0 || loading}
            onClick={() => handleBulkAction('approved')}
            className="flex-1 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-mono uppercase hover:bg-green-500 hover:text-white transition-all disabled:opacity-30"
          >
            BULK_APPROVE ({selectedOrders.length})
          </button>
          <button 
            disabled={selectedOrders.length === 0 || loading}
            onClick={() => handleBulkAction('rejected')}
            className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono uppercase hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
          >
            BULK_REJECT
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 text-text-muted opacity-30 font-mono text-xs animate-pulse">INTERCEPTING_DATA_STREAM...</div>
        ) : error ? (
          <div className="text-center py-20 border border-red-500/20 bg-red-500/5 text-red-500 font-mono text-xs">
            <p className="font-bold uppercase mb-2">CRITICAL_ERROR: DATA_FETCH_FAILED</p>
            <p className="opacity-70">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border-main text-text-muted opacity-30 font-mono">NO_ORDERS_FOUND</div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className={`cyber-card relative ${selectedOrders.includes(order.id) ? 'border-cyber-purple' : ''}`}>
              <button 
                onClick={() => toggleSelect(order.id)}
                className="absolute top-4 left-4 z-10"
              >
                {selectedOrders.includes(order.id) ? (
                  <CheckSquare className="w-5 h-5 text-cyber-purple" />
                ) : (
                  <Square className="w-5 h-5 text-text-muted opacity-20" />
                )}
              </button>
              <div className="flex flex-col lg:flex-row justify-between gap-8 pl-10">
                {/* Order Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyber-purple">ORDER_ID: {order.id}</span>
                    <span className="text-[10px] font-mono text-text-muted opacity-40">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-card-main border border-border-main">
                    <div className="w-12 h-12 bg-cyber-purple/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-cyber-purple" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted opacity-50 uppercase">Transaction ID</p>
                      <p className="font-mono font-bold text-cyber-purple">{order.trx_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-10 bg-card-main border border-border-main overflow-hidden">
                      <img src={order.products?.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-main">{order.products?.title}</h4>
                      <p className="text-xs text-cyber-purple font-mono">{convertPrice(order.products?.price || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 space-y-3 border-l border-border-main pl-0 lg:pl-8">
                  <h5 className="text-[10px] font-mono text-text-muted opacity-50 uppercase mb-2">Customer Identity</h5>
                  <div className="flex items-center gap-3 text-sm text-text-main">
                    <div className="w-8 h-8 bg-card-main border border-border-main overflow-hidden flex items-center justify-center">
                      {order.profiles?.avatar_url ? (
                        <img src={order.profiles.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-4 h-4 text-cyber-purple" />
                      )}
                    </div>
                    <span>{order.profiles?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-main">
                    <Phone className="w-4 h-4 text-cyber-purple" />
                    <span>{order.profiles?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-main">
                    <MapPin className="w-4 h-4 text-cyber-purple" />
                    <span className="text-text-muted opacity-60">{order.profiles?.address || 'N/A'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col justify-center gap-4 border-l border-border-main pl-0 lg:pl-8">
                  {order.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleStatus(order.id, 'approved', order.user_id, (order as any).products?.price || 0)}
                        className="flex-1 lg:flex-none px-6 py-2 bg-green-500/20 border border-green-500 text-green-500 font-bold text-xs uppercase hover:bg-green-500 hover:text-white transition-all"
                      >
                        <Check className="w-4 h-4 inline mr-2" />
                        APPROVE
                      </button>
                      <button 
                        onClick={() => handleStatus(order.id, 'rejected', order.user_id, (order as any).products?.price || 0)}
                        className="flex-1 lg:flex-none px-6 py-2 bg-red-500/20 border border-red-500 text-red-500 font-bold text-xs uppercase hover:bg-red-500 hover:text-white transition-all"
                      >
                        <X className="w-4 h-4 inline mr-2" />
                        REJECT
                      </button>
                    </>
                  ) : (
                    <div className={`px-6 py-2 border text-center font-bold text-xs uppercase ${
                      order.status === 'approved' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                    }`}>
                      {order.status}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
