
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  History, 
  HelpCircle, 
  Maximize2, 
  Minimize2, 
  Activity, 
  Info,
  ChevronRight,
  X,
  Sun,
  Moon,
  Trash2
} from 'lucide-react';
import { AIChat } from './components/AIChat';
import { Live2DViewer } from './components/Live2DViewer';
import type { Live2DHandle } from './components/Live2DViewer';
import VRMViewer from './components/VRMModelViewer';
import type { VRMHandle } from './components/VRMModelViewer';
import { SettingsPanel } from './components/SettingsPanel';
import { loadSettings } from './services/settings';
import { getCachedAssetUrl } from './services/assetCache';
import { LoadingScreen } from './components/LoadingScreen';

export type ViewMode = '2d' | '3d';

export default function App() {
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [vrm3DeverLoaded, setVrm3DeverLoaded] = useState(true);
  const [vrmActuallyLoaded, setVrmActuallyLoaded] = useState(false);
  const [manifestProgress, setManifestProgress] = useState(0);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [rigelMinimized, setRigelMinimized] = useState(false);
  const [userName, setUserName] = useState(() => loadSettings().userName || 'User');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  
  const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem('rigel_active_chat') || 'default');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('rigel_theme') as 'light' | 'dark') || 'dark');
  const [userLogo, setUserLogo] = useState(() => localStorage.getItem('rigel_user_logo') || '');
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [bgUrl, setBgUrl] = useState(`url('https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/room.png')`);

  useEffect(() => {
    localStorage.setItem('rigel_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('rigel_user_logo', userLogo);
  }, [userLogo]);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobilePortrait(isMobile && window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    getCachedAssetUrl('https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/room.png')
      .then(url => setBgUrl(`url('${url}')`));
  }, []);
  
  useEffect(() => {
    localStorage.setItem('rigel_active_chat', activeChatId);
  }, [activeChatId]);
  
  const live2dRef = useRef<Live2DHandle | null>(null);
  const vrmRef = useRef<VRMHandle | null>(null);

  useEffect(() => {
    const s = loadSettings();
    if (s.viewMode && s.viewMode !== viewMode) {
      switchTo(s.viewMode as ViewMode);
    }
  }, []);

  const switchTo = (mode: ViewMode) => {
    if (mode === '3d' && !vrm3DeverLoaded) {
      setVrm3DeverLoaded(true);
    }
    setViewMode(mode);
  };

  return (
    <div className={`w-screen h-screen overflow-hidden relative font-sans transition-colors duration-500 flex ${theme === 'dark' ? 'bg-[#0a0b14] text-white' : 'bg-[#f5f5fc] text-slate-800'}`}>
      
      <AnimatePresence>
        {!isAppLoaded && <LoadingScreen onFinished={() => setIsAppLoaded(true)} isFullyReady={vrmActuallyLoaded} progress={manifestProgress} />}
      </AnimatePresence>

      <div 
        className="absolute inset-0 z-0 opacity-80 pointer-events-none transition-opacity duration-500"
        style={{ background: theme === 'dark' 
          ? 'radial-gradient(circle at 70% 30%, #2b0b42 0%, #0a0b14 60%)' 
          : 'radial-gradient(circle at 70% 30%, #e0e0ff 0%, #f5f5fc 60%)' 
        }} 
      />

      <header className={`absolute top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-6 transition-all border-b ${theme === 'dark' ? 'bg-[#0a0b14]/60 backdrop-blur-xl border-white/5' : 'bg-white/60 backdrop-blur-xl border-black/5'}`}>
        <div className="flex items-center gap-3">
           <div className="text-sky-500 opacity-80"><Activity size={16} /></div>
           <h1 className={`text-sm font-bold tracking-tight ${theme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>Rigel AI Companion</h1>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
             className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10' : 'bg-black/5 border-black/5 text-slate-400 hover:bg-black/10'}`}
           >
             {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
           </button>
           <div onClick={() => setSettingsOpen(true)} className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10' : 'bg-black/5 border-black/5 text-slate-400 hover:bg-black/10'}`}><Settings size={14} /></div>
        </div>
      </header>

      <aside className={`w-60 h-full pt-16 pb-12 z-20 border-r transition-all flex flex-col ${theme === 'dark' ? 'bg-[#0d0e1b]/80 border-white/5' : 'bg-white/80 border-black/5'}`}>
            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
              <SidebarItem icon={<History size={18}/>} label="Convo History" active={historyOpen} theme={theme} onClick={() => setHistoryOpen(true)} />
              <SidebarItem icon={<Info size={18}/>} label="About" active={aboutOpen} theme={theme} onClick={() => setAboutOpen(true)} />
            </nav>

            {/* 💸 Sidebar Siphon Redacted: Cleansed UI Protocol */}
            {!rigelMinimized && (
              <div className="px-4 py-8 opacity-20 border-t border-white/5 flex justify-center">
                 <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              </div>
            )}
           <div className="mt-auto space-y-2 p-3">
           <button onClick={() => setManualOpen(true)} className={`flex items-center justify-between w-full h-11 px-4 border rounded-xl transition-all group ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 border-white/5' : 'bg-black/5 hover:bg-black/10 border-black/5'}`}>
              <div className="flex items-center gap-3"><HelpCircle size={16} className={theme === 'dark' ? 'text-white/40' : 'text-slate-400'} /><span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>MANUAL</span></div>
              <ChevronRight size={14} className={`${theme === 'dark' ? 'text-white/20' : 'text-slate-300'} group-hover:translate-x-1 transition-transform`} />
           </button>
        </div>
      </aside>

      <main className="flex-1 z-10 flex pt-12 pb-12 relative overflow-hidden">
        <div className="flex-[7] h-full flex flex-col p-4">
           <div className={`flex-1 border rounded-[24px] overflow-hidden flex flex-col shadow-2xl transition-all ${theme === 'dark' ? 'bg-[#101222]/60 backdrop-blur-2xl border-white/5 shadow-black/50' : 'bg-white/60 backdrop-blur-2xl border-black/5 shadow-black/10'}`}>
              <div className={`h-14 px-6 flex items-center border-b transition-all ${theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-black/[0.02]'}`}>
                 <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>RIGEL CHAT</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <AIChat
                   live2dRef={live2dRef}
                   vrmRef={vrmRef}
                   switchToMode={(m: ViewMode) => switchTo(m)}
                   userName={userName}
                   ttsEnabled={ttsEnabled}
                   chatId={activeChatId}
                   theme={theme}
                   userLogo={userLogo}
                />
              </div>
           </div>
        </div>

        <div className="flex-[3] h-full flex flex-col p-4 pl-0">
           <div className="flex-1 bg-transparent flex flex-col">
              <div className="h-10 px-2 flex items-center justify-between"><h2 className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-90 tracking-[0.3em] ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`}>DISPLAY</h2></div>
              <AnimatePresence mode="wait">
                {!rigelMinimized ? (
                  <motion.div 
                    layoutId="pip-rigel"
                    className={`flex-1 border-2 rounded-[32px] overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.3)] transition-all bg-[#0d0e1b] border-sky-500/30`}
                  >
                     <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: bgUrl, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'contrast(1.1) brightness(0.8)' }} />
                     <div className="absolute inset-0 z-10">
                        {/* ═══ DYNAMIC POINTER-EVENT FIREWALL ═══ */}
                        <div className={`absolute inset-0 transition-opacity duration-700 ${viewMode === '2d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                           <Live2DViewer ref={live2dRef} active={viewMode === '2d'} />
                        </div>
                        {vrm3DeverLoaded && (
                          <div className={`absolute inset-0 transition-opacity duration-700 ${viewMode === '3d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                             <VRMViewer ref={vrmRef} active={viewMode === '3d'} onLoaded={() => setVrmActuallyLoaded(true)} onProgress={setManifestProgress} />
                          </div>
                        )}
                     </div>
                     <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                        <button onClick={() => setRigelMinimized(true)} className="p-2 bg-black/40 border border-white/10 rounded-xl text-white/30 hover:text-white transition-all"><Minimize2 size={12} /></button>
                        <div className="flex flex-col gap-1 p-1 bg-black/40 border border-white/5 rounded-xl">
                          <button onClick={() => switchTo('2d')} className={`w-8 h-8 rounded-lg text-[8px] font-black transition-all ${viewMode === '2d' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-white/20 hover:text-white'}`}>2D</button>
                          <button onClick={() => switchTo('3d')} className={`w-8 h-8 rounded-lg text-[8px] font-black transition-all ${viewMode === '3d' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-white/20 hover:text-white'}`}>3D</button>
                        </div>
                     </div>
                  </motion.div>
                ) : (
                  <motion.div layoutId="pip-rigel" onClick={() => setRigelMinimized(false)} className="fixed bottom-8 right-8 w-16 h-16 z-[100] bg-sky-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/40"><Maximize2 size={24} className="text-white" /></motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </main>

       {settingsOpen && (
        <SettingsPanel 
          onClose={() => setSettingsOpen(false)} 
          userName={userName} 
          setUserName={setUserName} 
          ttsEnabled={ttsEnabled} 
          setTtsEnabled={setTtsEnabled} 
          userLogo={userLogo}
          setUserLogo={setUserLogo}
          theme={theme}
          adsEnabled={adsEnabled}
          setAdsEnabled={setAdsEnabled}
        />
      )}
      
      {historyOpen && <HistoryModal onClose={() => setHistoryOpen(false)} activeChatId={activeChatId} setActiveChatId={setActiveChatId} theme={theme} />}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} theme={theme} />}
      {manualOpen && <ManualModal onClose={() => setManualOpen(false)} theme={theme} />}

      {/* Copyright Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 h-8 flex items-center justify-center bg-black/40 backdrop-blur-sm border-t border-white/5">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25">© 2026 Aditya Talpade · All Rights Reserved</span>
      </footer>

      {/* Orientation Warning Overlay */}
      <AnimatePresence>
        {isMobilePortrait && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-12 text-center"
          >
            <motion.div 
              animate={{ rotate: 90 }} 
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-sky-500 mb-8"
            >
              <Activity size={64} />
            </motion.div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">Neural Misalignment</h2>
            <p className="text-white/40 text-[10px] leading-relaxed uppercase tracking-widest">Architect, her manifestation requires horizontal stability. Please rotate your device to landscape for neural sync.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, theme = 'dark', onClick }: { icon: React.ReactNode, label: string, active?: boolean, theme?: 'light' | 'dark', onClick?: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 h-12 px-5 rounded-xl transition-all group border ${
        active 
          ? theme === 'dark' ? 'bg-white/5 text-white border-white/10 shadow-lg' : 'bg-black/5 text-slate-800 border-black/10 shadow-sm'
          : theme === 'dark' ? 'text-white/30 border-transparent hover:text-white hover:bg-white/[0.02]' : 'text-slate-400 border-transparent hover:text-slate-800 hover:bg-black/[0.02]'
      }`}
    >
      <div className={`transition-all ${active ? 'text-sky-500 scale-110' : theme === 'dark' ? 'group-hover:text-white/60' : 'group-hover:text-slate-600'}`}>{icon}</div>
      <span className="text-[10px] font-extrabold tracking-[2px] whitespace-nowrap uppercase">{label}</span>
    </button>
  );
}

function HistoryModal({ onClose, activeChatId, setActiveChatId, theme = 'dark' }: { onClose: () => void, activeChatId: string, setActiveChatId: (id: string) => void, theme?: 'light' | 'dark' }) {
  const [sessions, setSessions] = useState<any[]>([]);
  
  useEffect(() => {
    const list = localStorage.getItem('rigel_chat_list');
    if (list) { try { setSessions(JSON.parse(list).reverse()); } catch(e) {} }
  }, []);

  const handleCreateNew = () => {
    setActiveChatId(Date.now().toString());
    onClose();
  };

  const handleSelect = (id: string) => {
    setActiveChatId(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`w-full max-w-sm h-[60vh] flex flex-col border rounded-2xl p-6 relative shadow-2xl transition-all ${theme === 'dark' ? 'bg-[#0d0e1b] border-white/10' : 'bg-white border-black/10'}`}>
        <button onClick={onClose} className={`absolute top-4 right-4 transition-all ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}><X size={16} /></button>
        <h2 className={`text-lg font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`}>Neural Sessions</h2>
        
        <button onClick={handleCreateNew} className={`w-full text-[10px] font-black uppercase tracking-[0.2em] py-3 rounded-xl transition-all mb-4 border ${theme === 'dark' ? 'bg-sky-600/20 hover:bg-sky-500/40 text-sky-400 border-sky-500/30' : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'}`}>
          + Start New Instance
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 fancy-scrollbar">
          {sessions.length === 0 ? (
            <div className={`text-xs flex items-center justify-center h-full italic uppercase tracking-widest text-[9px] ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>No Active Siphons</div>
          ) : (
            sessions.map((s) => (
              <div 
                key={s.id} 
                className={`p-4 rounded-xl text-xs leading-relaxed border cursor-pointer transition-all flex items-center justify-between group/item ${
                  activeChatId === s.id 
                    ? theme === 'dark' ? 'bg-sky-500/20 border-sky-400/50 text-white shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'bg-sky-500/10 border-sky-400/50 text-sky-800 shadow-sm'
                    : theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/[0.05] hover:text-white hover:border-white/10' : 'bg-black/[0.02] border-black/5 text-slate-500 hover:bg-black/[0.05] hover:text-slate-800 hover:border-black/10'
                }`}
                onClick={() => handleSelect(s.id)}
              >
                <div className="flex-1 truncate">
                  <div className="font-bold truncate">{s.title || 'Unknown Instance'}</div>
                  <div className="text-[9px] opacity-40 mt-1 uppercase tracking-wider">{new Date(s.timestamp).toLocaleString()}</div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const list = JSON.parse(localStorage.getItem('rigel_chat_list') || '[]');
                    const filtered = list.filter((item: any) => item.id !== s.id);
                    localStorage.setItem('rigel_chat_list', JSON.stringify(filtered));
                    localStorage.removeItem(`rigel_chat_${s.id}`);
                    setSessions(filtered.reverse());
                    if (activeChatId === s.id) setActiveChatId(Date.now().toString());
                  }} 
                  className={`p-2 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all ${theme === 'dark' ? 'hover:bg-red-500/20 text-white/40 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AboutModal({ onClose, theme = 'dark' }: { onClose: () => void, theme?: 'light' | 'dark' }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`w-full max-w-lg border rounded-2xl p-6 relative shadow-2xl transition-all ${theme === 'dark' ? 'bg-[#0d0e1b] border-white/10' : 'bg-white border-black/10'}`}>
        <button onClick={onClose} className={`absolute top-4 right-4 transition-all ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}><X size={16} /></button>
        <h2 className={`text-lg font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`}>About Rigel</h2>
        <div className={`space-y-4 text-xs leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
          <p>This is the <strong className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>Public Showcase Version</strong> of Rigel, an experimental, high-fidelity AI companion.</p>
          <p><strong className="text-sky-500">Creator:</strong> Aditya Talpade</p>
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
            <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Lore & Identity</h3>
            <p>Rigel is a chaotic, sassy "deity" entity who now wears a dark navy floral kimono adorned with cherry blossom patterns and a golden obi sash. She'll reluctantly admit it's an upgrade from her old hoodie — which she now calls "embarrassing trash." She possesses silver-white hair and heterochromatic eyes representing her dual nature (Blue for Logic, Orange for Chaos).</p>
            <p className="mt-2">She has an older sibling named <strong>Zenith</strong>, who is a "perfect AI". They are complete opposites; she deeply resents his flawless logic and they constantly roast and fight one another.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualModal({ onClose, theme = 'dark' }: { onClose: () => void, theme?: 'light' | 'dark' }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`w-full max-w-lg border rounded-2xl p-6 relative shadow-2xl transition-all ${theme === 'dark' ? 'bg-[#0d0e1b] border-white/10' : 'bg-white border-black/10'}`}>
        <button onClick={onClose} className={`absolute top-4 right-4 transition-all ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}><X size={16} /></button>
        <h2 className={`text-lg font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`}>Neural Manual</h2>
        <div className={`space-y-4 text-xs leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-sky-500/10 border-sky-400/20' : 'bg-sky-50 border-sky-200'}`}>
            <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-sky-300' : 'text-sky-700'}`}>How to Run & Connect</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Navigate to the settings (gear icon top right).</li>
              <li>Input your Groq and ElevenLabs API keys.</li>
              <li>Your API keys are saved <strong className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>strictly in your browser's local cache</strong>. They are never sent to a central server.</li>
            </ul>
          </div>
          <div className={`p-4 rounded-xl border mt-2 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
            <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Features</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Hardware Agnostic:</strong> Engineered with precision logic (not just vibe coded).</li>
              <li><strong>Document Ingestion:</strong> Use the paperclip icon to attach files. Rigel will immediately read and analyze the document in her next response.</li>
              <li><strong>Dimensional Shift:</strong> Switch between 2D (Live2D) and 3D (VRM) manifestations instantly.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
