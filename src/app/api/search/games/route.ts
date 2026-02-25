import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchByTitle, isChatGPTConfigured } from "@/lib/chatgpt";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isChatGPTConfigured()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured in .env.local" },
      { status: 503 }
    );
  }

  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const results = await searchByTitle(query.trim());
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Game search error:", err);
    return NextResponse.json(
      { error: "Failed to search games" },
      { status: 500 }
    );
  }
}
