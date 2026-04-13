import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Megaphone, Info, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  created_at: string;
}

export const AnnouncementsMarquee: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data) setAnnouncements(data);
    };
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5';
      case 'danger': return 'text-red-500 border-red-500/30 bg-red-500/5';
      case 'success': return 'text-green-500 border-green-500/30 bg-green-500/5';
      default: return 'text-cyber-purple border-cyber-purple/30 bg-cyber-purple/5';
    }
  };

  return (
    <div className="w-full bg-bg-main border-b border-border-main py-2 overflow-hidden">
      <div className="container mx-auto px-4 flex items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-text-muted opacity-40 uppercase whitespace-nowrap border-r border-border-main pr-4">
          <Megaphone className="w-3 h-3 animate-pulse" />
          SYSTEM_BROADCAST
        </div>
        <div className="flex-1 relative h-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`absolute inset-0 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest ${getTypeStyles(current.type)}`}
            >
              <span className="font-bold whitespace-nowrap">[{current.title}]</span>
              <span className="opacity-80 truncate">{current.content}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const AnnouncementsList: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data) setAnnouncements(data);
    };
    fetchAnnouncements();
  }, []);

  if (announcements.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'danger': return <AlertCircle className="w-4 h-4" />;
      case 'success': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5 text-yellow-500';
      case 'danger': return 'border-red-500/30 bg-red-500/5 text-red-500';
      case 'success': return 'border-green-500/30 bg-green-500/5 text-green-500';
      default: return 'border-cyber-purple/30 bg-cyber-purple/5 text-cyber-purple';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono font-bold text-text-muted opacity-30 uppercase tracking-[0.2em] flex items-center gap-2">
        <Megaphone className="w-3 h-3" />
        GLOBAL_ANNOUNCEMENTS
      </h3>
      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className={`p-4 border ${getTypeStyles(a.type)} flex gap-4`}>
            <div className="mt-0.5">{getIcon(a.type)}</div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight mb-1">{a.title}</h4>
              <p className="text-[11px] opacity-80 leading-relaxed">{a.content}</p>
              <p className="text-[9px] font-mono opacity-40 mt-2">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
