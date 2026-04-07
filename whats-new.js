function escapeHtml(value) {
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

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdownToHtml(markdown) {
  if (!markdown || !markdown.trim()) {
    return "<p>No detailed notes were provided for this update yet.</p>";
  }

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let inList = false;
  let listType = "ul";
  let inCodeBlock = false;
  let codeBuffer = [];
  let paragraphBuffer = [];

  function flushParagraph() {
    if (paragraphBuffer.length === 0) return;
    html.push(`<p>${inlineMarkdown(paragraphBuffer.join(" "))}</p>`);
    paragraphBuffer = [];
  }

  function flushList() {
    if (!inList) return;
    html.push(`</${listType}>`);
    inList = false;
  }

  function flushCodeBlock() {
    if (!inCodeBlock) return;
    html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
    inCodeBlock = false;
    codeBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();

      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${inlineMarkdown(quoteMatch[1])}</blockquote>`);
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);

    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      const nextListType = unorderedMatch ? "ul" : "ol";
      const itemText = unorderedMatch ? unorderedMatch[1] : orderedMatch[1];

      if (!inList || listType !== nextListType) {
        flushList();
        listType = nextListType;
        html.push(`<${listType}>`);
        inList = true;
      }

      html.push(`<li>${inlineMarkdown(itemText)}</li>`);
      continue;
    }

    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushCodeBlock();

  return html.join("");
}

function formatDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function updateMetaHtml(update, isLatest) {
  const parts = [];

  if (isLatest) {
    parts.push('<span class="release-badge">Latest</span>');
  }

  if (update.version) {
    parts.push(`<span class="release-tag">${escapeHtml(update.version)}</span>`);
  }

  if (update.category) {
    parts.push(
      `<span class="release-status">${escapeHtml(update.category)}</span>`,
    );
  }

  parts.push(
    `<span class="release-status">${escapeHtml(formatDate(update.date))}</span>`,
  );

  return parts.join("");
}

function createUpdateCard(update, options) {
  const notesHtml = markdownToHtml(update.notes || "");
  const card = document.createElement("article");
  card.className = options.compact ? "release-card-compact" : "release-card";

  const actions = [];
  actions.push(
    '<button type="button" class="release-toggle-btn" aria-expanded="false">Read detailed notes</button>',
  );

  if (update.link && update.linkLabel) {
    actions.push(
      `<a class="release-link-btn" href="${escapeHtml(update.link)}" target="_blank" rel="noopener">${escapeHtml(update.linkLabel)}</a>`,
    );
  }

  card.innerHTML = `
    <div class="release-meta">${updateMetaHtml(update, Boolean(options.latest))}</div>
    <h3>${escapeHtml(update.title)}</h3>
    <p class="release-summary">${escapeHtml(update.summary || "")}</p>
    <div class="release-actions">${actions.join("")}</div>
    <div class="release-details" hidden>
      <div class="release-notes">${notesHtml}</div>
    </div>
  `;

  const toggleBtn = card.querySelector(".release-toggle-btn");
  const details = card.querySelector(".release-details");

  toggleBtn.addEventListener("click", () => {
    const willOpen = details.hasAttribute("hidden");
    details.toggleAttribute("hidden", !willOpen);
    details.classList.toggle("is-open", willOpen);
    toggleBtn.classList.toggle("is-open", willOpen);
    toggleBtn.setAttribute("aria-expanded", String(willOpen));
    toggleBtn.textContent = willOpen
      ? "Hide detailed notes"
      : "Read detailed notes";
  });

  return card;
}

async function fetchUpdates(source) {
  const response = await fetch(source, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Updates feed returned ${response.status}`);
  }

  const updates = await response.json();
  return Array.isArray(updates) ? updates : [];
}

function renderError(container, message) {
  container.innerHTML = `<div class="error-state-card">${escapeHtml(message)}</div>`;
}

window.addEventListener("DOMContentLoaded", async () => {
  if (typeof window.animateFaces === "function") {
    window.animateFaces();
  }

  const source = document.body.dataset.updatesSrc || "updates.json";
  const latestContainer = document.getElementById("latestRelease");
  const historyContainer = document.getElementById("releaseHistory");

  if (!latestContainer || !historyContainer) return;

  try {
    const updates = await fetchUpdates(source);

    if (updates.length === 0) {
      const emptyHtml =
        '<div class="empty-state-card">No updates have been published yet. Add your first entry to <code>updates.json</code> and it will appear here.</div>';
      latestContainer.innerHTML = emptyHtml;
      historyContainer.innerHTML = emptyHtml;
      return;
    }

    latestContainer.innerHTML = "";
    latestContainer.appendChild(
      createUpdateCard(updates[0], { latest: true, compact: false }),
    );

    const history = updates.slice(1);
    historyContainer.innerHTML = "";

    if (history.length === 0) {
      historyContainer.innerHTML =
        '<div class="empty-state-card">This is the first documented update in the changelog. New entries added to <code>updates.json</code> will appear here automatically.</div>';
      return;
    }

    history.forEach((update) => {
      historyContainer.appendChild(
        createUpdateCard(update, { latest: false, compact: true }),
      );
    });
  } catch (error) {
    const fallbackMessage =
      "We couldn't load the changelog right now. Please try again shortly.";
    renderError(latestContainer, fallbackMessage);
    renderError(historyContainer, fallbackMessage);
  }
});
