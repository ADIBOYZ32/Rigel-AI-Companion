
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function LoadingScreen({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState(0);
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
    const interval = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(onFinished, 1000);
      }
      setProgress(current);
      
      const msgIndex = Math.floor((current / 100) * messages.length);
      if (messages[msgIndex]) setMessage(messages[msgIndex]);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center font-sans overflow-hidden"
    >
      {/* 🖼️ SOLID CINEMATIC BACKGROUND (dh.png) */}
      <div 
        className="absolute inset-0 z-0 opacity-100"
        style={{ 
          backgroundImage: "url('https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/dh.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7)' // Just enough to make white text pop
        }}
      />
      
      {/* 📊 High-End Absolute Transparent Loading System */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
        
        <div className="w-[450px] max-w-[85vw] space-y-8">
           <div className="flex justify-between items-end px-2">
              <div className="flex flex-col gap-2">
                 <span className="text-[11px] font-black uppercase tracking-[0.5em] text-sky-400 drop-shadow-lg">{message}</span>
                 <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-150" />
                 </div>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-4xl font-black italic text-white tracking-widest drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                  {Math.floor(progress)}<span className="text-sky-400 text-lg ml-1 opacity-60">%</span>
                 </span>
              </div>
           </div>
           
           {/* TRULY TRANSPARENT LOADING BAR (Only border and fill visible) */}
           <div className="h-[2px] w-full bg-white/10 rounded-full relative overflow-hidden border-x border-white/20">
             {/* Heterochromatic Gradient Protocol */}
             <motion.div 
               className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-orange-500 shadow-[0_0_30px_rgba(14,165,233,0.8)] relative"
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
             >
                {/* ⚡ High-Ssync Glow Pulse */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white blur-md rounded-full shadow-[0_0_20px_#fff]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
             </motion.div>
           </div>

           <div className="flex justify-center flex-col items-center gap-4 opacity-50 mt-12">
              <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white/80 drop-shadow-md">DEITY MANIFESTATION SECURED</p>
              <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
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
