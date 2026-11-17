import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

interface MilestoneEvent {
  id: string;
  nickname: string;
  message: string;
  chapter: number;
  latencyMs: number;
  timestamp: string;
}

const recentMilestones: MilestoneEvent[] = [];

function pushMilestone(event: MilestoneEvent) {
  recentMilestones.unshift(event);
  if (recentMilestones.length > 25) {
    recentMilestones.pop();
  }
  io.emit('milestone', event);
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'edge-of-survival-server', timestamp: new Date().toISOString() });
});

app.post('/api/session/start', async (req: Request, res: Response) => {
  try {
    const rawNickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : '';
    const nickname = rawNickname.slice(0, 24) || 'John';

    let player = await prisma.player.findUnique({
      where: { nickname },
      include: {
        runs: { orderBy: { updatedAt: 'desc' }, take: 1 },
        codexUnlocks: true,
      },
    });

    if (!player) {
      player = await prisma.player.create({
        data: {
          nickname,
          runs: {
            create: {
              currentChapter: 1,
              completed: false,
              bestLatencyMs: 999.0,
              bandwidthSavedPct: 0.0,
              securityScore: 0,
              totalTimeSeconds: 0,
            },
          },
        },
        include: {
          runs: { orderBy: { updatedAt: 'desc' }, take: 1 },
          codexUnlocks: true,
        },
      });

      pushMilestone({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nickname: player.nickname,
        message: `${player.nickname} entered the severed bunker to uncover The Edge.`,
        chapter: 1,
        latencyMs: 999,
        timestamp: new Date().toISOString(),
      });
    }

    let activeRun = player.runs[0];
    if (!activeRun) {
      activeRun = await prisma.gameRun.create({
        data: {
          playerId: player.id,
          currentChapter: 1,
        },
      });
    }

    res.json({
      player: {
        id: player.id,
        nickname: player.nickname,
        createdAt: player.createdAt,
      },
      run: activeRun,
      codexUnlocks: player.codexUnlocks,
      recentMilestones,
    });
  } catch (error) {
    console.error('Error in /api/session/start:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

app.post('/api/progress/checkpoint', async (req: Request, res: Response) => {
  try {
    const {
      playerId,
      runId,
      currentChapter,
      completed,
      bestLatencyMs,
      bandwidthSavedPct,
      securityScore,
      totalTimeSeconds,
      codexEntries,
      milestoneMessage,
    } = req.body ?? {};

    if (!playerId || !runId) {
      res.status(400).json({ error: 'playerId and runId are required' });
      return;
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const existingRun = await prisma.gameRun.findUnique({ where: { id: runId } });
    if (!existingRun) {
      res.status(404).json({ error: 'GameRun not found' });
      return;
    }

    const nextLatency =
      typeof bestLatencyMs === 'number'
        ? Math.min(existingRun.bestLatencyMs, Math.max(0.5, bestLatencyMs))
        : existingRun.bestLatencyMs;

    const nextBandwidth =
      typeof bandwidthSavedPct === 'number'
        ? Math.max(existingRun.bandwidthSavedPct, Math.min(100, bandwidthSavedPct))
        : existingRun.bandwidthSavedPct;

    const nextSecurity =
      typeof securityScore === 'number'
        ? Math.max(existingRun.securityScore, securityScore)
        : existingRun.securityScore;

    const updatedRun = await prisma.gameRun.update({
      where: { id: runId },
      data: {
        currentChapter:
          typeof currentChapter === 'number'
            ? Math.max(existingRun.currentChapter, Math.min(12, currentChapter))
            : existingRun.currentChapter,
        completed: Boolean(completed) || existingRun.completed,
        bestLatencyMs: nextLatency,
        bandwidthSavedPct: nextBandwidth,
        securityScore: nextSecurity,
        totalTimeSeconds:
          typeof totalTimeSeconds === 'number'
            ? Math.max(existingRun.totalTimeSeconds, totalTimeSeconds)
            : existingRun.totalTimeSeconds,
      },
    });

    if (Array.isArray(codexEntries)) {
      for (const entry of codexEntries) {
        if (typeof entry?.chapterNumber === 'number' && typeof entry?.conceptTitle === 'string') {
          await prisma.codexUnlock.upsert({
            where: {
              playerId_chapterNumber_conceptTitle: {
                playerId,
                chapterNumber: entry.chapterNumber,
                conceptTitle: entry.conceptTitle,
              },
            },
            create: {
              playerId,
              chapterNumber: entry.chapterNumber,
              conceptTitle: entry.conceptTitle,
            },
            update: {},
          });
        }
      }
    }

    const codexUnlocks = await prisma.codexUnlock.findMany({
      where: { playerId },
      orderBy: { chapterNumber: 'asc' },
    });

    if (typeof milestoneMessage === 'string' && milestoneMessage.trim().length > 0) {
      pushMilestone({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nickname: player.nickname,
        message: milestoneMessage.trim(),
        chapter: updatedRun.currentChapter,
        latencyMs: updatedRun.bestLatencyMs,
        timestamp: new Date().toISOString(),
      });
    } else if (updatedRun.completed && !existingRun.completed) {
      pushMilestone({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nickname: player.nickname,
        message: `${player.nickname} achieved ${updatedRun.bestLatencyMs.toFixed(1)}ms latency and became The Man of Edge!`,
        chapter: 12,
        latencyMs: updatedRun.bestLatencyMs,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ run: updatedRun, codexUnlocks });
  } catch (error) {
    console.error('Error in /api/progress/checkpoint:', error);
    res.status(500).json({ error: 'Failed to save checkpoint' });
  }
});

app.get('/api/leaderboard', async (_req: Request, res: Response) => {
  try {
    const runs = await prisma.gameRun.findMany({
      include: {
        player: {
          select: {
            nickname: true,
          },
        },
      },
      orderBy: [
        { completed: 'desc' },
        { currentChapter: 'desc' },
        { bestLatencyMs: 'asc' },
        { securityScore: 'desc' },
        { totalTimeSeconds: 'asc' },
      ],
      take: 30,
    });

    const leaderboard = runs.map((run, index) => ({
      rank: index + 1,
      id: run.id,
      nickname: run.player.nickname,
      currentChapter: run.currentChapter,
      completed: run.completed,
      bestLatencyMs: run.bestLatencyMs,
      bandwidthSavedPct: run.bandwidthSavedPct,
      securityScore: run.securityScore,
      totalTimeSeconds: run.totalTimeSeconds,
      updatedAt: run.updatedAt,
    }));

    res.json({ leaderboard, recentMilestones });
  } catch (error) {
    console.error('Error in /api/leaderboard:', error);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

io.on('connection', (socket) => {
  socket.emit('milestones:init', recentMilestones);
});

server.listen(PORT, () => {
  console.log(`Edge of Survival server listening on http://localhost:${PORT}`);
});
