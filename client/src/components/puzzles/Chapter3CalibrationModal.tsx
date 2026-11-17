import React, { useState } from 'react';
import { Sliders, Zap, X } from 'lucide-react';
import { audioEngine } from '../../services/AudioEngine';

interface Props {
  onSolve: (latencyMs: number, bandwidthSavedPct: number) => void;
  onClose: () => void;
}

const CANDIDATE_RULES = [
  {
    id: 'partition',
    label: 'Partition Tolerance (Satyanarayanan, 2017)',
    desc: 'Operate autonomously during total network cuts by decoupling local safety controls.',
    isEdgePrinciple: true,
  },
  {
    id: 'cloud-poll',
    label: 'Centralized Cloud Polling',
    desc: 'Require remote Capital server handshake before every local valve actuation.',
    isEdgePrinciple: false,
  },
  {
    id: 'decoupled',
    label: 'Decoupled Computation',
    desc: 'Cloud handles heavy training; Edge executes low-power, real-time inference.',
    isEdgePrinciple: true,
  },
  {
    id: 'raw-stream',
    label: 'Unbounded Raw Telemetry Streaming',
    desc: 'Forward 100% of unfiltered acoustic & pressure samples upstream continuously.',
    isEdgePrinciple: false,
  },
  {
    id: 'sovereignty',
    label: 'Data Sovereignty (Zhou et al., 2019)',
    desc: 'Keep raw data inside the local perimeter to shrink external attack surfaces.',
    isEdgePrinciple: true,
  },
];

export const Chapter3CalibrationModal: React.FC<Props> = ({ onSolve, onClose }) => {
  const [latencyTarget, setLatencyTarget] = useState<number>(38);
  const [localityPct, setLocalityPct] = useState<number>(35);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggleRule = (id: string) => {
    audioEngine.playInteract();
    setError('');
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleIgnite = () => {
    if (latencyTarget >= 10) {
      setError('Deterministic Latency must be strictly sub-10ms (<10ms) to eliminate cloud jitter!');
      audioEngine.playWarningKlaxon();
      return;
    }
    if (localityPct < 85) {
      setError('Data Locality (In-Situ) must filter at least 85–90% of raw telemetry at the source.');
      audioEngine.playWarningKlaxon();
      return;
    }
    const pickedValid = CANDIDATE_RULES.filter((r) => r.isEdgePrinciple).every((r) =>
      selectedIds.includes(r.id)
    );
    const pickedDistractor = CANDIDATE_RULES.filter((r) => !r.isEdgePrinciple).some((r) =>
      selectedIds.includes(r.id)
    );
    if (!pickedValid || pickedDistractor) {
      setError(
        'Select ONLY the 3 true Edge principles (avoid Centralized Cloud Polling and Unbounded Raw Streaming)!'
      );
      audioEngine.playWarningKlaxon();
      return;
    }
    audioEngine.playHologramChime();
    onSolve(latencyTarget, localityPct);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-sky-400/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-display font-semibold uppercase tracking-widest text-sky-400">
              Chapter 3 • Fundamental Concepts (“A solution. This is a solution.”)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Calibrate the Laser Bridge</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto space-y-4">
          <div className="text-xs bg-sky-950/40 border border-sky-500/30 rounded-xl px-3.5 py-2 text-sky-200">
            <strong>How to Solve:</strong> Set Latency &lt;10ms, Data Locality ≥85%, and activate <strong>only the 3 true Edge principles</strong> (ignore the 2 legacy Cloud habits).
          </div>

          <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-sky-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Deterministic Latency &amp; Temporal Bounds
                </span>
                <span className={`font-display tabular-nums ${latencyTarget < 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {latencyTarget.toFixed(1)} ms {latencyTarget < 10 ? '(SUB-10ms OK)' : '(TOO HIGH)'}
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={60}
                step={0.5}
                value={latencyTarget}
                onChange={(e) => setLatencyTarget(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-sky-300">Data Locality (In-Situ Telemetry Filtering)</span>
                <span className={`font-display tabular-nums ${localityPct >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {localityPct}% Saved {localityPct >= 85 ? '(OPTIMAL)' : '(FLOOD RISK)'}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                step={1}
                value={localityPct}
                onChange={(e) => setLocalityPct(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {CANDIDATE_RULES.map((item) => {
              const active = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleRule(item.id)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    active
                      ? 'bg-sky-950/50 border-sky-400/70'
                      : 'bg-slate-800/60 border-slate-700 hover:border-sky-400/50'
                  }`}
                >
                  <div className="pr-3">
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-md text-[11px] font-display font-bold shrink-0 ${
                      active ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {active ? 'ACTIVE' : 'OFF'}
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="text-xs text-red-300 bg-red-950/60 border border-red-500/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={handleIgnite}
            className="px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" /> Ignite 3D Laser Bridge
          </button>
        </div>
      </div>
    </div>
  );
};
