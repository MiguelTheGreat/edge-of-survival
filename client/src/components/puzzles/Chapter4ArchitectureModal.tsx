import React, { useState } from 'react';
import { Layers, RotateCw, X } from 'lucide-react';
import { audioEngine } from '../../services/AudioEngine';

interface Props {
  onSolve: () => void;
  onClose: () => void;
}

export const Chapter4ArchitectureModal: React.FC<Props> = ({ onSolve, onClose }) => {
  // Conduit rotation puzzle: target is ['local-edge', 'edge-gateway', 'actuator']
  const [tierTop, setTierTop] = useState<'cloud' | 'edge' | 'end'>('end');
  const [tierMid, setTierMid] = useState<'cloud' | 'edge' | 'end'>('cloud');
  const [tierBot, setTierBot] = useState<'cloud' | 'edge' | 'end'>('edge');
  const [conduitAngle, setConduitAngle] = useState<number>(90); // 0 = routed to Local Edge Gateway, 90/180/270 = severed Cloud
  const [stepOrder, setStepOrder] = useState<string[]>([]);
  const [error, setError] = useState('');

  const STEPS = [
    'Step 1: Data Acquisition',
    'Step 2: Edge Infrastructure Optimization',
    'Step 3: Model Inference & Training Optimization',
    'Step 4: Application',
  ];

  const handleStepClick = (step: string) => {
    audioEngine.playInteract();
    if (stepOrder.includes(step)) {
      setStepOrder((prev) => prev.filter((s) => s !== step));
    } else {
      setStepOrder((prev) => [...prev, step]);
    }
  };

  const handleVerify = () => {
    if (tierTop !== 'cloud' || tierMid !== 'edge' || tierBot !== 'end') {
      setError('Align the Three-Layer Architecture: Top = Cloud Server, Middle = Edge Server, Bottom = End Device.');
      audioEngine.playWarningKlaxon();
      return;
    }
    if (conduitAngle !== 0) {
      setError('Rotate the 3D Data Conduit to 0° so water-sensor telemetry bypasses the severed Cloud tower through the Local Edge Gateway!');
      audioEngine.playWarningKlaxon();
      return;
    }
    const stepsValid =
      stepOrder.length === 4 &&
      stepOrder.every((s, idx) => s === STEPS[idx]);
    if (!stepsValid) {
      setError('Select the 4-Step Plan (Li et al., 2018) in exact order: 1 → 2 → 3 → 4.');
      audioEngine.playWarningKlaxon();
      return;
    }
    audioEngine.playHologramChime();
    onSolve();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-amber-400/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-display tabular-nums uppercase tracking-widest text-amber-400">
              Chapter 4 • Architecture (“Let’s test this power.”)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Three-Layer Spire &amp; 4-Step Plan</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Three-Layer Architecture */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> 1. Three-Layer Architecture (Shi et al., 2016)
              </div>
              {[
                { label: 'Top Tier', val: tierTop, set: setTierTop },
                { label: 'Middle Tier', val: tierMid, set: setTierMid },
                { label: 'Bottom Tier', val: tierBot, set: setTierBot },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-300">{row.label}:</span>
                  <select
                    value={row.val}
                    onChange={(e) => row.set(e.target.value as 'cloud' | 'edge' | 'end')}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="cloud">Cloud Server</option>
                    <option value="edge">Edge Server</option>
                    <option value="end">End Device</option>
                  </select>
                </div>
              ))}
            </div>

            {/* Conduit Routing */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-xs font-bold text-amber-300">2. Re-route Water-Sensor Telemetry</div>
              <p className="text-xs text-slate-400 my-2">
                The Cloud tower is severed! Rotate the conduit to <strong className="text-emerald-400">0° (Local Edge Gateway)</strong>.
              </p>
              <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700">
                <span className={`text-xs font-display tabular-nums font-bold ${conduitAngle === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {conduitAngle === 0 ? '0° → EDGE GATEWAY' : `${conduitAngle}° → SEVERED CLOUD`}
                </span>
                <button
                  onClick={() => {
                    audioEngine.playInteract();
                    setConduitAngle((a) => (a + 90) % 360);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
                </button>
              </div>
            </div>
          </div>

          {/* 4-Step Plan */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-amber-300">
              3. Build the Edge’s 4-Step Plan (Click in exact order 1 → 4)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[STEPS[2], STEPS[0], STEPS[3], STEPS[1]].map((step) => {
                const orderIdx = stepOrder.indexOf(step);
                return (
                  <button
                    key={step}
                    onClick={() => handleStepClick(step)}
                    className={`p-2.5 rounded-lg text-xs text-left border flex items-center justify-between cursor-pointer ${
                      orderIdx >= 0
                        ? 'bg-amber-950/50 border-amber-400 text-amber-100'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/50'
                    }`}
                  >
                    <span>{step}</span>
                    {orderIdx >= 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center">
                        {orderIdx + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-300 bg-red-950/60 border border-red-500/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleVerify}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
          >
            Deploy Local Architecture
          </button>
        </div>
      </div>
    </div>
  );
};
