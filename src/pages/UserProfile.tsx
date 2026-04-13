import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Profile, Product } from '../types';
import { User, MapPin, Phone, Calendar, Loader2, Package, ExternalLink, Shield, ArrowLeft, Facebook, Youtube, Send, MessageCircle } from 'lucide-react';
import Badge from '../components/Badge';
import { motion } from 'motion/react';
import SafeImage from '../components/SafeImage';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasedProducts, setPurchasedProducts] = useState<Product[]>([]);
  const [rank, setRank] = useState<number | string>('--');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile(profileData);
          
          // Fetch approved orders for this user to show "Assets Owned"
          // We wrap this in a separate try-catch because it might fail due to RLS
          try {
            const { data: orders } = await supabase
              .from('orders')
              .select('product_id, products(*)')
              .eq('user_id', id)
              .eq('status', 'approved');

            if (orders) {
              const products = orders.map((o: any) => o.products).filter(Boolean);
              setPurchasedProducts(products);
            }
          } catch (err) {
            console.error('Error fetching orders:', err);
            // Non-critical error, we can still show the profile
          }

          // Fetch rank
          try {
            const { data: allProfiles } = await supabase
              .from('profiles')
              .select('id, points')
              .order('points', { ascending: false });
            
            if (allProfiles) {
              const userRank = allProfiles.findIndex(p => p.id === id) + 1;
              setRank(userRank || '--');
            }
          } catch (err) {
            console.error('Error fetching rank:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-cyber-purple animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20 cyber-card">
      <Shield className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-20" />
      <h2 className="text-2xl font-bold uppercase tracking-tighter">ERROR: PROFILE_NOT_FOUND</h2>
      <p className="text-white/40 font-mono mt-2">The requested operative ID does not exist in the network.</p>
      <Link to="/" className="cyber-button mt-8 inline-block">Return_To_Base</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/50 hover:text-cyber-purple transition-colors font-mono text-xs uppercase"
      >
        <ArrowLeft className="w-4 h-4" />
        Back_To_Previous
      </button>

      {/* Profile Header */}
      <div className="cyber-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-purple/5 blur-[100px] -z-10" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-32 h-32 bg-cyber-purple/10 border border-cyber-purple/30 flex items-center justify-center relative group overflow-hidden rounded-xl">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-16 h-16 text-cyber-purple" />
            )}
            <div className="absolute inset-0 border border-cyber-purple/50 scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          </div>
          
          <div className="space-y-4 flex-grow">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">{profile.full_name}</h1>
              <Badge role={profile.role} />
            </div>

            {profile.bio && (
              <p className="text-sm text-white/60 font-mono italic max-w-2xl">
                "{profile.bio}"
              </p>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-mono text-white/40 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyber-purple" />
                {profile.address || 'LOCATION_UNKNOWN'}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyber-purple" />
                Joined: {new Date(profile.updated_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyber-purple" />
                ID: {profile.id.slice(0, 8)}...
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              {profile.facebook_url && (
                <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 border border-white/10 text-white/40 hover:text-cyber-purple hover:border-cyber-purple transition-all">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {profile.youtube_url && (
                <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 border border-white/10 text-white/40 hover:text-cyber-purple hover:border-cyber-purple transition-all">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {profile.telegram_url && (
                <a href={profile.telegram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 border border-white/10 text-white/40 hover:text-cyber-purple hover:border-cyber-purple transition-all">
                  <Send className="w-4 h-4" />
                </a>
              )}
              {profile.whatsapp_number && (
                <a href={`https://wa.me/${profile.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 border border-white/10 text-white/40 hover:text-cyber-purple hover:border-cyber-purple transition-all">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="text-right bg-white/5 p-6 border border-white/10 min-w-[150px]">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-mono text-white/30 uppercase">Network_XP</p>
              <p className="text-[10px] font-mono text-cyber-purple uppercase">Rank: #{rank}</p>
            </div>
            <p className="text-4xl font-black text-cyber-purple tracking-tighter">{profile.points || 0}</p>
          </div>
        </div>
      </div>

      {/* Assets Owned */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Package className="w-6 h-6 text-cyber-purple" />
          <h2 className="text-xl font-bold uppercase tracking-tighter">Authorized_Assets</h2>
          <div className="h-px flex-grow bg-white/10" />
        </div>

        {purchasedProducts.length === 0 ? (
          <div className="cyber-card p-12 text-center border-dashed border-white/10">
            <p className="text-white/20 font-mono uppercase tracking-widest italic">No assets detected in this operative's inventory.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory pb-6 gap-6 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 hide-scrollbar">
            {purchasedProducts.map((product, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={product.id}
                className="flex-shrink-0 w-[280px] snap-start lg:w-auto cyber-card group hover:border-cyber-purple/50 transition-all"
              >
                <div className="aspect-video bg-white/5 mb-4 overflow-hidden relative">
                  <SafeImage 
                    src={product.image_url} 
                    alt={product.title}
                    className="w-full h-full opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cyber-black to-transparent pointer-events-none" />
                </div>
                <div className="px-4 pb-4">
                  <h3 className="font-bold uppercase tracking-tight mb-4 line-clamp-1">{product.title}</h3>
                  <Link 
                    to={`/product/${product.id}`}
                    className="w-full py-2 border border-white/10 text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                  >
                    View_Asset_Specs <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
