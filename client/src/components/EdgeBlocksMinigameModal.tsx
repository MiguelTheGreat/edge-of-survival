import React, { useEffect, useMemo, useState } from 'react';
import { Grid3X3, RotateCcw, Trophy, Sparkles, X, RefreshCw } from 'lucide-react';
import { audioEngine } from '../services/AudioEngine';
import { storageService } from '../services/StorageService';
import { MinigameLeaderboardEntry } from '../types/game';

interface Props {
  nickname: string;
  onClose: () => void;
}

interface PieceShape {
  id: string;
  cells: [number, number][]; // [rowOffset, colOffset]
  color: string;
}

const GRID_SIZE = 8;

const COLOR_CLASSES: Record<string, string> = {
  teal: 'bg-teal-400 border-teal-200 shadow-teal-500/40',
  cyan: 'bg-cyan-400 border-cyan-200 shadow-cyan-500/40',
  amber: 'bg-amber-400 border-amber-200 shadow-amber-500/40',
  emerald: 'bg-emerald-400 border-emerald-200 shadow-emerald-500/40',
  sky: 'bg-sky-400 border-sky-200 shadow-sky-500/40',
};

const PIECE_TEMPLATES: Omit<PieceShape, 'id'>[] = [
  { cells: [[0, 0]], color: 'teal' },
  { cells: [[0, 0], [0, 1]], color: 'cyan' },
  { cells: [[0, 0], [1, 0]], color: 'cyan' },
  { cells: [[0, 0], [0, 1], [0, 2]], color: 'amber' },
  { cells: [[0, 0], [1, 0], [2, 0]], color: 'amber' },
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], color: 'sky' },
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: 'sky' },
  { cells: [[0, 0], [0, 1], [1, 0], [1, 1]], color: 'emerald' },
  { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], color: 'teal' },
  { cells: [[0, 1], [1, 1], [2, 1], [2, 0]], color: 'amber' },
  { cells: [[0, 0], [0, 1], [0, 2], [1, 1]], color: 'cyan' },
  { cells: [[0, 0], [0, 1], [1, 0]], color: 'emerald' },
  {
    cells: [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1], [2, 2],
    ],
    color: 'sky',
  },
];

function createEmptyGrid(): (string | null)[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function randomTray(): (PieceShape | null)[] {
  return [0, 1, 2].map((idx) => {
    const tpl = PIECE_TEMPLATES[Math.floor(Math.random() * PIECE_TEMPLATES.length)];
    return {
      id: `piece-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      cells: tpl.cells,
      color: tpl.color,
    };
  });
}

function canPlace(
  grid: (string | null)[][],
  piece: PieceShape,
  baseR: number,
  baseC: number
): boolean {
  for (const [dr, dc] of piece.cells) {
    const r = baseR + dr;
    const c = baseC + dc;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (grid[r][c] !== null) return false;
  }
  return true;
}

function hasAnyValidMove(grid: (string | null)[][], tray: (PieceShape | null)[]): boolean {
  for (const piece of tray) {
    if (!piece) continue;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlace(grid, piece, r, c)) return true;
      }
    }
  }
  return false;
}

export const EdgeBlocksMinigameModal: React.FC<Props> = ({ nickname, onClose }) => {
  const [tab, setTab] = useState<'play' | 'leaderboard'>('play');
  const [grid, setGrid] = useState<(string | null)[][]>(createEmptyGrid);
  const [tray, setTray] = useState<(PieceShape | null)[]>(() => randomTray());
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const [leaderboard, setLeaderboard] = useState<MinigameLeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  const loadLeaderboard = async () => {
    setLbLoading(true);
    const data = await storageService.getMinigameLeaderboard();
    setLeaderboard(data);
    setLbLoading(false);
  };

  useEffect(() => {
    if (tab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [tab]);

  const activePiece = tray[selectedIdx] ?? null;

  const previewCells = useMemo(() => {
    if (!activePiece || !hoverCell || gameOver) return { cells: new Set<string>(), valid: false };
    const [hr, hc] = hoverCell;
    const valid = canPlace(grid, activePiece, hr, hc);
    const cells = new Set<string>();
    for (const [dr, dc] of activePiece.cells) {
      const r = hr + dr;
      const c = hc + dc;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        cells.add(`${r}-${c}`);
      }
    }
    return { cells, valid };
  }, [activePiece, hoverCell, grid, gameOver]);

  const handlePlace = async (r: number, c: number) => {
    if (gameOver || !activePiece) return;
    if (!canPlace(grid, activePiece, r, c)) {
      audioEngine.playWarningKlaxon();
      return;
    }

    audioEngine.playInteract();
    const nextGrid = grid.map((row) => [...row]);
    for (const [dr, dc] of activePiece.cells) {
      nextGrid[r + dr][c + dc] = activePiece.color;
    }

    // Check full rows and columns
    const fullRows: number[] = [];
    const fullCols: number[] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      if (nextGrid[i].every((cell) => cell !== null)) fullRows.push(i);
      if (nextGrid.every((row) => row[i] !== null)) fullCols.push(i);
    }

    for (const ri of fullRows) {
      for (let ci = 0; ci < GRID_SIZE; ci++) nextGrid[ri][ci] = null;
    }
    for (const ci of fullCols) {
      for (let ri = 0; ri < GRID_SIZE; ri++) nextGrid[ri][ci] = null;
    }

    const clearedCount = fullRows.length + fullCols.length;
    const nextCombo = clearedCount > 0 ? combo + 1 : 0;
    const nextMaxCombo = Math.max(maxCombo, Math.max(1, nextCombo));
    const placedPoints = activePiece.cells.length * 10;
    const clearPoints = clearedCount > 0 ? clearedCount * 100 * Math.max(1, nextCombo) : 0;
    const nextScore = score + placedPoints + clearPoints;

    if (clearedCount > 0) {
      audioEngine.playHologramChime();
    }

    let nextTray = tray.map((p, idx) => (idx === selectedIdx ? null : p));
    if (nextTray.every((p) => p === null)) {
      nextTray = randomTray();
    }

    const nextSelected = nextTray.findIndex((p) => p !== null);

    setGrid(nextGrid);
    setTray(nextTray);
    setSelectedIdx(nextSelected >= 0 ? nextSelected : 0);
    setScore(nextScore);
    setLinesCleared((prev) => prev + clearedCount);
    setCombo(nextCombo);
    setMaxCombo(nextMaxCombo);

    if (!hasAnyValidMove(nextGrid, nextTray)) {
      setGameOver(true);
      audioEngine.playWarningKlaxon();
      if (!scoreSaved) {
        setScoreSaved(true);
        await storageService.saveMinigameScore({
          nickname,
          score: nextScore,
          linesCleared: linesCleared + clearedCount,
          maxCombo: nextMaxCombo,
        });
      }
    }
  };

  const handleRestart = () => {
    audioEngine.playInteract();
    setGrid(createEmptyGrid());
    setTray(randomTray());
    setSelectedIdx(0);
    setHoverCell(null);
    setScore(0);
    setLinesCleared(0);
    setCombo(0);
    setMaxCombo(1);
    setGameOver(false);
    setScoreSaved(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-teal-400/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Grid3X3 className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Edge Blocks — Silicon Matrix</h2>
              <p className="text-xs text-slate-400">
                Bonus Post-Game Minigame • Clear rows &amp; columns for combo multipliers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab(tab === 'play' ? 'leaderboard' : 'play')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              {tab === 'play' ? 'Minigame Ranks' : 'Back to Board'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {tab === 'leaderboard' ? (
          <div className="p-5 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-amber-300">
                Separate Edge Blocks Leaderboard
              </div>
              <button
                onClick={loadLeaderboard}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${lbLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-display uppercase">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Engineer</th>
                  <th className="py-2 px-2">Score</th>
                  <th className="py-2 px-2">Lines</th>
                  <th className="py-2 px-2">Max Combo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {leaderboard.map((row) => {
                  const isMe = row.nickname.toLowerCase() === nickname.toLowerCase();
                  return (
                    <tr key={row.id} className={isMe ? 'bg-teal-950/40 text-teal-200' : 'text-slate-200'}>
                      <td className="py-2.5 px-2 font-display font-bold tabular-nums text-amber-400">{row.rank}</td>
                      <td className="py-2.5 px-2 font-semibold">{row.nickname}</td>
                      <td className="py-2.5 px-2 font-display font-bold tabular-nums text-teal-300">{row.score}</td>
                      <td className="py-2.5 px-2 font-display tabular-nums">{row.linesCleared}</td>
                      <td className="py-2.5 px-2 font-display tabular-nums text-emerald-300">{row.maxCombo}x</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto flex flex-col items-center space-y-4">
            {/* Score Bar */}
            <div className="w-full flex items-center justify-between bg-slate-950/75 border border-slate-800 rounded-xl px-4 py-2.5">
              <div>
                <span className="text-[11px] text-slate-400 block">SCORE</span>
                <span className="text-xl font-display font-bold tabular-nums text-teal-300">{score}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">LINES CLEARED</span>
                <span className="text-xl font-display font-bold tabular-nums text-white">{linesCleared}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">COMBO</span>
                <span className="text-xl font-display font-bold tabular-nums text-amber-300">
                  {combo > 0 ? `${combo}x` : '—'}
                </span>
              </div>
              <button
                onClick={handleRestart}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* 8x8 Grid */}
            <div
              className="grid grid-cols-8 gap-1 p-2.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner"
              onMouseLeave={() => setHoverCell(null)}
            >
              {grid.map((row, r) =>
                row.map((cellColor, c) => {
                  const key = `${r}-${c}`;
                  const isPreview = previewCells.cells.has(key);
                  return (
                    <button
                      key={key}
                      onMouseEnter={() => setHoverCell([r, c])}
                      onClick={() => handlePlace(r, c)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md border transition-all cursor-pointer ${
                        cellColor
                          ? `${COLOR_CLASSES[cellColor]} shadow-md`
                          : isPreview
                          ? previewCells.valid
                            ? 'bg-emerald-400/50 border-emerald-300 scale-95'
                            : 'bg-red-500/45 border-red-400'
                          : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                      }`}
                      aria-label={`Grid cell ${r},${c}`}
                    />
                  );
                })
              )}
            </div>

            {/* Game Over Banner */}
            {gameOver ? (
              <div className="w-full bg-red-950/50 border border-red-500/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Matrix Full — Final Score: {score}
                  </div>
                  <div className="text-xs text-slate-300">
                    Saved to the Edge Blocks Leaderboard!
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTab('leaderboard')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    View Ranks
                  </button>
                  <button
                    onClick={handleRestart}
                    className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            ) : (
              /* 3-Piece Tray */
              <div className="w-full grid grid-cols-3 gap-3">
                {tray.map((piece, idx) => {
                  if (!piece) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="h-24 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-center text-[11px] text-slate-600"
                      >
                        Placed
                      </div>
                    );
                  }
                  const maxR = Math.max(...piece.cells.map(([r]) => r)) + 1;
                  const maxC = Math.max(...piece.cells.map(([, c]) => c)) + 1;
                  const isSelected = selectedIdx === idx;
                  return (
                    <button
                      key={piece.id}
                      onClick={() => {
                        audioEngine.playInteract();
                        setSelectedIdx(idx);
                      }}
                      className={`h-24 rounded-xl border flex items-center justify-center p-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-teal-950/50 border-teal-400 ring-2 ring-teal-400/40'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className="grid gap-1"
                        style={{
                          gridTemplateRows: `repeat(${maxR}, minmax(0, 1fr))`,
                          gridTemplateColumns: `repeat(${maxC}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: maxR }).map((_, pr) =>
                          Array.from({ length: maxC }).map((__, pc) => {
                            const filled = piece.cells.some(([cr, cc]) => cr === pr && cc === pc);
                            return (
                              <div
                                key={`${pr}-${pc}`}
                                className={`w-3.5 h-3.5 rounded-sm ${
                                  filled ? COLOR_CLASSES[piece.color] : 'bg-transparent'
                                }`}
                              />
                            );
                          })
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
