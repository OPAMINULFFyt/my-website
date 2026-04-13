import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Headset, ExternalLink, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import VirtualAssistant from './VirtualAssistant';

const SupportCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'ai'>('ai');
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
        setSettings(settingsMap);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="mb-4 w-[350px] md:w-[400px] overflow-hidden rounded-none border border-cyber-purple/30 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          >
            {/* Tabs */}
            <div className="flex bg-cyber-black border-b border-white/10">
              <button 
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'ai' 
                    ? 'bg-cyber-purple/20 text-cyber-purple border-b-2 border-cyber-purple' 
                    : 'text-white/40 hover:bg-white/5'
                }`}
              >
                <Bot className="w-4 h-4" />
                AI_ASSISTANT
              </button>
              <button 
                onClick={() => setActiveTab('direct')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'direct' 
                    ? 'bg-cyber-purple/20 text-cyber-purple border-b-2 border-cyber-purple' 
                    : 'text-white/40 hover:bg-white/5'
                }`}
              >
                <Headset className="w-4 h-4" />
                DIRECT_SUPPORT
              </button>
            </div>

            {/* Content */}
            <div className="bg-cyber-black min-h-[450px]">
              {activeTab === 'ai' ? (
                <VirtualAssistant onClose={() => setIsOpen(false)} />
              ) : (
                <div className="p-6 space-y-6">
                  <div className="text-center space-y-2 mb-8">
                    <h3 className="text-lg font-bold uppercase tracking-tighter text-white">Human_Operatives</h3>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Connect with our elite support team for complex issues</p>
                  </div>

                  <div className="grid gap-4">
                    <a 
                      href={`https://wa.me/${settings.whatsapp?.replace(/\+/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="group p-4 bg-white/5 border border-white/10 hover:border-green-500/50 hover:bg-green-500/5 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-none bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight text-white">WhatsApp_Secure</p>
                          <p className="text-[10px] font-mono text-white/40">{settings.whatsapp || 'SYSTEM_LOADING...'}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-green-500 transition-colors" />
                    </a>

                    <a 
                      href={`https://t.me/${settings.telegram?.replace('@', '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="group p-4 bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-none bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                          <Send className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight text-white">Telegram_Encrypted</p>
                          <p className="text-[10px] font-mono text-white/40">{settings.telegram || 'SYSTEM_LOADING...'}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-blue-500 transition-colors" />
                    </a>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <div className="p-4 bg-cyber-purple/5 border border-cyber-purple/20 rounded-none flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-cyber-purple mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-cyber-purple uppercase mb-1">Elite_Status_Benefit</p>
                        <p className="text-[9px] text-white/60 leading-relaxed uppercase tracking-wide">Premium asset owners receive priority decryption support and direct access to senior developers.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative group w-14 h-14 rounded-none flex items-center justify-center transition-all duration-500 ${
          isOpen ? 'bg-white text-cyber-black' : 'bg-cyber-purple text-white shadow-[0_0_30px_rgba(188,19,254,0.4)]'
        }`}
      >
        <div className="absolute inset-0 border border-white/20 group-hover:border-white/50 transition-colors" />
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-cyber-purple animate-ping" />
          </div>
        )}
      </button>
    </div>
  );
};

export default SupportCenter;
