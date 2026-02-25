import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/games — Create a game (from ChatGPT identification or manual).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, platform, genre, saga, release_date, summary, cover_url, source } =
    body;

  if (!title || !platform) {
    return NextResponse.json(
      { error: "Title and platform are required" },
      { status: 400 }
    );
  }

  const gameSource = source === "CHATGPT" ? "CHATGPT" : "MANUAL";

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      owner_id: user.id,
      source: gameSource,
      title,
      platform,
      genre: genre ?? [],
      saga: saga || null,
      release_date: release_date || null,
      summary: summary || null,
      cover_url: cover_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Create game error:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }

  return NextResponse.json({ game });
}
