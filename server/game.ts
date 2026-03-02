import { Server, Socket } from "socket.io";
import { Room, PlayerState, PlayerAnswer } from "./types";
import { rooms, deleteRoom } from "./rooms";

const POINTS_CORRECT = 100;
const SPEED_BONUS_FAST = 50;
const SPEED_BONUS_MEDIUM = 25;
const STREAK_BONUS = 30;
const ROUND_DURATION_MS = 20_000;
const RECONNECT_GRACE_MS = 15_000;

function createPlayerState(id: string, socketId: string): PlayerState {
  return {
    id,
    socketId,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    totalTimeMs: 0,
    fastestRounds: 0,
    roundResults: [],
    connected: true,
  };
}

function calculatePoints(correct: boolean, timeMs: number, streak: number): { points: number; speedBonus: number; streakBonus: number } {
  if (!correct) return { points: 0, speedBonus: 0, streakBonus: 0 };

  let speedBonus = 0;
  if (timeMs < 5000) speedBonus = SPEED_BONUS_FAST;
  else if (timeMs < 10000) speedBonus = SPEED_BONUS_MEDIUM;

  const streakBonus = streak >= 3 ? STREAK_BONUS : 0;
  const points = POINTS_CORRECT + speedBonus + streakBonus;

  return { points, speedBonus, streakBonus };
}

export function startGame(room: Room, io: Server): void {
  room.status = "countdown";
  const roomName = `room:${room.code}`;

  // 3-2-1 countdown
  io.to(roomName).emit("game_start", 3);

  setTimeout(() => {
    room.status = "playing";
    room.currentRound = 0;
    startRound(room, io);
  }, 3000);
}

export function startRound(room: Room, io: Server): void {
  if (room.currentRound >= room.totalRounds) {
    endGame(room, io);
    return;
  }

  const fact = room.facts[room.currentRound];
  room.answers = new Map();
  room.regenerateVotes = new Set();
  room.roundDeadline = Date.now() + ROUND_DURATION_MS;

  const roomName = `room:${room.code}`;
  io.to(roomName).emit("new_fact", {
    statement: fact.statement,
    roundNum: room.currentRound + 1,
    totalRounds: room.totalRounds,
  });

  room.roundTimeout = setTimeout(() => {
    resolveRound(room, io);
  }, ROUND_DURATION_MS);
}

export function handleAnswer(room: Room, playerId: string, answer: boolean, clientTimestampMs: number, io: Server): void {
  if (room.status !== "playing") return;
  if (room.answers.has(playerId)) return; // already answered
  if (room.roundDeadline && Date.now() > room.roundDeadline) return; // too late

  room.answers.set(playerId, { answer, clientTimestampMs });

  // Notify opponent
  const roomName = `room:${room.code}`;
  for (const [pid, ps] of room.players) {
    if (pid !== playerId && ps.connected) {
      io.to(ps.socketId).emit("opponent_answered");
    }
  }

  // Check if both answered
  const activePlayers = Array.from(room.players.keys());
  if (activePlayers.every((pid) => room.answers.has(pid))) {
    if (room.roundTimeout) clearTimeout(room.roundTimeout);
    resolveRound(room, io);
  }
}

export function handleRegenerateVote(room: Room, playerId: string, io: Server): void {
  if (room.status !== "playing") return;
  if (room.backupFacts.length === 0) return;

  room.regenerateVotes.add(playerId);

  // Notify opponent
  for (const [pid, ps] of room.players) {
    if (pid !== playerId && ps.connected) {
      io.to(ps.socketId).emit("opponent_voted_regenerate");
    }
  }

  // Check if both voted
  const activePlayers = Array.from(room.players.keys());
  if (activePlayers.every((pid) => room.regenerateVotes.has(pid))) {
    // Swap fact
    const newFact = room.backupFacts.shift()!;
    room.facts[room.currentRound] = newFact;
    room.answers = new Map();
    room.regenerateVotes = new Set();

    // Reset timer
    if (room.roundTimeout) clearTimeout(room.roundTimeout);
    room.roundDeadline = Date.now() + ROUND_DURATION_MS;
    room.roundTimeout = setTimeout(() => resolveRound(room, io), ROUND_DURATION_MS);

    const roomName = `room:${room.code}`;
    io.to(roomName).emit("fact_regenerated", { statement: newFact.statement });
  }
}

function resolveRound(room: Room, io: Server): void {
  const fact = room.facts[room.currentRound];
  const roomName = `room:${room.code}`;
  const playerIds = Array.from(room.players.keys());

  const result: Record<string, any> = {
    fact,
    roundNum: room.currentRound + 1,
    correctAnswer: fact.answer,
    players: {} as Record<string, any>,
    scores: {} as Record<string, number>,
  };

  // Track times for fastest calculation
  const times: { id: string; timeMs: number | null }[] = [];

  for (const pid of playerIds) {
    const playerState = room.players.get(pid)!;
    const playerAnswer = room.answers.get(pid);

    const answered = !!playerAnswer;
    const correct = answered && playerAnswer!.answer === fact.answer;
    const timeMs = answered ? playerAnswer!.clientTimestampMs : null;

    if (correct) {
      playerState.streak++;
      if (playerState.streak > playerState.bestStreak) {
        playerState.bestStreak = playerState.streak;
      }
      playerState.correctCount++;
    } else {
      playerState.streak = 0;
    }

    const { points, speedBonus, streakBonus } = correct && timeMs !== null
      ? calculatePoints(true, timeMs, playerState.streak)
      : { points: 0, speedBonus: 0, streakBonus: 0 };

    playerState.score += points;
    if (timeMs !== null) playerState.totalTimeMs += timeMs;

    playerState.roundResults.push({
      correct,
      timeMs,
      answer: answered ? playerAnswer!.answer : null,
      points,
    });

    times.push({ id: pid, timeMs: correct ? timeMs : null });

    result.players[pid] = {
      answer: answered ? playerAnswer!.answer : null,
      timeMs,
      points,
      speedBonus,
      streakBonus,
      correct,
    };
    result.scores[pid] = playerState.score;
  }

  // Determine who was fastest (only among correct answers)
  const correctTimes = times.filter((t) => t.timeMs !== null);
  if (correctTimes.length > 0) {
    correctTimes.sort((a, b) => a.timeMs! - b.timeMs!);
    const fastest = correctTimes[0];
    room.players.get(fastest.id)!.fastestRounds++;
  }

  io.to(roomName).emit("round_result", result);

  room.currentRound++;

  // Next round after result display
  setTimeout(() => {
    if (room.status === "playing") {
      startRound(room, io);
    }
  }, 3000);
}

function endGame(room: Room, io: Server): void {
  room.status = "finished";
  const roomName = `room:${room.code}`;
  const playerIds = Array.from(room.players.keys());

  // Determine winner
  let winner: string | null = null;
  if (playerIds.length === 2) {
    const p1 = room.players.get(playerIds[0])!;
    const p2 = room.players.get(playerIds[1])!;
    if (p1.score > p2.score) winner = playerIds[0];
    else if (p2.score > p1.score) winner = playerIds[1];
    // null = tie
  }

  const report: Record<string, any> = {
    winner,
    topic: room.topic,
    subtopic: room.subtopic,
    players: {} as Record<string, any>,
  };

  for (const pid of playerIds) {
    const ps = room.players.get(pid)!;
    const answeredRounds = ps.roundResults.filter((r) => r.timeMs !== null).length;
    report.players[pid] = {
      score: ps.score,
      correctCount: ps.correctCount,
      avgTimeMs: answeredRounds > 0 ? Math.round(ps.totalTimeMs / answeredRounds) : 0,
      bestStreak: ps.bestStreak,
      fastestRounds: ps.fastestRounds,
      roundResults: ps.roundResults,
    };
  }

  io.to(roomName).emit("game_over", report);

  // Schedule cleanup
  setTimeout(() => deleteRoom(room.code), 5 * 60 * 1000);
}

export function handleDisconnect(room: Room, playerId: string, io: Server): void {
  const player = room.players.get(playerId);
  if (!player) return;

  player.connected = false;

  if (room.status === "waiting") {
    room.players.delete(playerId);
    return;
  }

  // Notify opponent
  for (const [pid, ps] of room.players) {
    if (pid !== playerId && ps.connected) {
      io.to(ps.socketId).emit("player_disconnected");
    }
  }

  // Grace period for reconnection
  const timeout = setTimeout(() => {
    // Opponent wins by forfeit
    for (const [pid, ps] of room.players) {
      if (pid !== playerId && ps.connected) {
        room.status = "finished";
        endGame(room, io);
        return;
      }
    }
    // Both disconnected — just clean up
    deleteRoom(room.code);
  }, RECONNECT_GRACE_MS);

  room.disconnectTimeout.set(playerId, timeout);
}

export function handleReconnect(room: Room, playerId: string, newSocketId: string, io: Server): void {
  const player = room.players.get(playerId);
  if (!player) return;

  player.connected = true;
  player.socketId = newSocketId;

  // Clear disconnect timeout
  const timeout = room.disconnectTimeout.get(playerId);
  if (timeout) {
    clearTimeout(timeout);
    room.disconnectTimeout.delete(playerId);
  }

  // Notify opponent
  for (const [pid, ps] of room.players) {
    if (pid !== playerId && ps.connected) {
      io.to(ps.socketId).emit("player_reconnected");
    }
  }
}

export function handleRematch(room: Room, playerId: string, io: Server): void {
  room.rematchVotes.add(playerId);

  // Notify opponent
  for (const [pid, ps] of room.players) {
    if (pid !== playerId && ps.connected) {
      io.to(ps.socketId).emit("rematch_requested");
    }
  }

  // Both want rematch
  if (room.rematchVotes.size >= 2) {
    // Reset game state
    room.status = "waiting";
    room.currentRound = 0;
    room.answers = new Map();
    room.regenerateVotes = new Set();
    room.rematchVotes = new Set();

    for (const ps of room.players.values()) {
      ps.score = 0;
      ps.streak = 0;
      ps.bestStreak = 0;
      ps.correctCount = 0;
      ps.totalTimeMs = 0;
      ps.fastestRounds = 0;
      ps.roundResults = [];
    }

    const roomName = `room:${room.code}`;
    io.to(roomName).emit("rematch_start", { topic: room.topic, subtopic: room.subtopic });
  }
}
