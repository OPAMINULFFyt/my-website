import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Order } from '../types';
import { useAuth } from '../App';
import { Shield, Zap, CheckCircle, ArrowLeft, Loader2, CreditCard, Lock, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useLocalization } from '../context/LocalizationContext';

const Checkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { convertPrice } = useLocalization();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [useExp, setUseExp] = useState(false);
  const [expDiscount, setExpDiscount] = useState(0);
  const [gateways, setGateways] = useState<any[]>([]);

  const EXP_CONVERSION_RATE = 0.1; // 1 EXP = 0.1 BDT
  const MAX_EXP_DISCOUNT_PERCENT = 0.5; // Max 50% discount

  useEffect(() => {
    if (useExp && profile?.points && product) {
      const maxDiscount = product.price * MAX_EXP_DISCOUNT_PERCENT;
      const possibleDiscount = profile.points * EXP_CONVERSION_RATE;
      setExpDiscount(Math.min(maxDiscount, possibleDiscount));
    } else {
      setExpDiscount(0);
    }
  }, [useExp, profile?.points, product]);
  const [paymentSettings, setPaymentSettings] = useState({
    bkash: '01XXXXXXXXX',
    nagad: '01XXXXXXXXX',
    bkash_logo: 'https://raw.githubusercontent.com/shuvohabibi/bkash-logo/main/bkash.png',
    nagad_logo: 'https://raw.githubusercontent.com/shuvohabibi/nagad-logo/main/nagad.png',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      
      // Fetch settings
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData) {
        const settingsMap = settingsData.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
        setPaymentSettings({
          bkash: settingsMap.bkash || '01XXXXXXXXX',
          nagad: settingsMap.nagad || '01XXXXXXXXX',
          bkash_logo: settingsMap.bkash_logo || 'https://raw.githubusercontent.com/shuvohabibi/bkash-logo/main/bkash.png',
          nagad_logo: settingsMap.nagad_logo || 'https://raw.githubusercontent.com/shuvohabibi/nagad-logo/main/nagad.png',
        });

        if (settingsMap.payment_gateways) {
          try {
            setGateways(JSON.parse(settingsMap.payment_gateways));
          } catch (e) {
            setGateways([]);
          }
        }
      }

      // Fetch product
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (productData) {
        setProduct(productData);
        
        // Check if already ordered
        if (user) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productData.id)
            .maybeSingle();
          
          if (orderData) {
            toast.info('You already have an order for this asset.');
            navigate(`/product/${productData.slug || productData.id}`);
          }
        }
      } else {
        toast.error('Asset not found');
        navigate('/');
      }
      
      setLoading(false);
    };

    fetchData();
  }, [id, user, navigate]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to purchase');
    if (!profile) return toast.error('Please complete your profile first');
    if (!trxId.trim()) return toast.error('Please enter Transaction ID');

    setSubmitting(true);
    
    // Deduct points if used
    if (useExp && expDiscount > 0) {
      const pointsToDeduct = Math.ceil(expDiscount / EXP_CONVERSION_RATE);
      await supabase.from('profiles').update({
        points: Math.max(0, (profile.points || 0) - pointsToDeduct)
      }).eq('id', user.id);
    }

    const affiliateId = sessionStorage.getItem('affiliate_id');

    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      product_id: product?.id,
      trx_id: trxId,
      status: 'pending',
      affiliate_id: affiliateId || null
    });

    if (error) {
      toast.error('Order failed: ' + error.message);
    } else {
      toast.success('Order submitted! Waiting for approval.');
      navigate(`/product/${product?.slug || product?.id}`);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cyber-black text-cyber-purple font-mono">INITIALIZING_SECURE_CHECKOUT...</div>;
  if (!product) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-muted hover:text-cyber-purple transition-colors font-mono text-xs uppercase mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Cancel Checkout
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Payment Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="cyber-card p-8">
            <div className="flex items-center gap-4 mb-8 border-b border-cyber-purple/30 pb-6">
              <div className="w-12 h-12 bg-cyber-purple/20 flex items-center justify-center border border-cyber-purple/50">
                <Shield className="w-7 h-7 text-cyber-purple animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-main tracking-tighter uppercase">Secure_Payment_Gateway</h1>
                <p className="text-[10px] font-mono text-cyber-purple uppercase tracking-widest">Protocol: 256-BIT_ENCRYPTION_ACTIVE</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted uppercase tracking-widest">
                  <Zap className="w-3 h-3 text-cyber-purple" />
                  Step 1: Choose Payment Method & Transfer
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* bKash */}
                  <div className="relative group p-6 bg-card-main border border-border-main hover:border-pink-500/50 transition-all duration-300 rounded-xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 blur-2xl -z-10" />
                    <div className="flex justify-between items-start mb-4">
                      <p className="font-bold text-pink-500 text-sm uppercase tracking-tighter">Bkash Personal</p>
                      <img src={paymentSettings.bkash_logo} alt="bKash" className="h-6 object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <p className="text-2xl font-mono text-text-main tracking-widest mb-2">{paymentSettings.bkash}</p>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono uppercase tracking-widest">
                      <Info className="w-3 h-3" />
                      Method: Send Money
                    </div>
                  </div>

                  {/* Nagad */}
                  <div className="relative group p-6 bg-card-main border border-border-main hover:border-orange-500/50 transition-all duration-300 rounded-xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl -z-10" />
                    <div className="flex justify-between items-start mb-4">
                      <p className="font-bold text-orange-500 text-sm uppercase tracking-tighter">Nagad Personal</p>
                      <img src={paymentSettings.nagad_logo} alt="Nagad" className="h-6 object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <p className="text-2xl font-mono text-text-main tracking-widest mb-2">{paymentSettings.nagad}</p>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono uppercase tracking-widest">
                      <Info className="w-3 h-3" />
                      Method: Send Money
                    </div>
                  </div>

                  {/* Dynamic Gateways */}
                  {gateways.map((g) => (
                    <div key={g.id} className="relative group p-6 bg-card-main border border-border-main hover:border-cyber-purple/50 transition-all duration-300 rounded-xl overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-purple/5 blur-2xl -z-10" />
                      <div className="flex justify-between items-start mb-4">
                        <p className="font-bold text-cyber-purple text-sm uppercase tracking-tighter">{g.name}</p>
                        {g.logo && <img src={g.logo} alt={g.name} className="h-6 object-contain" referrerPolicy="no-referrer" />}
                      </div>
                      <p className="text-2xl font-mono text-text-main tracking-widest mb-2">{g.details}</p>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono uppercase tracking-widest">
                        <Info className="w-3 h-3" />
                        Method: Transfer
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleBuy} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-text-muted uppercase tracking-widest">
                    <Zap className="w-3 h-3 text-cyber-purple" />
                    Step 2: Verify Transaction
                  </div>
                  
                  <div className="relative">
                    <label className="block text-[10px] font-mono text-cyber-purple uppercase mb-2 tracking-widest">Transaction ID (TrxID)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="cyber-input pl-12 h-16 text-xl tracking-widest font-mono uppercase"
                        placeholder="8X9Y10Z..."
                      />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-cyber-purple/50" />
                    </div>
                    <p className="text-[9px] font-mono text-text-muted mt-2 uppercase tracking-wide">
                      Enter the unique transaction ID provided by your payment provider after the transfer.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg flex gap-4 items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-mono text-red-500/80 leading-relaxed uppercase italic">
                    Warning: Submitting a fraudulent Transaction ID will result in an immediate and permanent ban of your operative account and all associated assets.
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="cyber-button w-full h-16 text-lg group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <span className="relative flex items-center justify-center gap-3">
                    {submitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        VERIFYING_PAYMENT_DATA...
                      </>
                    ) : (
                      <>
                        <Lock className="w-6 h-6" />
                        COMPLETE_SECURE_PURCHASE
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="cyber-card p-6 sticky top-24">
            <h3 className="text-sm font-mono text-text-muted uppercase tracking-widest mb-6 border-b border-border-main pb-4">Order_Summary</h3>
            
            <div className="flex gap-4 mb-6">
              <div className="w-20 h-20 bg-cyber-black border border-border-main overflow-hidden rounded-lg shrink-0">
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-text-main uppercase truncate">{product.title}</h4>
                <p className="text-[10px] font-mono text-cyber-purple uppercase mt-1">{product.category}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-border-main pt-4 mb-6">
              <div className="flex justify-between text-xs font-mono uppercase">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-main">{convertPrice(product.price)}</span>
              </div>
              
              {profile?.points && profile.points > 0 && (
                <div className="p-3 bg-cyber-purple/5 border border-cyber-purple/20 rounded-lg mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-cyber-purple" />
                      <span className="text-[10px] font-mono text-text-main uppercase">Redeem EXP</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={useExp}
                      onChange={(e) => setUseExp(e.target.checked)}
                      className="w-4 h-4 accent-cyber-purple"
                    />
                  </div>
                  <p className="text-[9px] font-mono text-text-muted uppercase leading-tight">
                    Use your {profile.points} EXP for a discount.
                  </p>
                  {useExp && (
                    <div className="flex justify-between text-[10px] font-mono uppercase text-cyber-purple mt-2 pt-2 border-t border-cyber-purple/10">
                      <span>EXP Discount</span>
                      <span>-{convertPrice(expDiscount)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between text-xs font-mono uppercase">
                <span className="text-text-muted">Processing Fee</span>
                <span className="text-green-500">FREE</span>
              </div>
              <div className="flex justify-between text-lg font-bold uppercase tracking-tighter pt-2 border-t border-border-main">
                <span className="text-text-main">Total_Value</span>
                <span className="text-cyber-purple">{convertPrice(product.price - expDiscount)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-border-main rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-[10px] font-mono text-text-main uppercase">Lifetime Access</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-border-main rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-[10px] font-mono text-text-main uppercase">Verified Digital Asset</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-border-main rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-[10px] font-mono text-text-main uppercase">Secure Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
