import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const includeDist = process.argv.includes("--include-dist");
const roots = ["src", "public", "scripts"];
const rootFiles = ["astro.config.mjs", "package.json"];
const textExtensions = new Set([
  ".astro",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".txt",
  ".xml",
]);

const mojibakePatterns = [
  { name: "replacement character", pattern: /\uFFFD/u },
  { name: "latin-1 UTF-8 lead byte C2", pattern: /\u00C2[\u0080-\u00BF]/u },
  { name: "latin-1 UTF-8 lead byte C3", pattern: /\u00C3[\u0080-\u00BF]/u },
  { name: "mojibake punctuation", pattern: /\u00E2[\u0080-\u00BF]{1,2}/u },
  { name: "mojibake replacement sequence", pattern: /\u00EF\u00BF\u00BD/u },
  { name: "mojibake emoji sequence", pattern: /\u00F0[\u0080-\u00BF]{2,3}/u },
];

function getExtension(path) {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index).toLowerCase();
}

async function walk(directory) {
  try {
    await access(directory);
  } catch {
    return [];
  }

  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(path));
      continue;
    }

    if (entry.isFile() && textExtensions.has(getExtension(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

function describeMatch(content, matchIndex) {
  const before = content.slice(0, matchIndex);
  const line = before.split(/\r?\n/u).length;
  const lineStart = before.lastIndexOf("\n") + 1;
  const column = matchIndex - lineStart + 1;
  const lineEnd = content.indexOf("\n", matchIndex);
  const rawLine = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
  const excerpt = rawLine.trim().slice(0, 160);

  return { line, column, excerpt };
}

async function main() {
  const scanRoots = includeDist ? [...roots, "dist"] : roots;
  const files = [
    ...rootFiles,
    ...(await Promise.all(scanRoots.map((root) => walk(root)))).flat(),
  ];
  const findings = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");

    for (const { name, pattern } of mojibakePatterns) {
      const match = pattern.exec(content);

      if (match) {
        findings.push({ file, name, ...describeMatch(content, match.index) });
      }
    }
  }

  if (findings.length > 0) {
    console.error("Mojibake guard failed. Fix encoding artifacts before building:");

    for (const finding of findings) {
      console.error(
        `- ${finding.file}:${finding.line}:${finding.column} ${finding.name}: ${finding.excerpt}`,
      );
    }

    process.exit(1);
  }

  console.log(`Mojibake guard passed for ${files.length} text files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
