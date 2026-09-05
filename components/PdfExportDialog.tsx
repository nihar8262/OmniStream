"use client";

import React, { useState, useEffect } from "react";
import { ClientMediaItem, useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  Layout,
} from "lucide-react";

interface PdfExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageItems: ClientMediaItem[];
  onConfirmExport: (
    orderedTokens: string[],
    options: {
      pageSize: "a4" | "letter" | "fit";
      orientation: "portrait" | "landscape" | "auto";
    }
  ) => Promise<void>;
  isExporting: boolean;
}

export function PdfExportDialog({
  isOpen,
  onClose,
  imageItems,
  onConfirmExport,
  isExporting,
}: PdfExportDialogProps) {
  const { platform } = useAppStore();
  const isLinkedIn = platform === "linkedin";

  const [items, setItems] = useState<ClientMediaItem[]>(imageItems);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("fit");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">(
    "auto"
  );

  useEffect(() => {
    setItems(imageItems);
  }, [imageItems, isOpen]);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);
    setDraggedIdx(targetIdx);
    setItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(fromIdx, 1);
    newItems.splice(toIdx, 0, moved);
    setItems(newItems);
  };

  const handleExport = async () => {
    const tokens = items.map((i) => i.mediaToken);
    await onConfirmExport(tokens, { pageSize, orientation });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isExporting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6 bg-neutral-950/95 border-white/15">
        <DialogHeader className="space-y-1 pr-8 sm:pr-10">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isLinkedIn
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  : "bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30"
              }`}
            >
              <FileText className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold">
              PDF Export & Layout Settings
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-neutral-400">
            Drag slides to reorder the PDF pages, and customize page sizing and orientation.
          </DialogDescription>
        </DialogHeader>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 my-2">
          {/* Page Size Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Layout className="h-3.5 w-3.5 text-[#d4af37]" />
              <span>Page Size</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "fit", label: "Fit Image" },
                { id: "a4", label: "A4 Size" },
                { id: "letter", label: "US Letter" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPageSize(opt.id as any)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-center cursor-pointer border ${
                    pageSize === opt.id
                      ? isLinkedIn
                        ? "bg-sky-500/20 border-sky-400 text-white font-semibold"
                        : "bg-[#d4af37]/20 border-[#d4af37] text-white font-semibold"
                      : "bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#d4af37]" />
              <span>Orientation</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "auto", label: "Auto" },
                { id: "portrait", label: "Portrait" },
                { id: "landscape", label: "Landscape" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOrientation(opt.id as any)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-center cursor-pointer border ${
                    orientation === opt.id
                      ? isLinkedIn
                        ? "bg-sky-500/20 border-sky-400 text-white font-semibold"
                        : "bg-[#d4af37]/20 border-[#d4af37] text-white font-semibold"
                      : "bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reorderable Slides Grid */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[200px] max-h-[340px] space-y-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-medium text-neutral-400">
              {items.length} page(s) — Drag or use arrows to change order
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {items.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`group relative flex flex-col rounded-xl border p-1.5 bg-neutral-900/80 transition-all select-none cursor-grab active:cursor-grabbing ${
                  draggedIdx === idx
                    ? "border-[#d4af37] opacity-60 scale-95"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-neutral-950">
                  <img
                    src={`/api/thumbnail?token=${encodeURIComponent(
                      item.thumbnailToken
                    )}`}
                    alt={`Slide ${idx + 1}`}
                    className="h-full w-full object-cover pointer-events-none"
                  />
                  {/* Page number badge */}
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/10">
                    Pg {idx + 1}
                  </span>
                </div>

                {/* Move Controls & drag indicator */}
                <div className="flex items-center justify-between mt-1.5 px-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, idx - 1)}
                    aria-label={`Move page ${idx + 1} left`}
                    className="p-1 rounded bg-white/5 text-neutral-300 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  <GripVertical className="h-3.5 w-3.5 text-neutral-500 group-hover:text-neutral-300" />

                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, idx + 1)}
                    aria-label={`Move page ${idx + 1} right`}
                    className="p-1 rounded bg-white/5 text-neutral-300 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-white/10 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isExporting}
            className="border-white/15 text-neutral-300 hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || items.length === 0}
            className={`font-semibold cursor-pointer ${
              isLinkedIn
                ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/25"
                : "gold-gradient-bg text-neutral-950 shadow-md shadow-[#d4af37]/20"
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-1.5" />
                <span>Generate PDF ({items.length} Pages)</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
