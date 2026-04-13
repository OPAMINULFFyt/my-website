import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../App';
import { MessageCircle, Send, Save, RefreshCw, CreditCard, Settings2, Trophy, Facebook, Youtube, Globe, AlertTriangle, Hash, Mail, Instagram, Layout, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    whatsapp: '',
    telegram: '',
    facebook: '',
    youtube: '',
    bkash: '',
    nagad: '',
    bkash_logo: 'https://raw.githubusercontent.com/shuvohabibi/bkash-logo/main/bkash.png',
    nagad_logo: 'https://raw.githubusercontent.com/shuvohabibi/nagad-logo/main/nagad.png',
    site_name: 'OP AMINUL FF',
    site_logo: '',
    footer_text: 'The ultimate digital asset marketplace for gamers and developers.',
    maintenance_mode: 'false',
    review_points: '50',
    global_announcement: '',
    meta_title: 'OP AMINUL FF - Digital Asset Marketplace',
    meta_description: 'Buy and sell premium digital assets, courses, and hardware kits.',
    meta_keywords: 'gaming, assets, development, courses, scripts',
    google_verification: '',
    site_favicon: '',
    discord: '',
    instagram: '',
    email_support: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gateways, setGateways] = useState<any[]>([]);
  const [newGateway, setNewGateway] = useState({ name: '', details: '', logo: '' });
  const { profile } = useAuth();

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const settingsMap = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
      setSettings({
        whatsapp: settingsMap.whatsapp || '',
        telegram: settingsMap.telegram || '',
        facebook: settingsMap.facebook || '',
        youtube: settingsMap.youtube || '',
        discord: settingsMap.discord || '',
        instagram: settingsMap.instagram || '',
        email_support: settingsMap.email_support || '',
        bkash: settingsMap.bkash || '',
        nagad: settingsMap.nagad || '',
        bkash_logo: settingsMap.bkash_logo || 'https://raw.githubusercontent.com/shuvohabibi/bkash-logo/main/bkash.png',
        nagad_logo: settingsMap.nagad_logo || 'https://raw.githubusercontent.com/shuvohabibi/nagad-logo/main/nagad.png',
        site_name: settingsMap.site_name || 'OP AMINUL FF',
        site_logo: settingsMap.site_logo || '',
        footer_text: settingsMap.footer_text || 'The ultimate digital asset marketplace for gamers and developers.',
        maintenance_mode: settingsMap.maintenance_mode || 'false',
        review_points: settingsMap.review_points || '50',
        global_announcement: settingsMap.global_announcement || '',
        meta_title: settingsMap.meta_title || 'OP AMINUL FF - Digital Asset Marketplace',
        meta_description: settingsMap.meta_description || 'Buy and sell premium digital assets, courses, and hardware kits.',
        meta_keywords: settingsMap.meta_keywords || 'gaming, assets, development, courses, scripts',
        google_verification: settingsMap.google_verification || '',
        site_favicon: settingsMap.site_favicon || '',
      });

      if (settingsMap.payment_gateways) {
        try {
          setGateways(JSON.parse(settingsMap.payment_gateways));
        } catch (e) {
          setGateways([]);
        }
      }
    }
    setLoading(false);
  };

  const addGateway = () => {
    if (!newGateway.name || !newGateway.details) return toast.error('Name and Details required');
    const updated = [...gateways, { ...newGateway, id: Date.now().toString() }];
    setGateways(updated);
    setNewGateway({ name: '', details: '', logo: '' });
  };

  const removeGateway = (id: string) => {
    setGateways(gateways.filter(g => g.id !== id));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'owner') return toast.error('Only the OWNER can modify system settings');
    
    setSaving(true);
    
    const updates = [
      ...Object.entries(settings).map(([key, value]) => ({ key, value: String(value) })),
      { key: 'payment_gateways', value: JSON.stringify(gateways) }
    ];

    const { error } = await supabase.from('settings').upsert(updates);

    if (error) {
      toast.error('Update failed: ' + error.message);
    } else {
      toast.success('System settings updated successfully');
    }
    setSaving(false);
  };

  return (
    <AdminLayout title="SYSTEM_CONFIGURATION">
      <div className="max-w-4xl">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Support & Social */}
            <div className="cyber-card">
              <h3 className="text-sm font-bold mb-6 uppercase border-b border-border-main pb-2 flex items-center gap-2 text-cyber-purple">
                <MessageCircle className="w-4 h-4" />
                Support & Social
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">WhatsApp Number</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="text" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="+8801XXXXXXXXX"
                      value={settings.whatsapp}
                      onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Telegram Username</label>
                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="text" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="@username"
                      value={settings.telegram}
                      onChange={(e) => setSettings({...settings, telegram: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Facebook Page</label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="text" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="facebook.com/page"
                      value={settings.facebook}
                      onChange={(e) => setSettings({...settings, facebook: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">YouTube Channel</label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="text" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="youtube.com/@channel"
                      value={settings.youtube}
                      onChange={(e) => setSettings({...settings, youtube: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Discord Server</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="text" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="discord.gg/invite"
                      value={settings.discord}
                      onChange={(e) => setSettings({...settings, discord: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Instagram Profile</label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="text" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="instagram.com/user"
                      value={settings.instagram}
                      onChange={(e) => setSettings({...settings, instagram: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Support Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="email" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="support@example.com"
                      value={settings.email_support}
                      onChange={(e) => setSettings({...settings, email_support: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Multiple Payment Gateways */}
            <div className="cyber-card md:col-span-2">
              <h3 className="text-sm font-bold mb-6 uppercase border-b border-border-main pb-2 flex items-center gap-2 text-pink-500">
                <CreditCard className="w-4 h-4" />
                Advanced Payment Gateways (Multiple)
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add New Gateway */}
                <div className="space-y-4 p-4 border border-border-main bg-card-main">
                  <p className="text-[10px] font-mono text-cyber-purple uppercase font-bold tracking-widest mb-4">Add_New_Gateway</p>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Gateway Name</label>
                    <input 
                      type="text" 
                      className="cyber-input h-10 text-xs bg-bg-main border-border-main"
                      placeholder="e.g. Binance Pay, Rocket"
                      value={newGateway.name}
                      onChange={(e) => setNewGateway({...newGateway, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Account Details / Wallet</label>
                    <input 
                      type="text" 
                      className="cyber-input h-10 text-xs bg-bg-main border-border-main"
                      placeholder="Number or Address"
                      value={newGateway.details}
                      onChange={(e) => setNewGateway({...newGateway, details: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Logo URL (Optional)</label>
                    <input 
                      type="url" 
                      className="cyber-input h-10 text-xs bg-bg-main border-border-main"
                      placeholder="https://..."
                      value={newGateway.logo}
                      onChange={(e) => setNewGateway({...newGateway, logo: e.target.value})}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={addGateway}
                    className="w-full py-2 bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple text-[10px] font-bold uppercase hover:bg-cyber-purple hover:text-white transition-all"
                  >
                    Add_Gateway_Protocol
                  </button>
                </div>

                {/* Gateway List */}
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-[10px] font-mono text-text-muted opacity-30 uppercase tracking-widest">Active_Gateways_Registry</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {gateways.map((g) => (
                      <div key={g.id} className="p-4 bg-card-main border border-border-main flex justify-between items-start group">
                        <div className="flex gap-3">
                          {g.logo && <img src={g.logo} alt="" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />}
                          <div>
                            <p className="font-bold text-sm uppercase tracking-tighter text-text-main">{g.name}</p>
                            <p className="text-xs font-mono text-text-muted opacity-40">{g.details}</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeGateway(g.id)}
                          className="text-text-muted opacity-20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {gateways.length === 0 && (
                      <div className="col-span-2 py-8 text-center border border-dashed border-border-main text-text-muted opacity-20 font-mono text-[10px] uppercase">
                        No_Custom_Gateways_Detected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Gateway (Legacy) */}
            <div className="cyber-card">
              <h3 className="text-sm font-bold mb-6 uppercase border-b border-border-main pb-2 flex items-center gap-2 text-pink-500">
                <CreditCard className="w-4 h-4" />
                Payment Gateway
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Bkash Personal Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-pink-500 rounded-full" />
                    <input 
                      type="text" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="01XXXXXXXXX"
                      value={settings.bkash}
                      onChange={(e) => setSettings({...settings, bkash: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Bkash Logo URL</label>
                  <input 
                    type="url" 
                    className="cyber-input h-10 text-xs bg-card-main border-border-main"
                    placeholder="https://example.com/bkash-logo.png"
                    value={settings.bkash_logo}
                    onChange={(e) => setSettings({...settings, bkash_logo: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Nagad Personal Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full" />
                    <input 
                      type="text" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="01XXXXXXXXX"
                      value={settings.nagad}
                      onChange={(e) => setSettings({...settings, nagad: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Nagad Logo URL</label>
                  <input 
                    type="url" 
                    className="cyber-input h-10 text-xs bg-card-main border-border-main"
                    placeholder="https://example.com/nagad-logo.png"
                    value={settings.nagad_logo}
                    onChange={(e) => setSettings({...settings, nagad_logo: e.target.value})}
                  />
                </div>
                <div className="p-3 bg-card-main border border-border-main rounded-sm">
                  <p className="text-[9px] font-mono text-text-muted opacity-40 leading-relaxed uppercase">
                    * These numbers will be displayed to users during the checkout protocol.
                  </p>
                </div>
              </div>
            </div>

            {/* System Config */}
            <div className="cyber-card">
              <h3 className="text-sm font-bold mb-6 uppercase border-b border-border-main pb-2 flex items-center gap-2 text-blue-500">
                <Settings2 className="w-4 h-4" />
                System Config
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Site Name</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="text" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      value={settings.site_name}
                      onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Site Logo URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="url" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="https://example.com/logo.png"
                      value={settings.site_logo}
                      onChange={(e) => setSettings({...settings, site_logo: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Site Favicon URL (.ico or .png)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-20" />
                    <input 
                      type="url" 
                      className="cyber-input pl-10 h-10 text-xs bg-card-main border-border-main"
                      placeholder="https://example.com/favicon.ico"
                      value={settings.site_favicon}
                      onChange={(e) => setSettings({...settings, site_favicon: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Maintenance Mode</label>
                  <select 
                    className="cyber-input h-10 text-xs bg-bg-main border-border-main"
                    value={settings.maintenance_mode}
                    onChange={(e) => setSettings({...settings, maintenance_mode: e.target.value})}
                  >
                    <option value="false">OFF (System Live)</option>
                    <option value="true">ON (System Offline)</option>
                  </select>
                </div>
                {settings.maintenance_mode === 'true' && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono">
                    <AlertTriangle className="w-3 h-3" />
                    WARNING: SYSTEM IS CURRENTLY OFFLINE
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase mb-1">Global Announcement Banner</label>
                  <textarea 
                    rows={2}
                    className="cyber-input py-2 text-xs"
                    placeholder="Enter text to show at the very top of the site..."
                    value={settings.global_announcement}
                    onChange={(e) => setSettings({...settings, global_announcement: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Rewards & XP */}
            <div className="cyber-card">
              <h3 className="text-sm font-bold mb-6 uppercase border-b border-border-main pb-2 flex items-center gap-2 text-yellow-500">
                <Trophy className="w-4 h-4" />
                Rewards & XP
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Points Per Review</label>
                  <input 
                    type="number" 
                    className="cyber-input h-10 text-xs bg-card-main border-border-main"
                    value={settings.review_points}
                    onChange={(e) => setSettings({...settings, review_points: e.target.value})}
                  />
                  <p className="text-[9px] text-text-muted opacity-30 mt-1 uppercase font-mono">XP awarded to users after a verified review</p>
                </div>
              </div>
            </div>

            {/* SEO & Branding */}
            <div className="cyber-card">
              <h3 className="text-sm font-bold mb-6 uppercase border-b border-border-main pb-2 flex items-center gap-2 text-green-500">
                <Layout className="w-4 h-4" />
                SEO & Branding
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Meta Title</label>
                  <input 
                    type="text" 
                    className="cyber-input h-10 text-xs bg-card-main border-border-main"
                    value={settings.meta_title}
                    onChange={(e) => setSettings({...settings, meta_title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Meta Description</label>
                  <textarea 
                    rows={2}
                    className="cyber-input py-2 text-xs bg-card-main border-border-main"
                    value={settings.meta_description}
                    onChange={(e) => setSettings({...settings, meta_description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Meta Keywords (comma separated)</label>
                  <input 
                    type="text" 
                    className="cyber-input h-10 text-xs bg-card-main border-border-main"
                    value={settings.meta_keywords}
                    onChange={(e) => setSettings({...settings, meta_keywords: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Google Site Verification Content</label>
                  <input 
                    type="text" 
                    className="cyber-input h-10 text-xs bg-card-main border-border-main"
                    placeholder="googleca1396c4465d0004"
                    value={settings.google_verification}
                    onChange={(e) => setSettings({...settings, google_verification: e.target.value})}
                  />
                  <p className="text-[9px] text-text-muted opacity-30 mt-1 uppercase font-mono italic">
                    * Enter the code from your verification HTML file or meta tag.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted opacity-50 uppercase mb-1">Footer Description</label>
                  <textarea 
                    rows={2}
                    className="cyber-input py-2 text-xs bg-card-main border-border-main"
                    value={settings.footer_text}
                    onChange={(e) => setSettings({...settings, footer_text: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border-main">
            <button 
              type="button" 
              onClick={fetchSettings}
              className="px-6 py-2 text-xs font-bold uppercase flex items-center gap-2 hover:text-text-main opacity-70"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="cyber-button flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'UPDATING...' : 'SAVE_ALL_CONFIGURATIONS'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
