import React, { useState, useEffect } from 'react';
import { GameCategory, Puzzle, UserProgress } from '../types/game';
import { generateProceduralPuzzle, getEncouragementPhrase } from '../utils/infiniteLevels';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { 
  Volume2, 
  Sparkles, 
  Star, 
  ChevronLeft,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Music,
  VolumeX
} from 'lucide-react';

interface PlayArenaProps {
  progress: UserProgress;
  onSolveLevel: (stars: number, gems: number, category: GameCategory, isCorrectFirstTry: boolean) => void;
  onOpenParents: () => void;
  onExitToTitle: () => void;
}

export const PlayArena: React.FC<PlayArenaProps> = ({
  progress,
  onSolveLevel,
  onOpenParents,
  onExitToTitle,
}) => {
  const currentPuzzle: Puzzle = generateProceduralPuzzle(progress.currentLevel);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [itemCountClicked, setItemCountClicked] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [musicPlaying, setMusicPlaying] = useState<boolean>(soundManager.musicEnabled);

  // Sync music state
  useEffect(() => {
    return soundManager.onMusicChange((enabled) => {
      setMusicPlaying(enabled);
    });
  }, []);

  // Sync speaking state
  useEffect(() => {
    const unsub = soundManager.onSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsub();
      soundManager.stopSpeech();
    };
  }, []);

  // When level changes, reset puzzle state and speak instructions
  useEffect(() => {
    setSelectedOptionId(null);
    setIsAnswerCorrect(null);
    setItemCountClicked(0);
    setShowCelebration(false);
    setAttemptCount(0);

    // Speak instructions clearly
    triggerSpeech(currentPuzzle.speechText);
  }, [progress.currentLevel]);

  const triggerSpeech = (text: string, context?: 'praise' | 'riddle' | 'instruction') => {
    const isRiddle = currentPuzzle.type === 'riddle';
    soundManager.speak(text, {
      context: context || (isRiddle ? 'riddle' : 'instruction'),
      pitch: currentPuzzle.animalGuide.voicePitch,
    });
  };

  const handleReplaySpeech = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundManager.playPop();
    triggerSpeech(currentPuzzle.speechText);
  };

  const handleOptionSelect = (optionId: string, isCorrect: boolean) => {
    if (isAnswerCorrect) return; // already solved
    setSelectedOptionId(optionId);
    setAttemptCount(prev => prev + 1);

    if (isCorrect) {
      soundManager.playSuccess();
      confetti.burst();
      setIsAnswerCorrect(true);
      setShowCelebration(true);

      const phrase = getEncouragementPhrase(true);
      triggerSpeech(phrase, 'praise');

      const firstTry = attemptCount === 0;
      setTimeout(() => {
        onSolveLevel(currentPuzzle.rewardStars, currentPuzzle.rewardGems, currentPuzzle.category, firstTry);
      }, 1500);
    } else {
      soundManager.playEncouragement();
      setIsAnswerCorrect(false);
      const gentleError = getEncouragementPhrase(false);
      triggerSpeech(gentleError, 'instruction');

      setTimeout(() => {
        setIsAnswerCorrect(null);
        setSelectedOptionId(null);
      }, 1200);
    }
  };

  // Interactive tap for counting items
  const handleItemTap = () => {
    if (isAnswerCorrect) return;
    const nextCount = itemCountClicked + 1;
    setItemCountClicked(nextCount);
    soundManager.playPop();
    confetti.burst(undefined, undefined, 8);

    // Grammatically correct Italian speech: "Una!" if feminine (mela, fragolina, stellina), "Uno!" if masculine
    const tapSpoken = nextCount === 1 
      ? (currentPuzzle.itemGender === 'f' ? 'Una!' : 'Uno!')
      : `${nextCount}!`;
    triggerSpeech(tapSpoken);

    if (nextCount === currentPuzzle.targetCount) {
      setTimeout(() => {
        handleOptionSelect('counted_success', true);
      }, 350);
    }
  };

  const categoryMeta = {
    logic: {
      title: 'Logica & Indovinelli',
      bg: 'from-[#1e103c] via-[#2d1b54] to-[#120826]',
      badge: 'bg-purple-500/30 text-purple-200 border-purple-400',
      icon: '🧠',
    },
    letters: {
      title: 'Lettere, Suoni & Versi',
      bg: 'from-[#0b2823] via-[#133d36] to-[#081b17]',
      badge: 'bg-emerald-500/30 text-emerald-200 border-emerald-400',
      icon: '🔤',
    },
    numbers: {
      title: 'Numeri & Conteggio Magico',
      bg: 'from-[#0a233a] via-[#10375c] to-[#071626]',
      badge: 'bg-cyan-500/30 text-cyan-200 border-cyan-400',
      icon: '🔢',
    },
    shapes: {
      title: 'Forme & Colori Favolosi',
      bg: 'from-[#340e2b] via-[#4c163f] to-[#1e0719]',
      badge: 'bg-pink-500/30 text-pink-200 border-pink-400',
      icon: '🎨',
    }
  }[currentPuzzle.category];

  return (
    <div className={`fixed inset-0 z-40 flex flex-col justify-between bg-gradient-to-b ${categoryMeta.bg} text-white select-none overflow-hidden h-[100dvh] max-h-[100dvh] w-screen`}>
      
      {/* Decorative stars */}
      <div className="absolute top-6 left-6 text-2xl opacity-25 pointer-events-none">⭐</div>
      <div className="absolute top-16 right-8 text-2xl opacity-25 pointer-events-none">✨</div>
      <div className="absolute bottom-12 left-8 text-2xl opacity-20 pointer-events-none">🌸</div>

      {/* ============================================================== */}
      {/* TOP HEADER BAR: COMPACT & CLEAN FOR ALL SCREENS                 */}
      {/* ============================================================== */}
      <div className="relative z-10 flex items-center justify-between px-2.5 sm:px-5 py-2 bg-slate-950/75 border-b border-white/10 backdrop-blur-md shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playPop();
              onExitToTitle();
            }}
            className="px-3 py-1 sm:px-3.5 sm:py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl text-white font-fun font-bold text-xs sm:text-sm border border-white/20 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-pink-300" />
            <span>Esci</span>
          </button>

          <span className={`text-[11px] sm:text-xs font-kids font-bold px-2.5 py-1 rounded-full border ${categoryMeta.badge} shadow-xs truncate max-w-[160px] sm:max-w-none`}>
            {categoryMeta.icon} {categoryMeta.title}
          </span>
        </div>

        {/* Level & Stars Indicator */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-yellow-300 rounded-full border border-yellow-300/50 font-kids font-bold text-xs sm:text-sm shadow-md animate-pulse">
            Livello {progress.currentLevel}
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-slate-950 rounded-full font-kids font-bold text-xs sm:text-sm shadow-xs border border-amber-300">
            <Star className="w-3.5 h-3.5 fill-slate-950" />
            <span>{progress.stars}</span>
          </div>

          <button
            onClick={() => {
              soundManager.playPop();
              const nextMusic = soundManager.toggleMusic();
              setMusicPlaying(nextMusic);
            }}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
              musicPlaying
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/20'
                : 'bg-white/10 hover:bg-white/20 text-slate-400 border-white/20'
            }`}
            title={musicPlaying ? 'Disattiva musica rilassante' : 'Attiva musica rilassante'}
          >
            {musicPlaying ? (
              <Music className="w-4 h-4 text-slate-950 animate-bounce" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              onOpenParents();
            }}
            className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 rounded-xl border border-white/20 cursor-pointer shadow-xs"
            title="Area Genitori"
          >
            <ShieldCheck className="w-4 h-4 text-pink-400" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CHILD PROMPT CARD: COMPACT SPEECH CLOUD WITH ANIMAL AVATAR      */}
      {/* ============================================================== */}
      <div className="relative z-10 px-2 sm:px-4 shrink-0 max-w-3xl w-full mx-auto my-1 landscape:my-0.5">
        <div className="bg-gradient-to-b from-white via-white to-amber-50 rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 landscape:p-1.5 landscape:py-1 border-2 sm:border-4 border-amber-300 shadow-xl flex items-center gap-2 sm:gap-4 text-slate-900 relative overflow-hidden">
          
          {/* Animated Mascot Guide Avatar */}
          <button 
            onClick={handleReplaySpeech}
            className={`w-11 h-11 sm:w-16 sm:h-16 landscape:w-9 landscape:h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-400 to-purple-500 p-0.5 border-2 border-amber-400 flex items-center justify-center text-2xl sm:text-4xl landscape:text-xl shrink-0 shadow-lg cursor-pointer transition-transform ${
              isSpeaking ? 'animate-bounce scale-105' : 'hover:scale-105 active:scale-95'
            }`}
            title="Tocca per ascoltare la voce!"
          >
            <div className="w-full h-full rounded-xl bg-white/95 flex items-center justify-center">
              <span>{currentPuzzle.animalGuide.emoji}</span>
            </div>
          </button>

          {/* Speech Prompt Text & Big Listen Button */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-kids font-bold text-xs sm:text-sm landscape:text-[11px] text-purple-700">
                {currentPuzzle.animalGuide.name}
              </span>
              {currentPuzzle.type === 'riddle' && (
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                  Indovinello 🧩
                </span>
              )}
            </div>

            <p className="text-xs sm:text-lg md:text-xl landscape:text-xs text-slate-900 font-kids font-bold leading-tight drop-shadow-xs line-clamp-2">
              "{currentPuzzle.prompt}"
            </p>
          </div>

          {/* Direct Speaker Button */}
          <button
            onClick={handleReplaySpeech}
            className={`p-1.5 sm:px-4 sm:py-2 landscape:p-1 landscape:px-2 rounded-xl sm:rounded-2xl font-kids font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0 border-b-3 ${
              isSpeaking
                ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 border-emerald-700 animate-pulse'
                : 'bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 border-amber-600 btn-chunky'
            }`}
            title="Ascolta la voce"
          >
            <Volume2 className="w-4 h-4 text-slate-950 fill-current animate-bounce" />
            <span className="hidden sm:inline landscape:inline">{isSpeaking ? 'Ascolta...' : 'VOCE 🔊'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CENTER STAGE: ADAPTIVE INTERACTIVE PUZZLE (ZERO OVERFLOW)       */}
      {/* ============================================================== */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center p-1.5 sm:p-3 max-w-3xl w-full mx-auto overflow-hidden">
        
        {/* 1. PATTERN SEQUENCE DISPLAY */}
        {currentPuzzle.type === 'pattern_sequence' && currentPuzzle.patternItems && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-2.5 sm:p-4 bg-white/95 rounded-3xl border-3 border-amber-300 shadow-xl max-w-md w-full">
            {currentPuzzle.patternItems.map((item, idx) => (
              <div
                key={idx}
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-5xl shadow-sm border-2 ${
                  item === '❓'
                    ? 'bg-amber-100 border-dashed border-amber-400 text-amber-500 animate-bounce font-kids font-bold'
                    : 'bg-slate-50 border-purple-200'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        )}

        {/* 2. VISUAL ADDITION DISPLAY */}
        {currentPuzzle.type === 'visual_addition' && currentPuzzle.additionParts && (
          <div className="mb-2 flex items-center justify-center gap-2 sm:gap-4 p-2.5 sm:p-4 bg-white/95 rounded-3xl border-3 border-cyan-400 shadow-xl text-slate-900">
            <div className="flex items-center gap-1 text-3xl sm:text-5xl drop-shadow">
              {Array.from({ length: currentPuzzle.additionParts.countA }).map((_, i) => (
                <span key={i}>{currentPuzzle.additionParts?.emoji}</span>
              ))}
            </div>
            <span className="text-2xl sm:text-4xl font-kids font-bold text-pink-500">+</span>
            <div className="flex items-center gap-1 text-3xl sm:text-5xl drop-shadow">
              {Array.from({ length: currentPuzzle.additionParts.countB }).map((_, i) => (
                <span key={i}>{currentPuzzle.additionParts?.emoji}</span>
              ))}
            </div>
            <span className="text-2xl sm:text-4xl font-kids font-bold text-pink-500">=</span>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-amber-100 border-3 border-dashed border-amber-400 flex items-center justify-center text-2xl sm:text-4xl font-kids font-bold text-amber-600 animate-pulse">
              ?
            </div>
          </div>
        )}

        {/* 2b. VISUAL SUBTRACTION DISPLAY */}
        {currentPuzzle.type === 'visual_subtraction' && currentPuzzle.subtractionParts && (
          <div className="mb-2 flex items-center justify-center gap-2 sm:gap-4 p-2.5 sm:p-4 bg-white/95 rounded-3xl border-3 border-rose-400 shadow-xl text-slate-900">
            <div className="flex items-center gap-1 text-3xl sm:text-5xl drop-shadow">
              {Array.from({ length: currentPuzzle.subtractionParts.total }).map((_, i) => (
                <span key={i}>{currentPuzzle.subtractionParts?.emoji}</span>
              ))}
            </div>
            <span className="text-2xl sm:text-4xl font-kids font-bold text-rose-500">-</span>
            <div className="flex items-center gap-1 text-3xl sm:text-5xl drop-shadow opacity-50">
              {Array.from({ length: currentPuzzle.subtractionParts.minus }).map((_, i) => (
                <span key={i} className="line-through">{currentPuzzle.subtractionParts?.emoji}</span>
              ))}
            </div>
            <span className="text-2xl sm:text-4xl font-kids font-bold text-rose-500">=</span>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-amber-100 border-3 border-dashed border-amber-400 flex items-center justify-center text-2xl sm:text-4xl font-kids font-bold text-amber-600 animate-pulse">
              ?
            </div>
          </div>
        )}

        {/* 3. INTERACTIVE COUNTING DISPLAY (Candy touch bubbles) */}
        {currentPuzzle.type === 'count_interactive' && (
          <div className="flex flex-col items-center justify-center my-auto">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 max-w-md mb-3">
              {Array.from({ length: currentPuzzle.targetCount || 5 }).map((_, idx) => {
                const isCounted = idx < itemCountClicked;
                return (
                  <button
                    key={idx}
                    onClick={handleItemTap}
                    disabled={isCounted}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl text-4xl sm:text-5xl flex items-center justify-center transition-all cursor-pointer border-3 border-b-6 shadow-xl ${
                      isCounted
                        ? 'bg-emerald-500/25 border-emerald-400 scale-90 opacity-70 border-b-3'
                        : 'bg-gradient-to-b from-white to-amber-100 border-amber-300 border-b-amber-500 hover:scale-105 active:scale-95 animate-gentle-bounce btn-chunky'
                    }`}
                  >
                    <span className="drop-shadow-sm">{currentPuzzle.itemEmoji || '⭐'}</span>
                  </button>
                );
              })}
            </div>
            <div className="px-5 py-1.5 rounded-full bg-white/95 text-slate-900 border-2 border-amber-300 text-sm sm:text-base font-kids font-bold shadow-md flex items-center gap-2">
              <span>Toccate:</span>
              <span className="text-pink-600 text-xl font-bold">{itemCountClicked}</span>
              <span>/ {currentPuzzle.targetCount}</span>
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            </div>
          </div>
        )}

        {/* 4. JUMBO TACTILE MULTIPLE CHOICE CARDS (FITS MOBILE & TABLETS IN PORTRAIT & LANDSCAPE) */}
        {currentPuzzle.options && (
          <div className={`grid gap-2 sm:gap-4 landscape:gap-2 w-full max-h-[52vh] landscape:max-h-[58vh] ${
            currentPuzzle.options.length === 2
              ? 'grid-cols-2 max-w-md'
              : currentPuzzle.options.length === 4
              ? 'grid-cols-2 sm:grid-cols-4 max-w-2xl'
              : 'grid-cols-3 max-w-xl'
          }`}>
            {currentPuzzle.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleOptionSelect(opt.id, opt.isCorrect)}
                  className={`p-2 sm:p-4 landscape:p-1.5 landscape:py-1 rounded-2xl sm:rounded-3xl border-3 border-b-6 transition-all duration-150 flex flex-col items-center justify-center gap-0.5 sm:gap-1.5 cursor-pointer shadow-xl btn-chunky select-none active:translate-y-1.5 ${
                    isSelected && opt.isCorrect
                      ? 'bg-gradient-to-b from-emerald-100 to-emerald-200 border-emerald-500 border-b-4 border-b-emerald-700 translate-y-1 scale-102 ring-4 ring-emerald-400 shadow-[0_10px_20px_rgba(16,185,129,0.4)]'
                      : isSelected && !opt.isCorrect
                      ? 'bg-gradient-to-b from-rose-100 to-rose-200 border-rose-500 border-b-4 border-b-rose-700 translate-y-1 shadow-md'
                      : 'bg-gradient-to-b from-white via-white to-pink-50/80 border-t-2 border-t-white border-pink-300 hover:border-pink-400 border-b-pink-500 shadow-[0_10px_22px_rgba(0,0,0,0.25),0_4px_0_#db2777,inset_0_2px_3px_rgba(255,255,255,0.9)]'
                  }`}
                >
                  {opt.emoji && (
                    <span className="text-3xl sm:text-6xl md:text-7xl landscape:text-2xl sm:landscape:text-4xl drop-shadow-sm text-center leading-none">
                      {opt.emoji}
                    </span>
                  )}
                  <span className={`text-sm sm:text-xl md:text-2xl landscape:text-xs sm:landscape:text-base font-kids font-bold tracking-wide text-center leading-tight ${
                    isSelected && opt.isCorrect
                      ? 'text-emerald-950 font-extrabold'
                      : isSelected && !opt.isCorrect
                      ? 'text-rose-950'
                      : 'text-slate-900'
                  }`}>
                    {opt.label}
                  </span>
                  {opt.sublabel && (
                    <span className="text-[10px] sm:text-xs landscape:text-[9px] font-fun text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-bold text-center border border-purple-200 truncate max-w-full">
                      {opt.sublabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* FOOTER EXPLANATION BAR: COMPACT 1-ROW                           */}
      {/* ============================================================== */}
      <div className="relative z-10 px-2.5 sm:px-4 py-1.5 bg-slate-950/70 border-t border-white/10 shrink-0 max-w-3xl w-full mx-auto flex items-center justify-between gap-2 text-xs sm:text-sm text-slate-200 font-fun backdrop-blur-xs">
        <div className="flex items-center gap-1.5 truncate">
          <Brain className="w-4 h-4 text-yellow-300 shrink-0" />
          <span className="font-bold truncate">{currentPuzzle.funExplanation}</span>
        </div>

        <button
          onClick={() => triggerSpeech(currentPuzzle.funExplanation)}
          className="p-1 px-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-kids font-bold text-xs cursor-pointer shrink-0 shadow flex items-center gap-1"
          title="Ascolta spiegazione"
        >
          <span>🔊</span>
        </button>
      </div>

      {/* Victory Celebration Overlay (Quick tap-to-advance) */}
      {showCelebration && (
        <div 
          onClick={() => {
            soundManager.playPop();
            onSolveLevel(currentPuzzle.rewardStars, currentPuzzle.rewardGems, currentPuzzle.category, attemptCount === 0);
          }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer animate-fade-in"
        >
          <div className="bg-gradient-to-b from-white via-white to-amber-50 rounded-4xl max-w-xs sm:max-w-sm w-full p-5 sm:p-7 border-4 border-yellow-300 shadow-2xl text-center flex flex-col items-center animate-bounce text-slate-900">
            <div className="text-6xl mb-1">🎉🌟💖</div>
            <h2 className="text-2xl sm:text-3xl font-kids font-bold text-purple-700">
              Bravissima Emma!
            </h2>
            <p className="text-sm font-fun font-bold text-pink-600 mb-3">
              Risposta esatta! +{currentPuzzle.rewardStars} Stelle ⭐
            </p>
            <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-slate-950 font-kids font-bold text-base shadow-lg animate-pulse flex items-center gap-1.5">
              <span>Prossimo Livello ➔</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
