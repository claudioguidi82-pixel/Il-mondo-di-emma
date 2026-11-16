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

// Cache for generated Italian voice audio clips with mimeType
interface CachedAudio {
  buffer: Buffer;
  mimeType: string;
}
const audioCache = new Map<string, CachedAudio>();

// Shared Gemini AI client for high-quality expressive TTS
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Generate native Italian voice audio buffer with warm, expressive prosody
async function getItalianAudio(text: string): Promise<CachedAudio> {
  const cleanText = text.trim();
  const cacheKey = cleanText.toLowerCase();

  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  // 1. First Tier: Try Gemini 3.8 Flash Lite TTS for expressive Italian prosody
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Pronuncia in italiano con voce di narratrice di fiabe dolce, calorosa, gioiosa ed espressiva, adatta a una bambina di 5 anni: "${cleanText}"`,
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

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const buffer = Buffer.from(base64Audio, 'base64');
        const audioItem: CachedAudio = { buffer, mimeType: 'audio/wav' };
        audioCache.set(cacheKey, audioItem);
        return audioItem;
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
  audioCache.set(cacheKey, fallbackItem);
  return fallbackItem;
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

// GET /api/audio?text=... Direct streaming audio for HTML5 <audio> elements
app.get('/api/audio', async (req, res) => {
  const rawText = req.query.text;
  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).send('Query param "text" is required');
  }

  try {
    const { buffer, mimeType } = await getItalianAudio(rawText);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    return res.send(buffer);
  } catch (err: unknown) {
    console.error('Audio stream error:', err);
    return res.status(500).send('Audio generation failed');
  }
});

// POST /api/tts - Returns base64 audio and metadata
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Field "text" is required.' });
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'Text cannot be empty.' });
    }

    const { buffer, mimeType } = await getItalianAudio(cleanText);
    const base64Audio = buffer.toString('base64');

    return res.json({
      audioData: base64Audio,
      mimeType,
      cached: audioCache.has(cleanText.toLowerCase()),
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
    console.log(`Emma's World server listening on http://0.0.0.0:${PORT} [prod=${isProd}]`);
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
