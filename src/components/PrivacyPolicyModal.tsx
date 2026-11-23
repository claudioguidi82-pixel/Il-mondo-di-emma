import React, { useEffect } from 'react';
import {
  ShieldCheck,
  X,
  HardDrive,
  Image as ImageIcon,
  FileBarChart2,
  Mic,
  UserCheck,
  Trash2,
  Lock,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ onClose }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="safe-modal-overlay fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-md flex items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[28px] w-full max-w-3xl max-h-[92dvh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-5 sm:px-7 py-5 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-100">
                Regolamento UE 2016/679 (GDPR) · Tutela Minori Art. 8
              </p>
              <h2
                id="privacy-policy-title"
                className="text-lg sm:text-2xl font-black leading-tight mt-0.5"
              >
                Informativa Privacy &amp; Norme GDPR
              </h2>
              <p className="text-xs sm:text-sm text-emerald-50/90 font-semibold mt-1">
                Architettura 100% Locale: nessun dato viene conservato sui server. Tutto resta sul tuo dispositivo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi informativa privacy"
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-5 text-slate-700 leading-relaxed">
          {/* Quick Guarantee Summary Banner */}
          <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-sm sm:text-base mb-2.5">
              <HardDrive className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Principio Fondamentale: Zero Salvataggio su Server (Privacy by Design)</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-950 font-medium">
              Questa applicazione è progettata secondo il principio europeo di{' '}
              <strong>Privacy by Design e by Default (Art. 25 GDPR)</strong>.{' '}
              <strong>Nessun dato personale, nessun profilo del bambino, nessun report educativo e nessuna foto di sfondo vengono salvati o archiviati su server remoti o cloud esterni.</strong>{' '}
              Tutte le informazioni restano esclusivamente nella memoria locale del telefono, tablet o computer utilizzato dalla famiglia.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5">
              <div className="bg-white rounded-xl p-3 border border-emerald-200/80 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] sm:text-xs">
                  <div className="font-black text-slate-900">Dati del Bambino</div>
                  <div className="text-slate-600">Solo nella memoria locale del dispositivo.</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-emerald-200/80 flex items-start gap-2">
                <FileBarChart2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] sm:text-xs">
                  <div className="font-black text-slate-900">Report &amp; Progressi</div>
                  <div className="text-slate-600">Calcolati e salvati solo in locale.</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-emerald-200/80 flex items-start gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] sm:text-xs">
                  <div className="font-black text-slate-900">Foto di Sfondo App</div>
                  <div className="text-slate-600">Mai inviata in rete né caricata su server.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Art. 1 */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black">1</span>
              <span>Architettura 100% Locale e Nessuna Conservazione Remota</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700">
              Tutti i dati inseriti e generati durante l&apos;uso dell&apos;app vengono memorizzati esclusivamente nello spazio di archiviazione locale del browser/dispositivo (<code className="px-1.5 py-0.5 bg-slate-200/80 rounded text-[11px] font-bold">localStorage</code>) sotto il pieno controllo del genitore. L&apos;applicazione non dispone di alcun database remoto, non richiede registrazione di account, non raccoglie indirizzi email, numeri di telefono o posizione GPS, e non sincronizza dati verso cloud terzi.
            </p>
          </section>

          {/* Art. 2 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2.5">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black">2</span>
              <span>Tipologie di Dati Trattati Esclusivamente sul Telefono</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700">
              Le seguenti categorie di dati risiedono <strong>unicamente nella memoria interna del dispositivo</strong> e non vengono mai conservate altrove:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Profilo del bambino:</strong> nome (o nomignolo), cognome opzionale, data di nascita/età e sesso, usati unicamente in locale per calibrare la difficoltà delle domande e la personalizzazione grammaticale.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Foto di sfondo dell&apos;app:</strong> la fotografia caricata dalla galleria viene ridimensionata e salvata esclusivamente nella memoria locale del dispositivo come immagine personale di sfondo. <strong>Non viene mai trasmessa a server, API o servizi esterni.</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Report di apprendimento e statistiche:</strong> punteggi, abilità CHC, cronologia delle sessioni, progressi, badge, disegni creati nello Studio Disegno e PDF esportati dal genitore restano nel solo dispositivo.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>PIN Area Genitori:</strong> conservato solo localmente sotto forma di impronta crittografica (hash) non reversibile per proteggere l&apos;accesso al report.</span>
              </li>
            </ul>
          </section>

          {/* Art. 3 */}
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 sm:p-5 space-y-2.5">
            <h3 className="text-sm sm:text-base font-black text-indigo-950 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black">3</span>
              <span>Elaborazione Effimera di Sintesi Vocale (TTS) e Audio Overview Gemini</span>
            </h3>
            <p className="text-xs sm:text-sm text-indigo-950/90">
              Per garantire la massima trasparenza ai sensi degli Artt. 12–13 GDPR, specifichiamo come funzionano le uniche due funzioni audio assistite da intelligenza artificiale:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-indigo-950/90">
              <li className="flex items-start gap-2">
                <Mic className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Lettura Vocale delle Domande (TTS):</strong> viene inviato in modo puramente transitorio solo il testo breve della frase educativa da pronunciare ad alta voce per restituire l&apos;audio immediato. Se il dispositivo è offline, l&apos;app usa automaticamente la sintesi vocale locale del telefono.</span>
              </li>
              <li className="flex items-start gap-2">
                <Mic className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Audio Overview del Report Genitori (facoltativo, su clic del genitore):</strong> solo quando il genitore preme esplicitamente il pulsante di generazione, vengono elaborati in modo effimero gli <strong>indici numerici aggregati</strong> del report (punteggi, fascia d&apos;età, aree forti e da potenziare) per creare il dialogo audio di commento. <strong>Non vengono mai inviati foto, cognome, data di nascita o identificativi del dispositivo.</strong> È inoltre disponibile l&apos;opzione <em>&ldquo;Anonimizza nome&rdquo;</em> che sostituisce anche il nome proprio con &ldquo;il bambino / la bambina&rdquo;.</span>
              </li>
            </ul>
            <p className="text-xs text-indigo-900 font-bold bg-white/80 rounded-xl p-3 border border-indigo-200/80">
              Nessuna richiesta audio viene salvata in database persistenti dall&apos;applicazione: l&apos;audio generato viene riprodotto nel browser locale e, se scaricato, salvato solo sul telefono del genitore.
            </p>
          </section>

          {/* Art. 4 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black">4</span>
              <span>Zero Pubblicità, Zero Cookie di Profilazione, Zero Tracciamento</span>
            </h3>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
              <EyeOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p>
                L&apos;app non utilizza cookie pubblicitari, pixel di tracciamento, SDK di analytics comportamentali, reti di annunci né meccanismi di profilazione commerciale. I dati educativi del minore non vengono mai venduti, condivisi o ceduti a terze parti per finalità di marketing.
              </p>
            </div>
          </section>

          {/* Art. 5 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black">5</span>
              <span>Tutela dei Minori (Art. 8 GDPR / D.Lgs. 101/2018 / Principi COPPA)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700">
              L&apos;impostazione del profilo iniziale, il caricamento della foto locale di sfondo, la consultazione dei report e l&apos;eventuale esportazione o generazione dell&apos;Audio Overview sono riservati esclusivamente al genitore o al titolare della responsabilità genitoriale. L&apos;Area Genitori è protetta da PIN configurabile per impedire accessi accidentali da parte del bambino.
            </p>
          </section>

          {/* Art. 6 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black">6</span>
              <span>Diritti dell&apos;Interessato (Artt. 15–22 GDPR) e Cancellazione Immediata</span>
            </h3>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p>
                Poiché tutti i dati sono conservati solo nella memoria locale del telefono, il genitore esercita direttamente e istantaneamente i diritti di accesso, rettifica, portabilità (export PDF/Audio in locale) e cancellazione definitiva (<strong>Art. 17 GDPR — Diritto all&apos;Oblio</strong>): è sufficiente modificare il profilo, rimuovere la foto di sfondo, usare il comando di azzeramento nell&apos;Area Genitori oppure cancellare i dati dell&apos;app/disinstallarla dal dispositivo per eliminare in modo immediato e irreversibile ogni informazione.
              </p>
            </div>
          </section>

          {/* Art. 7 */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black">7</span>
              <span>Misure Tecniche di Sicurezza (Art. 32 GDPR)</span>
            </h3>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                L&apos;app applica sanitizzazione di tutti i campi testuali (prevenzione XSS/HTML injection), controllo di integrità dei salvataggi locali, cifratura tramite hash del PIN genitoriale, assenza di credenziali esposte lato client e separazione netta tra ambiente di gioco del bambino e sezione di valutazione riservata ai genitori.
              </p>
            </div>
          </section>

          <p className="text-[11px] text-slate-400 font-semibold text-center pt-1">
            Informativa redatta in conformità al Regolamento (UE) 2016/679 (GDPR), al D.Lgs. 196/2003 aggiornato dal D.Lgs. 101/2018 e ai principi di protezione digitale dei minori.
          </p>
        </div>

        {/* Footer CTA */}
        <div className="px-5 sm:px-7 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>100% Memoria Locale · Zero Raccolta Dati</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-colors cursor-pointer"
          >
            Ho capito, chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
