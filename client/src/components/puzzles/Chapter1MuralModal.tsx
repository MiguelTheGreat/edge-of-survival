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
  const [diag1, setDiag1] = useState('');
  const [diag2, setDiag2] = useState('');
  const [edgeComputingAnswer, setEdgeComputingAnswer] = useState('');
  const [edgeAiAnswer, setEdgeAiAnswer] = useState('');
  const [error, setError] = useState('');

  const toggleMural = (id: string) => {
    audioEngine.playInteract();
    if (!inspected.includes(id)) {
      setInspected((prev) => [...prev, id]);
    }
    setError('');
  };

  const handleSynthesize = () => {
    if (inspected.length < 3) {
      setError('Rule: Click all 3 carved stone murals above to inspect them first.');
      audioEngine.playWarningKlaxon();
      return;
    }
    if (diag1 !== 'spof' || diag2 !== 'bandwidth') {
      setError('Check your station diagnostics: total blackout on cut fiber = Single Point of Failure; choked uplinks = Bandwidth.');
      audioEngine.playWarningKlaxon();
      return;
    }
    if (edgeComputingAnswer !== 'source' || edgeAiAnswer !== 'ondevice') {
      setError('Verify both definitions: Edge Computing moves compute to the data source; Edge AI runs compressed ML on-device.');
      audioEngine.playWarningKlaxon();
      return;
    }
    audioEngine.playHologramChime();
    onSolve();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-teal-500/45 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-display font-semibold uppercase tracking-widest text-teal-400">
              Chapter 1 • Introduction (“Discover the secrets.”)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">The Severed Station Murals</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="text-xs bg-teal-950/40 border border-teal-500/30 rounded-xl px-3.5 py-2.5 text-teal-200">
            <strong>How to Solve:</strong> 1) Click all 3 stone murals to read them. 2) Diagnose the station blackout &amp; uplink flood. 3) Define Edge Computing &amp; Edge AI.
          </div>

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
                      ? 'bg-teal-950/50 border-teal-400/70 shadow-lg shadow-teal-500/10'
                      : 'bg-slate-800/60 border-slate-700 hover:border-teal-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isDone ? 'text-teal-300' : 'text-slate-400'}`} />
                    {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="text-xs font-bold text-white mb-1">{m.title}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Diagnostic Matrix */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Symptom A: Capital fiber cut → whole station freezes
              </label>
              <select
                value={diag1}
                onChange={(e) => setDiag1(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
              >
                <option value="">-- Identify Root Problem --</option>
                <option value="latency">Latency</option>
                <option value="bandwidth">Bandwidth</option>
                <option value="spof">Single Point of Failure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Symptom B: Billions of raw sensor streams choke uplinks
              </label>
              <select
                value={diag2}
                onChange={(e) => setDiag2(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
              >
                <option value="">-- Identify Root Problem --</option>
                <option value="latency">Latency</option>
                <option value="bandwidth">Bandwidth</option>
                <option value="spof">Single Point of Failure</option>
              </select>
            </div>
          </div>

          {/* Definitions */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
              <Cpu className="w-4 h-4" /> Synthesize Core Definitions
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                1. What defines Edge Computing?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setEdgeComputingAnswer('cloud')}
                  className={`p-2.5 rounded-lg text-xs text-left border cursor-pointer ${
                    edgeComputingAnswer === 'cloud'
                      ? 'bg-teal-900/50 border-teal-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  Sending all raw sensor streams to distant Capital data centers
                </button>
                <button
                  onClick={() => setEdgeComputingAnswer('source')}
                  className={`p-2.5 rounded-lg text-xs text-left border cursor-pointer ${
                    edgeComputingAnswer === 'source'
                      ? 'bg-teal-900/50 border-teal-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  Moving computation to the physical data source for low latency
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                2. What defines Edge AI? (Zhou et al., 2019)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setEdgeAiAnswer('ondevice')}
                  className={`p-2.5 rounded-lg text-xs text-left border cursor-pointer ${
                    edgeAiAnswer === 'ondevice'
                      ? 'bg-teal-900/50 border-teal-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  Compressed ML models executed on-device for real-time inference without cloud uplink
                </button>
                <button
                  onClick={() => setEdgeAiAnswer('remote')}
                  className={`p-2.5 rounded-lg text-xs text-left border cursor-pointer ${
                    edgeAiAnswer === 'remote'
                      ? 'bg-teal-900/50 border-teal-400 text-white'
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

        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">Murals inspected: {inspected.length}/3</span>
          <button
            onClick={handleSynthesize}
            className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm transition cursor-pointer"
          >
            Unlock Chapter 1 &amp; Awaken Altar
          </button>
        </div>
      </div>
    </div>
  );
};
