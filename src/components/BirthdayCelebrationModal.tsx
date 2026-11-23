import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, X, PartyPopper, Award } from 'lucide-react';
import { ChildGender } from '../types/game';
import { getAgeVisualTheme, getGenderedWord } from '../utils/childProfile';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';

interface BirthdayCelebrationModalProps {
  childName: string;
  childGender?: ChildGender;
  ageYears: number;
  isActualBirthdayToday: boolean;
  alreadyClaimedGiftThisYear: boolean;
  onClaimBirthdayGift: () => void;
  onClose: () => void;
}

export const BirthdayCelebrationModal: React.FC<BirthdayCelebrationModalProps> = ({
  childName,
  childGender,
  ageYears,
  isActualBirthdayToday,
  alreadyClaimedGiftThisYear,
  onClaimBirthdayGift,
  onClose,
}) => {
  const theme = getAgeVisualTheme(ageYears, childName);
  const candleCount = Math.max(2, Math.min(7, ageYears));
  const [litCandles, setLitCandles] = useState<boolean[]>(() =>
    Array.from({ length: candleCount }, () => true)
  );
  const [giftClaimedNow, setGiftClaimedNow] = useState(false);

  const allExtinguished = litCandles.every((c) => !c);
  const festeggiatoWord = getGenderedWord(
    childGender,
    'festeggiata',
    'festeggiato',
    'protagonista'
  );

  useEffect(() => {
    confetti.burst();
    soundManager.playSuccess();
    const timer = setTimeout(() => {
      confetti.burst();
    }, 900);

    const speechGreeting = theme.isMatureTheme
      ? `Tanti auguri di buon compleanno ${childName}! Buon ${ageYears}esimo compleanno: un nuovo anno ricco di traguardi, sfide e soddisfazioni!`
      : `Tanti auguri di buon compleanno ${childName}! Evviva, oggi festeggiamo i tuoi ${ageYears} anni! Tocca tutte le candeline sulla torta per spegnerle ed esprimere un desiderio!`;

    soundManager.speak(speechGreeting);

    return () => clearTimeout(timer);
  }, [childName, ageYears, theme.isMatureTheme]);

  const handleToggleCandle = (idx: number) => {
    soundManager.playPop();
    setLitCandles((prev) => {
      const next = [...prev];
      next[idx] = false;
      const nowAllDone = next.every((c) => !c);
      if (nowAllDone) {
        confetti.burst();
        soundManager.playFanfare();
        soundManager.speak(
          theme.isMatureTheme
            ? `Fantastico ${childName}! Tutti i traguardi del nuovo anno sono attivi! Ritira il tuo bonus speciale di compleanno!`
            : `Evviva ${childName}! Hai spento tutte le candeline! Tanti auguri di buon compleanno!`
        );
      }
      return next;
    });
  };

  const handleBlowAllCandles = () => {
    soundManager.playFanfare();
    confetti.burst();
    setLitCandles(Array.from({ length: candleCount }, () => false));
    soundManager.speak(
      theme.isMatureTheme
        ? `Auguri ${childName}! Tutti i nodi celebrativi dei tuoi ${ageYears} anni sono accesi!`
        : `Che soffio potente ${childName}! Tutte le candeline si sono spente: buon compleanno!`
    );
  };

  const handleClaim = () => {
    soundManager.playFanfare();
    confetti.burst();
    setGiftClaimedNow(true);
    onClaimBirthdayGift();
  };

  return (
    <div
      className="safe-modal-overlay fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg p-5 sm:p-7 overflow-hidden transition-all ${
          theme.isMatureTheme
            ? 'rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-cyan-400/60 text-white shadow-[0_24px_64px_rgba(6,182,212,0.35)]'
            : 'rounded-[28px] sm:rounded-[34px] bg-gradient-to-b from-amber-50 via-white to-pink-50 border-4 border-amber-300 text-indigo-950 shadow-[0_14px_0_#d97706,0_24px_60px_rgba(0,0,0,0.45)]'
        }`}
      >
        {/* Floating animated celebratory particles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-2 flex justify-around text-xl sm:text-2xl opacity-85 animate-bounce"
        >
          <span>{theme.isMatureTheme ? '✨' : '🎈'}</span>
          <span>🎉</span>
          <span>{theme.isMatureTheme ? '🚀' : '🎂'}</span>
          <span>🎊</span>
          <span>{theme.isMatureTheme ? '⚡' : '🎈'}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi festa di compleanno"
          className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
            theme.isMatureTheme
              ? 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15'
              : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mt-4 text-center">
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-fun font-extrabold uppercase tracking-wider mb-2 ${
              theme.isMatureTheme
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                : 'bg-pink-500 text-white shadow-sm'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>
              {isActualBirthdayToday
                ? 'Oggi è un Giorno Speciale!'
                : 'Celebrazione di Compleanno'}
            </span>
          </div>

          <h2
            className={`${theme.fontHeadingClass} font-black text-2xl sm:text-3xl leading-tight ${
              theme.isMatureTheme ? 'text-white' : 'text-indigo-950'
            }`}
          >
            Buon Compleanno, {childName}!
          </h2>

          <p
            className={`mt-1.5 text-xs sm:text-sm font-semibold leading-relaxed ${
              theme.isMatureTheme ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {theme.isMatureTheme
              ? `Milestone ${ageYears} Anni sbloccata! L'interfaccia e le sfide del tuo ${theme.stageBadge} crescono insieme a te.`
              : `Evviva la nostra ${festeggiatoWord}! Oggi festeggiamo i tuoi meravigliosi ${ageYears} anni!`}
          </p>
        </div>

        {/* INTERACTIVE BIRTHDAY STAGE (Candles for 2-8 yrs, Milestone Crystal Nodes for 9-14 yrs) */}
        <div
          className={`mt-4 rounded-2xl p-4 sm:p-5 text-center border ${
            theme.isMatureTheme
              ? 'bg-slate-950/75 border-indigo-400/35'
              : 'bg-gradient-to-b from-sky-100/80 via-amber-50/70 to-pink-100/70 border-2 border-amber-300'
          }`}
        >
          <p
            className={`text-xs font-fun font-extrabold mb-3 ${
              theme.isMatureTheme ? 'text-cyan-300' : 'text-indigo-900'
            }`}
          >
            {allExtinguished
              ? theme.isMatureTheme
                ? '✨ Tutti i Cristalli Milestone sono stati attivati!'
                : '🎉 Evviva! Tutte le candeline sono spente: desiderio espresso!'
              : theme.isMatureTheme
              ? 'Tocca tutti i Cristalli per attivare il tuo nuovo anno!'
              : 'Tocca le candeline una per una (o soffia con il tasto) per spegnerle!'}
          </p>

          {/* Interactive Candles / Milestone Nodes */}
          <div className="flex items-end justify-center gap-2.5 sm:gap-3.5 py-2 flex-wrap">
            {litCandles.map((isLit, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleToggleCandle(idx)}
                className={`group flex flex-col items-center cursor-pointer transition-transform active:scale-90 ${
                  isLit ? 'hover:scale-110' : 'opacity-80'
                }`}
                aria-label={
                  theme.isMatureTheme
                    ? `Cristallo ${idx + 1}`
                    : `Candelina ${idx + 1}`
                }
              >
                {theme.isMatureTheme ? (
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                      isLit
                        ? 'bg-indigo-950 border-cyan-400 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.45)] animate-pulse'
                        : 'bg-gradient-to-br from-emerald-500 to-cyan-500 border-white text-slate-950 font-black shadow-lg'
                    }`}
                  >
                    {isLit ? <Sparkles className="w-5 h-5" /> : '✓'}
                  </div>
                ) : (
                  <>
                    <span
                      className={`text-xl sm:text-2xl leading-none transition-all ${
                        isLit ? 'animate-bounce' : 'opacity-30 scale-75'
                      }`}
                    >
                      {isLit ? '🔥' : '💨'}
                    </span>
                    <div
                      className={`w-4 sm:w-5 h-10 sm:h-12 rounded-t-md border-2 ${
                        idx % 3 === 0
                          ? 'bg-pink-400 border-pink-600'
                          : idx % 3 === 1
                          ? 'bg-sky-400 border-sky-600'
                          : 'bg-amber-400 border-amber-600'
                      }`}
                    />
                  </>
                )}
              </button>
            ))}
          </div>

          {!theme.isMatureTheme && (
            <div className="mx-auto max-w-[230px] h-10 rounded-b-2xl rounded-t-lg bg-gradient-to-r from-pink-400 via-amber-300 to-pink-400 border-2 border-pink-600 flex items-center justify-center font-kids font-black text-sm text-indigo-950 shadow-md">
              🎂 {ageYears} ANNI DI {childName.toUpperCase()} 🎂
            </div>
          )}

          {!allExtinguished && (
            <button
              type="button"
              onClick={handleBlowAllCandles}
              className={`mt-3 px-4 py-2 rounded-xl font-fun font-extrabold text-xs transition cursor-pointer ${
                theme.isMatureTheme
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200'
                  : 'bg-amber-400 hover:bg-amber-300 text-indigo-950 border-2 border-amber-600 shadow-sm'
              }`}
            >
              {theme.isMatureTheme
                ? '⚡ Attiva Tutti i Cristalli'
                : '💨 Soffia Forte su Tutte le Candeline!'}
            </button>
          )}
        </div>

        {/* BIRTHDAY GIFT BOX (+50 Gems & +25 Stars) */}
        <div
          className={`mt-4 rounded-2xl p-3.5 sm:p-4 border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            theme.isMatureTheme
              ? 'bg-indigo-950/70 border-amber-400/45'
              : 'bg-amber-100/90 border-2 border-amber-400'
          }`}
        >
          <div className="flex items-center gap-3 text-left">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                theme.isMatureTheme
                  ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
                  : 'bg-amber-400 text-indigo-950 border-2 border-amber-600'
              }`}
            >
              {theme.isMatureTheme ? (
                <Award className="w-6 h-6" />
              ) : (
                <Gift className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3
                className={`font-fun font-extrabold text-xs sm:text-sm ${
                  theme.isMatureTheme ? 'text-amber-300' : 'text-indigo-950'
                }`}
              >
                Regalo Speciale di Compleanno
              </h3>
              <p
                className={`text-xs font-semibold ${
                  theme.isMatureTheme ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                +50 Gemme &amp; +25 Stelle Bonus per {childName}!
              </p>
            </div>
          </div>

          {alreadyClaimedGiftThisYear || giftClaimedNow ? (
            <span
              className={`px-3.5 py-2 rounded-xl font-fun font-extrabold text-xs shrink-0 ${
                theme.isMatureTheme
                  ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              ✓ Regalo Ritirato!
            </span>
          ) : (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-fun font-black text-xs sm:text-sm shadow-md cursor-pointer shrink-0"
            >
              🎁 Ritira Regalo!
            </button>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-fun font-extrabold text-sm transition cursor-pointer ${
              theme.isMatureTheme
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 shadow-lg'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-b-4 border-indigo-800'
            }`}
          >
            Continua a Festeggiare!
          </button>
        </div>
      </div>
    </div>
  );
};
