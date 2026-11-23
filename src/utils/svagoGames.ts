// =============================================================================
// GIOCHI DI SVAGO ENGINE: LABIRINTO & TROVA LE DIFFERENZE
// 100% client-side, freshly randomized every round, age-adaptive (2-14 anni),
// zero reading required (icon & visual first).
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
}

export interface MazePuzzle {
  rows: number;
  cols: number;
  grid: MazeCell[][];
  start: { row: number; col: number };
  goal: { row: number; col: number };
  theme: MazeTheme;
}

export const MAZE_THEMES: MazeTheme[] = [
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
  },
  {
    id: 'bee',
    title: 'Il Giardino dell’Apina',
    heroEmoji: '🐝',
    goalEmoji: '🍯',
    voicePrompt: 'Guida l’apina tra i fiori fino al vasetto di miele!',
    voiceWin: 'Bravissimo lavoro! L’apina è arrivata al miele dolce!',
    floorBg: '#fef3c7',
    pathColor: '#fffbeb',
    wallColor: '#0f766e',
    wallHighlight: '#2dd4bf',
    trailColor: 'rgba(245, 158, 11, 0.45)',
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
  },
  {
    id: 'fox',
    title: 'Il Bosco della Volpina',
    heroEmoji: '🦊',
    goalEmoji: '🍓',
    voicePrompt: 'Porta la volpina attraverso il bosco fino alla fragola gigante!',
    voiceWin: 'Fantastico! La volpina ha raggiunto la fragola dolce!',
    floorBg: '#fce7f3',
    pathColor: '#fff1f2',
    wallColor: '#166534',
    wallHighlight: '#22c55e',
    trailColor: 'rgba(244, 114, 182, 0.45)',
  },
  {
    id: 'rocket',
    title: 'Il Viaggio del Razzo',
    heroEmoji: '🚀',
    goalEmoji: '⭐',
    voicePrompt: 'Pilota il razzo tra le stelle fino alla stella d’oro!',
    voiceWin: 'Decollo riuscito! Il razzo ha raggiunto la stella d’oro!',
    floorBg: '#1e1b4b',
    pathColor: '#312e81',
    wallColor: '#6366f1',
    wallHighlight: '#a5b4fc',
    trailColor: 'rgba(253, 224, 71, 0.45)',
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
  return { rows: 8, cols: 8 };
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

  const candidateThemes = MAZE_THEMES.filter((t) => t.id !== previousThemeId);
  const theme =
    candidateThemes[Math.floor(Math.random() * candidateThemes.length)] || MAZE_THEMES[0];

  return {
    rows,
    cols,
    grid,
    start: { row: 0, col: 0 },
    goal: { row: rows - 1, col: cols - 1 },
    theme,
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
 * BFS shortest path from current position to goal (used for the optional golden hint).
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
// 2. TROVA LE DIFFERENZE (RICH ILLUSTRATED STORYBOOK SCENES, RANDOMIZED SLOTS)
// -----------------------------------------------------------------------------

export type DiffSceneId = 'meadow' | 'sea' | 'farm' | 'space';

export interface DiffSpotSpec {
  id: string;
  label: string;
  /** Center X in 320x210 SVG coordinate system */
  cx: number;
  /** Center Y in 320x210 SVG coordinate system */
  cy: number;
  /** Generous child-friendly hit radius in SVG units */
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
  /** Randomly chosen active difference IDs for this round (3 for 2-4y, 4 for 5-7y, 5 for 8+y) */
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
  return 5;
}

/**
 * Generates a fresh Spot-the-Differences puzzle with randomized scene and randomized active spots.
 */
export function generateDiffPuzzle(ageYears: number, previousSceneId?: DiffSceneId): DiffPuzzle {
  const candidates = DIFF_SCENES.filter((s) => s.id !== previousSceneId);
  const scene =
    candidates[Math.floor(Math.random() * candidates.length)] || DIFF_SCENES[0];
  const targetCount = Math.min(scene.spots.length, getDiffCountForAge(ageYears));
  const activeSpotIds = shuffleArray(scene.spots)
    .slice(0, targetCount)
    .map((s) => s.id);

  return {
    scene,
    activeSpotIds,
  };
}
