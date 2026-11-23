import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundManager } from '../utils/audio';

export const PWAInstallButton: React.FC = () => {
  const { isInstalled, isIOS, canPromptInstall, promptInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 flex items-center gap-2.5 text-emerald-900">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="min-w-0 text-left">
          <p className="font-kids font-bold text-xs sm:text-sm leading-tight">
            App Installata su questo dispositivo
          </p>
          <p className="font-fun font-semibold text-[11px] text-emerald-800/90 leading-snug">
            Pronta a schermo intero anche offline!
          </p>
        </div>
      </div>
    );
  }

  const handleClick = async () => {
    soundManager.playPop();
    if (canPromptInstall) {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="home-wood-outer w-full rounded-[20px] p-[3.5px] cursor-pointer text-left group"
      >
        <div className="home-inner-green rounded-[16px] px-3.5 py-3 flex items-center justify-between gap-2.5 text-white">
          <div className="relative z-10 flex items-center gap-3 min-w-0">
            <img
              src="/pwa-192x192.png"
              alt="Icona app installata"
              className="w-10 h-10 rounded-xl border-2 border-white/60 shadow-sm object-cover shrink-0"
            />
            <div className="min-w-0">
              <span className="block font-kids font-bold text-[15px] sm:text-base text-white leading-tight">
                Installa App su Android / Telefono
              </span>
              <span className="block font-fun font-semibold text-[11.5px] sm:text-xs text-emerald-50/95 leading-snug mt-0.5">
                {canPromptInstall
                  ? 'Tocca per installare subito come app nativa'
                  : 'Schermo intero, icona in Home e uso offline'}
              </span>
            </div>
          </div>
          <Download className="relative z-10 w-4.5 h-4.5 text-white/95 shrink-0 group-hover:translate-y-0.5 transition-transform" />
        </div>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setShowGuide(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="storybook-parchment-board w-full max-w-sm rounded-[26px] p-4 sm:p-5 text-left animate-pop-in"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-kids font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Installa sul Dispositivo</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 flex items-center justify-center cursor-pointer"
                aria-label="Chiudi guida installazione"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs sm:text-sm font-fun font-semibold text-slate-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Share className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    Apri l&apos;app in <strong>Safari</strong> e tocca il pulsante <strong>Condividi</strong> in basso.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <PlusSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Scorri e seleziona <strong>&ldquo;Aggiungi alla schermata Home&rdquo;</strong>, poi conferma su <strong>Aggiungi</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs sm:text-sm font-fun font-semibold text-slate-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Apri il link condiviso dell&apos;app direttamente in <strong>Google Chrome</strong> su Android (fuori dall&apos;anteprima).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Tocca i <strong>3 puntini (⋮)</strong> in alto a destra e scegli <strong>&ldquo;Installa app&rdquo;</strong> o <strong>&ldquo;Aggiungi a schermata Home&rdquo;</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Se desideri un file <strong>.apk</strong> da installare manualmente, incolla l&apos;URL pubblico dell&apos;app su <strong>PWABuilder.com</strong> per generare il pacchetto Android firmato in 1 clic.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-kids font-bold text-sm cursor-pointer shadow-sm"
            >
              Ho capito!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
