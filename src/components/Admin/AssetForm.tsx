import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import { Save, ArrowLeft, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { slugify } from '../../lib/utils';

interface AssetFormProps {
  category: Category;
  title: string;
}

const AssetForm: React.FC<AssetFormProps> = ({ category, title }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: 0,
    category: category,
    content_url: '',
    tutorial_url: '',
    image_url: '',
    requirements: '',
    features: '',
    demo_url: '',
    metadata: (category === 'course' ? {
      duration: '',
      level: 'Beginner',
      lessons: ''
    } : category === 'file' ? {
      version: '1.0.0',
      file_size: '',
      compatibility: ''
    } : {
      specs: '',
      warranty: '',
      weight: ''
    }) as Record<string, any>
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    const submissionData = {
      ...formData,
      publisher_id: user?.id,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f !== '')
    };

    const { error } = await supabase.from('products').insert([submissionData]);

    if (error) {
      toast.error('Operation failed: ' + error.message);
    } else {
      toast.success('Asset created successfully');
      navigate('/admin/products');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate('/admin/products')}
        className="flex items-center gap-2 text-white/50 hover:text-cyber-purple transition-colors font-mono text-xs uppercase mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assets
      </button>

      <div className="cyber-card">
        <div className="flex justify-between items-center mb-8 border-b border-cyber-purple/30 pb-4">
          <h3 className="font-mono text-xl font-bold text-cyber-purple uppercase tracking-tighter">
            {title}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Asset Title</label>
                <input 
                  type="text" required
                  className="cyber-input"
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFormData({
                      ...formData, 
                      title: newTitle,
                      slug: slugify(newTitle)
                    });
                  }}
                  placeholder="Enter asset name..."
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">URL Slug (SEO Friendly)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="text" required
                    className="cyber-input pl-10"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: slugify(e.target.value)})}
                    placeholder="my-cool-product"
                  />
                </div>
                <p className="text-[8px] font-mono text-white/20 mt-1 uppercase italic">
                  * This will be used in the URL: /product/{formData.slug || 'slug'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Price (BDT)</label>
                <input 
                  type="number" required
                  className="cyber-input"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Image URL</label>
                <input 
                  type="url" required
                  className="cyber-input"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">
                  {category === 'course' ? 'Video URL / Playlist Link' : 'Download Link'}
                </label>
                <input 
                  type="text" required
                  className="cyber-input"
                  value={formData.content_url}
                  onChange={(e) => setFormData({...formData, content_url: e.target.value})}
                  placeholder="Enter URL..."
                />
              </div>
              {(category === 'file' || category === 'hardware') && (
                <div>
                  <label className="block text-xs font-mono text-white/50 uppercase mb-1">
                    Tutorial Video URL (Optional)
                  </label>
                  <input 
                    type="text"
                    className="cyber-input"
                    value={formData.tutorial_url}
                    onChange={(e) => setFormData({...formData, tutorial_url: e.target.value})}
                    placeholder="Enter YouTube/Drive/Direct link..."
                  />
                  <p className="text-[8px] font-mono text-white/20 mt-1 uppercase">Related tutorial for this asset</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-white/50 uppercase mb-1">Description</label>
            <textarea 
              rows={3} required
              className="cyber-input"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Provide detailed information about this asset..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Requirements</label>
                <textarea 
                  rows={2}
                  className="cyber-input"
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  placeholder="e.g., PC with 8GB RAM, Internet connection..."
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Features (Comma Separated)</label>
                <textarea 
                  rows={2}
                  className="cyber-input"
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                  placeholder="e.g., Lifetime Access, Source Code, Support..."
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Demo / Preview URL</label>
                <input 
                  type="url"
                  className="cyber-input"
                  value={formData.demo_url}
                  onChange={(e) => setFormData({...formData, demo_url: e.target.value})}
                  placeholder="https://demo.example.com"
                />
              </div>
              
              {/* Category Specific Metadata */}
              <div className="p-4 border border-white/5 bg-white/5 space-y-3">
                <p className="text-[10px] font-mono text-cyber-purple uppercase font-bold tracking-widest border-b border-white/5 pb-1">Technical_Specs</p>
                
                {category === 'course' && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase">Duration</label>
                      <input 
                        type="text" className="bg-transparent border-b border-white/10 text-[10px] text-right focus:outline-none focus:border-cyber-purple"
                        value={formData.metadata.duration}
                        onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, duration: e.target.value}})}
                        placeholder="e.g. 10h 30m"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase">Lessons</label>
                      <input 
                        type="text" className="bg-transparent border-b border-white/10 text-[10px] text-right focus:outline-none focus:border-cyber-purple"
                        value={formData.metadata.lessons}
                        onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, lessons: e.target.value}})}
                        placeholder="e.g. 45"
                      />
                    </div>
                  </>
                )}

                {category === 'file' && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase">Version</label>
                      <input 
                        type="text" className="bg-transparent border-b border-white/10 text-[10px] text-right focus:outline-none focus:border-cyber-purple"
                        value={formData.metadata.version}
                        onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, version: e.target.value}})}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase">File Size</label>
                      <input 
                        type="text" className="bg-transparent border-b border-white/10 text-[10px] text-right focus:outline-none focus:border-cyber-purple"
                        value={formData.metadata.file_size}
                        onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, file_size: e.target.value}})}
                        placeholder="e.g. 250MB"
                      />
                    </div>
                  </>
                )}

                {category === 'hardware' && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase">Warranty</label>
                      <input 
                        type="text" className="bg-transparent border-b border-white/10 text-[10px] text-right focus:outline-none focus:border-cyber-purple"
                        value={formData.metadata.warranty}
                        onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, warranty: e.target.value}})}
                        placeholder="e.g. 1 Year"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase">Weight</label>
                      <input 
                        type="text" className="bg-transparent border-b border-white/10 text-[10px] text-right focus:outline-none focus:border-cyber-purple"
                        value={formData.metadata.weight}
                        onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, weight: e.target.value}})}
                        placeholder="e.g. 500g"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="cyber-button w-full flex items-center justify-center gap-3 py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                UPLOADING_DATA...
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                INITIALIZE_ASSET_CREATION
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;
