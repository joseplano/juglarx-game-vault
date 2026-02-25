import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { identifyFromImage, isChatGPTConfigured, fetchGameCover } from "@/lib/chatgpt";

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

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Image file required" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const results = await identifyFromImage(base64, mimeType);

    const resultsWithCovers = await Promise.all(
      results.map(async (r) => ({
        ...r,
        cover_url: await fetchGameCover(r.title),
      }))
    );

    return NextResponse.json({ results: resultsWithCovers });
  } catch (err) {
    console.error("Image identify error:", err);
    return NextResponse.json(
      { error: "Failed to identify image" },
      { status: 500 }
    );
  }
}
