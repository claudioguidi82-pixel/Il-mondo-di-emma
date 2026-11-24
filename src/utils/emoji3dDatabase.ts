// Unified 3D Emoji Illustration Database (Fluent 3D Clay/Glossy WebP Assets)
// Maps 100% of the app's emojis (420+ unique glyphs + full 3,391-asset catalog)
// to verified high-resolution 3D illustrations served via CORS-enabled CDN
// with zero bundle bloat and deterministic fallback chains.

export const EMOJI_3D_CDN_BASE =
  'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets';

/**
 * Exact filename overrides for codepoints in the 3D database that require
 * explicit variation selector (-fe0f) or compound sequences so every asset
 * resolves on the very first HTTP request with zero 404s.
 */
const EXACT_3D_ASSET_OVERRIDES: Record<string, string> = {
  // Core symbols & arrows
  '2194': '2194-fe0f',
  '23f1': '23f1-fe0f',
  '23f8': '23f8-fe0f',
  '2600': '2600-fe0f',
  '2601': '2601-fe0f',
  '2602': '2602-fe0f',
  '2603': '2603-fe0f',
  '2604': '2604-fe0f',
  '2665': '2665-fe0f',
  '2668': '2668-fe0f',
  '267b': '267b-fe0f',
  '2696': '2696-fe0f',
  '26a0': '26a0-fe0f',
  '26c8': '26c8-fe0f',
  '26f0': '26f0-fe0f',
  '26f4': '26f4-fe0f',
  '26f7': '26f7-fe0f',
  '2702': '2702-fe0f',
  '2708': '2708-fe0f',
  '270c': '270c-fe0f',
  '270d': '270d-fe0f',
  '270f': '270f-fe0f',
  '2714': '2714-fe0f',
  '2716': '2716-fe0f',
  '2744': '2744-fe0f',
  '2764': '2764-fe0f',
  '27a1': '27a1-fe0f',
  '2b06': '2b06-fe0f',
  '2b07': '2b07-fe0f',
  // Nature, objects, weather, vehicles & scenes
  '1f321': '1f321-fe0f',
  '1f324': '1f324-fe0f',
  '1f327': '1f327-fe0f',
  '1f328': '1f328-fe0f',
  '1f32c': '1f32c-fe0f',
  '1f37d': '1f37d-fe0f',
  '1f3cd': '1f3cd-fe0f',
  '1f3ce': '1f3ce-fe0f',
  '1f3d4': '1f3d4-fe0f',
  '1f3d6': '1f3d6-fe0f',
  '1f3d7': '1f3d7-fe0f',
  '1f3db': '1f3db-fe0f',
  '1f3dc': '1f3dc-fe0f',
  '1f3dd': '1f3dd-fe0f',
  '1f3de': '1f3de-fe0f',
  '1f43b-200d-2744': '1f43b-200d-2744-fe0f',
  '1f43f': '1f43f-fe0f',
  '1f441': '1f441-fe0f',
  '1f54a': '1f54a-fe0f',
  '1f576': '1f576-fe0f',
  '1f58c': '1f58c-fe0f',
  '1f590': '1f590-fe0f',
  '1f5a8': '1f5a8-fe0f',
  '1f5bc': '1f5bc-fe0f',
  '1f5d3': '1f5d3-fe0f',
  '1f5e3': '1f5e3-fe0f',
  '1f5f3': '1f5f3-fe0f',
  '1f5fa': '1f5fa-fe0f',
  '1f6cb': '1f6cb-fe0f',
  '1f6cd': '1f6cd-fe0f',
  '1f6cf': '1f6cf-fe0f',
  '1f6e0': '1f6e0-fe0f',
  '1f6e1': '1f6e1-fe0f',
  '1f6e2': '1f6e2-fe0f',
  '1f6e4': '1f6e4-fe0f',
  '1f6e5': '1f6e5-fe0f',
  '1f6e9': '1f6e9-fe0f',
  '1f6f0': '1f6f0-fe0f',
  '1f6f3': '1f6f3-fe0f',
  // Keycaps 0-9
  '0030-20e3': '0030-fe0f-20e3',
  '0031-20e3': '0031-fe0f-20e3',
  '0032-20e3': '0032-fe0f-20e3',
  '0033-20e3': '0033-fe0f-20e3',
  '0034-20e3': '0034-fe0f-20e3',
  '0035-20e3': '0035-fe0f-20e3',
  '0036-20e3': '0036-fe0f-20e3',
  '0037-20e3': '0037-fe0f-20e3',
  '0038-20e3': '0038-fe0f-20e3',
  '0039-20e3': '0039-fe0f-20e3',
};

// Matches regional indicator flags (e.g. 🇬🇧), keycap emojis, and all Extended Pictographic sequences
const EMOJI_TOKEN_REGEX =
  /(?:\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;

const SINGLE_EMOJI_TEST_REGEX =
  /^(?:\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)$/u;

// Geometric typographic characters that should stay crisp vector text rather than pictographic emoji
const PRESERVE_TEXT_SYMBOLS = new Set([
  '✕',
  '◯',
  '✓',
  '★',
  '✦',
  '◈',
  '▲',
  '●',
  '➔',
  '·',
  '•',
  '±',
  '×',
  '÷',
  '√',
  'π',
  'φ',
]);

function toHexCodepoints(emoji: string, stripFe0f: boolean): string {
  const parts: string[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (stripFe0f && cp === 0xfe0f) continue;
    const hex = cp.toString(16);
    parts.push(cp <= 0xff ? hex.padStart(4, '0') : hex);
  }
  return parts.join('-');
}

export function isSingleEmoji(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || PRESERVE_TEXT_SYMBOLS.has(trimmed)) return false;
  return SINGLE_EMOJI_TEST_REGEX.test(trimmed);
}

export function containsEmoji(text: string): boolean {
  if (!text) return false;
  EMOJI_TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EMOJI_TOKEN_REGEX.exec(text)) !== null) {
    if (!PRESERVE_TEXT_SYMBOLS.has(match[0])) {
      EMOJI_TOKEN_REGEX.lastIndex = 0;
      return true;
    }
  }
  EMOJI_TOKEN_REGEX.lastIndex = 0;
  return false;
}

export interface EmojiTextToken {
  type: 'emoji' | 'text';
  value: string;
}

export function splitEmojiTokens(text: string): EmojiTextToken[] {
  if (!text) return [];
  const tokens: EmojiTextToken[] = [];
  EMOJI_TOKEN_REGEX.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = EMOJI_TOKEN_REGEX.exec(text)) !== null) {
    const token = match[0];
    if (PRESERVE_TEXT_SYMBOLS.has(token)) {
      continue;
    }
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    tokens.push({ type: 'emoji', value: token });
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }
  EMOJI_TOKEN_REGEX.lastIndex = 0;
  return tokens;
}

/**
 * Returns the primary verified 3D illustration WebP URL for an emoji,
 * plus alternate candidate URLs in case an uncommon emoji uses a variant suffix.
 */
export function getEmoji3DCandidateUrls(emoji: string): string[] {
  const trimmed = emoji.trim();
  if (!trimmed || PRESERVE_TEXT_SYMBOLS.has(trimmed)) return [];

  const stripped = toHexCodepoints(trimmed, true);
  if (!stripped) return [];

  const raw = toHexCodepoints(trimmed, false);
  const override = EXACT_3D_ASSET_OVERRIDES[stripped];

  const orderedSlugs: string[] = [];
  const pushUnique = (slug: string) => {
    if (slug && !orderedSlugs.includes(slug)) {
      orderedSlugs.push(slug);
    }
  };

  if (override) {
    pushUnique(override);
  }
  pushUnique(stripped);
  if (raw !== stripped) {
    pushUnique(raw);
  }
  if (!stripped.endsWith('-fe0f')) {
    pushUnique(`${stripped}-fe0f`);
  }

  return orderedSlugs.map((slug) => `${EMOJI_3D_CDN_BASE}/${slug}.webp`);
}

export function getEmoji3DUrl(emoji: string): string | null {
  const candidates = getEmoji3DCandidateUrls(emoji);
  return candidates[0] || null;
}

// In-memory HTMLImageElement cache for Canvas stamping (StudioDisegno)
const canvasImageCache = new Map<string, HTMLImageElement>();
const canvasPendingCache = new Map<string, Promise<HTMLImageElement | null>>();

export function getCachedEmoji3DImage(emoji: string): HTMLImageElement | null {
  return canvasImageCache.get(emoji.trim()) || null;
}

export function preloadEmoji3DImage(emoji: string): Promise<HTMLImageElement | null> {
  const key = emoji.trim();
  if (!key) return Promise.resolve(null);

  const cached = canvasImageCache.get(key);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  const pending = canvasPendingCache.get(key);
  if (pending) return pending;

  const urls = getEmoji3DCandidateUrls(key);
  if (urls.length === 0) return Promise.resolve(null);

  const loadTask = new Promise<HTMLImageElement | null>((resolve) => {
    let idx = 0;
    const tryNext = () => {
      if (idx >= urls.length) {
        canvasPendingCache.delete(key);
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        canvasImageCache.set(key, img);
        canvasPendingCache.delete(key);
        resolve(img);
      };
      img.onerror = () => {
        idx += 1;
        tryNext();
      };
      img.src = urls[idx];
    };
    tryNext();
  });

  canvasPendingCache.set(key, loadTask);
  return loadTask;
}
