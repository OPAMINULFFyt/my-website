import React from 'react';
import { Link } from 'react-router-dom';
import { Product, Order } from '../types';
import { formatPrice } from '../lib/utils';
import { ShoppingCart, Star, Shield, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import SafeImage from './SafeImage';

import { useLocalization } from '../context/LocalizationContext';

interface BannerCardProps {
  product: Product;
  order?: Order;
}

const BannerCard: React.FC<BannerCardProps> = ({ product, order }) => {
  const { convertPrice } = useLocalization();
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative group overflow-hidden bg-card-main border border-border-main hover:border-cyber-purple/50 transition-all duration-500 rounded-2xl h-full"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-purple/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-cyber-purple/10 transition-all" />
      
      <div className="flex flex-col lg:flex-row h-full">
        {/* Large Banner Image */}
        <Link 
          to={`/product/${product.slug || product.id}`}
          className="relative w-full lg:w-3/5 aspect-video lg:aspect-auto overflow-hidden border-b lg:border-b-0 lg:border-r border-border-main rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none"
        >
          <SafeImage 
            src={product.image_url} 
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-main via-transparent to-transparent opacity-60" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <div className="px-3 py-1 bg-cyber-purple text-[10px] font-mono font-bold text-white uppercase tracking-[0.2em] rounded-lg">
              <span>RECOMMENDED_PROTOCOL</span>
            </div>
            {product.is_featured && (
              <div className="px-3 py-1 bg-yellow-500 text-[10px] font-mono font-bold text-black uppercase tracking-[0.2em] rounded-lg">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-black" />
                  PREMIUM_ASSET
                </span>
              </div>
            )}
            {product.original_price && product.original_price > product.price && (
              <div className="px-3 py-1 bg-cyber-pink text-[10px] font-mono font-bold text-white uppercase tracking-[0.2em] rounded-lg shadow-[0_0_15px_rgba(255,0,255,0.3)]">
                <span>SALE_PROTOCOL_ACTIVE</span>
              </div>
            )}
          </div>
        </Link>

        {/* Content Details */}
        <div className="w-full lg:w-2/5 p-6 md:p-8 flex flex-col justify-between space-y-4 min-h-[320px] lg:min-h-0">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono text-cyber-purple uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Sector: {product.category}
              </div>
              <Link 
                to={product.publisher_id ? `/user/${product.publisher_id}` : '#'}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-purple animate-pulse" />
                Pub: {product.profiles?.full_name || 'OP_AMINUL_FF'}
              </Link>
            </div>
            <Link to={`/product/${product.slug || product.id}`}>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter uppercase leading-tight text-text-main group-hover:text-cyber-purple transition-colors line-clamp-2">
                {product.title}
              </h3>
            </Link>
            
            <Link to={`/product/${product.slug || product.id}`} className="block">
              <p className="text-xs md:text-sm text-text-muted font-mono leading-relaxed line-clamp-3 uppercase tracking-wide hover:text-text-main transition-colors min-h-[3em]">
                {product.description}
              </p>
            </Link>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="px-4 py-2 bg-card-main border border-border-main rounded-xl">
                <span className="block text-[9px] font-mono text-text-muted opacity-50 uppercase">Asset_Value</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold text-text-main">{convertPrice(product.price)}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-xs font-mono text-text-muted line-through opacity-40">
                      {convertPrice(product.original_price)}
                    </span>
                  )}
                </div>
              </div>
              
              <Link 
                to={`/product/${product.slug || product.id}`}
                className="cyber-button px-6 py-2.5 flex items-center gap-2 group/btn text-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="font-bold uppercase tracking-widest">
                  {order?.status === 'approved' ? 'ACCESS' : 'INITIALIZE'}
                </span>
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="pt-4 flex items-center gap-4 border-t border-border-main">
              <div className="flex items-center gap-2 text-[8px] font-mono text-text-muted uppercase">
                <Shield className="w-3 h-3 text-green-500" />
                Verified
              </div>
              <div className="flex items-center gap-2 text-[8px] font-mono text-text-muted uppercase">
                <Zap className="w-3 h-3 text-yellow-500" />
                Instant
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-purple/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
    </motion.div>
  );
};

export default BannerCard;
