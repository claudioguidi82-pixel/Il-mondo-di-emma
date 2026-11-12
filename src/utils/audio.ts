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
 * Transforms text into expressive Italian prosody for a 5-year-old child.
 * Injects natural pauses, intonational melody, and friendly rhythm into speech synthesis.
 */
export function formatItalianProsody(
  text: string,
  context: 'praise' | 'riddle' | 'instruction' | 'count' | 'general' = 'general'
): { prosodyText: string; defaultPitch: number; defaultRate: number } {
  let s = text.trim();

  // Verbalize math operators smoothly
  s = s
    .replace(/\+/g, ' più ')
    .replace(/-/g, ' meno ')
    .replace(/=/g, ' uguale a ')
    .replace(/\s+/g, ' ');

  // Natural vocative commas and breathing micro-pauses
  s = s
    .replace(/^(ciao|forza|grazie|evviva|brava|bravissima)\s+emma\b/i, '$1, Emma... ')
    .replace(/\bemma\b(!|\?|\.)/gi, 'Emma$1 ')
    .replace(/\bemma\b/gi, 'Emma');

  const isPraise =
    context === 'praise' ||
    /(bravissima|fantastico|evviva|super|meraviglios|perfett|campione|vinto|tris|splendid)/i.test(s);

  const isRiddle =
    context === 'riddle' ||
    /(indovinello|chi sono|scopri chi|mistero)/i.test(s);

  const isQuestion = s.includes('?');

  if (isPraise) {
    // Celebratory cadence with bright exclamation pauses
    s = s
      .replace(/!+/g, '! ')
      .replace(/\./g, '! ')
      .replace(/(bravissima|evviva|fantastico|meraviglioso)/gi, '$1!... ');
  } else if (isRiddle) {
    // Storytelling cadence with dramatic, curious pauses
    s = s
      .replace(/:\s*/g, '... ')
      .replace(/;\s*/g, '... ')
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
  public isMusicPlaying: boolean = false;
  private musicGainNode: GainNode | null = null;
  private musicFilterNode: BiquadFilterNode | null = null;
  private musicInterval: any = null;
  private musicNextTime: number = 0;
  private musicStep: number = 0;
  private musicListeners: Set<(enabled: boolean, isPlaying: boolean) => void> = new Set();
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isUnlocked: boolean = false;
  private unlockAudioEl: HTMLAudioElement | null = null;
  private speechListeners: Set<(isSpeaking: boolean) => void> = new Set();
  public isCurrentlySpeaking: boolean = false;
  private speechSequenceId: number = 0;

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

      // Unlock audio and start music on first user touch/click (Android / iOS / Desktop)
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

  // Subscribe to background music state changes
  onMusicChange(listener: (enabled: boolean, isPlaying: boolean) => void) {
    this.musicListeners.add(listener);
    return () => {
      this.musicListeners.delete(listener);
    };
  }

  private notifyMusicListeners() {
    this.musicListeners.forEach(fn => {
      try {
        fn(this.musicEnabled, this.isMusicPlaying);
      } catch {
        // ignore
      }
    });
  }

  private setSpeaking(val: boolean) {
    this.isCurrentlySpeaking = val;
    this.updateMusicDucking();
    this.speechListeners.forEach(fn => {
      try {
        fn(val);
      } catch {
        // ignore
      }
    });
  }

  private updateMusicDucking() {
    if (!this.ctx || !this.musicGainNode) return;
    try {
      const now = this.ctx.currentTime;
      const targetGain = !this.musicEnabled
        ? 0
        : this.isCurrentlySpeaking
        ? 0.012
        : 0.045;
      this.musicGainNode.gain.cancelScheduledValues(now);
      this.musicGainNode.gain.linearRampToValueAtTime(targetGain, now + 0.35);
    } catch {
      // ignore
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const allVoices = window.speechSynthesis.getVoices() || [];
      this.voices = allVoices;

      // Select ONE single consistent, sweet, warm and natural Italian voice
      // Priority for natural prosody:
      // 1. Neural & Enhanced Italian voices (Google italiano, Natural, Neural, Alice Enhanced, Federica, Elsa)
      // 2. Exact it-IT female voices (Alice, Federica, Chiara, Elsa, Cosimo)
      // 3. Any it-IT voice
      // 4. Any it* prefix voice
      const itVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith('it'));
      if (itVoices.length > 0) {
        const preferred =
          itVoices.find(v => {
            const name = v.name.toLowerCase();
            return (
              (name.includes('natural') || name.includes('neural') || name.includes('online')) &&
              (name.includes('elsa') || name.includes('isabella') || name.includes('alice') || name.includes('federica'))
            );
          }) ||
          itVoices.find(v => v.name.toLowerCase().includes('google italiano')) ||
          itVoices.find(v => {
            const name = v.name.toLowerCase();
            return (
              name.includes('alice') ||
              name.includes('federica') ||
              name.includes('chiara') ||
              name.includes('elsa') ||
              name.includes('lucia')
            );
          }) ||
          itVoices.find(v => v.lang.toLowerCase() === 'it-it') ||
          itVoices[0];

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
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }

      // Autostart soothing focus background music if enabled
      if (this.musicEnabled && !this.isMusicPlaying) {
        this.startMusic();
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

  // =========================================================================
  // RELAXING FOCUS BACKGROUND MUSIC FOR CHILDREN (PROCEDURAL LULLABY CHIMES)
  // Peaceful, focus-enhancing ambient celesta & Rhodes arpeggio at 68 BPM.
  // 100% synthetic via Web Audio: zero network lag, zero buffering, 100% offline.
  // Smoothly ducks when Emma speaks, restored when speech finishes.
  // =========================================================================
  startMusic() {
    if (!this.musicEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      if (!this.musicFilterNode) {
        this.musicFilterNode = this.ctx.createBiquadFilter();
        this.musicFilterNode.type = 'lowpass';
        this.musicFilterNode.frequency.setValueAtTime(1100, this.ctx.currentTime);
        this.musicFilterNode.Q.setValueAtTime(0.8, this.ctx.currentTime);
      }

      if (!this.musicGainNode) {
        this.musicGainNode = this.ctx.createGain();
        this.musicGainNode.gain.setValueAtTime(
          this.isCurrentlySpeaking ? 0.012 : 0.045,
          this.ctx.currentTime
        );
        this.musicFilterNode.connect(this.musicGainNode);
        this.musicGainNode.connect(this.ctx.destination);
      } else {
        const now = this.ctx.currentTime;
        this.musicGainNode.gain.cancelScheduledValues(now);
        this.musicGainNode.gain.linearRampToValueAtTime(
          this.isCurrentlySpeaking ? 0.012 : 0.045,
          now + 0.3
        );
      }

      if (this.isMusicPlaying && this.musicInterval) return;

      this.isMusicPlaying = true;
      this.musicNextTime = this.ctx.currentTime + 0.1;
      this.musicStep = 0;

      // Lookahead scheduler every 200ms
      this.musicInterval = setInterval(() => {
        this.scheduleMusicNotes();
      }, 200);

      this.notifyMusicListeners();
    } catch {
      // ignore
    }
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.ctx && this.musicGainNode) {
      try {
        const now = this.ctx.currentTime;
        this.musicGainNode.gain.cancelScheduledValues(now);
        this.musicGainNode.gain.linearRampToValueAtTime(0, now + 0.3);
      } catch {
        // ignore
      }
    }
    this.notifyMusicListeners();
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  private scheduleMusicNotes() {
    if (!this.ctx || !this.isMusicPlaying || !this.musicFilterNode) return;
    const stepDuration = 0.44; // ~68 BPM peaceful focus rhythm
    const lookahead = 0.6; // schedule 600ms ahead

    // 16-step soothing progression in C major pentatonic
    const pattern: Array<Array<{ freq: number; dur: number; gain: number; type?: OscillatorType }>> = [
      // Step 0: C3 bass + G4 chord + C5 chime
      [
        { freq: 130.81, dur: 1.8, gain: 0.16, type: 'sine' },
        { freq: 392.00, dur: 1.4, gain: 0.10, type: 'triangle' },
        { freq: 523.25, dur: 1.6, gain: 0.14, type: 'triangle' },
      ],
      // Step 1: E5
      [{ freq: 659.25, dur: 1.2, gain: 0.11, type: 'sine' }],
      // Step 2: E4 chord note
      [{ freq: 329.63, dur: 1.2, gain: 0.09, type: 'triangle' }],
      // Step 3: D5
      [{ freq: 587.33, dur: 1.3, gain: 0.12, type: 'sine' }],
      // Step 4: A2 bass + E4 chord + C5 chime
      [
        { freq: 110.00, dur: 1.8, gain: 0.16, type: 'sine' },
        { freq: 329.63, dur: 1.4, gain: 0.10, type: 'triangle' },
        { freq: 523.25, dur: 1.5, gain: 0.13, type: 'triangle' },
      ],
      // Step 5: B4
      [{ freq: 493.88, dur: 1.2, gain: 0.11, type: 'sine' }],
      // Step 6: C4 chord
      [{ freq: 261.63, dur: 1.2, gain: 0.09, type: 'triangle' }],
      // Step 7: A4
      [{ freq: 440.00, dur: 1.4, gain: 0.12, type: 'sine' }],
      // Step 8: F2 bass + C4 chord + G4 chime
      [
        { freq: 87.31, dur: 1.8, gain: 0.16, type: 'sine' },
        { freq: 261.63, dur: 1.4, gain: 0.10, type: 'triangle' },
        { freq: 392.00, dur: 1.5, gain: 0.13, type: 'triangle' },
      ],
      // Step 9: E5
      [{ freq: 659.25, dur: 1.3, gain: 0.11, type: 'sine' }],
      // Step 10: A3 chord
      [{ freq: 220.00, dur: 1.2, gain: 0.09, type: 'triangle' }],
      // Step 11: D5
      [{ freq: 587.33, dur: 1.4, gain: 0.12, type: 'sine' }],
      // Step 12: G2 bass + D4 chord + B4 chime
      [
        { freq: 98.00, dur: 1.8, gain: 0.16, type: 'sine' },
        { freq: 293.66, dur: 1.4, gain: 0.10, type: 'triangle' },
        { freq: 493.88, dur: 1.5, gain: 0.13, type: 'triangle' },
      ],
      // Step 13: D5
      [{ freq: 587.33, dur: 1.2, gain: 0.10, type: 'sine' }],
      // Step 14: B3 chord
      [{ freq: 246.94, dur: 1.2, gain: 0.09, type: 'triangle' }],
      // Step 15: C5 chime resolution
      [{ freq: 523.25, dur: 1.7, gain: 0.14, type: 'triangle' }],
    ];

    while (this.musicNextTime < this.ctx.currentTime + lookahead) {
      const notes = pattern[this.musicStep % pattern.length];
      const noteTime = this.musicNextTime;

      notes.forEach(n => {
        try {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = n.type || 'sine';
          osc.frequency.setValueAtTime(n.freq, noteTime);

          // Attack: 0.03s
          gain.gain.setValueAtTime(0.0001, noteTime);
          gain.gain.linearRampToValueAtTime(n.gain, noteTime + 0.03);
          // Smooth exponential decay
          gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + n.dur);

          osc.connect(gain);
          gain.connect(this.musicFilterNode!);

          osc.start(noteTime);
          osc.stop(noteTime + n.dur);
        } catch {
          // ignore
        }
      });

      this.musicNextTime += stepDuration;
      this.musicStep = (this.musicStep + 1) % pattern.length;
    }
  }

  // Tactile button pop sound (Gentle, kid-safe volume 0.12)
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

        gain.gain.setValueAtTime(0.14, startTime);
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

        gain.gain.setValueAtTime(0.14, startTime);
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

  // Stop any currently playing speech or voice audio
  stopSpeech() {
    this.speechSequenceId++;
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
  // 1. Male/female alternating repeats (Unified single Italian voice)
  // 2. Volume swings (Normalized 0.95 volume, zero overlapping beeps)
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
    this.stopSpeech();

    const currentSeq = this.speechSequenceId;
    this.setSpeaking(true);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.playAnimalChirp(3);
      setTimeout(() => {
        if (this.speechSequenceId === currentSeq) {
          this.setSpeaking(false);
          if (options.onEnd) options.onEnd();
        }
      }, 800);
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Apply authentic Italian prosodic phrasing
      const prosody = formatItalianProsody(cleanText, options.context);

      const utterance = new SpeechSynthesisUtterance(prosody.prosodyText);
      utterance.lang = 'it-IT';
      utterance.rate = options.rate || prosody.defaultRate;
      utterance.pitch = Math.min(1.26, Math.max(1.08, options.pitch || prosody.defaultPitch));
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
        if (this.speechSequenceId === currentSeq) {
          this.currentUtterance = null;
          this.setSpeaking(false);
          if (options.onEnd) options.onEnd();
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
      window.speechSynthesis.speak(utterance);

      // Failsafe timeout in case browser speech engine drops the onend callback
      const estimatedDurationMs = Math.max(1800, (prosody.prosodyText.length / 7) * 1000);
      setTimeout(() => {
        if (this.speechSequenceId === currentSeq && !isFinished) {
          finishSpeech();
        }
      }, estimatedDurationMs);

    } catch {
      this.playAnimalChirp(3);
      setTimeout(() => {
        if (this.speechSequenceId === currentSeq) {
          this.setSpeaking(false);
          if (options.onEnd) options.onEnd();
        }
      }, 800);
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
