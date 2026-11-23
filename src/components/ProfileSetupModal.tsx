import React, { useState, useRef, useMemo } from 'react';
import { ChildGender, ChildProfile } from '../types/game';
import {
  AGE_CURRICULUM_ROADMAP,
  calculateChildAge,
  compressUploadedImage,
  getGenderedWord,
  isValidIsoDate,
} from '../utils/childProfile';
import welcomeIllustration from '../assets/images/welcome_children_world_1795263078552.jpg';
import {
  Calendar,
  Camera,
  Check,
  Sparkles,
  Trash2,
  User,
  X,
  GraduationCap,
  ShieldCheck,
  Volume2,
  TrendingUp,
} from 'lucide-react';

interface ProfileSetupModalProps {
  initialProfile: ChildProfile;
  isFirstSetup: boolean;
  onSave: (profile: ChildProfile) => void;
  onClose?: () => void;
  onOpenPrivacy?: () => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  initialProfile,
  isFirstSetup,
  onSave,
  onClose,
  onOpenPrivacy,
}) => {
  const [name, setName] = useState(initialProfile.name || '');
  const [surname, setSurname] = useState(initialProfile.surname || '');
  const [birthDate, setBirthDate] = useState(initialProfile.birthDate || '2020-05-15');
  const [gender, setGender] = useState<ChildGender>(
    initialProfile.gender === 'f' || initialProfile.gender === 'm'
      ? initialProfile.gender
      : 'n'
  );
  const [customBg, setCustomBg] = useState<string | undefined>(
    initialProfile.customBackgroundUrl
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { todayIso, minBirthIso } = useMemo(() => {
    const now = new Date();
    return {
      todayIso: now.toISOString().split('T')[0],
      minBirthIso: `${now.getFullYear() - 15}-01-01`,
    };
  }, []);

  const agePreview = useMemo(() => {
    if (!isValidIsoDate(birthDate)) return null;
    return calculateChildAge(birthDate);
  }, [birthDate]);

  const cleanNamePreview = name.trim();
  const titlePreview = cleanNamePreview ? `Il Mondo di ${cleanNamePreview}` : 'Il Mio Mondo';

  const voicePreviewLine = useMemo(() => {
    const sampleName = cleanNamePreview || (gender === 'f' ? 'Sofia' : 'Luca');
    if (gender === 'f') {
      return `«Ciao ${sampleName}, benvenuta! Bravissima, sei pronta per giocare?»`;
    }
    if (gender === 'm') {
      return `«Ciao ${sampleName}, benvenuto! Bravissimo, sei pronto per giocare?»`;
    }
    return `Seleziona Femmina o Maschio per accordare voce, saluti ed esercizi.`;
  }, [cleanNamePreview, gender]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressUploadedImage(file, 1280, 0.78);
      setCustomBg(compressed);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Errore nel caricamento della foto.'
      );
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Inserisci il nome per personalizzare il titolo e la voce guida.');
      return;
    }
    if (gender !== 'f' && gender !== 'm') {
      setFormError('Seleziona il sesso (Femmina o Maschio) così l’app si rivolgerà sempre nel modo corretto.');
      return;
    }
    if (!isValidIsoDate(birthDate)) {
      setFormError('Inserisci una data di nascita valida (percorso calibrato da 2 a 14 anni).');
      return;
    }

    setFormError(null);
    onSave({
      name: trimmedName,
      surname: surname.trim() || undefined,
      birthDate: birthDate.trim(),
      gender,
      customBackgroundUrl: customBg,
      isConfigured: true,
    });
  };

  return (
    <div className="safe-modal-overlay fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/65 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[94dvh] my-auto overflow-y-auto rounded-[28px] sm:rounded-[32px] bg-[#fffdf8] text-slate-800 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.65)] border border-amber-200/70">
        {!isFirstSetup && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-11 h-11 rounded-2xl bg-white/90 hover:bg-white border border-slate-200/90 shadow-sm flex items-center justify-center text-slate-700 transition cursor-pointer"
            aria-label="Chiudi personalizzazione"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr]">
          {/* =============================================================== */}
          {/* LEFT PANEL: WARM STORYBOOK ILLUSTRATION & 2-14 YEARS JOURNEY    */}
          {/* =============================================================== */}
          <aside className="relative flex flex-col justify-between bg-gradient-to-b from-[#fff5e4] via-[#fef9f0] to-[#eef7ff] border-b lg:border-b-0 lg:border-r border-amber-200/60 p-4 sm:p-6">
            <div>
              {/* Storybook Artwork Frame */}
              <div className="profile-aside-art relative overflow-hidden rounded-3xl aspect-[4/3] bg-gradient-to-br from-amber-100 via-rose-100 to-sky-100 border-2 border-white shadow-[0_14px_34px_-12px_rgba(217,119,6,0.28)]">
                {!imgFailed ? (
                  <img
                    src={welcomeIllustration}
                    alt="Illustrazione di benvenuto Il Mio Mondo"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🎨🎵🔭
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/50 via-slate-900/15 to-transparent pointer-events-none" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                  <span className="font-fun font-extrabold text-sm tracking-tight drop-shadow">
                    {titlePreview}
                  </span>
                  <span className="text-[11px] font-bold text-amber-200 drop-shadow tabular-nums">
                    2 – 14 Anni
                  </span>
                </div>
              </div>

              {/* Warm Editorial Heading */}
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  {isFirstSetup ? 'Benvenuti · Crea il Profilo' : 'Personalizza il Profilo'}
                </p>
                <h2
                  className="mt-1 text-2xl sm:text-[26px] font-fun font-extrabold text-slate-900 leading-tight"
                  style={{ textWrap: 'balance' }}
                >
                  Un percorso che cresce da 2 a 14 anni
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Musica, senso del ritmo, artistica, logica, matematica, scienze, inglese ed empatia si calibrano subito sull’età e si adattano ai progressi reali.
                </p>
              </div>

              {/* Compact 6-Stage Roadmap (2 -> 14 Anni) */}
              <div className="mt-4 pt-3.5 border-t border-amber-200/70">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
                  <span>6 Fasce Progressive</span>
                  <span className="text-indigo-700">
                    {agePreview ? agePreview.shortAgeLabel : '2 – 14 Anni'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {AGE_CURRICULUM_ROADMAP.map((stage) => {
                    const isActive = agePreview?.ageBand === stage.band;
                    return (
                      <div
                        key={stage.band}
                        className={`rounded-xl px-2.5 py-1.5 border text-center transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white/80 text-slate-600 border-amber-200/70'
                        }`}
                      >
                        <span className="block font-fun font-extrabold text-xs tabular-nums leading-tight">
                          {stage.ageRangeLabel}
                        </span>
                        <span
                          className={`block text-[10px] truncate mt-0.5 ${
                            isActive ? 'text-indigo-100' : 'text-slate-500'
                          }`}
                        >
                          {stage.schoolLabel.split('·')[0].split('&')[0].trim()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Adaptive Early Unlock Highlight */}
            <div className="mt-4 rounded-2xl bg-white/85 border border-sky-200/80 p-3 flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                <strong className="text-slate-800">Sblocco per merito:</strong> se le statistiche di apprendimento sono molto alte, nuove materie si aprono gradualmente in anticipo!
              </p>
            </div>
          </aside>

          {/* =============================================================== */}
          {/* RIGHT PANEL: CLEAN, FRIENDLY CHILD PROFILE FORM                 */}
          {/* =============================================================== */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 flex flex-col justify-between gap-5">
            <div className="space-y-5">
              {/* Top Greeting Strip (no opening app logo) */}
              <div className="pr-10">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-fun font-extrabold text-slate-900 truncate leading-tight">
                    {titlePreview}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compila i dati qui sotto per iniziare subito con il livello giusto
                  </p>
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-700"
                >
                  {formError}
                </div>
              )}

              {/* Row 1: Name + Optional Surname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="child-name-input"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Nome *</span>
                  </label>
                  <input
                    id="child-name-input"
                    type="text"
                    required
                    maxLength={32}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Es. Sofia, Luca, Giulia..."
                    className="w-full min-h-[48px] rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="child-surname-input"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
                  >
                    <span>Cognome (opzionale · per Report PDF)</span>
                  </label>
                  <input
                    id="child-surname-input"
                    type="text"
                    maxLength={32}
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="Es. Rossi"
                    className="w-full min-h-[48px] rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Row 2: Birth Date + Required Gender Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="child-birthdate-input"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Data di nascita (2 – 14 anni) *</span>
                  </label>
                  <input
                    id="child-birthdate-input"
                    type="date"
                    required
                    min={minBirthIso}
                    max={todayIso}
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full min-h-[48px] rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-base font-bold text-slate-900 tabular-nums focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                  />
                </div>

                <div>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <span>Sesso (Maschile / Femminile) *</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        {
                          id: 'f',
                          label: 'Femmina',
                          sub: 'Bravissima!',
                          emoji: '👧',
                          activeClass:
                            'border-rose-400 bg-rose-50/90 text-rose-900 ring-2 ring-rose-100',
                        },
                        {
                          id: 'm',
                          label: 'Maschio',
                          sub: 'Bravissimo!',
                          emoji: '👦',
                          activeClass:
                            'border-sky-500 bg-sky-50/90 text-sky-900 ring-2 ring-sky-100',
                        },
                      ] as const
                    ).map((opt) => {
                      const active = gender === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setGender(opt.id);
                            if (formError) setFormError(null);
                          }}
                          className={`min-h-[48px] rounded-2xl border-2 px-3 py-2 flex items-center gap-2.5 text-left transition cursor-pointer ${
                            active
                              ? opt.activeClass
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-2xl leading-none shrink-0">{opt.emoji}</span>
                          <span className="min-w-0 leading-tight">
                            <span className="block font-fun font-extrabold text-sm">
                              {opt.label}
                            </span>
                            <span className="block text-[11px] opacity-75">{opt.sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Live Voice Concordance Preview Line */}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-amber-50/75 border border-amber-200/70 rounded-2xl px-3.5 py-2.5">
                <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium leading-snug">{voicePreviewLine}</span>
              </div>

              {/* Live Age-Calibrated Curriculum Preview */}
              {agePreview && (
                <div className="rounded-2xl bg-[#f5f8ff] border border-indigo-200/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                          Programma Calibrato all’Istante
                        </p>
                        <p className="text-sm sm:text-base font-fun font-extrabold text-slate-900">
                          {agePreview.displayText} · {agePreview.ageBandTitle}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 tabular-nums">
                      {agePreview.difficultyBadge}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {agePreview.curriculumSummary}
                  </p>

                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                    {agePreview.subjectsHighlight.map((subj) => (
                      <div
                        key={subj}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{subj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Background Photo Upload */}
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {customBg ? (
                      <img
                        src={customBg}
                        alt="Anteprima sfondo"
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center text-white shadow-xs shrink-0">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-fun font-extrabold text-slate-900">
                        Foto di Sfondo Home (opzionale)
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Carica una foto preferita come sfondo della Home. Resta solo su questo dispositivo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isProcessingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                    >
                      <Camera className="w-4 h-4 text-amber-300" />
                      <span>
                        {isProcessingPhoto
                          ? 'Ottimizzazione...'
                          : customBg
                          ? 'Cambia Foto'
                          : 'Carica Foto'}
                      </span>
                    </button>

                    {customBg && (
                      <button
                        type="button"
                        onClick={() => setCustomBg(undefined)}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Rimuovi foto"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Rimuovi</span>
                      </button>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <p className="mt-2 text-xs font-semibold text-rose-600">{uploadError}</p>
                )}
              </div>
            </div>

            {/* Footer Privacy + Dominant Primary CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => onOpenPrivacy?.()}
                className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-bold underline decoration-emerald-400/70 underline-offset-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Locale · Norme Privacy &amp; GDPR</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {!isFirstSetup && onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[48px] flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition cursor-pointer"
                  >
                    Annulla
                  </button>
                )}
                <button
                  type="submit"
                  className="min-h-[50px] flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm sm:text-base font-fun font-extrabold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isFirstSetup
                      ? cleanNamePreview
                        ? `Entra ne Il Mondo di ${cleanNamePreview}`
                        : `Inizia (${getGenderedWord(gender, 'Pronta', 'Pronto', 'Avanti')})`
                      : 'Salva Personalizzazione'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
