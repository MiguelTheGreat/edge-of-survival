import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function getPieceDims(piece: PieceShape) {
  const rows = Math.max(...piece.cells.map(([r]) => r)) + 1;
  const cols = Math.max(...piece.cells.map(([, c]) => c)) + 1;
  return { rows, cols };
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
  const [flashingCells, setFlashingCells] = useState<Set<string>>(new Set());

  // True drag-and-drop state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [snapTarget, setSnapTarget] = useState<[number, number] | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  const draggedPiece = dragIdx !== null ? tray[dragIdx] : null;

  // Compute grid snap [baseR, baseC] from pointer coordinates
  const computeSnap = useCallback(
    (clientX: number, clientY: number, piece: PieceShape | null): [number, number] | null => {
      if (!piece || !gridRef.current) return null;
      const rect = gridRef.current.getBoundingClientRect();
      const cellW = rect.width / GRID_SIZE;
      const cellH = rect.height / GRID_SIZE;

      // Slight upward offset so finger/cursor doesn't obscure placement
      const pointerY = clientY - cellH * 0.6;
      const { rows, cols } = getPieceDims(piece);

      const relX = clientX - rect.left;
      const relY = pointerY - rect.top;

      if (relX < -cellW || relX > rect.width + cellW || relY < -cellH || relY > rect.height + cellH) {
        return null;
      }

      const baseC = Math.round(relX / cellW - cols / 2);
      const baseR = Math.round(relY / cellH - rows / 2);
      return [baseR, baseC];
    },
    []
  );

  const commitPlacement = useCallback(
    async (pieceIdx: number, r: number, c: number) => {
      const piece = tray[pieceIdx];
      if (!piece || gameOver) return;
      if (!canPlace(grid, piece, r, c)) return;

      audioEngine.playInteract();
      const nextGrid = grid.map((row) => [...row]);
      for (const [dr, dc] of piece.cells) {
        nextGrid[r + dr][c + dc] = piece.color;
      }

      const fullRows: number[] = [];
      const fullCols: number[] = [];
      for (let i = 0; i < GRID_SIZE; i++) {
        if (nextGrid[i].every((cell) => cell !== null)) fullRows.push(i);
        if (nextGrid.every((row) => row[i] !== null)) fullCols.push(i);
      }

      const clearedKeys = new Set<string>();
      for (const ri of fullRows) {
        for (let ci = 0; ci < GRID_SIZE; ci++) {
          clearedKeys.add(`${ri}-${ci}`);
          nextGrid[ri][ci] = null;
        }
      }
      for (const ci of fullCols) {
        for (let ri = 0; ri < GRID_SIZE; ri++) {
          clearedKeys.add(`${ri}-${ci}`);
          nextGrid[ri][ci] = null;
        }
      }

      if (clearedKeys.size > 0) {
        setFlashingCells(clearedKeys);
        setTimeout(() => setFlashingCells(new Set()), 220);
      }

      const clearedCount = fullRows.length + fullCols.length;
      const nextCombo = clearedCount > 0 ? combo + 1 : 0;
      const nextMaxCombo = Math.max(maxCombo, Math.max(1, nextCombo));
      const placedPoints = piece.cells.length * 10;
      const clearPoints = clearedCount > 0 ? clearedCount * 100 * Math.max(1, nextCombo) : 0;
      const nextScore = score + placedPoints + clearPoints;

      if (clearedCount > 0) {
        audioEngine.playHologramChime();
      }

      let nextTray = tray.map((p, idx) => (idx === pieceIdx ? null : p));
      if (nextTray.every((p) => p === null)) {
        nextTray = randomTray();
      }

      setGrid(nextGrid);
      setTray(nextTray);
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
    },
    [tray, gameOver, grid, combo, maxCombo, score, scoreSaved, nickname, linesCleared]
  );

  // Global pointer move & pointer up listeners while dragging
  useEffect(() => {
    if (dragIdx === null) return;
    const piece = tray[dragIdx];

    const handlePointerMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
      setSnapTarget(computeSnap(e.clientX, e.clientY, piece));
    };

    const handlePointerUp = (e: PointerEvent) => {
      const target = computeSnap(e.clientX, e.clientY, piece);
      if (target && piece && canPlace(grid, piece, target[0], target[1])) {
        commitPlacement(dragIdx, target[0], target[1]);
      }
      setDragIdx(null);
      setDragPos(null);
      setSnapTarget(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragIdx, tray, grid, computeSnap, commitPlacement]);

  // Live preview + which rows/cols are about to clear!
  const preview = useMemo(() => {
    if (!draggedPiece || !snapTarget || gameOver) {
      return { cells: new Set<string>(), valid: false, willClearRows: new Set<number>(), willClearCols: new Set<number>() };
    }
    const [br, bc] = snapTarget;
    const valid = canPlace(grid, draggedPiece, br, bc);
    const cells = new Set<string>();
    for (const [dr, dc] of draggedPiece.cells) {
      const r = br + dr;
      const c = bc + dc;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        cells.add(`${r}-${c}`);
      }
    }

    const willClearRows = new Set<number>();
    const willClearCols = new Set<number>();
    if (valid) {
      const testGrid = grid.map((row) => [...row]);
      for (const [dr, dc] of draggedPiece.cells) {
        testGrid[br + dr][bc + dc] = draggedPiece.color;
      }
      for (let i = 0; i < GRID_SIZE; i++) {
        if (testGrid[i].every((c) => c !== null)) willClearRows.add(i);
        if (testGrid.every((r) => r[i] !== null)) willClearCols.add(i);
      }
    }

    return { cells, valid, willClearRows, willClearCols };
  }, [draggedPiece, snapTarget, grid, gameOver]);

  const handleRestart = () => {
    audioEngine.playInteract();
    setGrid(createEmptyGrid());
    setTray(randomTray());
    setDragIdx(null);
    setDragPos(null);
    setSnapTarget(null);
    setScore(0);
    setLinesCleared(0);
    setCombo(0);
    setMaxCombo(1);
    setGameOver(false);
    setScoreSaved(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-teal-400/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Grid3X3 className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Edge Blocks — Silicon Matrix</h2>
              <p className="text-xs text-slate-400">
                Drag blocks from the tray onto the 8×8 grid • Release to drop
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
              ref={gridRef}
              className="grid grid-cols-8 gap-1 p-2.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner touch-none"
            >
              {grid.map((row, r) =>
                row.map((cellColor, c) => {
                  const key = `${r}-${c}`;
                  const isPreview = preview.cells.has(key);
                  const isFlashing = flashingCells.has(key);
                  const aboutToClear = preview.willClearRows.has(r) || preview.willClearCols.has(c);

                  return (
                    <div
                      key={key}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md border transition-all duration-100 ${
                        isFlashing
                          ? 'bg-white border-teal-200 scale-110 shadow-lg shadow-white/60'
                          : isPreview
                          ? preview.valid
                            ? 'bg-emerald-400/65 border-emerald-200 scale-95 shadow-md shadow-emerald-400/30'
                            : 'bg-red-500/45 border-red-400'
                          : cellColor
                          ? `${COLOR_CLASSES[cellColor]} shadow-md ${
                              aboutToClear ? 'ring-2 ring-white brightness-125' : ''
                            }`
                          : 'bg-slate-900/90 border-slate-800/90'
                      }`}
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
              /* 3-Piece Draggable Tray */
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
                  const { rows, cols } = getPieceDims(piece);
                  const isBeingDragged = dragIdx === idx;
                  return (
                    <div
                      key={piece.id}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        audioEngine.playInteract();
                        setDragIdx(idx);
                        setDragPos({ x: e.clientX, y: e.clientY });
                        setSnapTarget(computeSnap(e.clientX, e.clientY, piece));
                      }}
                      className={`h-24 rounded-xl border flex items-center justify-center p-2 transition touch-none cursor-grab active:cursor-grabbing ${
                        isBeingDragged
                          ? 'opacity-25 bg-slate-950 border-teal-500/40'
                          : 'bg-slate-950/75 border-slate-800 hover:border-teal-400/60 hover:bg-slate-900'
                      }`}
                    >
                      <div
                        className="grid gap-1 pointer-events-none"
                        style={{
                          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: rows }).map((_, pr) =>
                          Array.from({ length: cols }).map((__, pc) => {
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Dragged Piece under Cursor / Finger */}
      {draggedPiece && dragPos && (
        <div
          className="fixed z-[150] pointer-events-none"
          style={{
            left: dragPos.x,
            top: dragPos.y - 24,
            transform: 'translate(-50%, -50%) scale(1.12)',
          }}
        >
          {(() => {
            const { rows, cols } = getPieceDims(draggedPiece);
            return (
              <div
                className="grid gap-1 drop-shadow-2xl"
                style={{
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: rows }).map((_, pr) =>
                  Array.from({ length: cols }).map((__, pc) => {
                    const filled = draggedPiece.cells.some(([cr, cc]) => cr === pr && cc === pc);
                    return (
                      <div
                        key={`${pr}-${pc}`}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border ${
                          filled ? `${COLOR_CLASSES[draggedPiece.color]} shadow-xl` : 'bg-transparent border-transparent'
                        }`}
                      />
                    );
                  })
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
