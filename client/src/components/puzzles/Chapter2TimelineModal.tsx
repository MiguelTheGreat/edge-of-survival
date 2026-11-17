import React, { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Sparkles, X } from 'lucide-react';
import { audioEngine } from '../../services/AudioEngine';

interface Props {
  onSolve: () => void;
  onClose: () => void;
}

interface EraItem {
  id: string;
  era: string;
  label: string;
  order: number;
}

const CORRECT_ERAS: EraItem[] = [
  { id: '1960s', era: '1960s', label: 'Mainframe Era (Centralized hubs, dumb terminals)', order: 1 },
  { id: '1980s', era: '1980s', label: 'Personal Computing (Standalone microprocessors on desks)', order: 2 },
  { id: '1990s', era: '1990s', label: 'Content Delivery Networks (CDNs caching web data)', order: 3 },
  { id: '2000s', era: '2000s', label: 'The Cloud Boom (Elastic but fragile central farms)', order: 4 },
  { id: '2009', era: '2009', label: 'Cloudlets & Mobile Edge (Micro-servers 1 hop away)', order: 5 },
  { id: '2014', era: '2014', label: 'Fog Computing & IoT (Gateways & routers processing IoT)', order: 6 },
  { id: '2016', era: '2016', label: 'Edge Computing Defined (IEEE offline determinism)', order: 7 },
  { id: '2020s', era: '2020s+', label: 'Edge AI & TinyML (Quantized DL & NPUs on-device)', order: 8 },
];

export const Chapter2TimelineModal: React.FC<Props> = ({ onSolve, onClose }) => {
  const initialShuffled = useMemo(() => {
    const a = CORRECT_ERAS;
    return [a[3], a[0], a[5], a[1], a[7], a[2], a[6], a[4]];
  }, []);

  const [items, setItems] = useState<EraItem[]>(initialShuffled);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    audioEngine.playInteract();
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    setSelectedIdx(null);
    setError('');
  };

  const handleRowClick = (idx: number) => {
    audioEngine.playInteract();
    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      const next = [...items];
      [next[selectedIdx], next[idx]] = [next[idx], next[selectedIdx]];
      setItems(next);
      setSelectedIdx(null);
      setError('');
    }
  };

  const handleVerify = () => {
    const isCorrect = items.every((item, idx) => item.order === idx + 1);
    if (!isCorrect) {
      audioEngine.playWarningKlaxon();
      setError('Chronological mismatch! Sequence all 8 eras from 1960s Mainframes (1) to 2020s+ Edge AI & TinyML (8).');
      return;
    }
    audioEngine.playHologramChime();
    onSolve();
  };

  const lockedCount = items.filter((item, idx) => item.order === idx + 1).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-400/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-display font-semibold uppercase tracking-widest text-cyan-400">
              Chapter 2 • Evolution (“The power... It attracts me.”)
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">Hologram Altar: Computing Timeline</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto space-y-3">
          <div className="text-xs bg-cyan-950/40 border border-cyan-500/30 rounded-xl px-3.5 py-2 text-cyan-200 flex items-center justify-between gap-2">
            <span>
              <strong>How to Solve:</strong> Click any two eras to swap them (or use ↑↓) from 1960s to 2020s+. Green = correct slot!
            </span>
            <span className="font-display font-bold tabular-nums text-emerald-300 shrink-0">
              {lockedCount}/8 Aligned
            </span>
          </div>

          <div className="space-y-1.5 pb-1">
            {items.map((item, idx) => {
              const inRightSpot = item.order === idx + 1;
              const isSelected = selectedIdx === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(idx)}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400/50'
                      : inRightSpot
                      ? 'bg-emerald-950/35 border-emerald-500/45'
                      : 'bg-slate-800/70 border-slate-700 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-700 text-xs font-semibold tabular-nums flex items-center justify-center text-cyan-300 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate sm:whitespace-normal">
                      <span className="text-xs font-display font-bold tabular-nums text-cyan-300 mr-2">{item.era}</span>
                      <span className="text-xs text-slate-200">{item.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:opacity-30 text-slate-200 cursor-pointer"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:opacity-30 text-slate-200 cursor-pointer"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="text-xs text-red-300 bg-red-950/60 border border-red-500/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            {selectedIdx !== null ? `Swapping slot #${selectedIdx + 1} — click another row` : 'Tip: Click two rows to swap'}
          </span>
          <button
            onClick={handleVerify}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Bind Hologram Rings
          </button>
        </div>
      </div>
    </div>
  );
};
