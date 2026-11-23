# Piano evolutivo — Il mondo di Emma

## Scopo
Evolvere l'app educativa in un ambiente adattivo, affidabile, accessibile da Android e rispettoso della privacy della bambina. Tutto il lavoro di sviluppo avviene su questo branch; il branch `main` e l'app online restano invariati fino a una revisione e a un'autorizzazione esplicita.

## Principi
- Progressione indipendente per area di apprendimento: ogni competenza avanza in base alle proprie evidenze, senza trascinare automaticamente le altre.
- Adattamento graduale all'età e alle competenze, con attività, linguaggio e interfaccia coerenti con la fase di crescita.
- Nessuna conclusione clinica o psicometrica dai soli risultati dei giochi.
- Dati minimi, accessi protetti e report comprensibili ai genitori.
- Ogni modifica deve essere verificabile con test ripetibili prima del rilascio.

## Priorità P0 — Affidabilità del motore adattivo
1. Correggere la normalizzazione dei punteggi quando il campione è inferiore alla finestra obiettivo: tre risposte non devono valere automaticamente come dieci.
2. Separare evidenza di apprendimento, ritenzione differita e trasferimento. La ritenzione va verificata in una sessione successiva, dopo un intervallo significativo.
3. Misurare il trasferimento con esercizi realmente nuovi per contesto o rappresentazione, non solo con varietà nominale o difficoltà.
4. Verificare che sessioni rilevate come gioco adulto/non valido non incrementino livelli, premi o progressi della bambina.
5. Allineare i limiti di persistenza locale e cloud per gli identificativi degli esercizi completati, evitando perdita o ripetizione inattesa.
6. Rendere deterministici e tracciabili i criteri di promozione, regressione e richiesta di ulteriori evidenze.

## Priorità P1 — Profilo e progressione
- Mantenere un profilo separato per ciascuna area/competenza.
- Distinguere livello stimato, confidenza e quantità/recenza delle evidenze.
- Usare soglie conservative quando i dati sono pochi o contraddittori.
- Evitare che la velocità di risposta penalizzi automaticamente le competenze: la velocità di elaborazione va osservata separatamente e interpretata con cautela.
- Conservare uno storico delle decisioni del motore, con motivazione leggibile.

## Priorità P2 — Esperienza grafica evolutiva
- Progettare una UI moderna, giocosa e accessibile su smartphone.
- Adattare progressivamente complessità visiva, istruzioni e attività all'età e al livello, senza introdurre cambi bruschi.
- Far evolvere attività come zoo e disegno verso compiti più articolati quando le evidenze lo supportano.
- Mantenere navigazione semplice, pulsanti ampi, feedback chiari e sessioni brevi.
- Prevedere una modalità genitore distinta dall'area di gioco.

## Priorità P3 — Audio e report
- Valutare TTS italiano neurale con prosodia naturale, verificando qualità, latenza, costi e requisiti di rete.
- Distinguere audio delle istruzioni per la bambina e overview destinata ai genitori.
- Prevedere fallback testuale e gestione degli errori audio.
- I report devono mostrare progressi, aree osservate, campione, confidenza e limiti interpretativi.

## CHC, QI e limiti di interpretazione
Le attività dell'app possono fornire osservazioni educative ispirate a domini cognitivi, ma non costituiscono una valutazione clinica né una misurazione valida del QI. Un punteggio di QI richiede strumenti psicometrici standardizzati, norme appropriate e somministrazione da parte di professionisti qualificati. Il report deve evitare etichette diagnostiche e presentare le stime come indicatori esplorativi, con incertezza esplicita.

## Sicurezza e privacy
- Verificare regole Firestore e isolamento dei dati per proprietario.
- Non inserire chiavi API o segreti nel client o nel repository.
- Proteggere gli endpoint audio/report con autenticazione, limiti di utilizzo e validazione degli input, secondo le possibilità dell'architettura.
- Considerare il PIN genitore una barriera di interfaccia, non una garanzia di sicurezza forte.
- Limitare la raccolta e la conservazione dei dati di minori a quanto strettamente necessario.

## Piano di verifica e criteri di accettazione
1. Eseguire build e controlli statici in ambiente di sviluppo.
2. Aggiungere test unitari per normalizzazione, promozione, ritenzione differita, trasferimento e rilevamento sessioni non valide.
3. Aggiungere simulazioni ripetibili con casi positivi, negativi, campioni piccoli, risposte casuali e prestazioni incoerenti.
4. Verificare persistenza e sincronizzazione locale/cloud, inclusi limiti e riconnessioni.
5. Verificare su Android layout, accessibilità, audio e comportamento offline/parziale.
6. Documentare risultati, limiti e regressioni prima di qualsiasi merge.

## Sequenza di lavoro proposta
- Fase 1: audit del motore e test di caratterizzazione, senza modificare il comportamento esistente.
- Fase 2: correzioni P0 con test automatici.
- Fase 3: revisione del profilo e della progressione P1.
- Fase 4: restyling e adattamento evolutivo P2.
- Fase 5: audio, report e hardening privacy/sicurezza P3.
- Fase 6: revisione complessiva e richiesta di approvazione prima di integrare o pubblicare.

## Regola di rilascio
Nessuna modifica a `main`, nessun deploy e nessuna modifica all'app online senza approvazione esplicita.
