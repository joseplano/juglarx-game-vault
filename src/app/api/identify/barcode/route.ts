import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { identifyFromBarcode, isChatGPTConfigured, fetchGameCover } from "@/lib/chatgpt";

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const barcode = body.barcode as string;

  if (!barcode) {
    return NextResponse.json({ error: "Barcode required" }, { status: 400 });
  }

  try {
    const results = await identifyFromBarcode(barcode);

    const resultsWithCovers = await Promise.all(
      results.map(async (r) => ({
        ...r,
        cover_url: await fetchGameCover(r.title),
      }))
    );

    return NextResponse.json({
      barcode,
      results: resultsWithCovers,
    });
  } catch (err) {
    console.error("Barcode identify error:", err);
    return NextResponse.json(
      { error: "Failed to identify barcode" },
      { status: 500 }
    );
  }
}
