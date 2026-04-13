import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Product, Category } from '../../types';
import { Plus, Edit2, Trash2, X, Save, BookOpen, FileCode, Cpu, Star, Box, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatPrice, slugify } from '../../lib/utils';
import SafeImage from '../../components/SafeImage';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    title: '',
    description: '',
    price: 0,
    category: 'course',
    content_url: '',
    tutorial_url: '',
    image_url: '',
    is_featured: false,
    stock_status: 'in_stock',
    requirements: '',
    features: [],
    demo_url: '',
    metadata: {}
  });

  const logAction = async (action: string, details: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('system_logs').insert([{
        admin_id: user.id,
        action,
        details
      }]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const { id, ...productData } = currentProduct;
    
    if (!id) return; // Should only be editing here

    let contentUrl = productData.content_url;
    if (productData.category === 'course' && productData.course_content && productData.course_content.length > 0) {
      contentUrl = productData.course_content[0].url;
    }

    const { error } = await supabase.from('products').update({
      ...productData,
      content_url: contentUrl,
      publisher_id: user?.id
    }).eq('id', id);

    if (error) {
      toast.error('Update failed: ' + error.message);
    } else {
      await logAction('UPDATE_PRODUCT', { productId: id, title: productData.title });
      toast.success('Product updated');
      setIsEditing(false);
      fetchProducts();
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_featured: !current }).eq('id', id);
    if (!error) {
      await logAction('TOGGLE_FEATURED', { productId: id, status: !current });
      setProducts(products.map(p => p.id === id ? { ...p, is_featured: !current } : p));
      toast.success(current ? 'Removed from featured' : 'Added to featured');
    }
  };

  const updateStock = async (id: string, status: string) => {
    const { error } = await supabase.from('products').update({ stock_status: status }).eq('id', id);
    if (!error) {
      await logAction('UPDATE_STOCK', { productId: id, status });
      setProducts(products.map(p => p.id === id ? { ...p, stock_status: status } : p));
      toast.success('Stock status updated');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Delete failed: ' + error.message);
    } else {
      await logAction('DELETE_PRODUCT', { productId: id });
      toast.success('Asset purged from system');
      fetchProducts();
    }
  };

  const openEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="ASSET_MANAGEMENT">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link 
          to="/admin/products/add-course"
          className="cyber-card p-4 flex items-center gap-4 hover:border-cyber-purple transition-all group"
        >
          <div className="w-12 h-12 bg-cyber-purple/10 flex items-center justify-center border border-cyber-purple/30 group-hover:bg-cyber-purple/20">
            <BookOpen className="w-6 h-6 text-cyber-purple" />
          </div>
          <div>
            <p className="font-bold text-xs uppercase tracking-widest text-text-main">New_Course</p>
            <p className="text-[10px] text-text-muted opacity-40 font-mono">Deploy Module</p>
          </div>
        </Link>

        <Link 
          to="/admin/products/add-file"
          className="cyber-card p-4 flex items-center gap-4 hover:border-blue-500 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-500/10 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/20">
            <FileCode className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-xs uppercase tracking-widest text-text-main">New_File</p>
            <p className="text-[10px] text-text-muted opacity-40 font-mono">Upload Asset</p>
          </div>
        </Link>

        <Link 
          to="/admin/products/add-hardware"
          className="cyber-card p-4 flex items-center gap-4 hover:border-yellow-500 transition-all group"
        >
          <div className="w-12 h-12 bg-yellow-500/10 flex items-center justify-center border border-yellow-500/30 group-hover:bg-yellow-500/20">
            <Cpu className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="font-bold text-xs uppercase tracking-widest text-text-main">New_Hardware</p>
            <p className="text-[10px] text-text-muted opacity-40 font-mono">Register Module</p>
          </div>
        </Link>
      </div>

      <div className="cyber-card mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted opacity-30" />
          <input 
            type="text"
            placeholder="SEARCH_BY_TITLE_OR_CATEGORY..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cyber-input pl-12 h-14 bg-card-main border-border-main"
          />
        </div>
      </div>

      <div className="cyber-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-card-main border-b border-border-main">
              <tr>
                <th className="px-6 py-4 text-xs font-mono text-text-muted opacity-50 uppercase">Asset</th>
                <th className="px-6 py-4 text-xs font-mono text-text-muted opacity-50 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-mono text-text-muted opacity-50 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-mono text-text-muted opacity-50 uppercase">Price</th>
                <th className="px-6 py-4 text-xs font-mono text-text-muted opacity-50 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-text-muted opacity-30 font-mono">SCANNING_DATABASE...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-text-muted opacity-30 font-mono">NO_ASSETS_FOUND</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-card-main transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-card-main border border-border-main flex items-center justify-center overflow-hidden">
                          <SafeImage src={product.image_url} alt="" className="w-full h-full" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-text-main">{product.title}</p>
                            {product.is_featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                          </div>
                          <p className="text-[10px] text-text-muted opacity-40 font-mono truncate max-w-[200px]">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono border border-cyber-purple/30 px-2 py-1 uppercase text-cyber-purple">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <select 
                          className="bg-transparent text-[10px] font-mono text-text-muted opacity-60 focus:outline-none"
                          value={product.stock_status || 'in_stock'}
                          onChange={(e) => updateStock(product.id, e.target.value)}
                        >
                          <option value="in_stock" className="bg-bg-main">IN_STOCK</option>
                          <option value="out_of_stock" className="bg-bg-main">OUT_OF_STOCK</option>
                          <option value="pre_order" className="bg-bg-main">PRE_ORDER</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-text-main">{formatPrice(product.price)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toggleFeatured(product.id, !!product.is_featured)} 
                          className={`p-2 transition-colors ${product.is_featured ? 'text-yellow-500' : 'text-text-muted opacity-20 hover:text-yellow-500'}`}
                          title="Toggle Featured"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(product)} className="p-2 hover:text-cyber-purple transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="cyber-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-border-main pb-2">
              <h3 className="font-mono text-lg font-bold text-cyber-purple">
                {currentProduct.id ? 'EDIT_ASSET' : 'NEW_ASSET'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-text-muted hover:text-text-main">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Asset Title</label>
                    <input 
                      type="text" required
                      className="cyber-input"
                      value={currentProduct.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setCurrentProduct({
                          ...currentProduct, 
                          title: newTitle,
                          slug: currentProduct.slug || slugify(newTitle)
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">URL Slug (SEO)</label>
                    <input 
                      type="text" required
                      className="cyber-input"
                      value={currentProduct.slug}
                      onChange={(e) => setCurrentProduct({...currentProduct, slug: slugify(e.target.value)})}
                      placeholder="my-cool-product"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Category</label>
                    <select 
                      className="cyber-input bg-bg-main"
                      value={currentProduct.category}
                      onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value as Category})}
                    >
                      <option value="course">Course</option>
                      <option value="file">Project File</option>
                      <option value="hardware">Hardware Kit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Price (BDT)</label>
                    <input 
                      type="number" required
                      className="cyber-input"
                      value={currentProduct.price}
                      onChange={(e) => setCurrentProduct({...currentProduct, price: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Image URL</label>
                    <input 
                      type="url"
                      className="cyber-input"
                      placeholder="https://example.com/image.jpg"
                      value={currentProduct.image_url}
                      onChange={(e) => setCurrentProduct({...currentProduct, image_url: e.target.value})}
                    />
                    <p className="text-[8px] font-mono text-text-muted opacity-20 mt-1 uppercase">Use direct image links (JPG, PNG, WEBP)</p>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Content URL / Download Link</label>
                    <input 
                      type="text"
                      className="cyber-input"
                      value={currentProduct.content_url}
                      onChange={(e) => setCurrentProduct({...currentProduct, content_url: e.target.value})}
                    />
                  </div>
                  {currentProduct.category !== 'course' && (
                    <div>
                      <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Tutorial Video URL (Optional)</label>
                      <input 
                        type="text"
                        className="cyber-input"
                        value={currentProduct.tutorial_url}
                        onChange={(e) => setCurrentProduct({...currentProduct, tutorial_url: e.target.value})}
                        placeholder="YouTube/Drive/Direct link"
                      />
                    </div>
                  )}
                </div>
              </div>

              {currentProduct.category === 'course' && (
                <div className="space-y-4 border-t border-border-main pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono text-cyber-purple uppercase font-bold tracking-widest">Course_Curriculum</h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setCurrentProduct({
                          ...currentProduct,
                          course_content: [
                            ...(currentProduct.course_content || []),
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
                    {(currentProduct.course_content || []).map((lesson: any, index: number) => (
                      <div key={lesson.id} className="p-4 bg-white/5 border border-border-main rounded-xl space-y-4 relative group">
                        <button 
                          type="button"
                          onClick={() => {
                            const newContent = [...(currentProduct.course_content || [])];
                            newContent.splice(index, 1);
                            setCurrentProduct({ ...currentProduct, course_content: newContent });
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
                              value={lesson.title}
                              onChange={(e) => {
                                const newContent = [...(currentProduct.course_content || [])];
                                newContent[index].title = e.target.value;
                                setCurrentProduct({ ...currentProduct, course_content: newContent });
                              }}
                              placeholder="e.g. 01. Introduction"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-white/30 uppercase mb-1">Video URL</label>
                            <input 
                              type="text" required
                              className="cyber-input h-9 text-xs"
                              value={lesson.url}
                              onChange={(e) => {
                                const newContent = [...(currentProduct.course_content || [])];
                                newContent[index].url = e.target.value;
                                setCurrentProduct({ ...currentProduct, course_content: newContent });
                              }}
                              placeholder="YouTube/Drive/Direct link..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-mono text-white/30 uppercase mb-1">Lesson Thumbnail URL (Optional)</label>
                            <input 
                              type="text"
                              className="cyber-input h-9 text-xs"
                              value={lesson.image_url}
                              onChange={(e) => {
                                const newContent = [...(currentProduct.course_content || [])];
                                newContent[index].image_url = e.target.value;
                                setCurrentProduct({ ...currentProduct, course_content: newContent });
                              }}
                              placeholder="https://example.com/lesson-thumb.jpg"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Description</label>
                <textarea 
                  rows={3} required
                  className="cyber-input"
                  value={currentProduct.description}
                  onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Requirements</label>
                    <textarea 
                      rows={2}
                      className="cyber-input"
                      value={currentProduct.requirements}
                      onChange={(e) => setCurrentProduct({...currentProduct, requirements: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Features (Comma Separated)</label>
                    <textarea 
                      rows={2}
                      className="cyber-input"
                      value={currentProduct.features?.join(', ')}
                      onChange={(e) => setCurrentProduct({...currentProduct, features: e.target.value.split(',').map(f => f.trim())})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-text-muted opacity-50 uppercase mb-1">Demo / Preview URL</label>
                    <input 
                      type="url"
                      className="cyber-input"
                      value={currentProduct.demo_url}
                      onChange={(e) => setCurrentProduct({...currentProduct, demo_url: e.target.value})}
                    />
                  </div>
                  
                  <div className="p-4 border border-border-main bg-card-main space-y-3">
                    <p className="text-[10px] font-mono text-cyber-purple uppercase font-bold tracking-widest border-b border-border-main pb-1">Technical_Specs</p>
                    {Object.entries(currentProduct.metadata || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-mono text-text-muted opacity-40 uppercase">{key}</label>
                        <input 
                          type="text" className="bg-transparent border-b border-border-main text-[10px] text-right focus:outline-none focus:border-cyber-purple text-text-main"
                          value={value as string}
                          onChange={(e) => setCurrentProduct({
                            ...currentProduct, 
                            metadata: { ...currentProduct.metadata, [key]: e.target.value }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border-main">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 text-sm font-bold uppercase hover:text-text-main opacity-70">Cancel</button>
                <button type="submit" className="cyber-button flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  SAVE_CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
