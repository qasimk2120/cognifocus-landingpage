import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const registryPath = new URL("../src/data/featured-badges.json", import.meta.url);

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function readAttribute(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "iu"),
  );
  return match ? decodeHtml(match[1] ?? match[2] ?? match[3]) : undefined;
}

function normalizeUrl(value) {
  const markdownLink = value.match(/^\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)$/u);
  return markdownLink ? markdownLink[2] : value;
}

function inferName(alt, href) {
  const fromAlt = alt
    .replace(/\b(?:embed|embeddable|featured)\b/giu, "")
    .replace(/\bbadge\b/giu, "")
    .replace(/\s+/gu, " ")
    .trim();

  if (fromAlt) return fromAlt;

  const hostname = new URL(href).hostname.replace(/^www\./u, "");
  const segment = hostname.split(".")[0].replace(/[-_]+/gu, " ");
  return segment.replace(/\b\w/gu, (letter) => letter.toUpperCase());
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

export function parseBadgeEmbed(html) {
  const anchor = html.match(/<a\b[^>]*>/iu)?.[0];
  if (!anchor) throw new Error("Badge embed must contain an <a> with an href.");

  const image = html.match(/<img\b[^>]*>/iu)?.[0];
  if (!image) throw new Error("Badge embed must contain an <img>.");

  const rawHref = readAttribute(anchor, "href");
  const rawSrc = readAttribute(image, "src");
  if (!rawHref) throw new Error("Badge embed anchor must contain an href.");
  if (!rawSrc) throw new Error("Badge embed image must contain a src.");

  const href = normalizeUrl(rawHref);
  const src = normalizeUrl(rawSrc);
  const alt = readAttribute(image, "alt") || "Featured directory badge";
  const name = inferName(alt, href);
  const title = `CogniFocus featured on ${name}`;
  const width = readAttribute(image, "width");
  const height = readAttribute(image, "height");

  return {
    href,
    label: title,
    title,
    className: `featured-strip-badge-${slugify(name)}`,
    img: {
      src,
      alt,
      title,
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
    },
  };
}

export async function appendBadge(file, badge) {
  const badges = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(badges)) throw new Error("Featured badge registry must contain an array.");

  const duplicate = badges.some(
    (existing) => existing.href === badge.href || existing.img?.src === badge.img.src,
  );
  if (duplicate) throw new Error("This featured badge already exists in the registry.");

  badges.push(badge);
  await writeFile(file, `${JSON.stringify(badges, null, 2)}\n`, "utf8");
}

async function readEmbedInput() {
  const file = process.argv[2];
  if (file) return readFile(file, "utf8");

  if (process.stdin.isTTY) {
    if (process.platform !== "win32") {
      throw new Error("Pipe badge HTML to this command or pass an HTML file path.");
    }
    return execFileSync(
      "powershell.exe",
      ["-NoProfile", "-Command", "Get-Clipboard -Raw"],
      { encoding: "utf8" },
    );
  }

  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

async function main() {
  const html = await readEmbedInput();
  const badge = parseBadgeEmbed(html);
  await appendBadge(registryPath, badge);
  console.log(`Added ${badge.title} to src/data/featured-badges.json`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error(`Could not add badge: ${error.message}`);
    process.exitCode = 1;
  });
}
