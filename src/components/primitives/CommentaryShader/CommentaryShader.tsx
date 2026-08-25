import { ShaderBackground, type ShaderBackgroundProps } from "@components/primitives/ShaderBackground";

type RGB = [number, number, number];

const h = (hex: string): RGB => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
};

function pad(stops: RGB[]): RGB[] {
  const out = [...stops];
  while (out.length < 8) out.push(out[out.length - 1]);
  return out;
}

type Variant = Omit<ShaderBackgroundProps, "className">;

const VARIANTS: Variant[] = [
  // ── 0  Tropical ocean — deep teal → aqua → seafoam → white
  { colors: pad([h("#004455"), h("#008899"), h("#00d4c8"), h("#a0fff8"), h("#f0ffff")]), colorCount: 5,
    scale: 1.8, intensity: 0.48, warp: 0.05, rotate: 5.2, drift: 0.09, timeScale: -0.60 },

  // ── 1  Sunshine — warm amber → bright yellow → lemon → cream
  { colors: pad([h("#5c3a00"), h("#d48000"), h("#ffcc00"), h("#fff799"), h("#fffde0")]), colorCount: 5,
    scale: 1.6, intensity: 0.42, warp: 0.03, rotate: 0.8, drift: 0.07, timeScale: -0.50 },

  // ── 2  Cherry blossom — dusty rose → soft pink → blush → petal white
  { colors: pad([h("#5a1a2a"), h("#cc4888"), h("#ff88bb"), h("#ffd4e8"), h("#fff4f8")]), colorCount: 5,
    scale: 1.5, intensity: 0.34, warp: 0.02, rotate: 5.65, drift: 0.06, timeScale: -0.44 },

  // ── 3  Spring meadow — rich green → lime → yellow-green → light
  { colors: pad([h("#1a4400"), h("#4ab800"), h("#9aee00"), h("#d4ff80"), h("#f4ffcc")]), colorCount: 5,
    scale: 2.0, intensity: 0.52, warp: 0.06, rotate: 2.0, drift: 0.10, timeScale: -0.68 },

  // ── 4  Citrus burst — deep orange → bright orange → yellow → cream
  { colors: pad([h("#4a1400"), h("#d04000"), h("#ff8800"), h("#ffcc44"), h("#fff4cc")]), colorCount: 5,
    scale: 2.2, intensity: 0.58, warp: 0.07, rotate: 3.5, drift: 0.12, timeScale: -0.76 },

  // ── 5  Lavender fields — deep violet → bright lavender → lilac → soft white
  { colors: pad([h("#2a0850"), h("#8840cc"), h("#cc90ff"), h("#e8d0ff"), h("#f8f4ff")]), colorCount: 5,
    scale: 1.7, intensity: 0.38, warp: 0.03, rotate: 4.6, drift: 0.07, timeScale: -0.48 },

  // ── 6  Tropical sunset — coral → warm orange → golden pink → soft peach
  { colors: pad([h("#602040"), h("#e04060"), h("#ff8040"), h("#ffcc80"), h("#fff0d8")]), colorCount: 5,
    scale: 1.9, intensity: 0.50, warp: 0.05, rotate: 5.0, drift: 0.10, timeScale: -0.62 },

  // ── 7  Summer sky — navy → vivid blue → bright sky → pale blue
  { colors: pad([h("#081840"), h("#1850d0"), h("#40a0ff"), h("#90d4ff"), h("#e8f6ff")]), colorCount: 5,
    scale: 1.8, intensity: 0.44, warp: 0.04, rotate: 1.2, drift: 0.08, timeScale: -0.55 },

  // ── 8  Watermelon — deep pink-green → vivid pink → coral → pale
  { colors: pad([h("#1a3010"), h("#d82060"), h("#ff6688"), h("#ffb8cc"), h("#fff0f4")]), colorCount: 5,
    scale: 2.1, intensity: 0.56, warp: 0.07, rotate: 2.8, drift: 0.11, timeScale: -0.72 },

  // ── 9  Mint fresh — deep teal → bright mint → light mint → white
  { colors: pad([h("#003830"), h("#00a880"), h("#40e8b0"), h("#b0fff0"), h("#f0fffc")]), colorCount: 5,
    scale: 1.6, intensity: 0.38, warp: 0.03, rotate: 5.65, drift: 0.07, timeScale: -0.48 },

  // ── 10 Rainbow pop — deep indigo → vivid blue → bright pink → golden yellow
  { colors: pad([h("#1a0850"), h("#0050e0"), h("#e800a0"), h("#ff8800"), h("#ffee00")]), colorCount: 5,
    scale: 2.4, intensity: 0.66, warp: 0.10, rotate: 3.0, drift: 0.16, timeScale: -0.88 },

  // ── 11 Peach dream — warm terracotta → peach → coral → cream
  { colors: pad([h("#4a1800"), h("#d05030"), h("#ff9070"), h("#ffd0b8"), h("#fff4ee")]), colorCount: 5,
    scale: 1.7, intensity: 0.40, warp: 0.03, rotate: 4.2, drift: 0.07, timeScale: -0.52 },

  // ── 12 Ocean horizon — deep navy → cerulean → bright sky → foam white
  { colors: pad([h("#061428"), h("#0848b0"), h("#1898e8"), h("#88d8ff"), h("#f0fbff")]), colorCount: 5,
    scale: 2.0, intensity: 0.46, warp: 0.04, rotate: 5.65, drift: 0.09, timeScale: -0.62 },

  // ── 13 Strawberry lemonade — deep berry → vivid red-pink → golden yellow
  { colors: pad([h("#400010"), h("#e0104a"), h("#ff6090"), h("#ffcc00"), h("#fff8cc")]), colorCount: 5,
    scale: 2.3, intensity: 0.62, warp: 0.09, rotate: 2.2, drift: 0.14, timeScale: -0.82 },

  // ── 14 Kiwi — deep forest → bright lime → yellow-green → cream
  { colors: pad([h("#1a3000"), h("#4a9000"), h("#80e000"), h("#ccff80"), h("#f4ffe0")]), colorCount: 5,
    scale: 2.0, intensity: 0.54, warp: 0.06, rotate: 3.8, drift: 0.11, timeScale: -0.70 },

  // ── 15 Bubblegum — deep magenta → hot pink → soft pink → lavender white
  { colors: pad([h("#300040"), h("#d000a0"), h("#ff60c0"), h("#ffb8e8"), h("#fff0ff")]), colorCount: 5,
    scale: 1.8, intensity: 0.46, warp: 0.05, rotate: 5.2, drift: 0.09, timeScale: -0.58 },

  // ── 16 Cornflower — deep dusk blue → cornflower → sky → pale blue white
  { colors: pad([h("#1a1040"), h("#4060c0"), h("#80a8ff"), h("#c0d4ff"), h("#f0f4ff")]), colorCount: 5,
    scale: 1.5, intensity: 0.32, warp: 0.02, rotate: 0.6, drift: 0.06, timeScale: -0.42 },

  // ── 17 Tangerine cream — deep warm red → vivid orange → bright tangerine → vanilla
  { colors: pad([h("#3a0a00"), h("#cc3800"), h("#ff6e00"), h("#ffa060"), h("#fff0d8")]), colorCount: 5,
    scale: 2.1, intensity: 0.50, warp: 0.05, rotate: 1.5, drift: 0.10, timeScale: -0.65 },

  // ── 18 Blueberry — deep navy purple → vivid blue-purple → periwinkle → pale
  { colors: pad([h("#0a0830"), h("#2020a0"), h("#6060e8"), h("#b0b0ff"), h("#eeeeff")]), colorCount: 5,
    scale: 1.9, intensity: 0.44, warp: 0.04, rotate: 4.8, drift: 0.08, timeScale: -0.56 },

  // ── 19 Golden hour — deep dusk → warm gold → bright amber → champagne
  { colors: pad([h("#200800"), h("#904800"), h("#e8a000"), h("#ffd860"), h("#fff8e0")]), colorCount: 5,
    scale: 1.8, intensity: 0.42, warp: 0.03, rotate: 5.4, drift: 0.08, timeScale: -0.54 },

  // ── 20 Peony — deep burgundy-purple → vivid magenta-pink → pink → blush
  { colors: pad([h("#300030"), h("#b00080"), h("#ff40a0"), h("#ffa0cc"), h("#fff0f8")]), colorCount: 5,
    scale: 2.0, intensity: 0.52, warp: 0.06, rotate: 3.2, drift: 0.11, timeScale: -0.68 },

  // ── 21 Grape soda — deep purple → vivid violet → bright lavender → lilac foam
  { colors: pad([h("#1a0038"), h("#6000c0"), h("#b040ff"), h("#d898ff"), h("#f4e8ff")]), colorCount: 5,
    scale: 2.2, intensity: 0.58, warp: 0.08, rotate: 2.5, drift: 0.12, timeScale: -0.76 },

  // ── 22 Emerald coast — deep navy → vivid teal → bright emerald → seafoam
  { colors: pad([h("#002830"), h("#007850"), h("#00cc88"), h("#60ffcc"), h("#e0fff8")]), colorCount: 5,
    scale: 1.9, intensity: 0.48, warp: 0.05, rotate: 5.65, drift: 0.09, timeScale: -0.62 },

  // ── 23 Wildflower — deep plum → vivid purple → bright violet → soft iris
  { colors: pad([h("#200840"), h("#7020b0"), h("#c050e8"), h("#e0a0ff"), h("#f8f0ff")]), colorCount: 5,
    scale: 1.7, intensity: 0.40, warp: 0.04, rotate: 3.9, drift: 0.07, timeScale: -0.52 },

  // ── 24 Mango sorbet — deep warm brown → vivid mango → papaya → cream
  { colors: pad([h("#3c1000"), h("#c05000"), h("#ff9800"), h("#ffcf60"), h("#fff4d0")]), colorCount: 5,
    scale: 2.0, intensity: 0.50, warp: 0.05, rotate: 1.0, drift: 0.09, timeScale: -0.64 },

  // ── 25 Arctic aurora — deep night → electric teal → green aurora → pale mint
  { colors: pad([h("#040c18"), h("#006060"), h("#00d890"), h("#60ff80"), h("#e8fff4")]), colorCount: 5,
    scale: 2.3, intensity: 0.60, warp: 0.08, rotate: 4.3, drift: 0.13, timeScale: -0.80 },

  // ── 26 Fairy floss — deep mauve → pink → violet → powder blue
  { colors: pad([h("#300828"), h("#d040b0"), h("#ff88e0"), h("#a0c0ff"), h("#f0f4ff")]), colorCount: 5,
    scale: 1.6, intensity: 0.36, warp: 0.03, rotate: 5.8, drift: 0.06, timeScale: -0.45 },

  // ── 27 Saffron sunrise — deep midnight blue → vivid saffron → bright yellow → gold
  { colors: pad([h("#081020"), h("#6030a0"), h("#f08000"), h("#ffcc00"), h("#fff8d0")]), colorCount: 5,
    scale: 2.2, intensity: 0.56, warp: 0.07, rotate: 5.0, drift: 0.12, timeScale: -0.74 },

  // ── 28 Lemon fizz — deep warm green → vivid lime → bright yellow → cream
  { colors: pad([h("#1a2800"), h("#5a8000"), h("#b8e000"), h("#f0ff60"), h("#fafff0")]), colorCount: 5,
    scale: 2.1, intensity: 0.54, warp: 0.06, rotate: 2.7, drift: 0.11, timeScale: -0.70 },

  // ── 29 Candy sky — deep indigo → bright blue → hot pink → golden yellow
  { colors: pad([h("#100838"), h("#0040d0"), h("#ff2090"), h("#ff9000"), h("#fff0cc")]), colorCount: 5,
    scale: 2.5, intensity: 0.68, warp: 0.10, rotate: 3.6, drift: 0.15, timeScale: -0.90 },
];

export interface CommentaryShaderProps {
  commentaryId: number | null | undefined;
  className?: string;
}

export function CommentaryShader({ commentaryId, className }: CommentaryShaderProps) {
  const idx = commentaryId != null
    ? ((commentaryId - 1) % VARIANTS.length + VARIANTS.length) % VARIANTS.length
    : 0;
  const variant = VARIANTS[idx];
  return (
    <div className={`rounded-2xl overflow-hidden ${className ?? "h-[300px]"}`}>
      <ShaderBackground {...variant} />
    </div>
  );
}
