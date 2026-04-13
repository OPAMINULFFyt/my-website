import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { Trophy, Medal, Crown, TrendingUp, User, Search, Zap, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import SafeImage from '../components/SafeImage';

const Leaderboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(50);
      
      if (data) setProfiles(data);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const filteredProfiles = profiles.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateLevel = (points: number) => {
    if (points < 500) return { level: 1, name: 'NEOPHYTE', color: 'text-text-muted' };
    if (points < 1000) return { level: 2, name: 'INFILTRATOR', color: 'text-blue-500' };
    if (points < 2000) return { level: 3, name: 'TECHNOMANCER', color: 'text-cyber-purple' };
    if (points < 5000) return { level: 4, name: 'GHOST_OPERATIVE', color: 'text-yellow-500' };
    return { level: 5, name: 'SYSTEM_ARCHITECT', color: 'text-red-500' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black italic text-text-main tracking-tighter uppercase flex items-center justify-center gap-4">
          <Crown className="w-10 h-10 text-yellow-500" />
          GLOBAL_LEADERBOARD
        </h1>
        <p className="text-xs font-mono text-text-muted uppercase tracking-[0.3em]">Top Operatives in the Network</p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8">
        {/* Rank 2 */}
        {profiles[1] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="cyber-card p-6 text-center space-y-4 border-blue-500/30 bg-blue-500/5 order-2 md:order-1"
          >
            <div className="relative mx-auto w-20 h-20">
              <div className="w-full h-full rounded-full border-2 border-blue-500 overflow-hidden">
                <SafeImage src={profiles[1].avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center border border-white/20">
                <Medal className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="font-bold text-text-main uppercase truncate">{profiles[1].full_name}</p>
              <p className="text-[10px] font-mono text-blue-500 uppercase">#{profiles[1].points} EXP</p>
            </div>
            <div className="text-[10px] font-mono text-text-muted uppercase border border-blue-500/20 py-1">Rank #2</div>
          </motion.div>
        )}

        {/* Rank 1 */}
        {profiles[0] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-card p-8 text-center space-y-4 border-yellow-500/50 bg-yellow-500/5 scale-110 relative z-10 order-1 md:order-2"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <Crown className="w-12 h-12 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            </div>
            <div className="relative mx-auto w-24 h-24">
              <div className="w-full h-full rounded-full border-4 border-yellow-500 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <SafeImage src={profiles[0].avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-text-main uppercase italic tracking-tighter">{profiles[0].full_name}</p>
              <p className="text-xs font-mono text-yellow-500 uppercase font-bold">#{profiles[0].points} EXP</p>
            </div>
            <div className="text-xs font-mono text-yellow-500 uppercase border border-yellow-500/30 py-1.5 bg-yellow-500/10">Global Champion</div>
          </motion.div>
        )}

        {/* Rank 3 */}
        {profiles[2] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="cyber-card p-6 text-center space-y-4 border-orange-500/30 bg-orange-500/5 order-3"
          >
            <div className="relative mx-auto w-20 h-20">
              <div className="w-full h-full rounded-full border-2 border-orange-500 overflow-hidden">
                <SafeImage src={profiles[2].avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center border border-white/20">
                <Trophy className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="font-bold text-text-main uppercase truncate">{profiles[2].full_name}</p>
              <p className="text-[10px] font-mono text-orange-500 uppercase">#{profiles[2].points} EXP</p>
            </div>
            <div className="text-[10px] font-mono text-text-muted uppercase border border-orange-500/20 py-1">Rank #3</div>
          </motion.div>
        )}
      </div>

      {/* Search & List */}
      <div className="space-y-4">
        <div className="cyber-card p-0 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted opacity-30" />
            <input 
              type="text"
              placeholder="SEARCH_OPERATIVE_BY_NAME..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cyber-input pl-12 h-14 bg-card-main border-none focus:ring-0"
            />
          </div>
        </div>

        <div className="cyber-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-card-main border-b border-border-main">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-muted uppercase">Rank</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-muted uppercase">Operative</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-muted uppercase">System_Level</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-text-muted uppercase text-right">Experience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center font-mono text-text-muted animate-pulse">SCANNING_NETWORK_DATA...</td></tr>
                ) : filteredProfiles.map((p, index) => {
                  const level = calculateLevel(p.points);
                  const isMe = currentUser?.id === p.id;
                  return (
                    <tr key={p.id} className={`hover:bg-white/5 transition-colors ${isMe ? 'bg-cyber-purple/5 border-l-4 border-cyber-purple' : 'border-l-4 border-transparent'}`}>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-sm ${index < 3 ? 'text-yellow-500 font-bold' : 'text-text-muted'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg border border-border-main overflow-hidden shrink-0">
                            <SafeImage src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-main uppercase tracking-tight">{p.full_name}</p>
                            {isMe && <span className="text-[8px] font-mono text-cyber-purple uppercase font-bold tracking-widest">You</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-mono font-bold uppercase ${level.color}`}>
                          {level.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-sm text-text-main">{p.points}</span>
                          <Zap className="w-3 h-3 text-cyber-purple" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="cyber-card p-6 border-cyber-purple/20 bg-cyber-purple/5">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="w-6 h-6 text-cyber-purple" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-text-main">How to earn EXP?</h3>
          </div>
          <ul className="space-y-2 text-[10px] font-mono text-text-muted uppercase">
            <li className="flex items-center gap-2"><Zap className="w-3 h-3 text-cyber-purple" /> Complete course lessons (+10 XP)</li>
            <li className="flex items-center gap-2"><Zap className="w-3 h-3 text-cyber-purple" /> Review purchased assets (+50 XP)</li>
            <li className="flex items-center gap-2"><Zap className="w-3 h-3 text-cyber-purple" /> Daily login bonus (Coming Soon)</li>
          </ul>
        </div>
        <div className="cyber-card p-6 border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-text-main">EXP Benefits</h3>
          </div>
          <ul className="space-y-2 text-[10px] font-mono text-text-muted uppercase">
            <li className="flex items-center gap-2"><Zap className="w-3 h-3 text-green-500" /> Unlock exclusive high-tier assets</li>
            <li className="flex items-center gap-2"><Zap className="w-3 h-3 text-green-500" /> Redeem EXP for purchase discounts</li>
            <li className="flex items-center gap-2"><Zap className="w-3 h-3 text-green-500" /> Special badges & network status</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
