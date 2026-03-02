// ─── Shared Types (used by both client and server) ───

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

export interface RoundResult {
  fact: Fact;
  roundNum: number;
  correctAnswer: boolean;
  players: {
    [playerId: string]: {
      answer: boolean | null;
      timeMs: number | null;
      points: number;
      speedBonus: number;
      streakBonus: number;
      correct: boolean;
    };
  };
  scores: { [playerId: string]: number };
}

export interface PlayerState {
  id: string;
  score: number;
  streak: number;
  correctCount: number;
  totalTimeMs: number;
  roundResults: {
    correct: boolean;
    timeMs: number | null;
    answer: boolean | null;
  }[];
}

export interface GameState {
  code: string;
  status: "waiting" | "playing" | "finished";
  topic: string;
  subtopic: string;
  players: string[];
  playerStates: { [playerId: string]: PlayerState };
  facts: Fact[];
  backupFacts: Fact[];
  currentRound: number;
  totalRounds: number;
  answers: { [playerId: string]: PlayerAnswer };
  regenerateVotes: Set<string>;
  roundDeadline: number | null;
  roundTimeout: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

export interface FinalReport {
  winner: string | null; // null = tie
  players: {
    [playerId: string]: {
      score: number;
      correctCount: number;
      avgTimeMs: number;
      bestStreak: number;
      fastestRounds: number;
      roundResults: {
        correct: boolean;
        timeMs: number | null;
        answer: boolean | null;
        points: number;
      }[];
    };
  };
  topic: string;
  subtopic: string;
}

// ─── Socket Events ───

export interface ClientToServerEvents {
  join_room: (code: string) => void;
  select_answer: (answer: boolean, clientTimestampMs: number) => void;
  vote_regenerate: () => void;
  request_rematch: () => void;
  ping_server: () => void;
}

export interface ServerToClientEvents {
  room_joined: (data: {
    code: string;
    topic: string;
    subtopic: string;
    playerNumber: number;
    opponentConnected: boolean;
  }) => void;
  opponent_joined: () => void;
  game_start: (countdown: number) => void;
  new_fact: (data: { statement: string; roundNum: number; totalRounds: number }) => void;
  opponent_answered: () => void;
  opponent_voted_regenerate: () => void;
  fact_regenerated: (data: { statement: string }) => void;
  round_result: (result: RoundResult) => void;
  game_over: (report: FinalReport) => void;
  player_disconnected: () => void;
  player_reconnected: () => void;
  room_expired: () => void;
  room_error: (message: string) => void;
  pong_server: (serverTimestamp: number) => void;
  rematch_requested: () => void;
  rematch_start: (data: { topic: string; subtopic: string }) => void;
}

// ─── Topic Types ───

export interface TopicGenre {
  id: string;
  name: string;
  emoji: string;
  subtopics: string[];
}
