import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/items — Create a new collection item.
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
  const {
    game_id,
    region,
    condition,
    completeness,
    has_cartridge,
    has_box,
    has_manual,
    has_extras,
    notes,
    barcode,
  } = body;

  if (!game_id) {
    return NextResponse.json(
      { error: "game_id is required" },
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

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      owner_id: user.id,
      game_id,
      region: region || null,
      condition: condition || "GOOD",
      completeness: completeness || "CIB",
      has_cartridge: has_cartridge ?? true,
      has_box: has_box ?? false,
      has_manual: has_manual ?? false,
      has_extras: has_extras ?? false,
      notes: notes || null,
      barcode: barcode || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }

  return NextResponse.json({ item });
}
