// Resilient Audio & Harmonious Italian Voice Engine for "Il Mondo di Emma"
// Built for 5-Year-Old Emma (Consistent warm Italian voice, normalized volume, 0 double-voice bugs)

// Pre-generated silent WAV to unlock mobile HTML5 audio context
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

export interface ProsodyOptions {
  context?: 'praise' | 'riddle' | 'instruction' | 'count' | 'general';
  pitch?: number;
  rate?: number;
  onEnd?: () => void;
}

/**
 * Enforces strict Italian grammatical gender concordance for numbers in spoken text.
 * Guarantees "1 mela" is always pronounced "una mela" (never "uno mela").
 */
export function enforceItalianGenderConcordance(text: string): string {
  let s = text;

  // Feminine nouns beginning with vowel -> "un'"
  s = s.replace(/\b(?:1|uno)\s+(arancia|ape|anatra|ombra|onda|uva)\b/gi, "un'$1");

  // Feminine nouns -> "una"
  s = s.replace(
    /\b(?:1|uno)\s+(mela|fragolina|fragola|stellina|stella|farfallina|farfalla|carota|carotina|banana|pera|ciliegia|fetta|pallina|palla|macchinina|nuvola|rosa|chiocciola|chiocciolina|tartaruga|giraffa|pecorella|mucca|gallina|ranocchia|scimmietta|volpina|rondine|formica|formichina|scarpa|bicicletta)\b/gi,
    'una $1'
  );

  // Masculine nouns -> "un"
  s = s.replace(
    /\b(?:1|uno)\s+(biscottino|biscotto|palloncino|pallone|delfino|orsetto|orso|coniglietto|coniglio|cagnolino|cane|gattino|gatto|pesciolino|pesce|fiorellino|fiore|sole|albero|cavallino|cavallo|topolino|topo|maialino|gallo|pulcino|uccellino|scoiattolo|elefante|leone)\b/gi,
    'un $1'
  );

  return s;
}

/**
 * Transforms text into expressive Italian prosody for a 5-year-old child.
 * Injects natural pauses, intonational melody, and friendly rhythm into speech synthesis.
 */
export function formatItalianProsody(
  text: string,
  context: 'praise' | 'riddle' | 'instruction' | 'count' | 'general' = 'general'
): { prosodyText: string; defaultPitch: number; defaultRate: number } {
  let s = enforceItalianGenderConcordance(text.trim());

  // Verbalize math operators smoothly
  s = s
    .replace(/\+/g, ' più ')
    .replace(/\s-\s/g, ' meno ')
    .replace(/=/g, ' uguale a ')
    .replace(/\s+/g, ' ');

  // Re-run gender check in case math operator replacement exposed "1 mela"
  s = enforceItalianGenderConcordance(s);

  // Natural vocative commas and breathing micro-pauses
  s = s
    .replace(/^(ciao|forza|grazie|evviva|brava|bravissima)\s+emma\b/i, '$1, Emma... ')
    .replace(/\bemma\b(!|\?|\.)/gi, 'Emma$1 ')
    .replace(/\bemma\b/gi, 'Emma');

  const isPraise =
    context === 'praise' ||
    /(bravissima|fantastico|evviva|super|meraviglios|perfett|campione|campionessa|vinto|tris|splendid)/i.test(s);

  const isRiddle =
    context === 'riddle' ||
    /(indovinello|chi sono|scopri chi|mistero)/i.test(s);

  const isCount = context === 'count';
  const isQuestion = s.includes('?');

  if (isPraise) {
    // Celebratory cadence with bright exclamation pauses
    s = s
      .replace(/!+/g, '! ')
      .replace(/\./g, '! ')
      .replace(/(bravissima|evviva|fantastico|meraviglioso|super)/gi, '$1!... ');
  } else if (isRiddle) {
    // Storytelling cadence with dramatic, curious pauses
    s = s
      .replace(/:\s*/g, '... ')
      .replace(/;\s*/g, '... ')
      .replace(/,\s*/g, ', ... ')
      .replace(/(chi sono\??)/gi, '... Chi sono?');
  } else if (isQuestion) {
    // Question inflection
    s = s.replace(/([,;])\s*([a-zA-Zàèéìòù]+)\?/gi, '... $2?');
  }

  // Standardize pauses for Web Speech prosody
  s = s
    .replace(/\s*…\s*/g, '... ')
    .replace(/\s*\.\.\.\s*/g, '... ')
    .replace(/\s*([,!?])\s*/g, '$1 ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  let defaultPitch = 1.15;
  let defaultRate = 0.88;

  if (isPraise) {
    defaultPitch = 1.22; // Radiant, enthusiastic tone
    defaultRate = 0.92;
  } else if (isRiddle) {
    defaultPitch = 1.12; // Storyteller tone
    defaultRate = 0.84;  // Relaxed, mysterious tempo
  } else if (isCount) {
    defaultPitch = 1.18;
    defaultRate = 0.94;
  } else if (isQuestion) {
    defaultPitch = 1.16;
    defaultRate = 0.88;
  }

  return { prosodyText: s, defaultPitch, defaultRate };
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

      // Pre-warm unlock audio element
      try {
        this.unlockAudioEl = new Audio(SILENT_WAV);
      } catch {
        // ignore
      }

      // Unlock audio on first user touch/click (Android / iOS / Desktop)
      const unlockListener = () => {
        this.unlockAudio();
      };

      window.addEventListener('touchstart', unlockListener, { passive: true, once: false });
      window.addEventListener('touchend', unlockListener, { passive: true, once: false });
      window.addEventListener('pointerdown', unlockListener, { passive: true, once: false });
      window.addEventListener('click', unlockListener, { passive: true, once: false });
    }
  }

  // Subscribe to speech state changes (e.g. for speaking mouth animations)
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
    this.musicListeners.forEach(fn => {
      try {
        fn(this.musicEnabled);
      } catch {
        // ignore
      }
    });
    return this.musicEnabled;
  }

  // Cheerful, gentle fairytale music-box melody that auto-ducks when voice speaks
  startBackgroundMusic() {
    if (!this.musicEnabled || !this.soundEnabled) return;
    if (this.bgMusicInterval) return;

    // Pentatonic C-major fairytale music box notes (C5, D5, E5, G5, A5, C6)
    const melodyNotes = [
      523.25, 659.25, 783.99, 659.25,
      880.00, 783.99, 659.25, 587.33,
      523.25, 587.33, 659.25, 783.99,
      1046.50, 880.00, 783.99, 659.25,
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

        // Softly duck volume when speech is active so voice is always 100% clear
        const targetVol = this.isCurrentlySpeaking ? 0.008 : 0.032;
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
    this.speechListeners.forEach(fn => {
      try {
        fn(val);
      } catch {
        // ignore
      }
    });
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const allVoices = window.speechSynthesis.getVoices() || [];
      if (allVoices.length === 0) return;
      this.voices = allVoices;

      const itVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith('it'));
      if (itVoices.length > 0) {
        // Explicitly filter out known male voices so we never switch between male and female
        const isMaleVoice = (name: string) =>
          /(cosimo|luca|giorgio|diego|nicola|paolo|male|maschile|uomo)/i.test(name);

        const femaleOrNeutralVoices = itVoices.filter(v => !isMaleVoice(v.name));
        const pool = femaleOrNeutralVoices.length > 0 ? femaleOrNeutralVoices : itVoices;

        const preferred =
          pool.find(v => {
            const name = v.name.toLowerCase();
            return (
              (name.includes('natural') || name.includes('neural') || name.includes('online') || name.includes('enhanced') || name.includes('premium')) &&
              (name.includes('elsa') || name.includes('isabella') || name.includes('alice') || name.includes('federica') || name.includes('italiano'))
            );
          }) ||
          pool.find(v => v.name.toLowerCase().includes('google italiano')) ||
          pool.find(v => {
            const name = v.name.toLowerCase();
            return (
              name.includes('alice') ||
              name.includes('federica') ||
              name.includes('elsa') ||
              name.includes('isabella') ||
              name.includes('chiara') ||
              name.includes('lucia') ||
              name.includes('fabiola')
            );
          }) ||
          pool.find(v => v.lang.toLowerCase() === 'it-it') ||
          pool[0];

        this.selectedVoice = preferred;
      }
    } catch {
      this.voices = [];
    }
  }

  // Explicit unlock on user gesture
  unlockAudio() {
    try {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // Unlock HTML5 <audio> on mobile browsers
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

      // Prime SpeechSynthesis on mobile
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
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Tactile button pop sound (Gentle, kid-safe normalized volume 0.12)
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

  // Star & sparkle collect sound (Soft crystalline chimes)
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

  // Puzzle success celebration chime (Warm balanced volume)
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

  // Fanfare for level completion
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
        { freq: 880.0,  time: 0.75, dur: 0.12 },
        { freq: 1046.5, time: 0.88, dur: 0.45 },
      ];
      const now = this.ctx.currentTime;

      melody.forEach(item => {
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

  // Gentle, warm encouragement sound (never punishing)
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

  // Cheerful animal chirp melodic fallback
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

  // Play a single warm xylophone/piano musical note (for Musica & Ritmo levels)
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
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.65);

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

  // Play a rhythmic or melodic sequence of notes (for Musica & Ritmo levels)
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

  // Stop any currently playing speech or voice audio
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

  // =========================================================================
  // CONSISTENT, SINGLE-VOICE ITALIAN SPEECH SYNTHESIS ENGINE WITH PROSODY
  // Eliminates:
  // 1. Male/female alternating repeats (Unified single Italian female voice)
  // 2. Volume swings (Normalized 0.95 volume, zero overlapping utterances)
  // 3. Race conditions and abort double-fallbacks (Sequence tracking)
  // 4. Robotic monotone (Dynamic Italian prosodic phrasing & modulation)
  // =========================================================================
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
            pitch: typeof optionsOrPitch === 'number' ? optionsOrPitch : undefined,
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

    const startUtterance = () => {
      if (this.speechSequenceId !== currentSeq) return;

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        // Apply authentic Italian prosodic phrasing & gender concordance
        const prosody = formatItalianProsody(cleanText, options.context);

        const utterance = new SpeechSynthesisUtterance(prosody.prosodyText);
        utterance.lang = 'it-IT';
        utterance.rate = options.rate || prosody.defaultRate;
        utterance.pitch = Math.min(1.24, Math.max(1.06, options.pitch || prosody.defaultPitch));
        utterance.volume = 0.95; // Consistent, normalized volume

        // Guarantee consistent single Italian voice
        if (!this.selectedVoice) {
          this.initVoices();
        }
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }

        let isFinished = false;
        const finishSpeech = () => {
          if (isFinished) return;
          isFinished = true;
          if (this.failsafeTimer) {
            clearTimeout(this.failsafeTimer);
            this.failsafeTimer = null;
          }
          if (this.speechSequenceId === currentSeq) {
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

        utterance.onend = finishSpeech;
        utterance.onerror = (e) => {
          if (e.error === 'canceled' || e.error === 'interrupted') {
            return;
          }
          finishSpeech();
        };

        this.currentUtterance = utterance;
        this.setSpeaking(true);
        window.speechSynthesis.speak(utterance);

        // Failsafe timeout in case browser speech engine drops the onend callback
        const estimatedDurationMs = Math.max(2000, (prosody.prosodyText.length / 6.5) * 1000);
        this.failsafeTimer = setTimeout(() => {
          if (this.speechSequenceId === currentSeq && !isFinished) {
            finishSpeech();
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

    // Short 35ms settle delay after cancel() prevents Web Speech double-voice & dropped utterances
    if (wasSpeaking) {
      this.pendingTimer = setTimeout(startUtterance, 35);
    } else {
      startUtterance();
    }
  }

  // Convenient prosody-specialized speech helpers
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
