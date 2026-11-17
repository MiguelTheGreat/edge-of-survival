import React, { useState } from 'react';
import { Cpu, CheckCircle2, X } from 'lucide-react';
import { audioEngine } from '../../services/AudioEngine';

interface Props {
  onSolve: () => void;
  onClose: () => void;
}

const HARDWARE_MODULES = [
  { id: 'mcu', name: 'Microcontroller (ESP32 / Arduino Uno / RPi Pico / PIC)' },
  { id: 'sbc', name: 'SoC / SoM / SBC (Raspberry Pi 4 / 5)' },
  { id: 'fpga', name: 'FPGA (AMD Spartan-7 Reconfigurable Logic)' },
  { id: 'accel', name: 'Embedded GPU & Accelerators (GPU / TPU / NPU)' },
  { id: 'gateway', name: 'Edge Gateway & Edge Server (Yıldırım et al., 2025)' },
];

const SCENARIOS = [
  {
    id: 's1',
    prompt: 'Ultra-low-power river-level sensor node running TinyML on battery for months:',
    correct: 'mcu',
  },
  {
    id: 's2',
    prompt: 'Standalone single-board computer with OS, RAM, and standard I/O out of the box:',
    correct: 'sbc',
  },
  {
    id: 's3',
    prompt: 'Reprogrammable silicon offering hardware parallelism and ultra-low deterministic latency:',
    correct: 'fpga',
  },
  {
    id: 's4',
    prompt: 'Specialized NPU/GPU silicon offloading neural matrix math from the CPU:',
    correct: 'accel',
  },
  {
    id: 's5',
    prompt: 'Ruggedized networking & compute hub bridging field sensors to the core:',
    correct: 'gateway',
  },
];

export const Chapter5HardwareModal: React.FC<Props> = ({ onSolve, onClose }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const handleVerify = () => {
    const allCorrect = SCENARIOS.every((s) => answers[s.id] === s.correct);
    if (!allCorrect) {
      audioEngine.playWarningKlaxon();
      setError('Some field constraints do not match the selected silicon! Check each hardware specification.');
      return;
    }
    audioEngine.playHologramChime();
    onSolve();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-amber-400/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Chapter 5 • Hardware (“Power in a small package.”)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Silicon Gallery: Match Field Constraints</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3.5">
          <p className="text-sm text-slate-300">
            Assign the right Edge hardware module to each dam-station requirement.
          </p>

          {SCENARIOS.map((sc) => {
            const isMatched = answers[sc.id] === sc.correct;
            return (
              <div
                key={sc.id}
                className={`p-3.5 rounded-xl border transition ${
                  isMatched
                    ? 'bg-emerald-950/35 border-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs text-slate-200 font-medium flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                    {sc.prompt}
                  </div>
                  {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                <select
                  value={answers[sc.id] || ''}
                  onChange={(e) => {
                    audioEngine.playInteract();
                    setAnswers((prev) => ({ ...prev, [sc.id]: e.target.value }));
                    setError('');
                  }}
                  className="mt-2.5 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Select Hardware Pedestal --</option>
                  {HARDWARE_MODULES.map((hw) => (
                    <option key={hw.id} value={hw.id}>
                      {hw.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

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
            Lock Hardware Loadout
          </button>
        </div>
      </div>
    </div>
  );
};
