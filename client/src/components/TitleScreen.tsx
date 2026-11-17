import React, { useState } from 'react';
import { Cpu, Play, ShieldCheck, WifiOff } from 'lucide-react';

interface Props {
  onStart: (nickname: string) => void;
  loading: boolean;
}

export const TitleScreen: React.FC<Props> = ({ onStart, loading }) => {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(nickname.trim() || 'John');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-xl bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-display tabular-nums tracking-wider">
            2.5D EDGE COMPUTING &amp; EDGE AI
          </span>
          <span className="text-xs text-slate-400 font-display tabular-nums">Abad • Chua • Napiza</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
          EDGE OF <span className="text-cyan-400">SURVIVAL</span>
        </h1>
        <p className="text-sm text-amber-300 font-medium mt-1">
          Face the crisis. Unlock the secrets and protect the kingdom.
        </p>

        <div className="mt-5 p-4 rounded-2xl bg-slate-950/75 border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 text-red-400 font-display tabular-nums font-bold">
            <WifiOff className="w-4 h-4" /> CAPITAL UPLINK: SEVERED (LATENCY: ∞ ms)
          </div>
          <p>
            Play as <strong className="text-white">John</strong> inside a darkened subterranean bunker.
            Decipher ancient Edge Computing murals, master TinyML Deep Compression, and defend the
            Valley Dam in real time to become <strong className="text-emerald-400">The Man of Edge</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter Your Classmate Callsign / Nickname
            </label>
            <input
              type="text"
              maxLength={24}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Miguel, John, Alyssa..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-60"
          >
            <Play className="w-5 h-5 fill-current" />
            {loading ? 'Initializing Station...' : 'Enter the Severed Station'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>WASD / Arrows + E / Click Pedestals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Mobile Virtual Joystick Supported</span>
          </div>
        </div>
      </div>
    </div>
  );
};
