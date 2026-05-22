const BLOCK_TAGS = new Set(["ul", "ol", "blockquote"]);
const SHORTCODES = new Set(["cta", "related", "comparison"]);

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function isSafeUrl(value = "") {
  return /^(https?:\/\/|\/|#)/i.test(value);
}

function splitPipeColumns(value = "") {
  return String(value)
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseLinkPair(value = "") {
  const [label = "", href = ""] = splitPipeColumns(value);

  return {
    label,
    href,
  };
}

function renderInline(markdown = "") {
  let html = escapeHtml(markdown);

  html = html.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, rawSrc, rawTitle) => {
      const src = rawSrc.trim();

      if (!isSafeUrl(src)) {
        return escapeHtml(alt);
      }

      const title = rawTitle
        ? ` title="${escapeAttribute(rawTitle.trim())}"`
        : "";

      return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(
        alt,
      )}" loading="lazy"${title} />`;
    },
  );

  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, rawHref) => {
    const href = rawHref.trim();

    if (!isSafeUrl(href)) {
      return text;
    }

    return `<a href="${escapeAttribute(href)}">${text}</a>`;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  return html;
}

function closeOpenBlock(openBlock) {
  return openBlock ? `</${openBlock}>` : "";
}

function parseShortcodeBlock(lines, startIndex) {
  const opener = lines[startIndex].trim();
  const match = /^::([a-z]+)\s*$/.exec(opener);

  if (!match || !SHORTCODES.has(match[1])) {
    return null;
  }

  const name = match[1];
  const bodyLines = [];
  let endIndex = startIndex + 1;

  while (endIndex < lines.length) {
    const line = lines[endIndex];

    if (line.trim() === "::") {
      return { name, bodyLines, endIndex };
    }

    bodyLines.push(line);
    endIndex += 1;
  }

  return null;
}

function parseShortcodeFields(lines = []) {
  const fields = {};
  const items = [];
  const rows = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (/^-\s+/.test(line)) {
      items.push(line.replace(/^-\s+/, "").trim());
      continue;
    }

    if (line.includes("|") && line.startsWith("|") && line.endsWith("|")) {
      rows.push(
        line
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim()),
      );
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex !== -1) {
      const key = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      fields[key] = value;
      continue;
    }

    items.push(line);
  }

  return { fields, items, rows };
}

function renderShortcodeLink(value = "", className = "") {
  const { label, href } = parseLinkPair(value);

  if (!label || !href || !isSafeUrl(href)) {
    return "";
  }

  const classAttribute = className ? ` class="${className}"` : "";
  return `<a href="${escapeAttribute(href)}"${classAttribute}>${renderInline(label)}</a>`;
}

function renderCtaShortcode(lines = []) {
  const { fields } = parseShortcodeFields(lines);
  const title = fields.title || fields.heading || "Ready for the next session?";
  const body = fields.body || fields.copy || "";
  const primary = renderShortcodeLink(
    fields.primary,
    "btn btn-glow primary-cta",
  );
  const secondary = renderShortcodeLink(
    fields.secondary,
    "btn btn-outline-light hero-secondary-cta",
  );
  const actions = [primary, secondary].filter(Boolean).join("");

  return `
<section class="seo-cta-box blog-shortcode-cta" aria-label="Call to action">
  <h2>${renderInline(title)}</h2>
  ${body ? `<p class="hero-muted-override">${renderInline(body)}</p>` : ""}
  ${
    actions
      ? `<div class="d-flex flex-wrap gap-2">${actions}</div>`
      : ""
  }
</section>`.trim();
}

function renderRelatedShortcode(lines = []) {
  const { fields, items } = parseShortcodeFields(lines);
  const title = fields.title || "Related guides";
  const links = items
    .map((item) => parseLinkPair(item))
    .filter(({ label, href }) => label && href && isSafeUrl(href))
    .map(
      ({ label, href }) =>
        `<li><a href="${escapeAttribute(href)}">${renderInline(label)}</a></li>`,
    )
    .join("");

  if (!links) {
    return "";
  }

  return `
<section class="seo-related-guides blog-shortcode-related" aria-label="${escapeAttribute(
    title,
  )}">
  <h2>${renderInline(title)}</h2>
  <ul class="seo-related-list">
    ${links}
  </ul>
</section>`.trim();
}

function renderComparisonShortcode(lines = []) {
  const { fields, rows } = parseShortcodeFields(lines);
  const title = fields.title || "Quick comparison";
  const headings = splitPipeColumns(fields.columns || "");
  const validRows = rows.filter((row) => row.some(Boolean));

  if (headings.length < 2 || validRows.length === 0) {
    return "";
  }

  const headerHtml = headings.map((heading) => `<th scope="col">${renderInline(heading)}</th>`).join("");
  const bodyHtml = validRows
    .map((row) => {
      const cells = row.slice(0, headings.length);

      while (cells.length < headings.length) {
        cells.push("");
      }

      const [firstCell, ...otherCells] = cells;
      const renderedCells = otherCells
        .map((cell) => `<td>${renderInline(cell)}</td>`)
        .join("");

      return `<tr><th scope="row">${renderInline(firstCell)}</th>${renderedCells}</tr>`;
    })
    .join("");

  return `
<section class="blog-comparison-block" aria-label="${escapeAttribute(title)}">
  <h2>${renderInline(title)}</h2>
  <div class="blog-table-wrap">
    <table class="blog-markdown-table">
      <thead>
        <tr>${headerHtml}</tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  </div>
</section>`.trim();
}

function renderShortcode(name, lines = []) {
  if (name === "cta") {
    return renderCtaShortcode(lines);
  }

  if (name === "related") {
    return renderRelatedShortcode(lines);
  }

  if (name === "comparison") {
    return renderComparisonShortcode(lines);
  }

  return "";
}

function isTableSeparatorRow(line = "") {
  const trimmed = line.trim();

  return (
    trimmed.startsWith("|") &&
    trimmed.endsWith("|") &&
    trimmed
      .slice(1, -1)
      .split("|")
      .every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
  );
}

function parseMarkdownTable(lines, startIndex) {
  const headerLine = lines[startIndex]?.trim();
  const separatorLine = lines[startIndex + 1]?.trim();

  if (
    !headerLine ||
    !separatorLine ||
    !headerLine.startsWith("|") ||
    !headerLine.endsWith("|") ||
    !isTableSeparatorRow(separatorLine)
  ) {
    return null;
  }

  const headers = headerLine
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
  const rows = [];
  let endIndex = startIndex + 2;

  while (endIndex < lines.length) {
    const line = lines[endIndex].trim();

    if (!line || !line.startsWith("|") || !line.endsWith("|")) {
      break;
    }

    rows.push(
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim()),
    );
    endIndex += 1;
  }

  return {
    headers,
    rows,
    endIndex: endIndex - 1,
  };
}

function renderMarkdownTable(table) {
  const headerHtml = table.headers
    .map((heading) => `<th scope="col">${renderInline(heading)}</th>`)
    .join("");
  const bodyHtml = table.rows
    .map((row) => {
      const normalized = row.slice(0, table.headers.length);

      while (normalized.length < table.headers.length) {
        normalized.push("");
      }

      return `<tr>${normalized
        .map((cell) => `<td>${renderInline(cell)}</td>`)
        .join("")}</tr>`;
    })
    .join("");

  return `
<div class="blog-table-wrap">
  <table class="blog-markdown-table">
    <thead>
      <tr>${headerHtml}</tr>
    </thead>
    <tbody>
      ${bodyHtml}
    </tbody>
  </table>
</div>`.trim();
}

export function renderMarkdownToHtml(markdown = "") {
  const normalized = String(markdown || "").replace(/\r\n?/g, "\n").trim();

  if (!normalized) {
    return "";
  }

  const lines = normalized.split("\n");
  const html = [];
  let paragraph = [];
  let openBlock = "";

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    html.push(
      `<p class="hero-muted-override">${renderInline(paragraph.join(" "))}</p>`,
    );
    paragraph = [];
  };

  const switchBlock = (nextBlock) => {
    flushParagraph();

    if (openBlock && openBlock !== nextBlock) {
      html.push(closeOpenBlock(openBlock));
      openBlock = "";
    }

    if (nextBlock && !openBlock) {
      html.push(`<${nextBlock}>`);
      openBlock = nextBlock;
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (!trimmed) {
      flushParagraph();
      if (openBlock) {
        html.push(closeOpenBlock(openBlock));
        openBlock = "";
      }
      continue;
    }

    const shortcode = parseShortcodeBlock(lines, index);

    if (shortcode) {
      switchBlock("");
      const shortcodeHtml = renderShortcode(shortcode.name, shortcode.bodyLines);

      if (shortcodeHtml) {
        html.push(shortcodeHtml);
      }

      index = shortcode.endIndex;
      continue;
    }

    const table = parseMarkdownTable(lines, index);

    if (table) {
      switchBlock("");
      html.push(renderMarkdownTable(table));
      index = table.endIndex;
      continue;
    }

    const heading = /^(#{2,6})\s+(.+)$/.exec(trimmed);

    if (heading) {
      switchBlock("");
      html.push(
        `<h${heading[1].length}>${renderInline(heading[2])}</h${heading[1].length}>`,
      );
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);

    if (unordered) {
      switchBlock("ul");
      html.push(`<li>${renderInline(unordered[1])}</li>`);
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);

    if (ordered) {
      switchBlock("ol");
      html.push(`<li>${renderInline(ordered[1])}</li>`);
      continue;
    }

    const quote = /^>\s+(.+)$/.exec(trimmed);

    if (quote) {
      switchBlock("blockquote");
      html.push(`<p>${renderInline(quote[1])}</p>`);
      continue;
    }

    if (openBlock) {
      html.push(closeOpenBlock(openBlock));
      openBlock = "";
    }

    paragraph.push(trimmed);
  }

  flushParagraph();

  if (openBlock) {
    html.push(closeOpenBlock(openBlock));
  }

  return html.join("\n");
}
