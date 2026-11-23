import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Home,
  Volume2,
  Music,
  VolumeX,
  Play,
  Sparkles,
  Heart,
  HelpCircle,
  Check,
  RotateCcw,
  BookOpen,
  Compass,
  AudioLines,
} from 'lucide-react';
import { ChildProfile } from '../types/game';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import {
  calculateChildAge,
  getAgeVisualTheme,
  getDisplayChildName,
  getGenderedWord,
} from '../utils/childProfile';
import arenaMeadowBackdrop from '../assets/images/arena_meadow_backdrop_1795268326885.jpg';
import zooLion3d from '../assets/images/zoo_lion_3d_1795268326883.jpg';
import zooGiraffe3d from '../assets/images/zoo_giraffe_3d_1795268326961.jpg';
import zooElephant3d from '../assets/images/zoo_elephant_3d_1795268327303.jpg';
import cardCamel3d from '../assets/images/card_camel_3d_1795268325780.jpg';
import cardZebra3d from '../assets/images/card_zebra_3d_1795268326180.jpg';

interface ZooParlanteStudioProps {
  childProfile?: ChildProfile;
  onClose: () => void;
}

type AnimalId =
  | 'dog'
  | 'cat'
  | 'cow'
  | 'sheep'
  | 'rooster'
  | 'duck'
  | 'pig'
  | 'frog'
  | 'lion'
  | 'elephant'
  | 'giraffe'
  | 'zebra'
  | 'camel'
  | 'owl';

type HabitatTab = 'farm' | 'savanna';

interface TalkingAnimal {
  id: AnimalId;
  tab: HabitatTab;
  name: string;
  shortName: string;
  speciesName: string;
  scientificName: string;
  biome: string;
  diet: string;
  acousticProfile: string;
  emoji: string;
  soundLabel: string;
  habitat: string;
  portraitSrc?: string;
  stageSkyGradient: string;
  stageHillColor: string;
  cardGradient: string;
  shadowColor: string;
  playIconClass: string;
  greetings: string[];
  curiosities: string[];
  cuddlePhrase: string;
  scienceFacts: string[];
  ethologyNote: string;
  quizClue: string;
}

const TALKING_ANIMALS: TalkingAnimal[] = [
  // TAB 1: FAUNA DOMESTICA & ZONE UMIDE (8 specie)
  {
    id: 'dog',
    tab: 'farm',
    name: 'Cane Fido',
    shortName: 'Cane Fido',
    speciesName: 'Cane Domestico',
    scientificName: 'Canis lupus familiaris',
    biome: 'Ambiente antropico & Praterie',
    diet: 'Onnivoro (carnivoro facoltativo)',
    acousticProfile: 'Abbaio impulsivo · 400–2500 Hz',
    emoji: '🐶',
    soundLabel: 'BAU BAU!',
    habitat: 'Prato della fattoria',
    stageSkyGradient: 'from-sky-200 via-amber-50 to-emerald-200',
    stageHillColor: '#22c55e',
    cardGradient: 'from-[#f59e0b] via-[#ea580c] to-[#c2410c]',
    shadowColor: '#9a3412',
    playIconClass: 'text-orange-600 fill-orange-600',
    greetings: [
      'Bau bau! Sono Fido il cagnolino e muovo la coda quando sei qui!',
      'Bau bau! Vuoi rincorrere una pallina colorata sul prato insieme a me?',
      'Bau! Ho un fiuto super e sento subito profumo di gioco e amicizia!',
    ],
    curiosities: [
      'Lo sapevi? I cani riconoscono tantissimi profumi diversi con il loro tartufo umido!',
      'Quando un cane scodinzola tutto contento, sta dicendo che è felice di vederti!',
      'I cuccioli adorano giocare e imparano subito a riconoscere la tua voce!',
    ],
    cuddlePhrase: 'Bau bau! Che belle carezze dietro le orecchie, scodinzolo fortissimo!',
    scienceFacts: [
      'L’olfatto canino dispone fino a 300 milioni di recettori olfattivi, contro circa 6 milioni nell’uomo.',
      'L’udito del cane percepisce frequenze fino a 45.000 Hz, molto oltre il limite umano di 20.000 Hz.',
    ],
    ethologyNote: 'Specie sociale a gerarchia cooperativa: comunica tramite vocalizzazioni modulate, postura della coda e segnali chimici.',
    quizClue: 'Possiede fino a 300 milioni di recettori olfattivi e percepisce ultrasuoni fino a 45 kHz.',
  },
  {
    id: 'cat',
    tab: 'farm',
    name: 'Gatto Micio',
    shortName: 'Gatto Micio',
    speciesName: 'Gatto Domestico',
    scientificName: 'Felis catus',
    biome: 'Ambiente domestico & Urbano',
    diet: 'Carnivoro stretto',
    acousticProfile: 'Miagolio & Fusa · 25–150 Hz',
    emoji: '🐱',
    soundLabel: 'MIAO!',
    habitat: 'Cuscino al sole',
    stageSkyGradient: 'from-rose-100 via-amber-50 to-orange-100',
    stageHillColor: '#fb923c',
    cardGradient: 'from-[#fb7185] via-[#ec4899] to-[#be185d]',
    shadowColor: '#9d174d',
    playIconClass: 'text-pink-600 fill-pink-600',
    greetings: [
      'Miao! Sono Micio il gattino morbido, pronto a fare le fusa!',
      'Miaooo! Mi piace inseguire i gomitoli di lana e fare grandi salti soffici!',
      'Miao! Con le mie zampine leggere cammino senza fare alcun rumore!',
    ],
    curiosities: [
      'Lo sapevi? Le fusa del gatto sono un suono calmo che rilassa sia i gatti sia gli umani!',
      'I baffi del gatto si chiamano vibrisse e lo aiutano a capire se passa negli spazi stretti!',
      'I gatti vedono molto bene anche quando la luce è bassa, come al tramonto!',
    ],
    cuddlePhrase: 'Prrr... miao! Queste coccole sul musetto sono dolcissime!',
    scienceFacts: [
      'Le fusa vibrano tra 25 e 150 Hz, una banda di frequenza associata al recupero tissutale e osseo.',
      'Il tapetum lucidum dietro la retina amplifica la visione crepuscolare fino a sei volte rispetto all’uomo.',
    ],
    ethologyNote: 'Predatore crepuscolare dotato di vibrisse tattili altamente innervate per misurare gli spazi al buio.',
    quizClue: 'Emette vibrazioni tra 25 e 150 Hz e sfrutta il tapetum lucidum per la visione notturna.',
  },
  {
    id: 'cow',
    tab: 'farm',
    name: 'Mucca Bella',
    shortName: 'Mucca Bella',
    speciesName: 'Bovino Domestico',
    scientificName: 'Bos taurus',
    biome: 'Praterie temperate & Pascoli',
    diet: 'Erbivoro ruminante',
    acousticProfile: 'Muggito grave · 80–300 Hz',
    emoji: '🐄',
    soundLabel: 'MUUU!',
    habitat: 'Pascolo verde',
    stageSkyGradient: 'from-sky-200 via-lime-50 to-emerald-200',
    stageHillColor: '#16a34a',
    cardGradient: 'from-[#34d399] via-[#10b981] to-[#047857]',
    shadowColor: '#065f46',
    playIconClass: 'text-emerald-600 fill-emerald-600',
    greetings: [
      'Muuu! Ciao! Sono Bella la mucca a macchie e mangio tanta erba fresca!',
      'Muuuu! Con il mio latte buono si fanno il formaggio e il gelato!',
      'Muuu! Senti il campanellino al mio collo mentre passeggio sul prato?',
    ],
    curiosities: [
      'Lo sapevi? Ogni mucca ha macchie bianche e nere diverse, proprio come un disegno unico!',
      'Le mucche hanno ottimi amici nel pascolo e amano stare sempre vicino alle compagne preferite!',
      'Una mucca ha una vista quasi a trecentosessanta gradi per controllare tutto il prato!',
    ],
    cuddlePhrase: 'Muuu! Grazie per la carezza e per questo bel mazzolino di margherite!',
    scienceFacts: [
      'L’apparato digerente dei bovini possiede quattro compartimenti gastrici (rumine, reticolo, omaso, abomaso) per digerire la cellulosa.',
      'Gli occhi laterali garantiscono un campo visivo panoramico di circa 330 gradi.',
    ],
    ethologyNote: 'Gregario e dotato di forte memoria sociale: modula l’intonazione del muggito per identificare il vitello o segnalare stress.',
    quizClue: 'Ruminante con quattro compartimenti gastrici e un campo visivo panoramico di 330 gradi.',
  },
  {
    id: 'sheep',
    tab: 'farm',
    name: 'Pecora Nuvola',
    shortName: 'Pecora Nuvola',
    speciesName: 'Pecora Domestica',
    scientificName: 'Ovis aries',
    biome: 'Colline & Pascoli montani',
    diet: 'Erbivoro ruminante',
    acousticProfile: 'Belato armonico · 300–1200 Hz',
    emoji: '🐑',
    soundLabel: 'BEEE!',
    habitat: 'Colline fiorite',
    stageSkyGradient: 'from-sky-100 via-white to-lime-200',
    stageHillColor: '#4ade80',
    cardGradient: 'from-[#38bdf8] via-[#0ea5e9] to-[#0369a1]',
    shadowColor: '#075985',
    playIconClass: 'text-sky-600 fill-sky-600',
    greetings: [
      'Beee! Sono Nuvola la pecorella, soffice proprio come una nuvoletta!',
      'Beee beee! Saltello leggera sulle colline verdi piene di fiorellini!',
      'Beee! La mia lana morbida tiene al calduccio in inverno!',
    ],
    curiosities: [
      'Lo sapevi? Le pecore hanno una memoria fantastica e riconoscono fino a cinquanta volti diversi!',
      'Il mantello della pecora è morbido e ricciolino come un maglione naturale!',
      'Gli agnellini riconoscono la voce della loro mamma fin dal primissimo giorno!',
    ],
    cuddlePhrase: 'Beee! Che bello farsi accarezzare i riccioli morbidi!',
    scienceFacts: [
      'Studi neuroscientifici hanno dimostrato che le pecore ricordano fino a 50 volti ovini e umani per oltre due anni.',
      'Le pupille rettangolari orizzontali ampliano la visione periferica mentre brucano a testa bassa.',
    ],
    ethologyNote: 'Comportamento di gregge sincronizzato guidato da riconoscimento vocale madre-agnello e visione grandangolare.',
    quizClue: 'Ha pupille rettangolari orizzontali e ricorda fino a 50 volti diversi per oltre due anni.',
  },
  {
    id: 'rooster',
    tab: 'farm',
    name: 'Gallo Chicco',
    shortName: 'Gallo Chicco',
    speciesName: 'Gallo Domestico',
    scientificName: 'Gallus gallus domesticus',
    biome: 'Aree rurali & Boscaglia',
    diet: 'Onnivoro granivoro',
    acousticProfile: 'Canto territoriale · 1000–4000 Hz',
    emoji: '🐓',
    soundLabel: 'CHICCHIRICHÌ!',
    habitat: 'Aia del mattino',
    stageSkyGradient: 'from-amber-200 via-yellow-100 to-orange-200',
    stageHillColor: '#d97706',
    cardGradient: 'from-[#ef4444] via-[#dc2626] to-[#991b1b]',
    shadowColor: '#7f1d1d',
    playIconClass: 'text-red-600 fill-red-600',
    greetings: [
      'Chicchirichì! Buongiorno! Sono Chicco il gallo e sveglio tutta la fattoria!',
      'Chicchirichì! Quando sorge il sole canto forte dal mio steccato!',
      'Chicchirichì! Guarda le mie piume colorate che brillano al sole!',
    ],
    curiosities: [
      'Lo sapevi? Il gallo ha un orologio naturale dentro di sé e capisce quando sta per arrivare l’alba!',
      'La cresta rossa sulla testa del gallo lo aiuta a rinfrescarsi nelle giornate calde!',
      'I galli usano tanti suoni diversi per avvisare le galline quando trovano semini gustosi!',
    ],
    cuddlePhrase: 'Chicchirichì! Grazie per questi semini croccanti di mais!',
    scienceFacts: [
      'Il canto all’alba è regolato da un ritmo circadiano endogeno: avviene anche al buio costante.',
      'Durante il canto (oltre 100 dB), un tessuto molle chiude parzialmente il condotto uditivo proteggendo i propri timpani.',
    ],
    ethologyNote: 'Usa un repertorio di oltre 20 richiami referenziali distinti, differenziando predatori aerei da predatori terrestri.',
    quizClue: 'Regola il proprio canto con un orologio circadiano interno e protegge i timpani da picchi di 100 dB.',
  },
  {
    id: 'duck',
    tab: 'farm',
    name: 'Anatra Pina',
    shortName: 'Anatra Pina',
    speciesName: 'Germano Reale',
    scientificName: 'Anas platyrhynchos',
    biome: 'Zone umide, laghi e fiumi',
    diet: 'Onnivoro acquatico',
    acousticProfile: 'Richiamo nasale · 600–2800 Hz',
    emoji: '🦆',
    soundLabel: 'QUA QUA!',
    habitat: 'Laghetto azzurro',
    stageSkyGradient: 'from-cyan-100 via-sky-200 to-blue-300',
    stageHillColor: '#0284c7',
    cardGradient: 'from-[#06b6d4] via-[#0284c7] to-[#1d4ed8]',
    shadowColor: '#1e3a8a',
    playIconClass: 'text-cyan-600 fill-cyan-600',
    greetings: [
      'Qua qua! Sono Pina l’anatra e nuoto felice nel laghetto azzurro!',
      'Qua qua qua! Con le mie zampe a pinna scivolo sull’acqua come una barchetta!',
      'Qua qua! Vuoi fare uno spruzzo allegro insieme a me?',
    ],
    curiosities: [
      'Lo sapevi? Le piume delle anatre sono impermeabili, così restano sempre asciutte anche sott’acqua!',
      'Gli anatroccoli nuotano in fila indiana dietro la mamma per scivolare sulle onde senza fatica!',
      'Le anatre possono sia nuotare benissimo sia volare alte nel cielo!',
    ],
    cuddlePhrase: 'Qua qua! Splash! Che divertimento giocare vicino al laghetto!',
    scienceFacts: [
      'La ghiandola dell’uropigio secerne oli idrorepellenti che mantengono asciutto il piumaggio e favoriscono il galleggiamento.',
      'Nuotando in fila indiana, gli anatroccoli sfruttano l’interferenza costruttiva delle onde riducendo la resistenza idrodinamica.',
    ],
    ethologyNote: 'Uccello migratore capace di sonno uni-emisferico: un emisfero cerebrale riposa mentre l’altro vigila.',
    quizClue: 'Impermeabilizza le piume grazie alla ghiandola dell’uropigio e sfrutta la scia idrodinamica in fila.',
  },
  {
    id: 'pig',
    tab: 'farm',
    name: 'Maialino Poldo',
    shortName: 'Maialino Poldo',
    speciesName: 'Suino Domestico',
    scientificName: 'Sus scrofa domesticus',
    biome: 'Boschi decidui & Aree rurali',
    diet: 'Onnivoro',
    acousticProfile: 'Grugnito ritmico · 150–900 Hz',
    emoji: '🐷',
    soundLabel: 'OINK OINK!',
    habitat: 'Orto soleggiato',
    stageSkyGradient: 'from-pink-100 via-rose-50 to-amber-100',
    stageHillColor: '#f472b6',
    cardGradient: 'from-[#f472b6] via-[#e879f9] to-[#a855f7]',
    shadowColor: '#7e22ce',
    playIconClass: 'text-fuchsia-600 fill-fuchsia-600',
    greetings: [
      'Oink oink! Sono Poldo il maialino rosa con la codina a ricciolo!',
      'Oink oink! Mi piace tantissimo mangiare mele dolci e rotolarmi nel fresco!',
      'Oink! Senti che grugnito simpatico che faccio con il mio nasino!',
    ],
    curiosities: [
      'Lo sapevi? I maialini sono tra gli animali più intelligenti e curiosi di tutta la fattoria!',
      'I maiali amano il fango fresco in estate perché li protegge dal sole come una crema!',
      'I maialini comunicano tra loro con più di venti versi diversi!',
    ],
    cuddlePhrase: 'Oink oink! Mmm che mela croccante, mi fai ridere il nasino!',
    scienceFacts: [
      'Dotati di elevate capacità cognitive, i suini superano test di memoria spaziale e problem solving al pari di primati giovani.',
      'Avendo pochissime ghiandole sudoripare funzionali, usano il fango per la termoregolazione evaporativa.',
    ],
    ethologyNote: 'Possiede oltre 20 vocalizzazioni catalogate che riflettono stati emotivi precisi, dalla ricerca di cibo al gioco sociale.',
    quizClue: 'Ha pochissime ghiandole sudoripare e utilizza il fango per termoregolare la temperatura corporea.',
  },
  {
    id: 'frog',
    tab: 'farm',
    name: 'Rana Rina',
    shortName: 'Rana Rina',
    speciesName: 'Rana Verde',
    scientificName: 'Pelophylax esculentus',
    biome: 'Stagni, paludi e corsi d’acqua',
    diet: 'Insettivoro',
    acousticProfile: 'Gracidio risonante · 500–3200 Hz',
    emoji: '🐸',
    soundLabel: 'CRA CRA!',
    habitat: 'Ninfee dello stagno',
    stageSkyGradient: 'from-lime-100 via-emerald-100 to-teal-200',
    stageHillColor: '#15803d',
    cardGradient: 'from-[#84cc16] via-[#22c55e] to-[#15803d]',
    shadowColor: '#14532d',
    playIconClass: 'text-green-600 fill-green-600',
    greetings: [
      'Cra cra! Sono Rina la ranocchia verde e salto da una ninfea all’altra!',
      'Cra cra! Prova a fare un bel salto in alto proprio come me!',
      'Cra! La sera canto in coro con tutte le mie amiche dello stagno!',
    ],
    curiosities: [
      'Lo sapevi? Una rana può saltare fino a venti volte la lunghezza del suo piccolo corpo!',
      'Le rane non bevono con la bocca ma assorbono l’acqua fresca attraverso la pelle!',
      'Prima di diventare rane, i piccoli si chiamano girini e nuotano con la coda!',
    ],
    cuddlePhrase: 'Cra cra! Boing! Un salto di gioia tutto per te!',
    scienceFacts: [
      'Gli anfibi anuri respirano e si idratano in parte per osmosi cutanea: questo li rende ottimi bioindicatori ambientali.',
      'I sacchi vocali gonfiabili fungono da casse di risonanza amplificando il richiamo fino a centinaia di metri.',
    ],
    ethologyNote: 'La metamorfosi trasforma un girino acquatico con branchie in un anfibio terrestre a respirazione polmonare e cutanea.',
    quizClue: 'Anfibio bioindicatore che assorbe acqua per osmosi cutanea e amplifica il verso con sacchi vocali.',
  },

  // TAB 2: FAUNA SELVATICA & ECOSISTEMI (6 specie)
  {
    id: 'lion',
    tab: 'savanna',
    name: 'Leone Leo',
    shortName: 'Leone Leo',
    speciesName: 'Leone Africano',
    scientificName: 'Panthera leo',
    biome: 'Savana & Praterie sub-sahariane',
    diet: 'Carnivoro predatore apicale',
    acousticProfile: 'Ruggito a bassa freq. · 40–200 Hz',
    emoji: '🦁',
    soundLabel: 'ROAAAR!',
    habitat: 'Savana dorata',
    portraitSrc: zooLion3d,
    stageSkyGradient: 'from-amber-200 via-orange-100 to-yellow-200',
    stageHillColor: '#d97706',
    cardGradient: 'from-[#ffbe3b] via-[#fb923c] to-[#ea580c]',
    shadowColor: '#b45309',
    playIconClass: 'text-orange-500 fill-orange-500',
    greetings: [
      'Roaaar! Sono Leo il Leone, il re gentile della savana dorata!',
      'Roaaar! Hai sentito che voce forte? Prova a ruggire piano anche tu!',
      'Roaaar! Adoro fare pisolini al sole e salutare gli amici coraggiosi!',
    ],
    curiosities: [
      'Lo sapevi? Il ruggito di un leone si può sentire fino a otto chilometri di distanza!',
      'I leoni adorano dormire al sole: possono riposare anche sedici ore al giorno!',
      'I cuccioli di leone nascono con delle piccole macchie sul pelo che poi scompaiono crescendo.',
    ],
    cuddlePhrase: 'Prrr... Le tue carezze sulla criniera mi fanno fare le fusa come un micione!',
    scienceFacts: [
      'Le corde vocali quadrate e piatte del genere Panthera producono ruggiti fino a 114 dB udibili a 8 km di distanza.',
      'È l’unico grande felino stabilmente sociale: vive in branchi coordinati guidati da femmine imparentate.',
    ],
    ethologyNote: 'Il ruggito collettivo al tramonto delimita i confini territoriali evitando scontri fisici ad alto costo energetico.',
    quizClue: 'Grande felino sociale il cui ruggito a bassa frequenza raggiunge 114 dB e si ode fino a 8 km.',
  },
  {
    id: 'elephant',
    tab: 'savanna',
    name: 'Elefante Elio',
    shortName: 'Elefante Elio',
    speciesName: 'Elefante Africano',
    scientificName: 'Loxodonta africana',
    biome: 'Savana & Foreste tropicali',
    diet: 'Erbivoro megafauna',
    acousticProfile: 'Barrito & Infrasuoni · 14–800 Hz',
    emoji: '🐘',
    soundLabel: 'PA-UUUH!',
    habitat: 'Oasi d’acqua fresca',
    portraitSrc: zooElephant3d,
    stageSkyGradient: 'from-sky-200 via-cyan-100 to-blue-200',
    stageHillColor: '#0284c7',
    cardGradient: 'from-[#38bdf8] via-[#2563eb] to-[#1d4ed8]',
    shadowColor: '#1e40af',
    playIconClass: 'text-blue-600 fill-blue-600',
    greetings: [
      'Pa-uuuh! Con la mia proboscide faccio una doccia fresca piena di bollicine!',
      'Pa-uuuh! Le mie grandi orecchie servono anche per farmi vento quando fa caldo!',
      'Pa-uuuh! Ricordo sempre tutti i miei amici del cuore!',
    ],
    curiosities: [
      'Lo sapevi? Gli elefanti hanno una memoria straordinaria e riconoscono gli amici anche dopo tanti anni!',
      'La proboscide dell’elefante ha più di quarantamila muscoli ed è sia naso sia una mano precisa!',
      'Gli elefanti sentono le vibrazioni lontane persino attraverso le zampe!',
    ],
    cuddlePhrase: 'Pa-uuuh! Che bello giocare con gli spruzzi d’acqua fresca!',
    scienceFacts: [
      'Oltre al barrito udibile, gli elefanti comunicano via infrasuoni sotto i 20 Hz che viaggiano nel suolo per chilometri.',
      'La proboscide è un idrostato muscolare composto da circa 40.000 fasci muscolari privi di ossa.',
    ],
    ethologyNote: 'Struttura matriarcale con memoria spaziale pluridecennale capace di ricordare rotte idriche durante la siccità.',
    quizClue: 'Comunica con infrasuoni sotto i 20 Hz percepiti anche attraverso le zampe e ha 40.000 muscoli nella proboscide.',
  },
  {
    id: 'giraffe',
    tab: 'savanna',
    name: 'Giraffa Gina',
    shortName: 'Giraffa Gina',
    speciesName: 'Giraffa',
    scientificName: 'Giraffa camelopardalis',
    biome: 'Savana arborata ad acacie',
    diet: 'Erbivoro brucatore',
    acousticProfile: 'Ronzio notturno · 90–250 Hz',
    emoji: '🦒',
    soundLabel: 'GNAM GNAM!',
    habitat: 'Alberi di acacia',
    portraitSrc: zooGiraffe3d,
    stageSkyGradient: 'from-lime-100 via-amber-50 to-emerald-200',
    stageHillColor: '#16a34a',
    cardGradient: 'from-[#84cc16] via-[#22c55e] to-[#15803d]',
    shadowColor: '#166534',
    playIconClass: 'text-emerald-600 fill-emerald-600',
    greetings: [
      'Gnam gnam! Da quassù vedo tutto il cielo azzurro e il tuo sorriso!',
      'Col mio collo lungo arrivo fino alle foglioline più tenere in cima agli alberi!',
      'Vuoi guardare il mondo dall’alto insieme a me?',
    ],
    curiosities: [
      'Lo sapevi? La giraffa è l’animale più alto della Terra, e la sua lingua è viola per proteggersi dal sole!',
      'Nonostante il collo lunghissimo, la giraffa ha solo sette vertebre nel collo, proprio come noi!',
      'Ogni giraffa ha macchie uniche sul mantello: non ne esistono due uguali!',
    ],
    cuddlePhrase: 'Gnam gnam! Mmm che buone queste foglioline croccanti!',
    scienceFacts: [
      'Per pompare sangue fino al cervello a oltre 5 metri d’altezza, il cuore genera una pressione arteriosa doppia rispetto a quella umana.',
      'Ricerche di bio-acustica hanno scoperto che le giraffe emettono un ronzio armonico notturno attorno ai 92 Hz.',
    ],
    ethologyNote: 'Possiede solo 7 vertebre cervicali (come tutti i mammiferi), ma ciascuna può superare i 25 cm di lunghezza.',
    quizClue: 'Ha 7 vertebre cervicali allungate, pressione arteriosa doppia dell’uomo e un ronzio notturno a 92 Hz.',
  },
  {
    id: 'zebra',
    tab: 'savanna',
    name: 'Zebra Zoe',
    shortName: 'Zebra Zoe',
    speciesName: 'Zebra delle Pianure',
    scientificName: 'Equus quagga',
    biome: 'Pianure & Savane africane',
    diet: 'Erbivoro pascolatore',
    acousticProfile: 'Richiamo latrante · 450–2200 Hz',
    emoji: '🦓',
    soundLabel: 'HIII-HA!',
    habitat: 'Prati della savana',
    portraitSrc: cardZebra3d,
    stageSkyGradient: 'from-violet-100 via-fuchsia-50 to-indigo-200',
    stageHillColor: '#7c3aed',
    cardGradient: 'from-[#a855f7] via-[#7c3aed] to-[#5b21b6]',
    shadowColor: '#4c1d95',
    playIconClass: 'text-violet-600 fill-violet-600',
    greetings: [
      'Hiii-ha! Ti piace il mio pigiama magico a strisce bianche e nere?',
      'Corro veloce sul prato verde e faccio grandi salti di gioia!',
      'Le mie strisce sono uniche proprio come un’opera d’arte!',
    ],
    curiosities: [
      'Lo sapevi? Le strisce di ogni zebra sono come impronte digitali: nessuna zebra è uguale a un’altra!',
      'Le zebre vivono in grandi famiglie e si proteggono stando tutte vicine!',
      'Una zebra può correre fino a sessantacinque chilometri all’ora e sa correre a zig-zag!',
    ],
    cuddlePhrase: 'Hiii-ha! Che felicità correre sul prato insieme!',
    scienceFacts: [
      'Il pattern a strisce riduce drasticamente gli atterraggi di tafani e mosche tse-tse alterando la luce polarizzata riflessa.',
      'Il mantello è unico per ciascun individuo e crea un effetto di mimetismo disruptivo nella corsa di gruppo.',
    ],
    ethologyNote: 'Forma gruppi coesi in cui i richiami brevi e ritmici servono a mantenere il contatto visivo e acustico tra i membri.',
    quizClue: 'Le sue strisce uniche interferiscono con la luce polarizzata allontanando gli insetti ematofagi.',
  },
  {
    id: 'camel',
    tab: 'savanna',
    name: 'Cammello Camillo',
    shortName: 'Cammello',
    speciesName: 'Dromedario / Cammello',
    scientificName: 'Camelus dromedarius',
    biome: 'Deserti aridi & Steppe',
    diet: 'Erbivoro xerofilo',
    acousticProfile: 'Bramito gutturale · 120–700 Hz',
    emoji: '🐪',
    soundLabel: 'BRRR-HUU!',
    habitat: 'Dune del deserto',
    portraitSrc: cardCamel3d,
    stageSkyGradient: 'from-amber-100 via-orange-100 to-rose-100',
    stageHillColor: '#ea580c',
    cardGradient: 'from-[#f472b6] via-[#ec4899] to-[#be185d]',
    shadowColor: '#9d174d',
    playIconClass: 'text-pink-600 fill-pink-600',
    greetings: [
      'Brrr-huu! Sulle dune calde del deserto cammino piano e non mi stanco mai!',
      'Le mie ciglia lunghissime mi proteggono dalla sabbia dorata!',
      'Saliresti per un piccolo viaggio tra le stelle del deserto?',
    ],
    curiosities: [
      'Lo sapevi? Nelle gobbe del cammello non c’è acqua, ma una riserva di energia per camminare a lungo!',
      'Il cammello ha tre palpebre e ciglia doppie per tenere gli occhi puliti anche nel vento!',
      'Le zampe del cammello sono larghe e morbide come cuscini per non affondare nella sabbia!',
    ],
    cuddlePhrase: 'Mmmm! Questi datteri dolci sono deliziosi!',
    scienceFacts: [
      'La gobba immagazzina tessuto adiposo concentrato, evitando uno strato di grasso isolante su tutto il corpo.',
      'I globuli rossi ovali resistono a forti variazioni osmotiche quando l’animale reidrata decine di litri d’acqua in pochi minuti.',
    ],
    ethologyNote: 'Lascia oscillare la temperatura corporea tra 34 °C e 41 °C durante la giornata per limitare la sudorazione.',
    quizClue: 'Ha globuli rossi ovali e concentra le riserve di grasso nella gobba per tollerare il clima desertico.',
  },
  {
    id: 'owl',
    tab: 'savanna',
    name: 'Gufo Barnaba',
    shortName: 'Gufo Barnaba',
    speciesName: 'Gufo Comune',
    scientificName: 'Asio otus',
    biome: 'Foreste temperate & Boschi',
    diet: 'Carnivoro rapace notturno',
    acousticProfile: 'Richiamo puro · 350–650 Hz',
    emoji: '🦉',
    soundLabel: 'HUU-HUU!',
    habitat: 'Quercia stellata',
    stageSkyGradient: 'from-indigo-900 via-violet-800 to-slate-900',
    stageHillColor: '#312e81',
    cardGradient: 'from-[#6366f1] via-[#4f46e5] to-[#312e81]',
    shadowColor: '#1e1b4b',
    playIconClass: 'text-indigo-600 fill-indigo-600',
    greetings: [
      'Huu-huu! Sono Barnaba il gufo saggio e guardo le stelle dal mio ramo!',
      'Huu-huu! Le mie piume morbide mi fanno volare in completo silenzio!',
      'Huu-huu! Con i miei grandi occhi vedo brillare anche la luna più lontana!',
    ],
    curiosities: [
      'Lo sapevi? Il gufo può girare la testa quasi tutto intorno senza muovere il corpo!',
      'Le ali del gufo hanno bordi soffici che eliminano il rumore dell’aria mentre vola!',
      'I gufi hanno un udito finissimo per ascoltare tutti i suoni notturni del bosco!',
    ],
    cuddlePhrase: 'Huu-huu! Che bel saluto gentile sotto le stelle!',
    scienceFacts: [
      'Le orecchie asimmetriche sul cranio permettono una triangolazione sonora 3D precisa anche nell’oscurità totale.',
      'Le micro-frange sul bordo d’attacco delle remiganti spezzano le turbolenze aerodinamiche rendendo il volo quasi impercettibile.',
    ],
    ethologyNote: '14 vertebre cervicali (il doppio dell’uomo) consentono una rotazione del capo fino a 270 gradi.',
    quizClue: 'Rapace notturno con orecchie asimmetriche per triangolazione 3D e piume frangiate per il volo silenzioso.',
  },
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const AnimalPortraitVisual: React.FC<{
  animal: TalkingAnimal;
  size?: 'spotlight' | 'card';
  isPlaying?: boolean;
  isMature?: boolean;
}> = ({ animal, size = 'card', isPlaying = false, isMature = false }) => {
  if (animal.portraitSrc) {
    return (
      <img
        src={animal.portraitSrc}
        alt={isMature ? animal.speciesName : animal.name}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover object-top transition-transform duration-300 ${
          isPlaying ? 'scale-105' : ''
        }`}
      />
    );
  }

  if (isMature) {
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
        <span
          className={`relative z-10 leading-none select-none transition-transform duration-200 ${
            size === 'spotlight'
              ? 'text-[56px] sm:text-[72px]'
              : 'text-[38px] sm:text-[46px]'
          } ${isPlaying ? 'scale-110' : ''}`}
        >
          {animal.emoji}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-b ${animal.stageSkyGradient} flex items-center justify-center overflow-hidden`}
    >
      <div
        className={`pointer-events-none absolute top-2 right-2.5 rounded-full ${
          animal.id === 'owl'
            ? 'w-6 h-6 bg-amber-200/90'
            : 'w-7 h-7 bg-yellow-200/85 blur-[1px]'
        }`}
      />
      <div
        className="pointer-events-none absolute -bottom-5 -left-4 w-[130%] h-12 rounded-[100%] opacity-80"
        style={{ backgroundColor: animal.stageHillColor }}
      />
      <span
        className={`relative z-10 leading-none select-none drop-shadow-[0_4px_6px_rgba(15,23,42,0.28)] transition-transform duration-200 ${
          size === 'spotlight'
            ? 'text-[64px] sm:text-[78px]'
            : 'text-[44px] sm:text-[52px]'
        } ${isPlaying ? 'scale-110 -rotate-2' : ''}`}
      >
        {animal.emoji}
      </span>
    </div>
  );
};

export const ZooParlanteStudio: React.FC<ZooParlanteStudioProps> = ({
  childProfile,
  onClose,
}) => {
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const ageInfo = useMemo(
    () => calculateChildAge(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const ageTheme = useMemo(
    () => getAgeVisualTheme(ageInfo.years, childProfile?.name, childGender),
    [ageInfo.years, childProfile?.name, childGender]
  );
  const isMature = ageTheme.isMatureTheme;
  const isTeen = ageTheme.stageId === 'teen_nextgen';
  const isExplorer = ageTheme.stageId === 'primary_explorer';
  const gPalette = ageTheme.genderPalette;

  const bravoWord = getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Ottimo lavoro');

  const getDisplayAnimalName = useCallback(
    (animal: TalkingAnimal) => (isMature ? animal.speciesName : isExplorer ? animal.speciesName : animal.name),
    [isMature, isExplorer]
  );

  const getInitialNote = useCallback(
    (animal: TalkingAnimal) =>
      isMature ? animal.scienceFacts[0] : animal.greetings[0],
    [isMature]
  );

  const [mode, setMode] = useState<'explore' | 'guess'>('explore');
  const [habitatTab, setHabitatTab] = useState<HabitatTab>('farm');
  const [selectedId, setSelectedId] = useState<AnimalId>('dog');
  const [speechBubble, setSpeechBubble] = useState<string>(() =>
    getInitialNote(TALKING_ANIMALS[0])
  );
  const [phraseStep, setPhraseStep] = useState<Record<string, number>>({});
  const [curiosityStep, setCuriosityStep] = useState<Record<string, number>>({});
  const [cuddleHearts, setCuddleHearts] = useState<number>(0);
  const [musicOn, setMusicOn] = useState<boolean>(soundManager.musicEnabled);
  const [soundOn, setSoundOn] = useState<boolean>(soundManager.soundEnabled);
  const [playingAnimalId, setPlayingAnimalId] = useState<string | null>(
    soundManager.isAnimalSoundPlaying ? soundManager.activeAnimalSoundId : null
  );

  // Quiz state: scales option count (3 for 2-3y, 4 for 4-11y, 6 for 12-14y) & clue mode for teens
  const quizOptionCount = isTeen ? 6 : ageInfo.years <= 3 ? 3 : 4;
  const [quizOptions, setQuizOptions] = useState<TalkingAnimal[]>(() =>
    shuffleArray(TALKING_ANIMALS).slice(0, quizOptionCount)
  );
  const [quizTarget, setQuizTarget] = useState<TalkingAnimal>(TALKING_ANIMALS[0]);
  const [quizPromptType, setQuizPromptType] = useState<'acoustic' | 'ethology'>('acoustic');
  const [quizSolved, setQuizSolved] = useState<boolean>(false);
  const [quizWrongIds, setQuizWrongIds] = useState<AnimalId[]>([]);
  const [quizStreak, setQuizStreak] = useState<number>(0);

  const isMountedRef = useRef(true);

  const tabAnimals = useMemo(
    () => TALKING_ANIMALS.filter((a) => a.tab === habitatTab),
    [habitatTab]
  );

  const selectedAnimal = useMemo(
    () => TALKING_ANIMALS.find((a) => a.id === selectedId) || TALKING_ANIMALS[0],
    [selectedId]
  );

  useEffect(() => {
    setSpeechBubble(getInitialNote(selectedAnimal));
  }, [isMature, selectedAnimal, getInitialNote]);

  useEffect(() => {
    isMountedRef.current = true;
    soundManager.startBackgroundMusic();
    const unsubMusic = soundManager.onMusicChange((enabled) => setMusicOn(enabled));
    const unsubAnimal = soundManager.onAnimalSoundChange((isPlaying, animalId) => {
      setPlayingAnimalId(isPlaying ? animalId : null);
    });

    TALKING_ANIMALS.slice(0, 6).forEach((a) => soundManager.prewarmAnimalSound(a.id));

    return () => {
      isMountedRef.current = false;
      unsubMusic();
      unsubAnimal();
      soundManager.stopAnimalSound();
      soundManager.stopBackgroundMusic();
      soundManager.stopSpeech();
    };
  }, []);

  useEffect(() => {
    tabAnimals.forEach((a) => soundManager.prewarmAnimalSound(a.id));
  }, [tabAnimals]);

  // Sound-only trigger: uses studio local PCM acoustic WAVs (includeVocalImitation: false -> zero TTS quota drain!)
  const handlePlaySoundOnly = useCallback((animal: TalkingAnimal) => {
    soundManager.unlockAudio();
    if (!soundManager.soundEnabled) {
      soundManager.soundEnabled = true;
      setSoundOn(true);
    }
    soundManager.playAnimalSound(animal.id, {
      includeVocalImitation: false,
      stopSpeechFirst: true,
    });
  }, []);

  const handleSelectAnimal = useCallback(
    (animal: TalkingAnimal) => {
      soundManager.unlockAudio();
      if (!soundManager.soundEnabled) {
        soundManager.soundEnabled = true;
        setSoundOn(true);
      }
      setSelectedId(animal.id);
      const pool = isMature ? animal.scienceFacts : animal.greetings;
      const idx = phraseStep[animal.id] ?? 0;
      const line = pool[idx % pool.length];
      setPhraseStep((prev) => ({ ...prev, [animal.id]: idx + 1 }));
      setSpeechBubble(line);

      soundManager.playAnimalSound(animal.id, {
        includeVocalImitation: false,
        stopSpeechFirst: true,
        onEnd: () => {
          if (!isMountedRef.current) return;
          soundManager.speak(line, { context: isMature ? 'general' : 'praise' });
        },
      });
    },
    [phraseStep, isMature]
  );

  const handleCuriosity = () => {
    soundManager.unlockAudio();
    soundManager.stopAnimalSound();
    const pool = isMature ? selectedAnimal.scienceFacts : selectedAnimal.curiosities;
    const idx = curiosityStep[selectedAnimal.id] ?? 0;
    const fact = pool[idx % pool.length];
    setCuriosityStep((prev) => ({ ...prev, [selectedAnimal.id]: idx + 1 }));
    setSpeechBubble(fact);
    soundManager.playTwinkle();
    soundManager.speak(fact, { context: 'general' });
  };

  const handleSecondaryAction = () => {
    soundManager.unlockAudio();
    soundManager.stopAnimalSound();
    if (isMature) {
      const note = `${selectedAnimal.speciesName} (${selectedAnimal.scientificName}): ${selectedAnimal.ethologyNote}`;
      setSpeechBubble(selectedAnimal.ethologyNote);
      soundManager.playPop();
      soundManager.speak(note, { context: 'general' });
    } else {
      const line = selectedAnimal.cuddlePhrase;
      setSpeechBubble(line);
      setCuddleHearts((c) => c + 1);
      soundManager.playSuccess();
      confetti.burst();
      soundManager.speakPraise(line);
    }
  };

  const startNewGuessRound = useCallback(
    (excludeId?: AnimalId) => {
      soundManager.unlockAudio();
      soundManager.stopSpeech();
      soundManager.stopAnimalSound();

      const pool = excludeId
        ? TALKING_ANIMALS.filter((a) => a.id !== excludeId)
        : TALKING_ANIMALS;
      const target =
        pool[Math.floor(Math.random() * pool.length)] || TALKING_ANIMALS[0];

      const distractors = shuffleArray(
        TALKING_ANIMALS.filter((a) => a.id !== target.id)
      ).slice(0, quizOptionCount - 1);
      const roundOptions = shuffleArray([target, ...distractors]);

      // Teens alternate between acoustic identification & scientific ethology clue challenges
      const nextPromptType: 'acoustic' | 'ethology' =
        isTeen && Math.random() < 0.45 ? 'ethology' : 'acoustic';

      setQuizOptions(roundOptions);
      setQuizTarget(target);
      setQuizPromptType(nextPromptType);
      setQuizSolved(false);
      setQuizWrongIds([]);

      roundOptions.forEach((a) => soundManager.prewarmAnimalSound(a.id));

      setTimeout(() => {
        if (!isMountedRef.current) return;
        if (nextPromptType === 'ethology') {
          soundManager.speakInstruction(
            `Identifica la specie dall'indizio scientifico: ${target.quizClue}`
          );
        } else {
          soundManager.playAnimalSound(target.id, {
            includeVocalImitation: false,
            stopSpeechFirst: true,
            onEnd: () => {
              if (!isMountedRef.current) return;
              soundManager.speakInstruction(
                isMature
                  ? 'Analizza il segnale acustico: a quale specie appartiene?'
                  : 'Ascolta bene! Quale animale fa questo verso?'
              );
            },
          });
        }
      }, 150);
    },
    [quizOptionCount, isTeen, isMature]
  );

  const handleSwitchMode = (nextMode: 'explore' | 'guess') => {
    soundManager.unlockAudio();
    soundManager.playPop();
    soundManager.stopSpeech();
    soundManager.stopAnimalSound();
    setMode(nextMode);
    if (nextMode === 'guess') {
      startNewGuessRound();
    } else {
      setSpeechBubble(getInitialNote(selectedAnimal));
    }
  };

  const handleSwitchTab = (nextTab: HabitatTab) => {
    soundManager.playPop();
    setHabitatTab(nextTab);
    const firstInTab = TALKING_ANIMALS.find((a) => a.tab === nextTab);
    if (firstInTab) {
      setSelectedId(firstInTab.id);
      setSpeechBubble(getInitialNote(firstInTab));
    }
  };

  const handleGuessPick = (animal: TalkingAnimal) => {
    if (quizSolved || quizWrongIds.includes(animal.id)) return;
    soundManager.unlockAudio();

    if (animal.id === quizTarget.id) {
      setQuizSolved(true);
      setQuizWrongIds([]);
      const nextStreak = quizStreak + 1;
      setQuizStreak(nextStreak);
      soundManager.playFanfare();
      if (!isTeen) confetti.burst();
      const greetPrefix =
        nextStreak % 5 === 0 ? `${bravoWord} ${childName}!` : `${bravoWord}!`;
      soundManager.playAnimalSound(animal.id, {
        includeVocalImitation: false,
        stopSpeechFirst: true,
        onEnd: () => {
          if (!isMountedRef.current) return;
          soundManager.speakPraise(
            isMature
              ? `Esatto! ${animal.speciesName}, nome scientifico ${animal.scientificName}.`
              : `${greetPrefix} Era proprio ${getDisplayAnimalName(animal)}!`
          );
        },
      });
    } else {
      setQuizWrongIds((prev) => [...prev, animal.id]);
      soundManager.playEncouragement();
      soundManager.speak(
        isMature
          ? 'Non è questa specie. Riascolta il profilo sonoro o verifica gli indizi.'
          : 'Quasi! Riascolta bene il verso e riprova con calma!',
        {
          context: 'instruction',
          onEnd: () => {
            if (!isMountedRef.current) return;
            if (quizPromptType === 'acoustic') {
              soundManager.playAnimalSound(quizTarget.id, {
                includeVocalImitation: false,
                stopSpeechFirst: false,
              });
            }
          },
        }
      );
    }
  };

  const isSelectedPlaying = playingAnimalId === selectedAnimal.id;
  const isQuizTargetPlaying = playingAnimalId === quizTarget.id;

  const studioHeaderTitle = isTeen
    ? 'Bio-Acustica & Etologia'
    : isMature
    ? 'Atlante Natura'
    : isExplorer
    ? 'Mondo Animale'
    : 'Zoo & Fattoria Parlante';

  return (
    <div
      className={`safe-viewport-pad relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${
        isMature ? 'bg-[#0b0f17] text-slate-100' : 'bg-sky-200 text-slate-900'
      }`}
    >
      {/* AGE-ADAPTIVE BACKDROP */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {isMature ? (
          <div className="w-full h-full bg-gradient-to-b from-[#0b0f17] via-[#0f172a] to-[#090d16]" />
        ) : (
          <>
            <img
              src={arenaMeadowBackdrop}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover object-center scale-[1.01] ${
                isExplorer ? 'brightness-[0.95] saturate-[0.82]' : ''
              }`}
            />
            <div
              className="absolute inset-0"
              style={{
                background: isExplorer
                  ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.22) 0%, rgba(248, 250, 252, 0.35) 55%, rgba(15, 23, 42, 0.25) 100%)'
                  : 'linear-gradient(180deg, rgba(14, 165, 233, 0.14) 0%, rgba(255, 255, 255, 0.04) 48%, rgba(22, 101, 52, 0.16) 100%)',
              }}
            />
          </>
        )}
      </div>

      {/* ALIGNED 3-COLUMN TOP HEADER (ZERO OVERLAP) */}
      <header className="landscape-header-compact app-shell-container relative z-10 px-3 sm:px-5 lg:px-8 pt-2 sm:pt-3 pb-1 shrink-0">
        <div className="ui-aligned-header max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => {
              soundManager.stopAnimalSound();
              soundManager.stopSpeech();
              soundManager.playPop();
              onClose();
            }}
            aria-label="Torna alla Home"
            className={`px-3 sm:px-4 h-10 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors ${
              isMature
                ? 'rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-white/12'
                : 'glossy-bubble-btn bg-white text-slate-900 rounded-full border-2 border-white'
            }`}
          >
            <Home className={`w-4 h-4 shrink-0 ${isMature ? gPalette.accentTextClass : 'text-slate-700'}`} />
            <span className="hidden min-[360px]:inline font-fun font-bold text-xs sm:text-sm whitespace-nowrap">
              Home
            </span>
          </button>

          <div
            className={`h-10 px-3 sm:px-4 flex items-center justify-center gap-2 min-w-0 mx-auto max-w-full ${
              isMature
                ? `rounded-xl bg-slate-900/95 border ${gPalette.accentBorderClass} text-slate-100`
                : `rounded-full bg-gradient-to-r ${gPalette.headerGradientClass} border-2 border-white/85 text-white shadow-sm`
            }`}
          >
            {isMature ? (
              <AudioLines className={`w-4 h-4 shrink-0 ${gPalette.accentTextClass}`} />
            ) : (
              <span className="text-sm sm:text-base leading-none shrink-0">🐾</span>
            )}
            <span className="font-kids font-bold text-xs sm:text-sm tracking-tight truncate">
              {studioHeaderTitle}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = soundManager.toggleMusic();
              setMusicOn(next);
            }}
            title={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
            aria-label={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
            className={`w-10 h-10 flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
              isMature
                ? musicOn
                  ? `rounded-xl ${gPalette.accentBgClass} border border-white/10`
                  : 'rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/12'
                : `glossy-bubble-btn rounded-full border-2 ${
                    musicOn
                      ? `${gPalette.accentBgClass} border-white/90`
                      : 'bg-white text-slate-600 border-white'
                  }`
            }`}
          >
            {musicOn ? (
              <Music className="w-4 h-4 stroke-[2.4]" />
            ) : (
              <VolumeX className="w-4 h-4 stroke-[2.4]" />
            )}
          </button>
        </div>
      </header>

      {/* ONE-TAP UNMUTE HELPER BANNER IF SOUND EFFECTS ARE MUTED */}
      {!soundOn && (
        <div className="app-shell-container relative z-10 px-3 sm:px-5 lg:px-8 pt-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundManager.soundEnabled = true;
              soundManager.unlockAudio();
              setSoundOn(true);
              handlePlaySoundOnly(selectedAnimal);
            }}
            className="w-full max-w-md mx-auto rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 border border-amber-200 px-3.5 py-2 flex items-center justify-center gap-2 font-fun font-bold text-xs sm:text-sm cursor-pointer"
          >
            <Volume2 className="w-4 h-4 shrink-0" />
            <span>Tocca qui per attivare l’audio e ascoltare i suoni naturali</span>
          </button>
        </div>
      )}

      {/* ALIGNED 2-TAB MODE SWITCHER */}
      <nav className="app-shell-container relative z-10 px-3 sm:px-5 lg:px-8 py-1.5 shrink-0">
        <div
          className={`ui-aligned-tabs grid-cols-2 max-w-md mx-auto p-1 ${
            isMature
              ? 'bg-slate-900/95 border border-white/10 rounded-xl'
              : isExplorer
              ? 'bg-white/90 border border-slate-200 rounded-2xl shadow-sm'
              : 'storybook-wood-shelf rounded-2xl p-1.5'
          }`}
        >
          <button
            type="button"
            onClick={() => handleSwitchMode('explore')}
            className={`px-2.5 py-2 font-fun font-bold text-xs sm:text-sm cursor-pointer transition-all ${
              isMature
                ? mode === 'explore'
                  ? `${gPalette.tabActiveClass} rounded-lg`
                  : 'text-slate-400 hover:text-slate-100 rounded-lg'
                : isExplorer
                ? mode === 'explore'
                  ? `${gPalette.tabActiveClass} rounded-xl`
                  : 'text-slate-600 hover:text-slate-900 rounded-xl'
                : mode === 'explore'
                ? `${gPalette.tabActiveClass} rounded-xl border-2 border-white`
                : 'bg-amber-950/35 text-amber-50 hover:bg-amber-950/45 rounded-xl'
            }`}
          >
            {isMature ? <Compass className="w-4 h-4 shrink-0" /> : <span className="shrink-0">🐾</span>}
            <span className="truncate">
              {isMature ? 'Archivio Specie (14)' : 'Esplora Versi (14)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('guess')}
            className={`px-2.5 py-2 font-fun font-bold text-xs sm:text-sm cursor-pointer transition-all ${
              isMature
                ? mode === 'guess'
                  ? `${gPalette.tabActiveClass} rounded-lg`
                  : 'text-slate-400 hover:text-slate-100 rounded-lg'
                : isExplorer
                ? mode === 'guess'
                  ? `${gPalette.tabActiveClass} rounded-xl`
                  : 'text-slate-600 hover:text-slate-900 rounded-xl'
                : mode === 'guess'
                ? `${gPalette.tabActiveClass} rounded-xl border-2 border-white`
                : 'bg-amber-950/35 text-amber-50 hover:bg-amber-950/45 rounded-xl'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {isTeen ? 'Quiz Bio-Acustico' : isMature ? 'Sfida Sonora' : 'Indovina il Verso'}
            </span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT STAGE */}
      <main className="app-shell-container relative z-10 flex-1 flex flex-col justify-start px-3 sm:px-5 lg:px-8 py-1.5 w-full min-h-0 gap-2.5 overflow-y-auto">
        {mode === 'explore' ? (
          <>
            {/* SPOTLIGHT PANEL FOR SELECTED SPECIES */}
            <section
              className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 max-w-3xl mx-auto w-full shrink-0 ${
                isMature
                  ? 'rounded-2xl bg-slate-900/95 border border-white/10'
                  : 'storybook-parchment-board rounded-[24px]'
              }`}
            >
              {/* Tappable Sound-First Portrait */}
              <button
                type="button"
                onClick={() => handlePlaySoundOnly(selectedAnimal)}
                title={`Ascolta il suono di ${getDisplayAnimalName(selectedAnimal)}`}
                className="relative shrink-0 cursor-pointer group focus:outline-none"
              >
                <div
                  className={`w-24 h-24 sm:w-32 sm:h-32 overflow-hidden transition-transform ${
                    isMature
                      ? `rounded-2xl border ${isSelectedPlaying ? gPalette.accentBorderClass : 'border-white/15'} bg-slate-950`
                      : `rounded-3xl border-4 border-white shadow-lg bg-gradient-to-b ${selectedAnimal.cardGradient}`
                  } ${isSelectedPlaying ? 'scale-103' : 'group-hover:scale-102'}`}
                >
                  <AnimalPortraitVisual
                    animal={selectedAnimal}
                    size="spotlight"
                    isPlaying={isSelectedPlaying}
                    isMature={isMature}
                  />
                </div>
                {!isMature && (
                  <span
                    className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full font-fun font-extrabold text-[10px] sm:text-xs whitespace-nowrap border-2 shadow-sm ${
                      isSelectedPlaying
                        ? 'bg-emerald-600 text-white border-emerald-200'
                        : 'bg-slate-900 text-amber-200 border-amber-300'
                    }`}
                  >
                    {selectedAnimal.soundLabel}
                  </span>
                )}
              </button>

              {/* Details & Actions */}
              <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2
                    className={`font-kids font-bold text-lg sm:text-2xl leading-tight ${
                      isMature ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {!isMature && `${selectedAnimal.emoji} `}
                    {getDisplayAnimalName(selectedAnimal)}
                  </h2>
                  {isMature ? (
                    <span className="text-xs sm:text-sm italic text-slate-400 font-medium">
                      {selectedAnimal.scientificName}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-fun font-bold">
                      {selectedAnimal.habitat}
                    </span>
                  )}
                </div>

                {/* Compact Scientific Metadata Row for Preteen/Teen (9-14) */}
                {isMature && (
                  <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    <span>Bioma: <strong className="text-slate-200 font-semibold">{selectedAnimal.biome}</strong></span>
                    <span>Dieta: <strong className="text-slate-200 font-semibold">{selectedAnimal.diet}</strong></span>
                    <span className="tabular-nums">Acustica: <strong className={`${gPalette.accentTextClass} font-semibold`}>{selectedAnimal.acousticProfile}</strong></span>
                  </div>
                )}

                <div
                  className={`mt-2 px-3.5 py-2 text-xs sm:text-sm leading-relaxed ${
                    isMature
                      ? 'rounded-xl bg-slate-950/80 border border-white/8 text-slate-200 font-normal'
                      : 'storybook-tray-3d rounded-2xl font-semibold text-amber-950'
                  }`}
                >
                  {isMature ? speechBubble : `“${speechBubble}”`}
                </div>

                {/* 3 Aligned Action Buttons */}
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlaySoundOnly(selectedAnimal)}
                    className={`min-w-0 cursor-pointer transition-colors ${
                      isMature
                        ? `rounded-xl py-2 px-2.5 ${gPalette.accentBgClass} ${gPalette.accentBgHoverClass} font-fun font-semibold text-xs flex items-center justify-center gap-1.5`
                        : 'home-wood-outer rounded-2xl p-[3px]'
                    }`}
                  >
                    {isMature ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{isSelectedPlaying ? 'In corso...' : 'Suono'}</span>
                      </>
                    ) : (
                      <span className="home-inner-orange rounded-[13px] py-2 px-1.5 flex items-center justify-center gap-1 text-white font-fun font-extrabold text-[11px] sm:text-xs">
                        <Volume2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{isSelectedPlaying ? 'Suona...' : 'Verso'}</span>
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCuriosity}
                    className={`min-w-0 cursor-pointer transition-colors ${
                      isMature
                        ? 'rounded-xl py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10 font-fun font-semibold text-xs flex items-center justify-center gap-1.5'
                        : 'home-wood-outer rounded-2xl p-[3px]'
                    }`}
                  >
                    {isMature ? (
                      <>
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Scheda</span>
                      </>
                    ) : (
                      <span className="home-inner-teal rounded-[13px] py-2 px-1.5 flex items-center justify-center gap-1 text-white font-fun font-extrabold text-[11px] sm:text-xs">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200" />
                        <span className="truncate">Curiosità</span>
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSecondaryAction}
                    className={`min-w-0 cursor-pointer transition-colors ${
                      isMature
                        ? 'rounded-xl py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10 font-fun font-semibold text-xs flex items-center justify-center gap-1.5'
                        : 'home-lavender-outer rounded-2xl p-[3px]'
                    }`}
                  >
                    {isMature ? (
                      <>
                        <Compass className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Etologia</span>
                      </>
                    ) : (
                      <span className="home-inner-purple rounded-[13px] py-2 px-1.5 flex items-center justify-center gap-1 text-white font-fun font-extrabold text-[11px] sm:text-xs">
                        <Heart className="w-3.5 h-3.5 shrink-0 fill-pink-200 text-pink-200" />
                        <span className="truncate">{isExplorer ? 'Saluta' : 'Coccole'}</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* ALIGNED HABITAT TABS */}
            <div className="max-w-3xl mx-auto w-full grid grid-cols-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchTab('farm')}
                className={`py-2 px-3 font-fun font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                  isMature
                    ? habitatTab === 'farm'
                      ? `rounded-xl ${gPalette.tabActiveClass}`
                      : 'rounded-xl bg-slate-900 text-slate-400 hover:text-slate-100 border border-white/10'
                    : habitatTab === 'farm'
                    ? `rounded-2xl ${gPalette.tabActiveClass} border-2 border-white`
                    : 'rounded-2xl bg-white/85 text-slate-800 border-2 border-slate-200 hover:bg-white'
                }`}
              >
                {!isMature && <span className="shrink-0">🏡</span>}
                <span className="truncate">
                  {isMature ? 'Fauna Domestica & Stagni (8)' : 'Fattoria & Bosco (8)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab('savanna')}
                className={`py-2 px-3 font-fun font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                  isMature
                    ? habitatTab === 'savanna'
                      ? `rounded-xl ${gPalette.tabActiveClass}`
                      : 'rounded-xl bg-slate-900 text-slate-400 hover:text-slate-100 border border-white/10'
                    : habitatTab === 'savanna'
                    ? `rounded-2xl ${gPalette.tabActiveClass} border-2 border-white`
                    : 'rounded-2xl bg-white/85 text-slate-800 border-2 border-slate-200 hover:bg-white'
                }`}
              >
                {!isMature && <span className="shrink-0">🦁</span>}
                <span className="truncate">
                  {isMature ? 'Fauna Selvatica & Ecosistemi (6)' : 'Savana & Natura (6)'}
                </span>
              </button>
            </div>

            {/* SPECIES GRID */}
            <section
              className={`max-w-3xl mx-auto w-full shrink-0 ${
                isMature
                  ? 'rounded-2xl bg-slate-900/75 border border-white/10 p-2.5 sm:p-3'
                  : 'storybook-wood-shelf rounded-3xl p-2.5 sm:p-3'
              }`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {tabAnimals.map((animal) => {
                  const isActive = animal.id === selectedAnimal.id;
                  const isPlayingCard = playingAnimalId === animal.id;
                  return (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => handleSelectAnimal(animal)}
                      style={
                        isMature
                          ? undefined
                          : {
                              boxShadow: `0 4px 0 ${animal.shadowColor}, 0 10px 18px -6px rgba(15, 23, 42, 0.3)`,
                            }
                      }
                      className={`flex flex-col text-left cursor-pointer w-full transition-all overflow-hidden ${
                        isMature
                          ? `rounded-xl bg-slate-950/90 border ${
                              isPlayingCard || isActive
                                ? `${gPalette.accentBorderClass} ring-1 ${gPalette.accentRingClass}`
                                : 'border-white/10 hover:border-white/25'
                            }`
                          : `zoo-3d-card bg-gradient-to-b ${animal.cardGradient} ${
                              isPlayingCard
                                ? 'ring-3 ring-emerald-300 scale-[1.02]'
                                : isActive
                                ? 'ring-3 ring-yellow-200 scale-[1.01]'
                                : ''
                            }`
                      }`}
                    >
                      <div className="relative w-full h-20 sm:h-24 overflow-hidden">
                        <AnimalPortraitVisual
                          animal={animal}
                          size="card"
                          isPlaying={isPlayingCard}
                          isMature={isMature}
                        />
                        {!isMature && (
                          <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/35 to-transparent" />
                        )}
                        <span
                          className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                            isMature
                              ? isPlayingCard
                                ? gPalette.accentBgClass
                                : 'bg-slate-900/85 border border-white/15 text-slate-200'
                              : `storybook-play-dot ${isPlayingCard ? 'bg-emerald-500' : ''}`
                          }`}
                        >
                          {isPlayingCard ? (
                            <Volume2 className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Play
                              className={`w-3 h-3 ml-0.5 ${
                                isMature ? 'text-slate-200 fill-slate-200' : animal.playIconClass
                              }`}
                            />
                          )}
                        </span>
                      </div>
                      <div className="px-2 py-1.5 text-center leading-tight">
                        {isMature ? (
                          <>
                            <span className="block font-fun font-semibold text-xs text-slate-100 truncate">
                              {animal.speciesName}
                            </span>
                            <span className="block text-[10px] italic text-slate-400 truncate mt-0.5">
                              {animal.scientificName}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="block text-[9.5px] font-extrabold uppercase tracking-wide text-white/95">
                              {animal.soundLabel}
                            </span>
                            <span className="block font-kids font-bold text-xs sm:text-sm text-white mt-0.5 truncate">
                              {isExplorer ? animal.speciesName : animal.shortName}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          /* QUIZ MODE (3 OPTIONS 2-3y, 4 OPTIONS 4-11y, 6 OPTIONS + ETHOLOGY CLUES 12-14y) */
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
            <section
              className={`p-4 sm:p-5 text-center ${
                isMature
                  ? 'rounded-2xl bg-slate-900/95 border border-white/10'
                  : 'storybook-parchment-board rounded-[24px]'
              }`}
            >
              <p
                className={`text-xs font-fun font-bold uppercase tracking-wider tabular-nums ${
                  isMature ? gPalette.accentTextClass : 'text-indigo-700'
                }`}
              >
                {isMature
                  ? `${quizPromptType === 'ethology' ? 'Indizio Etologico' : 'Riconoscimento Acustico'} · Serie: ${quizStreak}`
                  : `Gioco di Svago · Serie: ${quizStreak} ⭐`}
              </p>

              <h2
                className={`font-kids font-bold text-base sm:text-xl mt-1.5 ${
                  isMature ? 'text-white' : 'text-slate-900'
                }`}
              >
                {quizSolved
                  ? isMature
                    ? `Corretto · ${quizTarget.speciesName} (${quizTarget.scientificName})`
                    : `${bravoWord}! Era proprio ${getDisplayAnimalName(quizTarget)}!`
                  : quizPromptType === 'ethology'
                  ? quizTarget.quizClue
                  : isMature
                  ? 'Riconosci la specie dal segnale acustico riprodotto'
                  : 'Ascolta il verso: quale animale sta parlando?'}
              </h2>

              <div className="mt-3 flex items-center justify-center gap-2.5 flex-wrap">
                {quizPromptType === 'acoustic' && (
                  <button
                    type="button"
                    onClick={() => handlePlaySoundOnly(quizTarget)}
                    className={`cursor-pointer transition-colors ${
                      isMature
                        ? `rounded-xl px-4 py-2 ${gPalette.accentBgClass} ${gPalette.accentBgHoverClass} font-fun font-semibold text-xs sm:text-sm inline-flex items-center gap-2`
                        : 'home-wood-outer rounded-2xl p-[3px]'
                    }`}
                  >
                    {isMature ? (
                      <>
                        <Volume2 className="w-4 h-4 shrink-0" />
                        <span>{isQuizTargetPlaying ? 'Riproduzione...' : 'Riproduci Suono'}</span>
                      </>
                    ) : (
                      <span className="home-inner-orange rounded-[13px] px-4 py-2 inline-flex items-center gap-2 text-white font-kids font-bold text-sm">
                        <Volume2 className="w-4 h-4 shrink-0" />
                        <span>{isQuizTargetPlaying ? 'Ascolta...' : 'Riascolta il Verso'}</span>
                      </span>
                    )}
                  </button>
                )}

                {quizSolved && (
                  <button
                    type="button"
                    onClick={() => startNewGuessRound(quizTarget.id)}
                    className={`cursor-pointer transition-colors ${
                      isMature
                        ? 'rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-fun font-semibold text-xs sm:text-sm inline-flex items-center gap-2'
                        : 'home-wood-outer rounded-2xl p-[3px]'
                    }`}
                  >
                    {isMature ? (
                      <>
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>Prossima Domanda</span>
                      </>
                    ) : (
                      <span className="home-inner-green rounded-[13px] px-4 py-2 inline-flex items-center gap-2 text-white font-kids font-bold text-sm">
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>Prossimo Verso</span>
                      </span>
                    )}
                  </button>
                )}
              </div>
            </section>

            <section
              className={
                isMature
                  ? 'rounded-2xl bg-slate-900/75 border border-white/10 p-2.5 sm:p-3'
                  : 'storybook-wood-shelf rounded-3xl p-2.5 sm:p-3'
              }
            >
              <div
                className={`grid gap-2.5 ${
                  quizOptions.length === 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : quizOptions.length === 6
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-4'
                }`}
              >
                {quizOptions.map((animal, idx) => {
                  const isWinner = quizSolved && animal.id === quizTarget.id;
                  const isWrong = quizWrongIds.includes(animal.id);
                  const isLastOdd = quizOptions.length === 3 && idx === 2;
                  return (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => handleGuessPick(animal)}
                      style={
                        isMature
                          ? undefined
                          : {
                              boxShadow: `0 4px 0 ${animal.shadowColor}, 0 10px 18px -6px rgba(15, 23, 42, 0.3)`,
                            }
                      }
                      className={`flex flex-col text-left cursor-pointer transition-all overflow-hidden ${
                        isLastOdd ? 'col-span-2 sm:col-span-1 w-[68%] sm:w-full mx-auto' : 'w-full'
                      } ${
                        isMature
                          ? `rounded-xl bg-slate-950/90 border ${
                              isWinner
                                ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                                : isWrong
                                ? 'opacity-35 grayscale pointer-events-none border-white/5'
                                : 'border-white/10 hover:border-white/30'
                            }`
                          : `zoo-3d-card bg-gradient-to-b ${animal.cardGradient} ${
                              isWinner
                                ? 'ring-4 ring-emerald-300 scale-[1.02]'
                                : isWrong
                                ? 'opacity-45 grayscale scale-95 pointer-events-none'
                                : ''
                            }`
                      }`}
                    >
                      <div className="relative w-full h-24 sm:h-28 overflow-hidden">
                        <AnimalPortraitVisual
                          animal={animal}
                          size="card"
                          isPlaying={isWinner && isQuizTargetPlaying}
                          isMature={isMature}
                        />
                        {isWinner && (
                          <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="px-2 py-2 text-center leading-tight">
                        <span
                          className={`block font-fun font-bold text-xs sm:text-sm truncate ${
                            isMature ? 'text-slate-100' : 'text-white'
                          }`}
                        >
                          {getDisplayAnimalName(animal)}
                        </span>
                        {isMature && (
                          <span className="block text-[10px] italic text-slate-400 truncate mt-0.5">
                            {animal.scientificName}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ALIGNED COMPACT FOOTER */}
      <footer className="landscape-footer-compact app-shell-container relative z-10 px-3 sm:px-5 lg:px-8 pb-2 sm:pb-3 w-full shrink-0">
        <div
          className={`px-3.5 py-2 flex items-center justify-between gap-2 max-w-3xl mx-auto ${
            isMature
              ? 'rounded-xl bg-slate-900/90 border border-white/10 text-slate-300'
              : 'storybook-footer-pill rounded-2xl text-amber-950'
          }`}
        >
          <span className="text-xs font-fun font-semibold truncate">
            {isMature
              ? 'Archivio bio-acustico · Tocca una specie per analizzarne suono, habitat e note scientifiche'
              : 'Tocca gli animali per ascoltare i versi della fattoria e della savana'}
          </span>
          {!isMature && cuddleHearts > 0 && (
            <span className={`px-2.5 py-0.5 rounded-full font-fun font-bold text-xs whitespace-nowrap shrink-0 ${gPalette.badgeClass}`}>
              ♥ {cuddleHearts}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};
