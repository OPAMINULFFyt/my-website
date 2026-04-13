import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { Send, MessageSquare, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

interface LessonCommentsProps {
  lessonId: string;
  productId: string;
}

const LessonComments: React.FC<LessonCommentsProps> = ({ lessonId, productId }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('lesson_comments')
      .select('*, profiles:user_id(full_name, avatar_url, role)')
      .eq('lesson_id', lessonId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data as any);
    }
  };

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const subscription = supabase
      .channel(`lesson_comments_${lessonId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'lesson_comments',
        filter: `lesson_id=eq.${lessonId}`
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to comment');
    if (!newComment.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('lesson_comments').insert({
      lesson_id: lessonId,
      product_id: productId,
      user_id: user.id,
      content: newComment.trim()
    });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      setNewComment('');
      fetchComments();
    }
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('lesson_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('Failed to delete comment');
    } else {
      toast.success('Comment deleted');
      fetchComments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-l-4 border-cyber-purple pl-4">
        <MessageSquare className="w-5 h-5 text-cyber-purple" />
        <h3 className="text-lg font-bold uppercase tracking-tighter">Discussion_Hub</h3>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts or ask a question..."
          className="cyber-input min-h-[100px] pt-4 pr-12 resize-none"
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="absolute bottom-3 right-3 p-2 bg-cyber-purple text-white rounded-lg shadow-[0_0_15px_rgba(188,19,254,0.3)] hover:scale-110 transition-all disabled:opacity-50 disabled:scale-100"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-white/5 border border-border-main rounded-xl space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-card-main border border-border-main overflow-hidden">
                    {comment.profiles?.avatar_url ? (
                      <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-cyber-purple/10">
                        <User className="w-4 h-4 text-cyber-purple" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-main flex items-center gap-2">
                      {comment.profiles?.full_name || 'Operative'}
                      {comment.profiles?.role !== 'user' && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30 rounded uppercase">
                          {comment.profiles.role}
                        </span>
                      )}
                    </p>
                    <p className="text-[9px] font-mono text-text-muted opacity-50">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {(user?.id === comment.user_id || profile?.role === 'admin' || profile?.role === 'owner') && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-sm text-text-muted font-mono leading-relaxed">
                {comment.content}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-12 border border-dashed border-border-main rounded-xl">
            <MessageSquare className="w-8 h-8 text-text-muted opacity-20 mx-auto mb-3" />
            <p className="text-xs font-mono text-text-muted opacity-40 uppercase tracking-widest">No_Transmission_Detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonComments;
