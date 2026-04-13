import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Shield, Facebook, Youtube, Send, MessageCircle, Hash, Instagram, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const [settings, setSettings] = useState({
    site_name: 'OP AMINUL FF',
    site_logo: '',
    footer_text: 'The ultimate digital asset marketplace for gamers and developers.',
    facebook: '',
    youtube: '',
    telegram: '',
    whatsapp: '',
    discord: '',
    instagram: '',
    email_support: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
        setSettings({
          site_name: settingsMap.site_name || 'OP AMINUL FF',
          site_logo: settingsMap.site_logo || '',
          footer_text: settingsMap.footer_text || 'The ultimate digital asset marketplace for gamers and developers.',
          facebook: settingsMap.facebook || '',
          youtube: settingsMap.youtube || '',
          telegram: settingsMap.telegram || '',
          whatsapp: settingsMap.whatsapp || '',
          discord: settingsMap.discord || '',
          instagram: settingsMap.instagram || '',
          email_support: settingsMap.email_support || ''
        });
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="border-t border-cyber-purple/20 bg-cyber-black/50 backdrop-blur-md py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyber-purple flex items-center justify-center skew-x-[-12deg] overflow-hidden">
                {settings.site_logo ? (
                  <img src={settings.site_logo} alt="Logo" className="w-full h-full object-cover skew-x-[12deg]" referrerPolicy="no-referrer" />
                ) : (
                  <Shield className="w-5 h-5 text-white skew-x-[12deg]" />
                )}
              </div>
              <span className="font-mono font-bold text-xl tracking-tighter text-text-main">
                {settings.site_name.split(' ').slice(0, -1).join(' ')} <span className="text-cyber-purple">{settings.site_name.split(' ').slice(-1)}</span>
              </span>
            </div>
            <p className="text-text-muted text-sm font-mono leading-relaxed max-w-md uppercase">
              {settings.footer_text}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className="p-2 bg-card-main border border-border-main text-text-muted hover:text-blue-500 hover:border-blue-500/50 transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.youtube && (
                <a href={settings.youtube} target="_blank" rel="noreferrer" className="p-2 bg-card-main border border-border-main text-text-muted hover:text-red-500 hover:border-red-500/50 transition-all">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {settings.discord && (
                <a href={settings.discord} target="_blank" rel="noreferrer" className="p-2 bg-card-main border border-border-main text-text-muted hover:text-indigo-500 hover:border-indigo-500/50 transition-all">
                  <Hash className="w-5 h-5" />
                </a>
              )}
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer" className="p-2 bg-card-main border border-border-main text-text-muted hover:text-pink-500 hover:border-pink-500/50 transition-all">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.telegram && (
                <a href={`https://t.me/${settings.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="p-2 bg-card-main border border-border-main text-text-muted hover:text-cyber-purple hover:border-cyber-purple/50 transition-all">
                  <Send className="w-5 h-5" />
                </a>
              )}
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp.replace('+', '')}`} target="_blank" rel="noreferrer" className="p-2 bg-card-main border border-border-main text-text-muted hover:text-green-500 hover:border-green-500/50 transition-all">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {settings.email_support && (
                <a href={`mailto:${settings.email_support}`} className="p-2 bg-card-main border border-border-main text-text-muted hover:text-yellow-500 hover:border-yellow-500/50 transition-all">
                  <Mail className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-mono text-cyber-purple uppercase tracking-[0.2em] mb-6 font-bold">Navigation</h4>
            <ul className="space-y-3 text-xs font-mono text-text-muted uppercase">
              <li><Link to="/" className="hover:text-text-main transition-colors">Marketplace</Link></li>
              <li><Link to="/leaderboard" className="hover:text-text-main transition-colors">Ranking</Link></li>
              <li><Link to="/user/19554fd8-f748-417a-bcb8-36a1f48254fd" className="hover:text-text-main transition-colors">Owner Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-mono text-cyber-purple uppercase tracking-[0.2em] mb-6 font-bold">System_Status</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                <span className="text-[10px] font-mono text-text-muted opacity-80 uppercase">All Systems Operational</span>
              </div>
              <p className="text-[10px] font-mono text-text-muted opacity-50 uppercase">
                © {new Date().getFullYear()} {settings.site_name} <br />
                All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
