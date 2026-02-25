import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/photos — Upload a photo for an item.
 * Expects multipart form data with: file, item_id, kind
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
  const itemId = formData.get("item_id") as string;
  const kind = formData.get("kind") as string;

  if (!file || !itemId || !kind) {
    return NextResponse.json(
      { error: "file, item_id, and kind are required" },
      { status: 400 }
    );
  }

  // Verify item belongs to user
  const { data: item } = await supabase
    .from("items")
    .select("id")
    .eq("id", itemId)
    .eq("owner_id", user.id)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Upload to Supabase Storage
  const ts = Date.now();
  const storagePath = `${user.id}/${itemId}/${kind.toLowerCase()}/${ts}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("item-photos")
    .upload(storagePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }

  // Get signed URL for private bucket
  const { data: signedUrlData } = await supabase.storage
    .from("item-photos")
    .createSignedUrl(storagePath, 3600); // 1 hour

  const photoUrl = signedUrlData?.signedUrl ?? null;

  // Save photo record
  const { data: photo, error } = await supabase
    .from("photos")
    .insert({
      owner_id: user.id,
      item_id: itemId,
      kind,
      storage_path: storagePath,
      public_url: photoUrl,
    })
    .select()
    .single();

  if (error) {
    console.error("Save photo error:", error);
    return NextResponse.json(
      { error: "Failed to save photo record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ photo });
}

/**
 * DELETE /api/photos?id=xxx — Delete a photo.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photoId = request.nextUrl.searchParams.get("id");
  if (!photoId) {
    return NextResponse.json({ error: "Photo ID required" }, { status: 400 });
  }

  // Get photo to delete from storage
  const { data: photo } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("owner_id", user.id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Delete from storage
  await supabase.storage.from("item-photos").remove([photo.storage_path]);

  // Delete record
  await supabase
    .from("photos")
    .delete()
    .eq("id", photoId)
    .eq("owner_id", user.id);

  return NextResponse.json({ success: true });
}
