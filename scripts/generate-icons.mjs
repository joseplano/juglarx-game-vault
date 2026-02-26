#!/usr/bin/env node

/**
 * Generates PWA icons as PNG files using sharp.
 *
 * Usage: node scripts/generate-icons.mjs
 *
 * Creates 192x192 and 512x512 PNG icons in public/icons/
 * Design: Blue gradient background with gamepad icon and "GV" text
 */

import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

const svg = (size) => {
  const r = size * 0.15;
  const pad = size * 0.08;

  // Gamepad SVG path scaled to the icon
  const gpW = size * 0.52;
  const gpH = size * 0.28;
  const gpX = (size - gpW) / 2;
  const gpY = size * 0.18;

  // D-pad dimensions
  const dSize = gpH * 0.22;
  const dX = gpX + gpW * 0.22;
  const dY = gpY + gpH * 0.38;

  // Buttons
  const btnR = gpH * 0.08;
  const btnX = gpX + gpW * 0.72;
  const btnY = gpY + gpH * 0.42;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#364fc7"/>
      <stop offset="100%" stop-color="#5c7cfa"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="white" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${r}"/>
  <rect width="${size}" height="${size * 0.5}" fill="url(#shine)" rx="${r}"/>

  <!-- Gamepad body -->
  <rect x="${gpX}" y="${gpY}" width="${gpW}" height="${gpH}" rx="${gpH * 0.35}" fill="white" fill-opacity="0.2"/>

  <!-- Left grip -->
  <ellipse cx="${gpX + gpW * 0.15}" cy="${gpY + gpH * 0.95}" rx="${gpW * 0.12}" ry="${gpH * 0.35}" fill="white" fill-opacity="0.2"/>
  <!-- Right grip -->
  <ellipse cx="${gpX + gpW * 0.85}" cy="${gpY + gpH * 0.95}" rx="${gpW * 0.12}" ry="${gpH * 0.35}" fill="white" fill-opacity="0.2"/>

  <!-- D-pad -->
  <rect x="${dX - dSize * 0.33}" y="${dY - dSize}" width="${dSize * 0.66}" height="${dSize * 2}" rx="${dSize * 0.1}" fill="white" fill-opacity="0.5"/>
  <rect x="${dX - dSize}" y="${dY - dSize * 0.33}" width="${dSize * 2}" height="${dSize * 0.66}" rx="${dSize * 0.1}" fill="white" fill-opacity="0.5"/>

  <!-- Action buttons -->
  <circle cx="${btnX}" cy="${btnY - btnR * 1.6}" r="${btnR}" fill="#ff6b6b" fill-opacity="0.8"/>
  <circle cx="${btnX + btnR * 1.6}" cy="${btnY}" r="${btnR}" fill="#51cf66" fill-opacity="0.8"/>
  <circle cx="${btnX - btnR * 1.6}" cy="${btnY}" r="${btnR}" fill="#fcc419" fill-opacity="0.8"/>
  <circle cx="${btnX}" cy="${btnY + btnR * 1.6}" r="${btnR}" fill="#339af0" fill-opacity="0.8"/>

  <!-- Text "GV" -->
  <text x="50%" y="${size * 0.72}" text-anchor="middle" dominant-baseline="central"
    fill="white" font-family="Arial,Helvetica,sans-serif" font-weight="900"
    font-size="${size * 0.28}" letter-spacing="${size * 0.02}">GV</text>

  <!-- Subtitle -->
  <text x="50%" y="${size * 0.88}" text-anchor="middle" dominant-baseline="central"
    fill="#bac8ff" font-family="Arial,Helvetica,sans-serif" font-weight="700"
    font-size="${size * 0.08}" letter-spacing="${size * 0.015}">GAME VAULT</text>
</svg>`;
};

const sizes = [192, 512];

for (const size of sizes) {
  const outPath = resolve(outDir, `icon-${size}.png`);
  await sharp(Buffer.from(svg(size)))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`Created: public/icons/icon-${size}.png (${size}x${size})`);
}

console.log("\nPWA icons generated successfully!");
