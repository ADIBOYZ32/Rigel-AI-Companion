
import { useEffect, useRef } from 'react';

// 🛰️ MONETAG NATIVE CARDS: High-Fidelity Rigidity Protocol
export function MonetagAdBox({ zoneId = '', className = "" }: { zoneId?: string, className?: string }) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.hasChildNodes() && zoneId) {
      const sandbox = document.createElement('iframe');
      sandbox.style.border = 'none';
      sandbox.style.width = '300px';
      sandbox.style.height = '250px';
      sandbox.style.overflow = 'hidden';
      sandbox.style.backgroundColor = 'transparent';
      sandbox.setAttribute('scrolling', 'no');
      adRef.current.appendChild(sandbox);

      const frameDoc = sandbox.contentDocument || sandbox.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(`
          <style>
            body { margin: 0; padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; background: transparent; }
            * { max-width: 300px !important; max-height: 250px !important; overflow: hidden !important; }
          </style>
          <script src="https://alwingulla.com/88/tag.min.js" data-zone="${zoneId}" async data-cfasync="false"></script>
        `);
        frameDoc.close();
      }
    }
  }, [zoneId]);

  return (
    <div 
      className={`ad-container-manifest flex-shrink-0 rounded-[24px] bg-white/[0.03] border border-white/5 shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center overflow-hidden ${className}`} 
      style={{ width: '300px', height: '250px', maxWidth: '300px', maxHeight: '250px' }}
    >
      <div ref={adRef} style={{ width: '300px', height: '250px', overflow: 'hidden' }} className="pointer-events-auto" />
    </div>
  );
}

// 🛰️ MONETAG TRIPLE GRID: Assistant Response Siphon (Fixed Manifest - NAV BAR)
export function MonetagTripleGrid({ zoneId = '10786654' }) { 
  return (
    <div className="w-full max-w-full overflow-hidden my-4 select-none" style={{ height: '300px' }}>
      {/* 🏙️ ABSOLUTE ENCLOSURE: One row, fixed height, with visible scroll navigation */}
      <div className="flex flex-row gap-4 overflow-x-auto siphon-scrollbar py-3 px-1">
        <div className="flex flex-row gap-6 flex-nowrap min-w-max items-center pr-8">
           <MonetagAdBox zoneId={zoneId} />
           <MonetagAdBox zoneId={zoneId} />
           <MonetagAdBox zoneId={zoneId} />
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
