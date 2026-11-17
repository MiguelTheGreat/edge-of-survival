import React, { useEffect, useState } from 'react';
import { Flame, Cpu, CheckCircle2, X } from 'lucide-react';
import { audioEngine } from '../../services/AudioEngine';

interface Props {
  onSolve: (latencyMs: number) => void;
  onClose: () => void;
}

type Precision = 'FP32' | 'FP16' | 'INT8' | 'INT4';

export const Chapter6CompressionModal: React.FC<Props> = ({ onSolve, onClose }) => {
  const [precision, setPrecision] = useState<Precision>('FP32');
  const [pruningPct, setPruningPct] = useState<number>(0);
  const [distilled, setDistilled] = useState(false);
  const [dspEnabled, setDspEnabled] = useState(false);

  useEffect(() => {
    audioEngine.playWarningKlaxon();
  }, []);

  const precisionMemFactor: Record<Precision, number> = {
    FP32: 1.0,
    FP16: 0.55,
    INT8: 0.28,
    INT4: 0.16,
  };
  const precisionHeatReduction: Record<Precision, number> = {
    FP32: 0,
    FP16: 18,
    INT8: 36,
    INT4: 44,
  };
  const precisionAccPenalty: Record<Precision, number> = {
    FP32: 0,
    FP16: 0.6,
    INT8: 2.2,
    INT4: 11.5,
  };
  const precisionMsReduction: Record<Precision, number> = {
    FP32: 0,
    FP16: 10,
    INT8: 20,
    INT4: 24,
  };

  const memoryKB = Math.round(
    920 * precisionMemFactor[precision] * (1 - pruningPct * 0.0045) * (distilled ? 0.72 : 1)
  );
  const thermalC = Math.round(
    108 - precisionHeatReduction[precision] - pruningPct * 0.22 - (distilled ? 10 : 0) - (dspEnabled ? 6 : 0)
  );
  const accuracyPct = Number(
    (
      96.5 -
      precisionAccPenalty[precision] -
      Math.max(0, pruningPct - 45) * 0.24 -
      (distilled ? 1.5 : 0) +
      (dspEnabled ? 2.1 : 0)
    ).toFixed(1)
  );
  const inferenceMs = Number(
    Math.max(
      2.4,
      42 - precisionMsReduction[precision] - pruningPct * 0.14 - (distilled ? 5.5 : 0) - (dspEnabled ? 2.5 : 0)
    ).toFixed(1)
  );

  const memoryOk = memoryKB <= 256;
  const thermalOk = thermalC <= 55;
  const accuracyOk = accuracyPct >= 85;
  const latencyOk = inferenceMs < 10;
  const allSafe = memoryOk && thermalOk && accuracyOk && latencyOk && dspEnabled;

  const handleDeploy = () => {
    if (!allSafe) {
      audioEngine.playWarningKlaxon();
      return;
    }
    audioEngine.playHologramChime();
    onSolve(inferenceMs);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-red-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-red-950/40 border-b border-red-900/60 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-display font-semibold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              Chapters 6 &amp; 9 • Thermal Overload (“How do I make myself stronger?” / “Every power has its limits.”)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Deep Compression Workbench (TinyML)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto space-y-4">
          <div className="text-xs bg-red-950/35 border border-red-500/35 rounded-xl px-3.5 py-2.5 text-red-200">
            <strong>How to Solve:</strong> Tune Precision, Pruning %, Distillation, and DSP so <strong>SRAM ≤ 256KB</strong>, <strong>Temp ≤ 55°C</strong>, <strong>Accuracy ≥ 85%</strong>, and <strong>Inference &lt; 10ms</strong>. (Careful: INT4 or over-pruning crashes accuracy!)
          </div>

          {/* Live MCU Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border ${memoryOk ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-red-950/40 border-red-500/50'}`}>
              <div className="text-[11px] text-slate-400">SRAM (≤256KB)</div>
              <div className={`text-lg font-display font-bold tabular-nums ${memoryOk ? 'text-emerald-400' : 'text-red-400'}`}>
                {memoryKB} KB
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${thermalOk ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-red-950/40 border-red-500/50'}`}>
              <div className="text-[11px] text-slate-400">Chip Temp (≤55°C)</div>
              <div className={`text-lg font-display font-bold tabular-nums ${thermalOk ? 'text-emerald-400' : 'text-red-400'}`}>
                {thermalC}°C
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${accuracyOk ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-amber-950/40 border-amber-500/50'}`}>
              <div className="text-[11px] text-slate-400">Accuracy (≥85%)</div>
              <div className={`text-lg font-display font-bold tabular-nums ${accuracyOk ? 'text-cyan-300' : 'text-amber-400'}`}>
                {accuracyPct.toFixed(1)}%
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${latencyOk ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-slate-950/60 border-slate-700'}`}>
              <div className="text-[11px] text-slate-400">Inference (&lt;10ms)</div>
              <div className={`text-lg font-display font-bold tabular-nums ${latencyOk ? 'text-emerald-400' : 'text-amber-300'}`}>
                {inferenceMs.toFixed(1)} ms
              </div>
            </div>
          </div>

          {/* Quantization Precision Selector */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-white">1. Quantization Bit-Width (Han et al., 2015)</div>
            <div className="grid grid-cols-4 gap-2">
              {(['FP32', 'FP16', 'INT8', 'INT4'] as Precision[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    audioEngine.playInteract();
                    setPrecision(p);
                  }}
                  className={`py-2 rounded-lg text-xs font-display font-bold border cursor-pointer transition ${
                    precision === p
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500/50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Pruning Slider */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-white">2. Neural Pruning Sparsity</span>
              <span className="font-display tabular-nums text-cyan-300">{pruningPct}% Redundant Weights Removed</span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={pruningPct}
              onChange={(e) => setPruningPct(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Distillation & DSP Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: '3. Model Distillation',
                desc: 'Transfer Teacher intelligence into a compact Student model.',
                active: distilled,
                toggle: () => setDistilled((v) => !v),
              },
              {
                title: '4. DSP Transforms (Fourier / Wavelet)',
                desc: 'Pre-filter acoustic & water-pressure noise to boost accuracy.',
                active: dspEnabled,
                toggle: () => setDspEnabled((v) => !v),
              },
            ].map((tool) => (
              <button
                key={tool.title}
                onClick={() => {
                  audioEngine.playInteract();
                  tool.toggle();
                }}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  tool.active
                    ? 'bg-emerald-950/40 border-emerald-400/70'
                    : 'bg-slate-800/70 border-slate-700 hover:border-cyan-400/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> {tool.title}
                  </span>
                  {tool.active && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-xs text-slate-400">{tool.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Platforms: TensorFlow Lite • Edge Impulse • MATLAB / Simulink
          </span>
          <button
            onClick={handleDeploy}
            disabled={!allSafe}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
              allSafe
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {allSafe ? 'Deploy Compressed TinyML Model' : 'Balance Constraints First'}
          </button>
        </div>
      </div>
    </div>
  );
};
