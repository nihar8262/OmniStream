import { create } from "zustand";

export interface ClientMediaItem {
  id: string;
  type: "image" | "video";
  width?: number;
  height?: number;
  thumbnailToken: string;
  mediaToken: string;
  filename: string;
  caption?: string;
}

export interface MediaManifest {
  postUrl: string;
  shortcode: string;
  author?: {
    username: string;
    fullName?: string;
    avatarUrl?: string;
  };
  caption?: string;
  items: ClientMediaItem[];
  itemCount: number;
}

export type DownloadAction = "single" | "zip" | "pdf";

export type SupportedPlatform = "instagram" | "linkedin";

interface AppState {
  platform: SupportedPlatform;
  setPlatform: (platform: SupportedPlatform) => void;
  url: string;
  setUrl: (url: string) => void;
  isResolving: boolean;
  setIsResolving: (val: boolean) => void;
  resolveError: { code: string; message: string } | null;
  setResolveError: (err: { code: string; message: string } | null) => void;
  manifest: MediaManifest | null;
  setManifest: (manifest: MediaManifest | null) => void;
  selectedIds: string[];
  toggleItem: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  termsAccepted: boolean;
  setTermsAccepted: (accepted: boolean) => void;
  isTermsModalOpen: boolean;
  setIsTermsModalOpen: (open: boolean) => void;
  pendingAction: { action: DownloadAction; token?: string; filename?: string } | null;
  setPendingAction: (action: { action: DownloadAction; token?: string; filename?: string } | null) => void;
  isProcessingBatch: boolean;
  setIsProcessingBatch: (val: boolean) => void;
  batchProgress: string;
  setBatchProgress: (msg: string) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  platform: "instagram",
  setPlatform: (platform) => set({ platform, resolveError: null }),
  url: "",
  setUrl: (url) => set({ url }),
  isResolving: false,
  setIsResolving: (isResolving) => set({ isResolving }),
  resolveError: null,
  setResolveError: (resolveError) => set({ resolveError }),
  manifest: null,
  setManifest: (manifest) => {
    set({
      manifest,
      // By default select all items up to 20
      selectedIds: manifest ? manifest.items.slice(0, 20).map((i) => i.id) : [],
    });
  },
  selectedIds: [],
  toggleItem: (id) => {
    const { selectedIds } = get();
    if (selectedIds.includes(id)) {
      set({ selectedIds: selectedIds.filter((i) => i !== id) });
    } else {
      if (selectedIds.length >= 20) {
        // Cap at 20 items
        return;
      }
      set({ selectedIds: [...selectedIds, id] });
    }
  },
  selectAll: () => {
    const { manifest } = get();
    if (!manifest) return;
    // Cap at first 20 items
    set({ selectedIds: manifest.items.slice(0, 20).map((i) => i.id) });
  },
  deselectAll: () => set({ selectedIds: [] }),
  termsAccepted: false,
  setTermsAccepted: (termsAccepted) => set({ termsAccepted }),
  isTermsModalOpen: false,
  setIsTermsModalOpen: (isTermsModalOpen) => set({ isTermsModalOpen }),
  pendingAction: null,
  setPendingAction: (pendingAction) => set({ pendingAction }),
  isProcessingBatch: false,
  setIsProcessingBatch: (isProcessingBatch) => set({ isProcessingBatch }),
  batchProgress: "",
  setBatchProgress: (batchProgress) => set({ batchProgress }),
  resetAll: () =>
    set({
      url: "",
      manifest: null,
      selectedIds: [],
      resolveError: null,
      pendingAction: null,
      isProcessingBatch: false,
    }),
}));
