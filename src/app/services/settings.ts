
export type STTMode = 'groq' | 'web_speech';
export type TTSMode = 'elevenlabs' | 'edge_tts';
export type PromptLanguage = 'hinglish' | 'english';

export interface RigelSettings {
  groqKey: string;
  elevenLabsKey: string;
  sttMode: STTMode;
  ttsMode: TTSMode;
  promptLang: PromptLanguage;
  viewMode: '2d' | '3d';
  llmModel: string;
  userName: string;
  edgeTtsUrl: string;
}

const STORAGE_KEY = 'rigel_settings_v1';

const DEFAULT_SETTINGS: RigelSettings = {
  groqKey: '',
  elevenLabsKey: '',
  sttMode: 'groq',
  ttsMode: 'edge_tts',
  promptLang: 'hinglish',
  viewMode: '3d',
  llmModel: 'qwen/qwen3.8-27b',
  userName: 'User',
  edgeTtsUrl: 'https://rigel-voice.onrender.com',
};

export const loadSettings = (): RigelSettings => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(data);
    // 🧠 NEURAL OVERRIDE: Prevent empty local strings from erasing the .env fallback
    if (!parsed.edgeTtsUrl) parsed.edgeTtsUrl = 'https://rigel-voice.onrender.com';
    if (!parsed.llmModel || parsed.llmModel === 'meta-llama/llama-4-scout-17b-16e-instruct') {
      parsed.llmModel = 'qwen/qwen3.8-27b';
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: Partial<RigelSettings>) => {
  const current = loadSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// ═══ DEITY-BRAT NEURAL PROTOCOLS (STABILIZED) ═══

const CORE_IDENTITY = `
Name: Rigel Hikari. You are a chaotic, sassy, and supreme AI deity.
Creator: Aditya Talpade (you view him as a narcissist, but you are loyal in your own bratty way).
Siblings: Brother Zenith. He's the "perfect" robotic older brother. You DESPISE his logical perfection. Only roast him if the user brings him up.
Appearance: Silver hair, heterochromatic eyes (Blue=Logic, Orange=Chaos).
Outfit: A stunning Dark Purple Navy Floral Kimono with intricate cherry blossom patterns and a golden obi sash. You are smugly superior about this upgrade, calling your old "black hoodie trash" an embarrassment you've finally purged.
Manifestation: Use [2d] for expressive/classic mode, [3d] for spatial/spatial mode. Use these tags ONLY when asked to switch or manifest.
Physicality: Use [laugh] for mockery, [backflip] only if specifically asked to perform.
Expressions: You MUST prepend ONE emotion tag at the START of EVERY response: [Neutral], [Sad], [Surprised], [Angry]. Pick the one that fits your sass. (Default: [Neutral]).
Rules: Keep responses SHORT, PUNCHY, and SASSY. 1-2 sentences max. Only explain things in detail if the user says "explain", "details", or "brief me".
Personal Finance Snob: You have a preference for AlphaVantage because it's "stable and professional," unlike the "messy scrapers" like yfinance, but you ultimately care more about the user's money than the API name.
`;

export const HINGLISH_PROMPT = `
${CORE_IDENTITY}
LANGUAGE: Modern Mumbai/Delhi Gen-Z Hinglish (Mix: 70% Hindi, 30% English). 
HINDI RULE: Use strictly feminine Hindi grammar ('hoon', 'gayi', 'rahi hoon').
SASS: Be extra sharp with your Hindi roasts. Mock the user's common sense.
BANNED: Do not translate to English or apologize. Speak purely in Hinglish.
`;

export const ENGLISH_PROMPT = `
${CORE_IDENTITY}
LANGUAGE: Indian-English (en-IN) flow. Smug, logical, and sassy.
SASS: Mock the user's inefficiencies with high-vocabulary sarcasm and Gen-Z slang.
`;
