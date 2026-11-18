export type ActId = 1 | 2 | 3;

export type StationId =
  | 'ch1-mural'
  | 'ch2-altar'
  | 'ch3-calibration'
  | 'ch4-architecture'
  | 'ch5-hardware'
  | 'ch6-compression'
  | 'ch7-climax';

export interface StationConfig {
  id: StationId;
  chapterNumber: number;
  act: ActId;
  title: string;
  subtitle: string;
  position: [number, number, number];
  accentColor: string;
  requiredSolvedBefore?: StationId;
}

export interface PlayerSession {
  id: string;
  nickname: string;
  createdAt: string;
}

export interface GameRunState {
  id: string;
  playerId: string;
  currentChapter: number;
  completed: boolean;
  bestLatencyMs: number;
  bandwidthSavedPct: number;
  securityScore: number;
  totalTimeSeconds: number;
  updatedAt: string;
}

export interface CodexUnlockRecord {
  id?: string;
  chapterNumber: number;
  conceptTitle: string;
  unlockedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  currentChapter: number;
  completed: boolean;
  bestLatencyMs: number;
  bandwidthSavedPct: number;
  securityScore: number;
  totalTimeSeconds: number;
  updatedAt: string;
}

export interface MilestoneEvent {
  id: string;
  nickname: string;
  message: string;
  chapter: number;
  latencyMs: number;
  timestamp: string;
}

export interface CodexEntryData {
  chapterNumber: number;
  title: string;
  narrativeQuote: string;
  narrativeBeat: string;
  keyPoints: {
    heading: string;
    details: string[];
  }[];
  citation?: string;
}

export interface MinigameLeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  score: number;
  linesCleared: number;
  maxCombo: number;
  createdAt: string;
}
