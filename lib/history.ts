export interface HistoryItem {
  id: string;
  url: string;
  platform: "instagram" | "linkedin";
  customName?: string;
  firstUsedAt: number;
  authorUsername?: string;
  itemCount?: number;
}

const STORAGE_KEY = "omnistream_recent_links";

export function getLinkHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLinkToHistory(entry: {
  url: string;
  platform: "instagram" | "linkedin";
  customName?: string;
  authorUsername?: string;
  itemCount?: number;
}): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getLinkHistory();
    const cleanUrl = entry.url.trim();
    if (!cleanUrl) return current;

    // Check if URL already exists
    const existingIndex = current.findIndex(
      (item) => item.url.toLowerCase() === cleanUrl.toLowerCase()
    );

    let updated: HistoryItem[];
    if (existingIndex >= 0) {
      // Move to top and update metadata if provided
      const existing = current[existingIndex];
      const updatedItem: HistoryItem = {
        ...existing,
        platform: entry.platform || existing.platform,
        authorUsername: entry.authorUsername || existing.authorUsername,
        itemCount: entry.itemCount ?? existing.itemCount,
        customName: entry.customName || existing.customName,
        firstUsedAt: Date.now(),
      };
      updated = [
        updatedItem,
        ...current.filter((_, idx) => idx !== existingIndex),
      ];
    } else {
      const newItem: HistoryItem = {
        id: "hist_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        url: cleanUrl,
        platform: entry.platform,
        customName: entry.customName,
        firstUsedAt: Date.now(),
        authorUsername: entry.authorUsername,
        itemCount: entry.itemCount,
      };
      updated = [newItem, ...current];
    }

    // Limit to max 30 items
    const sliced = updated.slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
    return sliced;
  } catch {
    return [];
  }
}

export function updateHistoryItemName(id: string, customName: string): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getLinkHistory();
    const updated = current.map((item) =>
      item.id === id ? { ...item, customName: customName.trim() } : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteHistoryItem(id: string): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getLinkHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteHistoryItems(ids: string[]): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getLinkHistory();
    const idSet = new Set(ids);
    const updated = current.filter((item) => !idSet.has(item.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearAllHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
