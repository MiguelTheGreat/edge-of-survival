import { io, Socket } from 'socket.io-client';
import {
  CodexUnlockRecord,
  GameRunState,
  LeaderboardEntry,
  MilestoneEvent,
  PlayerSession,
} from '../types/game';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

const LS_PLAYER_KEY = 'eos_player_v1';
const LS_RUN_KEY = 'eos_run_v1';
const LS_CODEX_KEY = 'eos_codex_v1';
const LS_LEADERBOARD_KEY = 'eos_leaderboard_v1';
const LS_MILESTONES_KEY = 'eos_milestones_v1';

const SEEDED_CLASSMATES: LeaderboardEntry[] = [
  {
    rank: 1,
    id: 'seed-1',
    nickname: 'Abad_CpE',
    currentChapter: 12,
    completed: true,
    bestLatencyMs: 3.8,
    bandwidthSavedPct: 92,
    securityScore: 980,
    totalTimeSeconds: 245,
    updatedAt: new Date().toISOString(),
  },
  {
    rank: 2,
    id: 'seed-2',
    nickname: 'Chua_Edge',
    currentChapter: 12,
    completed: true,
    bestLatencyMs: 4.5,
    bandwidthSavedPct: 90,
    securityScore: 940,
    totalTimeSeconds: 278,
    updatedAt: new Date().toISOString(),
  },
  {
    rank: 3,
    id: 'seed-3',
    nickname: 'Napiza_TinyML',
    currentChapter: 12,
    completed: true,
    bestLatencyMs: 5.1,
    bandwidthSavedPct: 89,
    securityScore: 910,
    totalTimeSeconds: 302,
    updatedAt: new Date().toISOString(),
  },
];

export interface SessionStartResult {
  mode: 'live' | 'local';
  player: PlayerSession;
  run: GameRunState;
  codexUnlocks: CodexUnlockRecord[];
  recentMilestones: MilestoneEvent[];
}

export interface CheckpointPayload {
  playerId: string;
  runId: string;
  nickname: string;
  currentChapter: number;
  completed?: boolean;
  bestLatencyMs?: number;
  bandwidthSavedPct?: number;
  securityScore?: number;
  totalTimeSeconds?: number;
  codexEntries?: { chapterNumber: number; conceptTitle: string }[];
  milestoneMessage?: string;
}

class StorageService {
  private mode: 'live' | 'local' = 'local';
  private socket: Socket | null = null;
  private milestoneListeners: Set<(event: MilestoneEvent) => void> = new Set();

  public getMode(): 'live' | 'local' {
    return this.mode;
  }

  public onMilestone(cb: (event: MilestoneEvent) => void): () => void {
    this.milestoneListeners.add(cb);
    return () => {
      this.milestoneListeners.delete(cb);
    };
  }

  private emitLocalMilestone(event: MilestoneEvent): void {
    const existing = this.readLocalMilestones();
    const updated = [event, ...existing].slice(0, 25);
    try {
      localStorage.setItem(LS_MILESTONES_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota
    }
    this.milestoneListeners.forEach((cb) => cb(event));
  }

  private readLocalMilestones(): MilestoneEvent[] {
    try {
      const raw = localStorage.getItem(LS_MILESTONES_KEY);
      if (raw) return JSON.parse(raw) as MilestoneEvent[];
    } catch {
      // ignore
    }
    return [
      {
        id: 'seed-m1',
        nickname: 'Abad_CpE',
        message: 'Abad_CpE achieved 3.8ms latency and became The Man of Edge!',
        chapter: 12,
        latencyMs: 3.8,
        timestamp: new Date().toISOString(),
      },
    ];
  }

  private connectSocket(): void {
    if (!API_URL || this.socket) return;
    try {
      this.socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        timeout: 4000,
      });
      this.socket.on('milestone', (event: MilestoneEvent) => {
        this.milestoneListeners.forEach((cb) => cb(event));
      });
    } catch {
      // fallback silently
    }
  }

  public async startSession(nickname: string): Promise<SessionStartResult> {
    const cleanNick = nickname.trim().slice(0, 24) || 'John';

    if (API_URL) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${API_URL}/api/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: cleanNick }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          this.mode = 'live';
          this.connectSocket();
          return {
            mode: 'live',
            player: data.player,
            run: data.run,
            codexUnlocks: data.codexUnlocks ?? [],
            recentMilestones: data.recentMilestones ?? [],
          };
        }
      } catch {
        // Fall through to GitHub Pages localStorage mode
      }
    }

    this.mode = 'local';
    let player: PlayerSession | null = null;
    try {
      const saved = localStorage.getItem(LS_PLAYER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PlayerSession;
        if (parsed.nickname.toLowerCase() === cleanNick.toLowerCase()) {
          player = parsed;
        }
      }
    } catch {
      // ignore
    }

    if (!player) {
      player = {
        id: `local-player-${Date.now()}`,
        nickname: cleanNick,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(LS_PLAYER_KEY, JSON.stringify(player));
      // Reset run for new nickname
      localStorage.removeItem(LS_RUN_KEY);
    }

    let run: GameRunState | null = null;
    try {
      const savedRun = localStorage.getItem(LS_RUN_KEY);
      if (savedRun) {
        const parsedRun = JSON.parse(savedRun) as GameRunState;
        if (parsedRun.playerId === player.id) {
          run = parsedRun;
        }
      }
    } catch {
      // ignore
    }

    if (!run) {
      run = {
        id: `local-run-${Date.now()}`,
        playerId: player.id,
        currentChapter: 1,
        completed: false,
        bestLatencyMs: 999.0,
        bandwidthSavedPct: 0,
        securityScore: 0,
        totalTimeSeconds: 0,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LS_RUN_KEY, JSON.stringify(run));
    }

    let codexUnlocks: CodexUnlockRecord[] = [];
    try {
      const savedCodex = localStorage.getItem(LS_CODEX_KEY);
      if (savedCodex) codexUnlocks = JSON.parse(savedCodex) as CodexUnlockRecord[];
    } catch {
      // ignore
    }

    const recentMilestones = this.readLocalMilestones();
    return {
      mode: 'local',
      player,
      run,
      codexUnlocks,
      recentMilestones,
    };
  }

  public async saveCheckpoint(payload: CheckpointPayload): Promise<{
    run: GameRunState;
    codexUnlocks: CodexUnlockRecord[];
  }> {
    if (this.mode === 'live' && API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/progress/checkpoint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          return {
            run: data.run,
            codexUnlocks: data.codexUnlocks ?? [],
          };
        }
      } catch {
        // Fallback to localStorage if backend drops mid-session
        this.mode = 'local';
      }
    }

    // LocalStorage resilience
    let currentRun: GameRunState;
    try {
      const raw = localStorage.getItem(LS_RUN_KEY);
      currentRun = raw
        ? (JSON.parse(raw) as GameRunState)
        : {
            id: payload.runId,
            playerId: payload.playerId,
            currentChapter: 1,
            completed: false,
            bestLatencyMs: 999,
            bandwidthSavedPct: 0,
            securityScore: 0,
            totalTimeSeconds: 0,
            updatedAt: new Date().toISOString(),
          };
    } catch {
      currentRun = {
        id: payload.runId,
        playerId: payload.playerId,
        currentChapter: 1,
        completed: false,
        bestLatencyMs: 999,
        bandwidthSavedPct: 0,
        securityScore: 0,
        totalTimeSeconds: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    const updatedRun: GameRunState = {
      ...currentRun,
      currentChapter: Math.max(currentRun.currentChapter, Math.min(12, payload.currentChapter)),
      completed: Boolean(payload.completed) || currentRun.completed,
      bestLatencyMs:
        typeof payload.bestLatencyMs === 'number'
          ? Math.min(currentRun.bestLatencyMs, Math.max(0.5, payload.bestLatencyMs))
          : currentRun.bestLatencyMs,
      bandwidthSavedPct:
        typeof payload.bandwidthSavedPct === 'number'
          ? Math.max(currentRun.bandwidthSavedPct, Math.min(100, payload.bandwidthSavedPct))
          : currentRun.bandwidthSavedPct,
      securityScore:
        typeof payload.securityScore === 'number'
          ? Math.max(currentRun.securityScore, payload.securityScore)
          : currentRun.securityScore,
      totalTimeSeconds:
        typeof payload.totalTimeSeconds === 'number'
          ? Math.max(currentRun.totalTimeSeconds, payload.totalTimeSeconds)
          : currentRun.totalTimeSeconds,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(LS_RUN_KEY, JSON.stringify(updatedRun));

    let codex: CodexUnlockRecord[] = [];
    try {
      const rawCodex = localStorage.getItem(LS_CODEX_KEY);
      if (rawCodex) codex = JSON.parse(rawCodex) as CodexUnlockRecord[];
    } catch {
      // ignore
    }

    if (payload.codexEntries) {
      for (const entry of payload.codexEntries) {
        const exists = codex.some(
          (c) => c.chapterNumber === entry.chapterNumber && c.conceptTitle === entry.conceptTitle
        );
        if (!exists) {
          codex.push({
            chapterNumber: entry.chapterNumber,
            conceptTitle: entry.conceptTitle,
            unlockedAt: new Date().toISOString(),
          });
        }
      }
      localStorage.setItem(LS_CODEX_KEY, JSON.stringify(codex));
    }

    // Update local leaderboard
    this.upsertLocalLeaderboard(payload.nickname, updatedRun);

    if (payload.milestoneMessage) {
      this.emitLocalMilestone({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nickname: payload.nickname,
        message: payload.milestoneMessage,
        chapter: updatedRun.currentChapter,
        latencyMs: updatedRun.bestLatencyMs,
        timestamp: new Date().toISOString(),
      });
    }

    return { run: updatedRun, codexUnlocks: codex };
  }

  private upsertLocalLeaderboard(nickname: string, run: GameRunState): void {
    try {
      const raw = localStorage.getItem(LS_LEADERBOARD_KEY);
      const list: LeaderboardEntry[] = raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
      const idx = list.findIndex((item) => item.id === run.id || item.nickname === nickname);
      const entry: LeaderboardEntry = {
        rank: 1,
        id: run.id,
        nickname,
        currentChapter: run.currentChapter,
        completed: run.completed,
        bestLatencyMs: run.bestLatencyMs,
        bandwidthSavedPct: run.bandwidthSavedPct,
        securityScore: run.securityScore,
        totalTimeSeconds: run.totalTimeSeconds,
        updatedAt: run.updatedAt,
      };
      if (idx >= 0) {
        list[idx] = entry;
      } else {
        list.push(entry);
      }
      localStorage.setItem(LS_LEADERBOARD_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (this.mode === 'live' && API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          return data.leaderboard ?? [];
        }
      } catch {
        // fallback
      }
    }

    let localEntries: LeaderboardEntry[] = [];
    try {
      const raw = localStorage.getItem(LS_LEADERBOARD_KEY);
      if (raw) localEntries = JSON.parse(raw) as LeaderboardEntry[];
    } catch {
      // ignore
    }

    const combined = [...localEntries, ...SEEDED_CLASSMATES];
    combined.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? -1 : 1;
      if (a.currentChapter !== b.currentChapter) return b.currentChapter - a.currentChapter;
      if (a.bestLatencyMs !== b.bestLatencyMs) return a.bestLatencyMs - b.bestLatencyMs;
      return b.securityScore - a.securityScore;
    });

    return combined.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }

  public resetLocalProgress(): void {
    try {
      localStorage.removeItem(LS_RUN_KEY);
      localStorage.removeItem(LS_CODEX_KEY);
    } catch {
      // ignore
    }
  }
}

export const storageService = new StorageService();
