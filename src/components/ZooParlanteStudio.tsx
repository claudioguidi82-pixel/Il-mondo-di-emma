import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import {
  calculateChildAge,
  getDisplayChildName,
  getGenderedWord,
} from '../utils/childProfile';
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

type AnimalId =
  | 'dog'
  | 'cat'
  | 'cow'
  | 'sheep'
  | 'rooster'
  | 'duck'
  | 'pig'
  | 'frog'
  | 'lion'
  | 'elephant'
  | 'giraffe'
  | 'zebra'
  | 'camel'
  | 'owl';

type HabitatTab = 'farm' | 'savanna';

interface TalkingAnimal {
  id: AnimalId;
  tab: HabitatTab;
  name: string;
  shortName: string;
  emoji: string;
  soundLabel: string;
  habitat: string;
  portraitSrc?: string;
  stageSkyGradient: string;
  stageHillColor: string;
  cardGradient: string;
  shadowColor: string;
  playIconClass: string;
  greetings: string[];
  curiosities: string[];
  cuddlePhrase: string;
}

const TALKING_ANIMALS: TalkingAnimal[] = [
  // =========================================================================
  // TAB 1: FATTORIA & BOSCO (8 animali amatissimi dai 2 anni in su)
  // =========================================================================
  {
    id: 'dog',
    tab: 'farm',
    name: 'Cane Fido',
    shortName: 'Cane Fido',
    emoji: '🐶',
    soundLabel: 'BAU BAU!',
    habitat: 'Prato della fattoria',
    stageSkyGradient: 'from-sky-200 via-amber-50 to-emerald-200',
    stageHillColor: '#22c55e',
    cardGradient: 'from-[#f59e0b] via-[#ea580c] to-[#c2410c]',
    shadowColor: '#9a3412',
    playIconClass: 'text-orange-600 fill-orange-600',
    greetings: [
      'Bau bau! Sono Fido il cagnolino e muovo la coda quando sei qui!',
      'Bau bau! Vuoi rincorrere una pallina colorata sul prato insieme a me?',
      'Bau! Ho un fiuto super e sento subito profumo di gioco e amicizia!',
    ],
    curiosities: [
      'Lo sapevi? I cani riconoscono tantissimi profumi diversi con il loro tartufo umido!',
      'Quando un cane scodinzola tutto contento, sta dicendo che è felice di vederti!',
      'I cuccioli adorano giocare a nascondino e imparano subito a riconoscere la tua voce!',
    ],
    cuddlePhrase: 'Bau bau! Che belle carezze dietro le orecchie, scodinzolo fortissimo!',
  },
  {
    id: 'cat',
    tab: 'farm',
    name: 'Gatto Micio',
    shortName: 'Gatto Micio',
    emoji: '🐱',
    soundLabel: 'MIAO!',
    habitat: 'Cuscino al sole',
    stageSkyGradient: 'from-rose-100 via-amber-50 to-orange-100',
    stageHillColor: '#fb923c',
    cardGradient: 'from-[#fb7185] via-[#ec4899] to-[#be185d]',
    shadowColor: '#9d174d',
    playIconClass: 'text-pink-600 fill-pink-600',
    greetings: [
      'Miao! Sono Micio il gattino morbido, pronto a fare le fusa!',
      'Miaooo! Mi piace inseguire i gomitoli di lana e fare grandi salti soffici!',
      'Miao! Con le mie zampine leggere cammino senza fare alcun rumore!',
    ],
    curiosities: [
      'Lo sapevi? Le fusa del gatto sono un suono calmo che rilassa sia i gatti sia gli umani!',
      'I baffi del gatto si chiamano vibrisse e lo aiutano a capire se passa negli spazi stretti!',
      'I gatti vedono molto bene anche quando la luce è bassa, come al tramonto!',
    ],
    cuddlePhrase: 'Prrr... miao! Queste coccole sul musetto sono dolcissime!',
  },
  {
    id: 'cow',
    tab: 'farm',
    name: 'Mucca Bella',
    shortName: 'Mucca Bella',
    emoji: '🐄',
    soundLabel: 'MUUU!',
    habitat: 'Pascolo verde',
    stageSkyGradient: 'from-sky-200 via-lime-50 to-emerald-200',
    stageHillColor: '#16a34a',
    cardGradient: 'from-[#34d399] via-[#10b981] to-[#047857]',
    shadowColor: '#065f46',
    playIconClass: 'text-emerald-600 fill-emerald-600',
    greetings: [
      'Muuu! Ciao! Sono Bella la mucca a macchie e mangio tanta erba fresca!',
      'Muuuu! Con il mio latte buono si fanno il formaggio e il gelato!',
      'Muuu! Senti il campanellino al mio collo mentre passeggio sul prato?',
    ],
    curiosities: [
      'Lo sapevi? Ogni mucca ha macchie bianche e nere diverse, proprio come un disegno unico!',
      'Le mucche hanno ottimi amici nel pascolo e amano stare sempre vicino alle compagne preferite!',
      'Una mucca ha una vista quasi a trecentosessanta gradi per controllare tutto il prato!',
    ],
    cuddlePhrase: 'Muuu! Grazie per la carezza e per questo bel mazzolino di margherite!',
  },
  {
    id: 'sheep',
    tab: 'farm',
    name: 'Pecora Nuvola',
    shortName: 'Pecora Nuvola',
    emoji: '🐑',
    soundLabel: 'BEEE!',
    habitat: 'Colline fiorite',
    stageSkyGradient: 'from-sky-100 via-white to-lime-200',
    stageHillColor: '#4ade80',
    cardGradient: 'from-[#38bdf8] via-[#0ea5e9] to-[#0369a1]',
    shadowColor: '#075985',
    playIconClass: 'text-sky-600 fill-sky-600',
    greetings: [
      'Beee! Sono Nuvola la pecorella, soffice proprio come una nuvoletta!',
      'Beee beee! Saltello leggera sulle colline verdi piene di fiorellini!',
      'Beee! La mia lana morbida tiene al calduccio in inverno!',
    ],
    curiosities: [
      'Lo sapevi? Le pecore hanno una memoria fantastica e riconoscono fino a cinquanta volti diversi!',
      'Il mantello della pecora è morbido e ricciolino come un maglione naturale!',
      'Gli agnellini riconoscono la voce della loro mamma fin dal primissimo giorno!',
    ],
    cuddlePhrase: 'Beee! Che bello farsi accarezzare i riccioli morbidi!',
  },
  {
    id: 'rooster',
    tab: 'farm',
    name: 'Gallo Chicco',
    shortName: 'Gallo Chicco',
    emoji: '🐓',
    soundLabel: 'CHICCHIRICHÌ!',
    habitat: 'Aia del mattino',
    stageSkyGradient: 'from-amber-200 via-yellow-100 to-orange-200',
    stageHillColor: '#d97706',
    cardGradient: 'from-[#ef4444] via-[#dc2626] to-[#991b1b]',
    shadowColor: '#7f1d1d',
    playIconClass: 'text-red-600 fill-red-600',
    greetings: [
      'Chicchirichì! Buongiorno! Sono Chicco il gallo e sveglio tutta la fattoria!',
      'Chicchirichì! Quando sorge il sole canto forte dal mio steccato!',
      'Chicchirichì! Guarda le mie piume colorate che brillano al sole!',
    ],
    curiosities: [
      'Lo sapevi? Il gallo ha un orologio naturale dentro di sé e capisce quando sta per arrivare l’alba!',
      'La cresta rossa sulla testa del gallo lo aiuta a rinfrescarsi nelle giornate calde!',
      'I galli usano tanti suoni diversi per avvisare le galline quando trovano semini gustosi!',
    ],
    cuddlePhrase: 'Chicchirichì! Grazie per questi semini croccanti di mais!',
  },
  {
    id: 'duck',
    tab: 'farm',
    name: 'Anatra Pina',
    shortName: 'Anatra Pina',
    emoji: '🦆',
    soundLabel: 'QUA QUA!',
    habitat: 'Laghetto azzurro',
    stageSkyGradient: 'from-cyan-100 via-sky-200 to-blue-300',
    stageHillColor: '#0284c7',
    cardGradient: 'from-[#06b6d4] via-[#0284c7] to-[#1d4ed8]',
    shadowColor: '#1e3a8a',
    playIconClass: 'text-cyan-600 fill-cyan-600',
    greetings: [
      'Qua qua! Sono Pina l’anatra e nuoto felice nel laghetto azzurro!',
      'Qua qua qua! Con le mie zampe a pinna scivolo sull’acqua come una barchetta!',
      'Qua qua! Vuoi fare uno spruzzo allegro insieme a me?',
    ],
    curiosities: [
      'Lo sapevi? Le piume delle anatre sono impermeabili, così restano sempre asciutte anche sott’acqua!',
      'Gli anatroccoli nuotano in fila indiana dietro la mamma per scivolare sulle onde senza fatica!',
      'Le anatre possono sia nuotare benissimo sia volare alte nel cielo!',
    ],
    cuddlePhrase: 'Qua qua! Splash! Che divertimento giocare vicino al laghetto!',
  },
  {
    id: 'pig',
    tab: 'farm',
    name: 'Maialino Poldo',
    shortName: 'Maialino Poldo',
    emoji: '🐷',
    soundLabel: 'OINK OINK!',
    habitat: 'Orto soleggiato',
    stageSkyGradient: 'from-pink-100 via-rose-50 to-amber-100',
    stageHillColor: '#f472b6',
    cardGradient: 'from-[#f472b6] via-[#e879f9] to-[#a855f7]',
    shadowColor: '#7e22ce',
    playIconClass: 'text-fuchsia-600 fill-fuchsia-600',
    greetings: [
      'Oink oink! Sono Poldo il maialino rosa con la codina a ricciolo!',
      'Oink oink! Mi piace tantissimo mangiare mele dolci e rotolarmi nel fresco!',
      'Oink! Senti che grugnito simpatico che faccio con il mio nasino!',
    ],
    curiosities: [
      'Lo sapevi? I maialini sono tra gli animali più intelligenti e curiosi di tutta la fattoria!',
      'I maiali amano il fango fresco in estate perché li protegge dal sole come una crema!',
      'I maialini comunicano tra loro con più di venti versi diversi!',
    ],
    cuddlePhrase: 'Oink oink! Mmm che mela croccante, mi fai ridere il nasino!',
  },
  {
    id: 'frog',
    tab: 'farm',
    name: 'Rana Rina',
    shortName: 'Rana Rina',
    emoji: '🐸',
    soundLabel: 'CRA CRA!',
    habitat: 'Ninfee dello stagno',
    stageSkyGradient: 'from-lime-100 via-emerald-100 to-teal-200',
    stageHillColor: '#15803d',
    cardGradient: 'from-[#84cc16] via-[#22c55e] to-[#15803d]',
    shadowColor: '#14532d',
    playIconClass: 'text-green-600 fill-green-600',
    greetings: [
      'Cra cra! Sono Rina la ranocchia verde e salto da una ninfea all’altra!',
      'Cra cra! Prova a fare un bel salto in alto proprio come me!',
      'Cra! La sera canto in coro con tutte le mie amiche dello stagno!',
    ],
    curiosities: [
      'Lo sapevi? Una rana può saltare fino a venti volte la lunghezza del suo piccolo corpo!',
      'Le rane non bevono con la bocca ma assorbono l’acqua fresca attraverso la pelle!',
      'Prima di diventare rane, i piccoli si chiamano girini e nuotano con la coda!',
    ],
    cuddlePhrase: 'Cra cra! Boing! Un salto di gioia tutto per te!',
  },

  // =========================================================================
  // TAB 2: SAVANA & NATURA (6 animali iconici con ritratti 3D)
  // =========================================================================
  {
    id: 'lion',
    tab: 'savanna',
    name: 'Leone Leo',
    shortName: 'Leone Leo',
    emoji: '🦁',
    soundLabel: 'ROAAAR!',
    habitat: 'Savana dorata',
    portraitSrc: zooLion3d,
    stageSkyGradient: 'from-amber-200 via-orange-100 to-yellow-200',
    stageHillColor: '#d97706',
    cardGradient: 'from-[#ffbe3b] via-[#fb923c] to-[#ea580c]',
    shadowColor: '#b45309',
    playIconClass: 'text-orange-500 fill-orange-500',
    greetings: [
      'Roaaar! Sono Leo il Leone, il re gentile della savana dorata!',
      'Roaaar! Hai sentito che voce forte? Prova a ruggire piano anche tu!',
      'Roaaar! Adoro fare pisolini al sole e salutare gli amici coraggiosi!',
    ],
    curiosities: [
      'Lo sapevi? Il ruggito di un leone si può sentire fino a otto chilometri di distanza!',
      'I leoni adorano dormire al sole: possono riposare anche sedici ore al giorno!',
      'I cuccioli di leone nascono con delle piccole macchie sul pelo che poi scompaiono crescendo.',
    ],
    cuddlePhrase: 'Prrr... Le tue carezze sulla criniera mi fanno fare le fusa come un micione!',
  },
  {
    id: 'elephant',
    tab: 'savanna',
    name: 'Elefante Elio',
    shortName: 'Elefante Elio',
    emoji: '🐘',
    soundLabel: 'PA-UUUH!',
    habitat: 'Oasi d’acqua fresca',
    portraitSrc: zooElephant3d,
    stageSkyGradient: 'from-sky-200 via-cyan-100 to-blue-200',
    stageHillColor: '#0284c7',
    cardGradient: 'from-[#38bdf8] via-[#2563eb] to-[#1d4ed8]',
    shadowColor: '#1e40af',
    playIconClass: 'text-blue-600 fill-blue-600',
    greetings: [
      'Pa-uuuh! Con la mia proboscide faccio una doccia fresca piena di bollicine!',
      'Pa-uuuh! Le mie grandi orecchie servono anche per farmi vento quando fa caldo!',
      'Pa-uuuh! Ricordo sempre tutti i miei amici del cuore!',
    ],
    curiosities: [
      'Lo sapevi? Gli elefanti hanno una memoria straordinaria e riconoscono gli amici anche dopo tanti anni!',
      'La proboscide dell’elefante ha più di quarantamila muscoli ed è sia naso sia una mano precisa!',
      'Gli elefanti sentono le vibrazioni lontane persino attraverso le zampe!',
    ],
    cuddlePhrase: 'Pa-uuuh! Che bello giocare con gli spruzzi d’acqua fresca!',
  },
  {
    id: 'giraffe',
    tab: 'savanna',
    name: 'Giraffa Gina',
    shortName: 'Giraffa Gina',
    emoji: '🦒',
    soundLabel: 'GNAM GNAM!',
    habitat: 'Alberi di acacia',
    portraitSrc: zooGiraffe3d,
    stageSkyGradient: 'from-lime-100 via-amber-50 to-emerald-200',
    stageHillColor: '#16a34a',
    cardGradient: 'from-[#84cc16] via-[#22c55e] to-[#15803d]',
    shadowColor: '#166534',
    playIconClass: 'text-emerald-600 fill-emerald-600',
    greetings: [
      'Gnam gnam! Da quassù vedo tutto il cielo azzurro e il tuo sorriso!',
      'Col mio collo lungo arrivo fino alle foglioline più tenere in cima agli alberi!',
      'Vuoi guardare il mondo dall’alto insieme a me?',
    ],
    curiosities: [
      'Lo sapevi? La giraffa è l’animale più alto della Terra, e la sua lingua è viola per proteggersi dal sole!',
      'Nonostante il collo lunghissimo, la giraffa ha solo sette vertebre nel collo, proprio come noi!',
      'Ogni giraffa ha macchie uniche sul mantello: non ne esistono due uguali!',
    ],
    cuddlePhrase: 'Gnam gnam! Mmm che buone queste foglioline croccanti!',
  },
  {
    id: 'zebra',
    tab: 'savanna',
    name: 'Zebra Zoe',
    shortName: 'Zebra Zoe',
    emoji: '🦓',
    soundLabel: 'HIII-HA!',
    habitat: 'Prati della savana',
    portraitSrc: cardZebra3d,
    stageSkyGradient: 'from-violet-100 via-fuchsia-50 to-indigo-200',
    stageHillColor: '#7c3aed',
    cardGradient: 'from-[#a855f7] via-[#7c3aed] to-[#5b21b6]',
    shadowColor: '#4c1d95',
    playIconClass: 'text-violet-600 fill-violet-600',
    greetings: [
      'Hiii-ha! Ti piace il mio pigiama magico a strisce bianche e nere?',
      'Corro veloce sul prato verde e faccio grandi salti di gioia!',
      'Le mie strisce sono uniche proprio come un’opera d’arte!',
    ],
    curiosities: [
      'Lo sapevi? Le strisce di ogni zebra sono come impronte digitali: nessuna zebra è uguale a un’altra!',
      'Le zebre vivono in grandi famiglie e si proteggono stando tutte vicine!',
      'Una zebra può correre fino a sessantacinque chilometri all’ora e sa correre a zig-zag!',
    ],
    cuddlePhrase: 'Hiii-ha! Che felicità correre sul prato insieme!',
  },
  {
    id: 'camel',
    tab: 'savanna',
    name: 'Cammello Camillo',
    shortName: 'Cammello',
    emoji: '🐪',
    soundLabel: 'BRRR-HUU!',
    habitat: 'Dune del deserto',
    portraitSrc: cardCamel3d,
    stageSkyGradient: 'from-amber-100 via-orange-100 to-rose-100',
    stageHillColor: '#ea580c',
    cardGradient: 'from-[#f472b6] via-[#ec4899] to-[#be185d]',
    shadowColor: '#9d174d',
    playIconClass: 'text-pink-600 fill-pink-600',
    greetings: [
      'Brrr-huu! Sulle dune calde del deserto cammino piano e non mi stanco mai!',
      'Le mie ciglia lunghissime mi proteggono dalla sabbia dorata!',
      'Saliresti per un piccolo viaggio tra le stelle del deserto?',
    ],
    curiosities: [
      'Lo sapevi? Nelle gobbe del cammello non c’è acqua, ma una riserva di energia per camminare a lungo!',
      'Il cammello ha tre palpebre e ciglia doppie per tenere gli occhi puliti anche nel vento!',
      'Le zampe del cammello sono larghe e morbide come cuscini per non affondare nella sabbia!',
    ],
    cuddlePhrase: 'Mmmm! Questi datteri dolci sono deliziosi!',
  },
  {
    id: 'owl',
    tab: 'savanna',
    name: 'Gufo Barnaba',
    shortName: 'Gufo Barnaba',
    emoji: '🦉',
    soundLabel: 'HUU-HUU!',
    habitat: 'Quercia stellata',
    stageSkyGradient: 'from-indigo-900 via-violet-800 to-slate-900',
    stageHillColor: '#312e81',
    cardGradient: 'from-[#6366f1] via-[#4f46e5] to-[#312e81]',
    shadowColor: '#1e1b4b',
    playIconClass: 'text-indigo-600 fill-indigo-600',
    greetings: [
      'Huu-huu! Sono Barnaba il gufo saggio e guardo le stelle dal mio ramo!',
      'Huu-huu! Le mie piume morbide mi fanno volare in completo silenzio!',
      'Huu-huu! Con i miei grandi occhi vedo brillare anche la luna più lontana!',
    ],
    curiosities: [
      'Lo sapevi? Il gufo può girare la testa quasi tutto intorno senza muovere il corpo!',
      'Le ali del gufo hanno bordi soffici che eliminano il rumore dell’aria mentre vola!',
      'I gufi hanno un udito finissimo per ascoltare tutti i suoni notturni del bosco!',
    ],
    cuddlePhrase: 'Huu-huu! Che bel saluto gentile sotto le stelle!',
  },
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const AnimalPortraitVisual: React.FC<{
  animal: TalkingAnimal;
  size?: 'spotlight' | 'card';
  isPlaying?: boolean;
}> = ({ animal, size = 'card', isPlaying = false }) => {
  if (animal.portraitSrc) {
    return (
      <img
        src={animal.portraitSrc}
        alt={animal.name}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover object-top transition-transform duration-300 ${
          isPlaying ? 'scale-108' : ''
        }`}
      />
    );
  }

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-b ${animal.stageSkyGradient} flex items-center justify-center overflow-hidden`}
    >
      {/* Decorative soft sun / moon & hill */}
      <div
        className={`pointer-events-none absolute top-2 right-2.5 rounded-full ${
          animal.id === 'owl'
            ? 'w-6 h-6 bg-amber-200/90 shadow-[0_0_12px_rgba(253,230,138,0.85)]'
            : 'w-7 h-7 bg-yellow-200/85 blur-[1px]'
        }`}
      />
      <div
        className="pointer-events-none absolute -bottom-5 -left-4 w-[130%] h-12 rounded-[100%] opacity-80"
        style={{ backgroundColor: animal.stageHillColor }}
      />
      <span
        className={`relative z-10 leading-none select-none drop-shadow-[0_6px_8px_rgba(15,23,42,0.3)] transition-transform duration-200 ${
          size === 'spotlight'
            ? 'text-[66px] sm:text-[82px]'
            : 'text-[46px] sm:text-[54px]'
        } ${isPlaying ? 'scale-115 -rotate-3' : ''}`}
      >
        {animal.emoji}
      </span>
    </div>
  );
};

export const ZooParlanteStudio: React.FC<ZooParlanteStudioProps> = ({
  childProfile,
  onClose,
}) => {
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const ageInfo = useMemo(
    () => calculateChildAge(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const bravoWord = getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Fantastico');

  const [mode, setMode] = useState<'explore' | 'guess'>('explore');
  const [habitatTab, setHabitatTab] = useState<HabitatTab>('farm');
  const [selectedId, setSelectedId] = useState<AnimalId>('dog');
  const [speechBubble, setSpeechBubble] = useState<string>(
    TALKING_ANIMALS[0].greetings[0]
  );
  const [phraseStep, setPhraseStep] = useState<Record<string, number>>({});
  const [curiosityStep, setCuriosityStep] = useState<Record<string, number>>({});
  const [cuddleHearts, setCuddleHearts] = useState<number>(0);
  const [musicOn, setMusicOn] = useState<boolean>(soundManager.musicEnabled);
  const [soundOn, setSoundOn] = useState<boolean>(soundManager.soundEnabled);
  const [playingAnimalId, setPlayingAnimalId] = useState<string | null>(
    soundManager.isAnimalSoundPlaying ? soundManager.activeAnimalSoundId : null
  );

  // Mini-game "Indovina il Verso" state (100% svago, randomized options, zero test impact)
  const [quizOptions, setQuizOptions] = useState<TalkingAnimal[]>(() =>
    shuffleArray(TALKING_ANIMALS.slice(0, 8)).slice(0, ageInfo.years <= 3 ? 3 : 4)
  );
  const [quizTarget, setQuizTarget] = useState<TalkingAnimal>(TALKING_ANIMALS[0]);
  const [quizSolved, setQuizSolved] = useState<boolean>(false);
  const [quizWrongIds, setQuizWrongIds] = useState<AnimalId[]>([]);
  const [quizStreak, setQuizStreak] = useState<number>(0);

  const isMountedRef = useRef(true);

  const tabAnimals = useMemo(
    () => TALKING_ANIMALS.filter((a) => a.tab === habitatTab),
    [habitatTab]
  );

  const selectedAnimal = useMemo(
    () => TALKING_ANIMALS.find((a) => a.id === selectedId) || TALKING_ANIMALS[0],
    [selectedId]
  );

  // Subscribe to music & live animal sound playing state
  useEffect(() => {
    isMountedRef.current = true;
    soundManager.startBackgroundMusic();
    const unsubMusic = soundManager.onMusicChange((enabled) => setMusicOn(enabled));
    const unsubAnimal = soundManager.onAnimalSoundChange((isPlaying, animalId) => {
      setPlayingAnimalId(isPlaying ? animalId : null);
    });

    // Pre-warm initial animal sounds
    TALKING_ANIMALS.slice(0, 6).forEach((a) => soundManager.prewarmAnimalSound(a.id));

    return () => {
      isMountedRef.current = false;
      unsubMusic();
      unsubAnimal();
      soundManager.stopAnimalSound();
      soundManager.stopBackgroundMusic();
      soundManager.stopSpeech();
    };
  }, []);

  // Pre-warm all animals in the currently selected habitat tab
  useEffect(() => {
    tabAnimals.forEach((a) => soundManager.prewarmAnimalSound(a.id));
  }, [tabAnimals]);

  // Sound-only trigger (no narration overlapping the animal call!)
  const handlePlaySoundOnly = useCallback((animal: TalkingAnimal) => {
    soundManager.unlockAudio();
    if (!soundManager.soundEnabled) {
      soundManager.soundEnabled = true;
      setSoundOn(true);
    }
    soundManager.playAnimalSound(animal.id, {
      includeVocalImitation: true,
      stopSpeechFirst: true,
    });
  }, []);

  // Tap an animal card: play realistic animal sound FIRST, then speak greeting cleanly in onEnd
  const handleSelectAnimal = useCallback(
    (animal: TalkingAnimal) => {
      soundManager.unlockAudio();
      if (!soundManager.soundEnabled) {
        soundManager.soundEnabled = true;
        setSoundOn(true);
      }
      setSelectedId(animal.id);
      const idx = phraseStep[animal.id] ?? 0;
      const line = animal.greetings[idx % animal.greetings.length];
      setPhraseStep((prev) => ({ ...prev, [animal.id]: idx + 1 }));
      setSpeechBubble(line);

      soundManager.playAnimalSound(animal.id, {
        includeVocalImitation: true,
        stopSpeechFirst: true,
        onEnd: () => {
          if (!isMountedRef.current) return;
          soundManager.speakPraise(line);
        },
      });
    },
    [phraseStep]
  );

  const handleCuriosity = () => {
    soundManager.unlockAudio();
    soundManager.stopAnimalSound();
    const idx = curiosityStep[selectedAnimal.id] ?? 0;
    const fact = selectedAnimal.curiosities[idx % selectedAnimal.curiosities.length];
    setCuriosityStep((prev) => ({ ...prev, [selectedAnimal.id]: idx + 1 }));
    setSpeechBubble(fact);
    soundManager.playTwinkle();
    soundManager.speak(fact, { context: 'general' });
  };

  const handleCuddle = () => {
    soundManager.unlockAudio();
    soundManager.stopAnimalSound();
    const line = selectedAnimal.cuddlePhrase;
    setSpeechBubble(line);
    setCuddleHearts((c) => c + 1);
    soundManager.playSuccess();
    confetti.burst();
    soundManager.speakPraise(line);
  };

  const startNewGuessRound = useCallback(
    (excludeId?: AnimalId) => {
      soundManager.unlockAudio();
      soundManager.stopSpeech();
      soundManager.stopAnimalSound();

      const optionCount = ageInfo.years <= 3 ? 3 : 4;
      const pool = excludeId
        ? TALKING_ANIMALS.filter((a) => a.id !== excludeId)
        : TALKING_ANIMALS;
      const target =
        pool[Math.floor(Math.random() * pool.length)] || TALKING_ANIMALS[0];

      // Pick visually & acoustically distinct distractors and shuffle cleanly
      const distractors = shuffleArray(
        TALKING_ANIMALS.filter((a) => a.id !== target.id)
      ).slice(0, optionCount - 1);
      const roundOptions = shuffleArray([target, ...distractors]);

      setQuizOptions(roundOptions);
      setQuizTarget(target);
      setQuizSolved(false);
      setQuizWrongIds([]);

      roundOptions.forEach((a) => soundManager.prewarmAnimalSound(a.id));

      setTimeout(() => {
        if (!isMountedRef.current) return;
        soundManager.playAnimalSound(target.id, {
          includeVocalImitation: true,
          stopSpeechFirst: true,
          onEnd: () => {
            if (!isMountedRef.current) return;
            soundManager.speakInstruction(
              'Ascolta bene! Quale animale fa questo verso?'
            );
          },
        });
      }, 150);
    },
    [ageInfo.years]
  );

  const handleSwitchMode = (nextMode: 'explore' | 'guess') => {
    soundManager.unlockAudio();
    soundManager.playPop();
    soundManager.stopSpeech();
    soundManager.stopAnimalSound();
    setMode(nextMode);
    if (nextMode === 'guess') {
      startNewGuessRound();
    } else {
      setSpeechBubble(selectedAnimal.greetings[0]);
    }
  };

  const handleSwitchTab = (nextTab: HabitatTab) => {
    soundManager.playPop();
    setHabitatTab(nextTab);
    const firstInTab = TALKING_ANIMALS.find((a) => a.tab === nextTab);
    if (firstInTab) {
      setSelectedId(firstInTab.id);
      setSpeechBubble(firstInTab.greetings[0]);
    }
  };

  const handleGuessPick = (animal: TalkingAnimal) => {
    if (quizSolved || quizWrongIds.includes(animal.id)) return;
    soundManager.unlockAudio();

    if (animal.id === quizTarget.id) {
      setQuizSolved(true);
      setQuizWrongIds([]);
      const nextStreak = quizStreak + 1;
      setQuizStreak(nextStreak);
      soundManager.playFanfare();
      confetti.burst();
      // Name only on milestone streaks (5, 10, 15...) so we never spam the child's name
      const greetPrefix =
        nextStreak % 5 === 0 ? `${bravoWord} ${childName}!` : `${bravoWord}!`;
      soundManager.playAnimalSound(animal.id, {
        includeVocalImitation: true,
        stopSpeechFirst: true,
        onEnd: () => {
          if (!isMountedRef.current) return;
          soundManager.speakPraise(`${greetPrefix} Era proprio ${animal.name}!`);
        },
      });
    } else {
      setQuizWrongIds((prev) => [...prev, animal.id]);
      soundManager.playEncouragement();
      soundManager.speak('Quasi! Riascolta bene il verso e riprova con calma!', {
        context: 'instruction',
        onEnd: () => {
          if (!isMountedRef.current) return;
          soundManager.playAnimalSound(quizTarget.id, {
            includeVocalImitation: true,
            stopSpeechFirst: false,
          });
        },
      });
    }
  };

  const isSelectedPlaying = playingAnimalId === selectedAnimal.id;
  const isQuizTargetPlaying = playingAnimalId === quizTarget.id;

  return (
    <div className="safe-viewport-pad relative w-full h-full flex flex-col justify-between overflow-hidden select-none">
      {/* FULL-BLEED STORYBOOK SUNNY MEADOW BACKDROP */}
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

      {/* TOP NAVIGATION BAR */}
      <header className="landscape-header-compact app-shell-container relative z-10 flex items-center justify-between px-2.5 sm:px-5 lg:px-8 pt-2 sm:pt-3 pb-1 shrink-0 gap-2">
        <button
          onClick={() => {
            soundManager.stopAnimalSound();
            soundManager.stopSpeech();
            soundManager.playPop();
            onClose();
          }}
          aria-label="Torna alla Home"
          className="glossy-bubble-btn bg-gradient-to-b from-white to-slate-100 text-slate-900 px-2.5 min-[360px]:px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-white flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[38px] sm:min-h-[42px]"
        >
          <Home className="w-4 h-4 text-blue-700 fill-blue-700 shrink-0" />
          <span className="hidden min-[360px]:inline font-fun font-extrabold text-xs sm:text-sm text-slate-900 whitespace-nowrap">
            Home
          </span>
        </button>

        {/* Wooden Zoo Signboard */}
        <div className="storybook-wood-sign rounded-2xl px-2.5 sm:px-5 py-1.5 inline-flex items-center justify-center gap-1.5 sm:gap-2 min-w-0 flex-1 max-w-fit overflow-hidden">
          <span className="hidden min-[360px]:inline text-base sm:text-lg leading-none shrink-0">🐾</span>
          <span className="font-kids font-bold text-xs min-[380px]:text-sm sm:text-lg text-[#4a2206] tracking-tight truncate">
            Zoo &amp; Fattoria Parlante
          </span>
          <span className="hidden min-[360px]:inline text-base sm:text-lg leading-none shrink-0">🐾</span>
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
          {musicOn ? (
            <Music className="w-4 h-4 stroke-[2.6]" />
          ) : (
            <VolumeX className="w-4 h-4 stroke-[2.6]" />
          )}
        </button>
      </header>

      {/* ONE-TAP UNMUTE HELPER BANNER IF SOUND EFFECTS ARE MUTED */}
      {!soundOn && (
        <div className="app-shell-container relative z-10 px-2.5 sm:px-5 lg:px-8 pt-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundManager.soundEnabled = true;
              soundManager.unlockAudio();
              setSoundOn(true);
              handlePlaySoundOnly(selectedAnimal);
            }}
            className="w-full max-w-md mx-auto rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 border-2 border-white shadow-md px-3.5 py-2 flex items-center justify-center gap-2 font-fun font-extrabold text-xs sm:text-sm cursor-pointer"
          >
            <Volume2 className="w-4 h-4 shrink-0" />
            <span>Tocca qui per attivare l’audio e sentire i versi degli animali!</span>
          </button>
        </div>
      )}

      {/* MODE SWITCHER (ESPLORA vs INDOVINA IL VERSO) */}
      <div className="app-shell-container relative z-10 px-2.5 sm:px-5 lg:px-8 pt-1 pb-1 shrink-0">
        <div className="storybook-wood-shelf rounded-2xl p-1.5 grid grid-cols-2 gap-1.5 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => handleSwitchMode('explore')}
            className={`min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl font-kids font-bold text-[11px] min-[370px]:text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer transition-all ${
              mode === 'explore'
                ? 'bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-400 text-[#422006] border-2 border-white shadow-sm'
                : 'bg-amber-950/35 text-amber-50 hover:bg-amber-950/45'
            }`}
          >
            <span className="shrink-0">🐶</span>
            <span className="truncate">Esplora Versi (14)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('guess')}
            className={`min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl font-kids font-bold text-[11px] min-[370px]:text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer transition-all ${
              mode === 'guess'
                ? 'bg-gradient-to-b from-emerald-300 via-green-400 to-emerald-500 text-white border-2 border-white shadow-sm'
                : 'bg-amber-950/35 text-amber-50 hover:bg-amber-950/45'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Indovina il Verso</span>
          </button>
        </div>
      </div>

      {/* MAIN ZOO & FATTORIA STAGE */}
      <main className="app-shell-container relative z-10 flex-1 flex flex-col justify-start px-2.5 sm:px-5 lg:px-8 py-1.5 w-full min-h-0 gap-2.5 overflow-y-auto">
        {mode === 'explore' ? (
          <>
            {/* SPOTLIGHT BOARD FOR SELECTED ANIMAL */}
            <section className="storybook-parchment-board rounded-[28px] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 max-w-3xl mx-auto w-full shrink-0">
              {/* Tappable Sound-First Animal Portrait */}
              <button
                type="button"
                onClick={() => handlePlaySoundOnly(selectedAnimal)}
                title={`Tocca per sentire il verso di ${selectedAnimal.name}`}
                className="relative shrink-0 cursor-pointer group focus:outline-none"
              >
                <div
                  className={`w-26 h-26 sm:w-34 sm:h-34 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-b ${selectedAnimal.cardGradient} transition-transform ${
                    isSelectedPlaying ? 'ring-4 ring-amber-300 scale-105' : 'group-hover:scale-103'
                  }`}
                >
                  <AnimalPortraitVisual
                    animal={selectedAnimal}
                    size="spotlight"
                    isPlaying={isSelectedPlaying}
                  />
                </div>
                <span
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full font-fun font-extrabold text-[10px] sm:text-xs whitespace-nowrap border-2 shadow-md transition-colors ${
                    isSelectedPlaying
                      ? 'bg-emerald-600 text-white border-emerald-200 animate-pulse'
                      : 'bg-amber-950 text-amber-200 border-amber-300'
                  }`}
                >
                  {isSelectedPlaying ? '🔊 ' : ''}
                  {selectedAnimal.soundLabel}
                </span>
              </button>

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

                <div className="mt-2 storybook-tray-3d rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
                  “{speechBubble}”
                </div>

                {/* 3 Interactive Fun Buttons */}
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlaySoundOnly(selectedAnimal)}
                    className="home-wood-outer min-w-0 rounded-2xl p-[3px] cursor-pointer"
                  >
                    <span
                      className={`home-inner-orange rounded-[13px] py-2 px-1.5 sm:px-2 flex items-center justify-center gap-1 text-white font-fun font-extrabold text-[10.5px] min-[370px]:text-[11px] sm:text-xs whitespace-nowrap ${
                        isSelectedPlaying ? 'brightness-110 ring-2 ring-yellow-200' : ''
                      }`}
                    >
                      <Volume2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelectedPlaying ? 'animate-bounce' : ''
                        }`}
                      />
                      <span className="truncate">{isSelectedPlaying ? 'Suona...' : 'Verso'}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCuriosity}
                    className="home-wood-outer min-w-0 rounded-2xl p-[3px] cursor-pointer"
                  >
                    <span className="home-inner-teal rounded-[13px] py-2 px-1.5 sm:px-2 flex items-center justify-center gap-1 text-white font-fun font-extrabold text-[10.5px] min-[370px]:text-[11px] sm:text-xs whitespace-nowrap">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200" />
                      <span className="truncate">Curiosità</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCuddle}
                    className="home-lavender-outer min-w-0 rounded-2xl p-[3px] cursor-pointer"
                  >
                    <span className="home-inner-purple rounded-[13px] py-2 px-1.5 sm:px-2 flex items-center justify-center gap-1 text-white font-fun font-extrabold text-[10.5px] min-[370px]:text-[11px] sm:text-xs whitespace-nowrap">
                      <Heart className="w-3.5 h-3.5 shrink-0 fill-pink-200 text-pink-200" />
                      <span className="truncate">Coccole</span>
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* HABITAT TABS: FATTORIA & BOSCO vs SAVANA & NATURA */}
            <div className="max-w-3xl mx-auto w-full flex items-center justify-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchTab('farm')}
                className={`flex-1 max-w-[230px] py-2 px-3 rounded-2xl font-kids font-bold text-xs sm:text-sm border-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  habitatTab === 'farm'
                    ? 'bg-gradient-to-b from-emerald-400 to-green-600 text-white border-white shadow-md'
                    : 'bg-white/85 text-amber-950 border-amber-200 hover:bg-white'
                }`}
              >
                <span>🏡</span>
                <span>Fattoria &amp; Bosco (8)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTab('savanna')}
                className={`flex-1 max-w-[230px] py-2 px-3 rounded-2xl font-kids font-bold text-xs sm:text-sm border-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  habitatTab === 'savanna'
                    ? 'bg-gradient-to-b from-amber-400 to-orange-600 text-white border-white shadow-md'
                    : 'bg-white/85 text-amber-950 border-amber-200 hover:bg-white'
                }`}
              >
                <span>🦁</span>
                <span>Savana &amp; Natura (6)</span>
              </button>
            </div>

            {/* CARVED WOODEN SHELF HOLDING ALL ANIMALS IN ACTIVE HABITAT */}
            <section className="storybook-wood-shelf rounded-3xl p-2.5 sm:p-3 max-w-3xl mx-auto w-full shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {tabAnimals.map((animal) => {
                  const isActive = animal.id === selectedAnimal.id;
                  const isPlayingCard = playingAnimalId === animal.id;
                  return (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => handleSelectAnimal(animal)}
                      style={{
                        boxShadow: `0 5px 0 ${animal.shadowColor}, 0 12px 20px -4px rgba(15, 23, 42, 0.35)`,
                      }}
                      className={`zoo-3d-card bg-gradient-to-b ${animal.cardGradient} flex flex-col text-left cursor-pointer w-full transition-transform ${
                        isPlayingCard
                          ? 'ring-4 ring-emerald-300 scale-[1.03]'
                          : isActive
                          ? 'ring-4 ring-yellow-200 scale-[1.015]'
                          : ''
                      }`}
                    >
                      <div className="relative w-full h-22 sm:h-24 overflow-hidden">
                        <AnimalPortraitVisual
                          animal={animal}
                          size="card"
                          isPlaying={isPlayingCard}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/35 to-transparent" />
                        <span
                          className={`storybook-play-dot absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                            isPlayingCard ? 'bg-emerald-500 animate-pulse' : ''
                          }`}
                        >
                          {isPlayingCard ? (
                            <Volume2 className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Play className={`w-3 h-3 ml-0.5 ${animal.playIconClass}`} />
                          )}
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
                  ? `🎉 ${bravoWord}! Era proprio ${quizTarget.name}!`
                  : 'Ascolta il verso: quale animale sta parlando?'}
              </h2>

              <div className="mt-3 flex items-center justify-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePlaySoundOnly(quizTarget)}
                  className="home-wood-outer rounded-2xl p-[3.5px] cursor-pointer"
                >
                  <span
                    className={`home-inner-orange rounded-[13px] px-4 py-2 inline-flex items-center gap-2 text-white font-kids font-bold text-sm ${
                      isQuizTargetPlaying ? 'brightness-110 ring-2 ring-yellow-200' : ''
                    }`}
                  >
                    <Volume2
                      className={`w-4 h-4 shrink-0 ${
                        isQuizTargetPlaying ? 'animate-bounce' : ''
                      }`}
                    />
                    <span>
                      {isQuizTargetPlaying ? 'Ascolta il Verso...' : 'Riascolta il Verso!'}
                    </span>
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
              <div
                className={`grid gap-2.5 ${
                  quizOptions.length === 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-4'
                }`}
              >
                {quizOptions.map((animal, idx) => {
                  const isWinner = quizSolved && animal.id === quizTarget.id;
                  const isWrong = quizWrongIds.includes(animal.id);
                  const isLastOdd = quizOptions.length === 3 && idx === 2;
                  return (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => handleGuessPick(animal)}
                      style={{
                        boxShadow: `0 5px 0 ${animal.shadowColor}, 0 12px 20px -4px rgba(15, 23, 42, 0.35)`,
                      }}
                      className={`zoo-3d-card bg-gradient-to-b ${animal.cardGradient} flex flex-col text-left cursor-pointer transition-all ${
                        isLastOdd ? 'col-span-2 sm:col-span-1 w-[68%] sm:w-full mx-auto' : 'w-full'
                      } ${
                        isWinner
                          ? 'ring-4 ring-emerald-300 scale-[1.03]'
                          : isWrong
                          ? 'opacity-45 grayscale scale-95 pointer-events-none'
                          : ''
                      }`}
                    >
                      <div className="relative w-full h-26 sm:h-30 overflow-hidden">
                        <AnimalPortraitVisual
                          animal={animal}
                          size="card"
                          isPlaying={isWinner && isQuizTargetPlaying}
                        />
                        {isWinner && (
                          <span className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="px-2 py-2 text-center leading-tight">
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
            🐾 Spazio Svago · Tocca gli animali per ascoltare i versi della fattoria e della savana
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
