"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  HistoryItem,
  getLinkHistory,
  updateHistoryItemName,
  deleteHistoryItem,
  deleteHistoryItems,
  clearAllHistory,
} from "@/lib/history";
import { SupportedPlatform, useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Trash2,
  Edit2,
  Check,
  X,
  CheckSquare,
  Square,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

function InstagramIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

interface LinkHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUrl: (url: string, platform: SupportedPlatform) => void;
}

export function LinkHistoryModal({
  isOpen,
  onClose,
  onSelectUrl,
}: LinkHistoryModalProps) {
  const { platform } = useAppStore();
  const isLinkedIn = platform === "linkedin";

  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState("");
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const refreshHistory = () => {
    setHistoryList(getLinkHistory());
    setSelectedIds([]);
    setEditingId(null);
  };

  useEffect(() => {
    if (isOpen) {
      refreshHistory();
    }
  }, [isOpen]);

  const handleStartEdit = (item: HistoryItem) => {
    setEditingId(item.id);
    setEditNameText(item.customName || "");
  };

  const handleSaveEdit = (id: string) => {
    if (!editNameText.trim()) {
      updateHistoryItemName(id, "");
    } else {
      updateHistoryItemName(id, editNameText.trim());
    }
    setEditingId(null);
    setHistoryList(getLinkHistory());
    toast.success("Link label updated!");
  };

  const handleDeleteSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setHistoryList(updated);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    toast.success("Link removed from history");
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const updated = deleteHistoryItems(selectedIds);
    setHistoryList(updated);
    setSelectedIds([]);
    toast.success(`Removed ${selectedIds.length} item(s) from history`);
  };

  const handleClearAll = () => {
    clearAllHistory();
    setHistoryList([]);
    setSelectedIds([]);
    toast.success("Search history cleared");
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === historyList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(historyList.map((i) => i.id));
    }
  };

  const formatTimestamp = (ms: number) => {
    const date = new Date(ms);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={modalRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="max-w-2xl max-h-[88vh] flex flex-col p-4 sm:p-6 bg-[#101010]/98 border-white/[0.1] overflow-hidden group"
      >
        {/* Flashlight background spotlight */}
        {mousePos && (
          <div
            className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-150"
            style={{
              background: isLinkedIn
                ? `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.1), transparent 70%)`
                : `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(231, 185, 47, 0.1), transparent 70%)`,
            }}
          />
        )}

        <DialogHeader className="relative z-10 space-y-1.5 pr-8 sm:pr-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isLinkedIn
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/25"
                    : "bg-[#e7b92f]/15 text-[#e7b92f] border border-[#e7b92f]/25"
                }`}
              >
                <History className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold truncate text-[#f5f3ed]">
                Recent Links History
              </DialogTitle>
            </div>

            {historyList.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] sm:text-[11px] text-[#a5a39c] border-white/[0.08] hidden sm:inline-flex"
              >
                Stored locally on device
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-[#a5a39c]">
            Access, label, or re-search your recently analyzed links.
          </DialogDescription>
        </DialogHeader>

        {/* Action controls header */}
        {historyList.length > 0 && (
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleSelectAll}
                className="h-7 px-2 text-xs text-[#a5a39c] hover:text-[#f5f3ed] cursor-pointer"
              >
                {selectedIds.length === historyList.length && historyList.length > 0 ? (
                  <>
                    <Square className="h-3.5 w-3.5 mr-1 text-[#a5a39c]" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 mr-1 text-[#e7b92f]" />
                    <span>Select All</span>
                  </>
                )}
              </Button>

              {selectedIds.length > 0 && (
                <span className="text-[#a5a39c] font-medium">
                  ({selectedIds.length} selected)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  className="h-7 px-2.5 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="h-7 px-2 text-xs text-[#a5a39c] hover:text-red-400 hover:bg-red-950/20 cursor-pointer"
              >
                <span>Clear All</span>
              </Button>
            </div>
          </div>
        )}

        {/* History List Container */}
        <div className="relative z-10 flex-1 overflow-y-auto min-h-[220px] max-h-[380px] space-y-2 pr-1">
          {historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-center p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#6f6d66] mb-3">
                <Clock className="h-6 w-6 opacity-60" />
              </div>
              <p className="text-sm font-semibold text-[#f5f3ed]">
                No recent links found
              </p>
              <p className="text-xs text-[#6f6d66] max-w-sm mt-1">
                Any public post links you search will appear here for fast one-click re-access and custom labeling.
              </p>
            </div>
          ) : (
            historyList.map((item) => {
              const isItemLinkedIn = item.platform === "linkedin";
              const isSelected = selectedIds.includes(item.id);
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectUrl(item.url, item.platform);
                      onClose();
                    }
                  }}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-sm ${
                    isSelected
                      ? isItemLinkedIn
                        ? "bg-[#0c1624] border-sky-400/80 shadow-md ring-1 ring-sky-400/40"
                        : "bg-[#14120a] border-[#e7b92f]/80 shadow-md ring-1 ring-[#e7b92f]/40"
                      : isItemLinkedIn
                      ? "bg-white/[0.02] border-white/[0.08] hover:border-sky-400/50 hover:bg-[#0c1624]/60"
                      : "bg-white/[0.02] border-white/[0.08] hover:border-[#e7b92f]/50 hover:bg-[#14120a]/60"
                  }`}
                >
                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => toggleSelect(item.id, e)}
                    aria-label={isSelected ? "Deselect" : "Select"}
                    className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all cursor-pointer ${
                      isSelected
                        ? isItemLinkedIn
                          ? "border-sky-400 bg-sky-500 text-neutral-950"
                          : "border-[#e7b92f] bg-[#e7b92f] text-[#080808] font-bold"
                        : "border-white/20 bg-black/40 hover:border-white/50"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </button>

                  {/* Icon Platform */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                      isItemLinkedIn
                        ? "bg-sky-500/15 text-sky-400 border border-sky-500/25"
                        : "bg-[#e7b92f]/15 text-[#e7b92f] border border-[#e7b92f]/25"
                    }`}
                  >
                    {isItemLinkedIn ? (
                      <LinkedInIcon className="h-3.5 w-3.5" />
                    ) : (
                      <InstagramIcon className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Content & Inline Edit */}
                  <div className="flex-1 min-w-0 pr-1">
                    {isEditing ? (
                      <div
                        className="flex items-center gap-1.5 mb-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editNameText}
                          onChange={(e) => setEditNameText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(item.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          placeholder="Give this link a short name"
                          className="flex-1 h-7 px-2 text-xs rounded-md bg-black border border-white/20 text-[#f5f3ed] focus:outline-none focus:border-[#e7b92f]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-1 rounded bg-[#e7b92f] text-[#080808] hover:bg-[#f0c94b]"
                          title="Save label"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded bg-white/10 text-[#a5a39c] hover:bg-white/20"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-[#f5f3ed] truncate">
                          {item.customName ||
                            (item.authorUsername
                              ? `@${item.authorUsername}`
                              : isItemLinkedIn
                              ? "LinkedIn Post"
                              : "Instagram Post")}
                        </span>

                        {item.customName && item.authorUsername && (
                          <span className="text-[11px] text-[#a5a39c] truncate">
                            (@{item.authorUsername})
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(item);
                          }}
                          aria-label="Rename link"
                          title="Add / edit custom label"
                          className="p-1 rounded text-[#a5a39c] hover:text-[#f5f3ed] hover:bg-white/10 opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* URL text */}
                    <p className="text-[11px] text-[#a5a39c] truncate font-mono">
                      {item.url}
                    </p>

                    {/* Timestamp & metadata */}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6f6d66]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(item.firstUsedAt)}</span>
                      </span>

                      {item.itemCount !== undefined && (
                        <span>• {item.itemCount} item(s)</span>
                      )}
                    </div>
                  </div>

                  {/* Actions right side */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingle(item.id, e)}
                      aria-label="Delete link"
                      title="Remove from history"
                      className="p-1.5 rounded-lg text-[#6f6d66] hover:text-red-400 hover:bg-red-950/30 opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-white/[0.08] flex flex-row items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-white/[0.1] text-[#a5a39c] hover:text-[#f5f3ed] hover:bg-white/[0.06] cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
