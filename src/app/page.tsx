import { createClient } from "@/lib/supabase/server";
import { fetchGameCover } from "@/lib/chatgpt";
import Navbar from "@/components/Navbar";
import CollectionList from "./collection-list";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch items with their game data
  const { data: items } = await supabase
    .from("items")
    .select("*, game:games(*)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch covers for games that don't have one yet
  const gamesWithoutCover = (items ?? [])
    .filter((item) => item.game && !item.game.cover_url)
    .map((item) => item.game);

  if (gamesWithoutCover.length > 0) {
    await Promise.all(
      gamesWithoutCover.map(async (game) => {
        const cover_url = await fetchGameCover(game.title);
        if (cover_url) {
          await supabase
            .from("games")
            .update({ cover_url })
            .eq("id", game.id);
          game.cover_url = cover_url;
        }
      })
    );
  }

  // Resolve storage: cover URLs to signed URLs
  await Promise.all(
    (items ?? []).map(async (item) => {
      if (item.game?.cover_url?.startsWith("storage:")) {
        const path = item.game.cover_url.slice("storage:".length);
        const { data } = await supabase.storage
          .from("item-photos")
          .createSignedUrl(path, 3600);
        item.game.cover_url = data?.signedUrl ?? null;
      }
    })
  );

  // Platform stats
  const platformCounts: Record<string, number> = {};
  for (const item of items ?? []) {
    const platform = item.game?.platform ?? "Unknown";
    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-4">
        {/* Stats bar */}
        <div className="mb-4 flex items-center gap-4 overflow-x-auto pb-2">
          <div className="flex-shrink-0 rounded-lg bg-vault-600 px-3 py-1.5 text-sm font-bold text-white">
            {items?.length ?? 0} items
          </div>
          {Object.entries(platformCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([platform, count]) => (
              <div
                key={platform}
                className="flex-shrink-0 rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700"
              >
                {platform}: {count}
              </div>
            ))}
        </div>

        <CollectionList initialItems={items ?? []} />
      </main>
    </div>
  );
}
