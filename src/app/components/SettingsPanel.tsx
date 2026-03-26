
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Key, Mic, Volume2, User, AlertTriangle } from 'lucide-react';
import { loadSettings, saveSettings, STTMode, TTSMode } from '../services/settings';

export function SettingsPanel({ 
  onClose,
  userName,
  setUserName,
  ttsEnabled,
  setTtsEnabled,
  userLogo,
  setUserLogo,
  theme = 'dark'
}: { 
  onClose: () => void;
  userName: string;
  setUserName: (val: string) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (val: boolean) => void;
  userLogo: string;
  setUserLogo: (val: string) => void;
  theme?: 'light' | 'dark';
}) {
  const [settings, setSettings] = useState(loadSettings());
  const [error, setError] = useState('');

  const handleChange = (key: string, value: any) => {
    const updated = saveSettings({ [key]: value });
    setSettings(updated);
  };

  const handleNameChange = (val: string) => {
    const badWords = ["cunt", "fuck", "dick", "slut", "pussy", "cuntlover"];
    if (badWords.some(w => val.toLowerCase().includes(w))) {
       setError("BAD WORDS DETECTED: IDENTITY REJECTED");
       return;
    }
    if (/\d/.test(val)) {
       setError("ENCODED STRINGS DETECTED: PROHIBITED");
       return;
    }
    setError('');
    setUserName(val);
    saveSettings({ userName: val });
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-xl p-4 animate-in fade-in duration-300 ${theme === 'dark' ? 'bg-black/80' : 'bg-white/40'}`}>
      <div className={`border rounded-[40px] w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(14,165,233,0.15)] flex flex-col h-[95vh] max-h-[900px] transition-all ${theme === 'dark' ? 'bg-[#0a0b10]/95 border-white/10' : 'bg-white border-black/10'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex flex-col">
            <h2 className="text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]"/>
              Rigel Intelligence Console: Identity & Neural
            </h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all border border-transparent hover:border-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10 custom-scrollbar">
          
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest text-sky-500 font-black flex items-center gap-3">
                <User size={14} /> Identity Protocol
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <input 
                  type="text" 
                  placeholder="ENTER NAME..." 
                  className={`w-full border rounded-[24px] px-8 py-5 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-[#121422] text-white border-white/10 focus:border-sky-500 placeholder:text-white/5' : 'bg-black/5 text-slate-800 border-black/10 focus:border-sky-500 placeholder:text-slate-300'}`}
                  value={userName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-center justify-center">
                <div 
                  onClick={() => document.getElementById('user-logo-input')?.click()}
                  className={`w-16 h-16 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-sky-500 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}
                >
                  {userLogo ? (
                    <img src={userLogo} className="w-full h-full object-cover" alt="User Logo" />
                  ) : (
                    <div className="text-[8px] font-black uppercase text-sky-500 text-center px-1 leading-tight">UL LGO</div>
                  )}
                </div>
                <input 
                  id="user-logo-input" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setUserLogo(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
                <span className={`text-[8px] mt-2 font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>UL Log</span>
              </div>
            </div>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-black uppercase px-2">
                 <AlertTriangle size={12} className="inline mr-2" /> {error}
              </motion.div>
            )}
          </section>
          {/* Neural API Keys */}
          <section className="space-y-6">
            <label className="text-[10px] uppercase tracking-widest text-sky-500 font-black flex items-center gap-3">
              <Key size={14} /> Neural API Keys
            </label>
            <div className="space-y-4">
               <div className="space-y-2">
                  <span className={`text-[9px] uppercase tracking-[0.2em] px-2 font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Groq API Key (Bypasses Limit)</span>
                  <input
                    type="password"
                    placeholder="ENTER GROQ KEY TO BYPASS FREE TRIAL..."
                    className={`w-full border rounded-2xl px-8 py-4 text-xs focus:border-sky-500 outline-none transition-all font-mono ${theme === 'dark' ? 'bg-[#121422] border-white/10 text-white' : 'bg-black/5 border-black/10 text-slate-800'}`}
                    value={settings.groqKey}
                    onChange={(e) => handleChange('groqKey', e.target.value)}
                  />
               </div>
               <div className="space-y-2">
                  <span className={`text-[9px] uppercase tracking-[0.2em] px-2 font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>ElevenLabs Voice Key</span>
                  <input
                    type="password"
                    placeholder="ENTER ELEVENLABS KEY..."
                    className={`w-full border rounded-2xl px-8 py-4 text-xs focus:border-sky-500 outline-none transition-all font-mono ${theme === 'dark' ? 'bg-[#121422] border-white/10 text-white' : 'bg-black/5 border-black/10 text-slate-800'}`}
                    value={settings.elevenLabsKey}
                    onChange={(e) => handleChange('elevenLabsKey', e.target.value)}
                  />
               </div>
               <div className="space-y-2">
                  <span className={`text-[9px] uppercase tracking-[0.2em] px-2 font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Edge TTS Server URL</span>
                  <input
                    type="text"
                    placeholder="https://your-server.onrender.com"
                    className={`w-full border rounded-2xl px-8 py-4 text-xs focus:border-sky-500 outline-none transition-all font-mono ${theme === 'dark' ? 'bg-[#121422] border-white/10 text-white' : 'bg-black/5 border-black/10 text-slate-800'}`}
                    value={settings.edgeTtsUrl}
                    onChange={(e) => handleChange('edgeTtsUrl', e.target.value)}
                  />
               </div>
            </div>
          </section>

          {/* Speech Engine Logic */}
          <section className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-sky-400 font-black flex items-center gap-3">
                <Mic size={14} /> Input Synapse
              </label>
              <select className="w-full bg-[#121422] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none cursor-pointer font-bold" value={settings.sttMode} onChange={(e) => handleChange('sttMode', e.target.value as STTMode)}>
                <option value="web_speech" className="bg-zinc-900">Edge Web Speech</option>
                <option value="groq" className="bg-zinc-900">Whisper Precision</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-sky-400 font-black flex items-center justify-between">
                <div className="flex items-center gap-3"><Volume2 size={14} /> Voice Synthesis</div>
                <button 
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest transition-all ${ttsEnabled ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'}`}
                >
                  {ttsEnabled ? 'ENABLED' : 'MUTED'}
                </button>
              </label>
              <select className={`w-full bg-[#121422] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none cursor-pointer font-bold transition-all ${!ttsEnabled && 'opacity-30 pointer-events-none'}`} value={settings.ttsMode} onChange={(e) => handleChange('ttsMode', e.target.value as TTSMode)}>
                <option value="edge_tts" className="bg-zinc-900">Edge Natural Neural</option>
                <option value="elevenlabs" className="bg-zinc-900">ElevenLabs Master</option>
              </select>
            </div>
          </section>
        </div>

        <div className="px-10 py-10 bg-white/[0.02] border-t border-white/5">
          <button onClick={onClose} className="w-full bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black uppercase tracking-[0.3em] py-5 rounded-[24px] transition-all active:scale-95 shadow-xl shadow-sky-900/20">SAVE</button>
        </div>
      </div>
    </div>
  );
}
