"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Scale, FileCheck, AlertTriangle } from "lucide-react";

export function TermsSection() {
  const t = useTranslations("terms");

  return (
    <section id="terms" className="w-full py-16 px-4 sm:px-6 border-t border-white/5 bg-black/40">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {t("title")}
            </h2>
            <p className="text-xs text-neutral-400">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
          
          <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-neutral-400 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#e8a33d] shrink-0 mt-0.5" />
            <p>{t("trademark")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
