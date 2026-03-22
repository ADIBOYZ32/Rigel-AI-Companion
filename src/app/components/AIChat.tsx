import { useState, useRef, useEffect, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Mic, Send, Smile, Disc } from 'lucide-react';

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
  chatId
}: {
  live2dRef: RefObject<Live2DHandle | null>;
  vrmRef: RefObject<VRMHandle | null>;
  switchToMode: (mode: ViewMode) => void;
  userName: string;
  ttsEnabled: boolean;
  chatId: string;
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
    
    try {
      const list = JSON.parse(localStorage.getItem('rigel_chat_list') || '[]');
      let title = history.length > 0 ? history[0].content.substring(0, 25) + '...' : 'New Chat';
      const existingIndex = list.findIndex((c: any) => c.id === chatId);
      if (existingIndex >= 0) { list[existingIndex].title = title; }
      else { list.push({ id: chatId, title, timestamp: Date.now() }); }
      localStorage.setItem('rigel_chat_list', JSON.stringify(list));
    } catch (e) {}
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
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setLoading(true);
          try {
            const text = await ai.transcribeAudio(blob);
            if (text) handleAIResponse(text);
          } catch (err) {} 
          finally { setLoading(false); }
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
      } catch (err) {}
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
      const displayReply = replyText.replace(/\[.*?\]/g, '').trim();

      if (replyText.toLowerCase().includes('[2d mode]')) switchToMode('2d');
      else if (replyText.toLowerCase().includes('[3d mode]')) switchToMode('3d');
      
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
    <div className="flex flex-col h-full w-full bg-black/20">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth fancy-scrollbar">
        <AnimatePresence mode="popLayout">
          {history.length === 0 && (
            <motion.div key="intro-manifest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-30">
              <Smile size={48} className="text-sky-400 opacity-20" />
              <div className="text-[10px] font-black tracking-[3px] uppercase">Rigel Awaiting Neural Ingestion</div>
              <div className="text-[8px] opacity-40 max-w-xs leading-relaxed uppercase tracking-widest italic">The siphoning will begin shortly. Architect, her manifestation is ready.</div>
            </motion.div>
          )}
          {history.map((msg, idx) => (
            <motion.div key={`${msg.timestamp}-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-[20px] px-6 py-4 text-xs leading-relaxed shadow-xl border ${msg.role === 'user' ? 'bg-sky-500/10 border-sky-400/20 text-sky-50 text-right font-medium' : 'bg-white/[0.03] border-white/5 text-white/90 font-light'}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div key="loading-manifest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-full flex gap-1 items-center">
                <div className="w-1 h-1 bg-sky-400 animate-bounce rounded-full" />
                <div className="w-1 h-1 bg-sky-400 animate-bounce delay-75 rounded-full" />
                <div className="w-1 h-1 bg-sky-400 animate-bounce delay-150 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6">
        <div className="bg-[#0a0b14]/50 backdrop-blur-3xl border border-white/10 rounded-[28px] p-1.5 flex items-center shadow-2xl focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.js,.ts,.tsx,.json,.md,.py" />
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-white transition-all active:scale-90"><Paperclip size={18} /></button>
          <input type="text" placeholder={isRecording ? "LISTENING..." : "Siphon message..."} className={`flex-1 bg-transparent border-none outline-none text-white text-[11px] px-4 py-3 placeholder:text-white/10 tracking-widest font-black uppercase ${isRecording ? 'text-rose-400 animate-pulse' : ''}`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAIResponse(input)} disabled={loading || isRecording} />
          <div className="flex items-center gap-1">
             <button onClick={toggleRecording} className={`w-10 h-10 flex items-center justify-center transition-all rounded-full ${isRecording ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'text-white/20 hover:text-sky-400 hover:bg-sky-400/5'}`}>{isRecording ? <Disc size={18} /> : <Mic size={18} />}</button>
             <button onClick={() => handleAIResponse(input)} disabled={loading || !input.trim() || isRecording} className="w-10 h-10 flex items-center justify-center bg-sky-600 hover:bg-sky-500 text-white rounded-[22px] transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:opacity-20 disabled:grayscale active:scale-95"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
