import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Grid3X3,
  Trophy,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Radio,
  Hand,
} from 'lucide-react';
import { GameRunState, MilestoneEvent, StationConfig } from '../types/game';

interface Props {
  nickname: string;
  run: GameRunState;
  mode: 'live' | 'local';
  muted: boolean;
  onToggleMute: () => void;
  onOpenCodex: () => void;
  onOpenLeaderboard: () => void;
  onOpenMinigame: () => void;
  nearStation: StationConfig | null;
  onInteract: () => void;
  latestMilestone: MilestoneEvent | null;
  joystickVectorRef: React.MutableRefObject<{ x: number; y: number }>;
  hideControls: boolean;
}

export const HUD: React.FC<Props> = ({
  nickname,
  run,
  mode,
  muted,
  onToggleMute,
  onOpenCodex,
  onOpenLeaderboard,
  onOpenMinigame,
  nearStation,
  onInteract,
  latestMilestone,
  joystickVectorRef,
  hideControls,
}) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const padRef = useRef<HTMLDivElement>(null);

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 14;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnobPos({ x: dx, y: dy });
    joystickVectorRef.current = { x: dx / maxR, y: dy / maxR };
  };

  const resetJoystick = () => {
    setKnobPos({ x: 0, y: 0 });
    joystickVectorRef.current = { x: 0, y: 0 };
  };

  return (
    <>
      {/* Top Tactical HUD */}
      <div className="fixed top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Player & Telemetry */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-slate-950/85 border border-cyan-500/35 rounded-2xl px-3.5 py-2 backdrop-blur-md shadow-xl">
          <div className="pr-2 border-r border-slate-800">
            <div className="text-[10px] font-display tabular-nums uppercase text-cyan-400">
              {run.completed ? 'MAN OF EDGE' : `CHAPTER ${run.currentChapter} / 12`}
            </div>
            <div className="text-xs font-bold text-white">{nickname}</div>
          </div>

          <div className="flex items-center gap-3 text-xs font-display tabular-nums">
            <div>
              <span className="text-slate-400 text-[10px] block">LATENCY</span>
              <span className={run.bestLatencyMs < 10 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {run.bestLatencyMs < 900 ? `${run.bestLatencyMs.toFixed(1)} ms` : '∞ ms'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">BW SAVED</span>
              <span className="text-cyan-300 font-bold">{run.bandwidthSavedPct.toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">SECURITY</span>
              <span className="text-amber-300 font-bold">{run.securityScore}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Class Milestone Feed */}
        {latestMilestone && (
          <div className="hidden lg:flex items-center gap-2 bg-slate-950/85 border border-emerald-500/30 rounded-full px-4 py-1.5 backdrop-blur-md text-xs text-emerald-200 max-w-md truncate">
            <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
            <span className="truncate">{latestMilestone.message}</span>
          </div>
        )}

        {/* Right: Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          <span
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-display tabular-nums border backdrop-blur-md ${
              mode === 'live'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/85 border-slate-700 text-slate-300'
            }`}
            title="Storage & Leaderboard Sync Mode"
          >
            {mode === 'live' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {mode === 'live' ? 'LIVE' : 'PAGES LOCAL'}
          </span>

          {run.completed && (
            <button
              onClick={onOpenMinigame}
              className="px-3 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/35 border border-teal-400/50 text-teal-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            >
              <Grid3X3 className="w-4 h-4" /> Edge Blocks
            </button>
          )}

          <button
            onClick={onOpenCodex}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
          >
            <BookOpen className="w-4 h-4" /> Codex
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
          >
            <Trophy className="w-4 h-4" /> Ranks
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 backdrop-blur-md cursor-pointer"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Controls Hint */}
      {!hideControls && (
        <div className="fixed bottom-4 left-4 z-20 hidden md:flex items-center gap-2 bg-slate-950/75 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur-md pointer-events-none">
          <span>Move: <strong className="text-slate-200">WASD / Arrows</strong></span>
          <span>•</span>
          <span>Interact: <strong className="text-slate-200">E / Space / Click Pedestal</strong></span>
        </div>
      )}

      {/* Mobile / Touch Virtual Joystick + Interact Button */}
      {!hideControls && (
        <div className="fixed bottom-5 left-5 right-5 z-20 flex md:hidden items-end justify-between pointer-events-none">
          {/* Virtual Joystick */}
          <div
            ref={padRef}
            onTouchStart={(e) => {
              const t = e.touches[0];
              if (t) handleTouchMove(t.clientX, t.clientY);
            }}
            onTouchMove={(e) => {
              const t = e.touches[0];
              if (t) handleTouchMove(t.clientX, t.clientY);
            }}
            onTouchEnd={resetJoystick}
            onTouchCancel={resetJoystick}
            className="pointer-events-auto w-24 h-24 rounded-full bg-slate-900/70 border border-cyan-500/40 backdrop-blur-md relative flex items-center justify-center touch-none"
          >
            <div
              style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
              className="w-10 h-10 rounded-full bg-cyan-400/80 border border-white/60 shadow-lg"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={onInteract}
            disabled={!nearStation}
            className={`pointer-events-auto px-5 py-4 rounded-2xl font-bold text-xs flex items-center gap-2 border shadow-xl backdrop-blur-md ${
              nearStation
                ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                : 'bg-slate-900/70 text-slate-500 border-slate-700'
            }`}
          >
            <Hand className="w-4 h-4" />
            {nearStation ? `Engage Ch ${nearStation.chapterNumber}` : 'Walk to Pedestal'}
          </button>
        </div>
      )}
    </>
  );
};
