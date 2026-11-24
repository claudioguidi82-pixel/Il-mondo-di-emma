import React, { useState, useMemo, useEffect } from 'react';
import {
  getEmoji3DCandidateUrls,
  isSingleEmoji,
  splitEmojiTokens,
} from '../utils/emoji3dDatabase';

export interface Emoji3DProps {
  emoji: string;
  alt?: string;
  className?: string;
  decorative?: boolean;
  /** Optional explicit pixel size for crisp aspect ratio lock */
  size?: number;
}

/**
 * Renders a single emoji as a high-resolution 3D clay/glossy illustration
 * from the unified 3D Emoji Illustration Database, with automatic candidate
 * retry and zero-broken-image fallback.
 */
export const Emoji3D: React.FC<Emoji3DProps> = ({
  emoji,
  alt,
  className = 'w-6 h-6',
  decorative = true,
  size,
}) => {
  const candidates = useMemo(() => getEmoji3DCandidateUrls(emoji), [emoji]);
  const [urlIndex, setUrlIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    setUrlIndex(0);
    setExhausted(false);
  }, [emoji]);

  const activeUrl = candidates[urlIndex];

  if (!activeUrl || exhausted) {
    return (
      <span
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : alt || emoji}
        className={`inline-flex items-center justify-center leading-none select-none align-middle ${className}`}
        style={size ? { width: size, height: size, fontSize: Math.round(size * 0.82) } : undefined}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={activeUrl}
      alt={decorative ? '' : alt || emoji}
      aria-hidden={decorative ? true : undefined}
      referrerPolicy="no-referrer"
      decoding="async"
      draggable={false}
      width={size}
      height={size}
      style={size ? { width: size, height: size } : undefined}
      onError={() => {
        if (urlIndex + 1 < candidates.length) {
          setUrlIndex((i) => i + 1);
        } else {
          setExhausted(true);
        }
      }}
      className={`inline-block object-contain select-none align-middle shrink-0 pointer-events-none drop-shadow-[0_4px_6px_rgba(15,23,42,0.22)] ${className}`}
    />
  );
};

export interface RichEmoji3DTextProps {
  text: string;
  className?: string;
  emojiClassName?: string;
}

/**
 * Replaces every inline emoji inside any text string with its corresponding
 * 3D illustration while keeping all Italian/English text, punctuation, and
 * math symbols crisp and accessible.
 */
export const RichEmoji3DText: React.FC<RichEmoji3DTextProps> = ({
  text,
  className,
  emojiClassName = 'w-[1.22em] h-[1.22em] -mt-[0.12em] mx-[0.06em]',
}) => {
  const tokens = useMemo(() => splitEmojiTokens(text), [text]);

  if (tokens.length === 0) return null;

  const content = tokens.map((token, idx) =>
    token.type === 'emoji' ? (
      <Emoji3D
        key={`${idx}-${token.value}`}
        emoji={token.value}
        className={emojiClassName}
        decorative
      />
    ) : (
      <React.Fragment key={idx}>{token.value}</React.Fragment>
    )
  );

  if (className) {
    return <span className={className}>{content}</span>;
  }

  return <>{content}</>;
};

export interface Emoji3DStageProps {
  value: string;
  label?: string;
  isDarkBackdrop?: boolean;
  isAnimated?: boolean;
}

/**
 * Renders option-card artwork in PlayArena:
 * - Single emoji -> giant hero 3D illustration filling the card stage
 * - Multi-emoji group (e.g. "🍎🍎🍎🍎") -> balanced grid/row of 3D illustrations
 * - Pure letters/numbers/math symbols -> bold display typography
 * - Mixed text + emoji -> large text with crisp 3D illustrations
 */
export const Emoji3DStage: React.FC<Emoji3DStageProps> = ({
  value,
  label,
  isDarkBackdrop = false,
  isAnimated = true,
}) => {
  const trimmed = (value || '⭐').trim();
  const tokens = useMemo(() => splitEmojiTokens(trimmed), [trimmed]);
  const emojiTokens = useMemo(
    () => tokens.filter((t) => t.type === 'emoji'),
    [tokens]
  );
  const hasNonSpaceText = useMemo(
    () => tokens.some((t) => t.type === 'text' && t.value.trim().length > 0),
    [tokens]
  );

  // 1. Single hero emoji -> full-stage giant 3D illustration
  if (isSingleEmoji(trimmed) || (!hasNonSpaceText && emojiTokens.length === 1)) {
    const heroEmoji = emojiTokens[0]?.value || trimmed;
    return (
      <Emoji3D
        emoji={heroEmoji}
        alt={label || heroEmoji}
        decorative={!label}
        className={`w-[86px] h-[86px] sm:w-[114px] sm:h-[114px] lg:w-[126px] lg:h-[126px] drop-shadow-[0_10px_14px_rgba(15,23,42,0.34)] transition-transform duration-300 group-hover:scale-105 ${
          isAnimated ? 'animate-float-3d' : ''
        }`}
      />
    );
  }

  // 2. Pure emoji group (e.g. "🍎🍎🍎", "🍓🍓🍓🍓🍓", "🔴🟡🔵") -> crisp 3D cluster
  if (!hasNonSpaceText && emojiTokens.length > 1) {
    const count = emojiTokens.length;
    const itemSizeClass =
      count === 2
        ? 'w-14 h-14 sm:w-18 sm:h-18 lg:w-20 lg:h-20'
        : count <= 4
        ? 'w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16'
        : count <= 6
        ? 'w-9 h-9 sm:w-12 sm:h-12 lg:w-13 lg:h-13'
        : 'w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11';

    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 max-w-[94%] ${
          isAnimated ? 'animate-float-3d' : ''
        }`}
      >
        {emojiTokens.map((tok, i) => (
          <Emoji3D
            key={`${i}-${tok.value}`}
            emoji={tok.value}
            className={`${itemSizeClass} drop-shadow-[0_6px_8px_rgba(15,23,42,0.28)]`}
            decorative
          />
        ))}
      </div>
    );
  }

  // 3. Mixed text + emoji (e.g. "3 🍎" or "10 💶")
  if (emojiTokens.length > 0) {
    return (
      <span
        className={`inline-flex flex-wrap items-center justify-center gap-1.5 font-kids font-black text-3xl sm:text-5xl lg:text-[54px] leading-none text-center select-none ${
          isDarkBackdrop
            ? 'text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]'
            : 'text-indigo-950 drop-shadow-[0_4px_0_rgba(255,255,255,0.85)]'
        } ${isAnimated ? 'animate-float-3d' : ''}`}
      >
        <RichEmoji3DText
          text={trimmed}
          emojiClassName="w-[1.28em] h-[1.28em] drop-shadow-[0_6px_8px_rgba(15,23,42,0.28)]"
        />
      </span>
    );
  }

  // 4. Plain academic symbol / letter / number tile (e.g. "A", "7", "π", "12")
  return (
    <span
      className={`font-kids font-black leading-none text-center select-none ${
        trimmed.length <= 3
          ? 'text-[54px] sm:text-[78px] lg:text-[88px]'
          : 'text-[34px] sm:text-[48px] lg:text-[54px]'
      } ${
        isDarkBackdrop
          ? 'text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]'
          : 'text-indigo-950 drop-shadow-[0_4px_0_rgba(255,255,255,0.85)]'
      } ${isAnimated ? 'animate-float-3d' : ''}`}
    >
      {trimmed}
    </span>
  );
};
