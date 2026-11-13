// Natural & Realistic Italian Voice & Audio Engine for "Il Mondo di Emma"
// Designed for 5-Year-Old Emma:
// - Warm, natural human prosody (no metallic pitch-shifting or time-stretch warble)
// - Sentence-level natural breathing & intonation contours
// - Strict Italian masculine/feminine and singular/plural grammatical concordance
// - Automatic stripping of emojis and symbols so TTS only reads clean natural Italian

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

export interface ProsodyOptions {
  context?: 'praise' | 'riddle' | 'instruction' | 'count' | 'general';
  pitch?: number;
  rate?: number;
  onEnd?: () => void;
}

const FEMININE_VOWEL_NOUNS =
  'arancia|ape|anatra|ombra|onda|uva|altra|idea|isola|elica|erba|ora';

const FEMININE_CONSONANT_NOUNS =
  'mela|fragolina|fragola|stellina|stella|farfallina|farfalla|carota|carotina|banana|pera|ciliegia|fetta|pallina|palla|macchinina|nuvola|rosa|chiocciola|chiocciolina|tartaruga|giraffa|pecorella|mucca|gallina|ranocchia|ranocchietta|scimmietta|scimmia|volpina|volpe|rondine|formica|formichina|scarpa|bicicletta|figura|forma|lettera|parola|parolina|nota|campanella|chitarra|tromba|arpa|torta|casa|casetta|corona|bacchetta|gemma|luna|foglia|ninfea|bolla|coppia|partita';

const MASCULINE_NOUNS =
  'biscottino|biscotto|palloncino|pallone|delfino|orsetto|orso|coniglietto|coniglio|cagnolino|cane|gattino|gatto|pesciolino|pesce|fiorellino|fiore|sole|albero|germoglio|cavallino|cavallo|topolino|topo|maialino|gallo|pulcino|uccellino|scoiattolo|scoiattolino|elefante|leone|ghepardo|gufo|gufetto|cerchio|quadrato|triangolo|cuore|cuoricino|tamburo|tamburello|pianoforte|violino|sasso|funghetto|ombrello|orologio|semaforo|cappello|passo|gruppo|tesoro|numero|colore|suono|ritmo|strumento';

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

/**
 * Enforces strict Italian grammatical gender & number concordance (masculine/feminine, singular/plural)
 * and cleans visual symbols/emojis so spoken TTS is 100% grammatically and phonetically natural.
 */
export function enforceItalianGenderConcordance(text: string): string {
  let s = text;

  // 1. Remove emojis, variation selectors, and decorative arrows/question symbols that TTS would read aloud
  s = s.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}➔➡️❓•]/gu,
    ' '
  );

  // 2. Remove "3D" or "QI" technical tags from spoken stream so the voice sounds like a real teacher
  s = s.replace(/\b3D\b/gi, '');

  // 3. Fix common apostrophe elisions that cause mispronunciation if written without apostrophe
  s = s
    .replace(/\bun\s+altra\b/gi, "un'altra")
    .replace(/\bd\s+oro\b/gi, "d'oro")
    .replace(/\bl\s+orsetto\b/gi, "l'orsetto")
    .replace(/\bl\s+uccellino\b/gi, "l'uccellino")
    .replace(/\bl\s+elefante\b/gi, "l'elefante")
    .replace(/\bl\s+ape\b/gi, "l'ape")
    .replace(/\bl\s+arcobaleno\b/gi, "l'arcobaleno")
    .replace(/\bl\s+intruso\b/gi, "l'intruso")
    .replace(/\bl\s+ombra\b/gi, "l'ombra")
    .replace(/\ball\s+alba\b/gi, "all'alba");

  // 4. Fix plural collective expressions with numbers:
  //    "tutti gli 3 orsetti" -> "tutti e tre gli orsetti"
  //    "tutti i 3 biscottini" -> "tutti e tre i biscottini"
  //    "tutte le 3 farfalline" -> "tutte e tre le farfalline"
  s = s.replace(
    /\btutti\s+gli\s+([2-9]|10)\b/gi,
    (_, num) => `tutti e ${NUMBER_WORDS_MASCULINE[num] || num} gli`
  );
  s = s.replace(
    /\btutti\s+i\s+([2-9]|10)\b/gi,
    (_, num) => `tutti e ${NUMBER_WORDS_MASCULINE[num] || num} i`
  );
  s = s.replace(
    /\btutte\s+le\s+([2-9]|10)\b/gi,
    (_, num) => `tutte e ${NUMBER_WORDS_FEMININE[num] || num} le`
  );

  // 5. Feminine nouns starting with a vowel: "1 ape" / "uno ape" / "una ape" -> "un'ape"
  const femVowelRegex = new RegExp(
    `\\b(?:1|uno|una)\\s+(${FEMININE_VOWEL_NOUNS})\\b`,
    'gi'
  );
  s = s.replace(femVowelRegex, "un'$1");

  // 6. Feminine nouns starting with a consonant: "1 mela" / "uno mela" -> "una mela"
  const femConsRegex = new RegExp(
    `\\b(?:1|uno)\\s+(${FEMININE_CONSONANT_NOUNS})\\b`,
    'gi'
  );
  s = s.replace(femConsRegex, 'una $1');

  // 7. Masculine nouns: "1 biscottino" / "una biscottino" / "uno biscottino" -> "un biscottino"
  const mascRegex = new RegExp(
    `\\b(?:1|uno|una)\\s+(${MASCULINE_NOUNS})\\b`,
    'gi'
  );
  s = s.replace(mascRegex, 'un $1');

  // 8. Convert digits 2..10 before known feminine/masculine plural nouns into Italian words for smoother prosody
  s = s.replace(/\b([2-9]|10)\b/g, (match) => NUMBER_WORDS_FEMININE[match] || match);

  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Prepares natural, human-like Italian prosody without artificial robotic pauses or pitch distortion.
 */
export function formatItalianProsody(
  text: string,
  context: 'praise' | 'riddle' | 'instruction' | 'count' | 'general' = 'general'
): {
  prosodyText: string;
  clauses: string[];
  defaultPitch: number;
  defaultRate: number;
} {
  let s = enforceItalianGenderConcordance(text.trim());

  // Verbalize math operators smoothly in natural Italian
  s = s
    .replace(/\+/g, ' più ')
    .replace(/\s-\s/g, ' meno ')
    .replace(/=/g, ' fa ')
    .replace(/\s+/g, ' ');

  // Re-run gender & number concordance after operator expansion
  s = enforceItalianGenderConcordance(s);

  // Clean up any artificial ellipses or repeated punctuation that make TTS sound choppy/robotic
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
    /(bravissima|fantastico|evviva|meraviglios|perfett|campionessa|vinto|tris)/i.test(
      s
    );
  const isRiddle =
    context === 'riddle' || /(indovinello|chi sono)/i.test(s);
  const isCount = context === 'count';

  // Keep pitch and rate strictly inside the natural human vocal range (0.95 - 1.04)
  // so neural voices never suffer from metallic phase-vocoder pitch distortion!
  let defaultPitch = 1.02;
  let defaultRate = 0.97;

  if (isPraise) {
    defaultPitch = 1.04;
    defaultRate = 0.99;
  } else if (isRiddle) {
    defaultPitch = 1.01;
    defaultRate = 0.95;
  } else if (isCount) {
    defaultPitch = 1.03;
    defaultRate = 0.98;
  }

  // Split into natural sentence clauses so multi-sentence texts have a human breathing pause
  // and gentle intonational variation between sentences
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
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
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

  /**
   * Speaks Italian text with natural human prosody, sentence-level intonation,
   * and zero metallic pitch-shift distortion.
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
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      (window.speechSynthesis.speaking || window.speechSynthesis.pending);

    this.stopSpeech();
    const currentSeq = this.speechSequenceId;

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

    const prosody = formatItalianProsody(cleanText, options.context);
    const clauses = prosody.clauses;

    const speakClauseAtIndex = (idx: number) => {
      if (this.speechSequenceId !== currentSeq) return;
      if (idx >= clauses.length) {
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
        // First clause has warm welcoming energy; follow-up clauses settle into calm storyteller cadence.
        // Clamp pitch strictly to [0.98, 1.05] to avoid robotic/metallic DSP artifacts.
        const requestedPitch = options.pitch
          ? Math.min(1.05, Math.max(0.98, 1.0 + (options.pitch - 1.0) * 0.2))
          : prosody.defaultPitch;
        const clausePitchOffset =
          idx === 0 && clauses.length > 1
            ? 0.01
            : clauseText.endsWith('?')
            ? 0.02
            : 0;

        utterance.pitch = Math.min(
          1.05,
          Math.max(0.98, requestedPitch + clausePitchOffset)
        );
        utterance.rate = Math.min(
          1.02,
          Math.max(0.93, options.rate || prosody.defaultRate)
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
            // Natural human breathing pause between sentences (95ms)
            this.pendingTimer = setTimeout(() => {
              speakClauseAtIndex(idx + 1);
            }, 95);
          } else {
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
          1800,
          (clauseText.length / 7.0) * 1000
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
