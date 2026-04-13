import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GlobalBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase.from('settings').select('*').eq('key', 'global_announcement').maybeSingle();
      if (data && data.value) {
        setAnnouncement(data.value);
      }
    };
    fetchAnnouncement();
  }, []);

  if (!announcement || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-cyber-purple text-white py-2 px-4 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
        <div className="container mx-auto flex items-center justify-center gap-3 relative z-10">
          <Megaphone className="w-4 h-4 animate-bounce" />
          <p className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-center">
            {announcement}
          </p>
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute right-0 p-1 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalBanner;
