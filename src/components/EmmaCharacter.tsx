import React, { useState } from 'react';
import { soundManager } from '../utils/audio';
import { Sparkles, Crown } from 'lucide-react';

interface EmmaCharacterProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSpeech?: boolean;
  interactive?: boolean;
  className?: string;
  customSpeechText?: string;
  onTapEmma?: () => void;
  showCrown?: boolean;
}

export const EmmaCharacter: React.FC<EmmaCharacterProps> = ({
  size = 'md',
  showSpeech = false,
  interactive = true,
  className = '',
  customSpeechText,
  onTapEmma,
  showCrown = false
}) => {
  const [speechBubble, setSpeechBubble] = useState<string | null>(customSpeechText || null);
  const [isWiggling, setIsWiggling] = useState(false);

  // Responsive dimensions tailored for mobile and desktop screens
  const sizeClasses = {
    sm: 'w-16 h-22 text-xs',
    md: 'w-28 h-40 sm:w-36 sm:h-52 text-sm',
    lg: 'w-44 h-62 sm:w-52 sm:h-74 text-base',
    xl: 'w-48 h-68 sm:w-64 sm:h-88 text-base',
  }[size];

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive) return;

    setIsWiggling(true);
    soundManager.playTwinkle();

    if (onTapEmma) {
      onTapEmma();
      return;
    }

    const greetings = [
      'Ciao! Alleniamo la mente con i giochi di logica?',
      'Sei bravissima a risolvere tutti gli enigmi!',
      'Insieme impariamo le lettere, i numeri e le forme!',
      'Evviva! Che bello giocare e imparare insieme!',
      'Tocca un mondo magico per iniziare!'
    ];
    const phrase = greetings[Math.floor(Math.random() * greetings.length)];
    setSpeechBubble(phrase);
    soundManager.speak(phrase, 1.25);

    setTimeout(() => {
      setIsWiggling(false);
    }, 1000);

    setTimeout(() => {
      setSpeechBubble(null);
    }, 4000);
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble */}
      {(speechBubble || (showSpeech && customSpeechText)) && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 w-44 sm:w-64 bg-white/95 text-slate-800 text-xs sm:text-sm font-fun px-3.5 py-2 rounded-2xl shadow-xl border-2 border-pink-300 text-center animate-fade-in pointer-events-none">
          {speechBubble || customSpeechText}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rotate-45 border-b-2 border-r-2 border-pink-300"></div>
        </div>
      )}

      {/* Emma Character Card Frame with Rainbow Halo */}
      <div
        onClick={handleTap}
        className={`relative ${sizeClasses} rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-xl group ${
          isWiggling ? 'animate-gentle-bounce scale-105' : 'hover:scale-102'
        }`}
        style={{
          boxShadow: '0 0 25px rgba(236, 72, 153, 0.45)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(244,114,182,0.15) 100%)'
        }}
      >
        {/* Rainbow Border Glow Frame */}
        <div className="absolute inset-0 rounded-3xl border-2 border-white/60 z-20 pointer-events-none"></div>

        {/* The Authentic Photo of Emma stepping through the portal (100% natural, no fake overlays) */}
        <img
          src="/assets/aistudio/file_00000000aaf47246b99b88d542f65591_02f69f18.png"
          alt="Emma"
          className="w-full h-full object-cover object-[60%_35%] transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Crown badge if unlocked */}
        {showCrown && (
          <div className="absolute top-2 right-2 z-30 drop-shadow-md">
            <Crown className="w-6 h-6 text-yellow-300 fill-yellow-400 animate-bounce" />
          </div>
        )}

        {/* Interactive touch hint for small children */}
        {interactive && (
          <div className="absolute bottom-2 right-2 z-30 opacity-90 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-xs p-1.5 rounded-full text-white">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        )}
      </div>

      {/* Name and Subtitle */}
      {size !== 'sm' && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center gap-1 font-fun font-bold text-white text-xs sm:text-sm drop-shadow-md">
            <span>Emma</span>
            <span className="text-pink-400">💕</span>
          </div>
          <div className="text-[11px] sm:text-xs font-fun text-pink-200/90 truncate max-w-[180px]">
            La Nostra Campionessa
          </div>
        </div>
      )}
    </div>
  );
};
