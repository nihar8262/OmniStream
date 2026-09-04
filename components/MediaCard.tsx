"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ClientMediaItem, useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, Download, Check, Maximize2 } from "lucide-react";

interface MediaCardProps {
  item: ClientMediaItem;
  index: number;
  onDownloadSingle: (item: ClientMediaItem) => void;
  onPreview: (index: number) => void;
}

export function MediaCard({
  item,
  index,
  onDownloadSingle,
  onPreview,
}: MediaCardProps) {
  const t = useTranslations("grid");
  const { selectedIds, toggleItem, platform } = useAppStore();
  const isSelected = selectedIds.includes(item.id);
  const isLinkedIn = platform === "linkedin";
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const thumbUrl = `/api/thumbnail?token=${encodeURIComponent(item.thumbnailToken)}`;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
        isSelected
          ? isLinkedIn
            ? "border-sky-500 bg-neutral-900/90 shadow-xl shadow-sky-500/20 ring-1 ring-sky-400/70"
            : "border-[#d4af37] bg-neutral-900/90 shadow-xl shadow-[#d4af37]/15 ring-1 ring-[#d4af37]/60"
          : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
      }`}
    >
      {/* Thumbnail Container - Clicking opens large Preview Modal */}
      <div
        onClick={() => onPreview(index)}
        className="relative aspect-square w-full overflow-hidden bg-neutral-900 cursor-zoom-in"
      >
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 animate-pulse">
            <div
              className={`h-8 w-8 rounded-full border-2 animate-spin ${
                isLinkedIn
                  ? "border-sky-500/30 border-t-sky-400"
                  : "border-[#d4af37]/30 border-t-[#d4af37]"
              }`}
            />
          </div>
        )}

        <img
          src={thumbUrl}
          alt={item.caption || `Media item ${index + 1}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgError(true);
            setImgLoaded(true);
          }}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Top Floating Badges */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none"
        >
          <Badge
            variant={item.type === "video" ? (isLinkedIn ? "default" : "gold") : "secondary"}
            className={`shadow-md backdrop-blur-md text-[11px] font-semibold ${
              item.type === "video" && isLinkedIn ? "bg-sky-500 text-neutral-950 font-bold" : "text-black"
            }`}
          >
            {item.type === "video" ? (
              <>
                <Video className="h-3 w-3" />
                <span>{t("videoBadge")}</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-3 w-3" />
                <span>{t("photoBadge")}</span>
              </>
            )}
          </Badge>

          {item.width && item.height && (
            <span className="hidden sm:inline-block rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-neutral-300 backdrop-blur-md border border-white/10">
              {item.width}x{item.height}
            </span>
          )}
        </div>

        {/* Top-Right Selection Checkbox */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleItem(item.id);
          }}
          className="absolute top-3 right-3 z-10"
        >
          <button
            type="button"
            aria-label={isSelected ? "Deselect item" : "Select item"}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer ${
              isSelected
                ? isLinkedIn
                  ? "border-sky-400 bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 text-white shadow-md shadow-sky-500/30"
                  : "border-[#d4af37] bg-gradient-to-r from-[#d4af37] to-[#e8a33d] text-neutral-950 shadow-md shadow-[#d4af37]/30"
                : "border-white/30 bg-black/50 backdrop-blur-md hover:border-white/60"
            }`}
          >
            {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
          </button>
        </div>

        {/* Center Hover Magnify Icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div
            className={`flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-medium backdrop-blur-md shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform ${
              isLinkedIn
                ? "text-sky-300 border border-sky-500/40"
                : "text-[#d4af37] border border-[#d4af37]/40"
            }`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>{t("clickToPreview")}</span>
          </div>
        </div>
      </div>

      {/* Card Info & Actions Footer */}
      <div className="flex items-center justify-between p-3.5 bg-neutral-950/40 border-t border-white/5">
        <div
          onClick={() => toggleItem(item.id)}
          className="flex flex-col truncate pr-2 cursor-pointer"
        >
          <span className="text-xs font-medium text-neutral-300 truncate group-hover:text-white transition-colors">
            {item.filename}
          </span>
          <span className="text-[10px] text-neutral-400 capitalize">
            Item {index + 1} • {item.type}
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onDownloadSingle(item);
          }}
          className={`h-8 px-3 text-xs transition-colors cursor-pointer ${
            isLinkedIn
              ? "border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-neutral-950"
              : "border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37] hover:text-neutral-950"
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">{t("downloadSingle")}</span>
        </Button>
      </div>
    </div>
  );
}


