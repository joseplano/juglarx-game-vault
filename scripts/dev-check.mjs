#!/usr/bin/env node

/**
 * JuglarX Game Vault — Dev Environment Check
 *
 * Usage: npm run dev-check
 *
 * Validates that all required env vars and services are configured.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function ok(msg) {
  console.log(`\x1b[32m  [OK]\x1b[0m ${msg}`);
}
function warn(msg) {
  console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`);
}
function fail(msg) {
  console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`);
}

let errors = 0;

console.log("\n========================================");
console.log("  JuglarX Game Vault — Dev Check");
console.log("========================================\n");

// 1. Check .env.local exists
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  ok(".env.local found");

  // Parse .env.local
  const envContent = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }

  // Required vars
  const required = [
    ["NEXT_PUBLIC_SUPABASE_URL", "Supabase project URL"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anonymous key"],
    ["SUPABASE_SERVICE_ROLE_KEY", "Supabase service role key (for scripts)"],
    ["OPENAI_API_KEY", "OpenAI API key (GPT-4o for game identification)"],
  ];

  for (const [key, desc] of required) {
    const val = env[key] || process.env[key];
    if (val && !val.includes("your-") && !val.includes("YOUR_")) {
      ok(`${key} — ${desc}`);
    } else {
      fail(`${key} missing — ${desc}`);
      errors++;
    }
  }
} else {
  fail(".env.local not found — copy .env.local.example to .env.local");
  errors++;
}

// 2. Check migration file
const migrationPath = resolve(
  __dirname,
  "../supabase/migrations/001_initial.sql"
);
if (existsSync(migrationPath)) {
  ok("SQL migration file found");
} else {
  fail("SQL migration file missing");
  errors++;
}

// 3. Check node_modules
const nmPath = resolve(__dirname, "../node_modules");
if (existsSync(nmPath)) {
  ok("node_modules installed");
} else {
  fail("node_modules missing — run: npm install");
  errors++;
}

// 4. Summary
console.log("\n========================================");
if (errors === 0) {
  console.log("  All checks passed! Run: npm run dev");
} else {
  console.log(`  ${errors} issue(s) found. Fix them before running dev.`);
}
console.log("========================================\n");

// 5. Camera/barcode notes
console.log("Notes for camera/barcode features:");
console.log("  - Camera requires HTTPS (or localhost).");
console.log("  - BarcodeDetector API works on Chrome Android natively.");
console.log("  - html5-qrcode provides fallback for other browsers.");
console.log("  - For full PWA features, deploy to an HTTPS domain.\n");

process.exit(errors > 0 ? 1 : 0);
