import React, { useState, useRef, useMemo } from 'react';
import { ChildGender, ChildProfile } from '../types/game';
import {
  calculateChildAge,
  compressUploadedImage,
  isValidIsoDate,
} from '../utils/childProfile';
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
} from 'lucide-react';

interface ProfileSetupModalProps {
  initialProfile: ChildProfile;
  isFirstSetup: boolean;
  onSave: (profile: ChildProfile) => void;
  onClose?: () => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  initialProfile,
  isFirstSetup,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialProfile.name || '');
  const [surname, setSurname] = useState(initialProfile.surname || '');
  const [birthDate, setBirthDate] = useState(initialProfile.birthDate || '2021-05-15');
  const [gender, setGender] = useState<ChildGender>(initialProfile.gender || 'n');
  const [customBg, setCustomBg] = useState<string | undefined>(
    initialProfile.customBackgroundUrl
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  const agePreview = useMemo(() => {
    if (!isValidIsoDate(birthDate)) return null;
    return calculateChildAge(birthDate);
  }, [birthDate]);

  const cleanNamePreview = name.trim();
  const titlePreview = cleanNamePreview ? `Il Mondo di ${cleanNamePreview}` : 'Il Mio Mondo';

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
      setFormError('Inserisci il nome del bambino o della bambina per personalizzare l’app.');
      return;
    }
    if (!isValidIsoDate(birthDate)) {
      setFormError('Inserisci una data di nascita valida per regolare subito livelli e materie.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-white text-slate-800 shadow-[0_28px_70px_-15px_rgba(15,23,42,0.75)] border border-white/60">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-700 px-5 sm:px-7 py-5 text-white">
          {!isFirstSetup && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
              aria-label="Chiudi personalizzazione"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3.5 sm:gap-4 pr-10">
            <img
              src="/pwa-192x192.png"
              alt="Il Mio Mondo"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-lg border-2 border-white/80 shrink-0 object-cover"
            />
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isFirstSetup ? 'Benvenuti in Il Mio Mondo' : 'Personalizza Profilo & Sfondo'}</span>
              </div>
              <h2 className="mt-0.5 text-2xl sm:text-3xl font-fun font-extrabold tracking-tight leading-tight truncate">
                {titlePreview}
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-indigo-100">
                Inserisci nome e data di nascita: livelli, difficoltà e materie si calibrano all’istante.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
          {formError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
              {formError}
            </div>
          )}

          {/* Row 1: Name + Optional Surname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="child-name-input"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Nome bambino / bambina *</span>
              </label>
              <input
                id="child-name-input"
                type="text"
                required
                maxLength={32}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es. Sofia, Luca, Matteo..."
                className="w-full min-h-[46px] rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="child-surname-input"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                <span>Cognome (opzionale, per Report PDF)</span>
              </label>
              <input
                id="child-surname-input"
                type="text"
                maxLength={32}
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Es. Rossi"
                className="w-full min-h-[46px] rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Row 2: Birth Date + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="child-birthdate-input"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Data di nascita *</span>
              </label>
              <input
                id="child-birthdate-input"
                type="date"
                required
                min="2010-01-01"
                max={todayIso}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full min-h-[46px] rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-base font-bold text-slate-900 tabular-nums focus:border-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Voce & Saluti
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'f', label: 'Bambina', emoji: '👧' },
                    { id: 'm', label: 'Bambino', emoji: '👦' },
                    { id: 'n', label: 'Neutro', emoji: '🌟' },
                  ] as const
                ).map((opt) => {
                  const active = gender === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGender(opt.id)}
                      className={`min-h-[46px] rounded-2xl border-2 px-2 py-2 flex flex-col items-center justify-center text-xs font-bold transition cursor-pointer ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base leading-none">{opt.emoji}</span>
                      <span className="mt-1">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Age-Adaptive Curriculum Calibration Preview */}
          {agePreview && (
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-sky-50 to-violet-50 border border-indigo-200/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                      Calibrazione Automatica per Età
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900">
                      {agePreview.displayText} · {agePreview.ageBandTitle}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-white px-3 py-1 rounded-xl border border-indigo-200">
                  {agePreview.difficultyBadge}
                </span>
              </div>

              <p className="mt-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {agePreview.curriculumSummary}
              </p>

              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {agePreview.subjectsHighlight.map((subj) => (
                  <div
                    key={subj}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white/80 rounded-xl px-2.5 py-1.5 border border-indigo-100"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{subj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Background Photo Upload */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {customBg ? (
                  <img
                    src={customBg}
                    alt="Anteprima sfondo personalizzato"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm shrink-0">
                    <Camera className="w-7 h-7" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900">
                    Foto di Sfondo Personalizzata (opzionale)
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Carica una foto del bambino o della bambina come sfondo della Home. Resta salvata solo in locale sul dispositivo.
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
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                >
                  <Camera className="w-4 h-4" />
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
                    title="Usa lo sfondo illustrato predefinito"
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

          {/* Privacy Note + Submit Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>100% privato in locale · Modificabile in qualsiasi momento</span>
            </div>

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
                className="min-h-[48px] flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm sm:text-base font-extrabold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isFirstSetup
                    ? cleanNamePreview
                      ? `Entra ne Il Mondo di ${cleanNamePreview}`
                      : 'Inizia Il Mio Mondo'
                    : 'Salva Personalizzazione'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
