import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Zap, Coins, Save, Loader2, Info, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalization } from '../../context/LocalizationContext';

const AdminPointsSettings: React.FC = () => {
  const { convertPrice } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    referral_exp: '100',
    referral_opx: '10',
    affiliate_opx_percent: '5',
    lesson_completion_exp: '10',
    review_exp: '50',
    opx_withdrawal_min: '500',
    opx_to_cash_rate: '1' // 1 OPX = 1 BDT (or whatever currency)
  });

  const [customRewards, setCustomRewards] = useState<{key: string, value: string}[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
        
        // Standard settings
        const standardKeys = ['referral_exp', 'referral_opx', 'affiliate_opx_percent', 'lesson_completion_exp', 'review_exp', 'opx_withdrawal_min', 'opx_to_cash_rate'];
        setSettings(prev => {
          const newSettings = { ...prev };
          standardKeys.forEach(key => {
            if (settingsMap[key]) newSettings[key as keyof typeof prev] = settingsMap[key];
          });
          return newSettings;
        });

        // Custom rewards (anything ending in _exp or _opx that isn't standard)
        const custom = data
          .filter(s => !standardKeys.includes(s.key) && (s.key.endsWith('_exp') || s.key.endsWith('_opx')))
          .map(s => ({ key: s.key, value: s.value }));
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
        ...customRewards.map(r => ({
          key: r.key,
          value: r.value.toString()
        }))
      ];

      const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      toast.success('System settings updated successfully');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addCustomReward = () => {
    setCustomRewards([...customRewards, { key: 'new_action_exp', value: '0' }]);
  };

  const removeCustomReward = (index: number) => {
    setCustomRewards(customRewards.filter((_, i) => i !== index));
  };

  const updateCustomReward = (index: number, field: 'key' | 'value', val: string) => {
    const newRewards = [...customRewards];
    newRewards[index][field] = val;
    setCustomRewards(newRewards);
  };

  if (loading) return <AdminLayout title="POINTS_SETTINGS"><div className="animate-pulse font-mono text-text-muted">LOADING_CONFIG...</div></AdminLayout>;

  return (
    <AdminLayout title="REWARD_SYSTEM_CONFIG">
      <div className="max-w-4xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* EXP Points Settings */}
          <div className="cyber-card p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-cyber-purple/30 pb-4">
              <Zap className="w-6 h-6 text-cyber-purple" />
              <h2 className="text-lg font-bold text-text-main uppercase tracking-tighter">EXP_POINTS_REWARDS</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase mb-2">Referral Reward (EXP)</label>
                <input 
                  type="number"
                  value={settings.referral_exp}
                  onChange={(e) => setSettings({...settings, referral_exp: e.target.value})}
                  className="cyber-input h-12"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase mb-2">Lesson Completion (EXP)</label>
                <input 
                  type="number"
                  value={settings.lesson_completion_exp}
                  onChange={(e) => setSettings({...settings, lesson_completion_exp: e.target.value})}
                  className="cyber-input h-12"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase mb-2">Review Reward (EXP)</label>
                <input 
                  type="number"
                  value={settings.review_exp}
                  onChange={(e) => setSettings({...settings, review_exp: e.target.value})}
                  className="cyber-input h-12"
                />
              </div>
            </div>
          </div>

          {/* OPX Coin Settings */}
          <div className="cyber-card p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-yellow-500/30 pb-4">
              <Coins className="w-6 h-6 text-yellow-500" />
              <h2 className="text-lg font-bold text-text-main uppercase tracking-tighter">OPX_COIN_REWARDS</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase mb-2">Referral Reward (OPX)</label>
                <input 
                  type="number"
                  value={settings.referral_opx}
                  onChange={(e) => setSettings({...settings, referral_opx: e.target.value})}
                  className="cyber-input h-12 border-yellow-500/30 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-text-muted uppercase mb-2">Affiliate Commission (%)</label>
                <input 
                  type="number"
                  value={settings.affiliate_opx_percent}
                  onChange={(e) => setSettings({...settings, affiliate_opx_percent: e.target.value})}
                  className="cyber-input h-12 border-yellow-500/30 focus:border-yellow-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Rewards Section */}
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
            {customRewards.length === 0 ? (
              <p className="text-center py-8 text-text-muted font-mono text-[10px] uppercase italic">No custom triggers defined</p>
            ) : (
              customRewards.map((reward, index) => (
                <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-2">Trigger Key (e.g. daily_login_exp)</label>
                    <input 
                      type="text"
                      value={reward.key}
                      onChange={(e) => updateCustomReward(index, 'key', e.target.value)}
                      className="cyber-input h-12 font-mono text-xs"
                      placeholder="action_name_exp"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-2">Value</label>
                    <input 
                      type="number"
                      value={reward.value}
                      onChange={(e) => updateCustomReward(index, 'value', e.target.value)}
                      className="cyber-input h-12"
                    />
                  </div>
                  <button 
                    onClick={() => removeCustomReward(index)}
                    className="h-12 w-12 flex items-center justify-center bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="cyber-card p-6 bg-cyber-purple/5 border-cyber-purple/20">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-cyber-purple shrink-0 mt-0.5" />
            <div className="text-[10px] font-mono text-text-muted uppercase leading-relaxed">
              <p className="text-text-main font-bold mb-1">System_Note:</p>
              Custom triggers can be used anywhere in the application code by referencing the key. 
              Keys ending in <span className="text-cyber-purple">_exp</span> award experience points, 
              while keys ending in <span className="text-yellow-500">_opx</span> award OPX coins.
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="cyber-button w-full h-14 flex items-center justify-center gap-3"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span className="font-bold uppercase tracking-widest">Commit_Changes_To_Core</span>
        </button>
      </div>
    </AdminLayout>
  );
};

export default AdminPointsSettings;
