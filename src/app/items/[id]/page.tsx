import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ItemDetail from "./item-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch item with game
  const { data: item } = await supabase
    .from("items")
    .select("*, game:games(*)")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!item) notFound();

  // Fetch photos
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("item_id", id)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  // Resolve storage: cover URL to signed URL and find cover photo ID
  let coverPhotoId: string | null = null;
  if (item.game?.cover_url?.startsWith("storage:")) {
    const path = item.game.cover_url.slice("storage:".length);
    const { data } = await supabase.storage
      .from("item-photos")
      .createSignedUrl(path, 3600);
    item.game.cover_url = data?.signedUrl ?? null;

    // Find which photo matches this storage path
    const match = (photos ?? []).find((p) => p.storage_path === path);
    if (match) coverPhotoId = match.id;
  }

  // Generate signed URLs for private bucket photos
  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("item-photos")
        .createSignedUrl(photo.storage_path, 3600); // 1 hour
      return {
        ...photo,
        public_url: data?.signedUrl ?? photo.public_url,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-4">
        <ItemDetail item={item} photos={photosWithUrls} initialCoverPhotoId={coverPhotoId} />
      </main>
    </div>
  );
}
