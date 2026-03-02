# WHO KNOWS BETTER — Product Vision & Technical Blueprint

---

## 1. ELEVATOR PITCH

**Who Knows Better** is a real-time 1v1 trivia duel where players bet on whether AI-generated "Did You Know" statements are true or false. Pick a topic, share a 5-letter code, and battle your friend in 10 rapid-fire rounds. Fastest correct answer wins. No accounts. No downloads. Just brains and bravery.

---

## 2. CORE GAME LOOP

```
[Pick Topic] → [Get/Share Code] → [Lobby] → [10 Rounds × 20s] → [Final Report]
     ↓              ↓                ↓              ↓                    ↓
  Genre Grid    5-letter code     Waiting +      Fact Card +         Score, 
  + Custom      + Share link      Countdown      Timer + Bet         Streaks,
  Topic Input                                    + Result Reveal      MVP Crown
```

### Round Flow (Per Fact)

1. **Fact Reveal** — Statement animates onto screen with dramatic typewriter/glitch effect
2. **Betting Phase** — Both players have 20s max. Tap TRUE or FALSE. Either player can vote to regenerate the fact (see below).
3. **Fact Regeneration** — If both players vote to regenerate, the current fact is swapped with a backup from the pool and the timer resets. Completely free — no limit, no penalty. Both must agree; social pressure is the only brake.
4. **Lock-in** — Once both answer (or timer expires), answers lock
5. **Reveal** — Correct answer revealed with animation. Points awarded.
6. **Scoreboard Flash** — Quick 3s score comparison, then next fact loads

### Scoring System

| Action | Points |
|--------|--------|
| Correct answer | +100 |
| Speed bonus (answered in <5s) | +50 |
| Speed bonus (answered in <10s) | +25 |
| Streak bonus (3+ correct in a row) | +30 per streak fact |
| No answer (timeout) | 0 |
| Wrong answer | 0 |

**Why no negative points?** Keeps it fun and encourages risk-taking. The speed bonus is the real differentiator — it rewards confidence, not just correctness.

---

## 3. TOPIC SELECTION SYSTEM

### Pre-built Topic Grid

Displayed as a visual, icon-rich grid (not a boring dropdown):

| Genre | Subtopics |
|-------|-----------|
| 🧬 **Science** | Deep Sea Creatures, Failed Experiments, Accidental Discoveries, Parasites & Symbiosis, Extinct Species That Almost Survived |
| 🌍 **Geography** | Micronations, Disputed Borders, Ghost Towns, Extreme Climates, Man-Made Islands |
| 📜 **History** | Assassination Plots That Failed, Lost Civilizations, Hoaxes That Fooled Everyone, Shortest Wars, Everyday Objects With Wild Origins |
| 🎬 **Entertainment** | Roles That Almost Went to Someone Else, One-Hit Wonders, Cancelled Too Soon, Hidden Easter Eggs, Box Office Bombs That Became Cult Classics |
| ⚽ **Sports** | Banned Techniques, Cursed Teams, Athletes Who Switched Sports, Strangest Olympic Events, Scandals That Changed the Rules |
| 💻 **Technology** | Software Bugs That Caused Disasters, Dead Social Networks, Inventions Their Creators Regretted, Abandoned Google Projects, Early Internet Oddities |
| 🍕 **Food & Drink** | Illegal Foods, Fermentation Gone Wrong, Dishes Invented by Accident, Poisonous Delicacies, Foods That Used to Be Garbage |
| 🧠 **Psychology** | Unethical Experiments, Mass Delusions, Optical Illusions Explained, Stockholm Syndrome Cases, Cognitive Biases You Fall For Daily |
| 💰 **Business** | Billion-Dollar Pivot Stories, Rejected Shark Tank Pitches That Made Millions, Corporate Feuds, Products That Killed Their Company, Dumbest Startup Ideas That Worked |
| 🎨 **Art & Culture** | Art Heists, Forgeries That Fooled Museums, Banned Books, Rituals That Still Exist, Instruments Nobody Plays Anymore |

### Custom Topic Mode

A text input field at the bottom of the topic grid:

```
┌─────────────────────────────────────────────────┐
│ 🔍 Or type ANY topic...                         │
│   e.g., "Indian street food", "Norse mythology"  │
└─────────────────────────────────────────────────┘
```

- Accepts freeform text
- Gemini will generate facts specifically around that niche
- Show a "generating..." animation while facts are being created

### Topic Selection UX

- **Host picks the topic** during room creation
- The other player sees the topic when they join the lobby
- Both players see the topic at the top of every round
- Optionally: After the game, suggest a "rematch with different topic" button

---

## 4. MATCHMAKING & ROOM SYSTEM

### The 5-Letter Code

- Generated server-side when host creates a room
- Format: **UPPERCASE alphanumeric**, excluding ambiguous chars (0/O, 1/I/L)
- Charset: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (29 chars)
- Example: `BX7KR`

### Share Mechanics

Two ways to share:

1. **Code Display** — Big, bold, copyable code shown in the lobby
2. **Share Link** — `whoknowsbetter.com/play/BX7KR`
    - If opened on mobile: deep-links directly into the game
    - If opened on desktop: lands on the game page and auto-joins

### OG Meta Tags (Share Preview)

The share link (`/play/[code]`) must include OG tags so WhatsApp, iMessage, and other platforms render a rich preview:

```html
<meta property="og:title" content="Think you know better? I dare you." />
<meta property="og:description" content="Topic: Science — Deep Sea Creatures" />
<meta property="og:image" content="https://whoknowsbetter.com/api/og?code=BX7KR" />
<meta property="og:url" content="https://whoknowsbetter.com/play/BX7KR" />
```

- `og:title` — the hook. Sharp, daring, not generic.
- `og:description` — topic info so you know what you're walking into.
- `og:image` — dynamically generated game card image (via Next.js OG image generation or a static fallback).
- No separate WhatsApp message template — the OG preview *is* the share. Just send the link.

### Share Button Actions

```
[Copy Code]  [Share Link]  [WhatsApp]
```

### Room Lifecycle

```
CREATED → WAITING → PLAYING → FINISHED → EXPIRED
  (Host)   (1 player)  (Both)    (Results)  (Auto-cleanup)
```

- Rooms auto-expire after 10 minutes of inactivity
- Rooms are deleted from memory after game completion + 5 minutes
- No persistent storage needed

---

## 5. DO WE NEED A DATABASE?

### Short answer: Not really. But...

**For MVP, NO database is required.** Here's what to use instead:

| Concern | Solution |
|---------|----------|
| Room state during gameplay | **In-memory store** (Map/Object on server) or **Redis** |
| Timer | **Client-side** (client timestamps are authoritative for speed bonus; server enforces round deadline) |
| Fact generation | **Gemini API** (generate on room creation, store in room state) |
| Room codes | **In-memory Map** (code → room state) |
| User identity | **Anonymous session** (socket ID = player ID) |
| Game results | **Ephemeral** — only exists during the result screen |

### When you WOULD need a DB (future features)

- Leaderboards / elo ratings → **Redis sorted sets** or **Upstash**
- User accounts & history → **PlanetScale** or **Supabase**
- Fact caching (avoid re-generating) → **Redis** or **Upstash KV**
- Analytics / game stats → **PostHog** or **Mixpanel** (no DB needed)

### Recommended Architecture for MVP

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   Next.js    │────▶│  WebSocket Server    │────▶│  Gemini API  │
│  (Frontend)  │◀────│  (Socket.io on       │     │  (Fact Gen)  │
│              │     │   custom server)     │     └─────────────┘
└─────────────┘     │                      │
                    │  In-Memory Store:     │
                    │  rooms = Map<code,    │
                    │    { players, facts,  │
                    │      scores, round }> │
                    └──────────────────────┘
```

---

## 6. REAL-TIME SYNC & TIMER ARCHITECTURE

### Timing Philosophy: Client is Authoritative

The client records its own timestamps. The server trusts them.

- When a new fact is displayed, the client records `factDisplayedAt` (local clock).
- When the player taps an answer, the client records `answeredAt` (local clock).
- The client sends both timestamps with the answer: `select_answer(answer, clientTimestampMs)`.
- The server uses `clientTimestampMs` directly for speed bonus calculation — no sanity-checking, no second-guessing.
- The server still enforces the round deadline: if both players have answered or 20s have elapsed since the server emitted `new_fact`, the round resolves. Answers arriving after resolution are rejected.
- There is no `timer_tick` event. The client runs its own 20s countdown locally.

### WebSocket Events

```
CLIENT → SERVER:
  join_room(code)                        // Player joins with room code
  select_answer(answer, clientTimestampMs) // Player submits TRUE/FALSE + client timing
  vote_regenerate()                      // Player votes to skip/regenerate the current fact
  request_rematch()                      // Player wants to play again
  ping()                                 // Latency measurement

SERVER → CLIENT:
  room_joined(roomState)                 // Confirm join, send topic + opponent info
  game_start(countdown)                  // 3-2-1 countdown before first fact
  new_fact(fact, roundNum)               // Push new fact + round number
  opponent_answered()                    // Opponent has locked in (no reveal of their answer)
  opponent_voted_regenerate()            // Opponent wants to skip this fact
  fact_regenerated(newFact)              // Both voted — new fact replaces current, timer resets
  round_result(result)                   // Both answers + correct answer + scores
  game_over(finalReport)                 // Full game summary
  player_disconnected()                  // Opponent left
  room_expired()                         // Room timed out
  pong(serverTimestamp)                  // Latency measurement response
```

### Timer Implementation

```javascript
// Server-side (simplified)
function startRound(room) {
  room.roundDeadline = Date.now() + 20_000;
  room.timeout = setTimeout(() => resolveRound(room), 20_000);
}

function handleAnswer(room, playerId, answer, clientTimestampMs) {
  if (Date.now() > room.roundDeadline) return; // too late
  room.answers[playerId] = { answer, clientTimestampMs };
  if (bothAnswered(room)) {
    clearTimeout(room.timeout);
    resolveRound(room);
  }
}

// Client-side (simplified)
socket.on('new_fact', (fact, roundNum) => {
  factDisplayedAt = Date.now();
  startLocalCountdown(20);
});

function submitAnswer(answer) {
  const clientTimestampMs = Date.now() - factDisplayedAt;
  socket.emit('select_answer', answer, clientTimestampMs);
}
```

### Fact Regeneration (Vote to Skip)

During the betting phase, either player can vote to regenerate the current fact:

- Tap a "Skip" button → emits `vote_regenerate()`.
- If only one player votes, the other sees `opponent_voted_regenerate()` — a nudge, not a force.
- If both players vote, the server swaps the fact with a backup from the pre-generated pool, emits `fact_regenerated(newFact)`, and resets the 20s timer.
- Completely free. Unlimited. No penalty. Both must agree — social pressure is the only limiter.
- If no backup facts remain, the skip button is disabled.

### Handling Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Player disconnects mid-game | Pause for 15s, allow reconnect. If not, other player wins by forfeit. |
| Both players answer same time | Server processes in order received. Both get fair scoring. |
| Network lag on answer | Client timestamp is authoritative. Server trusts it. |
| Player tries to join full room | Reject with "Room is full" message. |
| Room code doesn't exist | Show "Room not found" with option to create new game. |

---

## 7. FACT GENERATION WITH GEMINI

### Prompt Strategy

When a room is created, generate **15 facts** upfront (don't generate per-round — too slow). 10 are used for gameplay, 5 are held as backups for fact regeneration votes.

```
System Prompt:
"You are a trivia fact generator for a game called 'Who Knows Better'.
Generate exactly 15 statements about {topic}.

Rules:
- Each statement must be phrased as a "Did you know...?" claim
- 8 should be TRUE and 7 should be FALSE
- FALSE statements should be plausible and tricky (not obvious lies)
- TRUE statements should be surprising (not commonly known)
- Vary difficulty: 5 easy, 5 medium, 5 hard
- Each statement should be 1-2 sentences max
- Shuffle the order (don't group all true/false together)

Return as JSON:
[
  {
    "statement": "Did you know that honey never spoils? Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.",
    "answer": true,
    "difficulty": "easy",
    "explanation": "Honey's low moisture and acidic pH create an inhospitable environment for bacteria, allowing it to last thousands of years."
  },
  ...
]"
```

The first 10 facts (sorted by difficulty) are used for gameplay. The remaining 5 are the regeneration pool — drawn from when both players vote to skip a fact.

### Fact Quality Safeguards

- **Validate JSON response** — retry if malformed
- **Check for 8 true / 7 false** — rebalance if needed
- **Filter inappropriate content** — basic keyword filter + Gemini safety settings
- **Cache popular topics** — If 100 people play "Science — Deep Sea Creatures" in a day, cache and rotate fact sets to reduce API costs

### Difficulty Progression

Order the 10 gameplay facts by difficulty:

```
Round 1-3:  Easy    (warm-up)
Round 4-7:  Medium  (challenge)
Round 8-10: Hard    (clutch time)
```

Backup facts don't need difficulty ordering — they slot into whatever round needs them.

---

## 8. UI/UX VISION

### Design Philosophy

**"Arcade meets editorial."** Think retro game show energy mixed with modern typographic punch. Not childish, not corporate — somewhere between a sleek quiz show and a neon-lit arcade cabinet.

### Tone Guidelines

All copy should be sharp, confident, and minimal. Dry wit over enthusiasm. No exclamation-mark energy, no emoji-as-personality, no "fun" that tries too hard. Write like a friend who's effortlessly cool, not a marketing team brainstorming engagement hooks. If a line could appear in a generic trivia app, rewrite it.

### Color Palette

```
Background:     #0A0A0F (deep near-black)
Primary:        #FACC15 (electric gold — energy, competition)
Secondary:      #818CF8 (soft indigo — calm contrast)
Correct:        #34D399 (mint green)
Wrong:          #F87171 (soft red)
Surface:        #1A1A2E (card backgrounds)
Text:           #F8FAFC (crisp white)
Muted:          #64748B (secondary text)
```

### Typography

```
Display/Headlines:  "Cabinet Grotesk" or "Clash Display" (bold, geometric, playful)
Body/Facts:         "Satoshi" or "General Sans" (clean, modern, readable)
Monospace/Code:     "JetBrains Mono" (for timer, scores, room code)
```

### Key Screens

#### Screen 1: Landing / Home

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│    WHO KNOWS                        │
│      BETTER?                        │
│                                     │
│    ┌─────────────────────────┐      │
│    │  CREATE GAME              │      │
│    └─────────────────────────┘      │
│    ┌─────────────────────────┐      │
│    │  JOIN WITH CODE           │      │
│    └─────────────────────────┘      │
│                                     │
│    "Settle it."                     │
│                                     │
└─────────────────────────────────────┘
```

- Animated background: subtle floating particles or grid animation
- Logo has a slight glitch/flicker animation
- Buttons have hover pulse effect

#### Screen 2: Topic Selection (Host only)

```
┌─────────────────────────────────────┐
│  ← Back           PICK YOUR ARENA   │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 🧬  │ │ 🌍  │ │ 📜  │ │ 🎬  │  │
│  │Scien│ │Geo  │ │Hist │ │Ent  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ ⚽  │ │ 💻  │ │ 🍕  │ │ 🧠  │  │
│  │Sport│ │Tech │ │Food │ │Psych│  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔍 Or enter any topic...    │    │
│  └─────────────────────────────┘    │
│                                     │
│  Selected: Science → Space          │
│  ┌─────────────────────────┐        │
│  │  CREATE ROOM ⚡           │        │
│  └─────────────────────────┘        │
└─────────────────────────────────────┘
```

- Topic cards animate in with staggered entrance
- Selected card pops up with glow border
- Subtopics slide out from selected genre card

#### Screen 3: Lobby / Waiting Room

```
┌─────────────────────────────────────┐
│                                     │
│        YOUR ROOM CODE               │
│                                     │
│     ┌──┬──┬──┬──┬──┐               │
│     │B │X │7 │K │R │               │
│     └──┴──┴──┴──┴──┘               │
│                                     │
│  [📋 Copy]  [📤 Share]  [💬 WA]    │
│                                     │
│  Topic: Science — Deep Sea Creatures │
│                                     │
│  ┌─────────┐     ┌─────────┐       │
│  │  YOU     │     │  ???    │       │
│  │  Ready   │     │ Waiting │       │
│  └─────────┘     └─────────┘       │
│                                     │
│  Waiting for opponent...            │
│  ● ● ● (pulsing dots)              │
│                                     │
└─────────────────────────────────────┘
```

- Room code letters animate in one by one with a typewriter sound
- Pulsing "waiting" animation
- When opponent joins: dramatic flash + "OPPONENT FOUND" animation

#### Screen 4: Gameplay (The Core)

```
┌─────────────────────────────────────┐
│  Round 4/10    12ms    ⏱ 00:14      │
│  ━━━━━━━━━━░░░░░░░░░░░░░░ (timer)  │
│                                     │
│  Science — Deep Sea Creatures       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  "Did you know that Venus   │    │
│  │   rotates backwards         │    │
│  │   compared to most          │    │
│  │   other planets?"           │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     ┌───────────┐ ┌───────────┐     │
│     │  ✅ TRUE   │ │  ❌ FALSE  │     │
│     └───────────┘ └───────────┘     │
│                                     │
│  You: 380 pts    Opponent: 250 pts  │
│  🔥 3 streak                        │
│                                     │
└─────────────────────────────────────┘
```

- Fact text types in with a typewriter animation
- Timer bar depletes visually (color shifts green → yellow → red)
- When opponent answers: subtle "Opponent locked in" appears
- Buttons have satisfying press animation
- Ping indicator always visible in top bar (e.g., `12ms`). Client pings server periodically, displays round-trip latency.
- "Skip" button visible during betting phase for fact regeneration votes

#### Screen 5: Round Result (3-second flash)

```
┌─────────────────────────────────────┐
│                                     │
│           ✅ TRUE!                   │
│   Venus does rotate retrograde      │
│                                     │
│   ┌──────────┐   ┌──────────┐      │
│   │  YOU ✅   │   │  OPP ❌   │      │
│   │  TRUE     │   │  FALSE    │      │
│   │  +150 🔥  │   │  +0       │      │
│   │  (4.2s)   │   │  (12.1s)  │      │
│   └──────────┘   └──────────┘      │
│                                     │
│   You: 530        Opponent: 250     │
│                                     │
└─────────────────────────────────────┘
```

- Correct answer bursts in with confetti (if you got it right)
- Wrong answer has a subtle screen shake
- Score counter animates up like a slot machine

#### Screen 6: Final Report

```
┌─────────────────────────────────────┐
│                                     │
│         YOU WIN.                     │
│   (or: NOT THIS TIME.)              │
│                                     │
│   ┌──────────────────────────┐      │
│   │  You          Opponent   │      │
│   │  830    vs    620        │      │
│   └──────────────────────────┘      │
│                                     │
│   📊 YOUR STATS                     │
│   Correct: 7/10  |  Opp: 5/10      │
│   Avg time: 6.2s |  Opp: 11.4s     │
│   Best streak: 4  |  Opp: 2        │
│   Fastest on 6/10 rounds            │
│                                     │
│   📋 ROUND BREAKDOWN               │
│   1. ✅ True  (3.1s)  — ❌ (8s)     │
│   2. ✅ True  (5.2s)  — ✅ (4.1s)   │
│   ...                               │
│                                     │
│  ┌──────────┐  ┌──────────────┐     │
│  │ REMATCH  │  │ NEW OPPONENT │     │
│  └──────────┘  └──────────────┘     │
│                                     │
│  ┌──────────────────────────┐       │
│  │ 📤 Share Results          │       │
│  └──────────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

- Winner gets a clean, confident animation + particle burst
- Loser gets a understated "not this time" — no condescension
- Stats animate in with counter-up effects
- "Share Results" generates a visual card for social media

### Animation Priorities

| Element | Library | Effect |
|---------|---------|--------|
| Page transitions | Framer Motion | Slide/fade between screens |
| Fact text reveal | GSAP | Typewriter with cursor blink |
| Timer bar | CSS + Framer Motion | Smooth depletion with color shift |
| Score counters | Framer Motion | Spring physics number animation |
| Button presses | Framer Motion | Scale down + haptic-like bounce |
| Result reveal | GSAP | Dramatic flip/burst animation |
| Confetti | canvas-confetti | Winner celebration |
| Waiting dots | CSS | Pulsing loading animation |
| Room code | GSAP | Letter-by-letter staggered entry |
| Background | CSS | Subtle grid/particle ambient animation |

---

## 9. TECH STACK (DEFINITIVE)

```
FRONTEND
├── Next.js 14+ (App Router)
├── TypeScript
├── Tailwind CSS
├── Framer Motion (page transitions, micro-interactions)
├── GSAP (complex timeline animations — typewriter, reveals)
├── Socket.io Client (real-time communication)
├── canvas-confetti (celebration effects)
└── Google Fonts (Cabinet Grotesk / Clash Display + Satoshi)

BACKEND
├── Next.js API Routes (room creation, health checks)
├── Custom Node.js server (Socket.io integration)
├── Gemini API (fact generation)
└── In-memory store (Map<roomCode, GameState>)

DEPLOYMENT
├── Vercel (frontend + API routes)
├── Railway / Render / Fly.io (WebSocket server — Vercel doesn't support persistent WS)
```

### Why Separate WebSocket Server?

Vercel's serverless functions are stateless and short-lived — they can't maintain persistent WebSocket connections. You need a long-running process for:
- Maintaining socket connections for both players
- Enforcing round deadlines and resolving rounds
- Storing room state in memory

**Solution:** Deploy a lightweight Express + Socket.io server on Railway/Render (~$5/month) that handles all real-time logic. The Next.js frontend connects to this server via WebSocket.

---

## 10. FOLDER STRUCTURE

```
who-knows-better/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Landing / Home
│   ├── create/
│   │   └── page.tsx            # Topic selection
│   ├── play/
│   │   └── [code]/
│   │       └── page.tsx        # Game room (join via link)
│   ├── lobby/
│   │   └── [code]/
│   │       └── page.tsx        # Waiting room
│   └── layout.tsx
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Timer.tsx
│   │   ├── RoomCode.tsx
│   │   ├── TopicGrid.tsx
│   │   ├── FactCard.tsx
│   │   └── ScoreBoard.tsx
│   ├── game/                   # Game-specific components
│   │   ├── GamePlay.tsx
│   │   ├── RoundResult.tsx
│   │   ├── FinalReport.tsx
│   │   └── WaitingRoom.tsx
│   └── animations/             # Animation wrappers
│       ├── Typewriter.tsx
│       ├── Confetti.tsx
│       └── PageTransition.tsx
├── hooks/
│   ├── useSocket.ts            # Socket.io connection hook
│   ├── useTimer.ts             # Client-side timer display
│   └── useGame.ts              # Game state management
├── lib/
│   ├── socket.ts               # Socket client setup
│   ├── types.ts                # TypeScript interfaces
│   └── constants.ts            # Topics, scoring rules
├── server/                     # Standalone WebSocket server
│   ├── index.ts                # Express + Socket.io server
│   ├── game.ts                 # Game logic (rounds, scoring)
│   ├── rooms.ts                # Room management
│   ├── facts.ts                # Gemini API integration
│   └── types.ts                # Server-side types
├── public/
│   └── sounds/                 # Optional game sounds
│       ├── tick.mp3
│       ├── correct.mp3
│       ├── wrong.mp3
│       └── victory.mp3
└── package.json
```

---

## 11. MVP FEATURES

- [ ] Landing page with Create / Join
- [ ] Topic selection (pre-built grid only, no custom yet)
- [ ] Room creation + 5-letter code generation
- [ ] Share link + copy code + OG meta tags for rich previews
- [ ] WebSocket server + room management
- [ ] Gemini fact generation (15 facts per game — 10 gameplay + 5 backup)
- [ ] Core gameplay loop (fact → answer → result)
- [ ] Client-authoritative timing (20s rounds, client timestamps for speed bonus)
- [ ] Fact regeneration votes (both players agree to skip → swap from backup pool)
- [ ] Scoring system (base + speed bonus)
- [ ] Final results screen
- [ ] Custom topic input
- [ ] All animations (typewriter, confetti, transitions)
- [ ] Sound effects (optional toggle)
- [ ] Share results as image card
- [ ] Rematch functionality
- [ ] Disconnect handling + reconnection
- [ ] Mobile responsive design
- [ ] Persistent ping indicator in gameplay UI
- [ ] Fact repetition mitigation (in-memory hash cache per topic)

---

## 12. KEY RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Fact repetition for same topic | Staleness | See fact repetition strategy below |

### Fact Repetition Mitigation

Players who replay the same topic shouldn't see the same facts. Strategy:

1. **Hash each fact statement** (e.g., SHA-256 of normalized lowercase text).
2. **Store hashes per topic** in an in-memory cache: `Map<topic, Set<factHash>>` with LRU eviction.
3. **When generating new facts**, pass recent hashes to the Gemini prompt as "avoid generating statements similar to these previous ones: [hashes/snippets]".
4. **Rotate fact sets**: for popular topics, maintain multiple cached sets and cycle through them before generating fresh ones.
5. **For MVP**: simple `Map<topic, Set<factHash>>` with a max size per topic (e.g., 100 hashes) and LRU eviction when the map gets too large. No Redis needed yet.

**Built by Naad**