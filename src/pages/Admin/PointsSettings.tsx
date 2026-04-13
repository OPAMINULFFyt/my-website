import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Zap, Coins, Save, Loader2, Info, Plus, Trash2, Copy, Code, Target, Star, Trophy, ArrowRight, CheckCircle2, Search, Filter, Sparkles, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalization } from '../../context/LocalizationContext';
import { motion, AnimatePresence } from 'motion/react';

interface CustomReward {
  key: string;
  value: string;
  description?: string;
  type: 'exp' | 'opx';
}

const REWARD_TEMPLATES: CustomReward[] = [
  { key: 'daily_login', value: '50', type: 'exp', description: 'Awarded for first login of the day' },
  { key: 'social_share', value: '25', type: 'exp', description: 'Awarded when user shares a product' },
  { key: 'first_purchase', value: '100', type: 'opx', description: 'Bonus for the very first order' },
  { key: 'profile_complete', value: '200', type: 'exp', description: 'Awarded when user fills all profile info' },
  { key: 'bug_report', value: '500', type: 'opx', description: 'Reward for helpful bug reports' },
];

const AdminPointsSettings: React.FC = () => {
  const { convertPrice } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'core' | 'custom' | 'guide'>('core');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'exp' | 'opx'>('all');
  
  const [settings, setSettings] = useState({
    referral_exp: '100',
    referral_opx: '10',
    affiliate_opx_percent: '5',
    lesson_completion_exp: '10',
    review_exp: '50',
    opx_withdrawal_min: '500',
    opx_to_cash_rate: '1'
  });

  const [customRewards, setCustomRewards] = useState<CustomReward[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
        
        const standardKeys = ['referral_exp', 'referral_opx', 'affiliate_opx_percent', 'lesson_completion_exp', 'review_exp', 'opx_withdrawal_min', 'opx_to_cash_rate'];
        setSettings(prev => {
          const newSettings = { ...prev };
          standardKeys.forEach(key => {
            if (settingsMap[key]) newSettings[key as keyof typeof prev] = settingsMap[key];
          });
          return newSettings;
        });

        const custom = data
          .filter(s => !standardKeys.includes(s.key) && (s.key.endsWith('_exp') || s.key.endsWith('_opx')))
          .map(s => {
            const isExp = s.key.endsWith('_exp');
            const baseKey = isExp ? s.key.replace('_exp', '') : s.key.replace('_opx', '');
            return {
              key: baseKey,
              value: s.value,
              type: isExp ? 'exp' : 'opx' as 'exp' | 'opx',
              description: settingsMap[`${s.key}_desc`] || ''
            };
          });
        setCustomRewards(custom);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        ...Object.entries(settings).map(([key, value]) => ({
          key,
          value: value.toString()
        })),
        ...customRewards.flatMap(r => {
          const fullKey = `${r.key}_${r.type}`;
          const items = [{ key: fullKey, value: r.value.toString() }];
          if (r.description) {
            items.push({ key: `${fullKey}_desc`, value: r.description });
          }
          return items;
        })
      ];

      const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      toast.success('System settings synchronized successfully');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addCustomReward = () => {
    setCustomRewards([...customRewards, { key: 'new_action', value: '0', type: 'exp', description: '' }]);
  };

  const applyTemplate = (template: typeof REWARD_TEMPLATES[0]) => {
    if (customRewards.some(r => r.key === template.key)) {
      toast.error('Trigger key already exists');
      return;
    }
    setCustomRewards([...customRewards, { ...template }]);
    toast.success(`Template '${template.key}' added`);
  };

  const removeCustomReward = (index: number) => {
    setCustomRewards(customRewards.filter((_, i) => i !== index));
  };

  const updateCustomReward = (index: number, field: keyof CustomReward, val: string) => {
    const newRewards = [...customRewards];
    (newRewards[index] as any)[field] = val;
    setCustomRewards(newRewards);
  };

  const copySnippet = (reward: CustomReward) => {
    const fullKey = `${reward.key}_${reward.type}`;
    const snippet = `// Trigger this reward in your code:
await awardPoints(userId, '${fullKey}');`;
    navigator.clipboard.writeText(snippet);
    toast.success('Code snippet copied to clipboard!');
  };

  const filteredRewards = customRewards.filter(r => {
    const matchesSearch = r.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (r.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: customRewards.length,
    exp: customRewards.filter(r => r.type === 'exp').length,
    opx: customRewards.filter(r => r.type === 'opx').length,
  };

  if (loading) return <AdminLayout title="POINTS_SETTINGS"><div className="animate-pulse font-mono text-text-muted">INITIALIZING_REWARD_ENGINE...</div></AdminLayout>;

  return (
    <AdminLayout title="REWARD_SYSTEM_ARCHITECT">
      <div className="max-w-5xl space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="cyber-card p-4 bg-card-main border-border-main flex items-center justify-between">
            <div>
              <p className="text-[8px] font-mono text-text-muted uppercase">Total_Triggers</p>
              <p className="text-2xl font-black text-text-main">{stats.total}</p>
            </div>
            <LayoutGrid className="w-8 h-8 text-text-muted opacity-20" />
          </div>
          <div className="cyber-card p-4 bg-cyber-purple/5 border-cyber-purple/20 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-mono text-cyber-purple uppercase">EXP_Triggers</p>
              <p className="text-2xl font-black text-cyber-purple">{stats.exp}</p>
            </div>
            <Zap className="w-8 h-8 text-cyber-purple opacity-20" />
          </div>
          <div className="cyber-card p-4 bg-yellow-500/5 border-yellow-500/20 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-mono text-yellow-500 uppercase">OPX_Triggers</p>
              <p className="text-2xl font-black text-yellow-500">{stats.opx}</p>
            </div>
            <Coins className="w-8 h-8 text-yellow-500 opacity-20" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2 p-1 bg-card-main border border-border-main rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('core')}
              className={`px-6 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'core' ? 'bg-cyber-purple text-white shadow-lg shadow-cyber-purple/20' : 'text-text-muted hover:text-text-main'}`}
            >
              Core_Rewards
            </button>
            <button 
              onClick={() => setActiveTab('custom')}
              className={`px-6 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'custom' ? 'bg-cyber-purple text-white shadow-lg shadow-cyber-purple/20' : 'text-text-muted hover:text-text-main'}`}
            >
              Custom_Triggers
            </button>
            <button 
              onClick={() => setActiveTab('guide')}
              className={`px-6 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'guide' ? 'bg-cyber-purple text-white shadow-lg shadow-cyber-purple/20' : 'text-text-muted hover:text-text-main'}`}
            >
              Integration_Guide
            </button>
          </div>

          {activeTab === 'custom' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text"
                  placeholder="SEARCH_TRIGGERS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="cyber-input h-10 pl-10 text-[10px]"
                />
              </div>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="cyber-input h-10 w-24 text-[10px] px-2"
              >
                <option value="all">ALL</option>
                <option value="exp">EXP</option>
                <option value="opx">OPX</option>
              </select>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'core' && (
            <motion.div 
              key="core"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* EXP Points Settings */}
              <div className="cyber-card p-6 space-y-6 border-cyber-purple/30">
                <div className="flex items-center justify-between border-b border-cyber-purple/30 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyber-purple/20 flex items-center justify-center rounded-lg">
                      <Zap className="w-6 h-6 text-cyber-purple" />
                    </div>
                    <h2 className="text-lg font-bold text-text-main uppercase tracking-tighter">EXP_ENGINE</h2>
                  </div>
                  <Star className="w-4 h-4 text-cyber-purple opacity-30" />
                </div>
                
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-2 group-hover:text-cyber-purple transition-colors">Referral Reward (EXP)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.referral_exp}
                        onChange={(e) => setSettings({...settings, referral_exp: e.target.value})}
                        className="cyber-input h-12 pl-12"
                      />
                      <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-2 group-hover:text-cyber-purple transition-colors">Lesson Completion (EXP)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.lesson_completion_exp}
                        onChange={(e) => setSettings({...settings, lesson_completion_exp: e.target.value})}
                        className="cyber-input h-12 pl-12"
                      />
                      <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-2 group-hover:text-cyber-purple transition-colors">Review Reward (EXP)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.review_exp}
                        onChange={(e) => setSettings({...settings, review_exp: e.target.value})}
                        className="cyber-input h-12 pl-12"
                      />
                      <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple/50" />
                    </div>
                  </div>
                </div>
              </div>

              {/* OPX Coin Settings */}
              <div className="cyber-card p-6 space-y-6 border-yellow-500/30">
                <div className="flex items-center justify-between border-b border-yellow-500/30 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-500/20 flex items-center justify-center rounded-lg">
                      <Coins className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h2 className="text-lg font-bold text-text-main uppercase tracking-tighter">OPX_ECONOMY</h2>
                  </div>
                  <Star className="w-4 h-4 text-yellow-500 opacity-30" />
                </div>
                
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-2 group-hover:text-yellow-500 transition-colors">Referral Reward (OPX)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.referral_opx}
                        onChange={(e) => setSettings({...settings, referral_opx: e.target.value})}
                        className="cyber-input h-12 pl-12 border-yellow-500/30 focus:border-yellow-500"
                      />
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-2 group-hover:text-yellow-500 transition-colors">Affiliate Commission (%)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.affiliate_opx_percent}
                        onChange={(e) => setSettings({...settings, affiliate_opx_percent: e.target.value})}
                        className="cyber-input h-12 pl-12 border-yellow-500/30 focus:border-yellow-500"
                      />
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500/50" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'custom' && (
            <motion.div 
              key="custom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Templates Section */}
              <div className="cyber-card p-4 bg-card-main border-border-main">
                <h3 className="text-[10px] font-mono text-text-muted uppercase mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  Quick_Templates
                </h3>
                <div className="flex flex-wrap gap-2">
                  {REWARD_TEMPLATES.map((template) => (
                    <button 
                      key={template.key}
                      onClick={() => applyTemplate(template)}
                      className="px-3 py-1.5 bg-card-main border border-border-main hover:border-cyber-purple rounded-lg text-[9px] font-mono uppercase transition-all flex items-center gap-2 group"
                    >
                      <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                      {template.key.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cyber-card p-6 space-y-6 border-cyber-purple/30 bg-cyber-purple/5">
                <div className="flex items-center justify-between border-b border-cyber-purple/30 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyber-purple/20 flex items-center justify-center rounded-lg">
                      <Plus className="w-6 h-6 text-cyber-purple" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-text-main uppercase tracking-tighter">CUSTOM_REWARD_TRIGGERS</h2>
                      <p className="text-[8px] font-mono text-text-muted uppercase">Define_Unlimited_Reward_Keys</p>
                    </div>
                  </div>
                  <button 
                    onClick={addCustomReward}
                    className="cyber-button px-6 py-2 text-[10px] h-10"
                  >
                    ADD_NEW_TRIGGER
                  </button>
                </div>

                <div className="space-y-4">
                  {filteredRewards.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border-main rounded-xl">
                      <p className="text-text-muted font-mono text-[10px] uppercase italic">
                        {searchQuery ? 'No triggers match your search' : 'No custom triggers defined in system'}
                      </p>
                    </div>
                  ) : (
                    filteredRewards.map((reward, index) => {
                      const actualIndex = customRewards.findIndex(r => r.key === reward.key);
                      return (
                        <div key={index} className="cyber-card bg-card-main border-border-main p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                              <label className="block text-[8px] font-mono text-text-muted uppercase mb-1">Trigger Key (Internal ID)</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  value={reward.key}
                                  onChange={(e) => updateCustomReward(actualIndex, 'key', e.target.value)}
                                  className="cyber-input h-10 font-mono text-xs"
                                  placeholder="action_name"
                                />
                                <div className="flex border border-border-main rounded-lg overflow-hidden shrink-0">
                                  <button 
                                    onClick={() => updateCustomReward(actualIndex, 'type', 'exp')}
                                    className={`px-3 text-[9px] font-mono uppercase transition-all ${reward.type === 'exp' ? 'bg-cyber-purple text-white' : 'bg-card-main text-text-muted hover:text-text-main'}`}
                                  >
                                    EXP
                                  </button>
                                  <button 
                                    onClick={() => updateCustomReward(actualIndex, 'type', 'opx')}
                                    className={`px-3 text-[9px] font-mono uppercase transition-all ${reward.type === 'opx' ? 'bg-yellow-500 text-white' : 'bg-card-main text-text-muted hover:text-text-main'}`}
                                  >
                                    OPX
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="w-full md:w-32">
                              <label className="block text-[8px] font-mono text-text-muted uppercase mb-1">Value</label>
                              <input 
                                type="number"
                                value={reward.value}
                                onChange={(e) => updateCustomReward(actualIndex, 'value', e.target.value)}
                                className="cyber-input h-10"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <button 
                                onClick={() => copySnippet(reward)}
                                className="h-10 w-10 flex items-center justify-center bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white transition-all rounded-lg"
                                title="Copy Code Snippet"
                              >
                                <Code className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => removeCustomReward(actualIndex)}
                                className="h-10 w-10 flex items-center justify-center bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[8px] font-mono text-text-muted uppercase mb-1">Description / Purpose (Internal Note)</label>
                            <input 
                              type="text"
                              value={reward.description}
                              onChange={(e) => updateCustomReward(actualIndex, 'description', e.target.value)}
                              className="cyber-input h-10 text-[10px] italic"
                              placeholder="e.g. Awarded when user completes their first daily challenge..."
                            />
                          </div>
                          <div className="flex items-center gap-2 text-[8px] font-mono text-text-muted uppercase">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${reward.type === 'exp' ? 'bg-cyber-purple' : 'bg-yellow-500'}`} />
                            Final Key: <span className="text-text-main font-bold">{reward.key}_{reward.type}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div 
              key="guide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="cyber-card p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-border-main pb-6">
                  <div className="w-12 h-12 bg-blue-500/20 flex items-center justify-center rounded-xl">
                    <Code className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main uppercase tracking-tighter">INTEGRATION_HANDBOOK</h2>
                    <p className="text-[10px] font-mono text-text-muted uppercase">How_To_Trigger_Rewards_In_Code</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-cyber-purple uppercase flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Step 1: Define Trigger
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Create a new trigger in the <span className="text-text-main font-bold">Custom Triggers</span> tab. 
                      Choose between <span className="text-cyber-purple font-bold">EXP</span> (Experience Points) 
                      or <span className="text-yellow-500 font-bold">OPX</span> (Coins).
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-cyber-purple uppercase flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Step 2: Implement Code
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Use the <span className="text-text-main font-bold">awardPoints</span> utility function 
                      anywhere in your React components or API routes.
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-cyber-black border border-border-main rounded-xl font-mono text-[11px] space-y-4 overflow-x-auto">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                    <span className="text-text-muted uppercase">Example_Implementation.ts</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`import { awardPoints } from '../lib/rewards';\n\n// Triggering a custom reward\nconst handleAction = async () => {\n  await awardPoints(userId, 'daily_login_exp');\n  toast.success('Daily Login Bonus Awarded!');\n};`);
                        toast.success('Example copied!');
                      }}
                      className="text-cyber-purple hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="text-blue-400">
                    <span className="text-cyber-purple">import</span> {'{ awardPoints }'} <span className="text-cyber-purple">from</span> <span className="text-green-400">'../lib/rewards'</span>;{'\n\n'}
                    <span className="text-text-muted">// Triggering a custom reward</span>{'\n'}
                    <span className="text-cyber-purple">const</span> handleAction = <span className="text-cyber-purple">async</span> () ={'>'} {'{'}{'\n'}
                    {'  '}<span className="text-cyber-purple">await</span> awardPoints(userId, <span className="text-green-400">'daily_login_exp'</span>);{'\n'}
                    {'  '}toast.success(<span className="text-green-400">'Daily Login Bonus Awarded!'</span>);{'\n'}
                    {'}'};
                  </pre>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-cyber-purple/5 border border-cyber-purple/20 rounded-lg text-center">
                    <CheckCircle2 className="w-5 h-5 text-cyber-purple mx-auto mb-2" />
                    <p className="text-[9px] font-mono text-text-main uppercase font-bold">Real-time Sync</p>
                    <p className="text-[8px] font-mono text-text-muted uppercase mt-1">Updates instantly</p>
                  </div>
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg text-center">
                    <Code className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                    <p className="text-[9px] font-mono text-text-main uppercase font-bold">Type Safe</p>
                    <p className="text-[8px] font-mono text-text-muted uppercase mt-1">Validated keys</p>
                  </div>
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-center">
                    <Star className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                    <p className="text-[9px] font-mono text-text-main uppercase font-bold">Dual Economy</p>
                    <p className="text-[8px] font-mono text-text-muted uppercase mt-1">EXP & OPX support</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="cyber-card p-6 bg-cyber-purple/5 border-cyber-purple/20">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-cyber-purple shrink-0 mt-0.5" />
            <div className="text-[10px] font-mono text-text-muted uppercase leading-relaxed">
              <p className="text-text-main font-bold mb-1">Architect_Note:</p>
              The reward system is the heart of user engagement. Use <span className="text-cyber-purple font-bold">EXP</span> to drive progression and status, 
              and <span className="text-yellow-500 font-bold">OPX Coins</span> to drive economic activity and referrals. 
              Always test your triggers in a development environment before deploying to the main network.
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="cyber-button w-full h-16 flex items-center justify-center gap-3 group"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />}
          <span className="font-black uppercase tracking-[0.2em] text-lg">Commit_System_Architecture</span>
        </button>
      </div>
    </AdminLayout>
  );
};

export default AdminPointsSettings;
