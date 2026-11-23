// =============================================================================
// GIOCHI DI SVAGO ENGINE: LABIRINTO, TROVA LE DIFFERENZE & TRIS AI
// 100% client-side, freshly randomized every round, age-adaptive (2-14 anni).
// Scales themes, grid complexity, visual precision, and Minimax strategy by age.
// =============================================================================

export type SvagoGameMode = 'maze' | 'differences' | 'tris';

// -----------------------------------------------------------------------------
// 1. LABIRINTO (PROCEDURAL GUARANTEED-SOLVABLE MAZE ENGINE)
// -----------------------------------------------------------------------------

export interface MazeCell {
  row: number;
  col: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

export interface MazeTheme {
  id: string;
  title: string;
  heroEmoji: string;
  goalEmoji: string;
  voicePrompt: string;
  voiceWin: string;
  floorBg: string;
  pathColor: string;
  wallColor: string;
  wallHighlight: string;
  trailColor: string;
  /** Minimum recommended age band ('early' = 2-8, 'explorer' = 6-10, 'mature' = 9-14) */
  ageTier: 'early' | 'explorer' | 'mature';
  isDarkTheme?: boolean;
}

export interface MazePuzzle {
  rows: number;
  cols: number;
  grid: MazeCell[][];
  start: { row: number; col: number };
  goal: { row: number; col: number };
  theme: MazeTheme;
  optimalSteps: number;
}

export const MAZE_THEMES: MazeTheme[] = [
  // EARLY CHILDHOOD & PRIMARY (2-8 anni)
  {
    id: 'bunny',
    title: 'Il Prato del Coniglietto',
    heroEmoji: '🐰',
    goalEmoji: '🥕',
    voicePrompt: 'Aiuta il coniglietto a raggiungere la carota d’oro nel labirinto!',
    voiceWin: 'Evviva! Il coniglietto ha trovato la sua carota croccante!',
    floorBg: '#ecfccb',
    pathColor: '#fef9c3',
    wallColor: '#15803d',
    wallHighlight: '#4ade80',
    trailColor: 'rgba(250, 204, 21, 0.55)',
    ageTier: 'early',
  },
  {
    id: 'bee',
    title: 'Il Giardino dell’Apina',
    heroEmoji: '🐝',
    goalEmoji: '🍯',
    voicePrompt: 'Guida l’apina tra i fiori fino al vasetto di miele!',
    voiceWin: 'Ottimo lavoro! L’apina è arrivata al miele dolce!',
    floorBg: '#fef3c7',
    pathColor: '#fffbeb',
    wallColor: '#0f766e',
    wallHighlight: '#2dd4bf',
    trailColor: 'rgba(245, 158, 11, 0.45)',
    ageTier: 'early',
  },
  {
    id: 'puppy',
    title: 'Il Parco del Cagnolino',
    heroEmoji: '🐶',
    goalEmoji: '🦴',
    voicePrompt: 'Accompagna il cagnolino fino al suo osso magico!',
    voiceWin: 'Bau bau! Il cagnolino ha trovato l’osso magico!',
    floorBg: '#e0f2fe',
    pathColor: '#f8fafc',
    wallColor: '#b45309',
    wallHighlight: '#f59e0b',
    trailColor: 'rgba(56, 189, 248, 0.45)',
    ageTier: 'early',
  },
  {
    id: 'fox',
    title: 'Sentiero della Volpe',
    heroEmoji: '🦊',
    goalEmoji: '🧭',
    voicePrompt: 'Guida la volpe lungo il sentiero fino alla bussola!',
    voiceWin: 'Percorso completato! La volpe ha trovato la bussola!',
    floorBg: '#f0fdf4',
    pathColor: '#ffffff',
    wallColor: '#166534',
    wallHighlight: '#22c55e',
    trailColor: 'rgba(16, 185, 129, 0.4)',
    ageTier: 'explorer',
  },
  {
    id: 'rocket',
    title: 'Rotta Orbitale',
    heroEmoji: '🚀',
    goalEmoji: '⭐',
    voicePrompt: 'Calcola la rotta nello spazio fino alla stella obiettivo!',
    voiceWin: 'Rotta completata! Obiettivo stellare raggiunto!',
    floorBg: '#1e1b4b',
    pathColor: '#1e293b',
    wallColor: '#6366f1',
    wallHighlight: '#a5b4fc',
    trailColor: 'rgba(253, 224, 71, 0.45)',
    ageTier: 'explorer',
    isDarkTheme: true,
  },

  // PRETEEN & TEEN MINIMAL / TACTICAL LABYRINTHS (9-14 anni)
  {
    id: 'orbital_station',
    title: 'Stazione Orbitale · Modulo Alpha',
    heroEmoji: '🛰️',
    goalEmoji: '🎯',
    voicePrompt: 'Trova il percorso più breve attraverso il modulo orbitale fino al target.',
    voiceWin: 'Navigazione orbitale completata con successo.',
    floorBg: '#0b1120',
    pathColor: '#111827',
    wallColor: '#38bdf8',
    wallHighlight: '#7dd3fc',
    trailColor: 'rgba(56, 189, 248, 0.45)',
    ageTier: 'mature',
    isDarkTheme: true,
  },
  {
    id: 'cyber_grid',
    title: 'Rete Logica · Nodo Centrale',
    heroEmoji: '⚡',
    goalEmoji: '🔷',
    voicePrompt: 'Instrada il segnale lungo la rete logica minimizzando i passaggi.',
    voiceWin: 'Connessione al nodo centrale stabilita.',
    floorBg: '#090d16',
    pathColor: '#131c2e',
    wallColor: '#64748b',
    wallHighlight: '#94a3b8',
    trailColor: 'rgba(99, 102, 241, 0.5)',
    ageTier: 'mature',
    isDarkTheme: true,
  },
  {
    id: 'archaeology_temple',
    title: 'Labirinto Archeologico',
    heroEmoji: '🧭',
    goalEmoji: '🏛️',
    voicePrompt: 'Esplora la pianta del tempio e raggiungi la camera centrale.',
    voiceWin: 'Camera centrale raggiunta. Ottimo orientamento spaziale.',
    floorBg: '#111827',
    pathColor: '#1e293b',
    wallColor: '#d97706',
    wallHighlight: '#fbbf24',
    trailColor: 'rgba(251, 191, 36, 0.42)',
    ageTier: 'mature',
    isDarkTheme: true,
  },
  {
    id: 'deep_ocean_sub',
    title: 'Rilevamento Abissale',
    heroEmoji: '⚓',
    goalEmoji: '💎',
    voicePrompt: 'Guida la sonda sottomarina tra le dorsali fino al punto di rilevamento.',
    voiceWin: 'Punto di rilevamento abissale raggiunto.',
    floorBg: '#082f49',
    pathColor: '#0f172a',
    wallColor: '#14b8a6',
    wallHighlight: '#5eead4',
    trailColor: 'rgba(45, 212, 191, 0.45)',
    ageTier: 'mature',
    isDarkTheme: true,
  },
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function getMazeDimensionsForAge(ageYears: number): { rows: number; cols: number } {
  if (ageYears <= 4) return { rows: 5, cols: 5 };
  if (ageYears <= 7) return { rows: 6, cols: 6 };
  if (ageYears <= 10) return { rows: 8, cols: 8 };
  return { rows: 10, cols: 10 };
}

export function getMazeThemesForAge(ageYears: number): MazeTheme[] {
  if (ageYears >= 9) {
    return MAZE_THEMES.filter((t) => t.ageTier === 'mature');
  }
  if (ageYears >= 6) {
    return MAZE_THEMES.filter((t) => t.ageTier === 'explorer' || t.id === 'puppy' || t.id === 'bee');
  }
  return MAZE_THEMES.filter((t) => t.ageTier === 'early' || t.id === 'fox');
}

/**
 * Generates a fresh randomized perfect maze using iterative depth-first backtracker,
 * guaranteeing a valid path from start to goal on every round.
 */
export function generateMazePuzzle(ageYears: number, previousThemeId?: string): MazePuzzle {
  const { rows, cols } = getMazeDimensionsForAge(ageYears);

  const grid: MazeCell[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      walls: { top: true, right: true, bottom: true, left: true },
    }))
  );

  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack: Array<{ row: number; col: number }> = [{ row: 0, col: 0 }];
  visited[0][0] = true;

  const directions = [
    { dr: -1, dc: 0, wall: 'top' as const, opposite: 'bottom' as const },
    { dr: 0, dc: 1, wall: 'right' as const, opposite: 'left' as const },
    { dr: 1, dc: 0, wall: 'bottom' as const, opposite: 'top' as const },
    { dr: 0, dc: -1, wall: 'left' as const, opposite: 'right' as const },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const unvisitedNeighbors = shuffleArray(directions).filter(({ dr, dc }) => {
      const nr = current.row + dr;
      const nc = current.col + dc;
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc];
    });

    if (unvisitedNeighbors.length === 0) {
      stack.pop();
      continue;
    }

    const chosen = unvisitedNeighbors[0];
    const nr = current.row + chosen.dr;
    const nc = current.col + chosen.dc;

    grid[current.row][current.col].walls[chosen.wall] = false;
    grid[nr][nc].walls[chosen.opposite] = false;

    visited[nr][nc] = true;
    stack.push({ row: nr, col: nc });
  }

  // For toddlers (2-4 anni), open 1 extra gentle shortcut wall in the middle so navigation feels welcoming
  if (ageYears <= 4 && rows >= 4 && cols >= 4) {
    const r = 1 + Math.floor(Math.random() * (rows - 2));
    const c = 1 + Math.floor(Math.random() * (cols - 2));
    if (grid[r][c].walls.right && c + 1 < cols) {
      grid[r][c].walls.right = false;
      grid[r][c + 1].walls.left = false;
    }
  }

  const agePool = getMazeThemesForAge(ageYears);
  const candidateThemes = agePool.filter((t) => t.id !== previousThemeId);
  const theme =
    candidateThemes[Math.floor(Math.random() * candidateThemes.length)] ||
    agePool[0] ||
    MAZE_THEMES[0];

  const start = { row: 0, col: 0 };
  const goal = { row: rows - 1, col: cols - 1 };
  const optimalSteps = Math.max(1, findMazeShortestPath(grid, start, goal).length - 1);

  return {
    rows,
    cols,
    grid,
    start,
    goal,
    theme,
    optimalSteps,
  };
}

/**
 * Checks whether moving one step from (r1, c1) to adjacent (r2, c2) is open (no wall).
 */
export function canStepInMaze(
  grid: MazeCell[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= cols) return false;
  const dr = r2 - r1;
  const dc = c2 - c1;
  if (Math.abs(dr) + Math.abs(dc) !== 1) return false;
  const cell = grid[r1][c1];
  if (dr === -1) return !cell.walls.top;
  if (dr === 1) return !cell.walls.bottom;
  if (dc === -1) return !cell.walls.left;
  if (dc === 1) return !cell.walls.right;
  return false;
}

/**
 * BFS shortest path from current position to goal (used for optimal par & optional hint).
 */
export function findMazeShortestPath(
  grid: MazeCell[][],
  from: { row: number; col: number },
  to: { row: number; col: number }
): Array<{ row: number; col: number }> {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const queue: Array<Array<{ row: number; col: number }>> = [[from]];
  const seen = new Set<string>([`${from.row},${from.col}`]);

  const deltas = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    if (last.row === to.row && last.col === to.col) {
      return path;
    }
    for (const [dr, dc] of deltas) {
      const nr = last.row + dr;
      const nc = last.col + dc;
      const key = `${nr},${nc}`;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !seen.has(key) &&
        canStepInMaze(grid, last.row, last.col, nr, nc)
      ) {
        seen.add(key);
        queue.push([...path, { row: nr, col: nc }]);
      }
    }
  }
  return [from];
}

// -----------------------------------------------------------------------------
// 2. TROVA LE DIFFERENZE (ILLUSTRATED SCENES WITH AGE-ADAPTIVE PRECISION)
// -----------------------------------------------------------------------------

export type DiffSceneId = 'meadow' | 'sea' | 'farm' | 'space';

export interface DiffSpotSpec {
  id: string;
  label: string;
  /** Center X in 320x210 SVG coordinate system */
  cx: number;
  /** Center Y in 320x210 SVG coordinate system */
  cy: number;
  /** Base hit radius in SVG units */
  r: number;
}

export interface DiffSceneDefinition {
  id: DiffSceneId;
  title: string;
  emoji: string;
  voicePrompt: string;
  spots: DiffSpotSpec[];
}

export interface DiffPuzzle {
  scene: DiffSceneDefinition;
  /** Randomly chosen active difference IDs (3 for 2-4y, 4 for 5-7y, 5 for 8-10y, 6 for 11-14y) */
  activeSpotIds: string[];
}

export const DIFF_SCENES: DiffSceneDefinition[] = [
  {
    id: 'meadow',
    title: 'La Casetta nel Prato',
    emoji: '🏡',
    voicePrompt: 'Osserva bene le due immagini della casetta nel prato e tocca tutte le differenze!',
    spots: [
      { id: 'sun_rays', label: 'il sole splendente', cx: 52, cy: 40, r: 24 },
      { id: 'roof_color', label: 'il tetto della casetta', cx: 146, cy: 86, r: 28 },
      { id: 'door_color', label: 'la porta della casetta', cx: 146, cy: 146, r: 22 },
      { id: 'tree_fruit', label: 'le mele sull’albero', cx: 256, cy: 96, r: 26 },
      { id: 'butterfly', label: 'la farfalla colorata', cx: 204, cy: 52, r: 22 },
      { id: 'flower_left', label: 'il fiore sul prato', cx: 66, cy: 168, r: 22 },
      { id: 'cloud_bird', label: 'l’uccellino sulla nuvola', cx: 122, cy: 36, r: 22 },
    ],
  },
  {
    id: 'sea',
    title: 'La Barca nel Mare Blu',
    emoji: '⛵',
    voicePrompt: 'Guarda le due immagini del mare blu e scopri cosa è cambiato!',
    spots: [
      { id: 'sail_color', label: 'la vela della barca', cx: 158, cy: 88, r: 28 },
      { id: 'flag_top', label: 'la bandierina in cima', cx: 146, cy: 42, r: 20 },
      { id: 'lighthouse_stripe', label: 'il faro sull’isola', cx: 266, cy: 98, r: 26 },
      { id: 'jumping_fish', label: 'il pesciolino che salta', cx: 74, cy: 156, r: 24 },
      { id: 'starfish', label: 'la stella marina', cx: 246, cy: 174, r: 22 },
      { id: 'sun_glasses', label: 'il sole sorridente', cx: 50, cy: 40, r: 24 },
      { id: 'crab', label: 'il granchietto rosso', cx: 156, cy: 178, r: 22 },
    ],
  },
  {
    id: 'farm',
    title: 'La Fattoria Allegra',
    emoji: '🚜',
    voicePrompt: 'Confronta le due fattorie e tocca tutti i dettagli diversi!',
    spots: [
      { id: 'barn_star', label: 'la stella sul fienile', cx: 92, cy: 86, r: 24 },
      { id: 'tractor_color', label: 'il trattore nel campo', cx: 224, cy: 148, r: 28 },
      { id: 'chick', label: 'il pulcino giallo', cx: 144, cy: 172, r: 22 },
      { id: 'windmill', label: 'le pale del mulino', cx: 256, cy: 76, r: 26 },
      { id: 'rainbow', label: 'l’arcobaleno nel cielo', cx: 162, cy: 40, r: 26 },
      { id: 'fence_bird', label: 'il fiore vicino alla staccionata', cx: 48, cy: 164, r: 22 },
      { id: 'cloud_extra', label: 'la nuvoletta soffice', cx: 56, cy: 38, r: 22 },
    ],
  },
  {
    id: 'space',
    title: 'Avventura nello Spazio',
    emoji: '🚀',
    voicePrompt: 'Guarda le due immagini dello spazio e trova tutte le differenze tra i pianeti!',
    spots: [
      { id: 'rocket_window', label: 'l’oblò del razzo', cx: 158, cy: 102, r: 26 },
      { id: 'saturn_ring', label: 'il pianeta con gli anelli', cx: 252, cy: 64, r: 26 },
      { id: 'moon_face', label: 'la luna sorridente', cx: 56, cy: 56, r: 25 },
      { id: 'ufo', label: 'il disco volante', cx: 244, cy: 154, r: 26 },
      { id: 'comet', label: 'la stella cometa', cx: 74, cy: 156, r: 24 },
      { id: 'planet_green', label: 'il pianeta colorato', cx: 156, cy: 36, r: 22 },
      { id: 'big_star', label: 'la stella scintillante', cx: 158, cy: 174, r: 22 },
    ],
  },
];

export function getDiffCountForAge(ageYears: number): number {
  if (ageYears <= 4) return 3;
  if (ageYears <= 7) return 4;
  if (ageYears <= 10) return 5;
  return 6;
}

export function getAgeAdaptedDiffMeta(
  scene: DiffSceneDefinition,
  ageYears: number
): { title: string; voicePrompt: string } {
  if (ageYears < 9) {
    return { title: scene.title, voicePrompt: scene.voicePrompt };
  }
  const matureTitles: Record<DiffSceneId, string> = {
    space: 'Analisi Visiva · Osservatorio Orbitale',
    sea: 'Confronto Scena · Costa & Faro',
    meadow: 'Analisi Dettagli · Paesaggio Rurale',
    farm: 'Confronto Visivo · Mulino & Campagna',
  };
  return {
    title: matureTitles[scene.id] || scene.title,
    voicePrompt: `Individua con precisione tutte le ${getDiffCountForAge(ageYears)} differenze tra i due fotogrammi.`,
  };
}

/**
 * Generates a fresh Spot-the-Differences puzzle with randomized scene and randomized active spots.
 */
export function generateDiffPuzzle(ageYears: number, previousSceneId?: DiffSceneId): DiffPuzzle {
  // For older ages (9+), prioritize Space & Sea first when starting fresh
  const candidates = DIFF_SCENES.filter((s) => s.id !== previousSceneId);
  let scene: DiffSceneDefinition;
  if (!previousSceneId && ageYears >= 9) {
    const preferred = candidates.filter((s) => s.id === 'space' || s.id === 'sea');
    scene = preferred[Math.floor(Math.random() * preferred.length)] || candidates[0];
  } else {
    scene = candidates[Math.floor(Math.random() * candidates.length)] || DIFF_SCENES[0];
  }
  const targetCount = Math.min(scene.spots.length, getDiffCountForAge(ageYears));
  const activeSpotIds = shuffleArray(scene.spots)
    .slice(0, targetCount)
    .map((s) => s.id);

  return {
    scene,
    activeSpotIds,
  };
}

// -----------------------------------------------------------------------------
// 3. TRIS TACTICAL AI ENGINE (AGE-ADAPTIVE FROM PLAYFUL TO MINIMAX)
// -----------------------------------------------------------------------------

export type TrisCellValue = 'PLAYER' | 'BOT' | null;

export const TRIS_WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function evaluateTrisBoard(board: TrisCellValue[]): {
  winner: 'PLAYER' | 'BOT' | 'DRAW';
  line: number[] | null;
} | null {
  for (const line of TRIS_WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: 'DRAW', line: null };
  }
  return null;
}

function minimaxScore(board: TrisCellValue[], isBotTurn: boolean, depth: number): number {
  const res = evaluateTrisBoard(board);
  if (res) {
    if (res.winner === 'BOT') return 10 - depth;
    if (res.winner === 'PLAYER') return depth - 10;
    return 0;
  }

  let best = isBotTurn ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;
    board[i] = isBotTurn ? 'BOT' : 'PLAYER';
    const score = minimaxScore(board, !isBotTurn, depth + 1);
    board[i] = null;
    best = isBotTurn ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

/**
 * Selects the AI move for Tris calibrated by age:
 * - 2-5y: playful & welcoming (mostly random, 15% tactical)
 * - 6-8y: balanced explorer (65% immediate win/block)
 * - 9-11y: smart campus bot (85% tactical + center/corner priority)
 * - 12-14y: strategic Minimax AI (92% optimal, challenging yet fair)
 */
export function chooseBestTrisMove(board: TrisCellValue[], ageYears: number): number | null {
  const emptyIndices = board
    .map((val, idx) => (val === null ? idx : null))
    .filter((val): val is number => val !== null);

  if (emptyIndices.length === 0) return null;

  const findImmediateMove = (who: 'BOT' | 'PLAYER'): number | null => {
    for (const [a, b, c] of TRIS_WINNING_LINES) {
      const vals = [board[a], board[b], board[c]];
      if (vals.filter((v) => v === who).length === 2 && vals.includes(null)) {
        return [a, b, c][vals.indexOf(null)];
      }
    }
    return null;
  };

  // Always check immediate winning move for 9+
  if (ageYears >= 12) {
    // 92% Minimax optimal, 8% slightly suboptimal so a sharp teen can still trap it occasionally
    if (Math.random() < 0.92) {
      const scratch = [...board];
      let bestScore = -Infinity;
      let bestMoves: number[] = [];
      for (const idx of emptyIndices) {
        scratch[idx] = 'BOT';
        const score = minimaxScore(scratch, false, 0);
        scratch[idx] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [idx];
        } else if (score === bestScore) {
          bestMoves.push(idx);
        }
      }
      if (bestMoves.length > 0) {
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
      }
    }
  }

  if (ageYears >= 9) {
    const winMove = findImmediateMove('BOT');
    if (winMove !== null) return winMove;
    if (Math.random() < 0.85) {
      const blockMove = findImmediateMove('PLAYER');
      if (blockMove !== null) return blockMove;
      if (board[4] === null) return 4;
      const openCorners = [0, 2, 6, 8].filter((i) => board[i] === null);
      if (openCorners.length > 0) {
        return openCorners[Math.floor(Math.random() * openCorners.length)];
      }
    }
  }

  if (ageYears >= 6 && Math.random() < 0.65) {
    const smartMove = findImmediateMove('BOT') ?? findImmediateMove('PLAYER');
    if (smartMove !== null) return smartMove;
  }

  if (ageYears <= 5 && Math.random() < 0.15) {
    const gentleMove = findImmediateMove('BOT');
    if (gentleMove !== null) return gentleMove;
  }

  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}
