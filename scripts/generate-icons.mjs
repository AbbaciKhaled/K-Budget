/**
 * Generates the PWA / home-screen icons from the K-Budget mark.
 *   node scripts/generate-icons.mjs
 */
import sharp from "sharp";

// Mark drawn on a 32×32 grid (same as src/app/icon.svg), without its background.
const mark = `
  <path d="M10 8.5v15" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M21.5 8.5 13.6 16l7.9 7.5" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="23.5" cy="16" r="2.4" fill="#3245ff"/>`;

/** Rounded tile with the mark (purpose "any"). */
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0c0f14"/>${mark}</svg>`;

/** Full-bleed square, mark shrunk into the 80% safe zone (purpose "maskable", Apple touch icon). */
const fullBleed = (scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0c0f14"/><g transform="translate(16 16) scale(${scale}) translate(-16 -16)">${mark}</g></svg>`;

const out = [
  ["public/icons/icon-192.png", rounded, 192],
  ["public/icons/icon-512.png", rounded, 512],
  ["public/icons/icon-maskable-512.png", fullBleed(0.72), 512],
  ["src/app/apple-icon.png", fullBleed(0.8), 180],
];

for (const [file, svg, size] of out) {
  await sharp(Buffer.from(svg), { density: 2400 }).resize(size, size).png().toFile(file);
  console.log("✓", file);
}
