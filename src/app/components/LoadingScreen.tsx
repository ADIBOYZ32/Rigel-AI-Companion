
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onFinished: () => void;
  isFullyReady?: boolean; 
  progress?: number;
}

export function LoadingScreen({ onFinished, isFullyReady = false, progress: externalProgress = 0 }: LoadingScreenProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [message, setMessage] = useState('Initializing Neural Link...');

  const messages = [
    'Initializing Neural Link...',
    'Calibrating manifestations...',
    'Syncing sibling rivalry subroutines...',
    'Loading High-Fidelity Outfits...',
    'Rigel is manifest...'
  ];

  useEffect(() => {
    let current = 0;
    let hangCount = 0;
    const interval = setInterval(() => {
      // 🛰️ PROGRESS SIPHON LOGIC
      // If we have real external progress, use it. Otherwise, crawl to 85%.
      let target = externalProgress > 0 ? externalProgress : (current < 85 ? (current + 0.5) : 85);
      
      // 🏙️ EMERGENCY BYPASS PROTOCOL: If stuck at 85, start forcing the manifestation
      if (current >= 85 && !isFullyReady) {
          hangCount++;
          if (hangCount > 50) { // After 5 seconds of hanging
              target = current + 0.1; // Creep up to force entry
          }
      }

      if (isFullyReady && (externalProgress >= 98 || externalProgress === 0)) target = 100;

      current = Math.min(target, 100);
      setDisplayProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setTimeout(onFinished, 1500);
      }

      const msgIndex = Math.min(Math.floor((current / 100) * messages.length), messages.length - 1);
      if (messages[msgIndex]) setMessage(messages[msgIndex]);
    }, 100);

    return () => clearInterval(interval);
  }, [externalProgress, isFullyReady, onFinished]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center font-sans overflow-hidden"
    >
      <div 
        className="absolute inset-0 z-0 opacity-100"
        style={{ 
          backgroundImage: "url('https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/dh.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7)'
        }}
      />
      
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
        <div className="w-full max-w-[450px] px-6 space-y-8">
           <div className="flex justify-between items-end px-2">
              <div className="flex flex-col gap-2">
                 <span className="text-[11px] font-black uppercase tracking-[0.5em] text-sky-400 drop-shadow-lg">{message}</span>
                 <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-150" />
                 </div>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-3xl md:text-4xl font-black italic text-white tracking-widest drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                  {Math.floor(displayProgress)}<span className="text-sky-400 text-base md:text-lg ml-1 opacity-60">%</span>
                 </span>
              </div>
           </div>
           
           <div className="h-[2px] w-full bg-white/10 rounded-full relative overflow-hidden border-x border-white/20">
             <motion.div 
               className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-orange-500 shadow-[0_0_30px_rgba(14,165,233,0.8)] relative"
               initial={{ width: 0 }}
               animate={{ width: `${displayProgress}%` }}
               transition={{ type: "spring", stiffness: 50, damping: 20 }}
             >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white blur-md rounded-full shadow-[0_0_20px_#fff]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
             </motion.div>
           </div>

           <div className="flex justify-center flex-col items-center gap-4 opacity-50 mt-12">
              <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white/80 drop-shadow-md">DEITY MANIFESTATION SECURED</p>
              <div className="w-32 md:w-48 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </motion.div>
  );
}
