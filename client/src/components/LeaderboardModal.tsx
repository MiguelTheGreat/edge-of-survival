import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw, X } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { storageService } from '../services/StorageService';

interface Props {
  currentNickname: string;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({ currentNickname, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await storageService.getLeaderboard();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-amber-400/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Classroom Telemetry Leaderboard</h2>
              <p className="text-xs text-slate-400">
                Mode: {storageService.getMode() === 'live' ? 'Live Socket.io Server' : 'GitHub Pages Local Mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Engineer</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Latency</th>
                <th className="py-2 px-2">BW Saved</th>
                <th className="py-2 px-2">Security</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {entries.map((row) => {
                const isMe = row.nickname.toLowerCase() === currentNickname.toLowerCase();
                return (
                  <tr key={row.id} className={isMe ? 'bg-cyan-950/40 text-cyan-200' : 'text-slate-200'}>
                    <td className="py-2.5 px-2 font-mono font-bold text-amber-400">{row.rank}</td>
                    <td className="py-2.5 px-2 font-semibold">
                      {row.nickname} {isMe && <span className="text-[10px] text-cyan-400">(You)</span>}
                    </td>
                    <td className="py-2.5 px-2">
                      {row.completed ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          MAN OF EDGE
                        </span>
                      ) : (
                        <span className="text-slate-400">Ch {row.currentChapter}/12</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-cyan-300">
                      {row.bestLatencyMs < 900 ? `${row.bestLatencyMs.toFixed(1)} ms` : '∞ ms'}
                    </td>
                    <td className="py-2.5 px-2 font-mono">{row.bandwidthSavedPct.toFixed(0)}%</td>
                    <td className="py-2.5 px-2 font-mono text-emerald-300">{row.securityScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
