"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { Shield, Layers, HardDriveDownload, Gauge } from "lucide-react";

export function LimitsSection() {
  const t = useTranslations("limits");
  const { platform } = useAppStore();
  const isLinkedIn = platform === "linkedin";

  const limits = [
    {
      icon: Shield,
      title: t("limit1Title"),
      desc: t("limit1Desc"),
    },
    {
      icon: Layers,
      title: t("limit2Title"),
      desc: t("limit2Desc"),
    },
    {
      icon: HardDriveDownload,
      title: t("limit3Title"),
      desc: t("limit3Desc"),
    },
    {
      icon: Gauge,
      title: t("limit4Title"),
      desc: t("limit4Desc"),
    },
  ];

  return (
    <section id="limits" className="w-full py-16 px-4 sm:px-6 border-t border-white/[0.04]">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f3ed] mb-2">
            {t("title")}
          </h2>
          <p className="text-xs sm:text-sm text-[#a5a39c] max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {limits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 rounded-2xl border border-white/[0.08] bg-[#101010]/70 p-5 backdrop-blur-xl hover:border-white/[0.16] transition-colors"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isLinkedIn
                      ? "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                      : "bg-[#e7b92f]/10 border border-[#e7b92f]/20 text-[#e7b92f]"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#f5f3ed] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#a5a39c] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
