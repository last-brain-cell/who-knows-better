import { Room } from "./types";

const CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

export const rooms = new Map<string, Room>();

export function generateRoomCode(): string {
  let code: string;
  do {
    code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(code: string, topic: string, subtopic: string, hostId: string): Room {
  const room: Room = {
    code,
    status: "waiting",
    topic,
    subtopic,
    hostId,
    players: new Map(),
    facts: [],
    backupFacts: [],
    currentRound: 0,
    totalRounds: 10,
    answers: new Map(),
    regenerateVotes: new Set(),
    roundDeadline: null,
    roundTimeout: null,
    createdAt: Date.now(),
    disconnectTimeout: new Map(),
    rematchVotes: new Set(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (room) {
    if (room.roundTimeout) clearTimeout(room.roundTimeout);
    for (const timeout of room.disconnectTimeout.values()) {
      clearTimeout(timeout);
    }
    rooms.delete(code);
  }
}

// Cleanup expired rooms
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    const expiryMs = room.status === "finished" ? 5 * 60 * 1000 : 10 * 60 * 1000;
    if (now - room.createdAt > expiryMs) {
      console.log(`Cleaning up expired room: ${code}`);
      deleteRoom(code);
    }
  }
}, 60_000);
