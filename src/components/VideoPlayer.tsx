import React, { useRef, useState, useEffect } from 'react';
import { Loader2, AlertCircle, ExternalLink, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Activity, Cpu, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, onEnded }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isTheater, setIsTheater] = useState(false);
  const [quality, setQuality] = useState('1080p');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract YouTube ID
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Extract Google Drive ID
  const getDriveId = (url: string) => {
    if (!url) return null;
    const regExp = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const youtubeId = getYoutubeId(url);
  const driveId = getDriveId(url);
  const isDirectVideo = url.match(/\.(mp4|webm|ogg)$/) || url.includes('blob:');

  useEffect(() => {
    setLoading(true);
    setError(false);
    
    // Fallback timeout to ensure loader disappears even if events fail
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [url]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTo = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = seekTo;
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMute = !isMuted;
      setIsMuted(newMute);
      videoRef.current.muted = newMute;
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative w-full bg-cyber-black overflow-hidden group flex items-center justify-center transition-all duration-500",
        isTheater ? "aspect-video fixed inset-0 z-[200] bg-black/90 p-12" : "aspect-video"
      )}
    >
      {/* Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] animate-scan" />
      
      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyber-purple/40 z-20" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyber-purple/40 z-20" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyber-purple/40 z-20" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyber-purple/40 z-20" />

      {/* Status Bar Top */}
      <div className="absolute top-6 left-12 right-12 flex justify-between items-center z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyber-purple uppercase tracking-widest">
            <Activity className="w-3 h-3" />
            LIVE_FEED: STABLE
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            <Cpu className="w-3 h-3" />
            BUFFER: 98%
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={cn("w-1 h-3 bg-cyber-purple/20", i < 4 && "bg-cyber-purple")} />
            ))}
            <Wifi className="w-3 h-3 text-cyber-purple ml-1" />
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyber-black z-30">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-cyber-purple/20 rounded-full animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 border-t-2 border-cyber-purple rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyber-purple animate-spin" />
            </div>
          </div>
          <div className="mt-8 space-y-2 text-center">
            <p className="text-[10px] font-mono text-cyber-purple uppercase tracking-[0.5em] animate-pulse">Establishing_Neural_Link...</p>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1 h-1 bg-cyber-purple animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {isDirectVideo ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setIsPlaying(false);
              if (onEnded) onEnded();
            }}
            onClick={togglePlay}
          />

          {/* Big Play Button Overlay */}
          <AnimatePresence>
            {!isPlaying && !loading && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 group/play-btn"
              >
                <div className="p-6 rounded-full bg-cyber-purple/20 border border-cyber-purple/50 group-hover/play-btn:scale-110 group-hover/play-btn:bg-cyber-purple/40 transition-all shadow-[0_0_30px_rgba(188,19,254,0.3)]">
                  <Play className="w-16 h-16 text-cyber-purple fill-cyber-purple/20" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>
          
          {/* Custom Controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-cyber-black to-transparent z-40"
              >
                {/* Progress Bar */}
                <div className="relative group/progress mb-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-cyber-purple group-hover/progress:h-2 transition-all"
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-cyber-purple pointer-events-none shadow-[0_0_10px_rgba(188,19,254,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button onClick={togglePlay} className="text-white hover:text-cyber-purple transition-colors">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                    </button>
                    
                    <div className="flex items-center gap-3 group/volume">
                      <button onClick={toggleMute} className="text-white/60 hover:text-white">
                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/10 appearance-none cursor-pointer accent-cyber-purple"
                      />
                    </div>

                    <div className="text-[10px] font-mono text-white/40">
                      <span className="text-white">{formatTime(videoRef.current?.currentTime || 0)}</span>
                      <span className="mx-1">/</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors" />
                      <span className="text-[10px] font-mono text-white/40 uppercase">{quality}</span>
                    </div>
                    <button 
                      onClick={() => setIsTheater(!isTheater)}
                      className={cn("text-white/40 hover:text-cyber-purple transition-colors", isTheater && "text-cyber-purple")}
                    >
                      <Maximize className="w-5 h-5" />
                    </button>
                    <button onClick={toggleFullscreen} className="text-white/40 hover:text-white transition-colors">
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`}
          title={title || "Video Player"}
          className="w-full h-full border-0 z-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
        />
      ) : driveId ? (
        <iframe
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          title={title || "Google Drive Video Player"}
          className="w-full h-full border-0 z-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-yellow-500 opacity-50" />
          <div className="space-y-2">
            <p className="text-sm font-bold text-white uppercase tracking-tighter">EXTERNAL_SOURCE_DETECTED</p>
            <p className="text-[10px] text-white/40 font-mono max-w-xs mx-auto">
              This video source is hosted externally or format is not directly supported for embedding.
            </p>
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-2 bg-cyber-purple/20 border border-cyber-purple text-cyber-purple font-mono text-[10px] uppercase hover:bg-cyber-purple hover:text-white transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            OPEN_EXTERNAL_LINK
          </a>
        </div>
      )}

      {/* Theater Mode Exit Button */}
      {isTheater && (
        <button 
          onClick={() => setIsTheater(false)}
          className="fixed top-8 right-8 z-[210] p-4 bg-cyber-black border border-white/10 text-white hover:text-cyber-purple transition-all"
        >
          <Minimize className="w-8 h-8" />
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
