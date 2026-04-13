import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, Order } from '../types';
import { useAuth } from '../App';
import { formatPrice } from '../lib/utils';
import { ShoppingCart, ExternalLink, Lock, CheckCircle, Clock, XCircle, Eye, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

import SafeImage from './SafeImage';

import { useLocalization } from '../context/LocalizationContext';

interface ProductCardProps {
  product: Product;
  order?: Order;
  progress?: {
    completed_lessons: string[];
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product, order, progress }) => {
  const { user, profile } = useAuth();
  const { convertPrice } = useLocalization();
  const [isBuying, setIsBuying] = useState(false);
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const checkLike = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      if (data) setIsLiked(true);
    };
    checkLike();
  }, [user, product.id]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error('Please login to wishlist');
    
    setLikeLoading(true);
    if (isLiked) {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);
      if (!error) setIsLiked(false);
    } else {
      const { error } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: product.id });
      if (!error) setIsLiked(true);
    }
    setLikeLoading(false);
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to purchase');
    if (!profile) return toast.error('Please complete your profile first');
    if (!trxId.trim()) return toast.error('Please enter Transaction ID');

    setSubmitting(true);
    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      product_id: product.id,
      trx_id: trxId,
      status: 'pending'
    });

    if (error) {
      toast.error('Order failed: ' + error.message);
    } else {
      toast.success('Order submitted! Waiting for approval.');
      setIsBuying(false);
      setTrxId('');
      // Refresh page or state would be better, but for now:
      window.location.reload();
    }
    setSubmitting(false);
  };

  const isApproved = order?.status === 'approved';
  const isPending = order?.status === 'pending';

  const progressPercentage = product.category === 'course' && product.course_content?.length && progress
    ? Math.round((progress.completed_lessons.length / product.course_content.length) * 100)
    : 0;

  const getStatusIcon = () => {
    if (!order) return null;
    switch (order.status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="cyber-card group relative flex flex-col h-full bg-card-main border-border-main hover:border-cyber-purple/50 transition-all duration-500"
    >
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-purple opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-purple opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-purple opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-purple opacity-0 group-hover:opacity-100 transition-opacity" />

      <Link to={`/product/${product.slug || product.id}`} className="block relative aspect-video mb-4 overflow-hidden border-b border-border-main rounded-t-xl">
        <SafeImage 
          src={product.image_url} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
        />

        {/* Category Badge */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {product.is_featured && (
            <div className="px-2 py-1 bg-yellow-500 text-[9px] font-mono text-black font-bold border border-yellow-400 uppercase tracking-tighter shadow-[0_0_10px_rgba(234,179,8,0.5)] rounded-sm">
              FEATURED_ASSET
            </div>
          )}
          {product.stock_status && product.stock_status !== 'in_stock' && (
            <div className={`px-2 py-1 text-[9px] font-mono font-bold border uppercase tracking-tighter rounded-sm ${
              product.stock_status === 'out_of_stock' ? 'bg-red-500/80 border-red-400 text-white' : 'bg-blue-500/80 border-blue-400 text-white'
            }`}>
              {product.stock_status.replace('_', ' ')}
            </div>
          )}
          <div className="px-2 py-1 bg-bg-main text-[9px] font-mono text-cyber-purple border border-cyber-purple/30 uppercase tracking-tighter rounded-sm">
            SEC_{product.category.substring(0, 3)}
          </div>
          <button 
            onClick={toggleLike}
            disabled={likeLoading}
            className={`p-2 bg-bg-main border border-border-main hover:border-cyber-purple transition-all rounded-lg ${isLiked ? 'text-cyber-purple' : 'text-text-muted'}`}
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-cyber-purple' : ''}`} />
          </button>
        </div>

        {/* Price Tag Overlay */}
        <motion.div 
          initial={{ x: -100 }}
          animate={{ x: -4 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
          className="absolute bottom-0 left-0 px-3 py-1 bg-cyber-purple text-white text-[10px] font-mono font-bold rounded-r-lg"
        >
          <span className="inline-block">{convertPrice(product.price)}</span>
        </motion.div>
      </Link>

      <div className="px-3 pb-3 md:px-4 md:pb-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <div className="flex flex-col">
            <Link to={`/product/${product.slug || product.id}`}>
              <h3 className="text-[11px] md:text-lg font-bold tracking-tight text-text-main group-hover:text-cyber-purple transition-colors line-clamp-2 uppercase leading-tight">
                {product.title}
              </h3>
            </Link>
            {/* Publisher Badge */}
            <Link 
              to={product.publisher_id ? `/user/${product.publisher_id}` : '#'} 
              className="flex items-center gap-2 mt-1 hover:opacity-80 transition-opacity group/pub-link"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-5 h-5 bg-bg-main border border-border-main overflow-hidden flex items-center justify-center shrink-0 group-hover/pub-link:border-cyber-purple transition-colors">
                {(product.profiles as any)?.avatar_url ? (
                  <img src={(product.profiles as any).avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-cyber-purple animate-pulse" />
                )}
              </div>
              <span className="text-[8px] md:text-[9px] font-mono text-text-muted uppercase tracking-wider">
                Pub: <span className="text-cyber-purple/80">{product.profiles?.full_name || 'OP_AMINUL_FF'}</span>
              </span>
            </Link>
          </div>
          {getStatusIcon()}
        </div>

        <p className="text-[10px] md:text-xs text-text-muted mb-3 md:mb-6 line-clamp-2 min-h-[3.3em] font-mono leading-relaxed">
          {product.description}
        </p>
        
        <div className="mt-auto pt-2 md:pt-4 border-t border-border-main flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[7px] md:text-[9px] font-mono text-text-muted opacity-50 uppercase truncate">Value</span>
            <span className="text-[10px] md:text-sm font-mono font-bold text-cyber-purple truncate">{convertPrice(product.price)}</span>
          </div>

          {product.category === 'course' && progressPercentage > 0 && (
            <div className="flex flex-col items-end min-w-0">
              <span className="text-[7px] md:text-[9px] font-mono text-text-muted opacity-50 uppercase truncate">Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-12 md:w-16 h-1 bg-white/5 border border-border-main rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyber-purple shadow-[0_0_8px_rgba(188,19,254,0.5)]" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-[8px] md:text-[10px] font-mono text-cyber-purple font-bold">{progressPercentage}%</span>
              </div>
            </div>
          )}

          <Link 
            to={`/product/${product.slug || product.id}`}
            className="relative overflow-hidden px-2 md:px-4 py-1.5 md:py-2 bg-card-main border border-border-main text-[8px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-cyber-purple hover:border-cyber-purple hover:text-white transition-all duration-300 group/btn rounded-lg shrink-0"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isApproved ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  {product.category === 'course' ? (progressPercentage > 0 ? 'Continue' : 'Start') : 'Access'}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3" />
                  {isPending ? 'Verifying' : 'Initialize'}
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-cyber-purple/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
