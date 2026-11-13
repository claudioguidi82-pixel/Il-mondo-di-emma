import { Puzzle, Trophy, UserProgress } from '../types/game';

export const TROPHIES: Trophy[] = [
  {
    id: 'trophy_logic',
    title: 'Genietto della Logica',
    category: 'logic',
    description: 'Hai risolto i pattern e trovato gli intrusi!',
    icon: '🧠',
    requiredPuzzlesCount: 3,
    unlocked: false
  },
  {
    id: 'trophy_letters',
    title: 'Campionessa dell’Alfabeto',
    category: 'letters',
    description: 'Conosci le lettere e le parole a memoria!',
    icon: '🔤',
    requiredPuzzlesCount: 3,
    unlocked: false
  },
  {
    id: 'trophy_numbers',
    title: 'Maestra dei Numeri',
    category: 'numbers',
    description: 'Sai contare e fare le prime addizioni visive!',
    icon: '🔢',
    requiredPuzzlesCount: 3,
    unlocked: false
  },
  {
    id: 'trophy_shapes',
    title: 'Esploratrice delle Forme',
    category: 'shapes',
    description: 'Riconosci sagome, ombre e mescoli i colori!',
    icon: '🔷',
    requiredPuzzlesCount: 3,
    unlocked: false
  },
  {
    id: 'trophy_artist',
    title: 'Grande Artista',
    category: 'art',
    description: 'Hai dipinto splendidi disegni nel diario!',
    icon: '🎨',
    requiredPuzzlesCount: 1,
    unlocked: false
  },
  {
    id: 'trophy_crown',
    title: 'Super Emma delle Meraviglie',
    category: 'streak',
    description: 'Hai superato più di 8 enigmi magici!',
    icon: '👑',
    requiredPuzzlesCount: 8,
    unlocked: false
  }
];

export const EDUCATIONAL_PUZZLES: Puzzle[] = [
  // ==========================================
  // 1. CATEGORIA: LOGICA & RAGIONAMENTO (LOGIC)
  // ==========================================
  {
    id: 'log_pattern_1',
    category: 'logic',
    type: 'pattern_sequence',
    title: 'Completa la Sequenza di Colori',
    prompt: 'Osserva il ritmo magico: Rosso, Giallo, Rosso, Giallo... Quale colore viene dopo?',
    speechText: 'Emma, guarda la sequenza: Rosso, Giallo, Rosso, Giallo... Quale cerchio magico viene adesso?',
    animalGuide: {
      name: 'Scoiattolo Leo',
      emoji: '🐿️',
      role: 'Maestro dei Pattern',
      voicePitch: 1.25
    },
    patternItems: ['🔴', '🟡', '🔴', '🟡', '❓'],
    options: [
      { id: 'opt_red', label: 'Rosso!', sublabel: '🔴 Torna il rosso', emoji: '🔴', color: '#ef4444', isCorrect: true },
      { id: 'opt_blue', label: 'Blu', sublabel: '🔵 Non fa parte della sequenza', emoji: '🔵', color: '#3b82f6', isCorrect: false },
      { id: 'opt_green', label: 'Verde', sublabel: '🟢 Riprova', emoji: '🟢', color: '#10b981', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Bravissima! Come nel battito delle mani: Rosso, Giallo, Rosso, Giallo... tocca di nuovo al Rosso!'
  },
  {
    id: 'log_odd_1',
    category: 'logic',
    type: 'odd_one_out',
    title: 'Trova l’Intruso tra gli Animali',
    prompt: 'Tre di queste cose sono dolci animali del bosco... ma una NON è un animale! Qual è l’intruso?',
    speechText: 'Emma, aguzza la vista: c’è un intruso tra questi animaletti! Quale di questi non è un animale?',
    animalGuide: {
      name: 'Volpina Fiamma',
      emoji: '🦊',
      role: 'Detective dei Misteri',
      voicePitch: 1.2
    },
    options: [
      { id: 'opt_dog', label: 'Cagnolino', sublabel: 'Animale', emoji: '🐶', isCorrect: false },
      { id: 'opt_cat', label: 'Gattino', sublabel: 'Animale', emoji: '🐱', isCorrect: false },
      { id: 'opt_bunny', label: 'Coniglietto', sublabel: 'Animale', emoji: '🐰', isCorrect: false },
      { id: 'opt_pizza', label: 'Pizza!', sublabel: 'Cibo goloso, non animale!', emoji: '🍕', color: '#f59e0b', isCorrect: true },
    ],
    rewardStars: 2,
    rewardGems: 4,
    funExplanation: 'Esatto! La pizza è un cibo delizioso da mangiare, non un animaletto con le zampe!'
  },
  {
    id: 'log_odd_2',
    category: 'logic',
    type: 'odd_one_out',
    title: 'Chi NON Vola nel Cielo?',
    prompt: 'Guarda bene chi viaggia nel cielo: quale di queste cose NON può volare?',
    speechText: 'Emma, chi di questi non ha le ali per volare nel cielo azzurro?',
    animalGuide: {
      name: 'Rondine Piuma',
      emoji: '🕊️',
      role: 'Guida del Vento',
      voicePitch: 1.3
    },
    options: [
      { id: 'opt_butter', label: 'Farfalla', sublabel: 'Vola tra i fiori', emoji: '🦋', isCorrect: false },
      { id: 'opt_bee', label: 'Ape', sublabel: 'Vola nell’aria', emoji: '🐝', isCorrect: false },
      { id: 'opt_car', label: 'Macchinina!', sublabel: 'Ha le ruote e viaggia a terra!', emoji: '🚗', color: '#ef4444', isCorrect: true },
      { id: 'opt_bird', label: 'Uccellino', sublabel: 'Vola alto', emoji: '🐦', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Perfetto! La macchinina corre sulla strada con 4 ruote, mentre gli uccellini volano con le ali!'
  },
  {
    id: 'log_pattern_2',
    category: 'logic',
    type: 'pattern_sequence',
    title: 'La Sequenza della Notte Stellata',
    prompt: 'Stella, Luna, Stella, Luna... Cosa deve brillare adesso nel cielo?',
    speechText: 'Emma, guarda il cielo notturno: Stella, Luna, Stella, Luna... Cosa viene dopo?',
    animalGuide: {
      name: 'Gufo Barnaba',
      emoji: '🦉',
      role: 'Saggio delle Stelle',
      voicePitch: 1.05
    },
    patternItems: ['⭐', '🌙', '⭐', '🌙', '❓'],
    options: [
      { id: 'opt_star', label: 'La Stella!', sublabel: '⭐ Splende nel buio', emoji: '⭐', color: '#fbbf24', isCorrect: true },
      { id: 'opt_sun', label: 'Il Sole', sublabel: '☀️ Di notte riposa', emoji: '☀️', color: '#f59e0b', isCorrect: false },
      { id: 'opt_cloud', label: 'Nuvola', sublabel: '☁️ Riprova', emoji: '☁️', color: '#94a3b8', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Meraviglioso! Stella poi Luna, Stella poi Luna... la risposta esatta è la Stella dorata!'
  },
  {
    id: 'log_size_1',
    category: 'logic',
    type: 'size_sorting',
    title: 'Chi è il Più GRANDE di Tutti?',
    prompt: 'Guarda questi simpatici amici: tocca quello più GRANDE e maestoso!',
    speechText: 'Emma, quale di questi amici è il più grande e gigante di tutti?',
    animalGuide: {
      name: 'Orsetto Miele',
      emoji: '🧸',
      role: 'Amico delle Misure',
      voicePitch: 1.15
    },
    options: [
      { id: 'opt_ant', label: 'Formichina', sublabel: 'Piccolina piccolina', emoji: '🐜', isCorrect: false },
      { id: 'opt_frog', label: 'Ranocchietta', sublabel: 'Media', emoji: '🐸', isCorrect: false },
      { id: 'opt_ele', label: 'Elefante!', sublabel: 'Gigante e forte!', emoji: '🐘', color: '#ec4899', isCorrect: true },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Proprio lui! L’elefante è enorme, mentre la formichina è minuscola!'
  },

  // ==========================================
  // 2. CATEGORIA: LETTERE & PAROLE (LETTERS)
  // ==========================================
  {
    id: 'let_initial_e',
    category: 'letters',
    type: 'initial_letter',
    title: 'La Lettera Speciale di Emma!',
    prompt: 'Con quale bellissima lettera dell’alfabeto inizia il tuo nome: EMMA?',
    speechText: 'Emma! Con che lettera comincia il tuo magnifico nome? E-M-M-A!',
    animalGuide: {
      name: 'Scoiattolo Leo',
      emoji: '🐿️',
      role: 'Maestro dell’Alfabeto',
      voicePitch: 1.25
    },
    options: [
      { id: 'let_e', label: 'E', sublabel: 'E come Emma ed Elefante!', emoji: '💖', color: '#ec4899', isCorrect: true },
      { id: 'let_b', label: 'B', sublabel: 'B come Balena', emoji: '🐳', color: '#3b82f6', isCorrect: false },
      { id: 'let_m', label: 'M', sublabel: 'M come Mela', emoji: '🍎', color: '#10b981', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Evviva! La E è la tua lettera regina: E-M-M-A!'
  },
  {
    id: 'let_initial_cane',
    category: 'letters',
    type: 'initial_letter',
    title: 'Con che lettera inizia CANE?',
    prompt: 'Ascolta il suono: C-C-CANE! Quale lettera fa questo suono?',
    speechText: 'Ascolta con attenzione, Emma: C-C-Cane! Con quale lettera inizia la parola Cane?',
    animalGuide: {
      name: 'Volpina Fiamma',
      emoji: '🦊',
      role: 'Custode dei Suoni',
      voicePitch: 1.2
    },
    options: [
      { id: 'let_c', label: 'C', sublabel: 'C come Cane e Casa!', emoji: '🐶', color: '#ec4899', isCorrect: true },
      { id: 'let_t', label: 'T', sublabel: 'T come Topo', emoji: '🐭', color: '#f59e0b', isCorrect: false },
      { id: 'let_s', label: 'S', sublabel: 'S come Sole', emoji: '☀️', color: '#3b82f6', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Esatto! La C fa "C-C-C" come Cane, Cuore e Carota!'
  },
  {
    id: 'let_spell_sole',
    category: 'letters',
    type: 'spell_word',
    title: 'Componi la Parola: S - O - L - E',
    prompt: 'Metti insieme le letterine per formare la parola splendente: SOLE!',
    speechText: 'Emma, componiamo insieme la parola del mattino: S - O - L - E... Sole!',
    animalGuide: {
      name: 'Rondine Piuma',
      emoji: '🕊️',
      role: 'Messaggera delle Parole',
      voicePitch: 1.3
    },
    options: [
      { id: 'opt_sole', label: 'S O L E', sublabel: 'Sole splendente!', emoji: '☀️', color: '#f59e0b', isCorrect: true },
      { id: 'opt_lose', label: 'L O S E', sublabel: 'Non è Sole', emoji: '✨', color: '#64748b', isCorrect: false },
      { id: 'opt_leso', label: 'L E S O', sublabel: 'Riprova', emoji: '⭐', color: '#64748b', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 4,
    funExplanation: 'Favoloso! S - O - L - E fa proprio SOLE, che scalda tutti noi!'
  },
  {
    id: 'let_rhyme_gatto',
    category: 'letters',
    type: 'rhyme_guess',
    title: 'La Rima Divertente del Gatto',
    prompt: 'Quale parolina fa rima con GATTO? ... Un orsetto...',
    speechText: 'Emma, divertiamoci con le rime: cosa fa rima con GATTO? Un cagnolino o un bimbo MATTO?',
    animalGuide: {
      name: 'Gufo Barnaba',
      emoji: '🦉',
      role: 'Poeta della Notte',
      voicePitch: 1.05
    },
    options: [
      { id: 'opt_matto', label: 'MATTO!', sublabel: 'Gatto fa rima con Matto!', emoji: '🤪', color: '#ec4899', isCorrect: true },
      { id: 'opt_pesce', label: 'Pesce', sublabel: 'Non fa rima', emoji: '🐟', color: '#3b82f6', isCorrect: false },
      { id: 'opt_tavolo', label: 'Tavolo', sublabel: 'Non fa rima', emoji: '🪑', color: '#64748b', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Super! Gatto e Matto finiscono allo stesso modo: -ATTO!'
  },

  // ==========================================
  // 3. CATEGORIA: NUMERI & CONTEGGIO (NUMBERS)
  // ==========================================
  {
    id: 'num_count_stars',
    category: 'numbers',
    type: 'count_interactive',
    title: 'Conta le 5 Stelline Magiche',
    prompt: 'Tocca le stelline una alla volta per contarle tutte fino a 5!',
    speechText: 'Emma, tocca le stelline dorate e conta con me da uno fino a cinque!',
    animalGuide: {
      name: 'Delfino Brio',
      emoji: '🐬',
      role: 'Capitano dei Numeri',
      voicePitch: 1.3
    },
    targetCount: 5,
    itemEmoji: '⭐',
    itemName: 'Stelline',
    options: [
      { id: 'cnt_3', label: '3', sublabel: 'Tre', emoji: '✌️', color: '#3b82f6', isCorrect: false },
      { id: 'cnt_5', label: '5', sublabel: 'Cinque come i tuoi anni!', emoji: '🖐️', color: '#ec4899', isCorrect: true },
      { id: 'cnt_6', label: '6', sublabel: 'Sei', emoji: '🎁', color: '#10b981', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 4,
    funExplanation: 'Bravissima! 5 dita su una manina, 5 stelline e 5 anni meravigliosi di Emma!'
  },
  {
    id: 'num_compare_quant',
    category: 'numbers',
    type: 'compare_quantities',
    title: 'Quale Gruppo ha PIÙ Fragole?',
    prompt: 'Guarda i due piattini: tocca quello che ha PIÙ fragole golose!',
    speechText: 'Emma, quale piattino ha più fragoline deliziose? Tocca il piattino più pieno!',
    animalGuide: {
      name: 'Tartaruga Camilla',
      emoji: '🐢',
      role: 'Saggia del Mare',
      voicePitch: 1.05
    },
    options: [
      { id: 'opt_more', label: '6 Fragole!', sublabel: '🍓🍓🍓🍓🍓🍓 (Tante!)', emoji: '🍓', color: '#ef4444', isCorrect: true },
      { id: 'opt_less', label: '2 Fragole', sublabel: '🍓🍓 (Poche)', emoji: '🍓', color: '#64748b', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Esatto! 6 è molto più grande di 2!'
  },
  {
    id: 'num_addition_1',
    category: 'numbers',
    type: 'visual_addition',
    title: 'La Prima Somma Magica con le Farfalle',
    prompt: 'Se abbiamo 2 farfalle 🦋🦋 e ne arriva un’altra 🦋, quante sono in tutto?',
    speechText: 'Due farfalline giocano sul prato... eccone un’altra che arriva in volo! Quante farfalle ci sono in tutto?',
    animalGuide: {
      name: 'Delfino Brio',
      emoji: '🐬',
      role: 'Istruttore di Calcolo',
      voicePitch: 1.3
    },
    additionParts: { countA: 2, countB: 1, emoji: '🦋' },
    options: [
      { id: 'add_2', label: '2', sublabel: 'Due', emoji: '✌️', color: '#64748b', isCorrect: false },
      { id: 'add_3', label: '3 Farfalle!', sublabel: '2 + 1 = 3', emoji: '🦋', color: '#ec4899', isCorrect: true },
      { id: 'add_4', label: '4', sublabel: 'Quattro', emoji: '🍀', color: '#10b981', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 4,
    funExplanation: 'Campionessa! 2 + 1 fa 3: hai fatto una vera addizione matematica!'
  },

  // ==========================================
  // 4. CATEGORIA: FORME & OMBRE (SHAPES)
  // ==========================================
  {
    id: 'shp_shadow_cat',
    category: 'shapes',
    type: 'match_shadow',
    title: 'Trova l’Ombra del Gattino',
    prompt: 'Guarda il gattino con la codina alzata: quale di queste ombre nere è la sua sagoma?',
    speechText: 'Emma, guarda il micio con le orecchiette a punta: qual è la sua ombra nera?',
    animalGuide: {
      name: 'Volpina Fiamma',
      emoji: '🦊',
      role: 'Guida delle Ombre',
      voicePitch: 1.2
    },
    options: [
      { id: 'opt_fish_shadow', label: 'Ombra di Pesce', sublabel: 'Ha le pinne', emoji: '🐟', color: '#334155', isCorrect: false },
      { id: 'opt_cat_shadow', label: 'Ombra del Gatto!', sublabel: 'Orecchie e coda perfette', emoji: '🐱', color: '#ec4899', isCorrect: true },
      { id: 'opt_bird_shadow', label: 'Ombra di Uccellino', sublabel: 'Ha il becco', emoji: '🐦', color: '#334155', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Bravissima! L’ombra corrisponde perfettamente alle orecchiette e alla codina del gatto!'
  },
  {
    id: 'shp_mix_orange',
    category: 'shapes',
    type: 'color_mix',
    title: 'Il Calderone dei Colori: Arancione!',
    prompt: 'Cosa succede se mescoliamo insieme il ROSSO fuoco e il GIALLO sole?',
    speechText: 'Emma, versiamo nel calderone magico il Rosso e il Giallo... quale colore brillante otteniamo?',
    animalGuide: {
      name: 'Orsetto Miele',
      emoji: '🧸',
      role: 'Alchimista dei Colori',
      voicePitch: 1.15
    },
    options: [
      { id: 'col_ora', label: 'Arancione!', sublabel: 'Come la carotina e la tigre', emoji: '🍊', color: '#f97316', isCorrect: true },
      { id: 'col_blu', label: 'Blu Notte', sublabel: 'No, è un altro colore', emoji: '🌊', color: '#3b82f6', isCorrect: false },
      { id: 'col_ver', label: 'Verde Prato', sublabel: 'Serve il blu per farlo', emoji: '🌿', color: '#10b981', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 4,
    funExplanation: 'Magia pura! Rosso più Giallo crea un caldissimo e splendido Arancione!'
  },
  {
    id: 'shp_triangle',
    category: 'shapes',
    type: 'match_shape',
    title: 'Trova il Triangolo con 3 Punte',
    prompt: 'Quale di queste forme ha esattamente 3 punte come una fetta di torta?',
    speechText: 'Emma, cerca la forma con tre lati e tre punte: il Triangolo magico!',
    animalGuide: {
      name: 'Scoiattolo Leo',
      emoji: '🐿️',
      role: 'Geometra del Bosco',
      voicePitch: 1.25
    },
    options: [
      { id: 'shp_circle', label: 'Cerchio', sublabel: 'È tutto tondo senza punte', emoji: '🟡', color: '#f59e0b', isCorrect: false },
      { id: 'shp_tri', label: 'Triangolo!', sublabel: 'Tre lati e tre punte', emoji: '🔺', color: '#ec4899', isCorrect: true },
      { id: 'shp_square', label: 'Quadrato', sublabel: 'Ha quattro lati uguali', emoji: '🟦', color: '#3b82f6', isCorrect: false },
    ],
    rewardStars: 2,
    rewardGems: 3,
    funExplanation: 'Bravissima! Il triangolo ha 3 punte e 3 lati, proprio come il tetto di una casetta!'
  }
];

export const COLORING_TEMPLATES = [
  {
    id: 'blank',
    name: 'Foglio Magico Libero',
    description: 'Disegna qualsiasi cosa desideri la tua fantasia!',
    emoji: '🎨'
  },
  {
    id: 'emma_portal',
    name: 'Emma nel Portale Arcobaleno',
    description: 'Colora Emma con il suo sorriso radioso e il portale di luce!',
    emoji: '🌈'
  },
  {
    id: 'leo_squirrel',
    name: 'Lo Scoiattolo Leo nel Bosco',
    description: 'Colora Leo mentre raccoglie le ghiande con le letterine!',
    emoji: '🐿️'
  },
  {
    id: 'brio_dolphin',
    name: 'Il Delfino Brio tra i Coralli',
    description: 'Colora Brio che salta sopra le onde marine con i pesciolini!',
    emoji: '🐬'
  },
  {
    id: 'magic_castle',
    name: 'Il Castello sulle Nuvole di Miele',
    description: 'Un castello fatato fatto di zucchero e stelle cadenti!',
    emoji: '🏰'
  }
];

export const STICKERS = [
  { id: 'stk_star', emoji: '⭐', label: 'Stella d’oro' },
  { id: 'stk_heart', emoji: '💖', label: 'Cuoricino rosa' },
  { id: 'stk_crown', emoji: '👑', label: 'Corona reale' },
  { id: 'stk_rainbow', emoji: '🌈', label: 'Arcobaleno' },
  { id: 'stk_butterfly', emoji: '🦋', label: 'Farfallina' },
  { id: 'stk_flower', emoji: '🌸', label: 'Fiorellino' },
  { id: 'stk_fox', emoji: '🦊', label: 'Volpina' },
  { id: 'stk_squirrel', emoji: '🐿️', label: 'Scoiattolino' },
  { id: 'stk_dolphin', emoji: '🐬', label: 'Delfino' },
  { id: 'stk_teddy', emoji: '🧸', label: 'Orsetto' },
  { id: 'stk_owl', emoji: '🦉', label: 'Gufetto' },
  { id: 'stk_cake', emoji: '🎂', label: 'Torta 5 anni' },
  { id: 'stk_gem', emoji: '💎', label: 'Gemma preziosa' },
  { id: 'stk_magic', emoji: '🪄', label: 'Bacchetta fatata' },
  { id: 'stk_sun', emoji: '☀️', label: 'Sole splendente' }
];

const STORAGE_KEY = 'il_mondo_di_emma_infinite_v1';

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentLevel: parsed.currentLevel ?? 1,
        highestLevelReached: parsed.highestLevelReached ?? parsed.currentLevel ?? 1,
        stars: parsed.stars ?? 0,
        gems: parsed.gems ?? 10,
        streakDays: parsed.streakDays ?? 1,
        lastPlayedDate: parsed.lastPlayedDate ?? new Date().toISOString().split('T')[0],
        categoryStats: {
          logic: parsed.categoryStats?.logic ?? { correct: 0, total: 0 },
          letters: parsed.categoryStats?.letters ?? { correct: 0, total: 0 },
          numbers: parsed.categoryStats?.numbers ?? { correct: 0, total: 0 },
          shapes: parsed.categoryStats?.shapes ?? { correct: 0, total: 0 },
          music: parsed.categoryStats?.music ?? { correct: 0, total: 0 },
          english: parsed.categoryStats?.english ?? { correct: 0, total: 0 },
        },
        trisGamesPlayed: parsed.trisGamesPlayed ?? 0,
        trisGamesWon: parsed.trisGamesWon ?? 0,
        soundEnabled: parsed.soundEnabled ?? true,
        voiceEnabled: parsed.voiceEnabled ?? true,
        musicEnabled: parsed.musicEnabled ?? true,
        totalPuzzlesSolved: parsed.totalPuzzlesSolved ?? 0,
        totalAttempts: parsed.totalAttempts ?? 0,
        dailyRewardClaimed: parsed.dailyRewardClaimed ?? false,
        savedDrawings: parsed.savedDrawings ?? [],
        completedPuzzleIds: parsed.completedPuzzleIds ?? [],
      };
    }
  } catch {
    // ignore
  }

  return {
    currentLevel: 1,
    highestLevelReached: 1,
    stars: 0,
    gems: 10,
    streakDays: 1,
    lastPlayedDate: new Date().toISOString().split('T')[0],
    categoryStats: {
      logic: { correct: 0, total: 0 },
      letters: { correct: 0, total: 0 },
      numbers: { correct: 0, total: 0 },
      shapes: { correct: 0, total: 0 },
      music: { correct: 0, total: 0 },
      english: { correct: 0, total: 0 },
    },
    trisGamesPlayed: 0,
    trisGamesWon: 0,
    soundEnabled: true,
    voiceEnabled: true,
    musicEnabled: true,
    totalPuzzlesSolved: 0,
    totalAttempts: 0,
    dailyRewardClaimed: false,
    savedDrawings: [],
    completedPuzzleIds: [],
  };
}

export function saveUserProgress(progress: UserProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localstorage error
  }
}
