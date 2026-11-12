import React, { useState } from 'react';
import { UserProgress, SavedDrawing } from '../types/game';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { 
  BookHeart, 
  Calendar, 
  Star, 
  Sparkles, 
  Trophy, 
  Download, 
  Trash2, 
  Gift, 
  Check, 
  Image as ImageIcon,
  Palette,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

interface DigitalDiaryProps {
  progress: UserProgress;
  onClaimDailyReward: () => void;
  onOpenStudio: () => void;
  onDeleteDrawing: (drawingId: string) => void;
  onClose: () => void;
}

export const DigitalDiary: React.FC<DigitalDiaryProps> = ({
  progress,
  onClaimDailyReward,
  onOpenStudio,
  onDeleteDrawing,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'drawings' | 'daily' | 'badges'>('drawings');
  const [selectedDrawing, setSelectedDrawing] = useState<SavedDrawing | null>(null);

  const handleClaimChest = () => {
    if (progress.dailyRewardClaimed) {
      soundManager.speak('Emma, hai già raccolto il tesoro di oggi! Torna domani per una nuova sorpresa magica!', 1.25);
      return;
    }
    soundManager.playFanfare();
    confetti.burst();
    onClaimDailyReward();
    soundManager.speak('Sorpresa! Hai trovato 3 stelle d’oro e 5 gemme luccicanti nel forziere magico!', 1.25);
  };

  // Badges calculation based on real educational achievements
  const badges = [
    {
      id: 'logic_master',
      title: 'Genietto della Logica',
      description: 'Hai completato i pattern e trovato gli intrusi!',
      icon: '🧠',
      unlocked: progress.completedPuzzleIds.some(id => id.startsWith('log_')),
    },
    {
      id: 'first_letter',
      title: 'Maga delle Lettere',
      description: 'Hai imparato la tua lettera E e le parole dell’alfabeto!',
      icon: '🔤',
      unlocked: progress.completedPuzzleIds.some(id => id.startsWith('let_')),
    },
    {
      id: 'first_number',
      title: 'Amica dei Numeri',
      description: 'Hai contato le stelline e fatto la tua prima addizione!',
      icon: '🔢',
      unlocked: progress.completedPuzzleIds.some(id => id.startsWith('num_')),
    },
    {
      id: 'first_shapes',
      title: 'Esploratrice delle Ombre',
      description: 'Hai abbinato le sagome e mescolato i colori!',
      icon: '🔷',
      unlocked: progress.completedPuzzleIds.some(id => id.startsWith('shp_')),
    },
    {
      id: 'first_drawing',
      title: 'Piccola Artista',
      description: 'Hai dipinto e salvato un disegno nel tuo diario!',
      icon: '🎨',
      unlocked: progress.savedDrawings.length > 0,
    },
    {
      id: 'star_collector',
      title: 'Cacciatrice di Stelle',
      description: 'Hai raccolto almeno 6 stelle del sapere!',
      icon: '⭐',
      unlocked: progress.stars >= 6,
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-white overflow-hidden backdrop-blur-md select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-slate-900/80 border-b border-pink-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playPop();
              onClose();
            }}
            className="p-2 hover:bg-slate-800 rounded-2xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 font-fun text-sm"
          >
            <ChevronLeft className="w-5 h-5 text-pink-400" />
            <span className="hidden sm:inline">Torna al Gioco</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-500/20 rounded-2xl border border-pink-400/30 text-pink-300">
              <BookHeart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-fun font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300">
                Il Diario Magico di Emma
              </h1>
              <p className="text-xs text-slate-400 font-fun">
                I tuoi ricordi, i disegni e le medaglie d'oro
              </p>
            </div>
          </div>
        </div>

        {/* Currency summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 font-fun text-xs">
            <Star className="w-4 h-4 fill-amber-400" />
            <span className="font-bold">{progress.stars}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30 font-fun text-xs">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">{progress.gems}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="px-3 sm:px-6 pt-3 flex items-center gap-2 border-b-2 border-slate-800">
        <button
          onClick={() => {
            soundManager.playPop();
            setActiveTab('drawings');
          }}
          className={`px-4 sm:px-6 py-3 font-kids text-sm sm:text-base font-bold rounded-t-3xl border-t-2 border-x-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'drawings'
              ? 'bg-slate-900 border-pink-400 text-pink-300 shadow-lg scale-102'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-5 h-5 text-pink-400" />
          <span>I Miei Disegni ({progress.savedDrawings.length})</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPop();
            setActiveTab('badges');
          }}
          className={`px-4 sm:px-6 py-3 font-kids text-sm sm:text-base font-bold rounded-t-3xl border-t-2 border-x-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'badges'
              ? 'bg-slate-900 border-yellow-400 text-yellow-300 shadow-lg scale-102'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span>Medaglie 🏆 ({badges.filter(b => b.unlocked).length}/{badges.length})</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPop();
            setActiveTab('daily');
          }}
          className={`px-4 sm:px-6 py-3 font-kids text-sm sm:text-base font-bold rounded-t-3xl border-t-2 border-x-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'bg-slate-900 border-amber-400 text-amber-300 shadow-lg scale-102'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-5 h-5 text-amber-400" />
          <span>Regalo del Giorno</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {/* TAB 1: DRAWINGS GALLERY */}
        {activeTab === 'drawings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-fun font-bold text-white">
                  I Disegni Magici di Emma
                </h2>
                <p className="text-xs text-slate-400">
                  Tutti i capolavori salvati con la tua fantasia e i tuoi colori
                </p>
              </div>

              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenStudio();
                }}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-fun font-bold rounded-2xl shadow-lg shadow-pink-500/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer text-sm"
              >
                <Palette className="w-4 h-4" />
                <span>Nuovo Disegno</span>
              </button>
            </div>

            {progress.savedDrawings.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-800 p-8 flex flex-col items-center">
                <Palette className="w-16 h-16 text-pink-400/60 mb-3 animate-gentle-bounce" />
                <h3 className="text-lg font-fun font-bold text-white mb-1">
                  Il tuo diario è pronto per il primo capolavoro!
                </h3>
                <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                  Entra nella Bottega d’Arte per colorare con il pennello arcobaleno, stampare adesivi fatati e salvare la tua opera qui!
                </p>
                <button
                  onClick={onOpenStudio}
                  className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-fun font-bold rounded-2xl shadow-lg shadow-pink-600/30 active:scale-95 transition-all cursor-pointer"
                >
                  Inizia a Disegnare Ora! ✨
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {progress.savedDrawings.map((draw) => (
                  <div
                    key={draw.id}
                    onClick={() => setSelectedDrawing(draw)}
                    className="group bg-slate-900/80 rounded-3xl border border-slate-800 hover:border-pink-500/50 p-3 overflow-hidden shadow-lg hover:shadow-pink-500/20 transition-all cursor-pointer hover:scale-102 flex flex-col"
                  >
                    <div className="w-full aspect-4/3 bg-white rounded-2xl overflow-hidden relative border border-slate-700">
                      <img
                        src={draw.dataUrl}
                        alt={draw.title}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 font-fun text-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>+{draw.starsEarned}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-start justify-between">
                      <div>
                        <h4 className="font-fun font-bold text-sm text-white truncate group-hover:text-pink-300 transition-colors">
                          {draw.title}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {draw.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DAILY REWARD & STREAK */}
        {activeTab === 'daily' && (
          <div className="max-w-2xl mx-auto flex flex-col items-center text-center py-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 font-fun text-xs mb-4">
              <Calendar className="w-4 h-4" />
              <span>Giorno di Gioco #{progress.streakDays}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-fun font-bold text-white mb-2">
              Il Forziere dei Premi Quotidiani
            </h2>
            <p className="text-sm text-slate-300 max-w-md mb-8">
              Gioca ogni giorno con le lettere e i numeri per aprire il tesoro fatato e collezionare tantissime stelle!
            </p>

            {/* Big Interactive Treasure Chest */}
            <div
              onClick={handleClaimChest}
              className={`relative p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer ${
                progress.dailyRewardClaimed
                  ? 'bg-slate-900/60 border-slate-700 opacity-90'
                  : 'bg-gradient-to-b from-amber-500/20 to-purple-500/20 border-amber-400 shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 animate-gentle-bounce'
              }`}
            >
              <div className="text-7xl mb-4">
                {progress.dailyRewardClaimed ? '🎁' : '✨🎁✨'}
              </div>

              <div className="font-fun font-bold text-lg text-white mb-1">
                {progress.dailyRewardClaimed ? 'Tesoro di Oggi già Raccolto!' : 'Tocca il Forziere Magico!'}
              </div>

              <p className="text-xs text-amber-200/90 font-fun">
                {progress.dailyRewardClaimed
                  ? 'Hai già ricevuto 3 Stelle e 5 Gemme. Torna domani per il prossimo regalo!'
                  : 'Contiene: 3 Stelle d’Oro + 5 Gemme per sbloccare i vestitini!'}
              </p>

              {progress.dailyRewardClaimed && (
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-fun text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Completato per oggi</span>
                </div>
              )}
            </div>

            {/* 7-Day Journey Strip */}
            <div className="mt-10 w-full bg-slate-900/60 rounded-3xl p-6 border border-slate-800">
              <h3 className="text-sm font-fun font-bold text-slate-300 mb-4">
                Il Tuo Cammino Settimanale
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const isCurrent = day === progress.streakDays;
                  const isPast = day < progress.streakDays;
                  return (
                    <div
                      key={day}
                      className={`p-3 rounded-2xl flex flex-col items-center border transition-all ${
                        isCurrent
                          ? 'bg-pink-600/30 border-pink-400 text-pink-300 ring-2 ring-pink-400/50'
                          : isPast
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-500'
                      }`}
                    >
                      <span className="text-xs font-fun font-bold">Giorno {day}</span>
                      <span className="text-xl my-1">{day === 7 ? '👑' : day % 2 === 0 ? '💎' : '⭐'}</span>
                      <span className="text-[10px] font-fun">
                        {isPast ? 'Fatto ✓' : isCurrent ? 'Oggi' : 'In arrivo'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BADGES */}
        {activeTab === 'badges' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-fun font-bold text-white">
                Le Medaglie Magiche di Emma
              </h2>
              <p className="text-xs text-slate-400">
                Guadagna trofei preziosi superando gli enigmi e usando la tua creatività
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-3xl border transition-all flex items-start gap-4 ${
                    badge.unlocked
                      ? 'bg-slate-900/80 border-amber-400/50 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                    badge.unlocked ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse' : 'bg-slate-800 text-slate-600'
                  }`}>
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-fun font-bold text-sm text-white">
                        {badge.title}
                      </h4>
                      {badge.unlocked ? (
                        <span className="text-xs font-fun text-emerald-400 font-bold">Sbloccato!</span>
                      ) : (
                        <span className="text-xs font-fun text-slate-500">Da Vincere</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drawing Zoom Modal */}
      {selectedDrawing && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border-2 border-pink-400/50 shadow-2xl animate-fade-in flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-fun font-bold text-xl text-white">
                  {selectedDrawing.title}
                </h3>
                <span className="text-xs text-slate-400">{selectedDrawing.date}</span>
              </div>
              <button
                onClick={() => setSelectedDrawing(null)}
                className="text-slate-400 hover:text-white font-fun text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="w-full aspect-4/3 bg-white rounded-2xl overflow-hidden border-2 border-slate-700 mb-4">
              <img
                src={selectedDrawing.dataUrl}
                alt={selectedDrawing.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  soundManager.playPop();
                  onDeleteDrawing(selectedDrawing.id);
                  setSelectedDrawing(null);
                }}
                className="px-3 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 font-fun text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-red-800"
              >
                <Trash2 className="w-4 h-4" />
                <span>Rimuovi</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playPop();
                  const link = document.createElement('a');
                  link.download = `${selectedDrawing.title}.png`;
                  link.href = selectedDrawing.dataUrl;
                  link.click();
                }}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-fun font-bold text-sm rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Scarica Disegno</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
