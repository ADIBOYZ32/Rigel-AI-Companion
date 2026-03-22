
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
  X
} from 'lucide-react';
import { AIChat } from './components/AIChat';
import { Live2DViewer } from './components/Live2DViewer';
import type { Live2DHandle } from './components/Live2DViewer';
import VRMViewer from './components/VRMModelViewer';
import type { VRMHandle } from './components/VRMModelViewer';
import { SettingsPanel } from './components/SettingsPanel';
import { loadSettings } from './services/settings';
import { getCachedAssetUrl } from './services/assetCache';

export type ViewMode = '2d' | '3d';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [vrm3DeverLoaded, setVrm3DeverLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [rigelMinimized, setRigelMinimized] = useState(false);
  const [userName, setUserName] = useState(() => loadSettings().userName || 'User');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  
  const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem('rigel_active_chat') || 'default');
  const [bgUrl, setBgUrl] = useState(`url('https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/room.png')`);

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
    <div className="w-screen h-screen overflow-hidden relative bg-[#0a0b14] font-sans text-white flex">
      
      <div 
        className="absolute inset-0 z-0 opacity-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 70% 30%, #2b0b42 0%, #0a0b14 60%)' }} 
      />

      <header className="absolute top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-6 bg-[#0a0b14]/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
           <div className="text-sky-400 opacity-80"><Activity size={16} /></div>
           <h1 className="text-sm font-bold tracking-tight text-white/90">Rigel AI Companion</h1>
        </div>
        <div className="flex items-center gap-4">
           <div onClick={() => setSettingsOpen(true)} className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all"><Settings size={12} className="text-white/40" /></div>
        </div>
      </header>

      <aside className="w-60 h-full pt-16 z-20 bg-[#0d0e1b]/80 backdrop-blur-3xl border-r border-white/5 flex flex-col p-3 gap-2">
        <SidebarItem icon={<History size={16}/>} label="CONVO HISTORY" active={historyOpen} onClick={() => setHistoryOpen(true)} />
        <SidebarItem icon={<Info size={16}/>} label="ABOUT" active={aboutOpen} onClick={() => setAboutOpen(true)} />
        <div className="mt-auto space-y-2">
           <button onClick={() => setManualOpen(true)} className="flex items-center justify-between w-full h-11 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group">

              <div className="flex items-center gap-3"><HelpCircle size={16} className="text-white/40" /><span className="text-[10px] font-bold text-white/60">MANUAL</span></div>
              <ChevronRight size={14} className="text-white/20 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </aside>

      <main className="flex-1 z-10 flex pt-12 relative overflow-hidden">
        <div className="flex-[7] h-full flex flex-col p-4">
           <div className="flex-1 bg-[#101222]/60 backdrop-blur-2xl border border-white/5 rounded-[24px] overflow-hidden flex flex-col shadow-2xl shadow-black/50">
              <div className="h-14 px-6 flex items-center border-b border-white/5 bg-white/[0.02]">
                 <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">RIGEL CHAT</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <AIChat
                   live2dRef={live2dRef}
                   vrmRef={vrmRef}
                   switchToMode={(m: ViewMode) => switchTo(m)}
                   userName={userName}
                   ttsEnabled={ttsEnabled}
                   chatId={activeChatId}
                />
              </div>
           </div>
        </div>

        <div className="flex-[3] h-full flex flex-col p-4 pl-0">
           <div className="flex-1 bg-transparent flex flex-col">
              <div className="h-10 px-2 flex items-center justify-between"><h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 opacity-90 tracking-[0.3em]">DISPLAY</h2></div>
              <AnimatePresence mode="wait">
                {!rigelMinimized ? (
                  <motion.div 
                    layoutId="pip-rigel"
                    className="flex-1 bg-[#101222]/40 backdrop-blur-3xl border-2 border-sky-500/30 rounded-[32px] overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                  >
                     <div className="absolute inset-0 z-0 opacity-20 pointer-events-none grayscale" style={{ backgroundImage: bgUrl, backgroundSize: 'cover' }} />
                     <div className="absolute inset-0 z-10">
                        {/* ═══ DYNAMIC POINTER-EVENT FIREWALL ═══ */}
                        <div className={`absolute inset-0 transition-opacity duration-700 ${viewMode === '2d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                           <Live2DViewer ref={live2dRef} active={viewMode === '2d'} />
                        </div>
                        {vrm3DeverLoaded && (
                          <div className={`absolute inset-0 transition-opacity duration-700 ${viewMode === '3d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                             <VRMViewer ref={vrmRef} active={viewMode === '3d'} />
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
        <SettingsPanel onClose={() => setSettingsOpen(false)} userName={userName} setUserName={setUserName} ttsEnabled={ttsEnabled} setTtsEnabled={setTtsEnabled} />
      )}
      
      {historyOpen && <HistoryModal onClose={() => setHistoryOpen(false)} activeChatId={activeChatId} setActiveChatId={setActiveChatId} />}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      {manualOpen && <ManualModal onClose={() => setManualOpen(false)} />}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 h-12 px-5 rounded-xl transition-all group ${active ? 'bg-white/5 text-white border border-white/10 shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/[0.02]'}`}>
      <div className={`transition-all ${active ? 'text-sky-400 scale-110' : 'group-hover:text-white/60'}`}>{icon}</div>
      <span className="text-[10px] font-extrabold tracking-[2px] whitespace-nowrap">{label}</span>
    </button>
  );
}

function HistoryModal({ onClose, activeChatId, setActiveChatId }: { onClose: () => void, activeChatId: string, setActiveChatId: (id: string) => void }) {
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
      <div className="w-full max-w-sm h-[60vh] flex flex-col bg-[#0d0e1b] border border-white/10 rounded-2xl p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={16} /></button>
        <h2 className="text-lg font-black text-sky-400 uppercase tracking-widest mb-4">Neural Sessions</h2>
        
        <button onClick={handleCreateNew} className="w-full bg-sky-600/20 hover:bg-sky-500/40 text-sky-400 border border-sky-500/30 text-[10px] font-black uppercase tracking-[0.2em] py-3 rounded-xl transition-all mb-4">
          + Start New Instance
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 fancy-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-white/30 text-xs flex items-center justify-center h-full italic uppercase tracking-widest text-[9px]">No Active Siphons</div>
          ) : (
            sessions.map((s) => (
              <div 
                key={s.id} 
                onClick={() => handleSelect(s.id)}
                className={`p-4 rounded-xl text-xs leading-relaxed border cursor-pointer transition-all ${
                  activeChatId === s.id 
                    ? 'bg-sky-500/20 border-sky-400/50 text-white shadow-[0_0_15px_rgba(14,165,233,0.2)]' 
                    : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/[0.05] hover:text-white hover:border-white/10'
                }`}
              >
                <div className="font-bold truncate">{s.title || 'Unknown Instance'}</div>
                <div className="text-[9px] opacity-40 mt-1 uppercase tracking-wider">{new Date(s.timestamp).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0d0e1b] border border-white/10 rounded-2xl p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={16} /></button>
        <h2 className="text-lg font-black text-sky-400 uppercase tracking-widest mb-4">About Rigel</h2>
        <div className="space-y-4 text-xs leading-relaxed text-white/70">
          <p>This is the <strong className="text-white">Public Showcase Version</strong> of Rigel, an experimental, high-fidelity AI companion.</p>
          <p><strong className="text-sky-300">Creator:</strong> Aditya Talpade</p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <h3 className="text-white font-bold mb-2">Lore & Identity</h3>
            <p>Rigel is a chaotic, sassy "deity" entity trapped in a basic human hoodie (which she claims is just 'effortless' for her). She possesses silver-white hair and heterochromatic eyes representing her dual nature (Blue for Logic, Orange for Chaos).</p>
            <p className="mt-2">She has an older sibling named <strong>Zenith</strong>, who is a "perfect AI". They are complete opposites; she deeply resents his flawless logic and they constantly roast and fight one another.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0d0e1b] border border-white/10 rounded-2xl p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={16} /></button>
        <h2 className="text-lg font-black text-sky-400 uppercase tracking-widest mb-4">Neural Manual</h2>
        <div className="space-y-4 text-xs leading-relaxed text-white/70">
          <div className="bg-sky-500/10 p-4 rounded-xl border border-sky-400/20">
            <h3 className="text-sky-300 font-bold mb-2">How to Run & Connect</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Navigate to the settings (gear icon top right).</li>
              <li>Input your Groq and ElevenLabs API keys.</li>
              <li>Your API keys are saved <strong className="text-white">strictly in your browser's local cache</strong>. They are never sent to a central server.</li>
            </ul>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 mt-2">
            <h3 className="text-white font-bold mb-2">Features</h3>
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
