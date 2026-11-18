import React from 'react';
import { Award, BookOpen, Globe2, Grid3X3, Smartphone, Sparkles, Trophy } from 'lucide-react';
import { GameRunState } from '../types/game';

interface Props {
  nickname: string;
  run: GameRunState;
  onOpenCodex: () => void;
  onOpenLeaderboard: () => void;
  onOpenMinigame: () => void;
  onContinueExplore: () => void;
}

export const VictoryModal: React.FC<Props> = ({
  nickname,
  run,
  onOpenCodex,
  onOpenLeaderboard,
  onOpenMinigame,
  onContinueExplore,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-emerald-400/60 rounded-3xl p-7 shadow-2xl space-y-5 my-auto">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-400/50 text-emerald-300 text-xs font-display tabular-nums font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4" /> EPILOGUE &amp; CHAPTERS 8, 11, 12 UNLOCKED
          </span>
          <span className="text-xs font-display tabular-nums text-slate-400">Engineer: {nickname}</span>
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            JOHN: <span className="text-emerald-400">THE MAN OF EDGE</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
            In mere milliseconds, the autonomous field sensors coordinated, the hydraulic floodgates roared open
            without a single command from the Capital, and the raging waters safely diverted!
          </p>
        </div>

        {/* Final Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] text-slate-400">Final Latency</div>
            <div className="text-xl font-display tabular-nums font-black text-emerald-400">
              {run.bestLatencyMs.toFixed(1)} ms
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] text-slate-400">Bandwidth Saved</div>
            <div className="text-xl font-display tabular-nums font-black text-cyan-400">
              {run.bandwidthSavedPct.toFixed(0)}%
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] text-slate-400">Security Score</div>
            <div className="text-xl font-display tabular-nums font-black text-amber-400">
              {run.securityScore}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] text-slate-400">Mission Time</div>
            <div className="text-xl font-display tabular-nums font-black text-white">
              {Math.floor(run.totalTimeSeconds / 60)}m {run.totalTimeSeconds % 60}s
            </div>
          </div>
        </div>

        {/* Philippine Edge & Future Trends Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4" /> Ch 11: Philippine Edge Infrastructure
            </div>
            <p className="text-slate-300">
              • <strong>Cloudflare PH:</strong> Edge nodes in Manila, Cebu, Cagayan de Oro &amp; Tarlac City.
            </p>
            <p className="text-slate-300">
              • <strong>AWS Outposts PH:</strong> Local workload processing inside Philippine facilities.
            </p>
            <p className="text-slate-300 flex items-start gap-1">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Samsung Galaxy S25:</strong> Personal Data Engine &amp; Hybrid On-Device AI.
              </span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Ch 8 &amp; 12: CpE &amp; Future Trends
            </div>
            <p className="text-slate-300">
              • <strong>CpE Pathways:</strong> Bridging hardware &amp; software for Autonomous Vehicles, Smart Grids, &amp; Healthcare.
            </p>
            <p className="text-slate-300">
              • <strong>5G MEC &amp; Physical AI:</strong> TinyML expansion, stronger NPUs, &amp; robotics acting in real time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenMinigame}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <Grid3X3 className="w-4 h-4" /> Play Edge Blocks Minigame
            </button>
            <button
              onClick={onOpenCodex}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" /> Open Full Codex (Ch 1–12)
            </button>
            <button
              onClick={onOpenLeaderboard}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-4 h-4" /> View Class Leaderboard
            </button>
          </div>
          <button
            onClick={onContinueExplore}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
          >
            Free-Roam 2.5D World
          </button>
        </div>
      </div>
    </div>
  );
};
