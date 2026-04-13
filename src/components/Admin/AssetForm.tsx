import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import { Save, ArrowLeft, Loader2, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
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
    original_price: 0,
    category: category,
    content_url: '',
    tutorial_url: '',
    image_url: '',
    requirements: '',
    features: '',
    demo_url: '',
    required_points: 0,
    course_content: [] as any[],
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
    
    let contentUrl = formData.content_url;
    if (formData.category === 'course' && formData.course_content.length > 0) {
      contentUrl = formData.course_content[0].url;
    }

    const submissionData = {
      ...formData,
      content_url: contentUrl,
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
                  value={formData.title || ''}
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
                    value={formData.slug || ''}
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
                  value={formData.price ?? 0}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Original Price (Discount System)</label>
                <input 
                  type="number"
                  className="cyber-input"
                  value={formData.original_price ?? 0}
                  onChange={(e) => setFormData({...formData, original_price: Number(e.target.value)})}
                  placeholder="Enter original price if on sale..."
                />
                <p className="text-[8px] font-mono text-white/20 mt-1 uppercase italic">
                  * Leave 0 or empty if no discount.
                </p>
              </div>
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Required EXP Points (Lock)</label>
                <input 
                  type="number"
                  className="cyber-input"
                  value={formData.required_points ?? 0}
                  onChange={(e) => setFormData({...formData, required_points: Number(e.target.value)})}
                  placeholder="0 = No requirement"
                />
                <p className="text-[8px] font-mono text-white/20 mt-1 uppercase italic">
                  * Users must have this many points to purchase.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Image URL</label>
                <input 
                  type="url" required
                  className="cyber-input"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
              {category !== 'course' && (
                <div>
                  <label className="block text-xs font-mono text-white/50 uppercase mb-1">
                    {category === 'file' ? 'Download Link' : 'Register Link'}
                  </label>
                  <input 
                    type="text" required
                    className="cyber-input"
                    value={formData.content_url || ''}
                    onChange={(e) => setFormData({...formData, content_url: e.target.value})}
                    placeholder="Enter URL..."
                  />
                </div>
              )}
              {(category === 'file' || category === 'hardware') && (
                <div>
                  <label className="block text-xs font-mono text-white/50 uppercase mb-1">
                    Tutorial Video URL (Optional)
                  </label>
                  <input 
                    type="text"
                    className="cyber-input"
                    value={formData.tutorial_url || ''}
                    onChange={(e) => setFormData({...formData, tutorial_url: e.target.value})}
                    placeholder="Enter YouTube/Drive/Direct link..."
                  />
                  <p className="text-[8px] font-mono text-white/20 mt-1 uppercase">Related tutorial for this asset</p>
                </div>
              )}
            </div>
          </div>

          {category === 'course' && (
            <div className="space-y-4 border-t border-border-main pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono text-cyber-purple uppercase font-bold tracking-widest">Course_Curriculum</h3>
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      course_content: [
                        ...formData.course_content,
                        { id: Math.random().toString(36).substring(2, 11), title: '', url: '', duration: '', description: '' }
                      ]
                    });
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple text-[10px] font-bold uppercase tracking-widest hover:bg-cyber-purple/20 transition-all rounded-lg"
                >
                  <Plus className="w-3 h-3" />
                  Add_Lesson
                </button>
              </div>

              <div className="space-y-4">
                {formData.course_content.map((lesson, index) => (
                  <div key={lesson.id} className="p-4 bg-white/5 border border-border-main rounded-xl space-y-4 relative group">
                    <button 
                      type="button"
                      onClick={() => {
                        const newContent = [...formData.course_content];
                        newContent.splice(index, 1);
                        setFormData({ ...formData, course_content: newContent });
                      }}
                      className="absolute top-2 right-2 p-1.5 text-red-500/50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-white/30 uppercase mb-1">Lesson Title</label>
                        <input 
                          type="text" required
                          className="cyber-input h-9 text-xs"
                          value={lesson.title || ''}
                          onChange={(e) => {
                            const newContent = [...formData.course_content];
                            newContent[index].title = e.target.value;
                            setFormData({ ...formData, course_content: newContent });
                          }}
                          placeholder="e.g. 01. Introduction"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-white/30 uppercase mb-1">Video URL</label>
                        <input 
                          type="text" required
                          className="cyber-input h-9 text-xs"
                          value={lesson.url || ''}
                          onChange={(e) => {
                            const newContent = [...formData.course_content];
                            newContent[index].url = e.target.value;
                            setFormData({ ...formData, course_content: newContent });
                          }}
                          placeholder="YouTube/Drive/Direct link..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-mono text-white/30 uppercase mb-1">Lesson Thumbnail URL (Optional)</label>
                        <input 
                          type="text"
                          className="cyber-input h-9 text-xs"
                          value={lesson.image_url || ''}
                          onChange={(e) => {
                            const newContent = [...formData.course_content];
                            newContent[index].image_url = e.target.value;
                            setFormData({ ...formData, course_content: newContent });
                          }}
                          placeholder="https://example.com/lesson-thumb.jpg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono text-white/30 uppercase mb-1">Duration</label>
                        <input 
                          type="text"
                          className="cyber-input h-9 text-xs"
                          value={lesson.duration || ''}
                          onChange={(e) => {
                            const newContent = [...formData.course_content];
                            newContent[index].duration = e.target.value;
                            setFormData({ ...formData, course_content: newContent });
                          }}
                          placeholder="e.g. 15:00"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-mono text-white/30 uppercase mb-1">Short Description</label>
                        <input 
                          type="text"
                          className="cyber-input h-9 text-xs"
                          value={lesson.description || ''}
                          onChange={(e) => {
                            const newContent = [...formData.course_content];
                            newContent[index].description = e.target.value;
                            setFormData({ ...formData, course_content: newContent });
                          }}
                          placeholder="What will users learn in this part?"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {formData.course_content.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-border-main rounded-xl">
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest opacity-40 italic">No lessons added yet. Click "Add Lesson" to start building your curriculum.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-white/50 uppercase mb-1">Description</label>
            <textarea 
              rows={3} required
              className="cyber-input"
              value={formData.description || ''}
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
                  value={formData.requirements || ''}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  placeholder="e.g., PC with 8GB RAM, Internet connection..."
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase mb-1">Features (Comma Separated)</label>
                <textarea 
                  rows={2}
                  className="cyber-input"
                  value={formData.features || ''}
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
                  value={formData.demo_url || ''}
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
                        value={formData.metadata.duration || ''}
                        onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, duration: e.target.value}})}
                        placeholder="e.g. 10h 30m"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase">Lessons</label>
                      <input 
                        type="text" className="bg-transparent border-b border-white/10 text-[10px] text-right focus:outline-none focus:border-cyber-purple"
                        value={formData.metadata.lessons || ''}
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
                        value={formData.metadata.version || ''}
                        onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, version: e.target.value}})}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase">File Size</label>
                      <input 
                        type="text" className="bg-transparent border-b border-white/10 text-[10px] text-right focus:outline-none focus:border-cyber-purple"
                        value={formData.metadata.file_size || ''}
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
                        value={formData.metadata.warranty || ''}
                        onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, warranty: e.target.value}})}
                        placeholder="e.g. 1 Year"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase">Weight</label>
                      <input 
                        type="text" className="bg-transparent border-b border-white/10 text-[10px] text-right focus:outline-none focus:border-cyber-purple"
                        value={formData.metadata.weight || ''}
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
