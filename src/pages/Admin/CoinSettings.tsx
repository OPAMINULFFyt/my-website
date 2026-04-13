import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Coins, Save, Loader2, Globe, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalization } from '../../context/LocalizationContext';

const AdminCoinSettings: React.FC = () => {
  const { convertPrice } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    opx_withdrawal_min: '500',
    opx_to_cash_rate: '1'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
        setSettings({
          opx_withdrawal_min: settingsMap.opx_withdrawal_min || '500',
          opx_to_cash_rate: settingsMap.opx_to_cash_rate || '1'
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: value.toString()
      }));

      const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      toast.success('Coin market settings updated');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout title="COIN_SETTINGS"><div className="animate-pulse font-mono text-text-muted">LOADING_MARKET_DATA...</div></AdminLayout>;

  return (
    <AdminLayout title="OPX_COIN_MARKET_CONTROL">
      <div className="max-w-4xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            <div className="cyber-card p-8 space-y-8">
              <div className="flex items-center gap-4 border-b border-yellow-500/30 pb-6">
                <div className="w-12 h-12 bg-yellow-500/20 flex items-center justify-center rounded-xl">
                  <Globe className="w-7 h-7 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-main uppercase tracking-tighter">MARKET_VALUATION</h2>
                  <p className="text-[10px] font-mono text-text-muted uppercase">Set_Global_Coin_Exchange_Rate</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase mb-3 tracking-widest">Exchange Rate (1 OPX = ? Cash)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.01"
                      value={settings.opx_to_cash_rate}
                      onChange={(e) => setSettings({...settings, opx_to_cash_rate: e.target.value})}
                      className="cyber-input h-16 text-3xl font-black border-yellow-500/50 focus:border-yellow-500 bg-yellow-500/5"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-yellow-500 font-mono text-xs font-bold">
                      RATE_PER_COIN
                    </div>
                  </div>
                  <p className="text-[9px] font-mono text-text-muted mt-3 uppercase italic">
                    This rate determines how much cash a user receives for each OPX coin during withdrawal.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase mb-3 tracking-widest">Minimum Withdrawal Threshold</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/50" />
                    <input 
                      type="number"
                      value={settings.opx_withdrawal_min}
                      onChange={(e) => setSettings({...settings, opx_withdrawal_min: e.target.value})}
                      className="cyber-input h-14 pl-12 border-yellow-500/30"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-mono text-[10px]">
                      OPX_COINS
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cyber-card p-6 bg-yellow-500/5 border-yellow-500/20">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-tighter">Economic_Impact_Warning</h3>
                  <p className="text-[10px] font-mono text-text-muted uppercase leading-relaxed">
                    Changing the exchange rate will immediately affect the cash value of all users' balances. 
                    Ensure you have sufficient liquidity before increasing the rate.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="cyber-card p-6 border-yellow-500/30 bg-yellow-500/5">
              <h3 className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Live_Conversion_Preview
              </h3>
              
              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-card-main border border-border-main rounded-lg">
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black text-text-main tracking-tighter">100</p>
                    <p className="text-[8px] font-mono text-text-muted uppercase">OPX_COINS</p>
                  </div>
                  <div className="h-px w-8 bg-yellow-500/30" />
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black text-yellow-500 tracking-tighter">{convertPrice(100 * parseFloat(settings.opx_to_cash_rate))}</p>
                    <p className="text-[8px] font-mono text-text-muted uppercase">CASH_VALUE</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-card-main border border-border-main rounded-lg">
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black text-text-main tracking-tighter">1,000</p>
                    <p className="text-[8px] font-mono text-text-muted uppercase">OPX_COINS</p>
                  </div>
                  <div className="h-px w-8 bg-yellow-500/30" />
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black text-yellow-500 tracking-tighter">{convertPrice(1000 * parseFloat(settings.opx_to_cash_rate))}</p>
                    <p className="text-[8px] font-mono text-text-muted uppercase">CASH_VALUE</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-card-main border border-border-main rounded-lg">
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black text-text-main tracking-tighter">5,000</p>
                    <p className="text-[8px] font-mono text-text-muted uppercase">OPX_COINS</p>
                  </div>
                  <div className="h-px w-8 bg-yellow-500/30" />
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black text-yellow-500 tracking-tighter">{convertPrice(5000 * parseFloat(settings.opx_to_cash_rate))}</p>
                    <p className="text-[8px] font-mono text-text-muted uppercase">CASH_VALUE</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="cyber-button w-full h-16 flex items-center justify-center gap-3 bg-yellow-500/10 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-white"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              <span className="font-black uppercase tracking-widest">Update_Market_Core</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCoinSettings;
