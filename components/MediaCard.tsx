"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ClientMediaItem, useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, Download, Check, Copy } from "lucide-react";
import { toast } from "sonner";

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
  const [copiedLink, setCopiedLink] = useState(false);

  const thumbUrl = `/api/thumbnail?token=${encodeURIComponent(item.thumbnailToken)}`;

  const handleCopyDirectLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const directUrl = `${origin}/api/download?token=${encodeURIComponent(
        item.mediaToken
      )}&filename=${encodeURIComponent(item.filename)}`;
      await navigator.clipboard.writeText(directUrl);
      setCopiedLink(true);
      toast.success("Direct media download link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
        isSelected
          ? isLinkedIn
            ? "border-sky-500 bg-[#0c1624] shadow-xl shadow-sky-500/10 ring-1 ring-sky-400/50"
            : "border-[#e7b92f] bg-[#14120a] shadow-xl shadow-[#e7b92f]/10 ring-1 ring-[#e7b92f]/50"
          : "border-white/[0.08] bg-[#101010] hover:border-white/[0.18] hover:bg-[#141414]"
      }`}
    >
      {/* Thumbnail Container - Clicking opens large Preview Modal */}
      <div
        onClick={() => onPreview(index)}
        className="relative aspect-square w-full overflow-hidden bg-[#080808] cursor-zoom-in"
      >
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#080808]/80 animate-pulse">
            <div
              className={`h-7 w-7 rounded-full border-2 animate-spin ${
                isLinkedIn
                  ? "border-sky-500/30 border-t-sky-400"
                  : "border-[#e7b92f]/30 border-t-[#e7b92f]"
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
            className={`shadow-md backdrop-blur-md text-[10px] font-semibold ${
              item.type === "video" && isLinkedIn ? "bg-sky-500 text-neutral-950 font-bold" : ""
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
            <span className="hidden sm:inline-block rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-[#a5a39c] backdrop-blur-md border border-white/[0.08]">
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
                  ? "border-sky-400 bg-sky-500 text-neutral-950 shadow-sm shadow-sky-500/30"
                  : "border-[#e7b92f] bg-[#e7b92f] text-[#080808] shadow-sm shadow-[#e7b92f]/30"
                : "border-white/30 bg-black/60 backdrop-blur-md hover:border-white/60"
            }`}
          >
            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </button>
        </div>
      </div>

      {/* Card Info & Actions Footer */}
      <div className="flex items-center justify-between p-3.5 bg-[#0d0d0d] border-t border-white/[0.06]">
        <div
          onClick={() => toggleItem(item.id)}
          className="flex flex-col truncate pr-2 cursor-pointer"
        >
          <span className="text-xs font-medium text-[#f5f3ed] truncate group-hover:text-[#e7b92f] transition-colors">
            {item.filename}
          </span>
          <span className="text-[10px] text-[#6f6d66] capitalize">
            Item {index + 1} • {item.type}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyDirectLink}
            aria-label="Copy direct media link"
            title="Copy direct download link"
            className="h-8 w-8 p-0 text-[#a5a39c] hover:text-[#f5f3ed] hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadSingle(item);
            }}
            aria-label={t("downloadSingle")}
            className={`h-8 px-2.5 sm:px-3 text-xs shrink-0 transition-colors cursor-pointer ${
              isLinkedIn
                ? "border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-neutral-950"
                : "border-[#e7b92f]/30 text-[#e7b92f] hover:bg-[#e7b92f] hover:text-[#080808]"
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("downloadSingle")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
