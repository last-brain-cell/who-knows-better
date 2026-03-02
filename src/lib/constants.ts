import { TopicGenre } from "./types";

export const ROUND_DURATION_MS = 20_000;
export const RESULT_DISPLAY_MS = 3_000;
export const COUNTDOWN_SECONDS = 3;
export const TOTAL_ROUNDS = 10;
export const TOTAL_FACTS = 15; // 10 gameplay + 5 backup
export const ROOM_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const ROOM_CLEANUP_MS = 5 * 60 * 1000; // 5 minutes after finish
export const RECONNECT_GRACE_MS = 15_000;

// Scoring
export const POINTS_CORRECT = 100;
export const SPEED_BONUS_FAST = 50; // < 5s
export const SPEED_BONUS_MEDIUM = 25; // < 10s
export const STREAK_BONUS = 30; // 3+ streak

// Room code charset (excluding ambiguous: 0/O, 1/I/L)
export const CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 5;

export const TOPIC_GENRES: TopicGenre[] = [
  {
    id: "science",
    name: "Science",
    emoji: "🧬",
    subtopics: [
      "Deep Sea Creatures",
      "Failed Experiments",
      "Accidental Discoveries",
      "Parasites & Symbiosis",
      "Extinct Species That Almost Survived",
    ],
  },
  {
    id: "geography",
    name: "Geography",
    emoji: "🌍",
    subtopics: [
      "Micronations",
      "Disputed Borders",
      "Ghost Towns",
      "Extreme Climates",
      "Man-Made Islands",
    ],
  },
  {
    id: "history",
    name: "History",
    emoji: "📜",
    subtopics: [
      "Assassination Plots That Failed",
      "Lost Civilizations",
      "Hoaxes That Fooled Everyone",
      "Shortest Wars",
      "Everyday Objects With Wild Origins",
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    emoji: "🎬",
    subtopics: [
      "Roles That Almost Went to Someone Else",
      "One-Hit Wonders",
      "Cancelled Too Soon",
      "Hidden Easter Eggs",
      "Box Office Bombs That Became Cult Classics",
    ],
  },
  {
    id: "sports",
    name: "Sports",
    emoji: "⚽",
    subtopics: [
      "Banned Techniques",
      "Cursed Teams",
      "Athletes Who Switched Sports",
      "Strangest Olympic Events",
      "Scandals That Changed the Rules",
    ],
  },
  {
    id: "technology",
    name: "Technology",
    emoji: "💻",
    subtopics: [
      "Software Bugs That Caused Disasters",
      "Dead Social Networks",
      "Inventions Their Creators Regretted",
      "Abandoned Google Projects",
      "Early Internet Oddities",
    ],
  },
  {
    id: "food",
    name: "Food & Drink",
    emoji: "🍕",
    subtopics: [
      "Illegal Foods",
      "Fermentation Gone Wrong",
      "Dishes Invented by Accident",
      "Poisonous Delicacies",
      "Foods That Used to Be Garbage",
    ],
  },
  {
    id: "psychology",
    name: "Psychology",
    emoji: "🧠",
    subtopics: [
      "Unethical Experiments",
      "Mass Delusions",
      "Optical Illusions Explained",
      "Stockholm Syndrome Cases",
      "Cognitive Biases You Fall For Daily",
    ],
  },
  {
    id: "business",
    name: "Business",
    emoji: "💰",
    subtopics: [
      "Billion-Dollar Pivot Stories",
      "Rejected Shark Tank Pitches That Made Millions",
      "Corporate Feuds",
      "Products That Killed Their Company",
      "Dumbest Startup Ideas That Worked",
    ],
  },
  {
    id: "art",
    name: "Art & Culture",
    emoji: "🎨",
    subtopics: [
      "Art Heists",
      "Forgeries That Fooled Museums",
      "Banned Books",
      "Rituals That Still Exist",
      "Instruments Nobody Plays Anymore",
    ],
  },
];
