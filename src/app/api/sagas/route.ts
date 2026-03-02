import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sagas — Return all unique saga names for the authenticated user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("games")
    .select("saga")
    .eq("owner_id", user.id)
    .not("saga", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate and sort
  const sagas = Array.from(
    new Set(
      (data ?? [])
        .map((g) => g.saga as string)
        .filter(Boolean)
        .map((s) => s.trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ sagas });
}
