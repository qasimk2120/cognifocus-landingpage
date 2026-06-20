import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { appendBadge, parseBadgeEmbed } from "./add-featured-badge.mjs";

const huzzlerEmbed = `<a href="[https://huzzler.so/products/VLxT9cMVTF/cognifocus?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing](https://huzzler.so/products/VLxT9cMVTF/cognifocus?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing)" target="_blank" rel="noopener noreferrer">
  <img alt="Huzzler Embed Badge" src="[https://huzzler.so/assets/images/embeddable-badges/featured.png](https://huzzler.so/assets/images/embeddable-badges/featured.png)" width="159" height="55" />
</a>`;

test("parses a pasted badge embed and normalizes wrapped URLs", () => {
  assert.deepEqual(parseBadgeEmbed(huzzlerEmbed), {
    href: "https://huzzler.so/products/VLxT9cMVTF/cognifocus?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing",
    label: "CogniFocus featured on Huzzler",
    title: "CogniFocus featured on Huzzler",
    className: "featured-strip-badge-huzzler",
    img: {
      src: "https://huzzler.so/assets/images/embeddable-badges/featured.png",
      alt: "Huzzler Embed Badge",
      title: "CogniFocus featured on Huzzler",
      width: "159",
      height: "55",
    },
  });
});

test("rejects embeds without both a link and image", () => {
  assert.throws(
    () => parseBadgeEmbed('<a href="https://example.com">Example</a>'),
    /must contain an <img>/,
  );
});

test("appends a badge once and rejects duplicate URLs", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "featured-badges-"));
  const file = path.join(directory, "featured-badges.json");
  await writeFile(file, "[]\n", "utf8");
  const badge = parseBadgeEmbed(huzzlerEmbed);

  await appendBadge(file, badge);
  const saved = JSON.parse(await readFile(file, "utf8"));
  assert.deepEqual(saved, [badge]);

  await assert.rejects(() => appendBadge(file, badge), /already exists/);
});
