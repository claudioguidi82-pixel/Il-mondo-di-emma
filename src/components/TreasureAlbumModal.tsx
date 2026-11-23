import React, { useState, useMemo } from 'react';
import {
  X,
  Gift,
  Trophy,
  Palette,
  Volume2,
  Sparkles,
  Lock,
  Check,
  Flame,
  Star,
  Gem,
} from 'lucide-react';
import { UserProgress } from '../types/game';
import { TROPHIES } from '../data/gameData';
import {
  COLLECTIBLE_STICKERS,
  CollectibleSticker,
  DAILY_MISSION_TARGET,
  getDailyCuriositySpark,
  getDailyMissionStatus,
} from '../utils/motivationEngine';
import { calculateChildAge, getAgeVisualTheme, getDisplayChildName, getGenderedWord } from '../utils/childProfile';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import treasureChest3d from '../assets/images/treasure_chest_3d_1795267243685.jpg';
import trophyMedallion3d from '../assets/images/trophy_medallion_3d_1795267241130.jpg';

interface TreasureAlbumModalProps {
  progress: UserProgress;
  onClaimDailyChest: () => void;
  onUnlockSticker: (sticker: CollectibleSticker) => void;
  onOpenStudio: () => void;
  onClose: () => void;
}

type AlbumTab = 'stickers' | 'trophies' | 'drawings';
type StickerFilter = 'Tutti' | CollectibleSticker['theme'];

const STICKER_THEMES: StickerFilter[] = [
  'Tutti',
  'Natura',
  'Spazio',
  'Musica',
  'Arte',
  'Scienza',
  'Magia',
];

export const TreasureAlbumModal: React.FC<TreasureAlbumModalProps> = ({
  progress,
  onClaimDailyChest,
  onUnlockSticker,
  onOpenStudio,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AlbumTab>('stickers');
  const [themeFilter, setThemeFilter] = useState<StickerFilter>('Tutti');
  const [selectedSticker, setSelectedSticker] = useState<CollectibleSticker | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const childProfile = progress.childProfile;
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const ageInfo = useMemo(() => calculateChildAge(childProfile?.birthDate), [childProfile?.birthDate]);
  const ageTheme = useMemo(
    () => getAgeVisualTheme(ageInfo.years, childProfile?.name, childGender),
    [ageInfo.years, childProfile?.name, childGender]
  );
  const curiosity = useMemo(
    () => getDailyCuriositySpark(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const mission = useMemo(() => getDailyMissionStatus(progress), [progress]);

  const unlockedSet = useMemo(
    () => new Set(progress.unlockedStickerIds && progress.unlockedStickerIds.length > 0 ? progress.unlockedStickerIds : ['stk_star']),
    [progress.unlockedStickerIds]
  );

  const filteredStickers = useMemo(() => {
    if (themeFilter === 'Tutti') return COLLECTIBLE_STICKERS;
    return COLLECTIBLE_STICKERS.filter((s) => s.theme === themeFilter);
  }, [themeFilter]);

  const unlockedCount = COLLECTIBLE_STICKERS.filter((s) => unlockedSet.has(s.id)).length;

  const handleOpenChest = () => {
    if (!mission.isDailyChestReady) return;
    soundManager.playFanfare();
    confetti.burst(undefined, undefined, 26);
    onClaimDailyChest();
    soundManager.speakPraise(
      `Evviva ${childName}! Hai aperto lo scrigno del giorno e vinto 3 gemme! Ecco la curiosità di oggi: ${curiosity.title}. ${curiosity.fact}`
    );
  };

  const handleReadCuriosity = () => {
    soundManager.playTwinkle();
    soundManager.speak(
      `${curiosity.title}. ${curiosity.fact} ${curiosity.questionPrompt}`,
      { context: 'instruction' }
    );
  };

  const handleStickerClick = (sticker: CollectibleSticker) => {
    const isUnlocked = unlockedSet.has(sticker.id);
    if (isUnlocked) {
      setSelectedSticker(sticker);
      setFeedbackNotice(null);
      soundManager.playMusicalNote(sticker.noteFreq, 0.38);
      soundManager.speak(`${sticker.name}! ${sticker.funFact}`, { context: 'instruction' });
      return;
    }

    if (progress.gems >= sticker.gemCost) {
      soundManager.playFanfare();
      confetti.burst(undefined, undefined, 20);
      onUnlockSticker(sticker);
      setSelectedSticker(sticker);
      setFeedbackNotice(`Nuovo adesivo sbloccato: ${sticker.name}!`);
      soundManager.speakPraise(
        `Fantastico ${childName}! Hai sbloccato ${sticker.name}! ${sticker.funFact}`
      );
    } else {
      soundManager.playPop();
      const missing = sticker.gemCost - progress.gems;
      setSelectedSticker(null);
      setFeedbackNotice(
        `Ti mancano ${missing} gemme per sbloccare "${sticker.name}", oppure completa una mini-missione da 5 sfide per riceverne uno gratis!`
      );
    }
  };

  const getTrophyCurrentCount = (cat: (typeof TROPHIES)[number]['category']): number => {
    if (cat === 'art') return (progress.savedDrawings || []).length;
    if (cat === 'streak') return progress.totalPuzzlesSolved || 0;
    const stat = progress.categoryStats[cat];
    return stat ? stat.total : 0;
  };

  const explorerWord = getGenderedWord(childGender, 'Esploratrice', 'Esploratore', 'Esploratore');

  return (
    <div
      className="safe-modal-overlay fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-start sm:items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Album dei Tesori e Curiosità"
    >
      <div
        className={`relative w-full max-w-2xl my-auto rounded-3xl overflow-hidden flex flex-col max-h-[92dvh] animate-pop-in ${
          ageTheme.isMatureTheme
            ? 'bg-slate-950 text-slate-100 border border-white/10 shadow-2xl'
            : 'bg-[#fafaf8] text-slate-900 border border-white/90 shadow-[0_28px_70px_-15px_rgba(15,23,42,0.55)]'
        }`}
      >
        {/* TOP HEADER */}
        <header
          className={`px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0 ${
            ageTheme.isMatureTheme
              ? 'bg-slate-900/95 border-b border-white/10 text-slate-100'
              : `bg-gradient-to-r ${ageTheme.genderPalette.headerGradientClass} text-white`
          }`}
        >
          <div className="min-w-0">
            <h2 className="font-fun font-extrabold text-lg sm:text-2xl tracking-tight leading-tight truncate">
              {ageTheme.stageId === 'teen_nextgen'
                ? `Archivio & Badge · ${childName}`
                : ageTheme.stageId === 'preteen_campus'
                ? `Collezione & Traguardi · ${childName}`
                : `Album dei Tesori di ${childName}`}
            </h2>
            <p className="text-xs sm:text-sm text-white/85 font-medium mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
              <span>{explorerWord} · {ageInfo.shortAgeLabel}</span>
              <span className="opacity-50" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-200">
                <Gem className="w-3.5 h-3.5" /> {progress.gems} Gemme
              </span>
              <span className="opacity-50" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-bold text-yellow-200">
                <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" /> {progress.stars}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundManager.stopSpeech();
              soundManager.playPop();
              onClose();
            }}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
              ageTheme.isMatureTheme
                ? 'bg-white/8 hover:bg-white/15 text-slate-200 border border-white/10'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            aria-label="Chiudi Album dei Tesori"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </header>

        {/* SEGMENTED NAVIGATION TABS (ALIGNED 3-COL GRID, ZERO OVERLAP) */}
        <nav
          className={`px-3 sm:px-6 pt-3 pb-2.5 border-b shrink-0 ${
            ageTheme.isMatureTheme
              ? 'bg-slate-900/70 border-white/10'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div
            className={`ui-aligned-tabs grid-cols-3 ${
              ageTheme.isMatureTheme
                ? 'bg-slate-950/90 border border-white/10'
                : 'bg-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                soundManager.playPop();
                setActiveTab('stickers');
              }}
              className={`min-h-[42px] min-w-0 rounded-xl px-2 sm:px-3 py-2 font-fun font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'stickers'
                  ? 'text-white shadow-xs'
                  : ageTheme.isMatureTheme
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={activeTab === 'stickers' ? { backgroundColor: ageTheme.genderPalette.accentHex } : undefined}
            >
              <Gift className="w-4 h-4 shrink-0" />
              <span className="truncate">{ageTheme.isMatureTheme ? 'Badge' : 'Adesivi'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playPop();
                setActiveTab('trophies');
              }}
              className={`min-h-[42px] min-w-0 rounded-xl px-2 sm:px-3 py-2 font-fun font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'trophies'
                  ? 'text-white shadow-xs'
                  : ageTheme.isMatureTheme
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={activeTab === 'trophies' ? { backgroundColor: ageTheme.genderPalette.accentHex } : undefined}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span className="truncate">Trofei</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playPop();
                setActiveTab('drawings');
              }}
              className={`min-h-[42px] min-w-0 rounded-xl px-2 sm:px-3 py-2 font-fun font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'drawings'
                  ? 'text-white shadow-xs'
                  : ageTheme.isMatureTheme
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={activeTab === 'drawings' ? { backgroundColor: ageTheme.genderPalette.accentHex } : undefined}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {ageTheme.isMatureTheme ? 'Sketch' : 'Disegni'} ({(progress.savedDrawings || []).length})
              </span>
            </button>
          </div>
        </nav>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {/* =============================================================== */}
          {/* TAB 1: SCRIGNO DEL GIORNO & COLLEZIONE ADESIVI MUSICALI         */}
          {/* =============================================================== */}
          {activeTab === 'stickers' && (
            <>
              {/* DAILY CURIOSITY & 3D TREASURE CHEST CARD */}
              <section className="rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/75 to-yellow-50 border-2 border-white shadow-[0_6px_0_rgba(245,158,11,0.3),0_18px_30px_-10px_rgba(217,119,6,0.2)] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="medallion-3d-frame w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-amber-100 border-2 border-white flex items-center justify-center shrink-0">
                      <img
                        src={treasureChest3d}
                        alt="Scrigno del Giorno 3D"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                        {mission.isDailyChestReady
                          ? 'Scrigno del Buongiorno Pronto!'
                          : `Lo Sapevi Oggi? · ${ageInfo.ageBandTitle}`}
                      </p>
                      <h3 className="font-fun font-extrabold text-base sm:text-lg text-slate-900 leading-snug mt-0.5">
                        {mission.isDailyChestReady
                          ? `Apri il tuo regalo quotidiano, ${childName}!`
                          : curiosity.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                        {mission.isDailyChestReady
                          ? 'Dentro ti aspettano +3 Gemme e una curiosità scientifica o artistica scelta apposta per la tua età.'
                          : curiosity.fact}
                      </p>
                      {!mission.isDailyChestReady && (
                        <p className="text-xs font-semibold text-indigo-700 mt-1.5">
                          💡 Spunto di oggi: {curiosity.questionPrompt}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:flex-col gap-2">
                    {mission.isDailyChestReady ? (
                      <button
                        type="button"
                        onClick={handleOpenChest}
                        className="toy-button-3d min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-fun font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Apri (+3 💎)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleReadCuriosity}
                        className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-fun font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Volume2 className="w-4 h-4 text-amber-300" />
                        <span>Ascolta</span>
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* STICKER COLLECTION SECTION */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-fun font-extrabold text-base sm:text-lg text-slate-900">
                      Adesivi Musicali & Segreti
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Tocca un adesivo sbloccato per ascoltare la sua nota e una curiosità, o sblocca nuovi tesori con le Gemme!
                    </p>
                  </div>
                  <span className="font-fun font-extrabold text-sm text-indigo-700 tabular-nums">
                    {unlockedCount} / {COLLECTIBLE_STICKERS.length} raccolti
                  </span>
                </div>

                {/* Theme Filter Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {STICKER_THEMES.map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => {
                        soundManager.playPop();
                        setThemeFilter(theme);
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        themeFilter === theme
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>

                {/* Active Sticker Fun Fact / Feedback Banner */}
                {(selectedSticker || feedbackNotice) && (
                  <div className="rounded-2xl bg-indigo-50 border border-indigo-200/90 p-3.5 flex items-start justify-between gap-3 animate-pop-in">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-3xl leading-none shrink-0">
                        {selectedSticker ? selectedSticker.emoji : '💎'}
                      </span>
                      <div className="min-w-0">
                        {selectedSticker && (
                          <p className="font-fun font-extrabold text-sm text-indigo-950">
                            {selectedSticker.name} · {selectedSticker.theme}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-0.5">
                          {selectedSticker ? selectedSticker.funFact : feedbackNotice}
                        </p>
                      </div>
                    </div>
                    {selectedSticker && (
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playMusicalNote(selectedSticker.noteFreq, 0.38);
                          soundManager.speak(`${selectedSticker.name}! ${selectedSticker.funFact}`, {
                            context: 'instruction',
                          });
                        }}
                        className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer"
                        title="Riascolta segreto"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Stickers Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {filteredStickers.map((sticker) => {
                    const isUnlocked = unlockedSet.has(sticker.id);
                    const canAfford = !isUnlocked && progress.gems >= sticker.gemCost;
                    const isSelected = selectedSticker?.id === sticker.id;

                    return (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => handleStickerClick(sticker)}
                        className={`sticker-tile-3d relative rounded-2xl p-3 border-2 text-left cursor-pointer flex flex-col items-center text-center gap-1.5 min-h-[126px] justify-center ${
                          isUnlocked
                            ? isSelected
                              ? 'bg-white border-indigo-400 ring-2 ring-indigo-300/70'
                              : 'bg-gradient-to-b from-white to-slate-50 border-white hover:border-indigo-200'
                            : canAfford
                            ? 'bg-gradient-to-b from-amber-50 to-amber-100/70 border-amber-300 hover:from-amber-50'
                            : 'bg-slate-100/85 border-slate-200/90 opacity-82'
                        }`}
                      >
                        {isUnlocked ? (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}

                        <span
                          className={`text-4xl leading-none transition-transform ${
                            isUnlocked ? 'drop-shadow-xs' : 'grayscale opacity-50'
                          }`}
                        >
                          {sticker.emoji}
                        </span>

                        <span className="font-fun font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                          {sticker.name}
                        </span>

                        {isUnlocked ? (
                          <span className="text-[11px] font-semibold text-indigo-600">
                            Tocca & Ascolta
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] font-bold tabular-nums ${
                              canAfford ? 'text-amber-700' : 'text-slate-500'
                            }`}
                          >
                            {canAfford ? `Sblocca · ${sticker.gemCost} 💎` : `Serve ${sticker.gemCost} 💎`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* =============================================================== */}
          {/* TAB 2: TROFEI & RITMO QUOTIDIANO                                */}
          {/* =============================================================== */}
          {activeTab === 'trophies' && (
            <div className="space-y-4">
              {/* DAILY MISSION & STREAK SUMMARY */}
              <section className="rounded-3xl bg-white border-2 border-white shadow-[0_6px_0_rgba(148,163,184,0.32),0_16px_28px_-10px_rgba(15,23,42,0.12)] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="medallion-3d-frame w-14 h-14 rounded-2xl overflow-hidden border-2 border-white bg-amber-50 shrink-0">
                      <img
                        src={trophyMedallion3d}
                        alt="Trofeo Esploratore 3D"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-fun font-extrabold text-base sm:text-lg text-slate-900">
                        Mini-Missione di Oggi (5 Sfide = Scrigno!)
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Ogni 5 sfide sblocchi +5 Gemme, un adesivo a sorpresa e una pausa ricarica mente.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-bold tabular-nums">
                    <span className="inline-flex items-center gap-1 text-orange-600">
                      <Flame className="w-4 h-4 fill-orange-400 text-orange-500" />
                      {Math.max(1, progress.streakDays || 1)}{' '}
                      {(progress.streakDays || 1) === 1 ? 'giorno' : 'giorni'}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="text-indigo-700">
                      {mission.completedToday} sfide oggi
                    </span>
                  </div>
                </div>

                {/* 5-step gentle visual steps */}
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: DAILY_MISSION_TARGET }).map((_, idx) => {
                    const filled =
                      idx < mission.inCurrentCycle ||
                      (mission.inCurrentCycle === 0 && mission.cyclesCompletedToday > 0);
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl py-2.5 border flex flex-col items-center justify-center gap-1 transition-all ${
                          filled
                            ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            filled ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                          }`}
                        />
                        <span className="font-fun font-bold text-xs tabular-nums">
                          {idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* TROPHIES GRID */}
              <section className="space-y-2.5">
                <h3 className="font-fun font-extrabold text-base sm:text-lg text-slate-900">
                  Bacheca dei Trofei
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TROPHIES.map((trophy) => {
                    const current = getTrophyCurrentCount(trophy.category);
                    const pct = Math.min(100, Math.round((current / trophy.requiredPuzzlesCount) * 100));
                    const isEarned = current >= trophy.requiredPuzzlesCount;
                    return (
                      <div
                        key={trophy.id}
                        className={`rounded-2xl p-3.5 border flex items-start gap-3 ${
                          isEarned
                            ? 'bg-white border-emerald-200 shadow-2xs'
                            : 'bg-slate-50/90 border-slate-200/80'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                            isEarned
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-white border-slate-200 grayscale opacity-60'
                          }`}
                        >
                          {trophy.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-fun font-extrabold text-sm text-slate-900 truncate">
                              {trophy.title}
                            </h4>
                            <span
                              className={`text-xs font-bold tabular-nums shrink-0 ${
                                isEarned ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {Math.min(current, trophy.requiredPuzzlesCount)}/{trophy.requiredPuzzlesCount}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                            {trophy.description}
                          </p>
                          <div className="mt-2 h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isEarned ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: I MIEI DISEGNI (GALLERIA STUDIO DISEGNO)                 */}
          {/* =============================================================== */}
          {activeTab === 'drawings' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-fun font-extrabold text-base sm:text-lg text-slate-900">
                    La Galleria Creativa di {childName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Alternare sfide di logica e momenti di disegno stimola entrambi gli emisferi del cervello!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    onClose();
                    onOpenStudio();
                  }}
                  className="toy-button-3d min-h-[44px] px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-fun font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Palette className="w-4 h-4" />
                  <span>Disegna Ora</span>
                </button>
              </div>

              {(progress.savedDrawings || []).length === 0 ? (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-8 text-center">
                  <span className="text-5xl block mb-2">🎨</span>
                  <h4 className="font-fun font-extrabold text-base sm:text-lg text-slate-900">
                    La tua galleria aspetta il primo capolavoro!
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                    Apri lo Studio Disegno per creare un foglio libero o colorare le sagome: ogni disegno salvato ti regala +3 Gemme e stelline!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(progress.savedDrawings || []).map((drawing) => (
                    <article
                      key={drawing.id}
                      className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs flex flex-col"
                    >
                      {drawing.dataUrl ? (
                        <div className="aspect-[4/3] bg-slate-50 border-b border-slate-100 overflow-hidden">
                          <img
                            src={drawing.dataUrl}
                            alt={drawing.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-slate-50 border-b border-slate-100 flex items-center justify-center text-4xl">
                          🖼️
                        </div>
                      )}
                      <div className="p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-fun font-bold text-sm text-slate-900 truncate">
                            {drawing.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {drawing.date}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-600 tabular-nums shrink-0">
                          +{drawing.starsEarned} ⭐
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
