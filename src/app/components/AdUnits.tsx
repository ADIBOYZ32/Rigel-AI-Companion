
import { useEffect, useRef } from 'react';

// 🛰️ ADSTERRA NATIVE CARDS: High-Fidelity Rigidity Protocol
export function AdsterraAdBox({ className = "" }: { className?: string }) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.hasChildNodes()) {
      const sandbox = document.createElement('iframe');
      sandbox.style.border = 'none';
      sandbox.style.width = '300px';
      sandbox.style.height = '250px';
      sandbox.style.overflow = 'hidden';
      sandbox.style.backgroundColor = 'transparent';
      sandbox.setAttribute('scrolling', 'no');
      // 🛡️ THE GLOVES: Strict iframe sandboxing to prevent Adsterra from escaping
      // Note: allow-same-origin is required by Adsterra to track impressions, otherwise it throws 403.
      sandbox.setAttribute('sandbox', 'allow-scripts allow-same-origin'); 
      
      adRef.current.appendChild(sandbox);

      const frameDoc = sandbox.contentDocument || sandbox.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(`
          <style>
            body { margin: 0; padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; background: transparent; }
            * { max-width: 300px !important; max-height: 250px !important; overflow: hidden !important; }
          </style>
          <script async="async" data-cfasync="false" src="https://pl28979372.profitablecpmratenetwork.com/5eba32cea087313975cd17a913873bdc/invoke.js"></script>
          <div id="container-5eba32cea087313975cd17a913873bdc"></div>
        `);
        frameDoc.close();
      }
    }
  }, []);

  return (
    <div 
      className={`relative ad-container-manifest flex-shrink-0 rounded-[24px] bg-white/[0.03] border border-white/5 shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center overflow-hidden ${className}`} 
      style={{ width: '300px', height: '250px', maxWidth: '300px', maxHeight: '250px' }}
    >
      <div ref={adRef} style={{ width: '300px', height: '250px', overflow: 'hidden' }} />
      {/* 🛡️ NEURAL SHIELD: Transparent overlay to intercept all clicks */}
      <div className="absolute inset-0 z-[100] bg-transparent cursor-default" title="" />
    </div>
  );
}

// 🛰️ ADSTERRA TRIPLE GRID: Assistant Response Siphon (Untouchable Manifest)
export function AdsterraTripleGrid() { 
  return (
    <div className="w-full max-w-full overflow-hidden my-4 select-none" style={{ height: '300px' }}>
      {/* 🏙️ ABSOLUTE ENCLOSURE: One row, fixed height, with visible scroll navigation */}
      <div className="flex flex-row gap-4 overflow-x-auto siphon-scrollbar py-3 px-1">
        <div className="flex flex-row gap-6 flex-nowrap min-w-max items-center pr-8">
           <AdsterraAdBox />
           <AdsterraAdBox />
           <AdsterraAdBox />
        </div>
      </div>
      <style>{`
        .siphon-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .siphon-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .siphon-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.3);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .siphon-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(14, 165, 233, 0.5);
        }
        .ad-container-manifest { flex: 0 0 300px !important; }
      `}</style>
    </div>
  );
}

// 🚯 Legacy Adsterra Purge Logic
export const AdsterraBanner = () => null;
export const AdNativeFourOne = () => null;
export const AdResponseSiphon = () => null;
