import { AgeBandId, ChildGender, UserProgress } from '../types/game';
import { calculateChildAge, getDisplayChildName, getGenderedWord } from './childProfile';

export interface CollectibleSticker {
  id: string;
  emoji: string;
  name: string;
  theme: 'Natura' | 'Spazio' | 'Musica' | 'Arte' | 'Scienza' | 'Magia';
  gemCost: number;
  noteFreq: number;
  funFact: string;
}

export interface DailyCuriositySpark {
  emoji: string;
  title: string;
  fact: string;
  questionPrompt: string;
}

export interface MindfulBreakActivity {
  emoji: string;
  title: string;
  instruction: string;
  benefit: string;
}

export const DAILY_MISSION_TARGET = 5;

export const COLLECTIBLE_STICKERS: CollectibleSticker[] = [
  {
    id: 'stk_star',
    emoji: '⭐',
    name: 'Stella Esploratrice',
    theme: 'Spazio',
    gemCost: 0,
    noteFreq: 523.25,
    funFact: 'Le stelle brillano nel cielo grazie alla loro luce propria, proprio come il nostro Sole!',
  },
  {
    id: 'stk_butterfly',
    emoji: '🦋',
    name: 'Farfalla Curiosa',
    theme: 'Natura',
    gemCost: 6,
    noteFreq: 587.33,
    funFact: 'Le farfalle sentono i sapori dei fiori usando piccole antenne sulle zampine!',
  },
  {
    id: 'stk_dolphin',
    emoji: '🐬',
    name: 'Delfino Brio',
    theme: 'Natura',
    gemCost: 8,
    noteFreq: 659.25,
    funFact: 'Ogni delfino ha un fischio speciale tutto suo, proprio come un nome proprio!',
  },
  {
    id: 'stk_rainbow',
    emoji: '🌈',
    name: 'Ponte Arcobaleno',
    theme: 'Arte',
    gemCost: 8,
    noteFreq: 698.46,
    funFact: 'L’arcobaleno nasce quando i raggi del sole attraversano le goccioline di pioggia e si dividono in 7 colori!',
  },
  {
    id: 'stk_guitar',
    emoji: '🎸',
    name: 'Chitarra Ritmica',
    theme: 'Musica',
    gemCost: 10,
    noteFreq: 783.99,
    funFact: 'Quando pizzichi una corda, l’aria vibra velocissima e trasporta la melodia fino alle tue orecchie!',
  },
  {
    id: 'stk_palette',
    emoji: '🎨',
    name: 'Tavolozza Creativa',
    theme: 'Arte',
    gemCost: 10,
    noteFreq: 880.0,
    funFact: 'Con soli tre colori primari — rosso, giallo e blu — puoi creare tantissime sfumature!',
  },
  {
    id: 'stk_owl',
    emoji: '🦉',
    name: 'Gufo Saggio',
    theme: 'Natura',
    gemCost: 12,
    noteFreq: 493.88,
    funFact: 'Il gufo vola in modo completamente silenzioso grazie alle sue piume morbidissime!',
  },
  {
    id: 'stk_rocket',
    emoji: '🚀',
    name: 'Razzo Spaziale',
    theme: 'Spazio',
    gemCost: 12,
    noteFreq: 783.99,
    funFact: 'Un razzo deve superare i 40.000 chilometri orari per vincere la gravità della Terra e volare nello spazio!',
  },
  {
    id: 'stk_piano',
    emoji: '🎹',
    name: 'Pianoforte Magico',
    theme: 'Musica',
    gemCost: 14,
    noteFreq: 523.25,
    funFact: 'Un pianoforte completo ha 88 tasti: 52 bianchi e 36 neri, capaci di suonare sia note dolcissime che fortissime!',
  },
  {
    id: 'stk_fox',
    emoji: '🦊',
    name: 'Volpina Astuta',
    theme: 'Natura',
    gemCost: 14,
    noteFreq: 659.25,
    funFact: 'La volpe usa la sua coda folta come una coperta calda in inverno e per mantenere l’equilibrio quando salta!',
  },
  {
    id: 'stk_microscope',
    emoji: '🔬',
    name: 'Lente dello Scienziato',
    theme: 'Scienza',
    gemCost: 16,
    noteFreq: 739.99,
    funFact: 'Con un microscopio possiamo scoprire un mondo invisibile fatto di cellule e cristalli di neve tutti diversi!',
  },
  {
    id: 'stk_saturn',
    emoji: '🪐',
    name: 'Anelli di Saturno',
    theme: 'Spazio',
    gemCost: 16,
    noteFreq: 880.0,
    funFact: 'Gli spettacolari anelli di Saturno sono formati da miliardi di frammenti di ghiaccio e roccia che brillano al sole!',
  },
  {
    id: 'stk_unicorn',
    emoji: '🦄',
    name: 'Unicorno delle Idee',
    theme: 'Magia',
    gemCost: 18,
    noteFreq: 987.77,
    funFact: 'La fantasia è il superpotere con cui nascono le storie più belle e le grandi invenzioni!',
  },
  {
    id: 'stk_compass',
    emoji: '🧭',
    name: 'Bussola d’Oro',
    theme: 'Scienza',
    gemCost: 18,
    noteFreq: 587.33,
    funFact: 'L’ago della bussola punta sempre verso il Nord perché segue il campo magnetico naturale della Terra!',
  },
  {
    id: 'stk_violin',
    emoji: '🎻',
    name: 'Violino d’Orchestra',
    theme: 'Musica',
    gemCost: 20,
    noteFreq: 659.25,
    funFact: 'Il violino è lo strumento più acuto della famiglia degli archi ed è costruito con legni pregiati come l’abete rosso!',
  },
  {
    id: 'stk_dna',
    emoji: '🧬',
    name: 'Codice della Vita',
    theme: 'Scienza',
    gemCost: 22,
    noteFreq: 783.99,
    funFact: 'Dentro ogni cellula del corpo c’è il DNA: un libretto di istruzioni a doppia elica che rende ogni persona unica!',
  },
  {
    id: 'stk_crown',
    emoji: '👑',
    name: 'Corona del Pensiero',
    theme: 'Magia',
    gemCost: 25,
    noteFreq: 1046.5,
    funFact: 'Ogni volta che impari qualcosa di nuovo, nel tuo cervello si accendono nuovi ponti di luce tra i neuroni!',
  },
  {
    id: 'stk_telescope',
    emoji: '🔭',
    name: 'Telescopio delle Galassie',
    theme: 'Spazio',
    gemCost: 28,
    noteFreq: 880.0,
    funFact: 'Guardare le stelle lontane è come guardare indietro nel tempo: la loro luce viaggia per anni prima di raggiungerci!',
  },
];

const DAILY_CURIOSITIES_BY_BAND: Record<AgeBandId, DailyCuriositySpark[]> = {
  toddler_2_3: [
    {
      emoji: '🐘',
      title: 'La doccia dell’elefante',
      fact: 'L’elefante usa la sua lunga proboscide come un braccio per prendere le mele e come una doccia fresca!',
      questionPrompt: 'Riesci a fare il verso dell’elefante? Pa-uuuh!',
    },
    {
      emoji: '🦋',
      title: 'Il segreto della farfalla',
      fact: 'Prima di avere le ali colorate, la farfalla era un piccolo bruco goloso di foglie verdi!',
      questionPrompt: 'Di quale colore vorresti le tue ali da farfalla?',
    },
    {
      emoji: '🌈',
      title: 'I colori dell’arcobaleno',
      fact: 'Quando esce il sole dopo la pioggia, nel cielo spunta un ponte pieno di colori allegri!',
      questionPrompt: 'Qual è il tuo colore preferito oggi?',
    },
  ],
  preschool_4_5: [
    {
      emoji: '🦒',
      title: 'La lingua della giraffa',
      fact: 'La giraffa ha una lingua lunga quasi mezzo metro di colore blu-viola, così il sole non gliela scotta mentre mangia!',
      questionPrompt: 'Quale altro animale dal collo o dalle orecchie grandi conosci?',
    },
    {
      emoji: '🐝',
      title: 'La danza delle api',
      fact: 'Le api si parlano ballando a forma di otto per raccontare alle amiche dove sono i fiori più dolci!',
      questionPrompt: 'Se fossi un’ape, che danza inventeresti per dire "ciao"?',
    },
    {
      emoji: '🐙',
      title: 'I tre cuori del polpo',
      fact: 'Il polpo del mare è super intelligente: ha ben tre cuori e otto braccia morbidissime!',
      questionPrompt: 'Quante cose potresti disegnare insieme se avessi 8 braccia?',
    },
  ],
  early_primary_6_7: [
    {
      emoji: '🌳',
      title: 'Gli alberi si aiutano sotto terra',
      fact: 'Nel bosco le radici degli alberi si scambiano acqua e nutrimento come una grande famiglia sotterranea!',
      questionPrompt: 'Come possiamo aiutare la natura oggi?',
    },
    {
      emoji: '🎵',
      title: 'Il ritmo del tuo cuore',
      fact: 'Il tuo cuore batte a un ritmo regolare tutto il giorno, proprio come un piccolo tamburo musicale dentro di te!',
      questionPrompt: 'Prova a battere le mani a tempo lento e poi veloce!',
    },
    {
      emoji: '🌙',
      title: 'Le orme sulla Luna',
      fact: 'Sulla Luna non c’è vento né pioggia, quindi le impronte degli astronauti restano lì per milioni di anni!',
      questionPrompt: 'Cosa porteresti nello zaino per un viaggio sulla Luna?',
    },
  ],
  upper_primary_8_9: [
    {
      emoji: '⚡',
      title: 'La velocità del tuo cervello',
      fact: 'I segnali elettrici nel tuo cervello viaggiano a oltre 400 chilometri orari: più veloci di un treno ad alta velocità!',
      questionPrompt: 'Quale materia ti fa sentire la mente più accesa oggi?',
    },
    {
      emoji: '🌻',
      title: 'La matematica nei girasoli',
      fact: 'I semi al centro di un girasole formano spirali perfette che seguono una famosa sequenza matematica scoperta da Fibonacci!',
      questionPrompt: 'Dove altro vedi forme geometriche in natura?',
    },
    {
      emoji: '🎻',
      title: 'Perché la musica ci emoziona',
      fact: 'Quando ascoltiamo o suoniamo un ritmo, il cervello attiva insieme memoria, movimento ed emozioni!',
      questionPrompt: 'Quale strumento musicale ti piacerebbe provare a suonare?',
    },
  ],
  preteen_10_12: [
    {
      emoji: '🧠',
      title: 'Neuroplasticità: la mente come un muscolo',
      fact: 'Ogni volta che affronti una sfida nuova e sbagli una volta prima di riuscirci, il cervello crea connessioni sinaptiche più forti!',
      questionPrompt: 'Quale sfida ti incuriosisce di più oggi: logica, scienze o arte?',
    },
    {
      emoji: '🪐',
      title: 'Un giorno su Venere',
      fact: 'Venere ruota su se stesso così lentamente che un suo giorno dura più di un intero anno venereano!',
      questionPrompt: 'Riesci a immaginare un pianeta dove il Sole sorge a Ovest?',
    },
    {
      emoji: '🎨',
      title: 'La prospettiva di Leonardo',
      fact: 'Nel Rinascimento artisti e matematici lavoravano insieme: Leonardo da Vinci usava la geometria per dare profondità ai suoi quadri!',
      questionPrompt: 'Arte e matematica sono molto più vicine di quanto sembri, vero?',
    },
  ],
  teen_13_14: [
    {
      emoji: '🔭',
      title: 'Siamo fatti di polvere di stelle',
      fact: 'Il carbonio, l’ossigeno e il ferro del nostro corpo si sono formati miliardi di anni fa nel cuore di antiche stelle!',
      questionPrompt: 'Quale grande scoperta scientifica ti affascina di più?',
    },
    {
      emoji: '💻',
      title: 'Tutto il digitale nasce da 0 e 1',
      fact: 'Musica, immagini 3D e videogiochi sono costruiti combinando miliardi di semplicissime scelte binarie (0 e 1) e logica booleana!',
      questionPrompt: 'Pronto a mettere alla prova il tuo pensiero algoritmico?',
    },
    {
      emoji: '⚖️',
      title: 'L’effetto della Sezione Aurea',
      fact: 'Il rapporto aureo φ ≈ 1,618 compare nelle conchiglie Nautilus, nel Partenone di Atene e nei capolavori del Rinascimento!',
      questionPrompt: 'Quale connessione tra scienza e arte ti sorprende di più?',
    },
  ],
};

export const MINDFUL_BREAK_ACTIVITIES: MindfulBreakActivity[] = [
  {
    emoji: '👀',
    title: 'Regola 20-20 per gli Occhi',
    instruction: 'Guarda un oggetto lontano (o fuori dalla finestra) per 15 secondi: gli occhi si rilassano e tornano super nitidi!',
    benefit: 'Riposa la vista e ricarica la concentrazione',
  },
  {
    emoji: '🦒',
    title: 'Stiracchiamento della Giraffa',
    instruction: 'Alza le braccia verso il soffitto come se dovessi raccogliere una foglia altissima, poi rilassa le spalle con un sorriso!',
    benefit: 'Ossigena il cervello e scioglie la postura',
  },
  {
    emoji: '🌬️',
    title: '3 Respiri della Nuvola',
    instruction: 'Inspira piano dal naso contando fino a 3, poi soffia fuori dolcemente come per far volare una nuvola morbida!',
    benefit: 'Calma la mente e migliora la memoria di lavoro',
  },
  {
    emoji: '🎨',
    title: 'Cambio di Emisfero: Creatività!',
    instruction: 'Dopo 5 sfide logiche, fare 2 minuti di disegno libero nello Studio stimola il pensiero creativo e consolida ciò che hai imparato!',
    benefit: 'Unisce logica e fantasia senza stancare',
  },
];

export function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyCuriositySpark(birthDate?: string): DailyCuriositySpark {
  const ageInfo = calculateChildAge(birthDate);
  const pool = DAILY_CURIOSITIES_BY_BAND[ageInfo.ageBand] || DAILY_CURIOSITIES_BY_BAND.preschool_4_5;
  const daySeed = Math.floor(Date.now() / 86_400_000);
  return pool[daySeed % pool.length];
}

export function getMindfulBreakActivity(seed: number): MindfulBreakActivity {
  return MINDFUL_BREAK_ACTIVITIES[Math.abs(seed) % MINDFUL_BREAK_ACTIVITIES.length];
}

export function getDailyMissionStatus(progress: UserProgress): {
  completedToday: number;
  target: number;
  cyclesCompletedToday: number;
  inCurrentCycle: number;
  progressPercent: number;
  isDailyChestReady: boolean;
} {
  const today = getTodayIsoDate();
  const completedToday =
    progress.dailyMissionDate === today ? Math.max(0, progress.dailyMissionCount || 0) : 0;
  const cyclesCompletedToday = Math.floor(completedToday / DAILY_MISSION_TARGET);
  const inCurrentCycle = completedToday % DAILY_MISSION_TARGET;
  const progressPercent = Math.min(100, Math.round((inCurrentCycle / DAILY_MISSION_TARGET) * 100));
  const isDailyChestReady = progress.dailyChestClaimedDate !== today;

  return {
    completedToday,
    target: DAILY_MISSION_TARGET,
    cyclesCompletedToday,
    inCurrentCycle,
    progressPercent,
    isDailyChestReady,
  };
}

export function pickNextLockedSticker(unlockedIds: string[] = []): CollectibleSticker | null {
  const unlockedSet = new Set(unlockedIds);
  return COLLECTIBLE_STICKERS.find((s) => !unlockedSet.has(s.id)) || null;
}

export function getPersonalizedBreakGreeting(
  childName: string,
  gender: ChildGender
): string {
  const display = childName || getDisplayChildName(undefined);
  const bravo = getGenderedWord(gender, 'Bravissima', 'Bravissimo', 'Fantastico');
  return `${bravo} ${display}! Hai completato una mini-missione da 5 sfide!`;
}
