import { GoogleGenerativeAI } from "@google/generative-ai";
import { Fact } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateFacts(topic: string, subtopic: string): Promise<Fact[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const fullTopic = subtopic ? `${topic} — ${subtopic}` : topic;

  const prompt = `You are a trivia fact generator for a game called 'Who Knows Better'.
Generate exactly 15 statements about ${fullTopic}.

Rules:
- Each statement must be phrased as a "Did you know...?" claim
- 8 should be TRUE and 7 should be FALSE
- FALSE statements should be plausible and tricky (not obvious lies)
- TRUE statements should be surprising (not commonly known)
- Vary difficulty: 5 easy, 5 medium, 5 hard
- Each statement should be 1-2 sentences max
- Shuffle the order (don't group all true/false together)

Return ONLY valid JSON array, no markdown, no code blocks:
[
  {
    "statement": "Did you know that honey never spoils? Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.",
    "answer": true,
    "difficulty": "easy",
    "explanation": "Honey's low moisture and acidic pH create an inhospitable environment for bacteria."
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code blocks if present
    const jsonStr = text.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    const facts: Fact[] = JSON.parse(jsonStr);

    if (!Array.isArray(facts) || facts.length < 10) {
      throw new Error(`Expected 15 facts, got ${facts.length}`);
    }

    // Validate structure
    for (const fact of facts) {
      if (!fact.statement || typeof fact.answer !== "boolean" || !fact.difficulty || !fact.explanation) {
        throw new Error("Invalid fact structure");
      }
    }

    return facts;
  } catch (error) {
    console.error("Fact generation failed, using fallback:", error);
    return getFallbackFacts();
  }
}

function getFallbackFacts(): Fact[] {
  return [
    { statement: "Did you know that honey never spoils? Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.", answer: true, difficulty: "easy", explanation: "Honey's low moisture and acidic pH prevent bacterial growth." },
    { statement: "Did you know that goldfish have a memory span of only 3 seconds?", answer: false, difficulty: "easy", explanation: "Goldfish can actually remember things for months." },
    { statement: "Did you know that the Great Wall of China is visible from space with the naked eye?", answer: false, difficulty: "easy", explanation: "It's too narrow to be seen from space without aid." },
    { statement: "Did you know that octopuses have three hearts?", answer: true, difficulty: "easy", explanation: "Two pump blood to the gills, one pumps it to the rest of the body." },
    { statement: "Did you know that bananas are berries, but strawberries are not?", answer: true, difficulty: "easy", explanation: "Botanically, berries come from a single ovary. Bananas qualify; strawberries don't." },
    { statement: "Did you know that Venus is the hottest planet in our solar system, despite Mercury being closer to the Sun?", answer: true, difficulty: "medium", explanation: "Venus's thick CO2 atmosphere creates an extreme greenhouse effect." },
    { statement: "Did you know that humans share about 60% of their DNA with bananas?", answer: true, difficulty: "medium", explanation: "Many fundamental cellular processes are shared across life forms." },
    { statement: "Did you know that lightning never strikes the same place twice?", answer: false, difficulty: "medium", explanation: "Lightning frequently strikes the same place, especially tall structures." },
    { statement: "Did you know that the Sahara Desert has always been a desert for millions of years?", answer: false, difficulty: "medium", explanation: "The Sahara was green and lush as recently as 6,000 years ago." },
    { statement: "Did you know that a group of flamingos is called a 'flamboyance'?", answer: true, difficulty: "medium", explanation: "The collective noun for flamingos is indeed a flamboyance." },
    { statement: "Did you know that sound travels faster in water than in air?", answer: true, difficulty: "hard", explanation: "Sound travels about 4.3 times faster in water due to higher density." },
    { statement: "Did you know that the human body contains enough iron to make a 3-inch nail?", answer: true, difficulty: "hard", explanation: "The average adult body contains about 3-4 grams of iron." },
    { statement: "Did you know that Einstein failed math in school?", answer: false, difficulty: "hard", explanation: "Einstein excelled in mathematics. This is a persistent myth." },
    { statement: "Did you know that the tongue is the strongest muscle in the human body?", answer: false, difficulty: "hard", explanation: "The tongue is actually made of 8 muscles, and the masseter (jaw) is the strongest by force." },
    { statement: "Did you know that there are more possible iterations of a game of chess than atoms in the observable universe?", answer: true, difficulty: "hard", explanation: "The Shannon number estimates about 10^120 possible chess games, far exceeding ~10^80 atoms." },
  ];
}

export function sortFactsByDifficulty(facts: Fact[]): { gameplay: Fact[]; backup: Fact[] } {
  const easy = facts.filter((f) => f.difficulty === "easy");
  const medium = facts.filter((f) => f.difficulty === "medium");
  const hard = facts.filter((f) => f.difficulty === "hard");

  // Order: easy first, then medium, then hard
  const sorted = [...easy, ...medium, ...hard];
  const gameplay = sorted.slice(0, 10);
  const backup = sorted.slice(10);

  return { gameplay, backup };
}
