import { useCallback, useEffect, useRef, useState } from 'react';
import { GameWorld25D, ThreatCube } from './components/GameWorld25D';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { CodexModal } from './components/CodexModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { VictoryModal } from './components/VictoryModal';
import { EdgeBlocksMinigameModal } from './components/EdgeBlocksMinigameModal';
import { Chapter1MuralModal } from './components/puzzles/Chapter1MuralModal';
import { Chapter2TimelineModal } from './components/puzzles/Chapter2TimelineModal';
import { Chapter3CalibrationModal } from './components/puzzles/Chapter3CalibrationModal';
import { Chapter4ArchitectureModal } from './components/puzzles/Chapter4ArchitectureModal';
import { Chapter5HardwareModal } from './components/puzzles/Chapter5HardwareModal';
import { Chapter6CompressionModal } from './components/puzzles/Chapter6CompressionModal';
import { ClimaxDefenseOverlay } from './components/puzzles/ClimaxDefenseOverlay';
import { audioEngine } from './services/AudioEngine';
import { storageService } from './services/StorageService';
import {
  CodexUnlockRecord,
  GameRunState,
  MilestoneEvent,
  PlayerSession,
  StationConfig,
  StationId,
} from './types/game';

const INITIAL_THREATS: ThreatCube[] = [
  { id: 't1', position: [48.5, 3.1, -3.8], label: 'Spoofed Sensor' },
  { id: 't2', position: [52.0, 3.4, 3.6], label: 'Firmware Tamper' },
  { id: 't3', position: [54.2, 3.0, -1.5], label: 'MITM Replay' },
  { id: 't4', position: [49.8, 3.5, 1.8], label: 'Raw Data Leak' },
  { id: 't5', position: [53.2, 3.8, -3.2], label: 'Rogue OTA Push' },
  { id: 't6', position: [51.0, 3.9, 0.2], label: 'DDoS Flood Packet' },
];

export function App() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'live' | 'local'>('local');
  const [player, setPlayer] = useState<PlayerSession | null>(null);
  const [run, setRun] = useState<GameRunState | null>(null);
  const [codexUnlocks, setCodexUnlocks] = useState<CodexUnlockRecord[]>([]);
  const [latestMilestone, setLatestMilestone] = useState<MilestoneEvent | null>(null);

  const [solvedStations, setSolvedStations] = useState<StationId[]>([]);
  const [activePuzzle, setActivePuzzle] = useState<StationId | null>(null);
  const [nearStation, setNearStation] = useState<StationConfig | null>(null);

  const [climaxActive, setClimaxActive] = useState(false);
  const [threats, setThreats] = useState<ThreatCube[]>(INITIAL_THREATS);
  const [interceptedCount, setInterceptedCount] = useState(0);
  const [damRaised, setDamRaised] = useState(false);

  const [showCodex, setShowCodex] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showMinigame, setShowMinigame] = useState(false);
  const [muted, setMuted] = useState(false);
  const [interactSignal, setInteractSignal] = useState(0);

  const joystickVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const elapsedSecondsRef = useRef<number>(0);

  // Subscribe to live milestones
  useEffect(() => {
    const unsub = storageService.onMilestone((event) => {
      setLatestMilestone(event);
    });
    return unsub;
  }, []);

  // Mission timer
  useEffect(() => {
    if (!started || run?.completed) return;
    const timer = setInterval(() => {
      elapsedSecondsRef.current += 1;
    }, 1000);
    return () => clearInterval(timer);
  }, [started, run?.completed]);

  const handleStart = async (nickname: string) => {
    setLoading(true);
    audioEngine.startAmbientDrone();
    audioEngine.playHologramChime();

    const result = await storageService.startSession(nickname);
    setMode(result.mode);
    setPlayer(result.player);
    setRun(result.run);
    setCodexUnlocks(result.codexUnlocks);
    if (result.recentMilestones.length > 0) {
      setLatestMilestone(result.recentMilestones[0]);
    }
    elapsedSecondsRef.current = result.run.totalTimeSeconds || 0;

    // Restore solved stations based on saved chapter progress
    const order: StationId[] = [
      'ch1-mural',
      'ch2-altar',
      'ch3-calibration',
      'ch4-architecture',
      'ch5-hardware',
      'ch6-compression',
      'ch7-climax',
    ];
    const ch = result.run.currentChapter;
    const restored: StationId[] = [];
    if (ch >= 2) restored.push(order[0]);
    if (ch >= 3) restored.push(order[1]);
    if (ch >= 4) restored.push(order[2]);
    if (ch >= 5) restored.push(order[3]);
    if (ch >= 6) restored.push(order[4]);
    if (ch >= 7) restored.push(order[5]);
    if (result.run.completed) {
      restored.push(order[6]);
      setDamRaised(true);
    }
    setSolvedStations(restored);
    setStarted(true);
    setLoading(false);
  };

  const saveProgress = useCallback(
    async (
      nextChapter: number,
      codexEntries: { chapterNumber: number; conceptTitle: string }[],
      extra?: {
        completed?: boolean;
        bestLatencyMs?: number;
        bandwidthSavedPct?: number;
        securityScore?: number;
        milestoneMessage?: string;
      }
    ) => {
      if (!player || !run) return;
      const res = await storageService.saveCheckpoint({
        playerId: player.id,
        runId: run.id,
        nickname: player.nickname,
        currentChapter: nextChapter,
        totalTimeSeconds: elapsedSecondsRef.current,
        codexEntries,
        ...extra,
      });
      setRun(res.run);
      setCodexUnlocks(res.codexUnlocks);
    },
    [player, run]
  );

  const handleSelectStation = useCallback(
    (stationId: StationId) => {
      audioEngine.playInteract();
      if (stationId === 'ch7-climax') {
        if (!solvedStations.includes('ch7-climax')) {
          audioEngine.startStormRush();
          setClimaxActive(true);
        } else {
          setShowVictory(true);
        }
        return;
      }
      setActivePuzzle(stationId);
    },
    [solvedStations]
  );

  const markSolved = (stationId: StationId) => {
    setSolvedStations((prev) => (prev.includes(stationId) ? prev : [...prev, stationId]));
    setActivePuzzle(null);
  };

  const handleInterceptThreat = useCallback(
    (id: string) => {
      audioEngine.playShieldBlock();
      setThreats((prev) => prev.filter((t) => t.id !== id));
      setInterceptedCount((c) => c + 1);
    },
    []
  );

  const handleTriggerReflexLoop = async (finalLatencyMs: number) => {
    audioEngine.stopStormRush();
    setClimaxActive(false);
    setDamRaised(true);
    markSolved('ch7-climax');

    await saveProgress(
      12,
      [
        { chapterNumber: 7, conceptTitle: 'Two-Way Computing Stream' },
        { chapterNumber: 8, conceptTitle: 'CpE Applications & Career Pathways' },
        { chapterNumber: 10, conceptTitle: 'Security, Ethics & RA 10173' },
        { chapterNumber: 11, conceptTitle: 'Philippine Edge Infrastructure & Galaxy S25' },
        { chapterNumber: 12, conceptTitle: 'Future Trends: TinyML, 5G MEC & Physical AI' },
      ],
      {
        completed: true,
        bestLatencyMs: finalLatencyMs,
        bandwidthSavedPct: Math.max(run?.bandwidthSavedPct ?? 90, 92),
        securityScore: (run?.securityScore ?? 500) + 450,
        milestoneMessage: `${player?.nickname ?? 'John'} achieved ${finalLatencyMs.toFixed(
          1
        )}ms latency and became The Man of Edge!`,
      }
    );
    setShowVictory(true);
  };

  if (!started || !player || !run) {
    return <TitleScreen onStart={handleStart} loading={loading} />;
  }

  return (
    <div className="w-screen h-screen bg-slate-950 relative overflow-hidden select-none">
      <GameWorld25D
        solvedStations={solvedStations}
        activePuzzle={activePuzzle}
        climaxActive={climaxActive}
        threats={threats}
        onInterceptThreat={handleInterceptThreat}
        onSelectStation={handleSelectStation}
        onNearStationChange={setNearStation}
        joystickVectorRef={joystickVectorRef}
        interactSignal={interactSignal}
        damRaised={damRaised}
        hideLabels={Boolean(activePuzzle) || showCodex || showLeaderboard || showVictory || showMinigame}
      />

      <HUD
        nickname={player.nickname}
        run={run}
        mode={mode}
        muted={muted}
        onToggleMute={() => setMuted(audioEngine.toggleMute())}
        onOpenCodex={() => setShowCodex(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenMinigame={() => setShowMinigame(true)}
        nearStation={nearStation}
        onInteract={() => setInteractSignal((s) => s + 1)}
        latestMilestone={latestMilestone}
        joystickVectorRef={joystickVectorRef}
        hideControls={Boolean(activePuzzle) || climaxActive || showCodex || showLeaderboard || showVictory || showMinigame}
      />

      {/* Chapter Puzzles */}
      {activePuzzle === 'ch1-mural' && (
        <Chapter1MuralModal
          onClose={() => setActivePuzzle(null)}
          onSolve={async () => {
            markSolved('ch1-mural');
            await saveProgress(2, [{ chapterNumber: 1, conceptTitle: 'Edge Computing & Edge AI' }], {
              milestoneMessage: `${player.nickname} deciphered the Chapter 1 Murals!`,
            });
          }}
        />
      )}

      {activePuzzle === 'ch2-altar' && (
        <Chapter2TimelineModal
          onClose={() => setActivePuzzle(null)}
          onSolve={async () => {
            markSolved('ch2-altar');
            await saveProgress(3, [{ chapterNumber: 2, conceptTitle: 'Evolution of Computing Eras' }], {
              milestoneMessage: `${player.nickname} awakened the Chapter 2 Hologram Altar!`,
            });
          }}
        />
      )}

      {activePuzzle === 'ch3-calibration' && (
        <Chapter3CalibrationModal
          onClose={() => setActivePuzzle(null)}
          onSolve={async (latencyMs, bwSaved) => {
            markSolved('ch3-calibration');
            await saveProgress(4, [{ chapterNumber: 3, conceptTitle: 'Deterministic Latency & Data Locality' }], {
              bestLatencyMs: latencyMs,
              bandwidthSavedPct: bwSaved,
              securityScore: 250,
              milestoneMessage: `${player.nickname} ignited the 3D Laser Bridge (${latencyMs.toFixed(1)}ms)!`,
            });
          }}
        />
      )}

      {activePuzzle === 'ch4-architecture' && (
        <Chapter4ArchitectureModal
          onClose={() => setActivePuzzle(null)}
          onSolve={async () => {
            markSolved('ch4-architecture');
            await saveProgress(5, [{ chapterNumber: 4, conceptTitle: 'Three-Layer Architecture & 4-Step Plan' }]);
          }}
        />
      )}

      {activePuzzle === 'ch5-hardware' && (
        <Chapter5HardwareModal
          onClose={() => setActivePuzzle(null)}
          onSolve={async () => {
            markSolved('ch5-hardware');
            await saveProgress(6, [{ chapterNumber: 5, conceptTitle: 'Edge Hardware Ecosystem' }]);
          }}
        />
      )}

      {activePuzzle === 'ch6-compression' && (
        <Chapter6CompressionModal
          onClose={() => setActivePuzzle(null)}
          onSolve={async (latencyMs) => {
            markSolved('ch6-compression');
            await saveProgress(
              7,
              [
                { chapterNumber: 6, conceptTitle: 'TinyML & Deep Compression' },
                { chapterNumber: 9, conceptTitle: 'Advantages & Limitations' },
              ],
              {
                bestLatencyMs: Math.min(run.bestLatencyMs, latencyMs),
                securityScore: Math.max(run.securityScore, 500),
                milestoneMessage: `${player.nickname} mastered Deep Compression & stabilized the MCU!`,
              }
            );
          }}
        />
      )}

      {climaxActive && (
        <ClimaxDefenseOverlay
          threats={threats}
          interceptedCount={interceptedCount}
          requiredIntercepts={INITIAL_THREATS.length}
          onInterceptThreat={handleInterceptThreat}
          onTriggerReflexLoop={handleTriggerReflexLoop}
        />
      )}

      {showCodex && (
        <CodexModal
          unlockedRecords={codexUnlocks}
          currentChapter={run.currentChapter}
          completed={run.completed}
          onClose={() => setShowCodex(false)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          currentNickname={player.nickname}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {showVictory && (
        <VictoryModal
          nickname={player.nickname}
          run={run}
          onOpenMinigame={() => {
            setShowVictory(false);
            setShowMinigame(true);
          }}
          onOpenCodex={() => {
            setShowVictory(false);
            setShowCodex(true);
          }}
          onOpenLeaderboard={() => {
            setShowVictory(false);
            setShowLeaderboard(true);
          }}
          onContinueExplore={() => setShowVictory(false)}
        />
      )}

      {showMinigame && (
        <EdgeBlocksMinigameModal
          nickname={player.nickname}
          onClose={() => setShowMinigame(false)}
        />
      )}
    </div>
  );
}

export default App;
