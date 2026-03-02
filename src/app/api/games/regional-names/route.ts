import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRegionalNames, isChatGPTConfigured } from "@/lib/chatgpt";

/**
 * POST /api/games/regional-names
 * Re-query ChatGPT for regional names of a specific game.
 * Body: { game_id: string }
 */
export async function POST(request: NextRequest) {
  if (!isChatGPTConfigured()) {
    return NextResponse.json(
      { error: "ChatGPT is not configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { game_id } = body;
  if (!game_id) {
    return NextResponse.json({ error: "game_id is required" }, { status: 400 });
  }

  // Fetch the game
  const { data: game } = await supabase
    .from("games")
    .select("id, title, platform, regional_query_count")
    .eq("id", game_id)
    .eq("owner_id", user.id)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Query ChatGPT for regional names
  const { name_america, name_europe } = await fetchRegionalNames(
    game.title,
    game.platform
  );

  // Update the game
  const { data: updated, error } = await supabase
    .from("games")
    .update({
      name_america,
      name_europe,
      regional_names_fetched: true,
      regional_query_count: (game.regional_query_count ?? 0) + 1,
    })
    .eq("id", game_id)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update game" },
      { status: 500 }
    );
  }

  return NextResponse.json({ game: updated });
}
