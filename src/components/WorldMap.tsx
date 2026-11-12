import React from 'react';
import { GameCategory, UserProgress } from '../types/game';
import { EmmaCharacter } from './EmmaCharacter';
import { soundManager } from '../utils/audio';
import { 
  Star, 
  Sparkles, 
  Brain, 
  BookOpen, 
  Calculator, 
  Shapes, 
  Palette, 
  BookHeart, 
  Settings, 
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

interface WorldMapProps {
  progress: UserProgress;
  onSelectCategory: (category: GameCategory) => void;
  onOpenMemory?: () => void;
  onOpenStudio: () => void;
  onOpenDiary: () => void;
  onOpenParents: () => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  progress,
  onSelectCategory,
  onOpenMemory,
  onOpenStudio,
  onOpenDiary,
  onOpenParents
}) => {
  const realms: {
    id: GameCategory;
    title: string;
    subtitle: string;
    guides: string;
    guideEmojis: string;
    badge: string;
    gradient: string;
    borderColor: string;
    shadowColor: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'logic',
      title: 'Mondo della Logica',
      subtitle: 'Pattern, trova l’intruso e grandezze!',
      guides: 'Scoiattolo Leo & Volpina Fiamma',
      guideEmojis: '🐿️ 🦊',
      badge: '🧠 Giochi della Mente',
      gradient: 'from-purple-600 via-indigo-600 to-purple-800',
      borderColor: 'border-purple-300',
      shadowColor: 'shadow-purple-500/40',
      icon: <Brain className="w-12 h-12 text-yellow-300 drop-shadow" />
    },
    {
      id: 'letters',
      title: 'Mondo delle Lettere',
      subtitle: 'La lettera E di Emma, alfabeto e parole!',
      guides: 'Rondine Piuma & Gufo Barnaba',
      guideEmojis: '🕊️ 🦉',
      badge: '🔤 Alfabeto Magico',
      gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
      borderColor: 'border-emerald-300',
      shadowColor: 'shadow-emerald-500/40',
      icon: <BookOpen className="w-12 h-12 text-amber-200 drop-shadow" />
    },
    {
      id: 'numbers',
      title: 'Mondo dei Numeri',
      subtitle: 'Conta le stelline e prime somme visive!',
      guides: 'Delfino Brio & Tartaruga Camilla',
      guideEmojis: '🐬 🐢',
      badge: '🔢 Conta & Calcola',
      gradient: 'from-cyan-600 via-blue-600 to-cyan-800',
      borderColor: 'border-cyan-300',
      shadowColor: 'shadow-cyan-500/40',
      icon: <Calculator className="w-12 h-12 text-yellow-300 drop-shadow" />
    },
    {
      id: 'shapes',
      title: 'Mondo delle Forme & Ombre',
      subtitle: 'Sagome di animali, triangoli e colori!',
      guides: 'Orsetto Miele & Volpina Fiamma',
      guideEmojis: '🧸 🦊',
      badge: '🔷 Forme & Colori',
      gradient: 'from-pink-600 via-rose-600 to-pink-800',
      borderColor: 'border-pink-300',
      shadowColor: 'shadow-pink-500/40',
      icon: <Shapes className="w-12 h-12 text-yellow-200 drop-shadow" />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white relative overflow-x-hidden selection:bg-pink-500">
      {/* Background ambient gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-pink-600/25 via-purple-600/25 to-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Jumbo Header */}
      <header className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-950/80 backdrop-blur-md border-b-2 border-pink-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg border-2 border-white/40">
            🌈
          </div>
          <div>
            <h1 className="font-kids font-bold text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 leading-tight">
              Il Mondo di Emma
            </h1>
            <p className="text-xs sm:text-sm text-pink-200 font-fun font-bold">
              Scegli cosa vuoi esplorare oggi!
            </p>
          </div>
        </div>

        {/* Currency & Parent button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/25 rounded-2xl border-2 border-amber-400/50 text-amber-300 font-kids text-base">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>{progress.stars}</span>
          </div>

          <button
            onClick={() => {
              soundManager.playPop();
              onOpenParents();
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl border-2 border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow"
            title="Area Genitori"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-between">
        {/* Emma Mascot Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950/80 to-slate-900 rounded-4xl p-5 sm:p-6 border-4 border-pink-400/50 shadow-2xl backdrop-blur-md mb-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="shrink-0">
              <EmmaCharacter
                size="md"
                interactive={true}
                showSpeech={false}
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/30 border border-pink-400 text-pink-200 font-fun font-bold text-xs sm:text-sm mb-2">
                <Brain className="w-4 h-4 text-yellow-300" />
                <span>Palestra della Mente per Bambini</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-kids font-bold text-white tracking-wide">
                Quale gioco facciamo insieme, Emma?
              </h2>
              <p className="text-sm sm:text-base text-slate-200 max-w-lg mt-1 font-fun font-bold leading-relaxed">
                Tocca un regno colorato per iniziare a giocare con gli animali parlanti!
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap sm:flex-col md:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0 justify-center">
            {onOpenMemory && (
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenMemory();
                }}
                className="flex-1 sm:flex-none px-5 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:translate-y-1 text-yellow-200 font-kids font-bold text-sm sm:text-base rounded-2xl shadow-lg border-b-4 border-indigo-950 flex items-center justify-center gap-2 cursor-pointer btn-chunky ring-2 ring-yellow-300/50"
              >
                <span className="text-xl">🃏</span>
                <span>Memory Magico</span>
              </button>
            )}

            <button
              onClick={() => {
                soundManager.playPop();
                onOpenStudio();
              }}
              className="flex-1 sm:flex-none px-5 py-3.5 bg-cyan-600 hover:bg-cyan-500 active:translate-y-1 text-white font-kids font-bold text-sm sm:text-base rounded-2xl shadow-lg border-b-4 border-cyan-800 flex items-center justify-center gap-2 cursor-pointer btn-chunky"
            >
              <Palette className="w-5 h-5 text-cyan-200" />
              <span>Bottega d'Arte</span>
            </button>

            <button
              onClick={() => {
                soundManager.playPop();
                onOpenDiary();
              }}
              className="flex-1 sm:flex-none px-5 py-3.5 bg-amber-500 hover:bg-amber-400 active:translate-y-1 text-slate-950 font-kids font-bold text-sm sm:text-base rounded-2xl shadow-lg border-b-4 border-amber-700 flex items-center justify-center gap-2 cursor-pointer btn-chunky"
            >
              <Award className="w-5 h-5 text-slate-950" />
              <span>Medaglie 🏆</span>
            </button>
          </div>
        </div>

        {/* 4 Big Chunky Realm Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
          {realms.map((realm) => (
            <button
              key={realm.id}
              onClick={() => {
                soundManager.playPop();
                onSelectCategory(realm.id);
              }}
              className={`group text-left p-6 sm:p-7 rounded-4xl bg-gradient-to-br ${realm.gradient} border-4 ${realm.borderColor} border-b-8 shadow-2xl transition-all duration-200 active:translate-y-2 cursor-pointer flex flex-col justify-between btn-chunky min-h-[180px] sm:min-h-[210px]`}
            >
              <div className="flex items-start justify-between w-full mb-3">
                <div className="p-3 bg-white/20 rounded-3xl backdrop-blur-xs border-2 border-white/40 group-hover:scale-110 transition-transform">
                  {realm.icon}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs sm:text-sm font-kids font-bold px-3 py-1 rounded-2xl bg-black/40 text-yellow-300 border border-white/30 backdrop-blur-xs">
                    {realm.badge}
                  </span>
                  <span className="text-xl mt-1">
                    {realm.guideEmojis}
                  </span>
                </div>
              </div>

              <div className="w-full">
                <h3 className="text-2xl sm:text-3xl font-kids font-bold text-white drop-shadow">
                  {realm.title}
                </h3>
                <p className="text-sm sm:text-base text-white/90 font-fun font-bold mt-1">
                  {realm.subtitle}
                </p>

                <div className="mt-4 pt-3 border-t-2 border-white/20 flex items-center justify-between text-yellow-300 font-kids text-xs sm:text-sm">
                  <span>Guida: {realm.guides}</span>
                  <span className="text-lg">GIOCA ORA ➔</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Gentle Footer */}
      <footer className="relative z-10 px-6 py-3 bg-slate-950/80 border-t border-slate-900 text-center text-xs sm:text-sm text-slate-400 font-fun flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Fatto con tanto amore per Emma 💕</span>
        <span>Risolvi gli enigmi per accendere le stelle del sapere!</span>
      </footer>
    </div>
  );
};
