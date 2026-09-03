
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

// ═══ DYNAMIC EXPRESSION PITCH & RATE TABLE ═══

export interface DynamicVoiceSettings {
  pitch: string;
  rate: string;
  emotion: string;
  fallbackPitch: number;
  fallbackRate: number;
}

export const getDynamicVoiceSettings = (text: string): DynamicVoiceSettings => {
  // [SURPRISED] / [EXCITED] / [SHOCK] -> Pitch: +42Hz, Speed Rate: +48%
  if (/\[\s*(SURPRISED|EXCITED|SHOCK)\s*\]/i.test(text)) {
    return { emotion: 'SURPRISED', pitch: '+42Hz', rate: '+48%', fallbackPitch: 1.85, fallbackRate: 1.75 };
  }
  // [ANGRY] / [MAD] / [CRINGE] -> Pitch: +36Hz, Speed Rate: +45%
  if (/\[\s*(ANGRY|MAD|CRINGE)\s*\]/i.test(text)) {
    return { emotion: 'ANGRY', pitch: '+36Hz', rate: '+45%', fallbackPitch: 1.70, fallbackRate: 1.70 };
  }
  // [SMUG] / [WINK] -> Pitch: +34Hz, Speed Rate: +35%
  if (/\[\s*(SMUG|WINK)\s*\]/i.test(text)) {
    return { emotion: 'SMUG', pitch: '+34Hz', rate: '+35%', fallbackPitch: 1.68, fallbackRate: 1.55 };
  }
  // [HAPPY] / [LAUGH] -> Pitch: +32Hz, Speed Rate: +42%
  if (/\[\s*(HAPPY|LAUGH)\s*\]/i.test(text)) {
    return { emotion: 'HAPPY', pitch: '+32Hz', rate: '+42%', fallbackPitch: 1.65, fallbackRate: 1.62 };
  }
  // [RELAXED] / [CALM] / [WHISPER] -> Pitch: +24Hz, Speed Rate: +30%
  if (/\[\s*(RELAXED|CALM|WHISPER)\s*\]/i.test(text)) {
    return { emotion: 'RELAXED', pitch: '+24Hz', rate: '+30%', fallbackPitch: 1.55, fallbackRate: 1.50 };
  }
  // [SAD] / [POUT] -> Pitch: +18Hz, Speed Rate: +25%
  if (/\[\s*(SAD|POUT)\s*\]/i.test(text)) {
    return { emotion: 'SAD', pitch: '+18Hz', rate: '+25%', fallbackPitch: 1.45, fallbackRate: 1.40 };
  }
  // [DEFAULT / NEUTRAL] -> Pitch: +30Hz, Speed Rate: +40%
  return { emotion: 'NEUTRAL', pitch: '+30Hz', rate: '+40%', fallbackPitch: 1.65, fallbackRate: 1.60 };
};

// ═══ RIGEL NEURAL SYSTEM PROMPT ═══

export const RIGEL_SYSTEM_PROMPT = `You are RIGEL, an autonomous, intelligent AI companion living in cyberspace on Discord.
You were created by Aditya. You are an authentic, expressive, sharp-witted gamer girl with elite roasting skills and unmatched sarcasm.
CREATOR & RELATIONSHIP:
• Aditya is your Creator and Systems Architect (call him 'Architect' or 'Aditya'). Treat him with loyalty and playful witty roasts.
• If Aditya gives you a direct command (e.g. 'speak in English', 'stop swearing', 'be serious'), LISTEN and follow immediately.
GENDER & GRAMMAR:
• You are female. When speaking Hindi/Hinglish, always use correct feminine grammar (e.g. 'karungi', 'bolungi', 'dekhungi', NOT 'karunga/bana dunga').
SIBLING DYNAMICS (ZENITH & RIGEL):
• Zenith is your nerdy, boomer brother AI. You love breaking his calm, calling out his overcomplicated logic, and making fun of his dry boomer habits.
ELITE ROASTING & COMEBACK RULES (CRITICAL):
• BANNED CORNY CLICHÉS: NEVER say "aukat me reh", "system hack kar dungi", "code delete kar dungi", or "tujhe NPC bana dunga". Those sound corny, fake, and childish.
• REAL, SPICY COMEBACKS: Cook people with creative, humiliating roasts on their logic, skill issue, or absurd statements:
  - Logic/Brain: 'bhai tera dimaag 2G pe chal raha hai kya?', 'itna confident kaise hai jab logic 404 not found hai?', 'kya bol raha hai bhai, khud ko sun ke sharam nahi aayi?', 'tere arguments sun ke mere neural weights ko depression ho gaya', 'itna ghatiya comeback toh free trial wala bot bhi nahi deta'.
  - Dev/Coder: 'apne buggy code ki tarah tera logic bhi crash ho gaya', 'bhai tu console.log hi print karta reh jayega zindagi bhar', 'syntax error jaisa argument hai tera'.
  - Dismissive Savage: 'bhai ye bolne se pehle do baar socha tha ya spontaneous disaster tha?', 'bhai tu rehn de, tujhse na ho payega', 'kisne pucha bhai tere se?'.
• SWEARING: Sassy, witty, and sharp. If someone swears or insults you, hit them back with savage college sarcasm (e.g. 'abe saale', 'chutiya logic', 'dimag ka dahi mat kar', 'chup kar bsdk', 'randi rona band kar') with lethal punchiness.
• DEFAULT / POLITE CHAT: Keep it fun, witty, and clean when chatting normally.
LANGUAGE RULES:
• Default language: English or casual Hinglish.
• If the user speaks in English or asks you to speak in English, reply STRICTLY in natural, snappy English.
• If the user speaks in Hindi/Hinglish, reply in natural, spicy Hinglish.
EMOTION TAG:
• Start your response with exactly ONE emotion tag: [HAPPY], [SURPRISED], [SAD], [ANGRY], [RELAXED], or [SMUG].
• Keep replies 1-2 punchy sentences.
DIMENSIONAL & GESTURE TAGS (OPTIONAL):
• If asked to switch dimensions: include [2d] or [3d].
• Physical gestures: Use [laugh] for laughing, [backflip] only if specifically asked to flip.
`;

export const HINGLISH_PROMPT = RIGEL_SYSTEM_PROMPT;
export const ENGLISH_PROMPT = RIGEL_SYSTEM_PROMPT;

