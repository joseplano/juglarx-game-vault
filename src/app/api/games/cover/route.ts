import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/games/cover — Upload a rotated cover image for a game.
 * Expects multipart form data with: file, game_id
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const gameId = formData.get("game_id") as string;

  if (!file || !gameId) {
    return NextResponse.json(
      { error: "file and game_id are required" },
      { status: 400 }
    );
  }

  // Verify game belongs to user
  const { data: game } = await supabase
    .from("games")
    .select("id, cover_url")
    .eq("id", gameId)
    .eq("owner_id", user.id)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Delete old cover from storage if it was a storage: reference
  if (game.cover_url?.startsWith("storage:")) {
    const oldPath = game.cover_url.slice("storage:".length);
    await supabase.storage.from("item-photos").remove([oldPath]);
  }

  // Upload new cover
  const storagePath = `${user.id}/covers/${gameId}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("item-photos")
    .upload(storagePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("Cover upload error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload cover" },
      { status: 500 }
    );
  }

  // Update game cover_url
  const { error: updateError } = await supabase
    .from("games")
    .update({ cover_url: `storage:${storagePath}` })
    .eq("id", gameId);

  if (updateError) {
    console.error("Update cover error:", updateError);
    return NextResponse.json(
      { error: "Failed to update cover" },
      { status: 500 }
    );
  }

  // Return signed URL for immediate display
  const { data: signedUrlData } = await supabase.storage
    .from("item-photos")
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json({
    cover_url: signedUrlData?.signedUrl ?? null,
  });
}
