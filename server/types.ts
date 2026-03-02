export interface Fact {
  statement: string;
  answer: boolean;
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
}

export interface PlayerAnswer {
  answer: boolean;
  clientTimestampMs: number;
}

export interface PlayerState {
  id: string;
  socketId: string;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  totalTimeMs: number;
  fastestRounds: number;
  roundResults: {
    correct: boolean;
    timeMs: number | null;
    answer: boolean | null;
    points: number;
  }[];
  connected: boolean;
}

export interface Room {
  code: string;
  status: "waiting" | "countdown" | "playing" | "finished";
  topic: string;
  subtopic: string;
  hostId: string;
  players: Map<string, PlayerState>;
  facts: Fact[];
  backupFacts: Fact[];
  factsReady: boolean;
  currentRound: number;
  totalRounds: number;
  answers: Map<string, PlayerAnswer>;
  regenerateVotes: Set<string>;
  roundDeadline: number | null;
  roundTimeout: ReturnType<typeof setTimeout> | null;
  createdAt: number;
  disconnectTimeout: Map<string, ReturnType<typeof setTimeout>>;
  rematchVotes: Set<string>;
}
