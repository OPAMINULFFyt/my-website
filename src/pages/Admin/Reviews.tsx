import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Review } from '../../types';
import { MessageSquare, Trash2, Star, User, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name), products(title)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const deleteReview = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Delete failed: ' + error.message);
    } else {
      toast.success('Review deleted');
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  return (
    <AdminLayout title="REVIEW_MANAGEMENT">
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-cyber-purple animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 cyber-card">
            <p className="text-text-muted opacity-30 font-mono uppercase tracking-widest">No reviews found in database</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="cyber-card group hover:border-cyber-purple/50 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4 flex-grow">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${review.rating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-text-muted opacity-10'}`} 
                        />
                      ))}
                    </div>
                    <div className="h-4 w-px bg-border-main" />
                    <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted opacity-40 uppercase">
                      <User className="w-3 h-3" />
                      {review.profiles?.full_name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted opacity-40 uppercase">
                      <Package className="w-3 h-3" />
                      {review.products?.title}
                    </div>
                  </div>
                  
                  <p className="text-sm text-text-main opacity-80 italic leading-relaxed">"{review.comment}"</p>
                  
                  <p className="text-[8px] font-mono text-text-muted opacity-20 uppercase tracking-widest">
                    Submitted: {new Date(review.created_at).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => deleteReview(review.id)}
                  className="p-3 border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete Review"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
