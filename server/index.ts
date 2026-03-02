import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { generateRoomCode, createRoom, getRoom, rooms } from "./rooms";
import { generateFacts, sortFactsByDifficulty } from "./facts";
import { startGame, handleAnswer, handleRegenerateVote, handleDisconnect, handleReconnect, handleRematch } from "./game";
import { PlayerState } from "./types";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Track socket → room/player mapping
const socketToPlayer = new Map<string, { code: string; playerId: string }>();

// ─── REST API ───

app.post("/api/rooms", async (req, res) => {
  const { topic, subtopic } = req.body;

  if (!topic) {
    res.status(400).json({ error: "Topic is required" });
    return;
  }

  const code = generateRoomCode();
  const room = createRoom(code, topic, subtopic || "", "");

  // Respond immediately, generate facts in background
  res.json({ code, topic, subtopic: subtopic || "" });

  generateFacts(topic, subtopic || "")
    .then((allFacts) => {
      const { gameplay, backup } = sortFactsByDifficulty(allFacts);
      room.facts = gameplay;
      room.backupFacts = backup;
      room.factsReady = true;
      console.log(`Facts ready for room ${code}`);

      // If 2 players are already waiting, start the game now
      if (room.status === "waiting" && room.players.size === 2) {
        startGame(room, io);
      }
    })
    .catch((error) => {
      console.error(`Failed to generate facts for room ${code}:`, error);
      // Notify players in the room that fact generation failed
      io.to(`room:${code}`).emit("room_error", "Failed to generate facts. Please create a new room.");
    });
});

app.get("/api/rooms/:code", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json({
    code: room.code,
    topic: room.topic,
    subtopic: room.subtopic,
    status: room.status,
    playerCount: room.players.size,
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", rooms: rooms.size });
});

// ─── WebSocket ───

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join_room", (code: string) => {
    const room = getRoom(code);
    if (!room) {
      socket.emit("room_error", "Room not found");
      return;
    }

    if (room.status === "finished") {
      socket.emit("room_error", "Game has already ended");
      return;
    }

    // Check for reconnection
    for (const [pid, ps] of room.players) {
      if (!ps.connected) {
        // Reconnecting player
        handleReconnect(room, pid, socket.id, io);
        socketToPlayer.set(socket.id, { code: room.code, playerId: pid });
        socket.join(`room:${room.code}`);
        socket.emit("room_joined", {
          code: room.code,
          topic: room.topic,
          subtopic: room.subtopic,
          playerNumber: pid === room.hostId ? 1 : 2,
          opponentConnected: true,
          playerId: pid,
        });
        return;
      }
    }

    if (room.players.size >= 2) {
      socket.emit("room_error", "Room is full");
      return;
    }

    // Create player
    const playerId = socket.id;
    const playerState: PlayerState = {
      id: playerId,
      socketId: socket.id,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctCount: 0,
      totalTimeMs: 0,
      fastestRounds: 0,
      roundResults: [],
      connected: true,
    };

    room.players.set(playerId, playerState);
    socketToPlayer.set(socket.id, { code: room.code, playerId });

    if (room.players.size === 1) {
      room.hostId = playerId;
    }

    socket.join(`room:${room.code}`);

    const playerNumber = playerId === room.hostId ? 1 : 2;
    socket.emit("room_joined", {
      code: room.code,
      topic: room.topic,
      subtopic: room.subtopic,
      playerNumber,
      opponentConnected: room.players.size === 2,
      playerId,
    });

    // Notify opponent if second player joins
    if (room.players.size === 2) {
      for (const [pid, ps] of room.players) {
        if (pid !== playerId) {
          io.to(ps.socketId).emit("opponent_joined");
        }
      }

      if (room.factsReady) {
        // Facts already generated, start game after short delay
        setTimeout(() => {
          if (room.status === "waiting" && room.players.size === 2) {
            startGame(room, io);
          }
        }, 1500);
      } else {
        // Facts still loading, notify both players
        io.to(`room:${room.code}`).emit("facts_loading");
      }
    }
  });

  socket.on("select_answer", (answer: boolean, clientTimestampMs: number) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;

    const room = getRoom(mapping.code);
    if (!room) return;

    handleAnswer(room, mapping.playerId, answer, clientTimestampMs, io);
  });

  socket.on("vote_regenerate", () => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;

    const room = getRoom(mapping.code);
    if (!room) return;

    handleRegenerateVote(room, mapping.playerId, io);
  });

  socket.on("request_rematch", () => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;

    const room = getRoom(mapping.code);
    if (!room) return;

    handleRematch(room, mapping.playerId, io);
  });

  socket.on("ping_server", () => {
    socket.emit("pong_server", Date.now());
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;

    const room = getRoom(mapping.code);
    if (room) {
      handleDisconnect(room, mapping.playerId, io);
    }

    socketToPlayer.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
