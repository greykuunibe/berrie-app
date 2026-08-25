import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DOMPurify from "dompurify";
import { Button, ButtonTrigger, ResourceCard, EmptyState, Loading, CommentaryShader } from "@components/primitives";
import { Icon } from "@components/primitives/Icons";
import { Input } from "@components/primitives/Form/Input";
import { Commentary, Lexicon, CrossRef, Map as MapIcon, OpenPanel, Search, Account, Info, Clock } from "@Icons";
import { useResourcesStore } from "@/stores/resources.store";
import { useBibleStore } from "@/stores/bible.store";
import { fetchChapters, fetchVerses } from "@/lib/bible.service";
import type { Resource } from "@/types";

// Allowed tags and attributes for commentary HTML
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ["p","br","b","strong","em","i","u","h1","h2","h3","h4","span","sup","div","ul","ol","li","blockquote","a"],
  ALLOWED_ATTR: ["class","style","dir"],
} satisfies Parameters<typeof DOMPurify.sanitize>[1];

// Splits overly long <p> blocks into readable 2-sentence chunks
function splitLongParagraphs(html: string): string {
  const OPENER = [
    "For","But","Now","Hence","Therefore","Moreover","Indeed","Thus",
    "Although","Yet","Meanwhile","Besides","Furthermore","Again","Nor",
    "Neither","Whence","Since","Because","Unless","If","When","While",
    "This","That","These","Those","The","We","He","She","It","They",
    "God","Moses","Aaron","Christ","Our","His","Her","Their",
    "First","Secondly","Lastly","Finally","In","On","At","By","With",
    "Let","So","True","What","Where","Who","How","As","And","A",
  ].join("|");
  const SPLIT = new RegExp(`(?<=\\.\\s{0,2})\\s+(?=(?:${OPENER})\\b)`, "g");

  return html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, inner) => {
    const textLen = inner.replace(/<[^>]+>/g, "").length;
    if (textLen < 350) return match;

    const parts = inner.split(SPLIT).filter(Boolean);
    if (parts.length <= 1) return match;

    const groups: string[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      const chunk = parts.slice(i, i + 2).join(" ").trim();
      if (chunk) groups.push(chunk);
    }

    return groups.map(g => `<p${attrs}>${g}</p>`).join("");
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Converts raw commentary content (HTML or plain text) into processed HTML ready to render
function prepareContent(raw: string): string {
  const isHtmlContent = /<[a-z][\s\S]*>/i.test(raw);

  let html: string;
  if (isHtmlContent) {
    html = DOMPurify.sanitize(raw, PURIFY_CONFIG);
  } else {
    // Plain text: split on double newlines where they exist, then wrap
    const chunks = raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    html = (chunks.length > 1 ? chunks : [raw.trim()])
      .map(c => `<p>${escapeHtml(c)}</p>`)
      .join("");
  }

  return transformCommentaryHtml(html);
}

// Detects consecutive <p> blocks that look like list items and wraps them in <ol>/<ul>
function detectLists(html: string): string {
  // Inline sequential lists inside a single <p>: "1. item 2. item 3. item"
  html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (_m: string, attrs: string, inner: string) => {
    // Must start with "1. " followed by an uppercase letter — rules out "ver. 1." etc.
    if (!/\b1\.\s+[A-Z]/.test(inner)) return _m;

    // Extract the actual numbers at each split point and verify STRICT INCREMENT
    // — verse translation pairs repeat numbers (1,1,2,2) and must not be lists
    const splitNums = [...inner.matchAll(/(?<![.\d])\b(\d+)\.\s+(?=[A-Z])/g)].map(m => parseInt(m[1]));
    if (splitNums.length < 2) return _m;
    if (splitNums[0] !== 1 || !splitNums.every((n, i) => i === 0 || n === splitNums[i - 1] + 1)) return _m;

    const parts = inner.split(/(?<![.\d])\b\d+\.\s+(?=[A-Z])/);
    if (parts.length < 3) return _m;

    const prefix = parts[0].trim();
    const rawItems = parts.slice(1);
    if (rawItems.length < 2) return _m;

    const cleanedItems: string[] = [];
    let remainder = "";

    rawItems.forEach((item: string, i: number) => {
      const trimmed = item.trim();
      // Terminate at:
      //   • semicolons (always a list-item boundary)
      //   • period / ! / ? only when followed by uppercase or end-of-string
      //     (prevents abbreviations like "viz." or "e.g." from ending items early)
      const end = trimmed.match(/^([\s\S]*?(?:;|[.!?](?=\s+[A-Z]|\s*$)))(?:\s|$)/);
      if (end) {
        cleanedItems.push(end[1].trim());
        if (i === rawItems.length - 1) remainder = trimmed.slice(end[0].length).trim();
      } else {
        cleanedItems.push(trimmed);
      }
    });

    if (cleanedItems.length < 2) return _m;
    const norm = (t: string) => t.replace(/\s+/g, " ").trim();
    const rows = cleanedItems.map((t: string, i: number) =>
      `<div style="display:flex;gap:10px;margin-bottom:4px"><span style="min-width:20px;font-weight:500;flex-shrink:0">${i + 1}.</span><span>${norm(t)}</span></div>`
    ).join("");
    const list = `<div style="margin:8px 0 12px 0">${rows}</div>`;
    let result = prefix ? `<p${attrs}>${norm(prefix)}</p>${list}` : list;
    if (remainder) result += `<p${attrs}>${norm(remainder)}</p>`;
    return result;
  });

  // Ordered: separate <p> blocks starting with (1), 1), or 1. (≤ 300 chars each)
  html = html.replace(
    /(<p[^>]*>\s*(?:\(\d+\)|\d+[\).])\s+(?:[^<]{1,300})<\/p>\s*){2,}/g,
    match => {
      const nums = [...match.matchAll(/<p[^>]*>\s*(?:\((\d+)\)|(\d+)[\).])/g)]
        .map(m => parseInt(m[1] ?? m[2]));
      // Reject repeated numbers — those are verse+translation pairs, not lists
      if (nums[0] !== 1 || !nums.every((n, i) => i === 0 || n === nums[i - 1] + 1)) return match;
      const items = [...match.matchAll(/<p[^>]*>\s*(?:\(\d+\)|\d+[\).])\s+([\s\S]*?)<\/p>/g)];
      if (items.length < 2) return match;
      const rows = items.map((m, i) =>
        `<div style="display:flex;gap:10px;margin-bottom:4px"><span style="min-width:20px;font-weight:500;flex-shrink:0">${i + 1}.</span><span>${m[1].replace(/\s+/g, " ").trim()}</span></div>`
      ).join("");
      return `<div style="margin:8px 0 12px 0">${rows}</div>`;
    }
  );

  // Unordered: paragraphs starting with –, —, •, or * (short items ≤ 300 chars)
  html = html.replace(
    /(<p[^>]*>\s*[–—•\*]\s+(?:[^<]{1,300})<\/p>\s*){2,}/g,
    match => {
      const items = [...match.matchAll(/<p[^>]*>\s*[–—•\*]\s+([\s\S]*?)<\/p>/g)];
      if (items.length < 2) return match;
      return `<ul>${items.map(m => `<li>${m[1].trim()}</li>`).join("")}</ul>`;
    }
  );

  return html;
}

// Latin detection for theological commentary.
// franc cannot distinguish Latin from Romance languages (they share trigrams).
// Unicode ranges don't help (Latin shares the alphabet with English/French/etc.).
// The reliable signal is structural: Calvin's Latin verse translations always
// follow the same pattern — short numbered paragraphs that end in Latin
// inflectional endings absent from English/French/Spanish/Portuguese.
// We use the -que enclitic and verb/noun endings as a lightweight classifier.
function isLikelyLatin(text: string): boolean {
  const clean = text.replace(/<[^>]+>/g, " ").trim().toLowerCase();
  if (clean.length < 10) return false;

  // Bail immediately on clear English openers
  const first = clean.split(/\s/)[0].replace(/\W/g, "");
  if (/^(but|and|the|a|we|he|she|it|they|for|now|this|that|if|when|since|however|therefore|moreover|hence|thus|although|yet|so|not|nor|our|his|her|their|its|with|by|from|to|at|on|of|is|are|was|were|been|has|have|had|do|does|did|there|here|then|than|also|only|even|still)$/.test(first)) return false;

  // Latin-exclusive signals: -que enclitic, verb paradigm endings
  const latinExclusive = (clean.match(/\b\w+que\b|\b\w+(tur|ntur|amus|imus|atis|itis|untur|antur|abat|ebant|erat|erant|erit|erint|isse|andi|endi|ando|endo|unto|esto|etur|itur)\b/g) || []).length;

  // English-exclusive signals: derivational suffixes absent from Latin
  const englishExclusive = (clean.match(/\b\w+(ing|tion|ness|ment|ful|less|able|ible|ward|ship|hood)\b/g) || []).length;

  if (englishExclusive > 0) return false;
  return latinExclusive >= 1;
}

// Mark paragraphs as Latin, footnote definitions, or scholarly notes
function classifyParagraphs(html: string): string {
  const LATIN_STYLE = `font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#202020;`;

  // Step 1: Detect quoted Latin FIRST so multi-line quotes are wrapped as one unit
  // before line-level processing splits them apart
  html = html.replace(
    /[“”"]([^“”"]{15,600})[“”"](?:\s*[-\u2013\u2014]\s*([^<\n]{3,80}))?/g,
    (_m: string, quoted: string, citation: string) => {
      const text = quoted.replace(/<[^>]+>/g, " ");
      if (!isLikelyLatin(text)) return _m;
      const cite = citation
        ? ` <span style="font-size:0.85em;opacity:0.7">— ${citation}</span>`
        : "";
      return `<span style="${LATIN_STYLE}display:block;margin:6px 0">${quoted}${cite}</span>`;
    },
  );

  // Step 2: Line-level processing — each \n-separated line classified independently
  // so bilingual verse translations (English line / Latin line) get correct styling
  html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (_m, attrs, inner) => {
    const lines = inner.split(/\n/);
    if (lines.length > 1) {
      const processed = lines.map((line: string) => {
        const text = line.replace(/<[^>]+>/g, "").trim();
        if (text.length < 10) return line;
        return isLikelyLatin(text)
          ? `<span style="${LATIN_STYLE}display:block">${line}</span>`
          : line;
      });
      return `<p${attrs}>${processed.join("\n")}</p>`;
    }
    const text = inner.replace(/<[^>]+>/g, "");
    if (isLikelyLatin(text)) return `<p${attrs} style="${LATIN_STYLE}">${inner}</p>`;
    return `<p${attrs}>${inner}</p>`;
  });

  // Footnote definitions: short paragraphs starting with [N] reference
  html = html.replace(
    /<p([^>]*)>\s*<sup[^>]*>\[(\d+)\]<\/sup>([\s\S]*?)<\/p>/gi,
    (_m, attrs, num, rest) =>
      `<p${attrs} class="c-footnote"><sup style="font-size:0.75em;color:#3d89f1;font-weight:600">[${num}]</sup>${rest}</p>`,
  );

  // Parenthetical (Note: ...) blocks
  html = html.replace(
    /\(Note:\s*([\s\S]*?)\)/g,
    '<span class="c-note">Note: $1</span>',
  );

  return html;
}

// Post-sanitization transformer — adds presentational markup the raw content lacks
function transformCommentaryHtml(html: string): string {
  // 0. Break large paragraph blocks into readable 2-sentence chunks
  html = splitLongParagraphs(html);

  // 0b. Convert list-like paragraph sequences to proper <ol>/<ul>
  html = detectLists(html);

  // 1a. Section headers — standalone <p> matching "Verses X–Y" or "Verse X [...]"
  html = html.replace(
    /(<p[^>]*>)\s*(Verses?\s+\d+(?:[–\-–]\d+)?(?:\s*\([^<)]+\))?)\s*(<\/p>)/gi,
    '<p style="font-size:1.1em;font-weight:600;margin-top:1.5em;color:#202020">$2</p>',
  );

  // 1b. All-caps section headings: "THE INCONVENIENCE OF THE INHERITANCE. (Num 36:1-13)"
  html = html.replace(/<p([^>]*)>\s*([^<]{5,120})\s*<\/p>/gi, (match, attrs, text) => {
    const t = text.trim();
    const words = t.split(/\s+/);
    const capsWords = words.filter((w: string) => /^[A-Z][A-Z0-9,.'()-]*$/.test(w) && w.length > 1);
    if (capsWords.length >= 2 && capsWords.length / words.length >= 0.65) {
      return `<p${attrs} style="font-size:1em;font-weight:700;letter-spacing:0.04em;margin-top:1.5em;color:#202020">${t}</p>`;
    }
    return match;
  });

  // 1c. Navigation / cross-reference lines: "Next: Deuteronomy Introduction"
  html = html.replace(
    /(<p[^>]*>)\s*(Next:\s+[^<]{1,120})\s*(<\/p>)/gi,
    '<p style="font-size:0.875em;color:#838383;font-style:italic;margin-top:0.25em">$2</p>',
  );

  // 2. Footnote inline refs: [271] → styled superscript
  html = html.replace(
    /\[(\d+)\]/g,
    '<sup style="font-size:0.7em;color:#3d89f1;font-weight:600;cursor:default">[$1]</sup>',
  );

  // 3. Classify paragraphs: Latin, footnote definitions, scholarly notes
  html = classifyParagraphs(html);

  // 5. Hebrew: serif italic, text-primary; transliteration muted italic
  html = html.replace(
    /([֐-׿יִ-ﭏ]+)(\s+([a-z][a-zà-ÿ'-]{1,30}))?/g,
    function(_m: string, script: string, _ws: string, translit: string) {
      var s = '<span style="font-family:Georgia,serif;font-style:italic;color:#202020;direction:rtl;unicode-bidi:isolate">' + script + '</span>';
      return translit ? s + ' <span style="font-family:Georgia,serif;font-style:italic;color:#838383;font-size:0.9em">' + translit + '</span>' : s;
    }
  );

  // 6. Greek: serif italic, text-primary; transliteration muted italic
  html = html.replace(
    /([Ͱ-Ͽἀ-῿]+)(\s+([a-z][a-zà-ÿ'-]{1,30}))?/g,
    function(_m: string, script: string, _ws: string, translit: string) {
      var s = '<span style="font-family:Georgia,serif;font-style:italic;color:#202020">' + script + '</span>';
      return translit ? s + ' <span style="font-family:Georgia,serif;font-style:italic;color:#838383;font-size:0.9em">' + translit + '</span>' : s;
    }
  );

  // 7. Verse references → dotted underline + data-ref for hover lookup
  html = html.replace(
    /\b((?:\d+\s+)?[A-Z][a-z]{1,12}\.?\s+\d{1,3}:\d{1,3}(?:\s*[-–]\s*\d{1,3})?)\b/g,
    (match) => `<span class="verse-ref" data-ref="${match.replace(/"/g, "&quot;")}">${match}</span>`,
  );

  return html;
}

// ── Verse reference hover lookup ──────────────────────────────────────────────

const _verseCache = new Map<string, string | null>();

async function lookupVerseRef(refText: string): Promise<string | null> {
  if (_verseCache.has(refText)) return _verseCache.get(refText)!;

  const m = refText.match(/^((?:\d+\s+)?[A-Z][a-z.]+)\s+(\d+):(\d+)/);
  if (!m) { _verseCache.set(refText, null); return null; }

  const [, bookPart, chStr, vStr] = m;
  const chNum = parseInt(chStr);
  const vNum  = parseInt(vStr);
  const query = bookPart.replace(/\./g, "").trim().toLowerCase();

  const { books, activeTranslation } = useBibleStore.getState();
  const book = books.find(b =>
    b.name.toLowerCase().startsWith(query) ||
    (b.abbreviation ?? "").toLowerCase() === query,
  );
  if (!book || !activeTranslation) { _verseCache.set(refText, null); return null; }

  try {
    const chapters = await fetchChapters(book.id);
    const ch = chapters.find(c => c.number === chNum);
    if (!ch) { _verseCache.set(refText, null); return null; }
    const verses = await fetchVerses(ch.id, activeTranslation.id);
    const v = verses.find(vv => vv.number === vNum);
    const result = v?.text ?? null;
    _verseCache.set(refText, result);
    return result;
  } catch {
    _verseCache.set(refText, null);
    return null;
  }
}

// ── Verse reference popover ───────────────────────────────────────────────────

function VerseRefPopover({
  refText, text, loading, top, left,
}: {
  refText: string; text: string | null; loading: boolean;
  top: number; left: number;
}) {
  return createPortal(
    <div
      data-verse-popover="true"
      className="fixed z-[2000] bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl p-4 w-80 max-w-[90vw]"
      style={{ top, left, transform: "translate(-50%, calc(-100% - 8px))" }}
    >
      <p className="text-xs font-semibold text-text-brand mb-2">{refText}</p>
      {loading ? (
        <p className="text-xs text-text-muted">Loading…</p>
      ) : text ? (
        <p className="text-sm text-text-primary leading-relaxed">{text}</p>
      ) : (
        <p className="text-xs text-text-muted">Verse not found</p>
      )}
    </div>,
    document.body,
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────

type PanelTab = "all" | "commentary" | "lexicon" | "concordance" | "maps";

const TABS: { value: PanelTab; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { value: "commentary",  label: "Commentary",  icon: Commentary },
  { value: "lexicon",     label: "Lexicon",     icon: Lexicon   },
  { value: "concordance", label: "Concordance", icon: CrossRef  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveAbbr(name: string): string {
  const words = name.split(/\s+/).filter(w => w.length > 2);
  if (!words.length) return name.slice(0, 3).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map(w => w[0]).join("").toUpperCase();
}

// ── Resource selector dropdown ────────────────────────────────────────────────

function ResourceSelectorMenu({
  items,
  selectedId,
  onSelect,
  onClose,
  pos,
}: {
  items: Resource[];
  selectedId?: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  pos: { top: number; left: number };
}) {
  const { isResourceLocal, downloadResource, removeResource } = useResourcesStore();
  return createPortal(
    <>
      <div className="fixed inset-0 z-[1000]" onClick={onClose} />
      <div
        className="fixed z-[1001] flex flex-col gap-1 p-1 bg-surface-1 border border-border-gray-1 element-box-shadow rounded-xl w-80 max-h-80 overflow-y-auto"
        style={{ top: pos.top, left: pos.left }}
      >
        {items.map(r => (
          <ResourceCard
            key={r.id}
            abbr={deriveAbbr(r.name)}
            title={r.name}
            subtitle={r.description ?? r.license ?? undefined}
            isSelected={r.id === selectedId}
            isLocal={isResourceLocal(r.id)}
            onSelect={() => { onSelect(r.id); onClose(); }}
            onDownload={() => downloadResource(r.id)}
            onRemove={() => removeResource(r.id)}
          />
        ))}
      </div>
    </>,
    document.body,
  );
}

// ── Resource grid ────────────────────────────────────────────────────────────

function ResourceGrid({ items }: { items: Resource[] }) {
  const { isResourceLocal, downloadResource, removeResource } = useResourcesStore();
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map(r => (
        <ResourceCard
          key={r.id}
          abbr={deriveAbbr(r.name)}
          title={r.name}
          subtitle={r.description ?? r.license ?? undefined}
          variant="elevated"
          isLocal={isResourceLocal(r.id)}
          onDownload={() => downloadResource(r.id)}
          onRemove={() => removeResource(r.id)}
        />
      ))}
    </div>
  );
}

// ── Commentary content ────────────────────────────────────────────────────────

function CommentaryContent({ hasCommentaryResources }: { hasCommentaryResources: boolean }) {
  const commentaryEntries  = useResourcesStore(s => s.commentaryEntries);
  const isLoadingCommentary = useResourcesStore(s => s.isLoadingCommentary);
  const activeCommentaryId = useResourcesStore(s => s.activeCommentaryId);
  const commentaries       = useResourcesStore(s => s.commentaries);
  const resources          = useResourcesStore(s => s.resources);

  const contentWrapRef = useRef<HTMLDivElement>(null);
  const closeTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popover, setPopover] = useState<{
    refText: string; text: string | null; loading: boolean; top: number; left: number;
  } | null>(null);

  // Open popover on hover over a verse-ref
  useEffect(() => {
    const el = contentWrapRef.current;
    if (!el) return;
    async function onOver(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest(".verse-ref");
      if (!target) return;
      const ref = target.getAttribute("data-ref") ?? "";
      const rect = target.getBoundingClientRect();
      setPopover({ refText: ref, text: null, loading: true, top: rect.top, left: rect.left + rect.width / 2 });
      const text = await lookupVerseRef(ref);
      setPopover(p => p?.refText === ref ? { ...p, text, loading: false } : p);
    }
    el.addEventListener("mouseover", onOver);
    return () => el.removeEventListener("mouseover", onOver);
  }, []);

  // Close on pointer leaving both the verse-ref and the popover card, and on click/Escape outside
  useEffect(() => {
    if (!popover) return;

    function scheduleClose() {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => setPopover(null), 200);
    }
    function cancelClose() {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }

    function onPointerMove(e: PointerEvent) {
      const t = e.target as HTMLElement;
      if (t.closest(".verse-ref") || t.closest("[data-verse-popover]")) {
        cancelClose();
      } else {
        scheduleClose();
      }
    }

    function onMouseDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest(".verse-ref") && !t.closest("[data-verse-popover]")) {
        setPopover(null);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPopover(null);
    }

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [popover]);

  const activeCommentary = commentaries.find(c => c.id === activeCommentaryId);
  const activeResource   = resources.find(r => r.id === activeCommentary?.resource_id);

  if (!hasCommentaryResources) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <EmptyState
          icon={Commentary}
          title="No commentary installed"
          description="Download a commentary from the All tab to read alongside scripture"
          action={{ label: "Browse", onClick: () => {} }}
        />
      </div>
    );
  }

  // Don't block rendering while loading — show stale content + subtle top bar

  if (!commentaryEntries.length) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <EmptyState
          icon={Commentary}
          title="No commentary for this chapter"
          description="Commentary data is not available for this chapter yet"
        />
      </div>
    );
  }

  // Full spinner only when there's no stale content to show yet
  if (!commentaryEntries.length && isLoadingCommentary) {
    return <Loading />;
  }

  return (
    <div ref={contentWrapRef} className="flex flex-col gap-8" style={{ opacity: isLoadingCommentary ? 0.6 : 1, transition: "opacity 0.3s ease" }}>
      {popover && (
        <VerseRefPopover {...popover} />
      )}
      {activeResource && (
        <div className="flex flex-col gap-0 pb-4">
          <p className="text-3xl font-semibold text-text-primary leading-tight">{activeResource.name}</p>
          {activeResource.description && (
            <p className="text-sm text-text-muted leading-relaxed">{activeResource.description}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap mt-3">
            {activeCommentary?.author && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Icon icon={Account} size={12} color="muted" />
                {activeCommentary.author}
              </span>
            )}
            {(() => {
              const totalWords = commentaryEntries.reduce((acc, e) => {
                const text = e.content.replace(/<[^>]+>/g, " ");
                return acc + text.trim().split(/\s+/).filter(Boolean).length;
              }, 0);
              const minutes = Math.max(1, Math.ceil(totalWords / 200));
              return (
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Icon icon={Clock} size={12} color="muted" />
                  {minutes} min read
                </span>
              );
            })()}
            {activeResource.license && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Icon icon={Info} size={12} color="muted" />
                {activeResource.license}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Shader banner — unique palette per commentary */}
      {activeCommentaryId != null && (
        <CommentaryShader commentaryId={activeCommentaryId} />
      )}

      {commentaryEntries.map((entry, idx) => {
        const verseLabel = entry.from_verse != null
          ? entry.to_verse != null && entry.to_verse !== entry.from_verse
            ? `Verses ${entry.from_verse}–${entry.to_verse}`
            : `Verse ${entry.from_verse}`
          : null;

        const processed = prepareContent(entry.content);

        return (
          <section key={entry.id}>
            {verseLabel && (
              <p className="text-base font-semibold text-text-primary mb-3">
                {verseLabel}
              </p>
            )}
            <div
              className="commentary-content text-[17px] text-text-primary leading-8
                [&_p]:mb-5 [&_p:last-child]:mb-0
                [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-3
                [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2
                [&_h3]:text-base [&_h3]:font-medium [&_h3]:mb-1
                [&_strong]:font-semibold [&_b]:font-semibold
                [&_em]:italic [&_i]:italic
                [&_blockquote]:border-l-2 [&_blockquote]:border-border-gray-1 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-muted [&_blockquote]:my-2
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
                [&_li]:leading-7"
              dangerouslySetInnerHTML={{ __html: processed }}
            />
          </section>
        );
      })}
    </div>
  );
}

// ── Lexicon content ────────────────────────────────────────────────────────────

function LexiconContent({ hasLexiconResources }: { hasLexiconResources: boolean }) {
  const lexiconEntry    = useResourcesStore(s => s.lexiconEntry);
  const lexiconResults  = useResourcesStore(s => s.lexiconResults);
  const isLoadingLexicon = useResourcesStore(s => s.isLoadingLexicon);
  const searchLexicon   = useResourcesStore(s => s.searchLexicon);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) return;
    debounceRef.current = setTimeout(() => {
      searchLexicon(value.trim());
    }, 350);
  }

  if (!hasLexiconResources) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <EmptyState
          icon={Lexicon}
          title="No lexicon installed"
          description="Download a lexicon to look up word definitions"
        />
      </div>
    );
  }

  const showEmpty = !isLoadingLexicon && !query.trim() && !lexiconEntry;
  const showNoResults = !isLoadingLexicon && query.trim() && !lexiconResults.length && !lexiconEntry;

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <Input
        placeholder="Search word or Strong's number…"
        value={query}
        onChange={e => handleSearch(e.target.value)}
      />

      {isLoadingLexicon && <Loading />}

      {showEmpty && (
        <div className="flex flex-1 items-center justify-center py-16">
          <EmptyState
            icon={Lexicon}
            title="Lexicon lookup"
            description="Search a word or Strong's number to see its definition"
          />
        </div>
      )}

      {showNoResults && (
        <div className="flex flex-1 items-center justify-center py-8">
          <EmptyState
            icon={Search}
            title="No results"
            description={`Nothing found for "${query}"`}
          />
        </div>
      )}

      {/* Pinned entry — from word tap in scripture */}
      {lexiconEntry && (
        <LexiconCard entry={lexiconEntry} pinned />
      )}

      {/* Search results */}
      {!isLoadingLexicon && lexiconResults.map(r => (
        <LexiconCard key={r.id} entry={r} />
      ))}
    </div>
  );
}

function LexiconCard({
  entry,
  pinned = false,
}: {
  entry: { strongs_number: string; word: string; transliteration: string | null; pronunciation: string | null; definition: string; kjv_definition: string | null; language: string };
  pinned?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 p-3 rounded-xl border ${pinned ? "bg-surface-0 border-border-brand" : "bg-surface-0 border-border-gray-1"}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-base font-medium text-text-primary">{entry.word}</span>
        {entry.transliteration && (
          <span className="text-xs text-text-muted italic">{entry.transliteration}</span>
        )}
        {entry.pronunciation && (
          <span className="text-xs text-text-muted">({entry.pronunciation})</span>
        )}
        <span className="ml-auto text-xs font-medium text-text-brand shrink-0">{entry.strongs_number}</span>
      </div>
      <p className="text-sm text-text-primary leading-relaxed">{entry.definition}</p>
      {entry.kjv_definition && entry.kjv_definition !== entry.definition && (
        <p className="text-xs text-text-muted leading-relaxed border-t border-border-gray-1 pt-2">{entry.kjv_definition}</p>
      )}
    </div>
  );
}

// ── ResourcePanel ─────────────────────────────────────────────────────────────

export interface ResourcePanelProps {
  onClose: () => void;
}

export function ResourcePanel({ onClose }: ResourcePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("commentary");
  const [openMenuTab, setOpenMenuTab] = useState<PanelTab | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const tabRefs = useRef<Map<PanelTab, HTMLElement>>(new Map());

  const {
    resources,
    commentaries,
    activeCommentaryId,
    isLoadingResources,
    loadResources,
    setActiveCommentary,
  } = useResourcesStore();

  useEffect(() => {
    if (!resources.length) loadResources();
  }, []);

  const byType = {
    commentary:  resources.filter(r => r.type === "commentary"),
    lexicon:     resources.filter(r => r.type === "lexicon"),
    concordance: resources.filter(r => r.type === "concordance"),
    maps:        resources.filter(r => r.type === "maps"),
  };

  const activeCommentaryResourceId = commentaries.find(c => c.id === activeCommentaryId)?.resource_id ?? null;

  // Primary action — switches content view without opening the menu
  function handleTabSelect(tab: PanelTab) {
    setActiveTab(tab);
    setOpenMenuTab(null);
  }

  // Chevron action — opens the resource selector for that type
  function handleTabMenuOpen(tab: PanelTab) {
    const btn = tabRefs.current.get(tab);
    const items = byType[tab as keyof typeof byType] ?? [];
    if (!btn || !items.length) return;
    const r = btn.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 6, left: r.left });
    setOpenMenuTab(openMenuTab === tab ? null : tab);
  }

  function handleCommentarySelect(resourceId: number) {
    const commentary = commentaries.find(c => c.resource_id === resourceId);
    if (commentary) setActiveCommentary(commentary.id);
  }

  function handleResourceSelect(tab: PanelTab, resourceId: number) {
    if (tab === "commentary") handleCommentarySelect(resourceId);
    // lexicon / concordance / maps selection can be wired here later
  }

  const openMenuItems = openMenuTab && openMenuTab !== "all"
    ? byType[openMenuTab as keyof typeof byType] ?? []
    : [];

  const openMenuSelectedId = openMenuTab === "commentary" ? activeCommentaryResourceId : null;

  return (
    <div
      className="flex flex-col items-center gap-4 p-3 bg-surface-1 border border-border-gray-1 rounded-xl w-full h-full"
      style={{ boxShadow: "0px 8px 24px rgba(0,0,0,0.10), 0px 2px 8px rgba(0,0,0,0.06), 0px 0px 1px rgba(0,0,0,0.04)" }}
    >
      {/* Topbar */}
      <div className="flex items-center gap-4 w-full shrink-0">
        <Button variant="ghost" size="sm" icon={OpenPanel} iconButton onClick={onClose} />

        {/* Tab toggle — each tab is a ButtonTrigger; non-All tabs open a resource selector */}
        <div className="flex items-center gap-1">
          {TABS.map(tab => {
            const active = activeTab === tab.value;
            const menuOpen = openMenuTab === tab.value;
            return (
              <div
                key={tab.value}
                ref={el => { if (el) tabRefs.current.set(tab.value, el); }}
              >
                <ButtonTrigger
                  open={menuOpen}
                  variant={active ? "brand" : "primary"}
                  onSelect={() => handleTabSelect(tab.value)}
                  onClick={() => handleTabMenuOpen(tab.value)}
                >
                  {tab.label}
                </ButtonTrigger>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content — always shows resource content, never a library list */}
      <div className="flex flex-col flex-1 w-full overflow-y-auto gap-6 px-2">
        {activeTab === "commentary" && (
          isLoadingResources
            ? <Loading />
            : <CommentaryContent hasCommentaryResources={byType.commentary.length > 0} />
        )}

        {activeTab === "lexicon" && (
          isLoadingResources
            ? <Loading />
            : <LexiconContent hasLexiconResources={byType.lexicon.length > 0} />
        )}

        {activeTab === "concordance" && (
          <div className="flex flex-1 items-center justify-center py-16">
            <EmptyState
              icon={CrossRef}
              title="Cross-references"
              description="Select a verse to see related passages"
            />
          </div>
        )}

        {activeTab === "maps" && (
          <div className="flex flex-1 items-center justify-center py-16">
            <EmptyState
              icon={MapIcon}
              title="Maps"
              description="Download maps to see locations mentioned in scripture"
              action={{ label: "Download", onClick: () => {} }}
            />
          </div>
        )}

      </div>

      {/* Resource selector dropdown — opens below the clicked tab button */}
      {openMenuTab && openMenuItems.length > 0 && (
        <ResourceSelectorMenu
          items={openMenuItems}
          selectedId={openMenuSelectedId}
          onSelect={(id) => handleResourceSelect(openMenuTab, id)}
          onClose={() => setOpenMenuTab(null)}
          pos={menuPos}
        />
      )}
    </div>
  );
}

