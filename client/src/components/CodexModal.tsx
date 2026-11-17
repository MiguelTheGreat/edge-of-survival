import React, { useState } from 'react';
import { BookOpen, Lock, CheckCircle2, X } from 'lucide-react';
import { CODEX_ENTRIES } from '../data/chapters';
import { CodexUnlockRecord } from '../types/game';

interface Props {
  unlockedRecords: CodexUnlockRecord[];
  currentChapter: number;
  completed: boolean;
  onClose: () => void;
}

export const CodexModal: React.FC<Props> = ({
  unlockedRecords,
  currentChapter,
  completed,
  onClose,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  const isUnlocked = (ch: number) => {
    if (completed) return true;
    if (ch <= currentChapter) return true;
    return unlockedRecords.some((r) => r.chapterNumber === ch);
  };

  const activeEntry = CODEX_ENTRIES.find((c) => c.chapterNumber === selectedChapter) ?? CODEX_ENTRIES[0];
  const activeUnlocked = isUnlocked(activeEntry.chapterNumber);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Edge of Survival — Technical Codex</h2>
              <p className="text-xs text-slate-400">
                Chapters 1–12 • Philippine Edge Infrastructure &amp; Academic References
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Chapter List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/50 overflow-y-auto p-3 space-y-1.5 shrink-0 max-h-44 md:max-h-none">
            {CODEX_ENTRIES.map((entry) => {
              const unlocked = isUnlocked(entry.chapterNumber);
              const selected = selectedChapter === entry.chapterNumber;
              return (
                <button
                  key={entry.chapterNumber}
                  onClick={() => setSelectedChapter(entry.chapterNumber)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                    selected
                      ? 'bg-cyan-500/20 border border-cyan-400/60 text-white font-semibold'
                      : 'hover:bg-slate-800/70 text-slate-300 border border-transparent'
                  }`}
                >
                  <span className="truncate">
                    Ch {entry.chapterNumber}: {entry.title.split('—')[0]}
                  </span>
                  {unlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Chapter Detail */}
          <div className="flex-1 p-6 overflow-y-auto">
            {!activeUnlocked ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Lock className="w-10 h-10 text-slate-600" />
                <div className="text-sm font-bold text-slate-300">
                  Chapter {activeEntry.chapterNumber} Locked
                </div>
                <p className="text-xs max-w-sm">
                  Progress through the 2.5D chambers as John to unlock this Codex entry and its technical insights.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-display tabular-nums text-cyan-400 uppercase tracking-widest">
                    Chapter {activeEntry.chapterNumber}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-0.5">{activeEntry.title}</h3>
                  <p className="text-sm italic text-amber-300 mt-1">{activeEntry.narrativeQuote}</p>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  {activeEntry.narrativeBeat}
                </p>

                <div className="space-y-3">
                  {activeEntry.keyPoints.map((kp, i) => (
                    <div key={i} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">
                        {kp.heading}
                      </h4>
                      <ul className="space-y-1.5">
                        {kp.details.map((d, j) => (
                          <li key={j} className="text-xs text-slate-200 leading-relaxed flex gap-2">
                            <span className="text-emerald-400">▸</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {activeEntry.citation && (
                  <div className="text-[11px] text-slate-400 font-display tabular-nums pt-2 border-t border-slate-800">
                    Reference: {activeEntry.citation}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
