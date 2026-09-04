"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ClientMediaItem, useAppStore } from "@/lib/store";
import { MediaCard } from "./MediaCard";
import { MediaPreviewModal } from "./MediaPreviewModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, User, ExternalLink, Info } from "lucide-react";

export function MediaGrid() {
  const t = useTranslations("grid");
  const {
    manifest,
    selectedIds,
    selectAll,
    deselectAll,
    termsAccepted,
    setIsTermsModalOpen,
    setPendingAction,
    platform,
  } = useAppStore();

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const isLinkedIn = platform === "linkedin";

  if (!manifest || manifest.items.length === 0) {
    return null;
  }

  const allSelected =
    manifest.items.length > 0 &&
    selectedIds.length === Math.min(20, manifest.items.length);

  const handleDownloadSingle = (item: ClientMediaItem) => {
    if (!termsAccepted) {
      setPendingAction({
        action: "single",
        token: item.mediaToken,
        filename: item.filename,
      });
      setIsTermsModalOpen(true);
      return;
    }

    // Direct download trigger without navigating away
    const downloadUrl = `/api/download?token=${encodeURIComponent(
      item.mediaToken
    )}&filename=${encodeURIComponent(item.filename)}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="results-grid" className="w-full py-6 sm:py-8 px-3 sm:px-6 pb-28 sm:pb-24">
      <div className="container mx-auto max-w-5xl">
        {/* Post Metadata Card */}
        <div
          className={`mb-6 rounded-2xl border p-4 sm:p-5 backdrop-blur-xl transition-all ${
            isLinkedIn
              ? "border-sky-500/20 bg-sky-950/10"
              : "border-white/10 bg-white/[0.03]"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-[1.5px] transition-all ${
                  isLinkedIn
                    ? "bg-gradient-to-tr from-blue-600 via-sky-400 to-sky-200"
                    : "bg-gradient-to-tr from-[#d4af37] to-[#e8a33d]"
                }`}
              >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-900 overflow-hidden">
                  {manifest.author?.avatarUrl ? (
                    <img
                      src={`/api/thumbnail?token=${encodeURIComponent(manifest.author.avatarUrl)}`}
                      alt={manifest.author.fullName || manifest.author.username}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // fallback to icon on error
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <User
                    className={`h-5 w-5 ${
                      isLinkedIn ? "text-sky-400" : "text-[#d4af37]"
                    }`}
                  />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                  <span className="text-sm font-bold text-white truncate">
                    @{manifest.author?.username || (isLinkedIn ? "linkedin_user" : "instagram_user")}
                  </span>
                  {manifest.author?.fullName && (
                    <span className="text-xs text-neutral-400 truncate">
                      ({manifest.author.fullName})
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-400">
                  {t("foundTitle", { count: manifest.itemCount })}
                </span>
              </div>
            </div>

            <a
              href={manifest.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-xs hover:underline transition-colors shrink-0 ${
                isLinkedIn ? "text-sky-400" : "text-[#d4af37]"
              }`}
            >
              <span>View original post</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {manifest.caption && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed italic break-words">
                "{manifest.caption}"
              </p>
            </div>
          )}
        </div>

        {/* Selection Toolbar Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-neutral-900/40 px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={allSelected ? deselectAll : selectAll}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              {allSelected ? (
                <>
                  <Square className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{t("deselectAll")}</span>
                </>
              ) : (
                <>
                  <CheckSquare
                    className={`h-3.5 w-3.5 ${
                      isLinkedIn ? "text-sky-400" : "text-[#d4af37]"
                    }`}
                  />
                  <span>{t("selectAll")}</span>
                </>
              )}
            </Button>

            <span className="text-xs text-neutral-400 font-medium">
              {t("selectedCount", {
                count: selectedIds.length,
                total: manifest.itemCount,
              })}
            </span>
          </div>

          {manifest.itemCount > 20 && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 w-full sm:w-auto">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>{t("maxSelectionNotice")}</span>
            </div>
          )}
        </div>

        {/* Media Items Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {manifest.items.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              index={index}
              onDownloadSingle={handleDownloadSingle}
              onPreview={(idx) => setPreviewIndex(idx)}
            />
          ))}
        </div>

        {/* Large Image & Video Lightbox Modal */}
        <MediaPreviewModal
          items={manifest.items}
          currentIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={(idx) => setPreviewIndex(idx)}
          onDownloadSingle={handleDownloadSingle}
        />
      </div>
    </section>
  );
}


