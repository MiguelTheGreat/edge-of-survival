import React, { useState } from 'react';
import { ShieldAlert, Waves, Zap, CheckCircle2 } from 'lucide-react';
import { ThreatCube } from '../GameWorld25D';
import { audioEngine } from '../../services/AudioEngine';

interface Props {
  threats: ThreatCube[];
  interceptedCount: number;
  requiredIntercepts: number;
  onInterceptThreat: (id: string) => void;
  onTriggerReflexLoop: (finalLatencyMs: number) => void;
}

const ETHICS_SHIELDS = [
  'Encryption',
  'Access Control',
  'Physical Protection',
  'Secure Updates',
  'RA 10173 Data Minimization',
];

export const ClimaxDefenseOverlay: React.FC<Props> = ({
  threats,
  interceptedCount,
  requiredIntercepts,
  onInterceptThreat,
  onTriggerReflexLoop,
}) => {
  const [selectedShield, setSelectedShield] = useState<string>(ETHICS_SHIELDS[0]);
  const [sensorActive, setSensorActive] = useState(false);
  const [inferenceActive, setInferenceActive] = useState(false);

  const shieldsComplete = interceptedCount >= requiredIntercepts;

  const handleActuatorFire = () => {
    if (!shieldsComplete || !sensorActive || !inferenceActive) {
      audioEngine.playWarningKlaxon();
      return;
    }
    const finalLatency = Number((3.4 + Math.random() * 1.4).toFixed(1));
    audioEngine.playVictoryFanfare();
    onTriggerReflexLoop(finalLatency);
  };

  return (
    <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 w-[96vw] max-w-3xl max-h-[46dvh] overflow-y-auto bg-slate-950/92 border border-emerald-500/50 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
        <div>
          <span className="text-[10px] sm:text-[11px] font-display tabular-nums uppercase tracking-wider sm:tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 animate-pulse shrink-0" />
            Ch 7 Climax • Two-Way Stream
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-white">
            Defend the Valley Dam — Capital Lines Dead!
          </h3>
        </div>
        <div className="text-[11px] sm:text-xs font-display tabular-nums px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300">
          Blocked: {Math.min(interceptedCount, requiredIntercepts)} / {requiredIntercepts}
        </div>
      </div>

      {/* Step 1: Ch 10 Security & Ethics Shields */}
      <div className="mb-2.5 sm:mb-3">
        <div className="text-[10px] sm:text-[11px] text-slate-300 mb-1.5 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>
            1. Tap threats in 3D (or below) with a Ch 10 Shield:
          </span>
        </div>
        <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto gap-1.5 mb-2 pb-1 sm:pb-0">
          {ETHICS_SHIELDS.map((shield) => (
            <button
              key={shield}
              onClick={() => setSelectedShield(shield)}
              className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold border whitespace-nowrap shrink-0 cursor-pointer ${
                selectedShield === shield
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500/50'
              }`}
            >
              {shield}
            </button>
          ))}
        </div>

        {!shieldsComplete && threats.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {threats.map((t) => (
              <button
                key={t.id}
                onClick={() => onInterceptThreat(t.id)}
                className="px-2 py-1 sm:px-2.5 rounded-lg bg-red-600/90 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold border border-red-300 cursor-pointer transition"
              >
                Block {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Sub-10ms Reflex Loop */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => {
            audioEngine.playInteract();
            setSensorActive(true);
          }}
          className={`px-2.5 py-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold border flex items-center gap-1 cursor-pointer ${
            sensorActive
              ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300'
              : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-400'
          }`}
        >
          {sensorActive && <CheckCircle2 className="w-3.5 h-3.5" />}
          1. Sensors
        </button>
        <span className="text-slate-500 text-xs">→</span>
        <button
          onClick={() => {
            if (!sensorActive) return;
            audioEngine.playInteract();
            setInferenceActive(true);
          }}
          className={`px-2.5 py-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold border flex items-center gap-1 cursor-pointer ${
            inferenceActive
              ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300'
              : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-400'
          }`}
        >
          {inferenceActive && <CheckCircle2 className="w-3.5 h-3.5" />}
          2. TinyML
        </button>
        <span className="text-slate-500 text-xs">→</span>
        <button
          onClick={handleActuatorFire}
          disabled={!shieldsComplete || !sensorActive || !inferenceActive}
          className={`px-3 py-1.5 sm:px-4 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
            shieldsComplete && sensorActive && inferenceActive
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> 3. Raise Floodgates (&lt;10ms)
        </button>
      </div>
    </div>
  );
};
