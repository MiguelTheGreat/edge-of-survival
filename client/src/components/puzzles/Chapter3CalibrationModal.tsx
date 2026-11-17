import React, { useState } from 'react';
import { Sliders, Zap, X } from 'lucide-react';
import { audioEngine } from '../../services/AudioEngine';

interface Props {
  onSolve: (latencyMs: number, bandwidthSavedPct: number) => void;
  onClose: () => void;
}

export const Chapter3CalibrationModal: React.FC<Props> = ({ onSolve, onClose }) => {
  const [latencyTarget, setLatencyTarget] = useState<number>(45);
  const [localityPct, setLocalityPct] = useState<number>(30);
  const [partitionTolerance, setPartitionTolerance] = useState<boolean>(false);
  const [decoupledCompute, setDecoupledCompute] = useState<boolean>(false);
  const [dataSovereignty, setDataSovereignty] = useState<boolean>(false);
  const [error, setError] = useState('');

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
    if (!partitionTolerance || !decoupledCompute || !dataSovereignty) {
      setError('Enable Partition Tolerance, Decoupled Computation, and Data Sovereignty to power the laser bridge.');
      audioEngine.playWarningKlaxon();
      return;
    }
    audioEngine.playHologramChime();
    onSolve(latencyTarget, localityPct);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-sky-400/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-sky-400">
              Chapter 3 • Fundamental Concepts (“A solution. This is a solution.”)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Calibrate the Laser Bridge</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <p className="text-sm text-slate-300">
            Holographic rings orbit John’s arm. Configure the five foundational Edge principles to energize the 3D laser bridge into Act II.
          </p>

          <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-sky-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Deterministic Latency &amp; Temporal Bounds
                </span>
                <span className={`font-mono ${latencyTarget < 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
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
                <span className={`font-mono ${localityPct >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
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

          <div className="grid grid-cols-1 gap-2.5">
            {[
              {
                label: 'Partition Tolerance (Satyanarayanan, 2017)',
                desc: 'Operate autonomously during total network cuts by decoupling local safety controls.',
                value: partitionTolerance,
                toggle: () => setPartitionTolerance((v) => !v),
              },
              {
                label: 'Decoupled Computation',
                desc: 'Cloud handles heavy training; Edge executes low-power, real-time inference.',
                value: decoupledCompute,
                toggle: () => setDecoupledCompute((v) => !v),
              },
              {
                label: 'Data Sovereignty (Zhou et al., 2019)',
                desc: 'Keep raw data inside the local perimeter to shrink external attack surfaces.',
                value: dataSovereignty,
                toggle: () => setDataSovereignty((v) => !v),
              },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  audioEngine.playInteract();
                  item.toggle();
                }}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                  item.value
                    ? 'bg-emerald-950/40 border-emerald-400/60'
                    : 'bg-slate-800/60 border-slate-700 hover:border-sky-400/50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                    item.value ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {item.value ? 'ACTIVE' : 'OFF'}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="text-xs text-red-300 bg-red-950/60 border border-red-500/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
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
