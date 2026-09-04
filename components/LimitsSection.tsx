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
    <section id="limits" className="w-full py-16 px-4 sm:px-6 border-t border-white/5">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {t("title")}
          </h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {limits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl hover:border-white/20 transition-colors"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isLinkedIn
                      ? "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                      : "bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
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

