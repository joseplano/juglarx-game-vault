#!/usr/bin/env node

/**
 * JuglarX Game Vault — Interactive Setup Script
 *
 * Usage: npm run setup
 *
 * This script:
 * 1. Checks for required env vars (prompts if missing)
 * 2. Verifies Supabase connection
 * 3. Creates storage bucket if it doesn't exist
 * 4. Creates the initial user in Supabase Auth
 * 5. Prints instructions for running the SQL migration
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function log(msg) {
  console.log(`\x1b[36m[setup]\x1b[0m ${msg}`);
}
function success(msg) {
  console.log(`\x1b[32m[OK]\x1b[0m ${msg}`);
}
function warn(msg) {
  console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`);
}
function fail(msg) {
  console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`);
}

async function main() {
  console.log("\n========================================");
  console.log("  JuglarX Game Vault — Setup");
  console.log("========================================\n");

  // 1. Check env vars
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let userEmail = process.env.INIT_USER_EMAIL;
  let userPassword = process.env.INIT_USER_PASSWORD;

  if (!supabaseUrl) {
    supabaseUrl = await ask("Supabase URL (https://xxx.supabase.co): ");
  }
  if (!serviceRoleKey) {
    serviceRoleKey = await ask("Supabase Service Role Key: ");
  }
  if (!userEmail) {
    userEmail = await ask("Initial user email: ");
  }
  if (!userPassword) {
    userPassword = await ask("Initial user password: ");
  }

  if (!supabaseUrl || !serviceRoleKey) {
    fail("Supabase URL and Service Role Key are required.");
    process.exit(1);
  }

  // 2. Connect to Supabase
  log("Connecting to Supabase...");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify connection by listing buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    fail(`Cannot connect to Supabase: ${bucketsError.message}`);
    fail("Check your SUPABASE_URL and SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  success("Connected to Supabase.");

  // 3. Create storage bucket
  const bucketName = "item-photos";
  const exists = buckets?.some((b) => b.id === bucketName);
  if (exists) {
    success(`Storage bucket '${bucketName}' already exists.`);
  } else {
    log(`Creating storage bucket '${bucketName}'...`);
    const { error: createErr } = await supabase.storage.createBucket(
      bucketName,
      { public: false }
    );
    if (createErr) {
      warn(`Could not create bucket: ${createErr.message}`);
      warn("You may need to create it manually in the Supabase dashboard.");
    } else {
      success(`Storage bucket '${bucketName}' created.`);
    }
  }

  // 4. Create initial user
  if (userEmail && userPassword) {
    log(`Creating user ${userEmail}...`);
    const { data: userData, error: userErr } =
      await supabase.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true,
      });

    if (userErr) {
      if (userErr.message.includes("already been registered")) {
        success(`User ${userEmail} already exists.`);
      } else {
        warn(`Could not create user: ${userErr.message}`);
      }
    } else {
      success(`User created: ${userData.user?.email} (ID: ${userData.user?.id})`);
    }
  }

  // 5. Print SQL migration instructions
  console.log("\n========================================");
  console.log("  SQL Migration");
  console.log("========================================\n");

  const migrationPath = resolve(__dirname, "../supabase/migrations/001_initial.sql");
  try {
    const sql = readFileSync(migrationPath, "utf-8");
    log("Migration file found at: supabase/migrations/001_initial.sql");
    log("Run this SQL in your Supabase Dashboard > SQL Editor:");
    console.log("\n--- Copy everything below this line ---\n");
    console.log(sql);
    console.log("\n--- End of SQL ---\n");
  } catch {
    warn("Migration file not found. Ensure supabase/migrations/001_initial.sql exists.");
  }

  console.log("========================================");
  console.log("  Setup Complete!");
  console.log("========================================");
  console.log("\nNext steps:");
  console.log("1. Run the SQL migration in Supabase SQL Editor");
  console.log("2. Make sure .env.local has all required values");
  console.log("3. Run: npm run dev");
  console.log("4. Open http://localhost:3000 and login\n");

  rl.close();
}

main().catch((err) => {
  fail(err.message);
  process.exit(1);
});
