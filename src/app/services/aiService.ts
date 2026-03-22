
import { loadSettings, HINGLISH_PROMPT } from './settings';

export interface ChatResponse {
  reply: string;
  emotion: string;
  animation?: string;
}

export const getGroqCompletion = async (
  message: string, 
  history: { role: 'user' | 'assistant', content: string }[] = []
): Promise<ChatResponse> => {
  const { groqKey, llmModel } = loadSettings();
  if (!groqKey) throw new Error('Groq Key missing.');

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
