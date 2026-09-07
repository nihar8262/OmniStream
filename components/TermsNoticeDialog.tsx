"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export function TermsNoticeDialog() {
  const t = useTranslations("termsModal");
  const {
    isTermsModalOpen,
    setIsTermsModalOpen,
    setTermsAccepted,
    pendingAction,
    setPendingAction,
  } = useAppStore();

  const [checked, setChecked] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("insta_downloader_terms_agreed");
      if (saved === "true") {
        setTermsAccepted(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [setTermsAccepted]);

  const handleAgreeAndProceed = () => {
    if (!checked) return;

    try {
      localStorage.setItem("insta_downloader_terms_agreed", "true");
    } catch {}

    setTermsAccepted(true);
    setIsTermsModalOpen(false);

    // Resume pending action
    if (pendingAction) {
      if (pendingAction.action === "single" && pendingAction.token) {
        const downloadUrl = `/api/download?token=${encodeURIComponent(
          pendingAction.token
        )}&filename=${encodeURIComponent(pendingAction.filename || "media.jpg")}`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = pendingAction.filename || "media.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
      <DialogContent className="sm:max-w-md bg-[#101010] border-white/[0.1]">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7b92f]/10 border border-[#e7b92f]/25 text-[#e7b92f]">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold gold-gradient-text">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-[#a5a39c]">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-3 sm:p-4">
          <label className="flex items-start gap-2.5 sm:gap-3 cursor-pointer">
            <Checkbox
              checked={checked}
              onCheckedChange={(val) => setChecked(Boolean(val))}
              className="mt-0.5 shrink-0"
            />
            <span className="text-xs text-[#a5a39c] leading-relaxed select-none">
              {t("affirmation")}
            </span>
          </label>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setIsTermsModalOpen(false);
              setPendingAction(null);
            }}
            className="w-full sm:w-auto text-xs"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleAgreeAndProceed}
            disabled={!checked}
            className="w-full sm:w-auto gold-gradient-bg text-[#080808] font-semibold text-xs disabled:opacity-40 cursor-pointer"
          >
            {t("continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
