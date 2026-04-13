import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Order } from '../types';
import { useAuth } from '../App';
import ProductCard from '../components/ProductCard';
import BannerCard from '../components/BannerCard';
import { Shield, Zap, Cpu, BookOpen, FileCode, Search, Filter, ArrowUpDown, Activity, Terminal, Star, Users, Download, CreditCard, Globe, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnnouncementsMarquee } from '../components/Announcements';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  useEffect(() => {
    setSearchQuery(searchParam);
  }, [searchParam]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    operators: '0',
    assets: '0',
    transactions: '0'
  });

  const featuredRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 400;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [sections, setSections] = useState<{
    featured: Product[];
    recommended: Product[];
    top: Product[];
    new: Product[];
  }>({ featured: [], recommended: [], top: [], new: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch all products
      const { data: productsData } = await supabase
        .from('products')
        .select('*, profiles:publisher_id(full_name, role, avatar_url)');
      
      if (!productsData) {
        setLoading(false);
        return;
      }
      setProducts(productsData);

      // 2. Featured Products
      const featured = productsData.filter(p => p.is_featured).slice(0, 4);

      // 2. Fetch stats for "Top Products" (Rating & Demand)
      const { data: reviewsData } = await supabase.from('reviews').select('product_id, rating');
      const { data: ordersCountData } = await supabase.from('orders').select('product_id');

      const productStats: Record<string, { totalRating: number, count: number, orders: number }> = {};
      
      reviewsData?.forEach(r => {
        if (!productStats[r.product_id]) productStats[r.product_id] = { totalRating: 0, count: 0, orders: 0 };
        productStats[r.product_id].totalRating += r.rating;
        productStats[r.product_id].count += 1;
      });

      ordersCountData?.forEach(o => {
        if (!productStats[o.product_id]) productStats[o.product_id] = { totalRating: 0, count: 0, orders: 0 };
        productStats[o.product_id].orders += 1;
      });

      const scoredProducts = productsData.map(p => {
        const stats = productStats[p.id] || { totalRating: 0, count: 0, orders: 0 };
        const avgRating = stats.count > 0 ? stats.totalRating / stats.count : 0;
        const score = (avgRating * 10) + (stats.orders * 5);
        return { ...p, score };
      }).sort((a, b) => b.score - a.score);

      // 3. Fetch user behavior for "Recommended"
      let recommended: Product[] = [];
      if (user) {
        const { data: userWishlist } = await supabase.from('wishlist').select('product_id').eq('user_id', user.id);
        const { data: userOrders } = await supabase.from('orders').select('product_id').eq('user_id', user.id);
        const { data: userViews } = await supabase.from('product_views').select('product_id').eq('user_id', user.id).limit(50);
        
        const boughtIds = new Set(userOrders?.map(o => o.product_id) || []);
        const interestedIds = new Set([
          ...(userWishlist?.map(w => w.product_id) || []),
          ...(userViews?.map(v => v.product_id) || [])
        ]);

        // Find categories user is interested in
        const interestedCategories = new Set<string>();
        productsData.forEach(p => {
          if (interestedIds.has(p.id) || boughtIds.has(p.id)) {
            interestedCategories.add(p.category);
          }
        });

        recommended = productsData
          .filter(p => !boughtIds.has(p.id)) // Don't recommend what they already bought
          .map(p => {
            let rScore = 0;
            if (interestedIds.has(p.id)) rScore += 50;
            if (interestedCategories.has(p.category)) rScore += 20;
            return { ...p, rScore };
          })
          .sort((a, b) => b.rScore - a.rScore)
          .slice(0, 4);
      }

      // Fallback for recommended if not enough or guest
      if (recommended.length < 4) {
        const { data: globalViews } = await supabase.from('product_views').select('product_id');
        const viewCounts: Record<string, number> = {};
        globalViews?.forEach(v => {
          viewCounts[v.product_id] = (viewCounts[v.product_id] || 0) + 1;
        });

        const mostViewed = productsData
          .filter(p => !recommended.find(r => r.id === p.id))
          .map(p => ({ ...p, views: viewCounts[p.id] || 0 }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 4 - recommended.length);
        
        recommended = [...recommended, ...mostViewed];
      }

      setSections({
        featured: featured,
        new: productsData.slice(0, 20),
        top: scoredProducts.slice(0, 20),
        recommended: recommended
      });

      // 4. Fetch Real Stats
      const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      
      // For operators, we'll use a realistic count based on orders or users
      setStats({
        operators: `${(ordersCount || 0) + (productsCount || 0)}`,
        assets: `${productsCount || 0}`,
        transactions: `${ordersCount || 0}`
      });

      if (user) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id);
        if (ordersData) setUserOrders(ordersData);

        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id);
        if (progressData) setUserProgress(progressData);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const filteredProducts = products
    .filter(p => filter === 'all' ? true : p.category === filter)
    .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const isSearching = searchQuery !== '' || filter !== 'all';

  const setFilter = (newFilter: string) => {
    if (newFilter === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', newFilter);
    }
    setSearchParams(searchParams);
  };

  const categories = [
    { id: 'all', label: 'All Assets', icon: Zap },
    { id: 'course', label: 'Courses', icon: BookOpen },
    { id: 'file', label: 'Project Files', icon: FileCode },
    { id: 'hardware', label: 'Hardware Kits', icon: Cpu },
  ];

  return (
    <div className="pb-20">
      <div className="container mx-auto px-4 space-y-2">
        <AnnouncementsMarquee />
        
        {/* Hero Section */}
        <section className="relative pt-8 pb-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(188,19,254,0.15),transparent_70%)]" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-purple/50 to-transparent" />
          
          <div className="relative z-10 text-center space-y-6">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: 0.1 
              }}
              className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none"
            >
              THE <span className="text-transparent bg-clip-text bg-gradient-to-b from-text-main to-text-main/20">CYBER</span> <br />
              <span className="text-cyber-purple cyber-glow">ARSENAL</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl mx-auto text-text-muted text-sm font-mono uppercase tracking-widest leading-relaxed"
            >
              Access restricted digital assets, encrypted knowledge, and high-performance hardware modules.
            </motion.p>
          </div>
        </section>
      </div>

      {/* Advanced Controls */}
      <div className="sticky top-16 z-40 py-2 bg-card-main border-y border-border-main mb-2">
        <div className="px-4 md:px-6 flex flex-col lg:flex-row gap-6 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-30 group-focus-within:text-cyber-purple transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH_DATABASE..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim()) {
                  searchParams.set('search', val.trim());
                } else {
                  searchParams.delete('search');
                }
                setSearchParams(searchParams);
              }}
              className="cyber-input pl-10 h-11 bg-card-main border-border-main focus:border-cyber-purple/50 transition-all"
            />
          </div>

          {/* Category Filters (Desktop) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:flex items-center gap-2 p-1 bg-card-main border border-border-main rounded-xl"
          >
            {categories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${
                  filter === cat.id 
                    ? 'bg-cyber-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.3)]' 
                    : 'text-text-muted hover:text-text-main hover:bg-white/5'
                }`}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Sorting */}
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted opacity-30 uppercase">
              <ArrowUpDown className="w-3 h-3" />
              Sort_By:
            </div>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-bg-main border border-border-main text-text-main text-[10px] font-bold uppercase tracking-widest px-3 py-2 outline-none focus:border-cyber-purple/50 transition-all cursor-pointer rounded-lg"
            >
              <option value="newest" className="bg-bg-main text-text-main">Latest_Release</option>
              <option value="price-low" className="bg-bg-main text-text-main">Value: Low_to_High</option>
              <option value="price-high" className="bg-bg-main text-text-main">Value: High_to_Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="cyber-card h-80 animate-pulse bg-card-main" />
            ))}
          </div>
        ) : isSearching ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  order={userOrders.find(o => o.product_id === product.id)}
                  progress={userProgress.find(p => p.product_id === product.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-8">
            {/* System Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active_Operators', value: stats.operators, icon: Users, color: 'text-cyber-purple' },
                { label: 'Assets_Deployed', value: stats.assets, icon: Download, color: 'text-blue-500' },
                { label: 'Secure_Transactions', value: stats.transactions, icon: CreditCard, color: 'text-green-500' },
                { label: 'Global_Uptime', value: '99.9%', icon: Globe, color: 'text-yellow-500' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    delay: i * 0.1 
                  }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="cyber-card p-6 flex flex-col items-center text-center space-y-2 group hover:border-border-main transition-all"
                >
                  <stat.icon className={`w-6 h-6 ${stat.color} mb-2 group-hover:scale-110 transition-transform`} />
                  <p className="text-2xl font-black tracking-tighter text-text-main">{stat.value}</p>
                  <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </section>

            {/* Featured Section */}
            {sections.featured.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-l-4 border-cyber-purple pl-4">
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter text-text-main">Featured_Assets</h2>
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Hand-picked premium modules for elite operators</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => scroll(featuredRef, 'left')}
                      className="p-2 bg-white/5 border border-border-main hover:border-cyber-purple transition-all rounded-lg hidden md:block"
                    >
                      <ChevronLeft className="w-4 h-4 text-text-muted hover:text-cyber-purple" />
                    </button>
                    <button 
                      onClick={() => scroll(featuredRef, 'right')}
                      className="p-2 bg-white/5 border border-border-main hover:border-cyber-purple transition-all rounded-lg hidden md:block"
                    >
                      <ChevronRight className="w-4 h-4 text-text-muted hover:text-cyber-purple" />
                    </button>
                    <Star className="w-5 h-5 text-cyber-purple animate-pulse" />
                  </div>
                </div>
                <div 
                  ref={featuredRef}
                  className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 cyber-scrollbar-h -mx-4 px-4 md:mx-0 md:px-0 items-stretch"
                >
                  {sections.featured.map((product) => (
                    <div key={product.id} className="flex-none w-[75vw] sm:w-[280px] md:w-[320px] snap-start">
                      <ProductCard 
                        product={product} 
                        order={userOrders.find(o => o.product_id === product.id)}
                        progress={userProgress.find(p => p.product_id === product.id)}
                      />
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Recommended Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-l-4 border-cyber-purple pl-4">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tighter text-text-main">Recommended_For_You</h2>
                  <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Personalized system analysis based on your activity</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => scroll(recommendedRef, 'left')}
                    className="p-2 bg-white/5 border border-border-main hover:border-cyber-purple transition-all rounded-lg hidden md:block"
                  >
                    <ChevronLeft className="w-4 h-4 text-text-muted hover:text-cyber-purple" />
                  </button>
                  <button 
                    onClick={() => scroll(recommendedRef, 'right')}
                    className="p-2 bg-white/5 border border-border-main hover:border-cyber-purple transition-all rounded-lg hidden md:block"
                  >
                    <ChevronRight className="w-4 h-4 text-text-muted hover:text-cyber-purple" />
                  </button>
                  <Terminal className="w-5 h-5 text-cyber-purple animate-pulse" />
                </div>
              </div>
              <div 
                ref={recommendedRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 cyber-scrollbar-h -mx-4 px-4 md:mx-0 md:px-0 items-stretch"
              >
                {sections.recommended.map((product) => (
                  <div key={product.id} className="flex-none w-[85vw] md:w-[700px] snap-start">
                    <BannerCard 
                      product={product} 
                      order={userOrders.find(o => o.product_id === product.id)}
                    />
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Top Products Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-l-4 border-yellow-500 pl-4">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tighter text-yellow-500">Top_Tier_Assets</h2>
                  <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Most valuable and high-performance modules</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => scroll(topRef, 'left')}
                    className="p-2 bg-white/5 border border-border-main hover:border-cyber-purple transition-all rounded-lg hidden md:block"
                  >
                    <ChevronLeft className="w-4 h-4 text-text-muted hover:text-cyber-purple" />
                  </button>
                  <button 
                    onClick={() => scroll(topRef, 'right')}
                    className="p-2 bg-white/5 border border-border-main hover:border-cyber-purple transition-all rounded-lg hidden md:block"
                  >
                    <ChevronRight className="w-4 h-4 text-text-muted hover:text-cyber-purple" />
                  </button>
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div 
                ref={topRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 cyber-scrollbar-h -mx-4 px-4 md:mx-0 md:px-0 items-stretch"
              >
                {sections.top.map((product) => (
                  <div key={product.id} className="flex-none w-[70vw] sm:w-[280px] md:w-[300px] snap-start">
                    <ProductCard 
                      product={product} 
                      order={userOrders.find(o => o.product_id === product.id)}
                      progress={userProgress.find(p => p.product_id === product.id)}
                    />
                  </div>
                ))}
              </div>
            </motion.section>

            {/* New Products Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-l-4 border-blue-500 pl-4">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tighter text-blue-500">Latest_Infiltrations</h2>
                  <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Recently decrypted and added to database</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => scroll(latestRef, 'left')}
                    className="p-2 bg-white/5 border border-border-main hover:border-cyber-purple transition-all rounded-lg hidden md:block"
                  >
                    <ChevronLeft className="w-4 h-4 text-text-muted hover:text-cyber-purple" />
                  </button>
                  <button 
                    onClick={() => scroll(latestRef, 'right')}
                    className="p-2 bg-white/5 border border-border-main hover:border-cyber-purple transition-all rounded-lg hidden md:block"
                  >
                    <ChevronRight className="w-4 h-4 text-text-muted hover:text-cyber-purple" />
                  </button>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div 
                ref={latestRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 cyber-scrollbar-h -mx-4 px-4 md:mx-0 md:px-0 items-stretch"
              >
                {sections.new.map((product) => (
                  <div key={product.id} className="flex-none w-[70vw] sm:w-[280px] md:w-[300px] snap-start">
                    <ProductCard 
                      product={product} 
                      order={userOrders.find(o => o.product_id === product.id)}
                      progress={userProgress.find(p => p.product_id === product.id)}
                    />
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Trust & Features Section */}
            <section className="py-20 border-t border-border-main">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  { 
                    title: 'Instant_Deployment', 
                    desc: 'Assets are decrypted and delivered to your terminal immediately after verification.',
                    icon: Zap,
                    color: 'text-yellow-500'
                  },
                  { 
                    title: 'Encrypted_Security', 
                    desc: 'Multi-layer encryption protocols ensure your transactions and data remain anonymous.',
                    icon: Shield,
                    color: 'text-cyber-purple'
                  },
                  { 
                    title: 'Elite_Support', 
                    desc: 'Our technical operatives are standing by 24/7 to assist with system integration.',
                    icon: MessageCircle,
                    color: 'text-blue-500'
                  }
                ].map((feature, i) => (
                  <div key={i} className="space-y-4 group">
                    <div className={`w-12 h-12 bg-card-main border border-border-main flex items-center justify-center group-hover:border-${feature.color.split('-')[1]}-500/50 transition-all rounded-xl`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-bold uppercase tracking-tighter text-text-main">{feature.title}</h3>
                    <p className="text-xs text-text-muted font-mono leading-relaxed uppercase tracking-wide">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {isSearching && filteredProducts.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 border border-dashed border-border-main"
          >
            <Shield className="w-16 h-16 text-cyber-purple opacity-20 mx-auto mb-6" />
            <p className="text-text-muted opacity-40 font-mono text-sm uppercase tracking-[0.3em]">No_Assets_Detected_In_Sector</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Home;

