import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const componentPath = path.resolve("src/components/layout/GoblinBot.astro");
const source = fs.readFileSync(componentPath, "utf8");

function extractConst(name, after = 0) {
  const start = source.indexOf(`const ${name} = `, after);
  if (start === -1) {
    throw new Error(`Could not find const ${name}`);
  }

  const valueStart = source.indexOf("=", start) + 1;
  let depth = 0;
  let inString = false;
  let quote = "";

  for (let i = valueStart; i < source.length; i++) {
    const ch = source[i];
    const prev = source[i - 1];

    if (inString) {
      if (ch === quote && prev !== "\\") {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === "[" || ch === "{") depth++;
    if (ch === "]" || ch === "}") depth--;

    if (depth === 0 && ch === ";") {
      return source.slice(valueStart, i).trim();
    }
  }

  throw new Error(`Could not extract const ${name}`);
}

const kbExpression = extractConst("KB");
const queryEngineStart = source.indexOf("const STOP_WORDS");
const queryEngineEnd = source.indexOf("function handleQuery", queryEngineStart);
const queryEngineSource = source
  .slice(queryEngineStart, queryEngineEnd)
  .replace(/: typeof KB\[0\] \| null/g, "")
  .replace(/: typeof KB\[0\]/g, "")
  .replace(/: string\[\]/g, "")
  .replace(/: string/g, "")
  .replace(/: number/g, "")
  .replace(/ as HTMLInputElement/g, "")
  .replace(/ as HTMLImageElement/g, "");

const context = {};
vm.createContext(context);
vm.runInContext(`const KB = ${kbExpression};\n${queryEngineSource}\nthis.findAnswer = findAnswer;`, context);

const cases = [
  {
    query: "free vs pro",
    includes: "Pro gets you",
  },
  {
    query: "difference between free and paid",
    includes: "Pro gets you",
  },
  {
    query: "paid version",
    includes: "Pro gets you",
  },
  {
    query: "what's included in pro",
    includes: "Pro gets you",
  },
  {
    query: "upgrade worth it",
    includes: "Pro gets you",
  },
  {
    query: "why is there a goblin judging my life choices",
    includes: "quick 5 minute Instagram check",
  },
  {
    query: "are you AI",
    includes: "tiny FAQ Goblin",
  },
  {
    query: "do you have feelings",
    includes: "disappointed when you open Instagram",
  },
  {
    query: "can I pet the goblin",
    includes: "emotionally yes",
  },
  {
    query: "what do you think of TikTok",
    includes: "trapdoor",
  },
  {
    query: "are you evil",
    includes: "focus-aligned",
  },
  {
    query: "what does this thing actually do",
    includes: "focus timer and app blocker",
  },
  {
    query: "explain CogniFocus like I'm tired",
    includes: "Start a focus session",
  },
  {
    query: "who created this app",
    includes: "Built by Qasim Khan",
  },
  {
    query: "is this useful for ADHD",
    includes: "ADHD-style attention patterns",
  },
  {
    query: "how do I start focusing",
    includes: "You pick a duration",
  },
  {
    query: "can I take a break",
    includes: "Pausing stops the session",
  },
  {
    query: "maximum focus session length",
    includes: "240 minutes",
  },
  {
    query: "does it keep working if I leave the app",
    includes: "foreground service",
  },
  {
    query: "do I need to sign up first",
    includes: "without creating an account",
  },
  {
    query: "what is the shield thing",
    includes: "detects which app is in front",
  },
  {
    query: "can it block YouTube",
    includes: "You choose which apps to block",
  },
  {
    query: "how many distractions can free block",
    includes: "Free plan: block up to 3 apps",
  },
  {
    query: "does blocking work without wifi",
    includes: "Core blocking and Shield behavior works offline",
  },
  {
    query: "why does Android ask for usage access",
    includes: "detect which app is in the foreground",
  },
  {
    query: "does CogniFocus read my texts",
    includes: "does not read your messages",
  },
  {
    query: "why do you need overlay permission",
    includes: "appear over the distraction",
  },
  {
    query: "can it silence notifications",
    includes: "DND Focus Mode",
  },
  {
    query: "what moods does the goblin have",
    includes: "four moods",
  },
  {
    query: "does the goblin learn my habits",
    includes: "adapt over time",
  },
  {
    query: "are there other characters",
    includes: "Monk, Buddy, Wizard",
  },
  {
    query: "how do streaks work",
    includes: "consecutive days",
  },
  {
    query: "what are focus shards",
    includes: "pieces of recovered focus",
  },
  {
    query: "how do I earn XP",
    includes: "completing sessions",
  },
  {
    query: "what is included for free",
    includes: "Free gives you",
  },
  {
    query: "how much does premium cost",
    includes: "$3.99/month",
  },
  {
    query: "is there a free trial",
    includes: "7-day free trial",
  },
  {
    query: "how do I cancel pro",
    includes: "Google Play",
  },
  {
    query: "can I restore my purchase",
    includes: "Pro restore support",
  },
  {
    query: "does pro sync between phones",
    includes: "Cloud sync",
  },
  {
    query: "is it on iPhone",
    includes: "iOS is in development",
  },
  {
    query: "does it support desktop",
    includes: "Desktop support is being explored",
  },
  {
    query: "what Android version do I need",
    includes: "No specific minimum Android version",
  },
  {
    query: "can I uninstall it to cheat",
    includes: "Uninstall protection is on the roadmap",
  },
  {
    query: "what is Ghost Mode",
    includes: "not live yet",
  },
  {
    query: "is there savage mode",
    includes: "roadmap",
  },
  {
    query: "how is this different from Forest",
    includes: "passive vs reactive",
  },
  {
    query: "compare CogniFocus with Freedom",
    includes: "blocking + reaction",
  },
  {
    query: "is this just a pomodoro timer",
    includes: "Most Pomodoro timers time you",
  },
  {
    query: "I found a bug",
    includes: "device model",
  },
  {
    query: "how do I contact a human",
    includes: "support@cognifocus.app",
  },
  {
    query: "where is the press email",
    includes: "press@cognifocus.app",
  },
  {
    query: "can I delete my account",
    includes: "delete your account and data",
  },
  {
    query: "where is the privacy policy",
    includes: "Privacy policy and terms",
  },
  {
    query: "where can I see the latest version",
    includes: "What's New page",
  },
  {
    query: "show me the demo",
    includes: "full demo",
  },
  {
    query: "where can I follow CogniFocus",
    includes: "@cognifocus.app",
  },
  {
    query: "is CogniFocus on Product Hunt",
    includes: "Product Hunt",
  },
  {
    query: "one quick check keeps ruining my study session",
    includes: "27 minutes on Instagram",
  },
  {
    query: "do you hate YouTube",
    includes: "block list",
  },
  {
    query: "should I download this app",
    includes: "Try it free",
  },
  {
    query: "what happens when I get distracted",
    includes: "Recovery nudges",
  },
];

let failures = 0;

for (const testCase of cases) {
  const answer = context.findAnswer(testCase.query);
  if (!answer || !answer.answer.toLowerCase().includes(testCase.includes.toLowerCase())) {
    failures++;
    console.error(`FAIL: ${testCase.query}`);
    console.error(`Expected answer to include: ${testCase.includes}`);
    console.error(`Actual: ${answer?.answer ?? "NO MATCH"}`);
    console.error("");
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`PASS: ${cases.length} Goblin bot query cases matched expected answers.`);
}
