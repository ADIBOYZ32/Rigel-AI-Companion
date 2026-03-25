import { useState, useRef, useEffect, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Mic, Send, Disc } from 'lucide-react';

import { Live2DHandle } from './Live2DViewer';
import { VRMHandle } from './VRMModelViewer';
import type { ViewMode } from '../App';
import * as ai from '../services/aiService';
import { loadSettings } from '../services/settings';

export function AIChat({
  live2dRef,
  vrmRef,
  switchToMode,
  userName,
  ttsEnabled,
  chatId,
  theme = 'dark',
  userLogo = ''
}: {
  live2dRef: RefObject<Live2DHandle | null>;
  vrmRef: RefObject<VRMHandle | null>;
  switchToMode: (mode: ViewMode) => void;
  userName: string;
  ttsEnabled: boolean;
  chatId: string;
  theme?: 'light' | 'dark';
  userLogo?: string;
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant', content: string, timestamp: number }[]>([]);

  useEffect(() => {
    setLoading(false);
    const saved = localStorage.getItem(`rigel_chat_${chatId}`);
    if (saved) { try { setHistory(JSON.parse(saved)); } catch(e) { setHistory([]); } }
    else { setHistory([]); }
  }, [chatId]);

  useEffect(() => {
    if (history.length === 0 && !localStorage.getItem(`rigel_chat_${chatId}`)) return;
    localStorage.setItem(`rigel_chat_${chatId}`, JSON.stringify(history));
    
    const updateChatList = async () => {
      try {
        const list = JSON.parse(localStorage.getItem('rigel_chat_list') || '[]');
        const existing = list.find((c: any) => c.id === chatId);
        
        let title = existing?.title || 'New Chat';
        if ((!existing || existing.title === 'New Chat') && history.length > 0) {
           title = await ai.generateChatTitle(history[0].role === 'user' ? history[0].content : history[1]?.content || 'Active Session');
        }

        const existingIndex = list.findIndex((c: any) => c.id === chatId);
        if (existingIndex >= 0) {
           list[existingIndex].title = title;
        } else {
           list.push({ id: chatId, title, timestamp: Date.now() });
        }
        localStorage.setItem('rigel_chat_list', JSON.stringify(list));
      } catch (e) {}
    };
    updateChatList();
  }, [history, chatId]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const samplingLoopRef = useRef<number | null>(null);
  const proceduralLoopRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContextRef = useRef<string>(''); 

  useEffect(() => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    (window as any)._audioCtx = audioCtx;
    (window as any)._audioAnalyser = analyser;
    return () => { audioCtx.close(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const sampleVolume = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const vol = Math.min(1.0, (Math.sqrt(sum / data.length) / 50) * 2.5);
    if (live2dRef.current) (live2dRef.current as any).setMouthVolume?.(vol);
    if (vrmRef.current) (vrmRef.current as any).setMouthVolume?.(vol);
    samplingLoopRef.current = requestAnimationFrame(sampleVolume);
  };

  const runProceduralSync = () => {
     const t = Date.now() * 0.01;
     const syllable = Math.abs(Math.sin(t)) * (0.8 + Math.random() * 0.4);
     const vol = Math.min(1.0, syllable * 1.5);
     if (live2dRef.current) (live2dRef.current as any).setMouthVolume?.(vol);
     if (vrmRef.current) (vrmRef.current as any).setMouthVolume?.(vol);
     proceduralLoopRef.current = requestAnimationFrame(runProceduralSync);
  };

  const startTalking = (realAudio: boolean) => {
    const ctx = (window as any)._audioCtx;
    if (ctx?.state === 'suspended') ctx.resume();
    if (realAudio) sampleVolume(); else runProceduralSync();
  };

  const stopTalking = () => {
    if (samplingLoopRef.current) cancelAnimationFrame(samplingLoopRef.current);
    if (proceduralLoopRef.current) cancelAnimationFrame(proceduralLoopRef.current);
    samplingLoopRef.current = null; proceduralLoopRef.current = null;
    if (live2dRef.current) { (live2dRef.current as any).setMouthVolume?.(0); (live2dRef.current as any).stopTalking?.(); }
    if (vrmRef.current) { (vrmRef.current as any).setMouthVolume?.(0); (vrmRef.current as any).stopTalking?.(); }
  };

  const toggleRecording = async () => {
    const settings = loadSettings();
    if (isRecording) {
      if (settings.sttMode === 'web_speech' && (window as any)._recognition) {
        (window as any)._recognition.stop();
      } else {
        mediaRecorderRef.current?.stop();
      }
      setIsRecording(false);
    } else {
      setIsRecording(true);
      
      if (settings.sttMode === 'web_speech') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          handleAIResponse("⚠ Neural Warning: This browser sector does not support Web Speech Manifestation.");
          setIsRecording(false);
          return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = settings.promptLang === 'hinglish' ? 'hi-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.onresult = (e: any) => {
          const text = e.results[0][0].transcript;
          if (text) handleAIResponse(text);
        };
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);
        (window as any)._recognition = recognition;
        recognition.start();
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(2048, 1, 1);
          let maxVolume = 0;
          processor.onaudioprocess = (e) => {
             const input = e.inputBuffer.getChannelData(0);
             let sum = 0;
             for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
             const vol = Math.sqrt(sum / input.length);
             if (vol > maxVolume) maxVolume = vol;
          };
          source.connect(processor);
          processor.connect(audioCtx.destination);

          const recorder = new MediaRecorder(stream, { 
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
          });
          const chunks: Blob[] = [];
          recorder.ondataavailable = (e) => chunks.push(e.data);
          recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            
            if (maxVolume < 0.01) {
               handleAIResponse("⚠ Neural Warning: Your signal was too weak for ingestion. Please manifest more volume.");
               setLoading(false);
            } else {
               setLoading(true);
               try {
                 const text = await ai.transcribeAudio(blob);
                 const filter = (text || '').trim().toLowerCase().replace(/[.,!]/g, '');
                 const hallucinations = ['you', 'thank you', 'subtitle', 'subtitles', 'thanks for watching', 'you more', 'you know'];
                 const isHallucination = hallucinations.includes(filter);
                 if (text && !isHallucination) handleAIResponse(text);
               } catch (err) {} 
               finally { setLoading(false); }
            }
            
            processor.disconnect();
            source.disconnect();
            audioCtx.close();
            stream.getTracks().forEach(t => t.stop());
          };
          mediaRecorderRef.current = recorder;
          recorder.start();
        } catch (err) { setIsRecording(false); }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      chatContextRef.current = `[FILE ATTACHED: ${file.name}]\n--- CONTENT START ---\n${content}\n--- CONTENT END ---\n\n`;
      handleAIResponse(`I have attached a file named ${file.name}. Please read the contents and tell me what you think of it.`);
    };
    reader.readAsText(file);
  };

  const handleAIResponse = async (userText: string) => {
    if (!userText.trim() || loading) return;
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    window.speechSynthesis.cancel();
    stopTalking();

    setLoading(true);
    setInput('');
    const fullPrompt = `${chatContextRef.current}${userText}`;
    chatContextRef.current = ''; 
    setHistory(prev => [...prev, { role: 'user', content: userText, timestamp: Date.now() }]);

    try {
      const settings = loadSettings();
      if (!settings.groqKey) throw new Error("Groq API Key missing!");

      const response = await ai.getGroqCompletion(`${userName}: ${fullPrompt}`, history.slice(-10).map(h => ({ role: h.role, content: h.content })));
      const replyText = response.reply;
      
      // 🧠 Robust Dimensional Switching (Autonomous)
      if (replyText.match(/\[\s*2d( mode)?\s*\]/i)) switchToMode('2d');
      else if (replyText.match(/\[\s*3d( mode)?\s*\]/i)) switchToMode('3d');

      // 🎭 Physical Gestures
      if (replyText.match(/\[\s*laugh\s*\]/i)) vrmRef.current?.triggerAnim('Laughing');
      if (replyText.match(/\[\s*backflip\s*\]/i)) vrmRef.current?.triggerAnim('Backflip');

      // 🧹 Neural Cleaning (invisible to user/TTS)
      const displayReply = replyText
        .replace(/\[\s*2d( mode)?\s*\]/gi, '')
        .replace(/\[\s*3d( mode)?\s*\]/gi, '')
        .replace(/\[\s*laugh\s*\]/gi, '')
        .replace(/\[\s*backflip\s*\]/gi, '')
        .replace(/\[.*?\]/g, '') // Remove any other leftover debug tags
        .trim();
      
      setHistory(prev => [...prev, { role: 'assistant', content: displayReply, timestamp: Date.now() }]);

      if (ttsEnabled) {
         const playFallbackTTS = () => {
             const phonicsText = displayReply.replace(/Rigel/g, "Rye-jel");
             const utterance = new SpeechSynthesisUtterance(phonicsText);
             const voices = window.speechSynthesis.getVoices();
             const neerja = voices.find(v => v.name.includes('Neerja')) || voices.find(v => v.lang.includes('hi-IN')) || voices[0];
             if (neerja) utterance.voice = neerja;
             utterance.rate = 1.6; utterance.pitch = 1.65;
             utterance.onstart = () => startTalking(false); utterance.onend = stopTalking;
             window.speechSynthesis.speak(utterance);
         };

         if (settings.elevenLabsKey) {
            try {
              const audioUrl = await ai.getElevenLabsAudio(displayReply);
              if (audioUrl) {
                  const audio = new Audio(audioUrl);
                  currentAudioRef.current = audio;
                  const ctx = (window as any)._audioCtx;
                  if (ctx && analyserRef.current) {
                      const source = ctx.createMediaElementSource(audio);
                      source.connect(analyserRef.current);
                      analyserRef.current.connect(ctx.destination);
                  }
                  audio.onplay = () => {
                      startTalking(true);
                      if (live2dRef.current) live2dRef.current.syncAudio(audio);
                      if (vrmRef.current) vrmRef.current.syncAudio(audio);
                  };
                  audio.onended = () => { stopTalking(); URL.revokeObjectURL(audioUrl); };
                  audio.play();
              }
            } catch (err: any) {
              playFallbackTTS();
              if (err.message?.includes('401') || err.message?.includes('402')) {
                  setHistory(prev => [...prev, { role: 'assistant', content: "⚠ Neural Sync Warning: Vocal link siphoning is suboptimal. Manifesting standard auditory conduit.", timestamp: Date.now() }]);
              }
            }
         } else {
            playFallbackTTS();
         }
      }
    } catch (e: any) {} 
    finally { setLoading(false); }
  };

  return (
    <div className={`flex flex-col h-full w-full transition-colors ${theme === 'dark' ? 'bg-black/20 text-white' : 'bg-white/20 text-slate-800'}`}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth fancy-scrollbar">
        <AnimatePresence mode="popLayout">
          {history.map((msg, idx) => (
            <motion.div key={`${msg.timestamp}-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border transition-all overflow-hidden ${
                msg.role === 'user' 
                  ? theme === 'dark' ? 'bg-sky-500/10 border-sky-500/30' : 'bg-black/5 border-black/10'
                  : theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-sky-100 border-sky-300'
              }`}>
                {msg.role === 'user' ? (
                  userLogo ? <img src={userLogo} className="w-full h-full object-cover" /> : <div className="text-[8px] font-black text-sky-400">ARC</div>
                ) : (
                  <img src="https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/favicon-R.png" className="w-5 h-5 object-contain" />
                )}
              </div>
              <div className="flex flex-col gap-3 max-w-[85%]">
                <div className={`rounded-[24px] px-6 py-4 text-xs leading-relaxed shadow-xl border transition-all ${
                  msg.role === 'user' 
                    ? 'bg-sky-500/10 border-sky-400/20 text-sky-500 font-medium' 
                    : theme === 'dark' 
                      ? 'bg-white/[0.04] border-white/5 text-white/90 font-light' 
                      : 'bg-white/80 border-black/5 text-slate-700 font-light shadow-sm'
                }`}>
                  {msg.content}
                </div>
                
                {/* 💸 NEURAL PROFIT CONDUIT (Adsterra Manifest) */}
                {msg.role === 'assistant' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 opacity-80 hover:opacity-100 transition-opacity">
                    {[
                      { img: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=300&h=250', link: 'https://rigel-ai.com/siphon' },
                      { img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&h=250', link: 'https://rigel-ai.com/neural' },
                      { img: 'https://images.unsplash.com/photo-1642104704074-907c0698bcd9?auto=format&fit=crop&w=300&h=250', link: 'https://rigel-ai.com/deity' }
                    ].map((ad, i) => (
                      <a key={i} href={ad.link} target="_blank" rel="noopener noreferrer" className={`group overflow-hidden relative rounded-2xl border aspect-[300/250] flex flex-col transition-all hover:scale-[1.01] active:scale-95 ${theme === 'dark' ? 'bg-white/[0.04] border-white/5' : 'bg-black/[0.04] border-black/5 shadow-sm'}`}>
                        <img src={ad.img} className="absolute inset-0 w-full h-full object-cover transition-opacity opacity-60 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black tracking-widest text-sky-400 uppercase drop-shadow-md">Sponsored</span>
                            <span className="text-[9px] font-bold text-white drop-shadow-md">Neural Siphon Pro</span>
                          </div>
                          <div className="px-2 py-1 rounded bg-sky-500 text-[7px] font-black uppercase text-white shadow-lg shadow-sky-500/30">View</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div key="loading-manifest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'}`}>
                <img src="https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/favicon-R.png" className="w-5 h-5 object-contain animate-pulse" />
              </div>
              <div className={`border px-4 py-2 rounded-full flex gap-1 items-center ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                <div className="w-1 h-1 bg-sky-400 animate-bounce rounded-full" />
                <div className="w-1 h-1 bg-sky-400 animate-bounce delay-75 rounded-full" />
                <div className="w-1 h-1 bg-sky-400 animate-bounce delay-150 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6">
        <div className={`backdrop-blur-3xl border rounded-[28px] p-1.5 flex items-center shadow-2xl focus-within:ring-2 transition-all ${theme === 'dark' ? 'bg-[#0a0b14]/50 border-white/10 focus-within:ring-sky-500/20' : 'bg-white border-black/10 shadow-black/5 focus-within:ring-sky-500/10'}`}>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.js,.ts,.tsx,.json,.md,.py" />
          <button onClick={() => fileInputRef.current?.click()} className={`w-10 h-10 flex items-center justify-center transition-all active:scale-90 ${theme === 'dark' ? 'text-white/20 hover:text-white' : 'text-slate-300 hover:text-slate-600'}`}><Paperclip size={18} /></button>
          <input type="text" placeholder={isRecording ? "LISTENING..." : "Siphon message..."} className={`flex-1 bg-transparent border-none outline-none text-[11px] px-4 py-3 tracking-widest font-black uppercase ${isRecording ? 'text-rose-400 animate-pulse' : theme === 'dark' ? 'text-white placeholder:text-white/10' : 'text-slate-800 placeholder:text-slate-300'}`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAIResponse(input)} disabled={loading || isRecording} />
          <div className="flex items-center gap-1">
             <button onClick={toggleRecording} className={`w-10 h-10 flex items-center justify-center transition-all rounded-full ${isRecording ? 'bg-rose-500/20 text-rose-400 animate-pulse' : theme === 'dark' ? 'text-white/20 hover:text-sky-400 hover:bg-sky-400/5' : 'text-slate-300 hover:text-sky-600 hover:bg-sky-50'}`}>{isRecording ? <Disc size={18} /> : <Mic size={18} />}</button>
             <button onClick={() => handleAIResponse(input)} disabled={loading || !input.trim() || isRecording} className="w-10 h-10 flex items-center justify-center bg-sky-600 hover:bg-sky-500 text-white rounded-[22px] transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:opacity-20 disabled:grayscale active:scale-95"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
