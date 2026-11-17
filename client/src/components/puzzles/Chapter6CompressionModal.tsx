import React, { useEffect, useState } from 'react';
import { Flame, Cpu, CheckCircle2, X } from 'lucide-react';
import { audioEngine } from '../../services/AudioEngine';

interface Props {
  onSolve: (latencyMs: number) => void;
  onClose: () => void;
}

export const Chapter6CompressionModal: React.FC<Props> = ({ onSolve, onClose }) => {
  const [quantized, setQuantized] = useState(false); // FP32 -> INT8
  const [pruned, setPruned] = useState(false); // Prune redundant weights
  const [distilled, setDistilled] = useState(false); // Teacher -> Student
  const [dspEnabled, setDspEnabled] = useState(false); // Fourier / Wavelet DSP

  useEffect(() => {
    audioEngine.playWarningKlaxon();
  }, []);

  // Compute simulated microcontroller metrics (Han et al., 2015 + Ch 9 Limitations)
  const memoryKB =
    920 - (quantized ? 540 : 0) - (pruned ? 190 : 0) - (distilled ? 110 : 0);
  const thermalC =
    108 - (quantized ? 34 : 0) - (pruned ? 16 : 0) - (distilled ? 12 : 0) - (dspEnabled ? 8 : 0);
  const accuracyPct =
    96 - (quantized ? 2.1 : 0) - (pruned ? 2.4 : 0) - (distilled ? 3.2 : 0) + (dspEnabled ? 1.5 : 0);
  const inferenceMs =
    42 - (quantized ? 19 : 0) - (pruned ? 9 : 0) - (distilled ? 6 : 0) - (dspEnabled ? 3.2 : 0);

  const memoryOk = memoryKB <= 256;
  const thermalOk = thermalC <= 55;
  const accuracyOk = accuracyPct >= 85;
  const allSafe = memoryOk && thermalOk && accuracyOk && quantized && pruned && distilled && dspEnabled;

  const handleDeploy = () => {
    if (!allSafe) {
      audioEngine.playWarningKlaxon();
      return;
    }
    audioEngine.playHologramChime();
    onSolve(Number(inferenceMs.toFixed(1)));
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-red-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-red-950/40 border-b border-red-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-red-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              Chapters 6 &amp; 9 • Thermal Overload (“How do I make myself stronger?” / “Every power has its limits.”)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Deep Compression Workbench (TinyML)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <p className="text-sm text-slate-300">
            Deploying a raw <code className="text-red-300 font-mono">FP32</code> neural network onto a microcontroller triggers{' '}
            <strong className="text-red-300">Power &amp; Heat</strong> and <strong className="text-red-300">Limited Resources</strong> alarms!
            Apply the <strong>Deep Compression</strong> pipeline (Han et al., 2015) while keeping accuracy above <strong>85%</strong>.
          </p>

          {/* Live MCU Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border ${memoryOk ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-red-950/40 border-red-500/50'}`}>
              <div className="text-[11px] text-slate-400">SRAM Footprint (Limit ≤256KB)</div>
              <div className={`text-lg font-mono font-bold ${memoryOk ? 'text-emerald-400' : 'text-red-400'}`}>
                {memoryKB} KB
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${thermalOk ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-red-950/40 border-red-500/50'}`}>
              <div className="text-[11px] text-slate-400">Chip Temp (Limit ≤55°C)</div>
              <div className={`text-lg font-mono font-bold ${thermalOk ? 'text-emerald-400' : 'text-red-400'}`}>
                {thermalC}°C
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${accuracyOk ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-amber-950/40 border-amber-500/50'}`}>
              <div className="text-[11px] text-slate-400">Accuracy (Min ≥85%)</div>
              <div className="text-lg font-mono font-bold text-cyan-300">
                {accuracyPct.toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl border bg-slate-950/60 border-slate-700">
              <div className="text-[11px] text-slate-400">Local Inference</div>
              <div className="text-lg font-mono font-bold text-amber-300">
                {inferenceMs.toFixed(1)} ms
              </div>
            </div>
          </div>

          {/* Compression Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: '1. INT8 Quantization',
                desc: 'Convert FP32 weights & activations to 8-bit integers (INT8).',
                active: quantized,
                toggle: () => setQuantized((v) => !v),
              },
              {
                title: '2. Neural Pruning',
                desc: 'Strip redundant neural connections that do not contribute to inference.',
                active: pruned,
                toggle: () => setPruned((v) => !v),
              },
              {
                title: '3. Model Distillation',
                desc: 'Transfer Teacher intelligence into a compact Student model.',
                active: distilled,
                toggle: () => setDistilled((v) => !v),
              },
              {
                title: '4. DSP Transforms (Fourier / Wavelet)',
                desc: 'Pre-filter acoustic & water-pressure noise before TinyML inference.',
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
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${
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

        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
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
            {allSafe ? 'Deploy Compressed TinyML Model' : 'Stabilize Heat & Memory First'}
          </button>
        </div>
      </div>
    </div>
  );
};
