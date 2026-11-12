import React, { useState, useEffect } from 'react';
import { MemoryCardData, MemoryTheme, UserProgress } from '../types/game';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { 
  Sparkles, 
  Star, 
  RotateCcw, 
  ChevronLeft, 
  Brain, 
  Trophy, 
  Volume2, 
  Play,
  Heart,
  Crown
} from 'lucide-react';

interface MemoryGameProps {
  progress: UserProgress;
  onReward: (stars: number, gems: number) => void;
  onClose: () => void;
}

// Curated library of Letter and Number pairs for 5-year-old Emma
const LETTER_PAIRS = [
  { pairKey: 'let_e', content: 'E', companion: 'Emma!', emoji: '💖', color: '#ec4899', pronounceText: 'E come Emma ed Elefante!' },
  { pairKey: 'let_a', content: 'A', companion: 'Ape', emoji: '🐝', color: '#f59e0b', pronounceText: 'A come Ape e Arcobaleno!' },
  { pairKey: 'let_m', content: 'M', companion: 'Mela', emoji: '🍎', color: '#ef4444', pronounceText: 'M come Mela e Miao!' },
  { pairKey: 'let_s', content: 'S', companion: 'Sole', emoji: '☀️', color: '#eab308', pronounceText: 'S come Sole e Stella!' },
  { pairKey: 'let_c', content: 'C', companion: 'Cane', emoji: '🐶', color: '#10b981', pronounceText: 'C come Cane e Cuore!' },
  { pairKey: 'let_l', content: 'L', companion: 'Luna', emoji: '🌙', color: '#6366f1', pronounceText: 'L come Luna e Leone!' },
];

const NUMBER_PAIRS = [
  { pairKey: 'num_1', content: '1', companion: 'Uno', emoji: '☀️', color: '#f59e0b', pronounceText: 'Numero Uno! Un solo sole!' },
  { pairKey: 'num_2', content: '2', companion: 'Due', emoji: '🦋', color: '#3b82f6', pronounceText: 'Numero Due! Due farfalline!' },
  { pairKey: 'num_3', content: '3', companion: 'Tre', emoji: '🍓', color: '#ef4444', pronounceText: 'Numero Tre! Tre fragoline!' },
  { pairKey: 'num_4', content: '4', companion: 'Quattro', emoji: '🐟', color: '#06b6d4', pronounceText: 'Numero Quattro! Quattro pesciolini!' },
  { pairKey: 'num_5', content: '5', companion: 'Cinque', emoji: '🖐️', color: '#ec4899', pronounceText: 'Numero Cinque! Come i tuoi 5 anni!' },
  { pairKey: 'num_6', content: '6', companion: 'Sei', emoji: '🌟', color: '#a855f7', pronounceText: 'Numero Sei! Sei stelline!' },
];

export const MemoryGame: React.FC<MemoryGameProps> = ({
  progress,
  onReward,
  onClose
}) => {
  const [theme, setTheme] = useState<MemoryTheme>('letters');
  const [pairCount, setPairCount] = useState<number>(3); // 3 pairs = 6 cards (optimal for 5yo)
  const [cards, setCards] = useState<MemoryCardData[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [matchesFound, setMatchesFound] = useState<number>(0);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // Clean up any playing audio when closing Memory Game
  useEffect(() => {
    return () => {
      soundManager.stopSpeech();
    };
  }, []);

  // Initialize and shuffle cards
  useEffect(() => {
    startNewGame();
  }, [theme, pairCount]);

  const startNewGame = () => {
    soundManager.playPop();
    setIsLocked(false);
    setFlippedCardIds([]);
    setMatchesFound(0);
    setMovesCount(0);
    setIsVictory(false);

    // Pick library based on theme
    let sourcePool = theme === 'letters' ? LETTER_PAIRS : theme === 'numbers' ? NUMBER_PAIRS : [...LETTER_PAIRS.slice(0, 3), ...NUMBER_PAIRS.slice(0, 3)];
    
    // Shuffle pool and select needed pairs
    const shuffledPool = [...sourcePool].sort(() => Math.random() - 0.5).slice(0, pairCount);

    // Create 2 cards per pair (one with big symbol, one companion)
    const deck: MemoryCardData[] = [];
    shuffledPool.forEach((item, idx) => {
      // Card A
      deck.push({
        uniqueId: `card_${item.pairKey}_A_${Date.now()}_${idx}`,
        pairKey: item.pairKey,
        content: item.content,
        companion: item.companion,
        emoji: item.emoji,
        color: item.color,
        pronounceText: item.pronounceText,
        isFlipped: false,
        isMatched: false,
      });
      // Card B
      deck.push({
        uniqueId: `card_${item.pairKey}_B_${Date.now()}_${idx}`,
        pairKey: item.pairKey,
        content: item.content,
        companion: item.companion,
        emoji: item.emoji,
        color: item.color,
        pronounceText: item.pronounceText,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle the final deck
    const shuffledDeck = deck.sort(() => Math.random() - 0.5);
    setCards(shuffledDeck);

    // Friendly vocal instruction
    const introText = theme === 'letters'
      ? 'Gira le carte e trova le coppie delle lettere magiche, Emma!'
      : theme === 'numbers'
      ? 'Trova le coppie dei numeri e conta insieme a me!'
      : 'Allena la tua mente con il memory di lettere e numeri!';
    soundManager.speak(introText, 1.25);
  };

  const handleCardClick = (card: MemoryCardData) => {
    // Ignore if board is busy, card is already matched, or already flipped
    if (isLocked || card.isFlipped || card.isMatched) return;

    soundManager.playPop();
    // Speak card content immediately for speech-letter association
    soundManager.speak(card.pronounceText, 1.25);

    // Flip card visually
    const newCards = cards.map(c => 
      c.uniqueId === card.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCardIds, card.uniqueId];
    setFlippedCardIds(newFlipped);

    // When 2 cards are flipped, check for match!
    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMovesCount(prev => prev + 1);

      const firstCard = newCards.find(c => c.uniqueId === newFlipped[0])!;
      const secondCard = newCards.find(c => c.uniqueId === newFlipped[1])!;

      if (firstCard.pairKey === secondCard.pairKey) {
        // MATCH FOUND!
        setTimeout(() => {
          soundManager.playSuccess();
          confetti.burst(undefined, undefined, 20);

          const updatedCards = newCards.map(c => 
            c.pairKey === firstCard.pairKey ? { ...c, isMatched: true, isFlipped: true } : c
          );
          setCards(updatedCards);
          setFlippedCardIds([]);
          setIsLocked(false);
          const nextMatches = matchesFound + 1;
          setMatchesFound(nextMatches);

          soundManager.speak('Evviva! Coppia perfetta!', 1.3);

          // Check if whole game is won!
          if (nextMatches === pairCount) {
            setTimeout(() => {
              handleGameVictory();
            }, 600);
          }
        }, 500);
      } else {
        // NO MATCH -> show for 900ms then smoothly flip back
        setTimeout(() => {
          soundManager.playEncouragement();
          const resetCards = newCards.map(c => 
            newFlipped.includes(c.uniqueId) ? { ...c, isFlipped: false } : c
          );
          setCards(resetCards);
          setFlippedCardIds([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  const handleGameVictory = () => {
    soundManager.playFanfare();
    confetti.burst();
    setIsVictory(true);
    onReward(3, 5);
    soundManager.speak(`Super campionessa Emma! Hai trovato tutte le ${pairCount} coppie! La tua memoria e concentrazione sono imbattibili!`, 1.25);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-900/90 border-b-2 border-pink-500/30 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playPop();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl text-white font-fun font-bold text-sm sm:text-base border-b-4 border-slate-950 flex items-center gap-1.5 cursor-pointer shadow"
          >
            <ChevronLeft className="w-5 h-5 text-pink-400" />
            <span>Esci</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl animate-spin" style={{ animationDuration: '8s' }}>🃏</span>
            <div>
              <h1 className="font-kids font-bold text-lg sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-300">
                Il Memory Magico di Emma
              </h1>
              <p className="text-xs text-pink-200 font-fun font-bold hidden sm:block">
                Gira le carte e trova le coppie per allenare la mente!
              </p>
            </div>
          </div>
        </div>

        {/* Currency & Score */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/25 rounded-2xl border-2 border-amber-400/50 text-amber-300 font-kids text-base">
            <Star className="w-5 h-5 fill-amber-400" />
            <span>{progress.stars}</span>
          </div>

          <button
            onClick={startNewGame}
            title="Mescola e rigioca"
            className="p-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl border-b-4 border-pink-800 active:translate-y-1 cursor-pointer transition-all btn-chunky"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Control Selector Bar: Theme & Pair Count */}
      <div className="px-3 sm:px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Theme tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setTheme('letters')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-kids text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-4 btn-chunky ${
              theme === 'letters'
                ? 'bg-pink-500 text-white border-pink-700 shadow-md ring-2 ring-yellow-300 scale-102'
                : 'bg-slate-800 text-slate-300 border-slate-950 hover:bg-slate-700'
            }`}
          >
            🔤 Lettere
          </button>

          <button
            onClick={() => setTheme('numbers')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-kids text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-4 btn-chunky ${
              theme === 'numbers'
                ? 'bg-cyan-500 text-slate-950 border-cyan-700 shadow-md ring-2 ring-yellow-300 scale-102'
                : 'bg-slate-800 text-slate-300 border-slate-950 hover:bg-slate-700'
            }`}
          >
            🔢 Numeri
          </button>

          <button
            onClick={() => setTheme('mixed')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-kids text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-4 btn-chunky ${
              theme === 'mixed'
                ? 'bg-purple-500 text-white border-purple-700 shadow-md ring-2 ring-yellow-300 scale-102'
                : 'bg-slate-800 text-slate-300 border-slate-950 hover:bg-slate-700'
            }`}
          >
            🌈 Misto
          </button>
        </div>

        {/* Difficulty: 4 cards (2 pairs), 6 cards (3 pairs), 8 cards (4 pairs) */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-kids text-slate-300 hidden md:inline">Carte:</span>
          {[2, 3, 4].map(count => (
            <button
              key={count}
              onClick={() => setPairCount(count)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-kids text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 ${
                pairCount === count
                  ? 'bg-amber-400 text-slate-950 border-amber-600 scale-105 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-900 hover:text-white'
              }`}
            >
              {count * 2} Carte
            </button>
          ))}
        </div>
      </div>

      {/* Main Play Area with 3D Card Grid */}
      <div className="flex-1 p-3 sm:p-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
        {/* Progress Tracker for Kids */}
        <div className="w-full flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2 text-base sm:text-lg font-kids text-yellow-300">
            <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
            <span>Coppie Trovate: {matchesFound} / {pairCount}</span>
          </div>

          <button
            onClick={() => {
              const helpMsg = theme === 'letters'
                ? 'Gira due carte con la stessa lettera dell’alfabeto!'
                : 'Gira due carte con lo stesso numero per unirle!';
              soundManager.speak(helpMsg, 1.25);
            }}
            className="px-3 py-1 bg-slate-900 border border-pink-400/50 rounded-xl text-xs sm:text-sm font-fun font-bold text-pink-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Volume2 className="w-4 h-4 text-yellow-300" />
            <span>Indizio Voce 🔊</span>
          </button>
        </div>

        {/* 3D Flip Card Grid (Optimized for Android Tablets in Portrait & Landscape) */}
        <div className={`grid gap-2.5 sm:gap-4 md:gap-5 w-full justify-center items-center py-1 sm:py-2 ${
          pairCount === 2 
            ? 'grid-cols-2 max-w-sm sm:max-w-md' 
            : pairCount === 3 
            ? 'grid-cols-3 max-w-md sm:max-w-xl md:max-w-2xl' 
            : 'grid-cols-4 max-w-lg sm:max-w-2xl md:max-w-3xl'
        }`}>
          {cards.map((card) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <div
                key={card.uniqueId}
                onClick={() => handleCardClick(card)}
                className={`w-full aspect-[3/4] max-h-[34vh] sm:max-h-[40vh] md:max-h-[46vh] cursor-pointer transition-transform duration-300 perspective-[1000px] select-none ${
                  card.isMatched
                    ? 'scale-95 opacity-90'
                    : 'hover:scale-103 active:scale-98'
                }`}
              >
                {/* 3D Card Inner Container */}
                <div 
                  className={`w-full h-full relative rounded-3xl sm:rounded-4xl transition-transform duration-500 shadow-xl border-4 ${
                    card.isMatched 
                      ? 'border-emerald-400 shadow-emerald-500/30' 
                      : 'border-yellow-300/80 hover:border-white shadow-pink-500/20'
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* CARD BACK (Rainbow Sparkle with Golden Star) */}
                  <div 
                    className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-2 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 backface-hidden shadow-inner"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl sm:text-4xl shadow-md animate-pulse">
                      ⭐
                    </div>
                    <span className="text-[10px] sm:text-xs font-kids font-bold text-yellow-200 mt-2 tracking-wider uppercase">
                      Emma
                    </span>
                  </div>

                  {/* CARD FRONT (Big Letter or Number + Emoji + Word) */}
                  <div 
                    className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl flex flex-col items-center justify-between p-3 sm:p-4 bg-slate-900 border-2 border-white/20 shadow-2xl backface-hidden"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    {/* Top Tiny Emoji */}
                    <div className="w-full flex items-center justify-between text-xs sm:text-sm font-kids text-slate-400">
                      <span>{card.emoji}</span>
                      <span>{card.companion}</span>
                    </div>

                    {/* JUMBO Central Content (Letter or Number) */}
                    <div className="my-auto flex flex-col items-center justify-center">
                      <span 
                        className="text-5xl sm:text-7xl font-kids font-bold tracking-tight drop-shadow-lg leading-none"
                        style={{ color: card.color }}
                      >
                        {card.content}
                      </span>
                    </div>

                    {/* Bottom Matching Tag */}
                    <div className="w-full text-center">
                      <span 
                        className="text-xs sm:text-sm font-fun font-bold px-2.5 py-0.5 rounded-full text-white shadow-sm inline-block truncate max-w-full"
                        style={{ backgroundColor: card.color }}
                      >
                        {card.companion}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Victory Modal with Celebration */}
      {isVictory && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-4xl max-w-md w-full p-6 sm:p-8 border-4 border-yellow-300 shadow-2xl text-center flex flex-col items-center animate-fade-in relative overflow-hidden">
            <div className="text-7xl mb-3 animate-bounce">
              👑🃏🌟
            </div>

            <span className="text-xs sm:text-sm font-kids font-bold uppercase tracking-wider text-yellow-300 bg-yellow-500/20 px-4 py-1 rounded-full mb-2 border border-yellow-400/40">
              Regina della Memoria!
            </span>

            <h2 className="text-3xl sm:text-4xl font-kids font-bold text-white mb-1">
              Bravissima Emma!
            </h2>
            <p className="text-base sm:text-lg font-fun font-bold text-pink-200 mb-6">
              Hai trovato tutte le coppie in {movesCount} tentativi!
            </p>

            {/* Stars Won */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="px-5 py-3 bg-amber-500/25 rounded-3xl border-2 border-amber-400 text-amber-300 font-kids flex items-center gap-2 text-xl font-bold">
                <Star className="w-6 h-6 fill-amber-400" />
                <span>+3 Stelle d'Oro!</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={startNewGame}
                className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 active:scale-95 text-white font-kids font-bold text-xl rounded-3xl shadow-xl flex items-center justify-center gap-3 border-b-6 border-purple-800 btn-chunky cursor-pointer"
              >
                <RotateCcw className="w-6 h-6" />
                <span>GIOCA ANCORA! ➔</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-pink-300 border-2 border-pink-400/40 rounded-3xl font-fun font-bold text-base cursor-pointer"
              >
                Torna al Menu dei Giochi ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
