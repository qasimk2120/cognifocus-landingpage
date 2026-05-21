const BLOCK_TAGS = new Set(["ul", "ol", "blockquote"]);

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

export function renderMarkdownToHtml(markdown = "") {
  const normalized = String(markdown || "").replace(/\r\n?/g, "\n").trim();

  if (!normalized) {
    return "";
  }

  const html = [];
  let paragraph = [];
  let openBlock = "";

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    html.push(`<p class="hero-muted-override">${renderInline(paragraph.join(" "))}</p>`);
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

  for (const line of normalized.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const heading = /^(#{2,4})\s+(.+)$/.exec(trimmed);

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

    if (openBlock && !BLOCK_TAGS.has(openBlock)) {
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
