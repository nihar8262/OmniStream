"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Scale, AlertTriangle } from "lucide-react";

export function TermsSection() {
  const t = useTranslations("terms");

  return (
    <section id="terms" className="w-full py-16 px-4 sm:px-6 border-t border-white/[0.04] bg-[#0a0a0a]/50">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7b92f]/10 border border-[#e7b92f]/25 text-[#e7b92f]">
            <Scale className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f5f3ed]">
              {t("title")}
            </h2>
            <p className="text-xs text-[#a5a39c]">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-[#a5a39c] leading-relaxed rounded-2xl border border-white/[0.08] bg-[#101010]/70 p-6 backdrop-blur-xl">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
          
          <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-[#6f6d66] flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#e7b92f] shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t("trademark")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
