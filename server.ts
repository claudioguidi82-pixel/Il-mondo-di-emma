import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

// Bounded LRU cache for generated Italian voice audio clips (in-memory only, never persisted to disk)
interface CachedAudio {
  buffer: Buffer;
  mimeType: string;
}
const MAX_AUDIO_CACHE_ENTRIES = 450;
const audioCache = new Map<string, CachedAudio>();

function getCachedAudio(key: string): CachedAudio | undefined {
  const existing = audioCache.get(key);
  if (!existing) return undefined;
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

function clampMetric(raw: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function sanitizeShortText(raw: unknown, maxLen: number, fallback = ''): string {
  if (typeof raw !== 'string') return fallback;
  return raw
    .replace(/[<>{}`$]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function buildItalianMaleSpeechStyle(context: SpeechContext, ageYears: number): string {
  const agePersona =
    ageYears <= 5
      ? "Warm, affectionate Italian male children's storyteller with gentle, unhurried, crystal-clear articulation"
      : ageYears <= 9
      ? 'Warm, friendly, encouraging Italian male teacher with natural expressive cadence and clear diction'
      : 'Natural, articulate, engaging Italian male educational mentor with confident conversational rhythm';

  if (context === 'praise') {
    return `${agePersona}, genuinely delighted, celebratory, and warm`;
  }
  if (context === 'riddle') {
    return `${agePersona}, playful, curious, and gently intriguing`;
  }
  if (context === 'instruction') {
    return `${agePersona}, clear, reassuring, and easy to follow`;
  }
  return `${agePersona}, natural Italian intonation`;
}

// Shared Gemini AI clients:
// - aiText: standard client for text/JSON reasoning (gemini-4-hydrogen)
// - aiTts: v1beta client required for speechMetadata & speechConfig (gemini-3.8-flash-lite-tts / gemini-3.8-flash-tts)
const aiText = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const aiTts = process.env.GEMINI_API_KEY
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

// Single consistent Italian MALE voice across the entire app (never flips to female fallback)
const APP_MALE_VOICE_NAME = 'Charon';
const TTS_LITE_MODEL = 'gemini-3.8-flash-lite-tts';
const TTS_STUDIO_MODEL = 'gemini-3.8-flash-tts';
const TTS_MODEL_CHAIN = [TTS_LITE_MODEL, TTS_STUDIO_MODEL] as const;
const MANDATORY_OVERVIEW_OPENING = 'Benvenuti genitori, a voi il report del giorno.';

// Per-model quota circuit breaker so exhausted Free Tier models enter cooldown cleanly
// without repeatedly hitting Gemini 429s or spamming server warnings.
const modelQuotaBlockedUntil = new Map<string, number>();

class QuotaCooldownError extends Error {
  public readonly retryAfterSeconds: number;
  public readonly model: string;

  constructor(model: string, retryAfterSeconds: number) {
    super(`Quota giornaliera temporaneamente esaurita per ${model}.`);
    this.name = 'QuotaCooldownError';
    this.model = model;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isQuotaExhaustedError(err: unknown): boolean {
  if (err instanceof QuotaCooldownError) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota')
  );
}

function parseRetryDelaySeconds(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  const isDailyLimit =
    lower.includes('per day') ||
    lower.includes('perday') ||
    lower.includes('daily');
  const retrySecMatch = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
  if (retrySecMatch) {
    const parsed = parseInt(retrySecMatch[1], 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      if (isDailyLimit || parsed > 180) {
        // Keep server cooldown short (3 min) so key upgrades or rolling windows recover promptly
        return 180;
      }
      return Math.min(Math.max(parsed, 15), 65);
    }
  }
  if (isDailyLimit) {
    return 180;
  }
  return 45;
}

function getModelQuotaRetrySeconds(model: string): number {
  const until = modelQuotaBlockedUntil.get(model) ?? 0;
  const remainingMs = until - Date.now();
  if (remainingMs <= 0) {
    if (until > 0) modelQuotaBlockedUntil.delete(model);
    return 0;
  }
  return Math.ceil(remainingMs / 1000);
}

function isModelQuotaBlocked(model: string): boolean {
  return getModelQuotaRetrySeconds(model) > 0;
}

function markModelQuotaBlocked(model: string, err: unknown): number {
  const alreadyBlocked = isModelQuotaBlocked(model);
  const retryAfterSeconds = parseRetryDelaySeconds(err);
  modelQuotaBlockedUntil.set(model, Date.now() + retryAfterSeconds * 1000);
  if (!alreadyBlocked) {
    console.info(
      `[TTS/AI Quota] Model ${model} reached quota limit; cooling down for ${retryAfterSeconds}s.`
    );
  }
  return retryAfterSeconds;
}

async function getItalianMaleAudio(
  text: string,
  context: SpeechContext = 'general',
  ageYears = 6
): Promise<{ audio: CachedAudio; fromCache: boolean }> {
  const cleanText = text.trim().replace(/\s+/g, ' ').slice(0, 480);
  const ageBucket = ageYears <= 5 ? 'young' : ageYears <= 9 ? 'mid' : 'teen';
  const cacheKey = `v2_male_${APP_MALE_VOICE_NAME}|${ageBucket}|${context}|${cleanText.toLowerCase()}`;

  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return { audio: cached, fromCache: true };
  }

  if (!aiTts) {
    throw new Error('Gemini TTS non configurato sul server.');
  }

  const style = buildItalianMaleSpeechStyle(context, ageYears);
  let lastQuotaErr: QuotaCooldownError | null = null;
  let lastErr: unknown = null;

  for (const modelName of TTS_MODEL_CHAIN) {
    const remainingCooldown = getModelQuotaRetrySeconds(modelName);
    if (remainingCooldown > 0) {
      lastQuotaErr = new QuotaCooldownError(modelName, remainingCooldown);
      continue;
    }

    try {
      const response = await callWithTransientRetry(
        () =>
          aiTts.models.generateContent({
            model: modelName,
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
                  prebuiltVoiceConfig: { voiceName: APP_MALE_VOICE_NAME },
                },
              },
            },
          }),
        1,
        10500
      );

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;
      if (!base64Audio) {
        throw new Error('Risposta audio vuota dal modello TTS.');
      }

      const playable = ensurePlayableAudioBase64(base64Audio, inlineData?.mimeType);
      const buffer = Buffer.from(playable.audioData, 'base64');
      const audioItem: CachedAudio = { buffer, mimeType: playable.mimeType };
      setCachedAudio(cacheKey, audioItem);
      return { audio: audioItem, fromCache: false };
    } catch (err) {
      if (isQuotaExhaustedError(err)) {
        const retrySec = markModelQuotaBlocked(modelName, err);
        lastQuotaErr = new QuotaCooldownError(modelName, retrySec);
        continue;
      }
      lastErr = err;
    }
  }

  if (lastQuotaErr) {
    throw lastQuotaErr;
  }
  throw lastErr ?? new Error('Servizio vocale maschile temporaneamente non disponibile.');
}

interface OverviewTurn {
  speaker: 'Marco';
  line: string;
  style: string;
}

function ensureMandatoryOverviewOpening(turns: OverviewTurn[]): OverviewTurn[] {
  if (turns.length === 0) {
    return [
      {
        speaker: 'Marco',
        line: MANDATORY_OVERVIEW_OPENING,
        style: 'Warm, realistic, articulate Italian male child development expert',
      },
    ];
  }

  const normalized = turns.map((t) => ({
    speaker: 'Marco' as const,
    line: t.line.trim(),
    style:
      t.style ||
      'Warm, realistic, articulate Italian male child development expert',
  }));

  const firstLine = normalized[0].line;
  const openingRegex =
    /^benvenuti\s+genitori[,!.:;\s]*a\s+voi\s+il\s+report\s+del\s+giorno[.!:\s]*/i;

  if (openingRegex.test(firstLine)) {
    const remainder = firstLine.replace(openingRegex, '').trim();
    normalized[0].line = remainder
      ? `${MANDATORY_OVERVIEW_OPENING} ${remainder}`
      : MANDATORY_OVERVIEW_OPENING;
  } else {
    // Strip any generic competing greeting at the very start so the opening is natural and never duplicated
    const strippedGreeting = firstLine
      .replace(
        /^(?:benvenuti(?:\s+a\s+tutti(?:\s+i\s+genitori)?)?|ciao\s+a\s+tutti(?:\s+i\s+genitori)?|buongiorno\s+genitori|cari\s+genitori)[,!.:;\s]*/i,
        ''
      )
      .trim();
    normalized[0].line = strippedGreeting
      ? `${MANDATORY_OVERVIEW_OPENING} ${strippedGreeting.charAt(0).toUpperCase()}${strippedGreeting.slice(1)}`
      : MANDATORY_OVERVIEW_OPENING;
  }

  return normalized;
}

// Health check endpoints
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  const liteRetry = getModelQuotaRetrySeconds(TTS_LITE_MODEL);
  const studioRetry = getModelQuotaRetrySeconds(TTS_STUDIO_MODEL);
  const anyModelAvailable = liteRetry === 0 || studioRetry === 0;
  const ttsRetryAfterSeconds = anyModelAvailable
    ? 0
    : Math.min(liteRetry || 3600, studioRetry || 3600);
  res.json({
    status: 'ok',
    cachedClips: audioCache.size,
    voiceName: APP_MALE_VOICE_NAME,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    ttsLiteAvailable: Boolean(aiTts) && anyModelAvailable,
    ttsRetryAfterSeconds,
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
    const { audio } = await getItalianMaleAudio(rawText, context, ageYears);
    res.setHeader('Content-Type', audio.mimeType);
    res.setHeader('Content-Length', audio.buffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    return res.send(audio.buffer);
  } catch (err: unknown) {
    if (err instanceof QuotaCooldownError) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds));
      return res.status(429).send('Audio TTS quota temporarily exhausted');
    }
    return res.status(503).send('Audio generation temporarily unavailable');
  }
});

// POST /api/tts - Returns base64 audio and metadata (consistent Italian male voice)
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
    const { audio, fromCache } = await getItalianMaleAudio(cleanText, context, ageYears);
    const base64Audio = audio.buffer.toString('base64');

    return res.json({
      audioData: base64Audio,
      mimeType: audio.mimeType,
      cached: fromCache,
    });
  } catch (error: unknown) {
    if (error instanceof QuotaCooldownError) {
      res.setHeader('Retry-After', String(error.retryAfterSeconds));
      return res.status(429).json({
        error: 'Quota giornaliera del servizio vocale Gemini temporaneamente esaurita.',
        code: 'QUOTA_EXHAUSTED',
        retryAfterSeconds: error.retryAfterSeconds,
      });
    }
    return res.status(503).json({
      error: 'Servizio vocale temporaneamente occupato.',
      code: 'TTS_UNAVAILABLE',
    });
  }
});

// Animal sound vocal imitation specifications for Gemini TTS (warm, playful, unmistakably clear for 2-7yo kids)
interface AnimalSoundSpec {
  canonicalId: string;
  onomatopoeia: string;
  style: string;
}

const ANIMAL_SOUND_SPECS: Record<string, AnimalSoundSpec> = {
  dog: {
    canonicalId: 'dog',
    onomatopoeia: 'Bau! Bau! Bau!',
    style:
      'Playful, enthusiastic, crystal-clear Italian animal sound imitation of a happy dog barking loudly for toddlers: crisp energetic double-and-triple bark, zero extra words',
  },
  cat: {
    canonicalId: 'cat',
    onomatopoeia: 'Miaaaao! Miaaao!',
    style:
      'Warm, expressive, realistic playful imitation of a cute cat meowing gently for toddlers: rising and gliding sweet meow, zero extra words',
  },
  cow: {
    canonicalId: 'cow',
    onomatopoeia: 'Muuuuuuu! Muuuuu!',
    style:
      'Deep, resonant, warm playful imitation of a farm cow mooing for toddlers: long rich melodic moo, zero extra words',
  },
  sheep: {
    canonicalId: 'sheep',
    onomatopoeia: 'Beeeeeee! Beeeee!',
    style:
      'Playful, trembling, warm imitation of a fluffy farm sheep bleating for toddlers: expressive vibrato baa sound, zero extra words',
  },
  rooster: {
    canonicalId: 'rooster',
    onomatopoeia: 'Chicchirichììì! Chicchirichììì!',
    style:
      'Bright, cheerful, theatrical dawn rooster crow imitation in Italian for toddlers: energetic rising crow call, zero extra words',
  },
  duck: {
    canonicalId: 'duck',
    onomatopoeia: 'Qua! Qua! Qua! Qua!',
    style:
      'Playful, nasal, lively imitation of a happy pond duck quacking for toddlers: quick crisp rhythmic quacks, zero extra words',
  },
  pig: {
    canonicalId: 'pig',
    onomatopoeia: 'Oink! Oink! Gruf! Gruf!',
    style:
      'Playful, comical, warm imitation of a cute little farm pig oinking and grunting for toddlers: short bouncy oinks, zero extra words',
  },
  frog: {
    canonicalId: 'frog',
    onomatopoeia: 'Cra! Cra! Cra! Cra!',
    style:
      'Playful, bouncy, resonant imitation of a green pond frog croaking for toddlers: rhythmic croaking calls, zero extra words',
  },
  bird: {
    canonicalId: 'bird',
    onomatopoeia: 'Cip! Cip! Cip! Cip!',
    style:
      'Light, cheerful, bright musical imitation of a little bird chirping for toddlers: happy crisp chirps, zero extra words',
  },
  owl: {
    canonicalId: 'owl',
    onomatopoeia: 'Huuu! Hu-huuuu!',
    style:
      'Warm, gentle, cozy nighttime imitation of a wise forest owl hooting softly for toddlers: hollow melodic hoot, zero extra words',
  },
  bee: {
    canonicalId: 'bee',
    onomatopoeia: 'Bzzzzzz! Bzzzzzz!',
    style:
      'Playful, lively humming imitation of a friendly honeybee buzzing among flowers for toddlers: vibrating energetic buzz, zero extra words',
  },
  horse: {
    canonicalId: 'horse',
    onomatopoeia: 'Hiiii-hahaha! Hiiii-ha!',
    style:
      'Lively, joyful, playful imitation of a galloping horse neighing and whinnying for toddlers: bright cheerful whinny, zero extra words',
  },
  lion: {
    canonicalId: 'lion',
    onomatopoeia: 'Roooaaaar! Roooaaaar!',
    style:
      'Big, warm, playful theatrical imitation of a friendly savanna lion roaring for toddlers: deep rumbling joyful roar, zero extra words',
  },
  elephant: {
    canonicalId: 'elephant',
    onomatopoeia: 'Paaaa-uuuuh! Paaaa-uuuuh!',
    style:
      'Energetic, bright, joyful imitation of a friendly elephant trumpeting with its trunk for toddlers: loud brassy playful trumpet call, zero extra words',
  },
  giraffe: {
    canonicalId: 'giraffe',
    onomatopoeia: 'Gnam! Gnam! Gnam!',
    style:
      'Playful, cheerful imitation of a tall friendly giraffe happily munching crispy acacia leaves for toddlers: lively crunching munch sounds, zero extra words',
  },
  camel: {
    canonicalId: 'camel',
    onomatopoeia: 'Brrrr-huuu! Brrrr-huuu!',
    style:
      'Warm, playful, comical imitation of a friendly desert camel humming and grumbling softly for toddlers, zero extra words',
  },
  zebra: {
    canonicalId: 'zebra',
    onomatopoeia: 'Hiiii-ha! Hiiii-ha!',
    style:
      'Bright, energetic, playful imitation of a lively savanna zebra whinnying cheerfully for toddlers, zero extra words',
  },
};

const ANIMAL_ALIAS_TO_CANONICAL: Record<string, string> = {
  dog: 'dog',
  cane: 'dog',
  cagnolino: 'dog',
  cat: 'cat',
  gatto: 'cat',
  gattino: 'cat',
  cow: 'cow',
  mucca: 'cow',
  sheep: 'sheep',
  pecora: 'sheep',
  pecorella: 'sheep',
  rooster: 'rooster',
  gallo: 'rooster',
  gallina: 'rooster',
  duck: 'duck',
  anatra: 'duck',
  papera: 'duck',
  pig: 'pig',
  maiale: 'pig',
  maialino: 'pig',
  frog: 'frog',
  rana: 'frog',
  ranocchia: 'frog',
  bird: 'bird',
  uccellino: 'bird',
  rondine: 'bird',
  pulcino: 'bird',
  owl: 'owl',
  gufo: 'owl',
  gufetto: 'owl',
  bee: 'bee',
  ape: 'bee',
  horse: 'horse',
  cavallo: 'horse',
  cavallino: 'horse',
  lion: 'lion',
  leone: 'lion',
  elephant: 'elephant',
  elefante: 'elephant',
  giraffe: 'giraffe',
  giraffa: 'giraffe',
  camel: 'camel',
  cammello: 'camel',
  zebra: 'zebra',
};

function resolveAnimalSoundSpec(rawId?: unknown): AnimalSoundSpec | null {
  if (typeof rawId !== 'string') return null;
  const cleaned = rawId.toLowerCase().trim().slice(0, 32);
  const canonical = ANIMAL_ALIAS_TO_CANONICAL[cleaned];
  if (!canonical) return null;
  return ANIMAL_SOUND_SPECS[canonical] || null;
}

async function getAnimalSoundAudio(
  spec: AnimalSoundSpec
): Promise<{ audio: CachedAudio; fromCache: boolean }> {
  const cacheKey = `v1_animal_sound_${APP_MALE_VOICE_NAME}|${spec.canonicalId}`;
  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return { audio: cached, fromCache: true };
  }

  if (!aiTts) {
    throw new Error('Gemini TTS non configurato sul server.');
  }

  let lastQuotaErr: QuotaCooldownError | null = null;
  let lastErr: unknown = null;

  for (const modelName of TTS_MODEL_CHAIN) {
    const remainingCooldown = getModelQuotaRetrySeconds(modelName);
    if (remainingCooldown > 0) {
      lastQuotaErr = new QuotaCooldownError(modelName, remainingCooldown);
      continue;
    }

    try {
      const response = await aiTts.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: spec.onomatopoeia,
                speechMetadata: {
                  style: spec.style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: APP_MALE_VOICE_NAME },
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;
      if (!base64Audio) {
        throw new Error('Risposta audio vuota per il verso animale.');
      }

      const playable = ensurePlayableAudioBase64(base64Audio, inlineData?.mimeType);
      const buffer = Buffer.from(playable.audioData, 'base64');
      const audioItem: CachedAudio = { buffer, mimeType: playable.mimeType };
      setCachedAudio(cacheKey, audioItem);
      return { audio: audioItem, fromCache: false };
    } catch (err) {
      if (isQuotaExhaustedError(err)) {
        const retrySec = markModelQuotaBlocked(modelName, err);
        lastQuotaErr = new QuotaCooldownError(modelName, retrySec);
        continue;
      }
      lastErr = err;
    }
  }

  if (lastQuotaErr) {
    throw lastQuotaErr;
  }
  throw lastErr ?? new Error('Verso vocale temporaneamente occupato.');
}

// POST /api/animal-sound - Returns expressive cached Gemini vocal animal sound clip
app.post('/api/animal-sound', async (req, res) => {
  try {
    const spec = resolveAnimalSoundSpec(req.body?.animalId);
    if (!spec) {
      return res.status(400).json({ error: 'Unknown or missing "animalId".' });
    }
    const { audio, fromCache } = await getAnimalSoundAudio(spec);
    return res.json({
      animalId: spec.canonicalId,
      onomatopoeia: spec.onomatopoeia,
      audioData: audio.buffer.toString('base64'),
      mimeType: audio.mimeType,
      cached: fromCache,
    });
  } catch (error: unknown) {
    if (error instanceof QuotaCooldownError) {
      res.setHeader('Retry-After', String(error.retryAfterSeconds));
      return res.status(429).json({
        error: 'Quota giornaliera TTS temporaneamente esaurita.',
        code: 'QUOTA_EXHAUSTED',
        retryAfterSeconds: error.retryAfterSeconds,
      });
    }
    return res.status(503).json({
      error: 'Verso vocale temporaneamente occupato.',
      code: 'ANIMAL_TTS_UNAVAILABLE',
    });
  }
});

// GET /api/animal-sound?animalId=dog - Direct streaming audio for HTML5 <audio>
app.get('/api/animal-sound', async (req, res) => {
  try {
    const spec = resolveAnimalSoundSpec(req.query.animalId);
    if (!spec) {
      return res.status(400).send('Unknown or missing "animalId"');
    }
    const { audio } = await getAnimalSoundAudio(spec);
    res.setHeader('Content-Type', audio.mimeType);
    res.setHeader('Content-Length', audio.buffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    return res.send(audio.buffer);
  } catch (error: unknown) {
    if (error instanceof QuotaCooldownError) {
      res.setHeader('Retry-After', String(error.retryAfterSeconds));
      return res.status(429).send('Animal sound quota temporarily exhausted');
    }
    return res.status(503).send('Animal sound temporarily unavailable');
  }
});

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientRetryableError(err: unknown): boolean {
  if (isQuotaExhaustedError(err)) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('500') ||
    msg.includes('internal') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed')
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function callWithTransientRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  timeoutMs = 12000
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs);
    } catch (err) {
      lastErr = err;
      if (attempt < retries && isTransientRetryableError(err)) {
        await sleepMs(600 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function wrapPcm16AsWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

function ensurePlayableAudioBase64(
  base64Audio: string,
  rawMimeType?: string
): { audioData: string; mimeType: string } {
  const buf = Buffer.from(base64Audio, 'base64');
  const lowerMime = (rawMimeType || '').toLowerCase();
  const hasRiffHeader =
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WAVE';

  // If Gemini returned raw L16 PCM without a WAV header, wrap it so mobile <audio> plays reliably
  if (lowerMime.includes('l16') || lowerMime.includes('pcm') || (!hasRiffHeader && !lowerMime.includes('mpeg') && !lowerMime.includes('mp3') && !lowerMime.includes('ogg'))) {
    const rateMatch = lowerMime.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? Math.max(8000, Math.min(48000, parseInt(rateMatch[1], 10))) : 24000;
    const wavBuf = wrapPcm16AsWav(buf, sampleRate, 1);
    return {
      audioData: wavBuf.toString('base64'),
      mimeType: 'audio/wav',
    };
  }

  return {
    audioData: base64Audio,
    mimeType:
      rawMimeType && rawMimeType.startsWith('audio/') ? rawMimeType : 'audio/wav',
  };
}

interface OverviewMetricsInput {
  displayAlias: string;
  gender: 'm' | 'f' | 'n';
  ageYears: number;
  ageBandTitle: string;
  currentLevel: number;
  completedExercises: number;
  sessionsCount: number;
  ic: number;
  ip: number;
  ia: number;
  ir: number;
  it: number;
  ieDelta: number;
  assignedBandLabel: string;
  autonomousTotal: number;
  assistedTotal: number;
  annualDeltaIc: number;
  chcAbilities: Array<{ code: string; title: string; score: number; band: string }>;
  domains: Array<{ name: string; ic: number; completed: number; autonomous: number }>;
}

function buildLocalFallbackOverviewScript(m: OverviewMetricsInput): {
  title: string;
  keyHighlights: string[];
  turns: OverviewTurn[];
} {
  const sortedChc = [...m.chcAbilities].sort((a, b) => b.score - a.score);
  const topStrength = sortedChc[0]?.title || 'ragionamento visivo e gioco esplorativo';
  const secondStrength = sortedChc[1]?.title || 'attenzione e memoria di lavoro';
  const growthArea = sortedChc[sortedChc.length - 1]?.title || 'linguaggio e nuove associazioni';

  const pronounArt = m.gender === 'f' ? 'la nostra piccola esploratrice' : 'il nostro piccolo esploratore';
  const prontoWord = m.gender === 'f' ? 'pronta' : 'pronto';
  const bravoWord = m.gender === 'f' ? 'bravissima' : 'bravissimo';

  const familyTip1 =
    m.ageYears <= 4
      ? 'giocate a riconoscere insieme i colori e i versi degli animali durante una passeggiata o leggendo un libro illustrato'
      : m.ageYears <= 7
      ? 'provate a creare piccole storie a voce alternandovi una frase a testa o a contare gli oggetti in cucina mentre cucinate'
      : 'dedicate dieci minuti a giochi da tavolo di logica, indovinelli o piccole sfide creative con carta e matita';

  const familyTip2 =
    m.ageYears <= 4
      ? 'lasciate sempre qualche secondo di silenzio dopo una domanda, così il bambino può rispondere con i propri tempi e sentirsi orgoglioso'
      : 'festeggiate lo sforzo e la curiosità anche quando serve un secondo tentativo, rafforzando la fiducia e l’autonomia';

  const title = `Report del Giorno · ${m.displayAlias}`;

  if (m.completedExercises <= 3) {
    return {
      title,
      keyHighlights: [
        `Percorso appena avviato nella fascia ${m.ageBandTitle} (${m.completedExercises} prove registrate).`,
        `Ambiente calibrato su misura per ${m.ageYears} anni, senza pressione e con rinforzo guidato.`,
        'Giocate qualche livello insieme per arricchire il profilo cognitivo nelle prossime sessioni.',
      ],
      turns: ensureMandatoryOverviewOpening([
        {
          speaker: 'Marco',
          line: `${MANDATORY_OVERVIEW_OPENING} Oggi osserviamo insieme i primissimi passi di ${m.displayAlias}, nella fascia ${m.ageBandTitle}.`,
          style: 'Warm, realistic, articulate Italian male podcast host and child educator',
        },
        {
          speaker: 'Marco',
          line: `Il percorso è appena cominciato con ${m.completedExercises} attività completate: è il momento più bello, quello della scoperta libera e spontanea.`,
          style: 'Warm, encouraging Italian male educator',
        },
        {
          speaker: 'Marco',
          line: `Con poche prove è normale che gli indici si stiano ancora stabilizzando, ed è importante ricordare che si tratta sempre di un profilo ludico interno, mai di un test clinico.`,
          style: 'Calm, reassuring Italian male educator',
        },
        {
          speaker: 'Marco',
          line: `A ${m.ageYears} anni la cosa più preziosa è il piacere di esplorare senza fretta. Il sistema adatta automaticamente difficoltà e supporti in base a come risponde ${pronounArt}.`,
          style: 'Warm, thoughtful Italian male educator',
        },
        {
          speaker: 'Marco',
          line: `Quando giocate insieme, lasciate che ascolti con calma la voce guida e provi in autonomia prima di suggerire la risposta.`,
          style: 'Calm, practical Italian male educator',
        },
        {
          speaker: 'Marco',
          line: `Fuori dallo schermo, ecco due idee semplici per oggi: ${familyTip1}; e poi ${familyTip2}.`,
          style: 'Friendly, enthusiastic Italian male educator',
        },
        {
          speaker: 'Marco',
          line: `Giocate ancora qualche livello con serenità e presto avremo un quadro ancora più ricco dei suoi punti di forza. Buon gioco in famiglia!`,
          style: 'Warm, uplifting Italian male podcast host',
        },
      ]),
    };
  }

  const evolutionPhrase =
    m.ieDelta > 0
      ? `mostra una bella crescita positiva di più ${m.ieDelta} punti rispetto all’inizio`
      : m.ieDelta < 0
      ? `sta attraversando una fase di consolidamento naturale, utile per fissare bene le basi`
      : `mantiene un andamento stabile e regolare nel tempo`;

  return {
    title,
    keyHighlights: [
      `Indice di competenza generale ${m.ic}/100 (${m.assignedBandLabel}) su ${m.completedExercises} prove valide.`,
      `Punti di forza principali: ${topStrength} e ${secondStrength} (Autonomia ${m.ia}/100).`,
      `Area da allenare giocando con calma: ${growthArea}.`,
    ],
    turns: ensureMandatoryOverviewOpening([
      {
        speaker: 'Marco',
        line: `${MANDATORY_OVERVIEW_OPENING} Oggi commentiamo insieme il percorso educativo di ${m.displayAlias}, che ha completato ${m.completedExercises} attività valide raggiungendo il livello ${m.currentLevel}.`,
        style: 'Warm, realistic, articulate Italian male podcast host and child educator',
      },
      {
        speaker: 'Marco',
        line: `I dati raccontano un quadro molto incoraggiante: l’indice di competenza generale è a ${m.ic} su cento, nella fascia ${m.assignedBandLabel}.`,
        style: 'Warm, clear Italian male child development expert',
      },
      {
        speaker: 'Marco',
        line: `Guardando l’autonomia siamo a ${m.ia} su cento, con ${m.autonomousTotal} risposte risolte al primo tentativo e ${m.assistedTotal} completate grazie ai supporti guidati.`,
        style: 'Thoughtful, warm Italian male educator',
      },
      {
        speaker: 'Marco',
        line: `È un equilibrio molto sano, perché anche l’indice di prestazione è a ${m.ip} su cento e l’evoluzione nel tempo ${evolutionPhrase}.`,
        style: 'Clear, empathetic Italian male educator',
      },
      {
        speaker: 'Marco',
        line: `Tra le aree cognitive emergono con particolare brillantezza ${topStrength} e ${secondStrength}: segnali chiari di curiosità e buona padronanza per i suoi ${m.ageYears} anni.`,
        style: 'Encouraging, warm Italian male educator',
      },
      {
        speaker: 'Marco',
        line: `Invece su ${growthArea} possiamo offrire qualche occasione di gioco in più senza alcuna fretta: è ${bravoWord} quando può procedere con i propri tempi e sentirsi ${prontoWord}.`,
        style: 'Gentle, reassuring Italian male educator',
      },
      {
        speaker: 'Marco',
        line: `Ricordiamo sempre che questo report è una bussola educativa interna basata sul gioco, mai una valutazione clinica del quoziente intellettivo.`,
        style: 'Calm, authoritative Italian male educator',
      },
      {
        speaker: 'Marco',
        line: `Per continuare a stimolare la crescita lontano dallo schermo, ecco due consigli pratici per oggi: ${familyTip1}. E soprattutto, ${familyTip2}. Buon gioco in famiglia!`,
        style: 'Warm, joyful Italian male podcast host',
      },
    ]),
  };
}

// Transient in-memory cache for Audio Overview responses (never persisted to disk)
interface CachedOverviewResponse {
  createdAt: number;
  payload: Record<string, unknown>;
}
const overviewResponseCache = new Map<string, CachedOverviewResponse>();
const OVERVIEW_CACHE_TTL_MS = 10 * 60 * 1000;

// POST /api/report-audio-overview
// Generates a NotebookLM-style dual-host Italian learning evaluation Audio Overview
// strictly from transient numeric metrics (zero server storage, zero PII/photo/birthDate).
app.post('/api/report-audio-overview', async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (
      !req.body ||
      typeof req.body !== 'object' ||
      (body.ic === undefined && body.currentLevel === undefined && body.completedExercises === undefined)
    ) {
      res.status(400).json({ error: 'Missing report metrics payload.' });
      return;
    }
    const anonymize = Boolean(body.anonymize);
    const gender = body.gender === 'f' ? 'f' : body.gender === 'm' ? 'm' : 'n';
    const fallbackAlias =
      gender === 'f' ? 'la bambina' : gender === 'm' ? 'il bambino' : 'il piccolo esploratore';
    const displayAlias = anonymize
      ? fallbackAlias
      : sanitizeShortText(body.displayAlias, 28, fallbackAlias) || fallbackAlias;

    const ageYears = normalizeAgeYears(body.ageYears);
    const ageBandTitle = sanitizeShortText(body.ageBandTitle, 64, 'Fascia evolutiva');
    const currentLevel = clampMetric(body.currentLevel, 1, 9999, 1);
    const completedExercises = clampMetric(body.completedExercises, 0, 50000, 0);
    const sessionsCount = clampMetric(body.sessionsCount, 1, 9999, 1);
    const ic = clampMetric(body.ic, 0, 100, 0);
    const ip = clampMetric(body.ip, 0, 100, 0);
    const ia = clampMetric(body.ia, 0, 100, 0);
    const ir = clampMetric(body.ir, 0, 100, 0);
    const it = clampMetric(body.it, 0, 100, 0);
    const ieDelta = clampMetric(body.ieDelta, -100, 100, 0);
    const assignedBandLabel = sanitizeShortText(body.assignedBandLabel, 40, 'In esplorazione');
    const autonomousTotal = clampMetric(body.autonomousTotal, 0, 50000, 0);
    const assistedTotal = clampMetric(body.assistedTotal, 0, 50000, 0);
    const annualDeltaIc = clampMetric(body.annualDeltaIc, -100, 100, 0);

    const rawChc = Array.isArray(body.chcAbilities) ? body.chcAbilities.slice(0, 6) : [];
    const chcAbilities = rawChc.map((item) => {
      const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        code: sanitizeShortText(obj.code, 10, 'CHC'),
        title: sanitizeShortText(obj.shortTitle, 40, 'Abilità'),
        score: clampMetric(obj.score, 0, 100, 0),
        band: sanitizeShortText(obj.bandLabel, 32, 'In esplorazione'),
      };
    });

    const rawDomains = Array.isArray(body.domains) ? body.domains.slice(0, 8) : [];
    const domains = rawDomains.map((item) => {
      const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        name: sanitizeShortText(obj.shortLabel, 36, 'Materia'),
        ic: clampMetric(obj.ic, 0, 100, 0),
        completed: clampMetric(obj.completed, 0, 10000, 0),
        autonomous: clampMetric(obj.correctFirstTry, 0, 10000, 0),
      };
    });

    const metricsInput: OverviewMetricsInput = {
      displayAlias,
      gender,
      ageYears,
      ageBandTitle,
      currentLevel,
      completedExercises,
      sessionsCount,
      ic,
      ip,
      ia,
      ir,
      it,
      ieDelta,
      assignedBandLabel,
      autonomousTotal,
      assistedTotal,
      annualDeltaIc,
      chcAbilities,
      domains,
    };

    const forceRetryAudio = Boolean(body.forceRetry);
    const cacheKey = JSON.stringify({
      v: 'v3_male_only_report_del_giorno',
      displayAlias,
      gender,
      ageYears,
      currentLevel,
      completedExercises,
      ic,
      ip,
      ia,
      ieDelta,
    });
    const cachedOverview = overviewResponseCache.get(cacheKey);
    if (
      !forceRetryAudio &&
      cachedOverview &&
      Date.now() - cachedOverview.createdAt < OVERVIEW_CACHE_TTL_MS &&
      cachedOverview.payload.audioMode === 'gemini_wav'
    ) {
      return res.json(cachedOverview.payload);
    }

    const reportSummaryJson = JSON.stringify(
      {
        soggetto: displayAlias,
        genere: gender === 'f' ? 'femminile' : gender === 'm' ? 'maschile' : 'neutro',
        etaAnni: ageYears,
        fasciaCurriculum: ageBandTitle,
        livelloAttuale: currentLevel,
        eserciziCompletati: completedExercises,
        sessioni: sessionsCount,
        fasciaCompetenza: assignedBandLabel,
        indicatori0_100: {
          competenzaGlobaleIC: ic,
          prestazioneIP: ip,
          autonomiaIA: ia,
          ritenzioneIR: ir,
          trasferimentoIT: it,
          evoluzioneIE: ieDelta,
          crescitaAnnualeDeltaIC: annualDeltaIc,
          risposteAutonome: autonomousTotal,
          risposteConAiuto: assistedTotal,
        },
        areeCognitiveCHC: chcAbilities,
        materie: domains,
      },
      null,
      2
    );

    const scriptSystemInstruction =
      'Sei Marco, pedagogista italiano ed esperto di sviluppo infantile, voce narrante maschile del report audio educativo "Uno Sguardo sulla Crescita". ' +
      'Scrivi un commento vocale naturale, caldo, realistico, scorrevole e concreto rivolto direttamente ai genitori. ' +
      'Regole rigorose: ' +
      '1) La PRIMA battuta DEVE iniziare esattamente con le parole: "Benvenuti genitori, a voi il report del giorno." seguite dall’introduzione al percorso del bambino. ' +
      '2) Usa esclusivamente la voce maschile di Marco (speaker sempre impostato a "Marco") suddivisa in 7-9 paragrafi parlati (totale 175-230 parole, circa 1 minuto e 15 - 1 minuto e 45 di ascolto naturale). ' +
      '3) Parla sempre in italiano naturale, fluido, empatico e autorevole; rispetta perfettamente il genere indicato (maschile/femminile) e l’età reale del bambino. ' +
      '4) Commenta in modo chiaro e concreto: la fascia d’età e il livello raggiunto, i 4 indicatori principali (competenza globale, prestazione, autonomia rispetto ai suggerimenti, andamento nel tempo), i punti di forza cognitivi e le 1-2 aree da coltivare giocando con serenità. ' +
      '5) Includi sempre 2 o 3 suggerimenti pratici di gioco quotidiano in famiglia senza schermo adatti alla sua età, e ricorda chiaramente che si tratta di un profilo educativo ludico interno, mai di un test clinico del quoziente intellettivo. ' +
      '6) Se gli esercizi completati sono pochi (0-3), spiega con dolcezza cosa osservare nelle prime sessioni e offri comunque attività pratiche di gioco familiare su misura. ' +
      '7) Evita sigle tecniche lette male: pronuncia sempre i nomi per esteso (es. "ragionamento logico" invece di "Gf", "memoria di lavoro" invece di "Gwm", "indice di competenza" invece di "IC"). ' +
      '8) Non usare emoji, asterischi, elenchi puntati o markdown nelle battute parlate.';

    const scriptSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Titolo breve, caldo ed editoriale del report audio del giorno in italiano.',
        },
        keyHighlights: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 o 4 punti chiave concreti emersi dal report per i genitori.',
        },
        turns: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              speaker: {
                type: Type.STRING,
                description: 'Sempre "Marco".',
              },
              line: {
                type: Type.STRING,
                description: 'Paragrafo parlato naturale e approfondito in italiano (la prima battuta deve iniziare con "Benvenuti genitori, a voi il report del giorno.").',
              },
              style: {
                type: Type.STRING,
                description: 'Breve indicazione di tono in inglese per il TTS maschile (es. "Warm, realistic, articulate Italian male educator").',
              },
            },
            required: ['speaker', 'line', 'style'],
          },
        },
      },
      required: ['title', 'keyHighlights', 'turns'],
    };

    // 1. Generate realistic Italian male educator Audio Overview script:
    //    Tier 1: gemini-4-hydrogen (with 503 retry)
    //    Tier 2: gemini-3.1-flash-lite (with 503 retry)
    //    Tier 3: Deterministic personalized Italian Marco educator script (zero-failure guarantee)
    let title = `Report del Giorno · ${displayAlias}`;
    let keyHighlights: string[] = [];
    let turns: OverviewTurn[] = [];
    let scriptSource: 'gemini' | 'local' = 'local';

    if (aiText) {
      const textAttempts: Array<{ model: string; retries: number; timeoutMs: number; lowThinking?: boolean }> = [
        { model: 'gemini-4-hydrogen', retries: 1, timeoutMs: 22000, lowThinking: true },
        { model: 'gemini-3.1-flash-lite', retries: 0, timeoutMs: 14000 },
      ];
      for (const cfg of textAttempts) {
        if (isModelQuotaBlocked(cfg.model)) continue;
        try {
          const scriptResponse = await callWithTransientRetry(
            () =>
              aiText.models.generateContent({
                model: cfg.model,
                contents: `Prepara il report audio educativo per i genitori (7-9 paragrafi parlati da Marco, iniziando obbligatoriamente con "${MANDATORY_OVERVIEW_OPENING}"), basato esclusivamente sui seguenti dati numerici di apprendimento:\n\n${reportSummaryJson}`,
                config: {
                  systemInstruction: scriptSystemInstruction,
                  responseMimeType: 'application/json',
                  responseSchema: scriptSchema,
                  ...(cfg.lowThinking
                    ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                    : {}),
                },
              }),
            cfg.retries,
            cfg.timeoutMs
          );

          const rawJson = (scriptResponse.text ?? '').trim();
          if (!rawJson) continue;

          const parsed = JSON.parse(rawJson) as {
            title?: string;
            keyHighlights?: string[];
            turns?: Array<{ speaker?: string; line?: string; style?: string }>;
          };

          const parsedTurns: OverviewTurn[] = (parsed.turns || [])
            .map((t): OverviewTurn => {
              const line = sanitizeShortText(t.line, 420, '');
              const style = sanitizeShortText(
                t.style,
                120,
                'Warm, realistic, articulate Italian male podcast host and child educator'
              );
              return { speaker: 'Marco', line, style };
            })
            .filter((t) => t.line.length > 0)
            .slice(0, 12);

          if (parsedTurns.length >= 2) {
            title = sanitizeShortText(
              parsed.title,
              100,
              `Report del Giorno · ${displayAlias}`
            );
            keyHighlights = (parsed.keyHighlights || [])
              .map((h) => sanitizeShortText(h, 190, ''))
              .filter(Boolean)
              .slice(0, 4);
            turns = ensureMandatoryOverviewOpening(parsedTurns);
            scriptSource = 'gemini';
            break;
          }
        } catch (modelErr) {
          if (isQuotaExhaustedError(modelErr)) {
            markModelQuotaBlocked(cfg.model, modelErr);
          } else {
            console.info(
              `Audio Overview script model ${cfg.model} transiently unavailable.`
            );
          }
        }
      }
    }

    if (turns.length < 2) {
      const localScript = buildLocalFallbackOverviewScript(metricsInput);
      title = localScript.title;
      keyHighlights = localScript.keyHighlights;
      turns = ensureMandatoryOverviewOpening(localScript.turns);
      scriptSource = 'local';
    }

    // 2. Synthesize studio-quality realistic MALE WAV audio (Charon) via ONE clean unary Gemini TTS call:
    //    Tier 1: gemini-3.8-flash-tts single male speaker (Charon) — flagship realistic male studio voice
    //    Tier 2: gemini-3.8-flash-lite-tts single male speaker (Charon) — realistic male studio backup
    //    NEVER fall back to electronic female or robotic browser voices!
    let synthesizedAudio: { audioData: string; mimeType: string } | null = null;
    let ttsHitQuota = false;

    if (aiTts) {
      const maleVoiceConfig = {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: APP_MALE_VOICE_NAME },
          },
        },
      };

      const fullMaleNarrationText = turns
        .map((turn) => turn.line.replace(/^Marco\s*:\s*/i, '').trim())
        .filter(Boolean)
        .join(' ');

      const ttsParts = [
        {
          text: fullMaleNarrationText,
          speechMetadata: {
            style:
              'Warm, realistic, articulate Italian male pedagogist and child development expert presenting the daily learning report to parents with natural studio cadence and clear diction',
          },
        },
      ];

      const maleTtsAttempts: Array<{ model: string; retries: number; timeoutMs: number }> = [
        { model: TTS_STUDIO_MODEL, retries: 2, timeoutMs: 65000 },
        { model: TTS_LITE_MODEL, retries: 1, timeoutMs: 35000 },
      ];

      for (const ttsCfg of maleTtsAttempts) {
        if (isModelQuotaBlocked(ttsCfg.model)) {
          ttsHitQuota = true;
          continue;
        }
        try {
          const audioResponse = await callWithTransientRetry(
            () =>
              aiTts.models.generateContent({
                model: ttsCfg.model,
                contents: [{ role: 'user', parts: ttsParts }],
                config: maleVoiceConfig,
              }),
            ttsCfg.retries,
            ttsCfg.timeoutMs
          );
          const inlineData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (inlineData?.data) {
            synthesizedAudio = ensurePlayableAudioBase64(
              inlineData.data,
              inlineData.mimeType
            );
            break;
          }
        } catch (ttsErr) {
          if (isQuotaExhaustedError(ttsErr)) {
            markModelQuotaBlocked(ttsCfg.model, ttsErr);
            ttsHitQuota = true;
          } else {
            console.info(
              `Audio Overview male TTS ${ttsCfg.model} transiently unavailable.`
            );
          }
        }
      }
    }

    const responsePayload = synthesizedAudio
      ? {
          title,
          keyHighlights,
          transcript: turns.map((t) => ({ speaker: t.speaker, line: t.line })),
          audioData: synthesizedAudio.audioData,
          mimeType: synthesizedAudio.mimeType,
          audioMode: 'gemini_wav' as const,
          scriptSource,
          anonymized: anonymize,
        }
      : {
          title,
          keyHighlights,
          transcript: turns.map((t) => ({ speaker: t.speaker, line: t.line })),
          audioData: null,
          mimeType: 'audio/wav',
          audioMode: 'unavailable' as const,
          scriptSource,
          fallbackNotice: ttsHitQuota
            ? 'È stata raggiunta la quota gratuita giornaliera dei server vocali HD di Gemini. Puoi leggere qui sotto il report completo del pedagogista Marco oppure selezionare una chiave API con piano a pagamento in Impostazioni > Secrets per aumentare la quota.'
            : 'Il server vocale HD è momentaneamente occupato. Tocca "Riprova Audio HD" tra qualche secondo per generare il report con la voce maschile da studio di Marco. Intanto puoi leggere la trascrizione qui sotto.',
          anonymized: anonymize,
        };

    if (synthesizedAudio) {
      if (overviewResponseCache.size >= 24) {
        const oldest = overviewResponseCache.keys().next().value;
        if (oldest !== undefined) overviewResponseCache.delete(oldest);
      }
      overviewResponseCache.set(cacheKey, {
        createdAt: Date.now(),
        payload: responsePayload,
      });
    }

    return res.json(responsePayload);
  } catch (error: unknown) {
    console.error('Report Audio Overview error:', error);
    return res.status(503).json({
      error:
        'Il servizio Audio Overview è momentaneamente sovraccarico. Riprova tra qualche secondo.',
    });
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
    const { createServer: createViteServer } = await import('vite');
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
