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

  // Validate release_date is a proper YYYY-MM-DD format, otherwise set to null
  let validDate: string | null = null;
  if (release_date && /^\d{4}-\d{2}-\d{2}$/.test(release_date)) {
    validDate = release_date;
  }

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      owner_id: user.id,
      source: gameSource,
      title,
      platform,
      genre: genre ?? [],
      saga: saga || null,
      release_date: validDate,
      summary: summary || null,
      cover_url: cover_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Create game error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create game" },
      { status: 500 }
    );
  }

  return NextResponse.json({ game });
}

/**
 * PATCH /api/games — Update a game's cover from a user photo.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { game_id, photo_id } = body;

  if (!game_id || !photo_id) {
    return NextResponse.json(
      { error: "game_id and photo_id are required" },
      { status: 400 }
    );
  }

  // Verify the game belongs to this user
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("id", game_id)
    .eq("owner_id", user.id)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Get the photo's storage_path
  const { data: photo } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("id", photo_id)
    .eq("owner_id", user.id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Store the storage_path as cover reference (resolved to signed URL on page load)
  const { error } = await supabase
    .from("games")
    .update({ cover_url: `storage:${photo.storage_path}` })
    .eq("id", game_id);

  if (error) {
    console.error("Update cover error:", error);
    return NextResponse.json(
      { error: "Failed to update cover" },
      { status: 500 }
    );
  }

  // Return a signed URL for immediate display
  const { data: signedUrlData } = await supabase.storage
    .from("item-photos")
    .createSignedUrl(photo.storage_path, 3600);

  return NextResponse.json({
    cover_url: signedUrlData?.signedUrl ?? null,
  });
}
