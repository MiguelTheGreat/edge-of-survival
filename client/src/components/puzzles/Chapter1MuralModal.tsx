import React, { useState } from 'react';
import { Cpu, WifiOff, Activity, Database, CheckCircle2, X } from 'lucide-react';
import { audioEngine } from '../../services/AudioEngine';

interface Props {
  onSolve: () => void;
  onClose: () => void;
}

const MURALS = [
  {
    id: 'latency',
    title: 'Mural I: LATENCY',
    icon: Activity,
    desc: 'Propagation delay prevents real-time actuation. Round-trip time (RTT) to the distant Capital is unacceptable for life-safety.',
  },
  {
    id: 'bandwidth',
    title: 'Mural II: BANDWIDTH',
    icon: Database,
    desc: 'Billions of raw telemetry streams flood uplinks, creating massive transmission bottlenecks and high cost.',
  },
  {
    id: 'spof',
    title: 'Mural III: SINGLE POINT OF FAILURE',
    icon: WifiOff,
    desc: 'Connection severance causes total system blackout when endpoints lack autonomous local logic (Shi et al., 2016).',
  },
];

export const Chapter1MuralModal: React.FC<Props> = ({ onSolve, onClose }) => {
  const [inspected, setInspected] = useState<string[]>([]);
  const [edgeComputingAnswer, setEdgeComputingAnswer] = useState<string>('');
  const [edgeAiAnswer, setEdgeAiAnswer] = useState<string>('');
  const [error, setError] = useState<string>('');

  const toggleMural = (id: string) => {
    audioEngine.playInteract();
    if (!inspected.includes(id)) {
      setInspected((prev) => [...prev, id]);
    }
  };

  const handleSynthesize = () => {
    if (inspected.length < 3) {
      setError('Inspect all 3 carved stone murals first to diagnose why the Capital uplink failed.');
      return;
    }
    if (edgeComputingAnswer !== 'source' || edgeAiAnswer !== 'ondevice') {
      setError('Verify both definitions: Edge Computing moves compute to the physical data source; Edge AI runs compressed ML on-device.');
      audioEngine.playWarningKlaxon();
      return;
    }
    audioEngine.playHologramChime();
    onSolve();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Chapter 1 • Introduction (“Discover the secrets.”)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">The Severed Station Murals</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            Capital uplink status: <span className="text-red-400 font-mono font-bold">DEAD (Latency: ∞ ms)</span>.
            Inspect all three dust-covered stone murals to diagnose the failure, then unlock the definitions of{' '}
            <strong className="text-cyan-300">Edge Computing</strong> and <strong className="text-cyan-300">Edge AI</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MURALS.map((m) => {
              const Icon = m.icon;
              const isDone = inspected.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMural(m.id)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isDone
                      ? 'bg-cyan-950/50 border-cyan-400/70 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800/60 border-slate-700 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isDone ? 'text-cyan-300' : 'text-slate-400'}`} />
                    {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="text-xs font-bold text-white mb-1">{m.title}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Cpu className="w-4 h-4" /> Synthesize Core Definitions
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                1. What defines Edge Computing?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setEdgeComputingAnswer('cloud')}
                  className={`p-2.5 rounded-lg text-xs text-left border cursor-pointer ${
                    edgeComputingAnswer === 'cloud'
                      ? 'bg-cyan-900/50 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  Sending all raw sensor streams to distant Capital data centers
                </button>
                <button
                  onClick={() => setEdgeComputingAnswer('source')}
                  className={`p-2.5 rounded-lg text-xs text-left border cursor-pointer ${
                    edgeComputingAnswer === 'source'
                      ? 'bg-cyan-900/50 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  Moving computation to the physical data source for low latency
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                2. What defines Edge AI? (Zhou et al., 2019)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setEdgeAiAnswer('ondevice')}
                  className={`p-2.5 rounded-lg text-xs text-left border cursor-pointer ${
                    edgeAiAnswer === 'ondevice'
                      ? 'bg-cyan-900/50 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  Compressed ML models executed on-device for real-time inference without cloud uplink
                </button>
                <button
                  onClick={() => setEdgeAiAnswer('remote')}
                  className={`p-2.5 rounded-lg text-xs text-left border cursor-pointer ${
                    edgeAiAnswer === 'remote'
                      ? 'bg-cyan-900/50 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  Waiting for remote authorization before running any neural network
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-300 bg-red-950/60 border border-red-500/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Murals inspected: {inspected.length}/3</span>
          <button
            onClick={handleSynthesize}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition cursor-pointer"
          >
            Unlock Chapter 1 & Awaken Altar
          </button>
        </div>
      </div>
    </div>
  );
};
