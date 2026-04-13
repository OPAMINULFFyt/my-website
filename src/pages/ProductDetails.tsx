import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Order } from '../types';
import { useAuth } from '../App';
import { formatPrice } from '../lib/utils';
import { ShoppingCart, ExternalLink, Clock, CheckCircle, XCircle, ArrowLeft, Shield, Zap, Cpu, BookOpen, FileCode, Star, MessageSquare, Send, Loader2, User, Play, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Badge from '../components/Badge';
import VideoPlayer from '../components/VideoPlayer';
import SafeImage from '../components/SafeImage';
import { SEOHelmet } from '../components/SEOHelmet';

import { useLocalization } from '../context/LocalizationContext';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { convertPrice } = useLocalization();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gateways, setGateways] = useState<any[]>([]);

  // Review states
  const [reviews, setReviews] = useState<any[]>([]);
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const [paymentSettings, setPaymentSettings] = useState({
    bkash: '01XXXXXXXXX',
    nagad: '01XXXXXXXXX',
    bkash_logo: 'https://raw.githubusercontent.com/shuvohabibi/bkash-logo/main/bkash.png',
    nagad_logo: 'https://raw.githubusercontent.com/shuvohabibi/nagad-logo/main/nagad.png',
    review_points: 50
  });

  const fetchProductData = async () => {
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
        review_points: parseInt(settingsMap.review_points) || 50
      });

      if (settingsMap.payment_gateways) {
        try {
          setGateways(JSON.parse(settingsMap.payment_gateways));
        } catch (e) {
          setGateways([]);
        }
      }
    }

    // Fetch product with publisher profile
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let productQuery = supabase
      .from('products')
      .select('*, profiles:publisher_id(full_name, role, avatar_url)');
    
    if (isUUID) {
      productQuery = productQuery.eq('id', id);
    } else {
      productQuery = productQuery.eq('slug', id);
    }
    
    const { data: productData } = await productQuery.single();
    
    if (productData) {
      setProduct(productData);

      // Fetch user's order for this product
      if (user) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', productData.id)
          .maybeSingle();
        if (orderData) setOrder(orderData);

        // Fetch progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', productData.id)
          .maybeSingle();
        
        if (progressData && productData.course_content?.length) {
          const percentage = Math.round((progressData.completed_lessons?.length / productData.course_content.length) * 100);
          setProgress(percentage);
        }
      }

      // Fetch reviews
      try {
        // Also fetch all profiles to calculate ranks
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, points')
          .order('points', { ascending: false });
        
        const rankMap: Record<string, number> = {};
        if (allProfiles) {
          allProfiles.forEach((p, index) => {
            rankMap[p.id] = index + 1;
          });
          setRanks(rankMap);
        }

        const { data: reviewData, error: reviewError } = await supabase
          .from('reviews')
          .select('*, profiles:user_id(full_name, role, points, avatar_url)')
          .eq('product_id', productData.id)
          .order('created_at', { ascending: false });
        
        if (reviewError) {
          // Fallback: try fetching without join
          const { data: simpleReviews } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', productData.id)
            .order('created_at', { ascending: false });
          
          if (simpleReviews) {
            const userIds = simpleReviews.map(r => r.user_id);
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, full_name, role, points, avatar_url')
              .in('id', userIds);
            
            const profileMap = (profileData || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as any);
            const reviewsWithProfiles = simpleReviews.map(r => ({
              ...r,
              profiles: profileMap[r.user_id]
            }));
            setReviews(reviewsWithProfiles);
          }
        } else if (reviewData) {
          setReviews(reviewData);
        }
      } catch (err) {
        console.error('Unexpected error fetching reviews:', err);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchProductData();
  }, [id, user]);

  useEffect(() => {
    if (product?.id) {
      const trackView = async () => {
        await supabase.from('product_views').insert({
          product_id: product.id,
          user_id: user?.id || null
        });
      };
      trackView();
    }
  }, [product?.id, user?.id]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to purchase');
    if (!profile) return toast.error('Please complete your profile first');
    if (!trxId.trim()) return toast.error('Please enter Transaction ID');

    setSubmitting(true);
    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      product_id: product?.id,
      trx_id: trxId,
      status: 'pending'
    });

    if (error) {
      toast.error('Order failed: ' + error.message);
    } else {
      toast.success('Order submitted! Waiting for approval.');
      setIsBuying(false);
      setTrxId('');
      fetchProductData();
    }
    setSubmitting(false);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to review');
    if (!profile?.full_name) return toast.error('Please complete your profile name before reviewing');
    if (order?.status !== 'approved') return toast.error('Only verified owners can review this asset');
    if (!userComment.trim()) return toast.error('Please enter a comment');

    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      product_id: product.id,
      rating: userRating,
      comment: userComment
    });

    if (error) {
      if (error.code === '23505') toast.error('You have already reviewed this asset');
      else toast.error('Review failed: ' + error.message);
    } else {
      // Award points for review
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();
      
      const currentPoints = currentProfile?.points || 0;
      await supabase
        .from('profiles')
        .update({ points: currentPoints + paymentSettings.review_points })
        .eq('id', user.id);

      toast.success(`Review submitted! +${paymentSettings.review_points} XP awarded.`);
      setUserComment('');
      // Refresh reviews
      try {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, points')
          .order('points', { ascending: false });
        
        const rankMap: Record<string, number> = {};
        if (allProfiles) {
          allProfiles.forEach((p, index) => {
            rankMap[p.id] = index + 1;
          });
          setRanks(rankMap);
        }

        const { data: newReviews, error: refreshError } = await supabase
          .from('reviews')
          .select('*, profiles:user_id(full_name, role, points, avatar_url)')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false });
        
        if (refreshError) {
          const { data: simpleNewReviews } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', product.id)
            .order('created_at', { ascending: false });
          
          if (simpleNewReviews) {
            const userIds = simpleNewReviews.map(r => r.user_id);
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, full_name, role, points, avatar_url')
              .in('id', userIds);
            
            const profileMap = (profileData || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as any);
            const reviewsWithProfiles = simpleNewReviews.map(r => ({
              ...r,
              profiles: profileMap[r.user_id]
            }));
            setReviews(reviewsWithProfiles);
          }
        } else if (newReviews) {
          setReviews(newReviews);
        }
      } catch (err) {
        console.error('Error refreshing reviews:', err);
      }
    }
    setSubmittingReview(false);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center font-mono text-cyber-purple">DECRYPTING_ASSET_DATA...</div>;
  if (!product) return <div className="text-center py-20 font-mono text-red-500">ASSET_NOT_FOUND_IN_DATABASE</div>;

  const CategoryIcon = product.category === 'course' ? BookOpen : product.category === 'file' ? FileCode : Cpu;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <SEOHelmet 
        title={product.title}
        description={product.description}
        image={product.image_url}
        keywords={`${product.title}, ${product.category}, cyber arsenal`}
      />
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-muted hover:text-cyber-purple transition-colors font-mono text-xs uppercase"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image / Video Player */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="cyber-card p-2"
        >
          <div className="relative aspect-video overflow-hidden bg-cyber-black">
            {product.category === 'course' && order?.status === 'approved' && product.course_content?.length === 1 ? (
              <VideoPlayer url={product.course_content[0].url} title={product.title} />
            ) : (
              <>
                <SafeImage 
                  src={product.image_url} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-cyber-black/80 text-xs font-mono text-cyber-purple border border-cyber-purple/30 uppercase flex items-center gap-2">
                  <CategoryIcon className="w-4 h-4" />
                  {product.category}
                </div>
                {product.category === 'course' && product.course_content?.length === 1 && (
                  <button 
                    onClick={() => setIsBuying(true)}
                    className="absolute inset-0 flex items-center justify-center bg-cyber-black/40 backdrop-blur-[2px] group/play transition-all hover:bg-cyber-black/30"
                  >
                    <div className="p-4 rounded-full bg-cyber-purple/20 border border-cyber-purple/50 group-hover/play:scale-110 group-hover/play:bg-cyber-purple/30 transition-all">
                      <Play className="w-12 h-12 text-cyber-purple fill-cyber-purple/20" />
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2 text-text-main">{product.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <Link 
                to={product.publisher_id ? `/user/${product.publisher_id}` : '#'}
                className="flex items-center gap-2 px-2 py-1 bg-card-main border border-border-main hover:border-cyber-purple transition-colors group/pub"
              >
                <div className="w-5 h-5 bg-bg-main border border-border-main overflow-hidden flex items-center justify-center group-hover/pub:border-cyber-purple transition-colors">
                  {(product.profiles as any)?.avatar_url ? (
                    <img src={(product.profiles as any).avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-3 h-3 text-text-muted group-hover/pub:text-cyber-purple transition-colors" />
                  )}
                </div>
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                  Publisher: <span className="text-text-main font-bold group-hover/pub:text-cyber-purple transition-colors">{product.profiles?.full_name || 'SYSTEM'}</span>
                </span>
              </Link>
              <Badge role={product.profiles?.role || 'admin'} showIcon={false} className="scale-75 origin-left" />
            </div>
            <div className="h-1 w-20 bg-cyber-purple" />
          </div>

          <div className="text-3xl font-mono font-bold text-cyber-purple flex items-center justify-between">
            {convertPrice(product.price)}
            {progress !== null && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-mono text-text-muted uppercase">Your_Progress</p>
                  <p className="text-xs font-bold text-cyber-purple">{progress}%</p>
                </div>
                <div className="w-24 h-1.5 bg-white/5 border border-border-main rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyber-purple shadow-[0_0_10px_rgba(188,19,254,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="cyber-card bg-card-main border-border-main"
          >
            <h3 className="text-xs font-mono text-text-muted uppercase mb-4 tracking-widest">Asset_Description</h3>
            <p className="text-text-main opacity-80 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </motion.div>

          {/* Advanced Specs & Features */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {product.features && product.features.length > 0 && (
              <div className="cyber-card bg-card-main border-border-main">
                <h3 className="text-[10px] font-mono text-cyber-purple uppercase mb-4 font-bold tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  Included_Features
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-main opacity-70">
                      <CheckCircle className="w-3 h-3 mt-0.5 text-cyber-purple" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.requirements && (
              <div className="cyber-card bg-card-main border-border-main">
                <h3 className="text-[10px] font-mono text-cyber-purple uppercase mb-4 font-bold tracking-widest flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  System_Requirements
                </h3>
                <p className="text-xs text-text-main opacity-70 leading-relaxed whitespace-pre-wrap italic">
                  {product.requirements}
                </p>
              </div>
            )}
          </motion.div>

          {/* Technical Metadata */}
          {product.metadata && Object.keys(product.metadata).length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="cyber-card bg-card-main border-border-main"
            >
              <h3 className="text-[10px] font-mono text-cyber-purple uppercase mb-4 font-bold tracking-widest flex items-center gap-2">
                <Cpu className="w-3 h-3" />
                Technical_Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(product.metadata).map(([key, value]) => (
                  <div key={key} className="p-3 border border-border-main bg-white/5">
                    <p className="text-[8px] font-mono text-text-muted opacity-50 uppercase mb-1">{key.replace('_', ' ')}</p>
                    <p className="text-xs font-bold text-text-main uppercase tracking-tighter">{value as string || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {product.demo_url && (
            <a 
              href={product.demo_url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-3 border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/10 transition-all font-mono text-[10px] uppercase tracking-widest"
            >
              <ExternalLink className="w-4 h-4" />
              Live_Preview_Protocol
            </a>
          )}

          {product.category !== 'course' && product.tutorial_url && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyber-purple uppercase tracking-widest">
                <Play className="w-4 h-4" />
                Related_Tutorial_Video
              </div>
              <div className="cyber-card p-2">
                <div className="aspect-video">
                  <VideoPlayer url={product.tutorial_url} title={`${product.title} Tutorial`} />
                </div>
              </div>
            </div>
          )}

          {product.category === 'course' && product.course_content && product.course_content.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono text-cyber-purple uppercase font-bold tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Course_Curriculum
                </h3>
                <span className="text-[10px] font-mono text-text-muted uppercase">{product.course_content.length} Lessons</span>
              </div>
              <div className="space-y-2">
                {product.course_content.map((lesson, i) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-white/5 border border-border-main rounded-lg group hover:border-cyber-purple/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center text-[10px] font-mono text-cyber-purple">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-main group-hover:text-cyber-purple transition-colors">{lesson.title}</p>
                        {lesson.duration && <p className="text-[9px] font-mono text-text-muted uppercase">{lesson.duration}</p>}
                      </div>
                    </div>
                    {order?.status === 'approved' ? (
                      <Link 
                        to={`/learning/${product.id}?lesson=${lesson.id}`}
                        className="p-2 text-cyber-purple hover:bg-cyber-purple/10 rounded-lg transition-all"
                      >
                        <Play className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Lock className="w-4 h-4 text-text-muted opacity-30" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6">
            {order?.status === 'approved' ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 flex items-center gap-3 text-green-500">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <p className="font-bold uppercase text-sm">Access Granted</p>
                    <p className="text-xs opacity-80">Your payment has been verified.</p>
                  </div>
                </div>
                {product.category === 'course' ? (
                  <Link 
                    to={`/learning/${product.id}`}
                    className="cyber-button w-full flex items-center justify-center gap-3 py-4 text-lg"
                  >
                    <Play className="w-6 h-6" />
                    START_LEARNING_PROTOCOL
                  </Link>
                ) : (
                  <a 
                    href={product.content_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="cyber-button w-full flex items-center justify-center gap-3 py-4 text-lg"
                  >
                    <ExternalLink className="w-6 h-6" />
                    DOWNLOAD / ACCESS CONTENT
                  </a>
                )}
              </div>
            ) : order?.status === 'pending' ? (
              <div className="p-6 border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 flex flex-col items-center gap-4 text-center">
                <Clock className="w-12 h-12 animate-pulse" />
                <div>
                  <p className="font-bold uppercase text-lg text-yellow-500">Verification Pending</p>
                  <p className="text-sm opacity-70 font-mono mt-1 text-yellow-500">TrxID: {order.trx_id}</p>
                  <p className="text-xs mt-4 text-text-muted">Our team is verifying your payment. This usually takes 5-30 minutes.</p>
                </div>
              </div>
            ) : (
              <Link 
                to={`/checkout/${product.id}`}
                className="cyber-button w-full flex items-center justify-center gap-3 py-4 text-lg"
              >
                <ShoppingCart className="w-6 h-6" />
                INITIALIZE PURCHASE
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isBuying && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cyber-black/95 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="cyber-card max-w-lg w-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/10 blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyber-purple/10 blur-3xl -z-10" />

              <div className="flex justify-between items-center mb-8 border-b border-cyber-purple/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyber-purple/20 flex items-center justify-center border border-cyber-purple/50">
                    <Shield className="w-6 h-6 text-cyber-purple animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-mono text-xl font-bold text-text-main tracking-tighter">SECURE_GATEWAY</h3>
                    <p className="text-[10px] font-mono text-cyber-purple uppercase tracking-widest">Protocol: 256-BIT_ENCRYPTION</p>
                  </div>
                </div>
                <button onClick={() => setIsBuying(false)} className="text-text-muted hover:text-red-500 transition-colors">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-text-muted uppercase tracking-widest">
                    <Zap className="w-3 h-3 text-cyber-purple" />
                    Step 1: Transfer Funds
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Legacy Gateways */}
                    <div className="relative group p-4 bg-card-main border border-border-main hover:border-pink-500/50 transition-all duration-300">
                      <div className="absolute top-2 right-2 w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity">
                        <img src={paymentSettings.bkash_logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <p className="font-bold text-pink-500 text-sm mb-1 uppercase tracking-tighter">Bkash Personal</p>
                      <p className="text-xl font-mono text-text-main tracking-widest">{paymentSettings.bkash}</p>
                      <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-widest">Method: Send Money</p>
                    </div>

                    <div className="relative group p-4 bg-card-main border border-border-main hover:border-orange-500/50 transition-all duration-300">
                      <div className="absolute top-2 right-2 w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity">
                        <img src={paymentSettings.nagad_logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <p className="font-bold text-orange-500 text-sm mb-1 uppercase tracking-tighter">Nagad Personal</p>
                      <p className="text-xl font-mono text-text-main tracking-widest">{paymentSettings.nagad}</p>
                      <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-widest">Method: Send Money</p>
                    </div>

                    {/* Dynamic Gateways */}
                    {gateways.map((g) => (
                      <div key={g.id} className="relative group p-4 bg-card-main border border-border-main hover:border-cyber-purple/50 transition-all duration-300">
                        {g.logo && (
                          <div className="absolute top-2 right-2 w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity">
                            <img src={g.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <p className="font-bold text-cyber-purple text-sm mb-1 uppercase tracking-tighter">{g.name}</p>
                        <p className="text-xl font-mono text-text-main tracking-widest">{g.details}</p>
                        <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-widest">Method: Transfer</p>
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
                          className="cyber-input pl-10 h-14 text-lg tracking-widest font-mono"
                          placeholder="8X9Y10Z..."
                        />
                        <FileCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-purple/50" />
                      </div>
                    </div>
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
                          UPLOADING_DATA...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-6 h-6" />
                          CONFIRM_AND_SUBMIT
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <div className="p-4 bg-cyber-purple/5 border border-cyber-purple/20 rounded-sm">
                  <p className="text-[10px] font-mono text-cyber-purple/80 leading-relaxed uppercase italic">
                    * Warning: Providing a fake TrxID will result in a permanent system ban. Verification takes 5-30 minutes.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t border-white/10">
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-cyber-purple" />
            <h2 className="text-xl font-bold uppercase tracking-tighter text-text-main">Asset_Reviews</h2>
          </div>
          
          {order?.status === 'approved' && (
            <form onSubmit={handleReview} className="cyber-card space-y-4">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Submit_Feedback</p>
              
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className={`transition-colors ${userRating >= star ? 'text-yellow-500' : 'text-text-muted opacity-20'}`}
                  >
                    <Star className={`w-6 h-6 ${userRating >= star ? 'fill-yellow-500' : ''}`} />
                  </button>
                ))}
              </div>

              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="ENTER_ENCRYPTED_FEEDBACK..."
                className="cyber-input min-h-[100px] py-3 text-xs"
              />

              <button 
                type="submit" 
                disabled={submittingReview}
                className="cyber-button w-full flex items-center justify-center gap-2 text-xs py-3"
              >
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                TRANSMIT_REVIEW
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {reviews.length === 0 ? (
            <div className="cyber-card p-12 text-center border-dashed border-border-main">
              <p className="text-text-muted opacity-50 font-mono uppercase tracking-widest italic mb-4">No feedback data detected for this asset.</p>
              <button 
                onClick={() => fetchProductData()}
                className="text-[10px] font-mono text-cyber-purple hover:underline uppercase"
              >
                [ RE-SCAN_DATABASE ]
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={review.id}
                  className="cyber-card p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Link to={`/user/${review.user_id}`} className="w-10 h-10 bg-card-main border border-border-main overflow-hidden flex items-center justify-center hover:border-cyber-purple transition-colors">
                        {review.profiles?.avatar_url ? (
                          <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-5 h-5 text-text-muted opacity-50" />
                        )}
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/user/${review.user_id}`} className="font-bold text-xs uppercase tracking-tight text-text-main hover:text-cyber-purple transition-colors">
                            {review.profiles?.full_name || 'ANONYMOUS_USER'}
                          </Link>
                          <Badge role={review.profiles?.role || 'user'} showIcon={false} className="scale-75 origin-left" />
                          <div className="flex items-center gap-2 ml-1">
                            <span className="text-[9px] font-mono text-cyber-purple bg-cyber-purple/10 px-1 border border-cyber-purple/20">
                              RANK: #{ranks[review.user_id] || '--'}
                            </span>
                            <span className="text-[9px] font-mono text-text-muted">
                              XP: {review.profiles?.points || 0}
                            </span>
                          </div>
                        </div>
                        <p className="text-[8px] font-mono text-text-muted opacity-40 uppercase">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${review.rating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-text-muted opacity-20'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-text-main opacity-70 leading-relaxed italic">"{review.comment}"</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
