"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { ClientMediaItem, useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  X,
  Image as ImageIcon,
  Video,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface MediaPreviewModalProps {
  items: ClientMediaItem[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDownloadSingle: (item: ClientMediaItem) => void;
}

export function MediaPreviewModal({
  items,
  currentIndex,
  onClose,
  onNavigate,
  onDownloadSingle,
}: MediaPreviewModalProps) {
  const t = useTranslations("previewModal");
  const { selectedIds, toggleItem, platform } = useAppStore();
  const isLinkedIn = platform === "linkedin";
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
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

  const isOpen =
    currentIndex !== null &&
    currentIndex >= 0 &&
    currentIndex < items.length;
  const currentItem = isOpen ? items[currentIndex] : null;
  const isSelected = currentItem ? selectedIds.includes(currentItem.id) : false;

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (currentIndex === null || items.length <= 1) return;
      const nextIdx = (currentIndex - 1 + items.length) % items.length;
      onNavigate(nextIdx);
    },
    [currentIndex, items.length, onNavigate]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (currentIndex === null || items.length <= 1) return;
      const nextIdx = (currentIndex + 1) % items.length;
      onNavigate(nextIdx);
    },
    [currentIndex, items.length, onNavigate]
  );

  // Keyboard arrow and escape keys
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Reset loading state on item change
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [currentIndex]);

  if (!isOpen || !currentItem) return null;

  const mediaSrc =
    currentItem.type === "video"
      ? `/api/download?token=${encodeURIComponent(currentItem.mediaToken)}&filename=${encodeURIComponent(currentItem.filename)}`
      : `/api/thumbnail?token=${encodeURIComponent(currentItem.thumbnailToken)}`;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/* Backdrop Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl transition-opacity animate-in fade-in-0 duration-200" />

        {/* Modal Container */}
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 outline-none pointer-events-none">
          <DialogPrimitive.Title className="sr-only">
            {currentItem.filename || `Item ${currentIndex + 1}`}
          </DialogPrimitive.Title>

          {/* Modal Box */}
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`pointer-events-auto relative flex flex-col w-full max-w-5xl h-full max-h-[88dvh] sm:max-h-[92vh] rounded-2xl border bg-neutral-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-all ${
              isLinkedIn ? "border-sky-500/30" : "border-white/15"
            }`}
          >
            {/* Flashlight background spotlight */}
            {mousePos && (
              <div
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-150"
                style={{
                  background: isLinkedIn
                    ? `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.18), rgba(14, 165, 233, 0.04) 40%, transparent 75%)`
                    : `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.22), rgba(232, 163, 61, 0.05) 40%, transparent 75%)`,
                }}
              />
            )}

            {/* Dynamic flashlight glowing border */}
            {mousePos && (
              <div
                className="pointer-events-none absolute -inset-[1px] rounded-2xl z-30 transition-opacity duration-150"
                style={{
                  background: isLinkedIn
                    ? `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.9), transparent 70%)`
                    : `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.95), transparent 70%)`,
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  padding: "1.5px",
                }}
              />
            )}

            {/* Top Bar Header */}
            <div className="relative z-20 flex h-12 sm:h-14 shrink-0 items-center justify-between border-b border-white/10 bg-neutral-900/80 px-3 sm:px-6 backdrop-blur-md gap-2 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 truncate">
                <span
                  className={`text-xs font-bold shrink-0 ${
                    isLinkedIn ? "text-sky-400" : "text-[#d4af37]"
                  }`}
                >
                  {t("itemCount", {
                    current: currentIndex + 1,
                    total: items.length,
                  })}
                </span>

                <Badge
                  variant={currentItem.type === "video" ? (isLinkedIn ? "default" : "gold") : "secondary"}
                  className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 shrink-0 ${
                    currentItem.type === "video" && isLinkedIn
                      ? "bg-sky-500 text-neutral-950 font-bold"
                      : ""
                  }`}
                >
                  {currentItem.type === "video" ? (
                    <>
                      <Video className="mr-1 h-3 w-3" />
                      <span>{isLinkedIn ? "Video" : "Reel / Video"}</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-1 h-3 w-3" />
                      <span>{isLinkedIn ? "Slide / Photo" : "Photo"}</span>
                    </>
                  )}
                </Badge>

                {currentItem.width && currentItem.height && (
                  <span className="hidden sm:inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-neutral-400 border border-white/10 shrink-0">
                    {currentItem.width} × {currentItem.height}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Toggle selection in modal */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleItem(currentItem.id)}
                  className={`h-7 sm:h-8 gap-1 px-2 sm:px-3 text-xs transition-all cursor-pointer ${
                    isSelected
                      ? isLinkedIn
                        ? "border-sky-400 bg-sky-500/20 text-sky-300"
                        : "border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37]"
                      : "border-white/20 text-neutral-300 hover:border-white/40 hover:text-white"
                  }`}
                >
                  <div
                    className={`flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded border ${
                      isSelected
                        ? isLinkedIn
                          ? "border-sky-400 bg-sky-500 text-neutral-950"
                          : "border-[#d4af37] bg-[#d4af37] text-neutral-950"
                        : "border-neutral-400"
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[3]" />}
                  </div>
                  <span className="hidden sm:inline">
                    {isSelected ? t("selected") : t("select")}
                  </span>
                </Button>

                {/* Copy direct link button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const origin = typeof window !== "undefined" ? window.location.origin : "";
                      const directUrl = `${origin}/api/download?token=${encodeURIComponent(
                        currentItem.mediaToken
                      )}&filename=${encodeURIComponent(currentItem.filename)}`;
                      await navigator.clipboard.writeText(directUrl);
                      toast.success("Direct media link copied!");
                    } catch {
                      toast.error("Failed to copy link");
                    }
                  }}
                  aria-label="Copy direct media link"
                  title="Copy direct download link"
                  className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs border-white/20 text-neutral-300 hover:border-white/40 hover:text-white cursor-pointer"
                >
                  <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden md:inline">Copy Link</span>
                </Button>

                {/* Download single button */}
                <Button
                  size="sm"
                  onClick={() => onDownloadSingle(currentItem)}
                  className={`h-7 sm:h-8 gap-1 px-2 sm:px-3 text-xs font-semibold cursor-pointer transition-all ${
                    isLinkedIn
                      ? "bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 text-white shadow-md shadow-blue-500/25"
                      : "gold-gradient-bg text-neutral-950"
                  }`}
                >
                  <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">{t("download")}</span>
                </Button>

                {/* Close button */}
                <button
                  onClick={onClose}
                  aria-label={t("close")}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Center Media Display Area (No flashlight light inside media section, 100% pure contrast) */}
            <div className="relative z-10 isolate flex flex-1 items-center justify-center min-h-0 w-full p-2 sm:p-6 bg-black select-none overflow-hidden">
              {/* Previous Button */}
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label={t("prev")}
                  className={`absolute left-1.5 sm:left-4 z-30 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-neutral-900/80 text-white shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
                    isLinkedIn
                      ? "hover:border-sky-400 hover:bg-sky-500 hover:text-neutral-950"
                      : "hover:border-[#d4af37] hover:bg-[#d4af37] hover:text-neutral-950"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                </button>
              )}

              {/* Media Content Wrapper */}
              <div className="flex h-full w-full items-center justify-center">
                {!imgLoaded && !imgError && currentItem.type === "image" && (
                  <div className="absolute flex h-24 w-24 items-center justify-center">
                    <div
                      className={`h-8 w-8 rounded-full border-2 animate-spin ${
                        isLinkedIn
                          ? "border-sky-500/30 border-t-sky-400"
                          : "border-[#d4af37]/30 border-t-[#d4af37]"
                      }`}
                    />
                  </div>
                )}

                {currentItem.type === "video" ? (
                  <video
                    src={mediaSrc}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[60dvh] sm:max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl"
                  />
                ) : (
                  <img
                    src={mediaSrc}
                    alt={currentItem.caption || `Media photo ${currentIndex + 1}`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => {
                      setImgError(true);
                      setImgLoaded(true);
                    }}
                    className={`max-h-[60dvh] sm:max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl transition-opacity duration-300 ${
                      imgLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                )}
              </div>

              {/* Next Button */}
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label={t("next")}
                  className={`absolute right-1.5 sm:right-4 z-30 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-neutral-900/80 text-white shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
                    isLinkedIn
                      ? "hover:border-sky-400 hover:bg-sky-500 hover:text-neutral-950"
                      : "hover:border-[#d4af37] hover:bg-[#d4af37] hover:text-neutral-950"
                  }`}
                >
                  <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                </button>
              )}
            </div>

            {/* Bottom Bar Info */}
            <div className="flex h-9 sm:h-11 shrink-0 items-center justify-between border-t border-white/10 bg-neutral-900/80 px-3 sm:px-6 backdrop-blur-md z-20">
              <span className="text-[10px] sm:text-[11px] text-neutral-400 font-mono truncate max-w-[200px] sm:max-w-md">
                {currentItem.filename}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-neutral-500">
                {t("keyboardHint")}
              </span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

