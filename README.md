# JuglarX Game Vault

Personal retro game collection tracker. Web app + installable PWA (Android).

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (server-side)
- **Database**: Supabase (Postgres + Auth + Storage)
- **Game Data**: IGDB API (via Twitch OAuth)
- **Barcode**: UPCitemdb (free) / BarcodeDetector API
- **OCR**: Tesseract.js (local, free)
- **PWA**: next-pwa (service worker + manifest)

## Prerequisites

- Node.js 18+
- npm
- A Supabase project (free tier works)
- Twitch Developer credentials (for IGDB game search)

---

## 1. How to Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in.
2. Click **"New Project"**.
3. Choose an organization, set a project name (e.g. `game-vault`), set a database password, and select a region close to you.
4. Wait for the project to provision (~2 min).
5. Go to **Settings > API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

> **IMPORTANT**: The service_role key has admin access. Never expose it in client code. Only use it in server scripts.

---

## 2. How to Get Twitch / IGDB Credentials

IGDB (Internet Game Database) uses Twitch authentication:

1. Go to [dev.twitch.tv](https://dev.twitch.tv/) and log in (create account if needed).
2. Go to **Console** → **Applications** → **Register Your Application**.
3. Fill in:
   - **Name**: `game-vault` (anything unique)
   - **OAuth Redirect URLs**: `http://localhost` (required but not used)
   - **Category**: Application Integration
4. Click **Create**.
5. Click **Manage** on your new app.
6. Copy:
   - **Client ID** → `TWITCH_CLIENT_ID`
   - Click **New Secret** → copy → `TWITCH_CLIENT_SECRET`

The app uses these server-side to get an OAuth token and query the IGDB API.

---

## 3. Setup (Step by Step)

### 3.1 Clone and install

```bash
cd D:\juglarx\GameCollection
npm install
```

### 3.2 Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
INIT_USER_EMAIL=your-email@example.com
INIT_USER_PASSWORD=your-secure-password
```

### 3.3 Run the setup script

```bash
npm run setup
```

This will:
- Verify Supabase connection
- Create the `item-photos` storage bucket
- Create your initial user (email/password hashed via Supabase Auth)
- Print the SQL migration to copy into Supabase SQL Editor

### 3.4 Run the SQL migration

1. Go to your Supabase Dashboard → **SQL Editor**.
2. Click **New query**.
3. Paste the contents of `supabase/migrations/001_initial.sql`.
4. Click **Run**.

This creates all tables (games, items, photos), RLS policies, indexes, and storage policies.

### 3.5 Generate placeholder icons

```bash
node scripts/generate-icons.mjs
```

For production, replace the SVGs in `public/icons/` with real 192x192 and 512x512 PNG icons.

### 3.6 Run dev

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with your email/password.

---

## 4. Database Schema

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    games     │       │    items     │       │    photos    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (uuid pk) │◄──┐   │ id (uuid pk) │◄──┐   │ id (uuid pk) │
│ owner_id     │   │   │ owner_id     │   │   │ owner_id     │
│ igdb_id      │   └───│ game_id (fk) │   └───│ item_id (fk) │
│ source       │       │ region       │       │ kind         │
│ title        │       │ condition    │       │ storage_path │
│ genre[]      │       │ completeness │       │ public_url   │
│ saga         │       │ has_cartridge│       │ created_at   │
│ platform     │       │ has_box      │       └──────────────┘
│ release_date │       │ has_manual   │
│ summary      │       │ has_extras   │
│ cover_url    │       │ notes        │
│ created_at   │       │ barcode      │
└──────────────┘       │ created_at   │
                       └──────────────┘
```

**RLS**: All tables enforce `owner_id = auth.uid()` on all operations.

---

## 5. Features

### Authentication
- Email + password login via Supabase Auth
- Persistent sessions (cookie-based)
- Middleware redirects unauthenticated users to `/login`

### Add Item (3 Methods)
1. **Scan Barcode** — Camera barcode scanner → UPCitemdb lookup → IGDB search → top 5 results
2. **Photo Identify** — Camera/upload → Tesseract OCR → IGDB search → top 5 results
3. **Manual Search** — Text search → IGDB autocomplete → top 5 results

All methods:
- Show top 5 IGDB matches for user confirmation
- Allow "Create game manually" if no match
- After game selection: fill item details (condition, completeness, region, notes)
- Upload photos (Box, Cartridge, Manual, Extras, Other) to Supabase Storage

### Collection View
- List all items with cover art, title, platform, condition, completeness
- Filter by platform, region, condition, completeness
- Search by title
- Platform stats bar

### Item Detail
- Full game info (from IGDB cache or manual entry)
- Edit item details
- Photo gallery with lightbox
- Add more photos
- Delete item (with photo cleanup)

---

## 6. Deploy to Vercel

### 6.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial JuglarX Game Vault"
git remote add origin https://github.com/YOUR_USER/juglarx-game-vault.git
git push -u origin main
```

### 6.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Import Project → select your repo.
2. Framework preset: **Next.js** (auto-detected).
3. Add environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `TWITCH_CLIENT_ID` | your twitch client id |
| `TWITCH_CLIENT_SECRET` | your twitch client secret |

4. Click **Deploy**.
5. After deploy, your app is at `https://your-app.vercel.app`.

> Make sure to add your Vercel URL to Supabase Auth → URL Configuration → Site URL.

---

## 7. Install PWA on Android

1. Open your deployed app in **Chrome for Android**.
2. Login to verify it works.
3. Tap the **three-dot menu** (⋮) → **"Add to Home screen"** or **"Install app"**.
4. The app will appear on your home screen as a standalone app.
5. Camera and barcode features work natively in the PWA.

### Requirements for PWA
- App must be served over **HTTPS** (Vercel provides this).
- `manifest.json` must be valid (check in Chrome DevTools → Application tab).
- Service worker must be registered (auto-handled by next-pwa in production).

---

## 8. Optional Features

### Google Cloud Vision (better OCR)

For more accurate image identification:

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Cloud Vision API**.
3. Create an API key.
4. Add to `.env.local`:
   ```
   GOOGLE_CLOUD_API_KEY=your-key
   ```
5. The app will automatically use Google Vision instead of Tesseract.js.

### BarcodeLookup (better barcode data)

For more reliable barcode lookups:

1. Get an API key from [barcodelookup.com](https://www.barcodelookup.com/api).
2. Add to `.env.local`:
   ```
   BARCODE_LOOKUP_API_KEY=your-key
   ```
3. The app will use BarcodeLookup instead of UPCitemdb.

---

## 9. Optional: Build APK with Bubblewrap (TWA)

To package the PWA as a native Android APK:

### Prerequisites
- Node.js 18+
- Java JDK 11+
- Android SDK (via Android Studio)

### Steps

```bash
# Install Bubblewrap CLI
npm install -g @nicolo-ribaudo/bubblewrap

# Initialize TWA project
bubblewrap init --manifest=https://your-app.vercel.app/manifest.json

# Answer the prompts:
# - Package ID: com.juglarx.gamevault
# - App name: Game Vault
# - Launcher name: Game Vault
# - Theme color: #4263eb
# - Accept defaults for the rest

# Build the APK
bubblewrap build

# Output: app-release-signed.apk
# Transfer to your Android device and install
```

> Note: You need to verify domain ownership via Digital Asset Links for production.
> See: https://developer.chrome.com/docs/android/trusted-web-activity/

---

## 10. Project Structure

```
GameCollection/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # PWA icons
├── scripts/
│   ├── setup.mjs              # Interactive setup
│   ├── dev-check.mjs          # Environment validator
│   └── generate-icons.mjs     # Icon placeholder generator
├── supabase/
│   └── migrations/
│       └── 001_initial.sql    # Database schema + RLS
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home (collection list)
│   │   ├── globals.css        # Tailwind + custom styles
│   │   ├── collection-list.tsx
│   │   ├── login/page.tsx     # Login page
│   │   ├── items/
│   │   │   ├── new/page.tsx   # Add item (3 methods)
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Item detail (server)
│   │   │       └── item-detail.tsx
│   │   └── api/
│   │       ├── search/igdb/   # IGDB text search
│   │       ├── igdb/game/     # IGDB game fetch + upsert
│   │       ├── identify/
│   │       │   ├── barcode/   # Barcode → lookup → IGDB
│   │       │   └── image/     # OCR → IGDB
│   │       ├── games/         # Manual game creation
│   │       ├── items/         # CRUD items
│   │       └── photos/        # Photo upload/delete
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── BarcodeScanner.tsx
│   │   ├── PhotoCapture.tsx
│   │   ├── PhotoUploader.tsx
│   │   ├── PhotoGallery.tsx
│   │   ├── GameSearchResults.tsx
│   │   ├── ManualGameForm.tsx
│   │   ├── ItemForm.tsx
│   │   ├── ItemCard.tsx
│   │   └── Filters.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Browser Supabase client
│   │   │   ├── server.ts      # Server Supabase client
│   │   │   └── admin.ts       # Admin client (service role)
│   │   ├── igdb.ts            # IGDB API module
│   │   ├── barcode-lookup.ts  # Barcode provider
│   │   ├── ocr.ts             # OCR module
│   │   ├── constants.ts       # Platforms, regions, enums
│   │   └── utils.ts           # Helpers
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── middleware.ts           # Auth middleware
├── .env.local.example
├── .gitignore
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 11. Troubleshooting

### "Unauthorized" errors
- Make sure you ran the SQL migration (step 3.4).
- Check that your user was created (run `npm run setup` again).
- Clear browser cookies and log in again.

### Camera not working
- Camera requires HTTPS or `localhost`.
- Check browser permissions (Settings → Site permissions → Camera).
- On desktop, `BarcodeDetector` is only available in Chrome. The app falls back to html5-qrcode.

### IGDB search returns no results
- Verify `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env.local`.
- Check the Twitch Developer Console that your app is active.
- IGDB might not have data for very obscure games.

### Photos not uploading
- Verify the `item-photos` storage bucket exists in Supabase Dashboard → Storage.
- Verify storage policies were applied (they're in the migration SQL).
- Check browser console for errors.

### PWA not installable
- Must be on HTTPS (not localhost in production).
- Check Chrome DevTools → Application → Manifest for errors.
- Service worker only registers in production build (`npm run build && npm start`).

### "Missing environment variable" errors
- Run `npm run dev-check` to validate all variables.
- Make sure `.env.local` exists (not `.env.local.example`).

### RLS policy errors
- All tables require `owner_id = auth.uid()`. Make sure you're authenticated.
- The setup script creates the user with `email_confirm: true` so no email verification is needed.
