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
      "Creatures That Shouldn't Exist But Do",
      "Experiments That Went Horribly Wrong",
      "Accidental Discoveries That Changed Everything",
      "Parasites That Control Their Hosts' Minds",
      "Extinct Species That Almost Made a Comeback",
      "Scientists Who Experimented on Themselves",
      "Elements Discovered by Complete Amateurs",
      "Animals With Superpowers We Can't Explain",
      "Lab Accidents That Led to Breakthroughs",
    ],
  },
  {
    id: "geography",
    name: "Geography",
    emoji: "🌍",
    subtopics: [
      "Micronations Run by One Person",
      "Borders That Make Zero Sense",
      "Towns Swallowed by Nature",
      "Places Where Humans Shouldn't Live But Do",
      "Man-Made Islands Built for Weird Reasons",
      "Countries That Existed for Less Than a Day",
      "Places Google Maps Won't Show You",
      "Geographic Oddities That Break Your Brain",
      "Cities Built on Top of Other Cities",
    ],
  },
  {
    id: "history",
    name: "History",
    emoji: "📜",
    subtopics: [
      "Assassination Plots So Dumb They Almost Worked",
      "Civilizations That Vanished Overnight",
      "Hoaxes That Fooled Entire Nations",
      "Wars That Lasted Less Than an Hour",
      "Everyday Objects With Absolutely Wild Origins",
      "Historical Figures Who Were Probably Unhinged",
      "Empires Toppled by Stupid Mistakes",
      "Time Travelers? Suspicious Historical Photos",
      "Revenge Plots That Took Decades",
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    emoji: "🎬",
    subtopics: [
      "Roles That Almost Went to Someone Ridiculous",
      "Artists Who Peaked and Vanished",
      "Shows Cancelled Right Before Getting Good",
      "Easter Eggs Nobody Found for Years",
      "Box Office Bombs That Became Cult Religions",
      "Movies That Accidentally Predicted the Future",
      "Albums Recorded in Completely Insane Conditions",
      "Child Actors Who Had the Wildest Second Acts",
      "Sequels Nobody Asked For That Slapped",
      "TV Shows That Changed Their Entire Plot Overnight",
    ],
  },
  {
    id: "sports",
    name: "Sports",
    emoji: "⚽",
    subtopics: [
      "Techniques So Effective They Got Banned",
      "Teams Cursed by Actual Hexes",
      "Athletes Who Dominated a Totally Different Sport",
      "Olympic Events That Were Actually Unhinged",
      "Scandals That Rewrote the Rulebook",
      "Mascots That Terrorized Children",
      "Games Won by the Worst Team in History",
      "Athletes Who Competed Under Fake Identities",
      "Sports That Only Exist in One Country",
    ],
  },
  {
    id: "technology",
    name: "Technology",
    emoji: "💻",
    subtopics: [
      "Software Bugs That Nearly Ended the World",
      "Social Networks That Died Embarrassing Deaths",
      "Inventions Their Creators Wished They Could Un-Invent",
      "Google Projects Killed in Their Prime",
      "Early Internet Culture That Feels Like a Fever Dream",
      "Gadgets That Were Way Ahead of Their Time",
      "Hackers Who Did It Just to Prove a Point",
      "Tech Predictions That Aged Like Milk",
      "Robots That Immediately Did Something Unhinged",
    ],
  },
  {
    id: "food",
    name: "Food & Drink",
    emoji: "🍕",
    subtopics: [
      "Foods That Are Literally Illegal Somewhere",
      "Fermentation Experiments Gone Beautifully Wrong",
      "Dishes Invented by Pure Accident",
      "Delicacies That Could Actually Kill You",
      "Foods That Used to Be Considered Trash",
      "Fast Food Menu Items That Caused Actual Riots",
      "Ancient Recipes That Slap Unexpectedly Hard",
      "Drinks That Were Originally Medicine",
      "Food Feuds Between Countries",
    ],
  },
  {
    id: "psychology",
    name: "Psychology",
    emoji: "🧠",
    subtopics: [
      "Experiments So Unethical They Changed the Law",
      "Mass Delusions That Infected Entire Cities",
      "Optical Illusions That Break Your Brain",
      "Hostage Cases Where Everyone Lost Their Minds",
      "Cognitive Biases You Fell For Today",
      "Phobias So Specific They Sound Made Up",
      "Cults That Started as Self-Help Groups",
      "Dreams That Accurately Predicted Disasters",
      "Psychological Tricks Used by Theme Parks",
    ],
  },
  {
    id: "business",
    name: "Business",
    emoji: "💰",
    subtopics: [
      "Billion-Dollar Companies That Started as Jokes",
      "Shark Tank Rejects That Made More Than the Sharks",
      "Corporate Feuds Pettier Than Any Reality Show",
      "Products That Accidentally Destroyed Their Own Company",
      "Startup Ideas So Dumb They Became Empires",
      "CEOs Who Got Fired From Their Own Company",
      "Business Deals Made on Napkins That Actually Held Up",
      "Companies That Exist Purely Because of a Typo",
      "Monopolies Nobody Realizes Exist",
    ],
  },
  {
    id: "art",
    name: "Art & Culture",
    emoji: "🎨",
    subtopics: [
      "Art Heists Pulled Off by Total Amateurs",
      "Forgeries So Good They're Still in Museums",
      "Books Banned for the Dumbest Reasons",
      "Ancient Rituals That People Still Do Today",
      "Instruments Nobody Alive Knows How to Play",
      "Paintings That Contain Hidden Messages",
      "Art Pieces That Sold for Millions and Are Just... Nothing",
      "Dance Crazes That Caused Actual Injuries",
      "Statues With Embarrassing Secrets",
    ],
  },
  {
    id: "crime",
    name: "Crime & Heists",
    emoji: "🕵️",
    subtopics: [
      "Unsolved Mysteries That Still Haunt Detectives",
      "Criminals Who Got Caught in the Dumbest Way",
      "Heists That Went Spectacularly Wrong",
      "Cold Cases Solved by Complete Accident",
      "Scams So Elaborate They Deserve Respect",
      "Prison Escapes That Shouldn't Have Worked",
      "Thieves Who Returned the Loot With an Apology",
      "Crimes Solved by Pets",
      "Criminal Duos Who Turned on Each Other Immediately",
    ],
  },
  {
    id: "space",
    name: "Space & Cosmos",
    emoji: "🚀",
    subtopics: [
      "Planets That Shouldn't Physically Exist",
      "Space Missions That Went Horrifyingly Wrong",
      "Alien Theories That Are Weirdly Convincing",
      "Astronaut Stories That Sound Made Up",
      "Things Floating in Space Right Now That Shouldn't Be",
      "Stars That Behave Like They're Broken",
      "Space Sounds That Will Haunt Your Dreams",
      "Cosmic Events That Nearly Wiped Us Out",
      "Space Agencies' Most Embarrassing Failures",
    ],
  },
  {
    id: "language",
    name: "Language & Words",
    emoji: "🗣️",
    subtopics: [
      "Words That Exist in Only One Language",
      "Dead Languages With No Living Speakers",
      "Slang That Started as an Insult",
      "Words English Stole From Other Languages",
      "Phrases Everyone Uses Wrong",
      "Languages Invented by One Person",
      "Swear Words With Surprisingly Wholesome Origins",
      "Writing Systems Nobody Can Decipher",
      "Words That Mean the Opposite of What You Think",
      "Languages That Use Whistling Instead of Speaking",
    ],
  },
  {
    id: "myths",
    name: "Myths & Legends",
    emoji: "🐉",
    subtopics: [
      "Cryptids With Suspiciously Credible Sightings",
      "Urban Legends That Turned Out to Be True",
      "Cursed Objects You Can Actually Visit",
      "Folklore Creatures That Exist Across Every Culture",
      "Haunted Places With Documented Weirdness",
      "Prophecies That Kinda Nailed It",
      "Mythological Punishments That Were Way Too Creative",
      "Real Places That Inspired Fictional Worlds",
      "Supernatural Events Witnessed by Hundreds",
    ],
  },
  {
    id: "body",
    name: "Human Body",
    emoji: "🫀",
    subtopics: [
      "Medical Cases That Baffled Every Doctor",
      "Vestigial Organs That Still Do Something Weird",
      "Body Hacks That Actually Work",
      "People Who Survived Things That Should've Killed Them",
      "Diseases That Only a Handful of People Have",
      "Senses Humans Have That Nobody Talks About",
      "Surgeries Performed Without Anesthesia on Purpose",
      "Reflexes That Exist for No Good Reason",
      "Body Parts Named After the Weirdest People",
    ],
  },
];
