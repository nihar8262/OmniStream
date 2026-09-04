"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileArchive,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export function SelectionToolbar() {
  const t = useTranslations("toolbar");
  const {
    manifest,
    selectedIds,
    termsAccepted,
    setIsTermsModalOpen,
    setPendingAction,
    isProcessingBatch,
    setIsProcessingBatch,
    batchProgress,
    setBatchProgress,
    platform,
  } = useAppStore();

  const [activeBatchType, setActiveBatchType] = useState<"zip" | "pdf" | null>(
    null
  );

  const isLinkedIn = platform === "linkedin";

  if (!manifest || selectedIds.length === 0) {
    return null;
  }

  const selectedItems = manifest.items.filter((item) =>
    selectedIds.includes(item.id)
  );
  const selectedImageItems = selectedItems.filter(
    (item) => item.type === "image"
  );
  const hasImages = selectedImageItems.length > 0;

  const triggerZipDownload = async () => {
    if (!termsAccepted) {
      setPendingAction({ action: "zip" });
      setIsTermsModalOpen(true);
      return;
    }

    setIsProcessingBatch(true);
    setActiveBatchType("zip");
    setBatchProgress(t("generatingZip"));

    try {
      const tokens = selectedItems.map((item) => item.mediaToken);
      const res = await fetch("/api/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Failed to create ZIP bundle");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const prefix = isLinkedIn ? "linkedin_bundle" : "instagram_bundle";
      a.download = `${prefix}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("ZIP bundle downloaded successfully!");
    } catch (err: unknown) {
      console.error("ZIP download failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to download ZIP");
    } finally {
      setIsProcessingBatch(false);
      setActiveBatchType(null);
    }
  };

  const triggerPdfDownload = async () => {
    if (!hasImages) {
      toast.error(t("pdfOnlyImagesTooltip"));
      return;
    }

    if (!termsAccepted) {
      setPendingAction({ action: "pdf" });
      setIsTermsModalOpen(true);
      return;
    }

    setIsProcessingBatch(true);
    setActiveBatchType("pdf");
    setBatchProgress(t("generatingPdf"));

    try {
      const tokens = selectedImageItems.map((item) => item.mediaToken);
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const prefix = isLinkedIn ? "linkedin_document" : "instagram_photos";
      a.download = `${prefix}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF document downloaded successfully!");
    } catch (err: unknown) {
      console.error("PDF download failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setIsProcessingBatch(false);
      setActiveBatchType(null);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-neutral-950/85 p-3 sm:p-4 backdrop-blur-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10">
        {/* Selected count badge */}
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-all ${
              isLinkedIn
                ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/20"
                : "bg-gradient-to-r from-[#d4af37] to-[#e8a33d] text-neutral-950"
            }`}
          >
            {selectedIds.length}
          </div>
          <span className="text-xs font-semibold text-white">
            {t("selectedItems", { count: selectedIds.length })}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* ZIP Download Button */}
          <Button
            size="sm"
            onClick={triggerZipDownload}
            disabled={isProcessingBatch}
            className={`font-semibold h-9 px-4 text-xs hover:brightness-110 shadow-md cursor-pointer transition-all ${
              isLinkedIn
                ? "bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 text-white shadow-blue-500/25"
                : "gold-gradient-bg text-neutral-950 shadow-[#d4af37]/20"
            }`}
          >
            {isProcessingBatch && activeBatchType === "zip" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{batchProgress}</span>
              </>
            ) : (
              <>
                <FileArchive className="h-3.5 w-3.5" />
                <span>{t("downloadZip")}</span>
              </>
            )}
          </Button>

          {/* PDF Convert Button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={triggerPdfDownload}
            disabled={isProcessingBatch || !hasImages}
            title={!hasImages ? t("pdfOnlyImagesTooltip") : undefined}
            className={`h-9 px-4 text-xs font-medium border-white/10 bg-white/10 text-white hover:bg-white/15 cursor-pointer disabled:opacity-40 transition-colors ${
              isLinkedIn ? "hover:border-sky-400/40" : "hover:border-[#d4af37]/40"
            }`}
          >
            {isProcessingBatch && activeBatchType === "pdf" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{batchProgress}</span>
              </>
            ) : (
              <>
                <FileText
                  className={`h-3.5 w-3.5 ${
                    isLinkedIn ? "text-sky-400" : "text-[#d4af37]"
                  }`}
                />
                <span>{t("convertToPdf")}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

