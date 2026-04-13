import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, CourseLesson, Order } from '../types';
import { useAuth } from '../App';
import { ArrowLeft, Play, CheckCircle, Circle, Clock, ChevronRight, Layout, BookOpen, MessageSquare, Shield, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import VideoPlayer from '../components/VideoPlayer';
import LessonComments from '../components/LessonComments';

const Learning: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [savingProgress, setSavingProgress] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [playerKey, setPlayerKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'discussion'>('overview');

  const lessons = product?.course_content || [];
  const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id);
  const nextLesson = currentIndex !== -1 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showNextOverlay && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showNextOverlay && countdown === 0) {
      handleNext();
    }
    return () => clearInterval(timer);
  }, [showNextOverlay, countdown]);

  const handleNext = () => {
    if (nextLesson) {
      setShowNextOverlay(false);
      setCountdown(3);
      setSearchParams({ lesson: nextLesson.id });
    }
  };

  const handleRewatch = () => {
    setShowNextOverlay(false);
    setCountdown(3);
    setPlayerKey(prev => prev + 1);
  };

  const onVideoEnded = () => {
    if (currentLesson) {
      if (!completedLessons.includes(currentLesson.id)) {
        toggleLessonCompletion(currentLesson.id);
      }
      if (nextLesson) {
        setShowNextOverlay(true);
        setCountdown(3);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      setLoading(true);
      
      // 1. Fetch product
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!productData || productData.category !== 'course') {
        toast.error('Course not found');
        navigate('/');
        return;
      }
      setProduct(productData);

      // 2. Verify purchase
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productData.id)
        .eq('status', 'approved')
        .maybeSingle();
      
      if (!orderData) {
        toast.error('Access denied. Please purchase this course first.');
        navigate(`/product/${productData.slug || productData.id}`);
        return;
      }
      setOrder(orderData);

      // 3. Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productData.id)
        .maybeSingle();
      
      if (progressData) {
        setCompletedLessons(progressData.completed_lessons || []);
      }

      // 4. Set current lesson
      const lessons = productData.course_content || [];
      if (lessons.length > 0) {
        const selected = lessonId ? lessons.find((l: any) => l.id === lessonId) : lessons[0];
        setCurrentLesson(selected || lessons[0]);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [id, user, navigate, lessonId]);

  const toggleLessonCompletion = async (lessonId: string) => {
    if (!user || !product || savingProgress) return;
    
    setSavingProgress(true);
    const isCompleted = completedLessons.includes(lessonId);
    let newCompleted: string[];
    
    if (isCompleted) {
      newCompleted = completedLessons.filter(id => id !== lessonId);
    } else {
      newCompleted = [...completedLessons, lessonId];
    }

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        product_id: product.id,
        completed_lessons: newCompleted,
        last_accessed_at: new Date().toISOString()
      }, { onConflict: 'user_id,product_id' });

    if (error) {
      toast.error('Failed to save progress');
    } else {
      setCompletedLessons(newCompleted);
      if (!isCompleted) {
        toast.success('Lesson marked as complete! +10 EXP');
        // Award 10 EXP for completing a lesson
        await supabase.from('profiles').update({
          points: (profile?.points || 0) + 10
        }).eq('id', user.id);
      }
    }
    setSavingProgress(false);
  };

  const progressPercentage = product?.course_content?.length 
    ? Math.round((completedLessons.length / product.course_content.length) * 100) 
    : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cyber-black text-cyber-purple font-mono">SYNCHRONIZING_LEARNING_DATA...</div>;
  if (!product || !currentLesson) return null;

  return (
    <div className="min-h-screen bg-cyber-black">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-card-main border-b border-border-main py-3 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link 
              to={`/product/${product.slug || product.id}`}
              className="p-2 text-text-muted hover:text-cyber-purple transition-colors rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-text-main uppercase truncate">{product.title}</h1>
              <p className="text-[10px] font-mono text-cyber-purple uppercase tracking-widest truncate">{currentLesson.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-mono text-text-muted uppercase">Overall_Progress</p>
                <p className="text-xs font-bold text-cyber-purple">{progressPercentage}% Complete</p>
              </div>
              <div className="w-32 h-2 bg-white/5 border border-border-main rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  className="h-full bg-cyber-purple shadow-[0_0_10px_rgba(188,19,254,0.5)]"
                />
              </div>
            </div>
            <div className="w-px h-8 bg-border-main hidden md:block" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest hidden sm:inline">Secure_Access</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-0 lg:h-[calc(100vh-65px)]">
        {/* Main Content: Video Player & Info */}
        <div className="lg:col-span-3 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          <div className="cyber-card p-2 bg-cyber-black relative">
            <div className="aspect-video rounded-lg overflow-hidden border border-border-main relative">
              <VideoPlayer key={playerKey} url={currentLesson.url} title={currentLesson.title} onEnded={onVideoEnded} />
              
              {/* Next Lesson Overlay */}
              <AnimatePresence>
                {showNextOverlay && nextLesson && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-cyber-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="space-y-6 max-w-md w-full">
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono text-cyber-purple uppercase tracking-[0.3em]">Up_Next_In_{countdown}s</p>
                        <h3 className="text-2xl font-bold text-text-main uppercase tracking-tighter">{nextLesson.title}</h3>
                      </div>

                      <div className="relative aspect-video w-full bg-card-main border border-border-main overflow-hidden group">
                        {nextLesson.image_url ? (
                          <img src={nextLesson.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="absolute inset-0 bg-cyber-purple/10 animate-pulse" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-12 h-12 text-cyber-purple" />
                        </div>
                      </div>

                      <div className="flex gap-4 w-full">
                        <button 
                          onClick={handleRewatch}
                          className="flex-1 px-6 py-3 border border-border-main text-text-muted font-mono text-[10px] uppercase hover:text-text-main hover:border-text-main transition-all"
                        >
                          Rewatch
                        </button>
                        <button 
                          onClick={handleNext}
                          className="flex-1 px-6 py-3 bg-cyber-purple text-white font-mono text-[10px] uppercase shadow-[0_0_20px_rgba(188,19,254,0.3)] hover:scale-105 transition-all"
                        >
                          Next_Lesson
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="px-2 py-1 bg-cyber-purple/10 border border-cyber-purple/30 text-[10px] font-mono text-cyber-purple uppercase">
                  Lesson {product.course_content?.findIndex(l => l.id === currentLesson.id)! + 1}
                </div>
                {currentLesson.duration && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase">
                    <Clock className="w-3 h-3" />
                    {currentLesson.duration}
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-bold text-text-main tracking-tighter uppercase">{currentLesson.title}</h2>
              <p className="text-sm text-text-muted leading-relaxed font-mono uppercase tracking-wide">
                {currentLesson.description || 'No description provided for this lesson.'}
              </p>
            </div>

            <button 
              onClick={() => toggleLessonCompletion(currentLesson.id)}
              disabled={savingProgress}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold uppercase tracking-widest transition-all shrink-0 ${
                completedLessons.includes(currentLesson.id)
                  ? 'bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20'
                  : 'bg-cyber-purple text-white shadow-[0_0_20px_rgba(188,19,254,0.3)] hover:scale-105'
              }`}
            >
              {savingProgress ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : completedLessons.includes(currentLesson.id) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
              {completedLessons.includes(currentLesson.id) ? 'Completed' : 'Mark as Complete'}
            </button>
          </div>

          {/* Tabs / Additional Info */}
          <div className="border-t border-border-main pt-8">
            <div className="flex gap-8 border-b border-border-main mb-6">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'overview' ? 'text-cyber-purple border-b-2 border-cyber-purple' : 'text-text-muted hover:text-text-main'
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('resources')}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'resources' ? 'text-cyber-purple border-b-2 border-cyber-purple' : 'text-text-muted hover:text-text-main'
                }`}
              >
                Resources
              </button>
              <button 
                onClick={() => setActiveTab('discussion')}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'discussion' ? 'text-cyber-purple border-b-2 border-cyber-purple' : 'text-text-muted hover:text-text-main'
                }`}
              >
                Discussion
              </button>
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'overview' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-invert max-w-none"
                >
                  <p className="text-text-muted font-mono uppercase text-xs leading-loose">
                    {product.description}
                  </p>
                </motion.div>
              )}

              {activeTab === 'resources' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-8 border border-dashed border-border-main rounded-xl text-center">
                    <BookOpen className="w-8 h-8 text-text-muted opacity-20 mx-auto mb-3" />
                    <p className="text-xs font-mono text-text-muted opacity-40 uppercase tracking-widest">No_Resources_Attached_To_This_Module</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'discussion' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <LessonComments 
                    lessonId={currentLesson.id} 
                    productId={product.id} 
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Curriculum */}
        <div className="lg:col-span-1 bg-card-main border-l border-border-main overflow-y-auto custom-scrollbar">
          <div className="p-6 border-b border-border-main">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-widest flex items-center gap-2">
              <Layout className="w-4 h-4 text-cyber-purple" />
              Course_Content
            </h3>
          </div>
          
          <div className="divide-y divide-border-main">
            {product.course_content?.map((lesson, i) => (
              <button
                key={lesson.id}
                onClick={() => setSearchParams({ lesson: lesson.id })}
                className={`w-full p-4 flex gap-4 text-left transition-all hover:bg-white/5 group ${
                  currentLesson.id === lesson.id ? 'bg-cyber-purple/5 border-l-4 border-cyber-purple' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="shrink-0 mt-1">
                  {completedLessons.includes(lesson.id) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 transition-colors ${
                      currentLesson.id === lesson.id ? 'border-cyber-purple' : 'border-border-main group-hover:border-text-muted'
                    }`} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-mono uppercase mb-1 ${
                    currentLesson.id === lesson.id ? 'text-cyber-purple' : 'text-text-muted'
                  }`}>
                    Part {i + 1} {lesson.duration && `• ${lesson.duration}`}
                  </p>
                  <h4 className={`text-xs font-bold uppercase tracking-tight line-clamp-2 ${
                    currentLesson.id === lesson.id ? 'text-text-main' : 'text-text-muted group-hover:text-text-main'
                  }`}>
                    {lesson.title}
                  </h4>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;
