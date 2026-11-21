// Natural & Realistic Italian Voice & Audio Engine for "Il Mio Mondo"
// Personalized adaptive Italian prosody for children aged 2 to 14:
// - Hybrid Tier 1 Neural Gemini TTS (/api/tts) + Tier 2 Optimized Web Speech API fallback
// - Strict Italian gender (m/f/n), singular/plural, article & elision grammatical concordance
// - Age-calibrated speaking rate & natural sentence-level intonation contours
// - Automatic stripping of emojis, slash gender markers, and technical tags before TTS

import type { ChildGender } from '../types/game';

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

export interface ProsodyOptions {
  context?: 'praise' | 'riddle' | 'instruction' | 'count' | 'general';
  pitch?: number;
  rate?: number;
  childGender?: ChildGender;
  ageYears?: number;
  preferInstant?: boolean;
  onEnd?: () => void;
}

const NUMBER_WORDS_FEMININE: Record<string, string> = {
  '1': 'una',
  '2': 'due',
  '3': 'tre',
  '4': 'quattro',
  '5': 'cinque',
  '6': 'sei',
  '7': 'sette',
  '8': 'otto',
  '9': 'nove',
  '10': 'dieci',
};

const NUMBER_WORDS_MASCULINE: Record<string, string> = {
  '1': 'un',
  '2': 'due',
  '3': 'tre',
  '4': 'quattro',
  '5': 'cinque',
  '6': 'sei',
  '7': 'sette',
  '8': 'otto',
  '9': 'nove',
  '10': 'dieci',
};

// [singular, plural, articleKind]
// articleKind: 'fv' = feminine vowel (un'/l'), 'f' = feminine consonant (una/la),
//              'mv' = masculine vowel (un/l'/gli), 'ms' = masculine s-impura/z/gn/ps (uno/lo/gli),
//              'm' = masculine consonant (un/il/i)
type NounEntry = readonly [singular: string, plural: string, kind: 'fv' | 'f' | 'mv' | 'ms' | 'm'];

const ITALIAN_NOUN_TABLE: NounEntry[] = [
  // Feminine starting with vowel
  ['arancia', 'arance', 'fv'],
  ['ape', 'api', 'fv'],
  ['anatra', 'anatre', 'fv'],
  ['ombra', 'ombre', 'fv'],
  ['onda', 'onde', 'fv'],
  ['idea', 'idee', 'fv'],
  ['isola', 'isole', 'fv'],
  ['elica', 'eliche', 'fv'],
  ['ora', 'ore', 'fv'],
  ['aquila', 'aquile', 'fv'],
  ['orchestra', 'orchestre', 'fv'],
  // Feminine starting with consonant
  ['mela', 'mele', 'f'],
  ['fragolina', 'fragoline', 'f'],
  ['fragola', 'fragole', 'f'],
  ['stellina', 'stelline', 'f'],
  ['stella', 'stelle', 'f'],
  ['farfallina', 'farfalline', 'f'],
  ['farfalla', 'farfalle', 'f'],
  ['carota', 'carote', 'f'],
  ['carotina', 'carotine', 'f'],
  ['banana', 'banane', 'f'],
  ['pera', 'pere', 'f'],
  ['ciliegia', 'ciliegie', 'f'],
  ['fetta', 'fette', 'f'],
  ['pallina', 'palline', 'f'],
  ['palla', 'palle', 'f'],
  ['macchinina', 'macchinine', 'f'],
  ['nuvola', 'nuvole', 'f'],
  ['rosa', 'rose', 'f'],
  ['chiocciola', 'chiocciole', 'f'],
  ['chiocciolina', 'chioccioline', 'f'],
  ['tartaruga', 'tartarughe', 'f'],
  ['giraffa', 'giraffe', 'f'],
  ['pecorella', 'pecorelle', 'f'],
  ['mucca', 'mucche', 'f'],
  ['gallina', 'galline', 'f'],
  ['ranocchia', 'ranocchie', 'f'],
  ['ranocchietta', 'ranocchiette', 'f'],
  ['scimmietta', 'scimmiette', 'f'],
  ['scimmia', 'scimmie', 'f'],
  ['volpina', 'volpine', 'f'],
  ['volpe', 'volpi', 'f'],
  ['rondine', 'rondini', 'f'],
  ['formica', 'formiche', 'f'],
  ['formichina', 'formichine', 'f'],
  ['scarpa', 'scarpe', 'f'],
  ['bicicletta', 'biciclette', 'f'],
  ['figura', 'figure', 'f'],
  ['forma', 'forme', 'f'],
  ['lettera', 'lettere', 'f'],
  ['parola', 'parole', 'f'],
  ['parolina', 'paroline', 'f'],
  ['nota', 'note', 'f'],
  ['campanella', 'campanelle', 'f'],
  ['chitarra', 'chitarre', 'f'],
  ['tromba', 'trombe', 'f'],
  ['torta', 'torte', 'f'],
  ['casa', 'case', 'f'],
  ['casetta', 'casette', 'f'],
  ['corona', 'corone', 'f'],
  ['bacchetta', 'bacchette', 'f'],
  ['gemma', 'gemme', 'f'],
  ['luna', 'lune', 'f'],
  ['foglia', 'foglie', 'f'],
  ['ninfea', 'ninfee', 'f'],
  ['bolla', 'bolle', 'f'],
  ['coppia', 'coppie', 'f'],
  ['partita', 'partite', 'f'],
  ['sfida', 'sfide', 'f'],
  ['domanda', 'domande', 'f'],
  ['risposta', 'risposte', 'f'],
  ['prova', 'prove', 'f'],
  ['materia', 'materie', 'f'],
  ['sessione', 'sessioni', 'f'],
  ['zebra', 'zebre', 'f'],
  // Masculine starting with vowel
  ['orsetto', 'orsetti', 'mv'],
  ['orso', 'orsi', 'mv'],
  ['albero', 'alberi', 'mv'],
  ['uccellino', 'uccellini', 'mv'],
  ['elefante', 'elefanti', 'mv'],
  ['ombrello', 'ombrelli', 'mv'],
  ['orologio', 'orologi', 'mv'],
  ['animale', 'animali', 'mv'],
  ['anno', 'anni', 'mv'],
  ['errore', 'errori', 'mv'],
  ['esercizio', 'esercizi', 'mv'],
  ['adesivo', 'adesivi', 'mv'],
  ['amico', 'amici', 'mv'],
  ['arcobaleno', 'arcobaleni', 'mv'],
  ['intruso', 'intrusi', 'mv'],
  // Masculine s-impura / z / gn / ps
  ['scoiattolo', 'scoiattoli', 'ms'],
  ['scoiattolino', 'scoiattolini', 'ms'],
  ['strumento', 'strumenti', 'ms'],
  ['scrigno', 'scrigni', 'ms'],
  ['spazio', 'spazi', 'ms'],
  ['specchio', 'specchi', 'ms'],
  ['schermo', 'schermi', 'ms'],
  ['zaino', 'zaini', 'ms'],
  ['zero', 'zeri', 'ms'],
  ['gnomo', 'gnomi', 'ms'],
  // Masculine regular consonant
  ['biscottino', 'biscottini', 'm'],
  ['biscotto', 'biscotti', 'm'],
  ['palloncino', 'palloncini', 'm'],
  ['pallone', 'palloni', 'm'],
  ['delfino', 'delfini', 'm'],
  ['coniglietto', 'coniglietti', 'm'],
  ['coniglio', 'conigli', 'm'],
  ['cagnolino', 'cagnolini', 'm'],
  ['cane', 'cani', 'm'],
  ['gattino', 'gattini', 'm'],
  ['gatto', 'gatti', 'm'],
  ['pesciolino', 'pesciolini', 'm'],
  ['pesce', 'pesci', 'm'],
  ['fiorellino', 'fiorellini', 'm'],
  ['fiore', 'fiori', 'm'],
  ['sole', 'soli', 'm'],
  ['germoglio', 'germogli', 'm'],
  ['cavallino', 'cavallini', 'm'],
  ['cavallo', 'cavalli', 'm'],
  ['topolino', 'topolini', 'm'],
  ['topo', 'topi', 'm'],
  ['maialino', 'maialini', 'm'],
  ['gallo', 'galli', 'm'],
  ['pulcino', 'pulcini', 'm'],
  ['leone', 'leoni', 'm'],
  ['ghepardo', 'ghepardi', 'm'],
  ['cammello', 'cammelli', 'm'],
  ['gufo', 'gufi', 'm'],
  ['gufetto', 'gufetti', 'm'],
  ['cerchio', 'cerchi', 'm'],
  ['quadrato', 'quadrati', 'm'],
  ['triangolo', 'triangoli', 'm'],
  ['cuore', 'cuori', 'm'],
  ['cuoricino', 'cuoricini', 'm'],
  ['tamburo', 'tamburi', 'm'],
  ['tamburello', 'tamburelli', 'm'],
  ['pianoforte', 'pianoforti', 'm'],
  ['violino', 'violini', 'm'],
  ['sasso', 'sassi', 'm'],
  ['funghetto', 'funghetti', 'm'],
  ['semaforo', 'semafori', 'm'],
  ['cappello', 'cappelli', 'm'],
  ['passo', 'passi', 'm'],
  ['gruppo', 'gruppi', 'm'],
  ['tesoro', 'tesori', 'm'],
  ['trofeo', 'trofei', 'm'],
  ['disegno', 'disegni', 'm'],
  ['numero', 'numeri', 'm'],
  ['colore', 'colori', 'm'],
  ['suono', 'suoni', 'm'],
  ['ritmo', 'ritmi', 'm'],
  ['punto', 'punti', 'm'],
  ['giorno', 'giorni', 'm'],
  ['mese', 'mesi', 'm'],
  ['tentativo', 'tentativi', 'm'],
  ['livello', 'livelli', 'm'],
  ['pianeta', 'pianeti', 'm'],
  ['minuto', 'minuti', 'm'],
  ['secondo', 'secondi', 'm'],
  ['grado', 'gradi', 'm'],
];

const NOUN_BY_SINGULAR = new Map<string, NounEntry>();
const NOUN_BY_PLURAL = new Map<string, NounEntry>();
ITALIAN_NOUN_TABLE.forEach((entry) => {
  NOUN_BY_SINGULAR.set(entry[0], entry);
  NOUN_BY_PLURAL.set(entry[1], entry);
});

const ALL_SINGULARS_PATTERN = ITALIAN_NOUN_TABLE.map((n) => n[0]).join('|');
const ALL_PLURALS_PATTERN = ITALIAN_NOUN_TABLE.map((n) => n[1]).join('|');
const ALL_FEM_VOWEL_PATTERN = ITALIAN_NOUN_TABLE.filter((n) => n[2] === 'fv')
  .map((n) => n[0])
  .concat(['altra', 'erba', 'uva', 'estate'])
  .join('|');
const ALL_MASC_VOWEL_PATTERN = ITALIAN_NOUN_TABLE.filter((n) => n[2] === 'mv')
  .map((n) => n[0])
  .concat(['universo'])
  .join('|');
const ALL_MASC_S_IMPURA_PATTERN = ITALIAN_NOUN_TABLE.filter((n) => n[2] === 'ms')
  .map((n) => n[0])
  .join('|');
const ALL_MASC_GLI_PLURALS_PATTERN = ITALIAN_NOUN_TABLE.filter(
  (n) => n[2] === 'mv' || n[2] === 'ms'
)
  .map((n) => n[1])
  .join('|');

const REGEX_ONE_WITH_PLURAL = new RegExp(
  `\\b(1|un'|un|uno|una)\\s+(${ALL_PLURALS_PATTERN})\\b`,
  'gi'
);
const REGEX_ONE_WITH_SINGULAR = new RegExp(
  `\\b(1|uno|una|un)\\s+(${ALL_SINGULARS_PATTERN})\\b`,
  'gi'
);
const REGEX_PLURAL_NUM_WITH_SINGULAR = new RegExp(
  `\\b([2-9]|10|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\\s+(${ALL_SINGULARS_PATTERN})\\b`,
  'gi'
);
const REGEX_COUNTABLE_DIGIT_BEFORE_PLURAL = new RegExp(
  `\\b([2-9]|10)\\s+(${ALL_PLURALS_PATTERN})\\b`,
  'gi'
);
const REGEX_DEF_ART_FEM_VOWEL = new RegExp(
  `\\b(la|il|lo)\\s+(${ALL_FEM_VOWEL_PATTERN})\\b`,
  'gi'
);
const REGEX_DEF_ART_MASC_VOWEL = new RegExp(
  `\\b(il|lo|la)\\s+(${ALL_MASC_VOWEL_PATTERN})\\b`,
  'gi'
);
const REGEX_DEF_ART_MASC_S_IMPURA = new RegExp(
  `\\b(il)\\s+(${ALL_MASC_S_IMPURA_PATTERN})\\b`,
  'gi'
);
const REGEX_DEF_ART_MASC_GLI = new RegExp(
  `\\b(i)\\s+(${ALL_MASC_GLI_PLURALS_PATTERN})\\b`,
  'gi'
);

function preserveCase(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  if (!/[a-zA-ZÀ-ÿ]/.test(original)) return replacement;
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (/[A-ZÀ-Ü]/.test(original[0])) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function getIndefiniteArticle(kind: NounEntry[2]): string {
  if (kind === 'fv') return "un'";
  if (kind === 'f') return 'una ';
  if (kind === 'ms') return 'uno ';
  return 'un ';
}

const CHILD_GENDER_PAIRS: ReadonlyArray<readonly [fem: string, masc: string]> = [
  ['bravissima', 'bravissimo'],
  ['brava', 'bravo'],
  ['prontissima', 'prontissimo'],
  ['pronta', 'pronto'],
  ['curiosa', 'curioso'],
  ['attenta', 'attento'],
  ['concentrata', 'concentrato'],
  ['contenta', 'contento'],
  ['grandissima', 'grandissimo'],
  ['benvenuta', 'benvenuto'],
  ['bentornata', 'bentornato'],
  ['campionessa', 'campione'],
  ['esploratrice', 'esploratore'],
  ['scienziata', 'scienziato'],
  ['piccola esploratrice', 'piccolo esploratore'],
  ['piccola campionessa', 'piccolo campione'],
  ['amica mia', 'amico mio'],
  ['sei fantastica', 'sei fantastico'],
  ['sei strepitosa', 'sei strepitoso'],
  ['sei sicura', 'sei sicuro'],
  ['sei pronta', 'sei pronto'],
  ['sei bravissima', 'sei bravissimo'],
];

const SLASH_GENDER_RULES: ReadonlyArray<{
  pattern: RegExp;
  fem: string;
  masc: string;
  neutral: string;
}> = [
  { pattern: /\bbambino\s*\/\s*(?:a|bambina)\b/gi, fem: 'bambina', masc: 'bambino', neutral: 'esploratore' },
  { pattern: /\bbambina\s*\/\s*(?:o|bambino)\b/gi, fem: 'bambina', masc: 'bambino', neutral: 'esploratore' },
  { pattern: /\besploratore\s*\/\s*esploratrice\b/gi, fem: 'esploratrice', masc: 'esploratore', neutral: 'esploratore' },
  { pattern: /\bcampione\s*\/\s*campionessa\b/gi, fem: 'campionessa', masc: 'campione', neutral: 'campione' },
  { pattern: /\bbravissimo\s*\/\s*a\b/gi, fem: 'bravissima', masc: 'bravissimo', neutral: 'bravissimo' },
  { pattern: /\bbravo\s*\/\s*a\b/gi, fem: 'brava', masc: 'bravo', neutral: 'bravo' },
  { pattern: /\bpronto\s*\/\s*a\b/gi, fem: 'pronta', masc: 'pronto', neutral: 'pronto' },
  { pattern: /\bbenvenuto\s*\/\s*a\b/gi, fem: 'benvenuta', masc: 'benvenuto', neutral: 'benvenuto' },
  { pattern: /\bcurioso\s*\/\s*a\b/gi, fem: 'curiosa', masc: 'curioso', neutral: 'curioso' },
  { pattern: /\bscienziato\s*\/\s*a\b/gi, fem: 'scienziata', masc: 'scienziato', neutral: 'scienziato' },
  { pattern: /\bpronto\(a\)\b/gi, fem: 'pronta', masc: 'pronto', neutral: 'pronto' },
  { pattern: /\bbravo\(a\)\b/gi, fem: 'brava', masc: 'bravo', neutral: 'bravo' },
];

/**
 * Enforces strict Italian grammatical gender (masculine/feminine/neutral),
 * singular/plural number agreement, definite/indefinite article & elision rules,
 * and cleans visual symbols/emojis before TTS synthesis.
 */
export function enforceItalianGenderConcordance(
  text: string,
  childGender?: ChildGender
): string {
  let s = text;

  // 1. Normalize mathematical symbols, roots, powers & fractions into natural Italian speech
  s = s
    .replace(/√\s*(\d+)/g, 'radice quadrata di $1')
    .replace(/(\d+)\s*²/g, '$1 alla seconda')
    .replace(/(\d+)\s*³/g, '$1 alla terza')
    .replace(/(\d+)\s*⁴/g, '$1 alla quarta')
    .replace(/½/g, 'un mezzo')
    .replace(/¼/g, 'un quarto')
    .replace(/⅓/g, 'un terzo')
    .replace(/⅕/g, 'un quinto')
    .replace(/¾/g, 'tre quarti')
    .replace(/⅔/g, 'due terzi')
    .replace(/⅖/g, 'due quinti')
    .replace(/⅗/g, 'tre quinti')
    .replace(/⅜/g, 'tre ottavi')
    .replace(/⅚/g, 'cinque sesti')
    .replace(/(\d+)\s*×\s*(\d+)/g, '$1 per $2')
    .replace(/(\d+)\s*÷\s*(\d+)/g, '$1 diviso $2')
    .replace(/(\d+)\s*−\s*(\d+)/g, '$1 meno $2');

  // 1b. Remove emojis, variation selectors, and decorative UI glyphs that TTS would read awkwardly
  s = s.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}➔➡️❓•★☆✓✔✖]/gu,
    ' '
  );

  // 2. Remove technical tags ("3D", "QI") from spoken stream so the narrator sounds natural
  s = s.replace(/\b3D\b/gi, '');

  // 3. Resolve slash/parenthetical inclusive forms ("bambino/a", "pronto/a") into natural spoken Italian
  for (const rule of SLASH_GENDER_RULES) {
    s = s.replace(rule.pattern, (match) => {
      const target =
        childGender === 'f' ? rule.fem : childGender === 'm' ? rule.masc : rule.neutral;
      return preserveCase(match, target);
    });
  }

  // 4. Harmonize child-addressed adjectives & role nouns with the active child's gender
  if (childGender === 'f' || childGender === 'm') {
    for (const [fem, masc] of CHILD_GENDER_PAIRS) {
      const source = childGender === 'f' ? masc : fem;
      const target = childGender === 'f' ? fem : masc;
      const re = new RegExp(`\\b${source}\\b`, 'gi');
      s = s.replace(re, (match) => preserveCase(match, target));
    }
  }

  // 5. Fix common apostrophe elisions that cause mispronunciation if written without apostrophe
  s = s
    .replace(/\b(?:un|una)\s+altra\b/gi, (m) => preserveCase(m, "un'altra"))
    .replace(/\bd\s+oro\b/gi, "d'oro")
    .replace(/\ball\s+alba\b/gi, "all'alba")
    .replace(/\bl\s+([aeiouàèéìòù])/gi, (_, v) => `l'${v}`);

  // 6. Fix singular verb phrases before "1" ("mancano 1" -> "manca 1", "ci sono 1" -> "c'è 1")
  s = s
    .replace(/\bmancano\s+1\b/gi, (m) => preserveCase(m, 'manca 1'))
    .replace(/\bci\s+sono\s+1\b/gi, (m) => preserveCase(m, "c'è 1"))
    .replace(/\bsono\s+rimasti\s+1\b/gi, (m) => preserveCase(m, 'è rimasto 1'))
    .replace(/\bsono\s+rimaste\s+1\b/gi, (m) => preserveCase(m, 'è rimasta 1'));

  // 7. Fix plural collective expressions with digits:
  //    "tutti gli 3 orsetti" -> "tutti e tre gli orsetti"
  s = s
    .replace(
      /\btutti\s+gli\s+([2-9]|10)\b/gi,
      (_, num) => `tutti e ${NUMBER_WORDS_MASCULINE[num] || num} gli`
    )
    .replace(
      /\btutti\s+i\s+([2-9]|10)\b/gi,
      (_, num) => `tutti e ${NUMBER_WORDS_MASCULINE[num] || num} i`
    )
    .replace(
      /\btutte\s+le\s+([2-9]|10)\b/gi,
      (_, num) => `tutte e ${NUMBER_WORDS_FEMININE[num] || num} le`
    );

  // 8. Fix "1 + plural noun" -> proper singular article + singular noun
  //    e.g. "1 stelle" -> "una stella", "1 errori" -> "un errore", "1 scrigni" -> "uno scrigno", "1 api" -> "un'ape"
  s = s.replace(REGEX_ONE_WITH_PLURAL, (match, art, pluralWord) => {
    const entry = NOUN_BY_PLURAL.get(pluralWord.toLowerCase());
    if (!entry) return match;
    const prefix = preserveCase(art, getIndefiniteArticle(entry[2]));
    return `${prefix}${entry[0]}`;
  });

  // 9. Fix "1/uno/una/un + singular noun" -> exact grammatical Italian indefinite article
  //    e.g. "1 ape" -> "un'ape", "un scoiattolo" -> "uno scoiattolo", "uno mela" -> "una mela"
  s = s.replace(REGEX_ONE_WITH_SINGULAR, (match, art, singularWord) => {
    const entry = NOUN_BY_SINGULAR.get(singularWord.toLowerCase());
    if (!entry) return match;
    const prefix = preserveCase(art, getIndefiniteArticle(entry[2]));
    return `${prefix}${singularWord}`;
  });

  // 10. Fix "2..10 / due..dieci + singular noun" -> Italian number word + plural noun
  //     e.g. "2 stella" -> "due stelle", "3 giorno" -> "tre giorni"
  s = s.replace(REGEX_PLURAL_NUM_WITH_SINGULAR, (match, numToken, singularWord) => {
    const entry = NOUN_BY_SINGULAR.get(singularWord.toLowerCase());
    if (!entry) return match;
    const numLower = numToken.toLowerCase();
    const spokenNum =
      NUMBER_WORDS_FEMININE[numLower] || numToken;
    return `${preserveCase(numToken, spokenNum)} ${entry[1]}`;
  });

  // 11. Convert digits 2..10 directly before plural countable nouns into Italian words
  //     (without corrupting "Livello 5" or multi-digit math values)
  s = s.replace(REGEX_COUNTABLE_DIGIT_BEFORE_PLURAL, (_, num, pluralWord) => {
    const word = NUMBER_WORDS_FEMININE[num] || num;
    return `${word} ${pluralWord}`;
  });

  // 12. Fix definite articles before vowels, s-impura/z/gn, and "gli" plurals
  s = s
    .replace(REGEX_DEF_ART_FEM_VOWEL, (_, art, noun) => `${preserveCase(art, "l'")}${noun}`)
    .replace(REGEX_DEF_ART_MASC_VOWEL, (_, art, noun) => `${preserveCase(art, "l'")}${noun}`)
    .replace(REGEX_DEF_ART_MASC_S_IMPURA, (_, art, noun) => `${preserveCase(art, 'lo')} ${noun}`)
    .replace(REGEX_DEF_ART_MASC_GLI, (_, art, noun) => `${preserveCase(art, 'gli')} ${noun}`);

  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Prepares natural, human-like Italian prosody calibrated to the child's age and speech context.
 */
export function formatItalianProsody(
  text: string,
  context: 'praise' | 'riddle' | 'instruction' | 'count' | 'general' = 'general',
  options?: { childGender?: ChildGender; ageYears?: number }
): {
  prosodyText: string;
  clauses: string[];
  defaultPitch: number;
  defaultRate: number;
} {
  const childGender = options?.childGender;
  const ageYears = options?.ageYears ?? 6;
  let s = enforceItalianGenderConcordance(text.trim(), childGender);

  // Verbalize math, pre-algebra & science operators smoothly in natural Italian
  s = s
    .replace(/%/g, ' per cento')
    .replace(/²/g, ' alla seconda')
    .replace(/³/g, ' alla terza')
    .replace(/⁴/g, ' alla quarta')
    .replace(/√/g, 'radice quadrata di ')
    .replace(/°/g, ' gradi')
    .replace(/½/g, 'un mezzo')
    .replace(/⅓/g, 'un terzo')
    .replace(/¼/g, 'un quarto')
    .replace(/⅕/g, 'un quinto')
    .replace(/⅔/g, 'due terzi')
    .replace(/¾/g, 'tre quarti')
    .replace(/⅖/g, 'due quinti')
    .replace(/⅗/g, 'tre quinti')
    .replace(/⅜/g, 'tre ottavi')
    .replace(/⅚/g, 'cinque sesti')
    .replace(/\+/g, ' più ')
    .replace(/\s[-−]\s/g, ' meno ')
    .replace(/×/g, ' per ')
    .replace(/÷/g, ' diviso ')
    .replace(/=/g, ' fa ')
    .replace(/\s+/g, ' ');

  // Re-run gender & number concordance after operator expansion
  s = enforceItalianGenderConcordance(s, childGender);

  // Clean up artificial ellipses or repeated punctuation that make TTS sound choppy
  s = s
    .replace(/\.{2,}|…/g, ', ')
    .replace(/!+\s*\./g, '!')
    .replace(/\?+\s*\./g, '?')
    .replace(/,\s*,+/g, ', ')
    .replace(/\s*([,.;!?])\s*/g, '$1 ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const isPraise =
    context === 'praise' ||
    /(bravissim|fantastico|fantastica|evviva|meraviglios|perfett|campion|vinto|tris)/i.test(
      s
    );
  const isRiddle =
    context === 'riddle' || /(indovinello|chi sono)/i.test(s);
  const isCount = context === 'count';

  // Age-calibrated natural speaking cadence:
  // Younger kids (2-5) hear clearer, slightly unhurried phrasing; older kids (8-14) get brisk natural rhythm.
  const ageRateOffset =
    ageYears <= 4 ? -0.04 : ageYears <= 6 ? -0.01 : ageYears >= 10 ? 0.03 : 0.01;

  // Keep pitch strictly inside [0.98, 1.05] to prevent robotic phase-vocoder distortion
  let defaultPitch = ageYears >= 10 ? 1.0 : 1.02;
  let defaultRate = 0.97 + ageRateOffset;

  if (isPraise) {
    defaultPitch = ageYears >= 10 ? 1.02 : 1.04;
    defaultRate = 0.99 + ageRateOffset;
  } else if (isRiddle) {
    defaultPitch = 1.01;
    defaultRate = 0.95 + ageRateOffset;
  } else if (isCount) {
    defaultPitch = 1.03;
    defaultRate = 0.99;
  }

  defaultRate = Math.min(1.05, Math.max(0.9, Math.round(defaultRate * 100) / 100));

  const rawClauses = s
    .split(/(?<=[!?.;])\s+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const clauses = rawClauses.length > 0 ? rawClauses : [s];

  return { prosodyText: s, clauses, defaultPitch, defaultRate };
}

class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public voiceEnabled: boolean = true;
  public musicEnabled: boolean = true;
  public neuralTtsEnabled: boolean = true;
  private childGender: ChildGender | undefined = undefined;
  private childName: string = '';
  private childAgeYears: number = 6;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioEl: HTMLAudioElement | null = null;
  private neuralAbortController: AbortController | null = null;
  private neuralAudioCache: Map<string, string> = new Map();
  private neuralFailuresCount: number = 0;
  private neuralCooldownUntil: number = 0;
  private chromeResumeInterval: ReturnType<typeof setInterval> | null = null;
  private isUnlocked: boolean = false;
  private unlockAudioEl: HTMLAudioElement | null = null;
  private speechListeners: Set<(isSpeaking: boolean) => void> = new Set();
  private musicListeners: Set<(enabled: boolean) => void> = new Set();
  public isCurrentlySpeaking: boolean = false;
  private speechSequenceId: number = 0;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private failsafeTimer: ReturnType<typeof setTimeout> | null = null;
  private bgMusicInterval: ReturnType<typeof setInterval> | null = null;
  private bgNoteStep: number = 0;
  private rhythmTimers: ReturnType<typeof setTimeout>[] = [];

  setChildContext(gender?: ChildGender, name?: string, ageYears?: number) {
    this.childGender = gender;
    if (typeof name === 'string') {
      this.childName = name.trim();
    }
    if (typeof ageYears === 'number' && Number.isFinite(ageYears)) {
      this.childAgeYears = Math.max(2, Math.min(14, Math.round(ageYears)));
    }
  }

  getChildContext() {
    return {
      gender: this.childGender,
      name: this.childName,
      ageYears: this.childAgeYears,
    };
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoices();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }

      try {
        this.unlockAudioEl = new Audio(SILENT_WAV);
      } catch {
        // ignore
      }

      const unlockListener = () => {
        this.unlockAudio();
      };

      window.addEventListener('touchstart', unlockListener, {
        passive: true,
        once: false,
      });
      window.addEventListener('touchend', unlockListener, {
        passive: true,
        once: false,
      });
      window.addEventListener('pointerdown', unlockListener, {
        passive: true,
        once: false,
      });
      window.addEventListener('click', unlockListener, {
        passive: true,
        once: false,
      });
    }
  }

  onSpeakingChange(listener: (isSpeaking: boolean) => void) {
    this.speechListeners.add(listener);
    return () => {
      this.speechListeners.delete(listener);
    };
  }

  onMusicChange(listener: (enabled: boolean) => void) {
    this.musicListeners.add(listener);
    return () => {
      this.musicListeners.delete(listener);
    };
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled && this.soundEnabled) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
    this.musicListeners.forEach((fn) => {
      try {
        fn(this.musicEnabled);
      } catch {
        // ignore
      }
    });
    return this.musicEnabled;
  }

  startBackgroundMusic() {
    if (!this.musicEnabled || !this.soundEnabled) return;
    if (this.bgMusicInterval) return;

    const melodyNotes = [
      523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33, 523.25,
      587.33, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25,
    ];

    this.bgMusicInterval = setInterval(() => {
      if (!this.musicEnabled || !this.soundEnabled) return;
      try {
        this.initCtx();
        if (!this.ctx || this.ctx.state !== 'running') return;

        const freq = melodyNotes[this.bgNoteStep % melodyNotes.length];
        this.bgNoteStep++;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const targetVol = this.isCurrentlySpeaking ? 0.006 : 0.03;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(targetVol, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.42);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.44);
      } catch {
        // ignore
      }
    }, 480);
  }

  stopBackgroundMusic() {
    if (this.bgMusicInterval) {
      clearInterval(this.bgMusicInterval);
      this.bgMusicInterval = null;
    }
  }

  private setSpeaking(val: boolean) {
    if (this.isCurrentlySpeaking === val) return;
    this.isCurrentlySpeaking = val;
    this.speechListeners.forEach((fn) => {
      try {
        fn(val);
      } catch {
        // ignore
      }
    });
  }

  /**
   * Scores and selects the most realistic, neural/natural Italian female voice available on the device.
   */
  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const allVoices = window.speechSynthesis.getVoices() || [];
      if (allVoices.length === 0) return;
      this.voices = allVoices;

      const itVoices = allVoices.filter((v) =>
        v.lang.toLowerCase().startsWith('it')
      );
      if (itVoices.length > 0) {
        const isMaleVoice = (name: string) =>
          /(cosimo|luca|giorgio|diego|nicola|paolo|male|maschile|uomo)/i.test(
            name
          );

        const femaleOrNeutralVoices = itVoices.filter(
          (v) => !isMaleVoice(v.name)
        );
        const pool =
          femaleOrNeutralVoices.length > 0 ? femaleOrNeutralVoices : itVoices;

        const scoreVoice = (v: SpeechSynthesisVoice): number => {
          const n = v.name.toLowerCase();
          let score = 0;
          if (v.lang.toLowerCase() === 'it-it') score += 20;
          // Cloud / Neural / Natural voices are far more human and expressive
          if (
            n.includes('natural') ||
            n.includes('neural') ||
            n.includes('online')
          ) {
            score += 60;
          }
          if (
            n.includes('premium') ||
            n.includes('enhanced') ||
            n.includes('migliorata') ||
            n.includes('siri')
          ) {
            score += 45;
          }
          if (!v.localService) {
            score += 25;
          }
          if (
            n.includes('elsa') ||
            n.includes('isabella') ||
            n.includes('alice') ||
            n.includes('federica') ||
            n.includes('fabiola') ||
            n.includes('chiara')
          ) {
            score += 30;
          }
          if (n.includes('google italiano') || n.includes('google')) {
            score += 35;
          }
          if (n.includes('compact') || n.includes('espeak')) {
            score -= 50;
          }
          return score;
        };

        const sorted = [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a));
        this.selectedVoice = sorted[0];
      }
    } catch {
      this.voices = [];
    }
  }

  unlockAudio() {
    try {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      if (this.unlockAudioEl && !this.isUnlocked) {
        const playPromise = this.unlockAudioEl.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.isUnlocked = true;
            })
            .catch(() => {});
        }
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (!this.selectedVoice) {
          this.initVoices();
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    } catch {
      // ignore
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playPop() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  playTwinkle() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const freqs = [659.25, 783.99, 987.77, 1318.51];
      const now = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + idx * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {
      // ignore
    }
  }

  playSuccess() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // ignore
    }
  }

  playFanfare() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const melody = [
        { freq: 523.25, time: 0.0, dur: 0.12 },
        { freq: 659.25, time: 0.12, dur: 0.12 },
        { freq: 783.99, time: 0.24, dur: 0.12 },
        { freq: 1046.5, time: 0.36, dur: 0.35 },
        { freq: 880.0, time: 0.75, dur: 0.12 },
        { freq: 1046.5, time: 0.88, dur: 0.45 },
      ];
      const now = this.ctx.currentTime;

      melody.forEach((item) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + item.time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + item.dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + item.dur);
      });
    } catch {
      // ignore
    }
  }

  playEncouragement() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(520, now + 0.16);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  playAnimalChirp(count = 3) {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const pitches = [520, 580, 640, 720];
      const now = this.ctx.currentTime;

      for (let i = 0; i < count; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.09;
        const freq = pitches[i % pitches.length];

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(freq + 40, t + 0.07);

        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.08);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Plays a playful synthesized 3D animal sound effect for the "Zoo Parlante"
   * (Leone roar, Giraffa tall musical glissando, Elefante trumpet, etc.)
   */
  playZooAnimalSound(animalId: string) {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const id = animalId.toLowerCase();
      if (id === 'leone' || id === 'lion') {
        // Playful warm low brassy lion roar (Roaaar!)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(140, now);
        osc1.frequency.linearRampToValueAtTime(210, now + 0.16);
        osc1.frequency.exponentialRampToValueAtTime(95, now + 0.52);

        osc2.frequency.setValueAtTime(280, now);
        osc2.frequency.linearRampToValueAtTime(360, now + 0.16);
        osc2.frequency.exponentialRampToValueAtTime(160, now + 0.52);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.56);
        osc2.stop(now + 0.56);
      } else if (id === 'giraffa' || id === 'giraffe') {
        // Rising tall-neck xylophone glissando + cheerful munch notes
        const notes = [392.0, 493.88, 587.33, 783.99, 987.77];
        notes.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const t = now + idx * 0.075;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.linearRampToValueAtTime(freq * 1.06, t + 0.11);

          gain.gain.setValueAtTime(0.13, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(t);
          osc.stop(t + 0.15);
        });
      } else if (id === 'elefante' || id === 'elephant') {
        // Cheerful elephant trunk trumpet (Pa-uuuh!)
        const notes = [
          { fStart: 293.66, fEnd: 587.33, delay: 0, dur: 0.22 },
          { fStart: 587.33, fEnd: 880.0, delay: 0.2, dur: 0.34 },
        ];
        notes.forEach((n) => {
          const osc = this.ctx!.createOscillator();
          const harmonic = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const t = now + n.delay;

          osc.type = 'sawtooth';
          harmonic.type = 'triangle';

          osc.frequency.setValueAtTime(n.fStart, t);
          osc.frequency.exponentialRampToValueAtTime(n.fEnd, t + n.dur * 0.7);

          harmonic.frequency.setValueAtTime(n.fStart * 1.5, t);
          harmonic.frequency.exponentialRampToValueAtTime(n.fEnd * 1.5, t + n.dur * 0.7);

          gain.gain.setValueAtTime(0.01, t);
          gain.gain.linearRampToValueAtTime(0.14, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

          osc.connect(gain);
          harmonic.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(t);
          harmonic.start(t);
          osc.stop(t + n.dur + 0.02);
          harmonic.stop(t + n.dur + 0.02);
        });
      } else if (id === 'cammello' || id === 'camel') {
        // Warm rhythmic desert camel hum (Brrr-huu!)
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(175, now);
        osc.frequency.linearRampToValueAtTime(145, now + 0.28);
        osc.frequency.linearRampToValueAtTime(195, now + 0.48);

        lfo.frequency.setValueAtTime(14, now);
        lfoGain.gain.setValueAtTime(16, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.54);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        lfo.start(now);
        osc.stop(now + 0.55);
        lfo.stop(now + 0.55);
      } else if (id === 'zebra') {
        // Bright playful zebra whinny (Hiii-ha!)
        const freqs = [660, 784, 622, 523];
        freqs.forEach((f, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const t = now + idx * 0.09;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t);
          osc.frequency.exponentialRampToValueAtTime(f * 0.86, t + 0.09);
          gain.gain.setValueAtTime(0.14, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(t);
          osc.stop(t + 0.12);
        });
      } else {
        this.playAnimalChirp(4);
      }
    } catch {
      // ignore
    }
  }

  playMusicalNote(freq: number, duration = 0.32) {
    if (!this.soundEnabled || freq <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const harmonic = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const harmonicGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(freq * 2, now);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      harmonicGain.gain.setValueAtTime(0.05, now);
      harmonicGain.gain.exponentialRampToValueAtTime(
        0.001,
        now + duration * 0.65
      );

      osc.connect(gain);
      harmonic.connect(harmonicGain);
      gain.connect(this.ctx.destination);
      harmonicGain.connect(this.ctx.destination);

      osc.start(now);
      harmonic.start(now);
      osc.stop(now + duration);
      harmonic.stop(now + duration);
    } catch {
      // ignore
    }
  }

  stopRhythmSequence() {
    this.rhythmTimers.forEach((t) => clearTimeout(t));
    this.rhythmTimers = [];
  }

  playRhythmSequence(notes: { freq: number; duration: number }[]) {
    this.stopRhythmSequence();
    if (!this.soundEnabled || !notes || notes.length === 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      let offsetMs = 0;
      notes.forEach((n) => {
        const durSec = Math.max(0.15, n.duration || 0.3);
        const timer = setTimeout(() => {
          this.playMusicalNote(n.freq, durSec);
        }, offsetMs);
        this.rhythmTimers.push(timer);
        offsetMs += Math.round((durSec + 0.08) * 1000);
      });
    } catch {
      // ignore
    }
  }

  stopSpeech() {
    this.speechSequenceId++;
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    if (this.failsafeTimer) {
      clearTimeout(this.failsafeTimer);
      this.failsafeTimer = null;
    }
    if (this.chromeResumeInterval) {
      clearInterval(this.chromeResumeInterval);
      this.chromeResumeInterval = null;
    }
    if (this.neuralAbortController) {
      try {
        this.neuralAbortController.abort();
      } catch {
        // ignore
      }
      this.neuralAbortController = null;
    }
    if (this.currentAudioEl) {
      try {
        this.currentAudioEl.onended = null;
        this.currentAudioEl.onerror = null;
        this.currentAudioEl.pause();
        this.currentAudioEl.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudioEl = null;
    }
    this.setSpeaking(false);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.currentUtterance = null;
  }

  private getCachedNeuralUrl(cacheKey: string): string | undefined {
    const existing = this.neuralAudioCache.get(cacheKey);
    if (!existing) return undefined;
    this.neuralAudioCache.delete(cacheKey);
    this.neuralAudioCache.set(cacheKey, existing);
    return existing;
  }

  private setCachedNeuralUrl(cacheKey: string, url: string) {
    if (this.neuralAudioCache.has(cacheKey)) {
      this.neuralAudioCache.delete(cacheKey);
    } else if (this.neuralAudioCache.size >= 80) {
      const oldestKey = this.neuralAudioCache.keys().next().value;
      if (oldestKey !== undefined) {
        const oldUrl = this.neuralAudioCache.get(oldestKey);
        if (oldUrl && oldUrl.startsWith('blob:') && typeof URL !== 'undefined') {
          try {
            URL.revokeObjectURL(oldUrl);
          } catch {
            // ignore
          }
        }
        this.neuralAudioCache.delete(oldestKey);
      }
    }
    this.neuralAudioCache.set(cacheKey, url);
  }

  private async trySpeakNeural(
    prosodyText: string,
    context: 'praise' | 'riddle' | 'instruction' | 'general',
    ageYears: number,
    currentSeq: number,
    onDone: () => void
  ): Promise<boolean> {
    if (
      !this.neuralTtsEnabled ||
      typeof window === 'undefined' ||
      typeof fetch !== 'function' ||
      Date.now() < this.neuralCooldownUntil
    ) {
      return false;
    }

    const ageBucket = ageYears <= 5 ? 'young' : ageYears <= 9 ? 'mid' : 'teen';
    const cacheKey = `${ageBucket}|${context}|${prosodyText.toLowerCase()}`;

    let audioUrl = this.getCachedNeuralUrl(cacheKey);

    if (!audioUrl) {
      const controller = new AbortController();
      this.neuralAbortController = controller;
      const timeoutId = setTimeout(() => controller.abort(), 2400);

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: prosodyText,
            context,
            ageYears,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (this.speechSequenceId !== currentSeq) {
          return true; // superseded cleanly
        }
        if (!res.ok) {
          throw new Error(`TTS HTTP ${res.status}`);
        }

        const payload = (await res.json()) as {
          audioData?: string;
          mimeType?: string;
        };
        if (!payload?.audioData) {
          throw new Error('Empty audio payload');
        }

        const mimeType = payload.mimeType || 'audio/wav';
        const binaryStr = window.atob(payload.audioData);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        audioUrl = URL.createObjectURL(blob);
        this.setCachedNeuralUrl(cacheKey, audioUrl);
        this.neuralFailuresCount = 0;
      } catch {
        clearTimeout(timeoutId);
        if (this.speechSequenceId !== currentSeq) {
          return true; // aborted due to newer speech call
        }
        this.neuralFailuresCount++;
        if (this.neuralFailuresCount >= 3) {
          this.neuralCooldownUntil = Date.now() + 60_000;
          this.neuralFailuresCount = 0;
        }
        return false;
      } finally {
        if (this.neuralAbortController === controller) {
          this.neuralAbortController = null;
        }
      }
    }

    if (this.speechSequenceId !== currentSeq || !audioUrl) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      try {
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audio.volume = 0.98;
        this.currentAudioEl = audio;

        let settled = false;
        const finishPlayback = () => {
          if (settled) return;
          settled = true;
          if (this.failsafeTimer) {
            clearTimeout(this.failsafeTimer);
            this.failsafeTimer = null;
          }
          if (this.currentAudioEl === audio) {
            this.currentAudioEl = null;
          }
          if (this.speechSequenceId === currentSeq) {
            this.setSpeaking(false);
            onDone();
          }
        };

        audio.onended = finishPlayback;
        audio.onerror = () => {
          if (settled) return;
          settled = true;
          if (this.currentAudioEl === audio) {
            this.currentAudioEl = null;
          }
          resolve(false);
        };

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise
            .then(() => {
              if (this.speechSequenceId !== currentSeq) {
                audio.pause();
                resolve(true);
                return;
              }
              this.setSpeaking(true);
              const maxDurationMs = Math.max(
                4500,
                Math.min(28_000, prosodyText.length * 130)
              );
              this.failsafeTimer = setTimeout(finishPlayback, maxDurationMs);
              resolve(true);
            })
            .catch(() => {
              if (this.currentAudioEl === audio) {
                this.currentAudioEl = null;
              }
              resolve(false);
            });
        } else {
          this.setSpeaking(true);
          resolve(true);
        }
      } catch {
        resolve(false);
      }
    });
  }

  private speakWithWebSpeech(
    prosody: ReturnType<typeof formatItalianProsody>,
    options: ProsodyOptions,
    currentSeq: number,
    wasSpeaking: boolean
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.setSpeaking(true);
      this.playAnimalChirp(3);
      this.pendingTimer = setTimeout(() => {
        if (this.speechSequenceId === currentSeq) {
          this.setSpeaking(false);
          if (options.onEnd) options.onEnd();
        }
      }, 800);
      return;
    }

    const clauses = prosody.clauses;

    // Chrome/Chromium SpeechSynthesis pauses silently after ~15s; periodic resume keeps narration fluid
    if (this.chromeResumeInterval) {
      clearInterval(this.chromeResumeInterval);
    }
    this.chromeResumeInterval = setInterval(() => {
      if (this.speechSequenceId !== currentSeq) {
        if (this.chromeResumeInterval) {
          clearInterval(this.chromeResumeInterval);
          this.chromeResumeInterval = null;
        }
        return;
      }
      try {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }
    }, 8000);

    const speakClauseAtIndex = (idx: number) => {
      if (this.speechSequenceId !== currentSeq) return;
      if (idx >= clauses.length) {
        if (this.chromeResumeInterval) {
          clearInterval(this.chromeResumeInterval);
          this.chromeResumeInterval = null;
        }
        this.currentUtterance = null;
        this.setSpeaking(false);
        if (options.onEnd) options.onEnd();
        return;
      }

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const clauseText = clauses[idx];
        const utterance = new SpeechSynthesisUtterance(clauseText);
        utterance.lang = 'it-IT';

        // Gentle natural prosodic contour across clauses:
        // Questions rise gently; exclamations carry warm energy; pitch stays strictly inside [0.98, 1.06].
        const requestedPitch = options.pitch
          ? Math.min(1.05, Math.max(0.98, 1.0 + (options.pitch - 1.0) * 0.2))
          : prosody.defaultPitch;
        const clausePitchOffset = clauseText.endsWith('?')
          ? 0.025
          : clauseText.endsWith('!')
          ? 0.015
          : idx === 0 && clauses.length > 1
          ? 0.01
          : 0;

        utterance.pitch = Math.min(
          1.06,
          Math.max(0.98, requestedPitch + clausePitchOffset)
        );
        utterance.rate = Math.min(
          1.06,
          Math.max(0.9, options.rate || prosody.defaultRate)
        );
        utterance.volume = 0.96;

        if (!this.selectedVoice) {
          this.initVoices();
        }
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }

        let clauseFinished = false;
        const handleClauseDone = () => {
          if (clauseFinished) return;
          clauseFinished = true;
          if (this.failsafeTimer) {
            clearTimeout(this.failsafeTimer);
            this.failsafeTimer = null;
          }
          if (this.speechSequenceId !== currentSeq) return;

          if (idx + 1 < clauses.length) {
            const pauseMs = clauseText.endsWith('?') ? 125 : 95;
            this.pendingTimer = setTimeout(() => {
              speakClauseAtIndex(idx + 1);
            }, pauseMs);
          } else {
            if (this.chromeResumeInterval) {
              clearInterval(this.chromeResumeInterval);
              this.chromeResumeInterval = null;
            }
            this.currentUtterance = null;
            this.setSpeaking(false);
            if (options.onEnd) options.onEnd();
          }
        };

        utterance.onstart = () => {
          if (this.speechSequenceId === currentSeq) {
            this.setSpeaking(true);
          }
        };

        utterance.onend = handleClauseDone;
        utterance.onerror = (e) => {
          if (e.error === 'canceled' || e.error === 'interrupted') {
            return;
          }
          handleClauseDone();
        };

        this.currentUtterance = utterance;
        this.setSpeaking(true);
        window.speechSynthesis.speak(utterance);

        const estimatedDurationMs = Math.max(
          2000,
          (clauseText.length / 6.5) * 1000
        );
        this.failsafeTimer = setTimeout(() => {
          if (this.speechSequenceId === currentSeq && !clauseFinished) {
            handleClauseDone();
          }
        }, estimatedDurationMs);
      } catch {
        this.playAnimalChirp(3);
        this.pendingTimer = setTimeout(() => {
          if (this.speechSequenceId === currentSeq) {
            this.setSpeaking(false);
            if (options.onEnd) options.onEnd();
          }
        }, 800);
      }
    };

    if (wasSpeaking) {
      this.pendingTimer = setTimeout(() => speakClauseAtIndex(0), 40);
    } else {
      speakClauseAtIndex(0);
    }
  }

  /**
   * Speaks Italian text with strict gender/number grammar correction and natural prosody:
   * - Tier 1: Warm Neural Gemini TTS (/api/tts) with LRU cache for expressive narration
   * - Tier 2: Instant optimized Web Speech API for zero-latency counting or seamless fallback
   */
  speak(
    text: string,
    optionsOrPitch?: number | ProsodyOptions,
    onEndCallback?: () => void
  ) {
    if (!this.voiceEnabled || !text || text.trim() === '') {
      if (typeof optionsOrPitch === 'object' && optionsOrPitch.onEnd) {
        optionsOrPitch.onEnd();
      } else if (onEndCallback) {
        onEndCallback();
      }
      return;
    }

    const options: ProsodyOptions =
      typeof optionsOrPitch === 'object'
        ? optionsOrPitch
        : {
            pitch:
              typeof optionsOrPitch === 'number' ? optionsOrPitch : undefined,
            onEnd: onEndCallback,
          };

    const cleanText = text.trim();
    this.unlockAudio();

    const wasSpeaking =
      Boolean(this.currentAudioEl) ||
      (typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        (window.speechSynthesis.speaking || window.speechSynthesis.pending));

    this.stopSpeech();
    const currentSeq = this.speechSequenceId;

    const effectiveGender = options.childGender ?? this.childGender;
    const effectiveAge = options.ageYears ?? this.childAgeYears;
    const prosody = formatItalianProsody(cleanText, options.context, {
      childGender: effectiveGender,
      ageYears: effectiveAge,
    });

    if (!prosody.prosodyText) {
      if (options.onEnd) options.onEnd();
      return;
    }

    const useInstantLocal =
      options.preferInstant ||
      options.context === 'count' ||
      prosody.prosodyText.length < 4 ||
      prosody.prosodyText.length > 420;

    if (!useInstantLocal && this.neuralTtsEnabled && typeof window !== 'undefined') {
      const neuralCtx =
        options.context === 'praise' ||
        options.context === 'riddle' ||
        options.context === 'instruction'
          ? options.context
          : 'general';

      void this.trySpeakNeural(
        prosody.prosodyText,
        neuralCtx,
        effectiveAge,
        currentSeq,
        () => {
          if (options.onEnd) options.onEnd();
        }
      ).then((playedNeural) => {
        if (!playedNeural && this.speechSequenceId === currentSeq) {
          this.speakWithWebSpeech(prosody, options, currentSeq, false);
        }
      });
      return;
    }

    this.speakWithWebSpeech(prosody, options, currentSeq, wasSpeaking);
  }

  speakPraise(text: string, onEnd?: () => void) {
    this.speak(text, { context: 'praise', onEnd });
  }

  speakRiddle(text: string, onEnd?: () => void) {
    this.speak(text, { context: 'riddle', onEnd });
  }

  speakInstruction(text: string, onEnd?: () => void) {
    this.speak(text, { context: 'instruction', onEnd });
  }
}

export const soundManager = new SoundManager();
