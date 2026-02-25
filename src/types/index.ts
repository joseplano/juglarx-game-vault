// ============================================
// Database & domain types
// ============================================

export type GameSource = "CHATGPT" | "MANUAL";

export type ItemCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

export type ItemCompleteness =
  | "CARTRIDGE_ONLY"
  | "CIB"
  | "BOX_ONLY"
  | "MANUAL_ONLY"
  | "BOX_AND_MANUAL_NO_EXTRAS"
  | "OTHER";

export type PhotoKind = "BOX" | "CARTRIDGE" | "MANUAL" | "EXTRAS" | "OTHER";

// --- Database row types ---

export interface Game {
  id: string;
  owner_id: string;
  source: GameSource;
  title: string;
  genre: string[];
  saga: string | null;
  platform: string;
  release_date: string | null;
  summary: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  owner_id: string;
  game_id: string;
  game?: Game;
  region: string | null;
  condition: ItemCondition;
  completeness: ItemCompleteness;
  has_cartridge: boolean;
  has_box: boolean;
  has_manual: boolean;
  has_extras: boolean;
  notes: string | null;
  barcode: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  owner_id: string;
  item_id: string;
  kind: PhotoKind;
  storage_path: string;
  public_url: string | null;
  created_at: string;
}

// --- Search result returned by ChatGPT ---

export interface GameSearchResult {
  title: string;
  platform: string;
  genres: string[];
  franchise: string | null;
  release_date: string | null;
  summary: string | null;
  region: string | null;
  cover_url: string | null;
}

// --- Form types ---

export interface GameFormData {
  title: string;
  platform: string;
  genre: string[];
  saga: string;
  release_date: string;
  summary: string;
}

export interface ItemFormData {
  region: string;
  condition: ItemCondition;
  completeness: ItemCompleteness;
  has_cartridge: boolean;
  has_box: boolean;
  has_manual: boolean;
  has_extras: boolean;
  notes: string;
  barcode: string;
}
