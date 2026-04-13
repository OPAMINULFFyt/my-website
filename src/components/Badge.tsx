import React from 'react';
import { Shield, ShieldCheck, User, Zap, Crown, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface BadgeProps {
  role: 'user' | 'admin' | 'developer' | 'owner' | 'affiliate';
  className?: string;
  showIcon?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ role, className, showIcon = true }) => {
  const config = {
    owner: {
      label: 'SYSTEM_OWNER',
      icon: Crown,
      color: 'text-yellow-400 border-yellow-400 bg-yellow-400/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
      glow: 'bg-yellow-400/20'
    },
    admin: {
      label: 'SYSTEM_ADMIN',
      icon: ShieldCheck,
      color: 'text-cyber-purple border-cyber-purple bg-cyber-purple/10 shadow-[0_0_10px_rgba(188,19,254,0.2)]',
      glow: 'bg-cyber-purple/20'
    },
    developer: {
      label: 'CORE_DEVELOPER',
      icon: Zap,
      color: 'text-blue-400 border-blue-400 bg-blue-400/10 shadow-[0_0_10px_rgba(96,165,250,0.2)]',
      glow: 'bg-blue-400/20'
    },
    affiliate: {
      label: 'AFFILIATE_PARTNER',
      icon: Share2,
      color: 'text-green-400 border-green-400 bg-green-400/10 shadow-[0_0_10px_rgba(74,222,128,0.2)]',
      glow: 'bg-green-400/20'
    },
    user: {
      label: 'VERIFIED_USER',
      icon: User,
      color: 'text-text-muted border-border-main bg-card-main',
      glow: 'bg-cyber-purple/5'
    }
  };

  const { label, icon: Icon, color, glow } = config[role] || config.user;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 border text-[9px] font-mono font-bold uppercase tracking-[0.15em] relative group overflow-hidden",
      color,
      className
    )}>
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", glow)} />
      {showIcon && <Icon className="w-3 h-3 relative z-10" />}
      <span className="relative z-10">{label}</span>
      
      {/* Animated scan line */}
      <div className="absolute inset-0 w-full h-[1px] bg-white/20 -translate-y-full group-hover:animate-[scan_2s_linear_infinite] z-20" />
    </div>
  );
};

export default Badge;
