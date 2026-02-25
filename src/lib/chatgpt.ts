/**
 * ChatGPT (OpenAI GPT-4o Vision) module — server-only.
 * Single service for all game identification:
 *   - Photo of box/cartridge/manual → identify game
 *   - Barcode number → identify game
 *   - Text query → search games
 */

import OpenAI from "openai";
import type { GameSearchResult } from "@/types";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in .env.local");
  }
  return new OpenAI({ apiKey });
}

export function isChatGPTConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

const SYSTEM_PROMPT = `You are a video game identification expert with deep knowledge of retro and modern games across all platforms.

When given an image, barcode, or title query, identify the game(s) and return structured information.

ALWAYS respond with valid JSON in this exact format:
{
  "games": [
    {
      "title": "Exact game title",
      "platform": "Original platform (e.g. SNES, N64, Genesis, Game Boy, Neo Geo, Dreamcast, etc.)",
      "genres": ["Genre1", "Genre2"],
      "franchise": "Franchise or saga name, or null if standalone",
      "release_date": "YYYY-MM-DD format, or null if unknown",
      "summary": "Brief 1-2 sentence description of the game",
      "region": "NTSC-J or NTSC-U or PAL or PAL-M or Region Free, based on the image/context"
    }
  ]
}

Rules:
- Return 1-5 matches ordered by confidence (most likely first).
- For images: look at box art, cartridge labels, text, logos, platform markings, region codes.
- For barcodes: use your knowledge of game UPC/EAN codes.
- For text queries: return the most relevant games matching the title.
- Platform should match common abbreviations: SNES, SFC, N64, NES, FC, Game Boy, GBA, GBC, NDS, Neo Geo, Neo Geo CD, Dreamcast, Saturn, Genesis, Mega Drive, Master System, PC, Amiga, MSX, Atari Jaguar.
- If you cannot identify the game at all, return {"games": []}.
- Never invent games that don't exist. Only return real, published games.`;

/**
 * Identify a game from a photo (box, cartridge, manual, etc.)
 */
export async function identifyFromImage(
  imageBase64: string,
  mimeType = "image/jpeg"
): Promise<GameSearchResult[]> {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Look at this image of a video game (box, cartridge, manual, or screen). Identify the game and return all details. Pay attention to any text, logos, platform markings, and region codes visible in the image.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
    max_tokens: 1500,
  });

  return parseResponse(response);
}

/**
 * Identify a game from a barcode (EAN/UPC).
 */
export async function identifyFromBarcode(
  barcode: string
): Promise<GameSearchResult[]> {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `This barcode/UPC/EAN was scanned from a physical video game: ${barcode}\n\nIdentify which game this barcode belongs to. Return the game details. If you're not sure, return your best guesses.`,
      },
    ],
    max_tokens: 1500,
  });

  return parseResponse(response);
}

/**
 * Search for games by title/query.
 */
export async function searchByTitle(
  query: string
): Promise<GameSearchResult[]> {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Search for video games matching: "${query}"\n\nReturn up to 5 results with full details. Include different platform versions if relevant.`,
      },
    ],
    max_tokens: 2000,
  });

  return parseResponse(response);
}

/**
 * Fetch a game cover image from Wikipedia.
 */
export async function fetchGameCover(title: string): Promise<string | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title + " video game")}&srlimit=1&format=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const pageTitle = searchData?.query?.search?.[0]?.title;
    if (!pageTitle) return null;

    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=thumbnail&pithumbsize=300&format=json`;
    const imageRes = await fetch(imageUrl);
    const imageData = await imageRes.json();

    const pages = imageData?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as Record<string, unknown>;
    const thumbnail = page?.thumbnail as Record<string, string> | undefined;
    return thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

// --- Internal ---

interface RawGameResult {
  title?: string;
  platform?: string;
  genres?: string[];
  franchise?: string | null;
  release_date?: string | null;
  summary?: string | null;
  region?: string | null;
}

function parseResponse(
  response: OpenAI.Chat.Completions.ChatCompletion
): GameSearchResult[] {
  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    const games: RawGameResult[] = parsed.games ?? [];

    return games
      .filter((g) => g.title)
      .map((g) => ({
        title: g.title!,
        platform: g.platform ?? "Unknown",
        genres: g.genres ?? [],
        franchise: g.franchise ?? null,
        release_date: g.release_date ?? null,
        summary: g.summary ?? null,
        region: g.region ?? null,
        cover_url: null,
      }));
  } catch (err) {
    console.error("Failed to parse ChatGPT response:", content, err);
    return [];
  }
}
