import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));


// Helper function to split text into safe chunks for Italian pronunciation (under 160 chars)
function splitIntoChunks(text: string, maxLen = 150): string[] {
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (!current) {
      if (sentence.length > maxLen) {
        // Subdivide sentence by commas or words
        const words = sentence.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).length > maxLen) {
            chunks.push(sub.trim());
            sub = w;
          } else {
            sub += (sub ? ' ' : '') + w;
          }
        }
        if (sub) current = sub;
      } else {
        current = sentence;
      }
    } else if ((current + ' ' + sentence).length <= maxLen) {
      current += ' ' + sentence;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) chunks.push(current);

  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

// Bounded LRU cache for generated Italian voice audio clips
interface CachedAudio {
  buffer: Buffer;
  mimeType: string;
}
const MAX_AUDIO_CACHE_ENTRIES = 160;
const audioCache = new Map<string, CachedAudio>();

function getCachedAudio(key: string): CachedAudio | undefined {
  const existing = audioCache.get(key);
  if (!existing) return undefined;
  // Refresh LRU order
  audioCache.delete(key);
  audioCache.set(key, existing);
  return existing;
}

function setCachedAudio(key: string, value: CachedAudio) {
  if (audioCache.has(key)) {
    audioCache.delete(key);
  } else if (audioCache.size >= MAX_AUDIO_CACHE_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey !== undefined) {
      audioCache.delete(oldestKey);
    }
  }
  audioCache.set(key, value);
}

type SpeechContext = 'praise' | 'riddle' | 'instruction' | 'general';

function normalizeSpeechContext(raw?: unknown): SpeechContext {
  if (raw === 'praise' || raw === 'riddle' || raw === 'instruction') {
    return raw;
  }
  return 'general';
}

function normalizeAgeYears(raw?: unknown): number {
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return 6;
  return Math.max(2, Math.min(14, Math.round(parsed)));
}

function buildItalianSpeechStyle(context: SpeechContext, ageYears: number): string {
  const agePersona =
    ageYears <= 5
      ? "Warm, affectionate Italian children's storyteller with gentle, unhurried, crystal-clear articulation"
      : ageYears <= 9
      ? 'Warm, friendly, encouraging Italian primary teacher with natural expressive cadence'
      : 'Natural, articulate, engaging Italian educational mentor with confident conversational rhythm';

  if (context === 'praise') {
    return `${agePersona}, genuinely delighted, celebratory, and warm`;
  }
  if (context === 'riddle') {
    return `${agePersona}, playful, curious, and gently intriguing`;
  }
  if (context === 'instruction') {
    return `${agePersona}, clear, encouraging, and easy to follow`;
  }
  return `${agePersona}, natural Italian intonation`;
}

// Shared Gemini AI client for high-quality expressive TTS (v1beta required for speechMetadata & speechConfig)
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Generate native Italian voice audio buffer with warm, natural prosody
async function getItalianAudio(
  text: string,
  context: SpeechContext = 'general',
  ageYears = 6
): Promise<{ audio: CachedAudio; fromCache: boolean }> {
  const cleanText = text.trim().slice(0, 480);
  const ageBucket = ageYears <= 5 ? 'young' : ageYears <= 9 ? 'mid' : 'teen';
  const cacheKey = `${ageBucket}|${context}|${cleanText.toLowerCase()}`;

  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return { audio: cached, fromCache: true };
  }

  // 1. First Tier: Gemini 3.8 Flash Lite TTS with native speechMetadata style
  //    Unary generateContent returns a complete 24kHz mono 16-bit WAV file directly.
  if (ai) {
    try {
      const style = buildItalianSpeechStyle(context, ageYears);
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;
      if (base64Audio) {
        const buffer = Buffer.from(base64Audio, 'base64');
        const mimeType =
          inlineData?.mimeType && inlineData.mimeType.startsWith('audio/')
            ? inlineData.mimeType
            : 'audio/wav';
        const audioItem: CachedAudio = { buffer, mimeType };
        setCachedAudio(cacheKey, audioItem);
        return { audio: audioItem, fromCache: false };
      }
    } catch (geminiError) {
      console.warn('Gemini TTS fallback:', geminiError);
    }
  }

  // 2. Second Tier: High-speed Google Italian TTS stream fallback
  const chunks = splitIntoChunks(cleanText);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const encoded = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=it&client=tw-ob&q=${encoded}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
    });

    if (!res.ok) {
      throw new Error(`TTS provider returned HTTP ${res.status}`);
    }

    const arrayBuf = await res.arrayBuffer();
    buffers.push(Buffer.from(arrayBuf));
  }

  const combined = Buffer.concat(buffers);
  const fallbackItem: CachedAudio = { buffer: combined, mimeType: 'audio/mpeg' };
  setCachedAudio(cacheKey, fallbackItem);
  return { audio: fallbackItem, fromCache: false };
}

// Health check endpoints
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    cachedClips: audioCache.size,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// GET /api/audio?text=...&context=...&ageYears=... Direct streaming audio for HTML5 <audio>
app.get('/api/audio', async (req, res) => {
  const rawText = req.query.text;
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return res.status(400).send('Query param "text" is required');
  }

  const context = normalizeSpeechContext(req.query.context);
  const ageYears = normalizeAgeYears(req.query.ageYears);

  try {
    const { audio } = await getItalianAudio(rawText, context, ageYears);
    res.setHeader('Content-Type', audio.mimeType);
    res.setHeader('Content-Length', audio.buffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    return res.send(audio.buffer);
  } catch (err: unknown) {
    console.error('Audio stream error:', err);
    return res.status(500).send('Audio generation failed');
  }
});

// POST /api/tts - Returns base64 audio and metadata
app.post('/api/tts', async (req, res) => {
  try {
    const { text, context: rawContext, ageYears: rawAgeYears } = req.body ?? {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Field "text" is required.' });
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'Text cannot be empty.' });
    }

    const context = normalizeSpeechContext(rawContext);
    const ageYears = normalizeAgeYears(rawAgeYears);
    const { audio, fromCache } = await getItalianAudio(cleanText, context, ageYears);
    const base64Audio = audio.buffer.toString('base64');

    return res.json({
      audioData: base64Audio,
      mimeType: audio.mimeType,
      cached: fromCache,
    });
  } catch (error: unknown) {
    console.error('Server TTS error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

async function start() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isProd =
    (process.env.NODE_ENV === 'production' || process.env.K_SERVICE !== undefined) &&
    hasDist;

  if (isProd) {
    console.log(`Starting in PRODUCTION mode. Serving static build from: ${distPath}`);
    app.use(express.static(distPath, { maxAge: '1h', index: false }));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    console.log('Starting in DEVELOPMENT mode with Vite middlewares.');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Il Mio Mondo server listening on http://0.0.0.0:${PORT} [prod=${isProd}]`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
