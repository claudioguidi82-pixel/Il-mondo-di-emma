import { AgeBandId, ChildGender, ChildProfile } from '../types/game';

export const DEFAULT_BIRTH_DATE = '2021-01-01';

export const DEFAULT_CHILD_PROFILE: ChildProfile = {
  name: '',
  surname: '',
  birthDate: '',
  gender: 'n',
  customBackgroundUrl: undefined,
  isConfigured: false,
};

export interface ChildAgeInfo {
  years: number;
  months: number;
  totalMonths: number;
  birthYear: number;
  birthMonth: number; // 1..12
  birthDay: number;   // 1..31
  birthDateIso: string;
  birthDateFormatted: string; // DD/MM/YYYY
  displayText: string;        // es. "5 anni e 3 mesi"
  shortAgeLabel: string;      // es. "5 Anni"
  ageBand: AgeBandId;
  ageBandTitle: string;
  developmentalStage: string;
  curriculumSummary: string;
  subjectsHighlight: string[];
  difficultyBadge: string;
}

export function isValidIsoDate(dateStr?: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (y < 2005 || y > new Date().getFullYear() + 1) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const check = new Date(y, m - 1, d);
  return check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d;
}

export function parseBirthDateParts(birthDate?: string): { year: number; month: number; day: number; iso: string } {
  const safeIso = isValidIsoDate(birthDate) ? birthDate!.trim() : DEFAULT_BIRTH_DATE;
  const [yStr, mStr, dStr] = safeIso.split('-');
  return {
    year: Number(yStr),
    month: Number(mStr),
    day: Number(dStr),
    iso: safeIso,
  };
}

export function calculateChildAge(
  birthDate?: string,
  currentDate: Date = new Date()
): ChildAgeInfo {
  const { year: birthYear, month: birthMonth, day: birthDay, iso } = parseBirthDateParts(birthDate);

  let years = currentDate.getFullYear() - birthYear;
  let months = currentDate.getMonth() + 1 - birthMonth;

  if (currentDate.getDate() < birthDay) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  // Keep age in a sensible educational range (2..14)
  if (years < 2) {
    years = 2;
    months = Math.max(0, months);
  }
  if (years > 14) {
    years = 14;
    months = 0;
  }

  const totalMonths = years * 12 + months;
  const dd = String(birthDay).padStart(2, '0');
  const mm = String(birthMonth).padStart(2, '0');
  const birthDateFormatted = `${dd}/${mm}/${birthYear}`;
  const displayText =
    months === 0
      ? `${years} ${years === 1 ? 'anno' : 'anni'}`
      : `${years} ${years === 1 ? 'anno' : 'anni'} e ${months} ${months === 1 ? 'mese' : 'mesi'}`;
  const shortAgeLabel = `${years} ${years === 1 ? 'Anno' : 'Anni'}`;

  let ageBand: AgeBandId = 'preschool_4_5';
  let ageBandTitle = '4–5 Anni · Scuola dell’Infanzia';
  let developmentalStage =
    'Percorso 4–5 Anni Pre-Primaria (Logica CHC, Sillabe & Rime, Calcolo fino a 10, Scienze, Musica & Inglese)';
  let curriculumSummary =
    'Conteggio 4–9, addizioni e sottrazioni visive fino a 10, rime e sillabe, forme 2D/3D, natura, ritmo musicale e inglese base.';
  let subjectsHighlight = [
    'Logica & Sequenze',
    'Sillabe, Rime & Iniziali',
    'Numeri & Calcolo (fino a 10)',
    'Geometria & Colori',
    'Musica & Strumenti',
    'Inglese Prescolare',
  ];
  let difficultyBadge = 'Livello Infanzia (4–5 anni)';

  if (years <= 3) {
    ageBand = 'toddler_2_3';
    ageBandTitle = '2–3 Anni · Prima Infanzia';
    developmentalStage =
      'Percorso 2–3 Anni Prima Infanzia (Colori, Versi degli Animali, Conteggio 1–4, Forme Base & Ritmi Dolci)';
    curriculumSummary =
      'Riconoscimento colori primari, versi e curiosità degli animali, conteggio guidato 1–4, grande/piccolo, forme base e prime paroline in inglese.';
    subjectsHighlight = [
      'Versi & Animali Amici',
      'Prime Letterine & Suoni',
      'Conteggio Guidato (1–4)',
      'Colori & Forme Semplici',
      'Ritmi Dolci & Suoni',
      'Prime Parole Inglesi',
    ];
    difficultyBadge = 'Livello Primi Passi (2–3 anni)';
  } else if (years >= 6 && years <= 7) {
    ageBand = 'early_primary_6_7';
    ageBandTitle = '6–7 Anni · 1ª–2ª Primaria';
    developmentalStage =
      'Percorso 6–7 Anni Scuola Primaria (Calcolo fino a 20, Sillabe & Ortografia, Analogie Logiche, Geometria & Inglese)';
    curriculumSummary =
      'Addizioni e sottrazioni fino a 20, numeri mancanti, divisione in sillabe e ortografia, analogie logiche, poligoni, teoria musicale e inglese primaria.';
    subjectsHighlight = [
      'Analogie & Matrici Logiche',
      'Lettura, Sillabe & Ortografia',
      'Calcolo Mentale (fino a 20)',
      'Poligoni & Geometria 3D',
      'Scala Musicale & Ritmo',
      'Inglese Primaria',
    ];
    difficultyBadge = 'Livello Primaria Base (6–7 anni)';
  } else if (years >= 8) {
    ageBand = 'primary_8_plus';
    ageBandTitle = '8+ Anni · Primaria Avanzata';
    developmentalStage =
      'Percorso 8+ Anni Primaria Avanzata (Calcolo & Moltiplicazioni fino a 50, Deduzione Logica, Geometria, Scienze & Inglese)';
    curriculumSummary =
      'Calcolo rapido e tabelline/doppi fino a 50, serie numeriche avanzate, deduzione e scienze, geometria e angoli, lessico italiano e inglese avanzato.';
    subjectsHighlight = [
      'Deduzione & Serie Logiche',
      'Lessico, Grammatica & Enigmi',
      'Aritmetica & Tabelline (fino a 50)',
      'Geometria, Angoli & Spazio',
      'Teoria Musicale & Orchestra',
      'Inglese Avanzato',
    ];
    difficultyBadge = 'Livello Esploratore Avanzato (8+ anni)';
  }

  return {
    years,
    months,
    totalMonths,
    birthYear,
    birthMonth,
    birthDay,
    birthDateIso: iso,
    birthDateFormatted,
    displayText,
    shortAgeLabel,
    ageBand,
    ageBandTitle,
    developmentalStage,
    curriculumSummary,
    subjectsHighlight,
    difficultyBadge,
  };
}

export function getDisplayChildName(profile?: ChildProfile): string {
  const clean = profile?.name?.trim();
  if (clean) return clean;
  if (profile?.gender === 'f') return 'Piccola Esploratrice';
  if (profile?.gender === 'm') return 'Piccolo Esploratore';
  return 'Esploratore';
}

export function getFullChildName(profile?: ChildProfile): string {
  const name = profile?.name?.trim();
  const surname = profile?.surname?.trim();
  if (name && surname) return `${name} ${surname}`;
  if (name) return name;
  return 'Bambino / Bambina';
}

export function getWorldTitle(profile?: ChildProfile): { prefix: string; childName: string | null; full: string } {
  const clean = profile?.name?.trim();
  if (clean) {
    return {
      prefix: 'Il Mondo di ',
      childName: clean,
      full: `Il Mondo di ${clean}`,
    };
  }
  return {
    prefix: 'Il Mio ',
    childName: 'Mondo',
    full: 'Il Mio Mondo',
  };
}

export function getGenderedWord(
  gender: ChildGender | undefined,
  fem: string,
  masc: string,
  neutral?: string
): string {
  if (gender === 'f') return fem;
  if (gender === 'm') return masc;
  return neutral ?? masc;
}

/**
 * Compresses an uploaded image File into a lightweight JPEG Data URL (<= ~150KB)
 * so it can be stored safely in localStorage and rendered crisply full-screen.
 */
export function compressUploadedImage(
  file: File,
  maxDimension = 1280,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Seleziona un file immagine valido (JPG, PNG, WEBP).'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      reject(new Error('L\'immagine supera i 20 MB. Scegli una foto più leggera.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossibile leggere la foto selezionata.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato immagine non supportato dal browser.'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas non disponibile per l\'elaborazione dell\'immagine.'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Errore durante la compressione della foto.'));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
