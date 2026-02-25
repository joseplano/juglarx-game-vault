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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-4">
        <ItemDetail item={item} photos={photos ?? []} />
      </main>
    </div>
  );
}
