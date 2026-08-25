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
  { colors: pad([h("#0d1b4b"), h("#1a52b8"), h("#4da8f5"), h("#b8dcff")]), colorCount: 4, scale: 1.8, intensity: 0.44, warp: 0.04, rotate: 5.6, drift: 0.09, timeScale: -0.55 },
  { colors: pad([h("#2a0a00"), h("#a03010"), h("#e87030"), h("#ffe0b0")]), colorCount: 4, scale: 2.0, intensity: 0.52, warp: 0.06, rotate: 1.2, drift: 0.11, timeScale: -0.70 },
  { colors: pad([h("#001a14"), h("#006040"), h("#20d890"), h("#a0ffe4")]), colorCount: 4, scale: 1.7, intensity: 0.40, warp: 0.03, rotate: 4.5, drift: 0.07, timeScale: -0.50 },
  { colors: pad([h("#1a0038"), h("#5800b0"), h("#b060ff"), h("#e8c8ff")]), colorCount: 4, scale: 2.2, intensity: 0.58, warp: 0.08, rotate: 3.1, drift: 0.13, timeScale: -0.78 },
  { colors: pad([h("#1a0a00"), h("#804000"), h("#d49020"), h("#fff0a0")]), colorCount: 4, scale: 1.6, intensity: 0.36, warp: 0.02, rotate: 0.8, drift: 0.06, timeScale: -0.46 },
  { colors: pad([h("#040c18"), h("#083880"), h("#20a0e0"), h("#b0e8ff")]), colorCount: 4, scale: 1.9, intensity: 0.46, warp: 0.04, rotate: 5.2, drift: 0.08, timeScale: -0.60 },
  { colors: pad([h("#180030"), h("#6010a0"), h("#c050d8"), h("#f0b0ff")]), colorCount: 4, scale: 2.1, intensity: 0.54, warp: 0.07, rotate: 2.4, drift: 0.12, timeScale: -0.72 },
  { colors: pad([h("#0a1800"), h("#306000"), h("#80c820"), h("#d8ff80")]), colorCount: 4, scale: 2.3, intensity: 0.60, warp: 0.09, rotate: 3.8, drift: 0.14, timeScale: -0.82 },
  { colors: pad([h("#1a0010"), h("#800040"), h("#d82080"), h("#ffb0d0")]), colorCount: 4, scale: 1.8, intensity: 0.46, warp: 0.05, rotate: 5.65, drift: 0.09, timeScale: -0.58 },
  { colors: pad([h("#001018"), h("#006090"), h("#20c0d0"), h("#a0f0f8")]), colorCount: 4, scale: 1.6, intensity: 0.38, warp: 0.03, rotate: 1.5, drift: 0.07, timeScale: -0.48 },
  { colors: pad([h("#100800"), h("#604000"), h("#c09010"), h("#fff0c0")]), colorCount: 4, scale: 2.0, intensity: 0.50, warp: 0.05, rotate: 4.2, drift: 0.10, timeScale: -0.65 },
  { colors: pad([h("#080020"), h("#200880"), h("#5038d0"), h("#c0b0ff")]), colorCount: 4, scale: 1.7, intensity: 0.42, warp: 0.03, rotate: 5.0, drift: 0.08, timeScale: -0.52 },
  { colors: pad([h("#001808"), h("#008040"), h("#40d880"), h("#b8ffe0")]), colorCount: 4, scale: 2.1, intensity: 0.54, warp: 0.07, rotate: 2.8, drift: 0.11, timeScale: -0.70 },
  { colors: pad([h("#180008"), h("#700030"), h("#d04060"), h("#ffb0b8")]), colorCount: 4, scale: 2.4, intensity: 0.64, warp: 0.10, rotate: 1.8, drift: 0.16, timeScale: -0.88 },
  { colors: pad([h("#000818"), h("#003060"), h("#0880d0"), h("#80d0ff")]), colorCount: 4, scale: 1.5, intensity: 0.32, warp: 0.02, rotate: 0.4, drift: 0.05, timeScale: -0.40 },
  { colors: pad([h("#100018"), h("#500070"), h("#c040b8"), h("#f0a8f0")]), colorCount: 4, scale: 2.0, intensity: 0.50, warp: 0.06, rotate: 3.5, drift: 0.10, timeScale: -0.64 },
  { colors: pad([h("#181000"), h("#706000"), h("#d0b010"), h("#ffe880")]), colorCount: 4, scale: 1.8, intensity: 0.44, warp: 0.04, rotate: 5.4, drift: 0.09, timeScale: -0.56 },
  { colors: pad([h("#001018"), h("#004888"), h("#1890e0"), h("#90d8ff")]), colorCount: 4, scale: 2.2, intensity: 0.56, warp: 0.07, rotate: 2.2, drift: 0.12, timeScale: -0.74 },
  { colors: pad([h("#180020"), h("#780068"), h("#e040c0"), h("#ffb0f0")]), colorCount: 4, scale: 1.9, intensity: 0.48, warp: 0.05, rotate: 4.8, drift: 0.10, timeScale: -0.62 },
  { colors: pad([h("#001400"), h("#005030"), h("#18a860"), h("#90ffc0")]), colorCount: 4, scale: 2.3, intensity: 0.60, warp: 0.08, rotate: 1.5, drift: 0.13, timeScale: -0.78 },
  { colors: pad([h("#1a0800"), h("#882000"), h("#e06010"), h("#ffd080")]), colorCount: 4, scale: 2.0, intensity: 0.52, warp: 0.06, rotate: 5.2, drift: 0.11, timeScale: -0.68 },
  { colors: pad([h("#080018"), h("#281080"), h("#6050e0"), h("#c0c0ff")]), colorCount: 4, scale: 1.6, intensity: 0.38, warp: 0.03, rotate: 3.2, drift: 0.07, timeScale: -0.48 },
  { colors: pad([h("#001010"), h("#005870"), h("#18b0c0"), h("#88f0f8")]), colorCount: 4, scale: 1.7, intensity: 0.42, warp: 0.04, rotate: 0.6, drift: 0.08, timeScale: -0.54 },
  { colors: pad([h("#180028"), h("#7000a0"), h("#d050f0"), h("#f0b8ff")]), colorCount: 4, scale: 2.5, intensity: 0.68, warp: 0.11, rotate: 4.0, drift: 0.17, timeScale: -0.92 },
  { colors: pad([h("#100800"), h("#586000"), h("#b0c000"), h("#e8f880")]), colorCount: 4, scale: 1.8, intensity: 0.44, warp: 0.04, rotate: 2.5, drift: 0.09, timeScale: -0.58 },
  { colors: pad([h("#000c18"), h("#004090"), h("#0880e0"), h("#78c8ff")]), colorCount: 4, scale: 2.0, intensity: 0.50, warp: 0.05, rotate: 5.65, drift: 0.10, timeScale: -0.65 },
  { colors: pad([h("#180010"), h("#680048"), h("#c83890"), h("#ffb8e0")]), colorCount: 4, scale: 1.9, intensity: 0.48, warp: 0.05, rotate: 1.9, drift: 0.09, timeScale: -0.60 },
  { colors: pad([h("#001800"), h("#007840"), h("#30e080"), h("#a8ffcc")]), colorCount: 4, scale: 2.2, intensity: 0.56, warp: 0.07, rotate: 3.7, drift: 0.12, timeScale: -0.74 },
  { colors: pad([h("#1a0400"), h("#902808"), h("#e05818"), h("#ffc870")]), colorCount: 4, scale: 1.7, intensity: 0.42, warp: 0.04, rotate: 5.0, drift: 0.08, timeScale: -0.54 },
  { colors: pad([h("#0a0020"), h("#380090"), h("#8050d8"), h("#d0b8ff")]), colorCount: 4, scale: 2.1, intensity: 0.54, warp: 0.07, rotate: 2.8, drift: 0.12, timeScale: -0.72 },
  { colors: pad([h("#001208"), h("#006848"), h("#28c898"), h("#98ffd8")]), colorCount: 4, scale: 1.6, intensity: 0.38, warp: 0.03, rotate: 4.4, drift: 0.07, timeScale: -0.48 },
  { colors: pad([h("#180018"), h("#800060"), h("#d030a0"), h("#ffb0e0")]), colorCount: 4, scale: 2.3, intensity: 0.60, warp: 0.08, rotate: 1.3, drift: 0.14, timeScale: -0.80 },
  { colors: pad([h("#101800"), h("#607000"), h("#c0d000"), h("#f0ff80")]), colorCount: 4, scale: 1.8, intensity: 0.44, warp: 0.04, rotate: 5.65, drift: 0.09, timeScale: -0.56 },
  { colors: pad([h("#000818"), h("#005098"), h("#18a0e8"), h("#88d8ff")]), colorCount: 4, scale: 1.9, intensity: 0.46, warp: 0.04, rotate: 3.0, drift: 0.09, timeScale: -0.60 },
  { colors: pad([h("#180020"), h("#880070"), h("#e040c8"), h("#ffb0ff")]), colorCount: 4, scale: 2.0, intensity: 0.50, warp: 0.06, rotate: 0.9, drift: 0.10, timeScale: -0.65 },
  { colors: pad([h("#001008"), h("#006838"), h("#28c060"), h("#90ffb8")]), colorCount: 4, scale: 2.2, intensity: 0.56, warp: 0.07, rotate: 4.6, drift: 0.12, timeScale: -0.74 },
  { colors: pad([h("#1a0600"), h("#904000"), h("#e09020"), h("#ffe098")]), colorCount: 4, scale: 1.7, intensity: 0.42, warp: 0.03, rotate: 2.1, drift: 0.08, timeScale: -0.52 },
  { colors: pad([h("#080018"), h("#300098"), h("#7060e8"), h("#c8b8ff")]), colorCount: 4, scale: 2.0, intensity: 0.50, warp: 0.06, rotate: 5.3, drift: 0.10, timeScale: -0.65 },
  { colors: pad([h("#000c10"), h("#006080"), h("#20c0c8"), h("#98f0f8")]), colorCount: 4, scale: 1.8, intensity: 0.44, warp: 0.04, rotate: 1.6, drift: 0.09, timeScale: -0.56 },
];

export interface BookShaderProps {
  bookOrder: number;
  className?: string;
}

export function BookShader({ bookOrder, className }: BookShaderProps) {
  const idx = ((bookOrder - 1) % VARIANTS.length + VARIANTS.length) % VARIANTS.length;
  const variant = VARIANTS[idx];
  return (
    <div className={`w-full h-full ${className ?? ""}`}>
      <ShaderBackground {...variant} />
    </div>
  );
}
