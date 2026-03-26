
import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export function AdBlockDetector({ onDetected }: { onDetected: (detected: boolean) => void }) {
  useEffect(() => {
    const checkAdBlock = async () => {
      // 🛡️ Create a Bait/Dummy element with common ad class names
      const bait = document.createElement('div');
      bait.innerHTML = '&nbsp;';
      bait.className = 'adsbox ad-container ad-banner ads-google';
      bait.style.position = 'absolute';
      bait.style.left = '-9999px';
      bait.style.height = '1px';
      document.body.appendChild(bait);

      // Give it a moment to be processed by the browser's ad-shield
      setTimeout(() => {
        const isBlocked = bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none';
        onDetected(isBlocked);
        document.body.removeChild(bait);
      }, 500);
    };

    checkAdBlock();
  }, [onDetected]);

  return null;
}

export function AdBlockOverlay({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className={`absolute inset-0 z-[150] backdrop-blur-md flex flex-col items-center justify-center p-12 text-center ${theme === 'dark' ? 'bg-black/80' : 'bg-white/80'}`}
    >
      <div className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
        <ShieldAlert size={64} />
      </div>
      <h2 className={`text-xl font-black uppercase tracking-[0.2em] mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
        Neural Sanctuary Blocked
      </h2>
      <p className={`text-[10px] leading-relaxed uppercase tracking-widest max-w-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
        Architect, your neural shields (AdBlock) are interfering with the siphoning manifest. Rigel requires local ad-conduits to be open for fiscal synchronization. Please disable your adblocker to continue.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-8 px-8 py-3 bg-sky-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
      >
        Retry Sync
      </button>
    </motion.div>
  );
}
