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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl transition-opacity animate-in fade-in-0 duration-200" />

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
            className={`pointer-events-auto relative flex flex-col w-full max-w-5xl h-full max-h-[88dvh] sm:max-h-[92vh] rounded-2xl border bg-[#101010]/98 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-all ${
              isLinkedIn ? "border-sky-500/25" : "border-white/[0.1]"
            }`}
          >
            {/* Flashlight background spotlight */}
            {mousePos && (
              <div
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-150"
                style={{
                  background: isLinkedIn
                    ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.1), transparent 70%)`
                    : `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(231, 185, 47, 0.1), transparent 70%)`,
                }}
              />
            )}

            {/* Top Bar Header */}
            <div className="relative z-20 flex h-12 sm:h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0d0d0d] px-3 sm:px-6 backdrop-blur-md gap-2 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 truncate">
                <span
                  className={`text-xs font-bold shrink-0 ${
                    isLinkedIn ? "text-sky-400" : "text-[#e7b92f]"
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
                  <span className="hidden sm:inline-block rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[#a5a39c] border border-white/[0.08] shrink-0">
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
                        : "border-[#e7b92f] bg-[#e7b92f]/20 text-[#e7b92f]"
                      : "border-white/[0.12] text-[#a5a39c] hover:border-white/[0.25] hover:text-[#f5f3ed]"
                  }`}
                >
                  <div
                    className={`flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded border ${
                      isSelected
                        ? isLinkedIn
                          ? "border-sky-400 bg-sky-500 text-neutral-950"
                          : "border-[#e7b92f] bg-[#e7b92f] text-[#080808]"
                        : "border-neutral-500"
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
                  className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs border-white/[0.12] text-[#a5a39c] hover:border-white/[0.25] hover:text-[#f5f3ed] cursor-pointer"
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
                      ? "bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 text-white shadow-sm shadow-blue-500/25"
                      : "gold-gradient-bg text-[#080808]"
                  }`}
                >
                  <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">{t("download")}</span>
                </Button>

                {/* Close button */}
                <button
                  onClick={onClose}
                  aria-label={t("close")}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[#a5a39c] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Center Media Display Area */}
            <div className="relative z-10 isolate flex flex-1 items-center justify-center min-h-0 w-full p-2 sm:p-6 bg-[#080808] select-none overflow-hidden">
              {/* Previous Button */}
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label={t("prev")}
                  className={`absolute left-2 sm:left-4 z-30 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/[0.15] bg-[#121212]/80 text-[#f5f3ed] shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                    isLinkedIn
                      ? "hover:border-sky-400 hover:bg-sky-500 hover:text-neutral-950"
                      : "hover:border-[#e7b92f] hover:bg-[#e7b92f] hover:text-[#080808]"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}

              {/* Media Content Wrapper */}
              <div className="flex h-full w-full items-center justify-center">
                {!imgLoaded && !imgError && currentItem.type === "image" && (
                  <div className="absolute flex h-24 w-24 items-center justify-center">
                    <div
                      className={`h-7 w-7 rounded-full border-2 animate-spin ${
                        isLinkedIn
                          ? "border-sky-500/30 border-t-sky-400"
                          : "border-[#e7b92f]/30 border-t-[#e7b92f]"
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
                  className={`absolute right-2 sm:right-4 z-30 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/[0.15] bg-[#121212]/80 text-[#f5f3ed] shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                    isLinkedIn
                      ? "hover:border-sky-400 hover:bg-sky-500 hover:text-neutral-950"
                      : "hover:border-[#e7b92f] hover:bg-[#e7b92f] hover:text-[#080808]"
                  }`}
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>

            {/* Bottom Bar Info */}
            <div className="flex h-9 sm:h-11 shrink-0 items-center justify-between border-t border-white/[0.08] bg-[#0d0d0d] px-3 sm:px-6 backdrop-blur-md z-20">
              <span className="text-[10px] sm:text-[11px] text-[#a5a39c] font-mono truncate max-w-[200px] sm:max-w-md">
                {currentItem.filename}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-[#6f6d66]">
                {t("keyboardHint")}
              </span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
