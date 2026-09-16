/** Small GFM subset: headings, tables, lists, fences, quotes, inline marks. */

const DOC_HREF: Record<string, string> = {
  "DATA_TRUST.md": "/docs/data-trust",
  "VALUATION.md": "/docs/valuation",
  "FCC_REFRESH.md": "/docs/fcc-refresh",
};

const CLASS_MARK = /^(?:[VMSB](?:\/[VMSB])*)$/;

export type TocItem = { id: string; label: string; sub?: boolean };

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_\[\]()]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function stripFirstH1(md: string): string {
  return md.replace(/^# [^\n]+\n+/, "");
}

export function rewriteDocHref(href: string): string {
  const trimmed = href.trim();
  const file = trimmed.replace(/^\.\//, "").split("/").pop() ?? trimmed;
  return DOC_HREF[file] ?? trimmed;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function extractToc(md: string): TocItem[] {
  const items: TocItem[] = [];
  const seen = new Set<string>();
  for (const line of md.replace(/\r\n/g, "\n").split("\n")) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!m) continue;
    const label = m[2].replace(/[*`]/g, "").trim();
    let id = slugify(label) || "section";
    if (seen.has(id)) {
      let n = 2;
      while (seen.has(`${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    seen.add(id);
    items.push({ id, label, sub: m[1].length === 3 });
  }
  return items;
}

export function renderInline(text: string): string {
  const placeholders: string[] = [];
  const stash = (html: string): string => {
    const token = `\u0000${placeholders.length}\u0000`;
    placeholders.push(html);
    return token;
  };

  let s = text.replace(/\\([\\`*_[\]()])/g, (_m, ch: string) => stash(escapeHtml(ch)));

  s = s.replace(/`([^`]+)`/g, (_m, code: string) =>
    stash(`<code>${escapeHtml(code)}</code>`),
  );

  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => {
    const dest = rewriteDocHref(href);
    const extra = /^https?:\/\//.test(dest)
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
    return stash(
      `<a href="${escapeHtml(dest)}"${extra}>${renderInline(label)}</a>`,
    );
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, (_m, inner: string) => {
    const body = renderInline(inner);
    if (CLASS_MARK.test(inner.trim())) {
      const cls = classMarkClass(inner.trim()[0]);
      return stash(`<strong class="${cls}">${body}</strong>`);
    }
    return stash(`<strong>${body}</strong>`);
  });

  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, (_m, pre: string, inner: string) =>
    `${pre}${stash(`<em>${renderInline(inner)}</em>`)}`,
  );

  s = escapeHtml(s).replace(/\u0000(\d+)\u0000/g, (_m, i: string) => placeholders[Number(i)]);
  return s;
}

function renderClassOrInline(text: string): string {
  const trimmed = text.trim();
  if (CLASS_MARK.test(trimmed)) {
    const cls = classMarkClass(trimmed[0]);
    return `<span class="${cls}">${escapeHtml(trimmed)}</span>`;
  }
  return renderInline(text);
}

function classMarkClass(ch: string): string {
  if (ch === "V") return "docs-mark docs-mark-v";
  if (ch === "M") return "docs-mark docs-mark-m";
  if (ch === "S") return "docs-mark docs-mark-s";
  return "docs-mark docs-mark-b";
}

function splitTableRow(line: string): string[] {
  let inner = line.trim();
  if (inner.startsWith("|")) inner = inner.slice(1);
  if (inner.endsWith("|")) inner = inner.slice(0, -1);
  const cells: string[] = [];
  let cur = "";
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "\\" && inner[i + 1] === "|") {
      cur += "|";
      i += 1;
      continue;
    }
    if (inner[i] === "|") {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += inner[i];
  }
  cells.push(cur.trim());
  return cells;
}

function isSeparatorRow(line: string): boolean {
  if (!line.includes("|") && !line.includes("-")) return false;
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s/g, "")));
}

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.includes("|", 1);
}

type ListItem = { ordered: boolean; n: number; text: string; children: ListItem[] };

function listMarker(line: string): { indent: number; ordered: boolean; n: number; text: string } | null {
  const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line);
  if (!m) return null;
  const ordered = /^\d+\.$/.test(m[2]);
  const n = ordered ? Number(m[2].slice(0, -1)) : 0;
  return { indent: m[1].replace(/\t/g, "    ").length, ordered, n, text: m[3] };
}

function renderList(items: ListItem[]): string {
  if (items.length === 0) return "";
  const tag = items[0].ordered ? "ol" : "ul";
  const start = items[0].ordered && items[0].n > 1 ? ` start="${items[0].n}"` : "";
  const body = items
    .map((item) => {
      const nested = item.children.length ? renderList(item.children) : "";
      return `<li><p>${renderInline(item.text)}</p>${nested}</li>`;
    })
    .join("");
  return `<${tag}${start}>${body}</${tag}>`;
}

function parseListBlock(lines: string[], start: number): { html: string; next: number } {
  const roots: ListItem[] = [];
  const stack: { indent: number; item: ListItem }[] = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      if (i + 1 < lines.length && listMarker(lines[i + 1])) {
        i += 1;
        continue;
      }
      break;
    }
    const marker = listMarker(line);
    if (marker) {
      const item: ListItem = {
        ordered: marker.ordered,
        n: marker.n,
        text: marker.text,
        children: [],
      };
      while (stack.length && marker.indent < stack[stack.length - 1].indent) {
        stack.pop();
      }
      if (stack.length && marker.indent > stack[stack.length - 1].indent) {
        stack[stack.length - 1].item.children.push(item);
      } else {
        roots.push(item);
      }
      stack.push({ indent: marker.indent, item });
      i += 1;
      continue;
    }
    const indent = /^(\s+)/.exec(line)?.[1].replace(/\t/g, "    ").length ?? 0;
    if (indent >= 2 && stack.length) {
      stack[stack.length - 1].item.text += ` ${line.trim()}`;
      i += 1;
      continue;
    }
    break;
  }

  return { html: renderList(roots), next: i };
}

function parseTable(lines: string[], start: number): { html: string; next: number } | null {
  if (start + 1 >= lines.length) return null;
  if (!isTableRow(lines[start]) || !isSeparatorRow(lines[start + 1])) return null;
  const headers = splitTableRow(lines[start]);
  const rows: string[][] = [];
  let i = start + 2;
  while (i < lines.length && isTableRow(lines[i]) && !isSeparatorRow(lines[i])) {
    rows.push(splitTableRow(lines[i]));
    i += 1;
  }
  const thead = `<thead><tr>${headers.map((h) => `<th>${renderInline(h)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map((cells) => {
      const padded = headers.map((_, idx) => cells[idx] ?? "");
      return `<tr>${padded.map((c) => `<td>${renderClassOrInline(c)}</td>`).join("")}</tr>`;
    })
    .join("")}</tbody>`;
  return {
    html: `<div class="table-wrap"><table>${thead}${tbody}</table></div>`,
    next: i,
  };
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  const headingIds = new Set<string>();
  let i = 0;

  const uniqueHeadingId = (label: string): string => {
    let id = slugify(label) || "section";
    if (headingIds.has(id)) {
      let n = 2;
      while (headingIds.has(`${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    headingIds.add(id);
    return id;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const fence: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        fence.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      out.push(`<pre><code>${escapeHtml(fence.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const depth = heading[1].length;
      const label = heading[2].replace(/[*`]/g, "").trim();
      const id = uniqueHeadingId(label);
      out.push(`<h${depth} id="${id}">${renderInline(heading[2])}</h${depth}>`);
      i += 1;
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      out.push(`<blockquote><p>${renderInline(quote.join(" "))}</p></blockquote>`);
      continue;
    }

    const table = parseTable(lines, i);
    if (table) {
      out.push(table.html);
      i = table.next;
      continue;
    }

    if (listMarker(line)) {
      const list = parseListBlock(lines, i);
      out.push(list.html);
      i = list.next;
      continue;
    }

    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === "") break;
      if (l.trim().startsWith("```")) break;
      if (/^#{1,3}\s+/.test(l)) break;
      if (l.trim().startsWith(">")) break;
      if (listMarker(l)) break;
      if (i + 1 < lines.length && isTableRow(l) && isSeparatorRow(lines[i + 1])) break;
      para.push(l.trim());
      i += 1;
    }
    if (para.length) {
      out.push(`<p>${renderInline(para.join(" "))}</p>`);
    }
  }

  return out.join("\n");
}
