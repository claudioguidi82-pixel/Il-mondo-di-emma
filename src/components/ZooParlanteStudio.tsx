import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Volume2,
  Music,
  VolumeX,
  Play,
  Sparkles,
  Heart,
  HelpCircle,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ChildProfile } from '../types/game';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { getDisplayChildName, getGenderedWord } from '../utils/childProfile';
import arenaMeadowBackdrop from '../assets/images/arena_meadow_backdrop_1795268326885.jpg';
import zooLion3d from '../assets/images/zoo_lion_3d_1795268326883.jpg';
import zooGiraffe3d from '../assets/images/zoo_giraffe_3d_1795268326961.jpg';
import zooElephant3d from '../assets/images/zoo_elephant_3d_1795268327303.jpg';
import cardCamel3d from '../assets/images/card_camel_3d_1795268325780.jpg';
import cardZebra3d from '../assets/images/card_zebra_3d_1795268326180.jpg';

interface ZooParlanteStudioProps {
  childProfile?: ChildProfile;
  onClose: () => void;
}

type AnimalId = 'lion' | 'giraffe' | 'elephant' | 'camel' | 'zebra';

interface TalkingAnimal {
  id: AnimalId;
  name: string;
  shortName: string;
  emoji: string;
  soundLabel: string;
  habitat: string;
  favoriteFood: string;
  portraitSrc: string;
  cardGradient: string;
  shadowColor: string;
  playIconClass: string;
  greetings: string[];
  curiosities: string[];
  cuddlePhrase: string;
  playSound: () => void;
}

const TALKING_ANIMALS: TalkingAnimal[] = [
  {
    id: 'lion',
    name: 'Leone Leo',
    shortName: 'Leone Leo',
    emoji: '🦁',
    soundLabel: 'ROAAAR!',
    habitat: 'Savana dorata',
    favoriteFood: 'Pisolini al sole',
    portraitSrc: zooLion3d,
    cardGradient: 'from-[#ffbe3b] via-[#fb923c] to-[#ea580c]',
    shadowColor: '#b45309',
    playIconClass: 'text-orange-500 fill-orange-500',
    greetings: [
      'Roaaar! Ciao {NAME}! Sono Leo il Leone, il re gentile della savana!',
      'Evviva {NAME}! Il mio ruggito saluta il mio {FRIEND} preferito!',
      'Roaaar! Hai sentito che voce forte, {NAME}? Prova a ruggire piano anche tu!',
    ],
    curiosities: [
      'Lo sapevi? Il ruggito di un leone si può sentire fino a otto chilometri di distanza!',
      'I leoni adorano dormire al sole: possono riposare anche sedici ore al giorno!',
      'I cuccioli di leone nascono con delle piccole macchie sul pelo che poi scompaiono crescendo.',
    ],
    cuddlePhrase: 'Prrr... Grazie {NAME}! Le tue carezze sulla criniera mi fanno fare le fusa come un micione!',
    playSound: () => soundManager.playZooAnimalSound('lion'),
  },
  {
    id: 'giraffe',
    name: 'Giraffa Gina',
    shortName: 'Giraffa Gina',
    emoji: '🦒',
    soundLabel: 'GNAM GNAM!',
    habitat: 'Alberi di acacia',
    favoriteFood: 'Foglioline tenere',
    portraitSrc: zooGiraffe3d,
    cardGradient: 'from-[#84cc16] via-[#22c55e] to-[#15803d]',
    shadowColor: '#166534',
    playIconClass: 'text-emerald-600 fill-emerald-600',
    greetings: [
      'Gnam gnam! Ciao {NAME}! Da quassù vedo tutto il cielo azzurro e il tuo sorriso!',
      'Ciao {NAME}! Col mio collo lungo arrivo fino alle nuvole soffici!',
      'Evviva {NAME}! Vuoi guardare il mondo dall’alto insieme a me?',
    ],
    curiosities: [
      'Lo sapevi? La giraffa è l’animale più alto della Terra, e la sua lingua è viola per proteggersi dal sole!',
      'Nonostante il collo lunghissimo, la giraffa ha solo sette vertebre nel collo, proprio come noi umani!',
      'Ogni giraffa ha macchie uniche sul mantello: non esistono due giraffe con lo stesso disegno!',
    ],
    cuddlePhrase: 'Gnam gnam! Mmm che buone queste foglioline croccanti, grazie {NAME}!',
    playSound: () => soundManager.playZooAnimalSound('giraffe'),
  },
  {
    id: 'elephant',
    name: 'Elefante Elio',
    shortName: 'Elefante Elio',
    emoji: '🐘',
    soundLabel: 'PA-UUUH!',
    habitat: 'Oasi d’acqua fresca',
    favoriteFood: 'Mele e spruzzi d’acqua',
    portraitSrc: zooElephant3d,
    cardGradient: 'from-[#38bdf8] via-[#2563eb] to-[#1d4ed8]',
    shadowColor: '#1e40af',
    playIconClass: 'text-blue-600 fill-blue-600',
    greetings: [
      'Pa-uuuh! Ciao {NAME}! Con la mia proboscide faccio una doccia fresca piena di bollicine!',
      'Barrito felice per te, {NAME}! Le mie grandi orecchie servono anche per farmi vento!',
      'Pa-uuuh! Ricordo sempre tutti i miei amici, e tu sei il mio {FRIEND} del cuore!',
    ],
    curiosities: [
      'Lo sapevi? Gli elefanti hanno una memoria straordinaria e sanno riconoscere i loro amici anche dopo tanti anni!',
      'La proboscide dell’elefante ha più di quarantamila muscoli ed è sia naso sia una mano super precisa!',
      'Gli elefanti comunicano tra loro anche con suoni bassissimi che viaggiano sotto la terra attraverso le zampe!',
    ],
    cuddlePhrase: 'Pa-uuuh! Che bello giocare con l’acqua fresca insieme a te, {NAME}!',
    playSound: () => soundManager.playZooAnimalSound('elephant'),
  },
  {
    id: 'camel',
    name: 'Cammello Camillo',
    shortName: 'Cammello Camillo',
    emoji: '🐪',
    soundLabel: 'BRRR-HUU!',
    habitat: 'Dune dorate del deserto',
    favoriteFood: 'Datteri dolci',
    portraitSrc: cardCamel3d,
    cardGradient: 'from-[#f472b6] via-[#ec4899] to-[#be185d]',
    shadowColor: '#9d174d',
    playIconClass: 'text-pink-600 fill-pink-600',
    greetings: [
      'Brrr-huu! Ciao {NAME}! Sulle dune calde del deserto cammino piano e non mi stanco mai!',
      'Evviva {NAME}! Le mie ciglia lunghissime mi proteggono dalla sabbia dorata!',
      'Ciao {NAME}! Saliresti per un piccolo viaggio tra le stelle del deserto?',
    ],
    curiosities: [
      'Lo sapevi? Nelle gobbe del cammello non c’è acqua, ma una riserva di energia per camminare a lungo!',
      'Il cammello ha tre palpebre e ciglia doppie per tenere gli occhi puliti anche quando soffia il vento!',
      'Le zampe del cammello sono larghe e morbide come cuscini per non affondare nella sabbia soffice!',
    ],
    cuddlePhrase: 'Mmmm! Questi datteri dolci sono deliziosi, sei davvero gentile {NAME}!',
    playSound: () => soundManager.playZooAnimalSound('camel'),
  },
  {
    id: 'zebra',
    name: 'Zebra Zoe',
    shortName: 'Zebra Zoe',
    emoji: '🦓',
    soundLabel: 'HIII-HA!',
    habitat: 'Prati verdi della savana',
    favoriteFood: 'Erba fresca del mattino',
    portraitSrc: cardZebra3d,
    cardGradient: 'from-[#a855f7] via-[#7c3aed] to-[#5b21b6]',
    shadowColor: '#4c1d95',
    playIconClass: 'text-violet-600 fill-violet-600',
    greetings: [
      'Hiii-ha! Ciao {NAME}! Ti piace il mio pigiama magico a strisce bianche e nere?',
      'Evviva {NAME}! Corro veloce sul prato verde e faccio grandi salti di gioia!',
      'Ciao {NAME}! Le mie strisce sono uniche come un’opera d’arte!',
    ],
    curiosities: [
      'Lo sapevi? Le strisce di ogni zebra sono come le impronte digitali: nessuna zebra è uguale a un’altra!',
      'Le zebre vivono in grandi famiglie e si proteggono stando tutte vicine: le strisce insieme creano un’illusione ottica!',
      'Una zebra può correre fino a sessantacinque chilometri all’ora e sa correre a zig-zag!',
    ],
    cuddlePhrase: 'Hiii-ha! Che felicità correre sul prato insieme a te, {NAME}!',
    playSound: () => soundManager.playZooAnimalSound('zebra'),
  },
];

export const ZooParlanteStudio: React.FC<ZooParlanteStudioProps> = ({
  childProfile,
  onClose,
}) => {
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const bravoWord = getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Fantastico');
  const friendWord = getGenderedWord(childGender, 'amica', 'amico', 'amico speciale');

  const [mode, setMode] = useState<'explore' | 'guess'>('explore');
  const [selectedId, setSelectedId] = useState<AnimalId>('lion');
  const [speechBubble, setSpeechBubble] = useState<string>('');
  const [phraseStep, setPhraseStep] = useState<Record<string, number>>({});
  const [curiosityStep, setCuriosityStep] = useState<Record<string, number>>({});
  const [cuddleHearts, setCuddleHearts] = useState<number>(0);
  const [musicOn, setMusicOn] = useState<boolean>(soundManager.musicEnabled);

  // Mini-game "Indovina il Verso" state (100% svago, no test impact)
  const [quizTarget, setQuizTarget] = useState<TalkingAnimal>(TALKING_ANIMALS[0]);
  const [quizSolved, setQuizSolved] = useState<boolean>(false);
  const [quizWrongId, setQuizWrongId] = useState<AnimalId | null>(null);
  const [quizStreak, setQuizStreak] = useState<number>(0);

  const selectedAnimal =
    TALKING_ANIMALS.find((a) => a.id === selectedId) || TALKING_ANIMALS[0];

  const personalize = useCallback(
    (template: string) =>
      template
        .replace(/\{NAME\}/g, childName)
        .replace(/\{FRIEND\}/g, friendWord),
    [childName, friendWord]
  );

  useEffect(() => {
    soundManager.startBackgroundMusic();
    const unsub = soundManager.onMusicChange((enabled) => setMusicOn(enabled));
    const intro = personalize(TALKING_ANIMALS[0].greetings[0]);
    setSpeechBubble(intro);
    const t = setTimeout(() => {
      TALKING_ANIMALS[0].playSound();
      setTimeout(() => soundManager.speakPraise(intro), 460);
    }, 250);
    return () => {
      clearTimeout(t);
      unsub();
      soundManager.stopBackgroundMusic();
      soundManager.stopSpeech();
    };
  }, [personalize]);

  const handleSelectAnimal = (animal: TalkingAnimal) => {
    setSelectedId(animal.id);
    const idx = phraseStep[animal.id] ?? 0;
    const line = personalize(animal.greetings[idx % animal.greetings.length]);
    setPhraseStep((prev) => ({ ...prev, [animal.id]: idx + 1 }));
    setSpeechBubble(line);
    animal.playSound();
    setTimeout(() => {
      soundManager.speakPraise(line);
    }, 450);
  };

  const handleCuriosity = () => {
    const idx = curiosityStep[selectedAnimal.id] ?? 0;
    const fact = selectedAnimal.curiosities[idx % selectedAnimal.curiosities.length];
    setCuriosityStep((prev) => ({ ...prev, [selectedAnimal.id]: idx + 1 }));
    setSpeechBubble(fact);
    soundManager.playTwinkle();
    soundManager.speak(fact);
  };

  const handleCuddle = () => {
    const line = personalize(selectedAnimal.cuddlePhrase);
    setSpeechBubble(line);
    setCuddleHearts((c) => c + 1);
    soundManager.playSuccess();
    confetti.burst();
    soundManager.speakPraise(line);
  };

  const startNewGuessRound = useCallback(
    (excludeId?: AnimalId) => {
      const pool = excludeId
        ? TALKING_ANIMALS.filter((a) => a.id !== excludeId)
        : TALKING_ANIMALS;
      const next = pool[Math.floor(Math.random() * pool.length)] || TALKING_ANIMALS[0];
      setQuizTarget(next);
      setQuizSolved(false);
      setQuizWrongId(null);
      setTimeout(() => {
        next.playSound();
        setTimeout(() => {
          soundManager.speak(`Ascolta bene ${childName}! Quale animale fa questo verso?`);
        }, 520);
      }, 180);
    },
    [childName]
  );

  const handleSwitchMode = (nextMode: 'explore' | 'guess') => {
    soundManager.playPop();
    soundManager.stopSpeech();
    setMode(nextMode);
    if (nextMode === 'guess') {
      startNewGuessRound();
    } else {
      const line = personalize(selectedAnimal.greetings[0]);
      setSpeechBubble(line);
    }
  };

  const handleGuessPick = (animal: TalkingAnimal) => {
    if (quizSolved) return;
    if (animal.id === quizTarget.id) {
      setQuizSolved(true);
      setQuizWrongId(null);
      setQuizStreak((s) => s + 1);
      soundManager.playFanfare();
      confetti.burst();
      soundManager.speakPraise(
        `${bravoWord} ${childName}! Era proprio ${animal.name}! ${animal.soundLabel}`
      );
    } else {
      setQuizWrongId(animal.id);
      soundManager.playEncouragement();
      soundManager.speak(`Quasi! Riascolta il verso e riprova con calma!`);
      setTimeout(() => {
        quizTarget.playSound();
      }, 950);
    }
  };

  return (
    <div className="safe-viewport-pad relative w-full h-full flex flex-col justify-between overflow-hidden select-none">
      {/* FULL-BLEED PIXAR 3D STORYBOOK SUNNY MEADOW BACKDROP */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <img
          src={arenaMeadowBackdrop}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-[1.01]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(14, 165, 233, 0.14) 0%, rgba(255, 255, 255, 0.04) 48%, rgba(22, 101, 52, 0.16) 100%)',
          }}
        />
      </div>

      {/* GLOSSY 3D BUBBLE TOP NAVIGATION BAR */}
      <header className="landscape-header-compact app-shell-container relative z-10 flex items-center justify-between px-2.5 sm:px-5 lg:px-8 pt-2 sm:pt-3 pb-1 shrink-0 gap-2">
        <button
          onClick={() => {
            soundManager.stopSpeech();
            soundManager.playPop();
            onClose();
          }}
          className="glossy-bubble-btn bg-gradient-to-b from-white to-slate-100 text-slate-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-white flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[38px] sm:min-h-[42px]"
        >
          <Home className="w-4 h-4 text-blue-700 fill-blue-700 shrink-0" />
          <span className="font-fun font-extrabold text-xs sm:text-sm text-slate-900 whitespace-nowrap">
            Home
          </span>
        </button>

        {/* Hanging Carved Honey-Oak Wooden Zoo Signboard */}
        <div className="storybook-wood-sign rounded-2xl px-3.5 sm:px-5 py-1.5 inline-flex items-center gap-2">
          <span className="text-base sm:text-lg leading-none">🐾</span>
          <span className="font-kids font-bold text-sm sm:text-lg text-[#4a2206] tracking-tight whitespace-nowrap">
            Zoo Parlante
          </span>
          <span className="text-base sm:text-lg leading-none">🐾</span>
        </div>

        <button
          onClick={() => {
            const next = soundManager.toggleMusic();
            setMusicOn(next);
          }}
          title={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
          className={`glossy-bubble-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center cursor-pointer shrink-0 ${
            musicOn
              ? 'bg-gradient-to-b from-fuchsia-400 to-purple-600 text-white border-white/90'
              : 'bg-gradient-to-b from-white to-slate-100 text-slate-600 border-white'
          }`}
        >
          {musicOn ? <Music className="w-4 h-4 stroke-[2.6]" /> : <VolumeX className="w-4 h-4 stroke-[2.6]" />}
        </button>
      </header>

      {/* CARVED WOOD MODE SWITCHER (ESPLORA vs INDOVINA IL VERSO) */}
      <div className="app-shell-container relative z-10 px-2.5 sm:px-5 lg:px-8 pt-1 pb-1 shrink-0">
        <div className="storybook-wood-shelf rounded-2xl p-1.5 grid grid-cols-2 gap-1.5 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => handleSwitchMode('explore')}
            className={`py-2 px-3 rounded-xl font-kids font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              mode === 'explore'
                ? 'bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-400 text-[#422006] border-2 border-white shadow-sm'
                : 'bg-amber-950/35 text-amber-50 hover:bg-amber-950/45'
            }`}
          >
            <span>🦁</span>
            <span>Esplora gli Animali</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('guess')}
            className={`py-2 px-3 rounded-xl font-kids font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              mode === 'guess'
                ? 'bg-gradient-to-b from-emerald-300 via-green-400 to-emerald-500 text-white border-2 border-white shadow-sm'
                : 'bg-amber-950/35 text-amber-50 hover:bg-amber-950/45'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Indovina il Verso</span>
          </button>
        </div>
      </div>

      {/* MAIN ZOO PARLANTE STAGE */}
      <main className="app-shell-container relative z-10 flex-1 flex flex-col justify-start sm:justify-center px-2.5 sm:px-5 lg:px-8 py-1.5 w-full min-h-0 gap-2.5 overflow-y-auto">
        {mode === 'explore' ? (
          <>
            {/* CARVED WOOD & CREAM PARCHMENT SPOTLIGHT BOARD FOR SELECTED ANIMAL */}
            <section className="storybook-parchment-board rounded-[28px] p-3.5 sm:p-5 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 max-w-3xl mx-auto w-full shrink-0">
              {/* Large Pixar 3D Animal Portrait Frame */}
              <div className="relative shrink-0">
                <div
                  className={`w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-b ${selectedAnimal.cardGradient}`}
                >
                  <img
                    src={selectedAnimal.portraitSrc}
                    alt={selectedAnimal.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-200 font-fun font-extrabold text-[10px] sm:text-xs whitespace-nowrap border-2 border-amber-300 shadow-md">
                  {selectedAnimal.soundLabel}
                </span>
              </div>

              {/* Speech Bubble & Playful Actions */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="font-kids font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
                    {selectedAnimal.emoji} {selectedAnimal.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-fun font-bold">
                    🌿 {selectedAnimal.habitat}
                  </span>
                </div>

                <div className="mt-2 storybook-tray-3d rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
                  “{speechBubble}”
                </div>

                {/* 3 Interactive Fun Buttons */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAnimal(selectedAnimal)}
                    className="home-wood-outer rounded-2xl p-[3px] cursor-pointer"
                  >
                    <span className="home-inner-orange rounded-[13px] py-2 px-2 flex items-center justify-center gap-1 text-white font-fun font-extrabold text-[11px] sm:text-xs">
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Verso</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCuriosity}
                    className="home-wood-outer rounded-2xl p-[3px] cursor-pointer"
                  >
                    <span className="home-inner-teal rounded-[13px] py-2 px-2 flex items-center justify-center gap-1 text-white font-fun font-extrabold text-[11px] sm:text-xs">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200" />
                      <span>Curiosità</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCuddle}
                    className="home-lavender-outer rounded-2xl p-[3px] cursor-pointer"
                  >
                    <span className="home-inner-purple rounded-[13px] py-2 px-2 flex items-center justify-center gap-1 text-white font-fun font-extrabold text-[11px] sm:text-xs">
                      <Heart className="w-3.5 h-3.5 shrink-0 fill-pink-200 text-pink-200" />
                      <span>Coccole</span>
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* CARVED WOODEN SHELF HOLDING ALL 5 PIXAR 3D ANIMAL CARDS (ZERO TRUNCATION) */}
            <section className="storybook-wood-shelf rounded-3xl p-2.5 sm:p-3 max-w-3xl mx-auto w-full shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {TALKING_ANIMALS.map((animal, idx) => {
                  const isActive = animal.id === selectedAnimal.id;
                  const isLastOdd = idx === TALKING_ANIMALS.length - 1;
                  return (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => handleSelectAnimal(animal)}
                      style={{
                        boxShadow: `0 5px 0 ${animal.shadowColor}, 0 12px 20px -4px rgba(15, 23, 42, 0.35)`,
                      }}
                      className={`zoo-3d-card bg-gradient-to-b ${animal.cardGradient} flex flex-col text-left cursor-pointer ${
                        isLastOdd ? 'col-span-2 sm:col-span-1 w-[62%] sm:w-full mx-auto' : 'w-full'
                      } ${isActive ? 'ring-4 ring-yellow-200 scale-[1.02]' : ''}`}
                    >
                      <div className="relative w-full h-22 sm:h-24 overflow-hidden">
                        <img
                          src={animal.portraitSrc}
                          alt={animal.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/35 to-transparent" />
                        <span className="storybook-play-dot absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center">
                          <Play className={`w-3 h-3 ml-0.5 ${animal.playIconClass}`} />
                        </span>
                      </div>
                      <div className="px-2 py-1.5 text-center leading-tight">
                        <span className="block text-[9.5px] font-extrabold uppercase tracking-wide text-white/95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                          {animal.soundLabel}
                        </span>
                        <span className="block font-kids font-bold text-xs sm:text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] mt-0.5">
                          {animal.shortName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          /* FUN ZERO-PRESSURE MINI-GAME: "INDOVINA IL VERSO!" */
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
            <section className="storybook-parchment-board rounded-[28px] p-4 sm:p-5 text-center">
              <p className="text-xs font-fun font-extrabold uppercase tracking-wider text-indigo-700">
                🎵 Gioco di Svago · Serie: {quizStreak} ⭐
              </p>
              <h2 className="font-kids font-bold text-lg sm:text-2xl text-slate-900 mt-1">
                {quizSolved
                  ? `🎉 ${bravoWord} ${childName}! È ${quizTarget.name}!`
                  : 'Ascolta il verso: quale animale sta parlando?'}
              </h2>

              <div className="mt-3 flex items-center justify-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => quizTarget.playSound()}
                  className="home-wood-outer rounded-2xl p-[3.5px] cursor-pointer"
                >
                  <span className="home-inner-orange rounded-[13px] px-4 py-2 inline-flex items-center gap-2 text-white font-kids font-bold text-sm">
                    <Volume2 className="w-4 h-4 shrink-0" />
                    <span>Riascolta il Verso!</span>
                  </span>
                </button>

                {quizSolved && (
                  <button
                    type="button"
                    onClick={() => startNewGuessRound(quizTarget.id)}
                    className="home-wood-outer rounded-2xl p-[3.5px] cursor-pointer"
                  >
                    <span className="home-inner-green rounded-[13px] px-4 py-2 inline-flex items-center gap-2 text-white font-kids font-bold text-sm">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>Prossimo Verso</span>
                    </span>
                  </button>
                )}
              </div>
            </section>

            <section className="storybook-wood-shelf rounded-3xl p-2.5 sm:p-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {TALKING_ANIMALS.map((animal, idx) => {
                  const isWinner = quizSolved && animal.id === quizTarget.id;
                  const isWrong = quizWrongId === animal.id;
                  const isLastOdd = idx === TALKING_ANIMALS.length - 1;
                  return (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => handleGuessPick(animal)}
                      style={{
                        boxShadow: `0 5px 0 ${animal.shadowColor}, 0 12px 20px -4px rgba(15, 23, 42, 0.35)`,
                      }}
                      className={`zoo-3d-card bg-gradient-to-b ${animal.cardGradient} flex flex-col text-left cursor-pointer ${
                        isLastOdd ? 'col-span-2 sm:col-span-1 w-[62%] sm:w-full mx-auto' : 'w-full'
                      } ${
                        isWinner
                          ? 'ring-4 ring-emerald-300 scale-[1.03]'
                          : isWrong
                          ? 'opacity-50 grayscale scale-95'
                          : ''
                      }`}
                    >
                      <div className="relative w-full h-22 sm:h-24 overflow-hidden">
                        <img
                          src={animal.portraitSrc}
                          alt={animal.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                        {isWinner && (
                          <span className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="px-2 py-1.5 text-center leading-tight">
                        <span className="block font-kids font-bold text-xs sm:text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                          {animal.shortName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* WARM CREAM PARCHMENT FOOTER */}
      <footer className="landscape-footer-compact app-shell-container relative z-10 px-2.5 sm:px-5 lg:px-8 pb-2 sm:pb-3 w-full shrink-0">
        <div className="storybook-footer-pill rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 max-w-3xl mx-auto">
          <span className="text-xs sm:text-sm font-fun font-extrabold text-amber-950">
            🐾 Spazio Svago · Ascolta i versi e scopri le curiosità della natura
          </span>
          {cuddleHearts > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-fun font-extrabold text-xs whitespace-nowrap shrink-0">
              💖 {cuddleHearts}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};
