import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { Trophy, Medal, Target, Loader2, TrendingUp, Search } from 'lucide-react';
import { motion } from 'motion/react';
import Badge from '../components/Badge';
import { Link } from 'react-router-dom';

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(50);

      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-purple/10 border border-cyber-purple/30 mb-2 relative">
          <Trophy className="w-10 h-10 text-cyber-purple animate-bounce" />
          <div className="absolute inset-0 bg-cyber-purple/20 blur-xl -z-10" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-text-main">Global_Rankings</h1>
        <p className="text-xs font-mono text-text-muted uppercase tracking-[0.3em]">Top_Performers_In_The_Network</p>
      </div>

      <div className="cyber-card p-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted opacity-30" />
          <input 
            type="text"
            placeholder="SEARCH_OPERATIVE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cyber-input pl-12 h-14 bg-transparent border-none focus:ring-0 text-text-main"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-cyber-purple animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={user.id}
              className={`cyber-card group transition-all p-4 flex items-center gap-6 ${
                index === 0 ? 'border-yellow-500/50 bg-yellow-500/5' :
                index === 1 ? 'border-gray-400/50 bg-gray-400/5' :
                index === 2 ? 'border-amber-700/50 bg-amber-700/5' :
                'hover:border-cyber-purple/50'
              }`}
            >
              <div className="w-12 flex flex-col items-center justify-center font-mono">
                {index === 0 ? (
                  <div className="relative">
                    <Medal className="text-yellow-500 w-8 h-8 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                    <span className="absolute -top-2 -right-2 text-[10px] bg-yellow-500 text-black px-1 font-bold">1ST</span>
                  </div>
                ) : index === 1 ? (
                  <div className="relative">
                    <Medal className="text-gray-400 w-7 h-7" />
                    <span className="absolute -top-2 -right-2 text-[10px] bg-gray-400 text-black px-1 font-bold">2ND</span>
                  </div>
                ) : index === 2 ? (
                  <div className="relative">
                    <Medal className="text-amber-700 w-6 h-6" />
                    <span className="absolute -top-2 -right-2 text-[10px] bg-amber-700 text-black px-1 font-bold">3RD</span>
                  </div>
                ) : (
                  <span className="text-text-muted opacity-20 text-lg">#{index + 1}</span>
                )}
              </div>

              <Link to={`/user/${user.id}`} className="flex-grow flex items-center gap-4 group/link">
                <div className="w-10 h-10 bg-card-main border border-border-main overflow-hidden flex items-center justify-center shrink-0 group-hover/link:border-cyber-purple/50 transition-colors">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Target className="w-5 h-5 text-text-muted opacity-20 group-hover/link:text-cyber-purple transition-colors" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold uppercase tracking-tight text-text-main group-hover/link:text-cyber-purple transition-colors">
                    {user.full_name || 'Unknown_Operative'}
                  </h3>
                  <Badge role={user.role} showIcon={false} className="mt-1" />
                </div>
              </Link>

              <div className="text-right">
                <div className="flex items-center gap-2 justify-end text-cyber-purple">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-mono font-bold text-xl">{user.points || 0}</span>
                </div>
                <p className="text-[8px] font-mono text-text-muted opacity-20 uppercase tracking-widest">XP_ACCUMULATED</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
