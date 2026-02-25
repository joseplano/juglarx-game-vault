#!/usr/bin/env node

/**
 * Generates placeholder PWA icons as simple SVG-based PNGs.
 * For production, replace with real icons.
 *
 * Usage: node scripts/generate-icons.mjs
 *
 * This creates minimal placeholder icons. Replace them with real
 * 192x192 and 512x512 PNG icons for production.
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple SVG that we'll save as an .svg placeholder
// Browsers accept SVG for development; for production use real PNGs
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#4263eb" rx="${size * 0.15}"/>
  <text x="50%" y="45%" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="bold" font-size="${size * 0.18}">GAME</text>
  <text x="50%" y="65%" text-anchor="middle" fill="#bac8ff" font-family="Arial,sans-serif" font-weight="bold" font-size="${size * 0.13}">VAULT</text>
</svg>`;

// Write SVG placeholder files (rename to .png path but contain SVG)
// For real PNGs, use a design tool or online generator
const sizes = [192, 512];

for (const size of sizes) {
  const path = resolve(__dirname, `../public/icons/icon-${size}.svg`);
  writeFileSync(path, svg(size));
  console.log(`Created: public/icons/icon-${size}.svg`);
}

console.log("\nNote: These are SVG placeholders.");
console.log("For production PWA, replace with real PNG icons:");
console.log("  - public/icons/icon-192.png (192x192)");
console.log("  - public/icons/icon-512.png (512x512)");
console.log("\nYou can generate PNGs from the SVGs using any image tool,");
console.log("or use https://realfavicongenerator.net/\n");
