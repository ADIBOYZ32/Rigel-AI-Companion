
import { loadSettings, HINGLISH_PROMPT } from './settings';

export interface ChatResponse {
  reply: string;
  emotion: string;
  animation?: string;
}

export const checkAndIncrementUsage = () => {
  const { groqKey } = loadSettings();
  
  // If user provided their own key (not the default VITE key), they bypass the limit
  if (groqKey && groqKey !== import.meta.env.VITE_GROQ_KEY) return true;

  const today = new Date().toDateString();
  const usageStr = localStorage.getItem('rigel_daily_usage');
  let usage = usageStr ? JSON.parse(usageStr) : { date: '', count: 0 };
  
  if (usage.date !== today) {
    localStorage.setItem('rigel_daily_usage', JSON.stringify({ date: today, count: 1 }));
    return true;
  }
  
  if (usage.count >= 6) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }
  
  localStorage.setItem('rigel_daily_usage', JSON.stringify({ date: today, count: usage.count + 1 }));
  return true;
};

export const getGroqCompletion = async (
  message: string, 
  history: { role: 'user' | 'assistant', content: string }[] = []
): Promise<ChatResponse> => {
  const { groqKey, llmModel } = loadSettings();
  if (!groqKey) throw new Error('Groq Key missing.');

  checkAndIncrementUsage();

  const systemPrompt = HINGLISH_PROMPT;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: llmModel || "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: 0.8, // Increased for more chaotic siphoning
      max_tokens: 300
    })
  });

  if (!response.ok) throw new Error(`Fetch Fail: ${response.status}`);
  const data = await response.json();
  const reply = data.choices[0].message.content;
  return parseRigelResponse(reply);
};

const parseRigelResponse = (text: string): ChatResponse => {
  let emotion = 'NEUTRAL';
  let animation = 'IDLE';
  if (text.includes('[LAUGH]')) emotion = 'HAPPY';
  if (text.toLowerCase().includes('brat')) emotion = 'SASSY';
  if (text.includes('[Backflip]')) animation = 'BACKFLIP';
  return { reply: text, emotion, animation };
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const { groqKey } = loadSettings();
  if (!groqKey) throw new Error('Groq Key missing.');
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-large-v3');
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqKey}` },
    body: formData
  });
  if (!response.ok) throw new Error(`Whisper Fail: ${response.status}`);
  const data = await response.json();
  return data.text;
};

export const getElevenLabsAudio = async (text: string): Promise<string> => {
  const { elevenLabsKey } = loadSettings();
  if (!elevenLabsKey) throw new Error('Key Required.');
  try {
     const voiceId = "cgSgspJ2msm6clMCkdW9"; 
     const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
       method: 'POST',
       headers: { 'xi-api-key': elevenLabsKey, 'Content-Type': 'application/json' },
       body: JSON.stringify({
         text,
         model_id: "eleven_multilingual_v2",
         voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.1 }
       })
     });
     if (!response.ok) throw new Error(`TTS Siphon Failure: ${response.status}`);
     const blob = await response.blob();
     return URL.createObjectURL(blob);
  } catch (err: any) { throw err; }
};
export const generateChatTitle = async (firstMessage: string): Promise<string> => {
  const { groqKey } = loadSettings();
  if (!groqKey) return firstMessage.substring(0, 25) + '...';
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: 'system', content: "You are a title generator. Summarize the user's message into a very short 3-5 word title. Return ONLY the title, no quotes or intro." },
          { role: 'user', content: firstMessage }
        ],
        temperature: 0.3,
        max_tokens: 32
      })
    });
    if (!response.ok) return firstMessage.substring(0, 25) + '...';
    const data = await response.json();
    return data.choices[0].message.content.trim().replace(/^"|"$/g, '');
  } catch (e) {
    return firstMessage.substring(0, 25) + '...';
  }
};
