// ── Token maps (from Figma) ───────────────────────────────────────────────────

const BIBLE = {
  /** Wide blog-card — 500×316, landscape featured cover. */
  lg: { w: 500, h: 316, r1: 20, r2: 16, r3: 12, pad: 4,  fs: 52, titleBottom: 60  },
  /** Standard tall book cover — 320×420. */
  md: { w: 320, h: 420, r1: 24, r2: 20, r3: 16, pad: 4,  fs: 64, titleBottom: 80  },
  sm: { w: 110, h: 140, r1: 10, r2: 8,  r3: 6,  pad: 2,  fs: 32, titleBottom: 28  },
  /** Compact panel cover — 64×82. */
  xs: { w: 64,  h: 82,  r1: 6,  r2: 5,  r3: 3,  pad: 1,  fs: 18, titleBottom: 16  },
} as const;

const NOTE = {
  lg: { w: 328, h: 420, cardH: 220, r1: 24, r2: 20, r3: 16, pad: 4, titleFs: 20, subFs: 12, titlePad: 18 },
  md: { w: 250, h: 316, cardH: 170, r1: 20, r2: 16, r3: 12, pad: 4, titleFs: 16, subFs: 8,  titlePad: 14 },
  sm: { w: 110, h: 140, cardH: 80,  r1: 10, r2: 8,  r3: 6,  pad: 2, titleFs: 8,  subFs: 4,  titlePad: 6  },
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

const TITLE_MAX_LEN: Record<string, number> = { sm: 4, md: 7, lg: 10, fluid: 8 };

export interface FeatureCoverProps {
  type?: "bible" | "note";
  title: string;
  /** Shown instead of title when the title is too long for the cover size */
  abbreviation?: string;
  /** Note subtitle — e.g. "Updated 2 days ago" */
  subtitle?: string;
  /** Fixed size. Omit for fluid bible cover (fills parent). */
  size?: "lg" | "md" | "sm" | "xs";
  onClick?: () => void;
  /** Optional background node rendered inside the cover surface (e.g. ShaderBackground) */
  backgroundNode?: React.ReactNode;
}

export function FeatureCover({
  type = "bible",
  title,
  abbreviation,
  subtitle,
  size,
  onClick,
  backgroundNode,
}: FeatureCoverProps) {

  // ── Bible cover ─────────────────────────────────────────────────────────────

  if (type === "bible") {
    const t = size === "xs" ? BIBLE.xs : size === "sm" ? BIBLE.sm : size === "lg" ? BIBLE.lg : BIBLE.md;
    const sizeKey = size ?? "fluid";
    const displayTitle = abbreviation && title.length > TITLE_MAX_LEN[sizeKey] ? abbreviation : title;

    // lg fills the container width (matches ChapterBlock behaviour).
    // md/sm/xs use fixed pixel dimensions. No size = fluid aspect-ratio mode.
    const outerStyle: React.CSSProperties =
      size === "lg" ? { width: "100%", maxWidth: 850, height: t.h } :
      size ? { width: t.w, height: t.h } :
      { width: "100%", aspectRatio: "320 / 420" };

    const Tag = onClick ? "button" : "div";

    return (
      <Tag
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className="relative flex shrink-0"
        style={{
          ...outerStyle,
          borderRadius: t.r1,
          border: "1px solid #E7E5E4",
          padding: t.pad,
          filter: (size === "sm" || size === "xs")
            ? undefined
            : "drop-shadow(0px 2px 4px rgba(0,0,0,0.04)) drop-shadow(0px 0px 0px rgba(0,0,0,0.06))",
          boxShadow: (size === "sm" || size === "xs")
            ? "0px 0.632911px 1.26582px rgba(0,0,0,0.04)"
            : undefined,
          cursor: onClick ? "pointer" : "default",
          background: (size === "sm" || size === "xs") ? "#FAFAFA" : undefined,
        }}
      >
        {/* Inner frame */}
        <div
          className="flex flex-1"
          style={{
            background: "#FAFAFA",
            border: `${(size === "sm" || size === "xs") ? 0.316 : 1}px solid #E7E5E4`,
            borderRadius: t.r2,
            padding: t.pad,
            boxShadow: "0px 2px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Cover surface */}
          <div
            className="relative flex-1 overflow-hidden"
            style={{
              background: "#F5F5F4",
              border: `${(size === "sm" || size === "xs") ? 0.316 : 1}px solid #E7E5E4`,
              borderRadius: t.r3,
              boxShadow: "0px 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Background — shader or plain surface */}
            {backgroundNode && (
              <div className="absolute inset-0">
                {backgroundNode}
              </div>
            )}
            {/* Book title — Alter Bridge, bottom-center */}
            <span
              className={`absolute left-1/2 -translate-x-1/2 text-center select-none overflow-hidden text-ellipsis whitespace-nowrap ${backgroundNode ? "text-white drop-shadow-sm" : "text-text-muted"}`}
              style={{
                bottom: t.titleBottom,
                fontSize: size ? t.fs : undefined,
                fontFamily: "'Alter Bridge', serif",
                fontWeight: 400,
                maxWidth: "90%",
                // Fluid mode: scale with container via viewport unit approximation
                ...(size ? {} : { fontSize: "clamp(20px, 15%, 64px)" }),
              }}
            >
              {displayTitle}
            </span>
          </div>
        </div>
      </Tag>
    );
  }

  // ── Note page cover ─────────────────────────────────────────────────────────

  const noteSize = (size === "md" ? "md" : size === "sm" || size === "xs" ? "sm" : "lg") as keyof typeof NOTE;
  const n = NOTE[noteSize];

  // ExtraSmall: ultra-minimal representation (lines only, no real content)
  if (size === "xs") {
    return (
      <div
        onClick={onClick}
        style={{
          width: 29, height: 37,
          borderRadius: 3, padding: 1,
          background: "#F5F5F4",
          border: "0.2px solid #E7E5E4",
          boxShadow: "0px 2px 4px rgba(0,0,0,0.04)",
          cursor: onClick ? "pointer" : "default",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ background: "#FAFAFA", border: "0.2px solid #E7E5E4", borderRadius: 2, width: "100%", height: "100%", position: "relative" }}>
          {/* Simulated text lines */}
          {[3.41, 4.91, 6.41].map((top, i) => (
            <div key={i} style={{ position: "absolute", left: 2, top, height: 0.6, borderRadius: 150, background: "#121212", width: i === 1 ? 12 : i === 2 ? 18 : 24 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: n.w, height: n.h,
        position: "relative",
        display: "flex", alignItems: "flex-end",
        borderRadius: n.r1,
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
      }}
    >
      {/* Backing card — peeks out at the bottom */}
      <div
        style={{
          width: n.w, height: n.cardH, flexShrink: 0,
          background: "#FAFAFA",
          border: `1px solid #E7E5E4`,
          boxShadow: "0px 2px 4px rgba(0,0,0,0.04)",
          borderRadius: n.r1,
          position: "relative",
        }}
      />

      {/* Floating page — positioned above the backing card */}
      <div
        style={{
          position: "absolute",
          left: n.pad, right: n.pad,
          top: 3, bottom: n.pad + 1,
          background: "#F5F5F4",
          border: `1px solid #E7E5E4`,
          boxShadow: "0px 2px 4px rgba(0,0,0,0.04)",
          borderRadius: n.r2,
        }}
      >
        {/* Page surface */}
        <div
          style={{
            position: "absolute", inset: n.pad,
            background: "#FAFAFA",
            border: `1px solid #E7E5E4`,
            boxShadow: "0px 2px 4px rgba(0,0,0,0.04)",
            borderRadius: n.r3,
            overflow: "hidden",
          }}
        >
          {/* Title area at the top of the page */}
          <div style={{ padding: `${n.titlePad}px ${n.titlePad}px 0` }}>
            <div style={{ borderBottom: "1px solid #E7E5E4", paddingBottom: 8 }}>
              <p style={{
                fontFamily: "DM Sans", fontWeight: 500,
                fontSize: n.titleFs, lineHeight: `${n.titleFs + 6}px`,
                color: "#121212", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {title}
              </p>
              {subtitle && (
                <p style={{
                  fontFamily: "DM Sans", fontWeight: 400,
                  fontSize: n.subFs, lineHeight: `${n.subFs + 4}px`,
                  color: "#838383", margin: 0,
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
