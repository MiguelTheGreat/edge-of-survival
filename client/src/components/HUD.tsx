import React, { useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
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
  const [showMobileStats, setShowMobileStats] = useState(false);
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
      {/* Top Tactical HUD — single compact row on mobile, full telemetry on desktop */}
      <div className="fixed top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Player & Telemetry */}
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 border border-cyan-500/35 rounded-2xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 backdrop-blur-md shadow-xl min-w-0">
            <button
              type="button"
              onClick={() => setShowMobileStats((s) => !s)}
              className="flex items-center gap-1.5 text-left md:pr-2.5 md:border-r md:border-slate-800 md:pointer-events-none min-w-0 cursor-pointer"
              aria-label="Toggle telemetry stats"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-display tabular-nums uppercase text-cyan-400 leading-tight whitespace-nowrap">
                  {run.completed ? 'MAN OF EDGE' : `CH ${run.currentChapter}/12`}
                </div>
                <div className="text-xs font-bold text-white truncate max-w-[96px] sm:max-w-[140px]">
                  {nickname}
                </div>
              </div>
              <span className="md:hidden text-slate-400 shrink-0">
                {showMobileStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </button>

            {/* Desktop inline telemetry */}
            <div className="hidden md:flex items-center gap-3 text-xs font-display tabular-nums">
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

          {/* Center: Live Class Milestone Feed (desktop only) */}
          {latestMilestone && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-950/85 border border-emerald-500/30 rounded-full px-4 py-1.5 backdrop-blur-md text-xs text-emerald-200 max-w-md truncate">
              <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
              <span className="truncate">{latestMilestone.message}</span>
            </div>
          )}

          {/* Right: Actions (icon-only on mobile, labeled on sm+) */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span
              className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-display tabular-nums border backdrop-blur-md ${
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
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/35 border border-teal-400/50 text-teal-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
                title="Edge Blocks Minigame"
                aria-label="Edge Blocks Minigame"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edge Blocks</span>
              </button>
            )}

            <button
              onClick={onOpenCodex}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
              title="Codex"
              aria-label="Open Codex"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Codex</span>
            </button>

            <button
              onClick={onOpenLeaderboard}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
              title="Leaderboard"
              aria-label="Open Leaderboard"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Ranks</span>
            </button>

            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 backdrop-blur-md cursor-pointer"
              title={muted ? 'Unmute Audio' : 'Mute Audio'}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Telemetry Pill (hidden by default so viewport stays clean) */}
        {showMobileStats && (
          <div className="md:hidden pointer-events-auto self-start flex items-center gap-3.5 bg-slate-950/90 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-[11px] font-display tabular-nums backdrop-blur-md shadow-lg">
            <div>
              <span className="text-slate-400 text-[9px] block">LATENCY</span>
              <span className={run.bestLatencyMs < 10 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {run.bestLatencyMs < 900 ? `${run.bestLatencyMs.toFixed(1)} ms` : '∞ ms'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] block">BW SAVED</span>
              <span className="text-cyan-300 font-bold">{run.bandwidthSavedPct.toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] block">SECURITY</span>
              <span className="text-amber-300 font-bold">{run.securityScore}</span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Controls Hint */}
      {!hideControls && (
        <div className="fixed bottom-4 left-4 z-20 hidden md:flex items-center gap-2 bg-slate-950/75 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur-md pointer-events-none">
          <span>Move: <strong className="text-slate-200">WASD / Arrows</strong></span>
          <span>•</span>
          <span>Interact: <strong className="text-slate-200">E / Space / Click Pedestal</strong></span>
        </div>
      )}

      {/* Mobile / Touch Virtual Joystick + Contextual Interact Button */}
      {!hideControls && (
        <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 right-4 z-20 flex md:hidden items-end justify-between pointer-events-none">
          {/* Translucent Virtual Joystick */}
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
            className="pointer-events-auto w-24 h-24 rounded-full bg-slate-950/45 border border-cyan-400/35 backdrop-blur-sm relative flex items-center justify-center touch-none shadow-lg"
          >
            <div className="w-12 h-12 rounded-full border border-cyan-500/20 pointer-events-none absolute" />
            <div
              style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
              className="w-10 h-10 rounded-full bg-cyan-400/75 border border-white/60 shadow-md"
            />
          </div>

          {/* Contextual Action Button — pops in prominently only when near a pedestal */}
          {nearStation ? (
            <button
              onClick={onInteract}
              className="pointer-events-auto px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 border shadow-xl backdrop-blur-md bg-cyan-400 active:scale-95 text-slate-950 border-cyan-200 transition cursor-pointer"
            >
              <Hand className="w-4 h-4" />
              Engage Ch {nearStation.chapterNumber}
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-slate-950/55 border border-slate-800/80 text-[10px] text-slate-400 backdrop-blur-sm">
              Move to pedestal
            </div>
          )}
        </div>
      )}
    </>
  );
};
