"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Compass, Link2, Search, CheckCircle2, DownloadCloud } from "lucide-react";

export function HowItWorks() {
  const t = useTranslations("howItWorks");
  const { platform } = useAppStore();
  const isLinkedIn = platform === "linkedin";
  const platformName = isLinkedIn ? "LinkedIn" : "Instagram";

  const steps = [
    {
      num: "01",
      icon: Compass,
      title: t("step1Title"),
      desc: t("step1Desc", { platform: platformName }),
    },
    {
      num: "02",
      icon: Link2,
      title: t("step2Title"),
      desc: t("step2Desc"),
    },
    {
      num: "03",
      icon: Search,
      title: t("step3Title"),
      desc: t("step3Desc"),
    },
    {
      num: "04",
      icon: CheckCircle2,
      title: t("step4Title"),
      desc: t("step4Desc"),
    },
    {
      num: "05",
      icon: DownloadCloud,
      title: t("step5Title"),
      desc: t("step5Desc"),
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-16 px-4 sm:px-6 relative">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {t("title")}
          </h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto">
            {t("subtitle", { platform: platformName })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card
                key={idx}
                className={`group relative overflow-hidden border-white/10 bg-white/[0.02] transition-all duration-300 p-6 flex flex-col justify-between ${
                  isLinkedIn
                    ? "hover:border-sky-500/40 hover:bg-sky-950/10"
                    : "hover:border-[#d4af37]/40 hover:bg-white/[0.04]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                        isLinkedIn
                          ? "bg-sky-500/10 border border-sky-500/30 text-sky-400"
                          : "bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-2xl font-black text-white/20 transition-colors ${
                        isLinkedIn
                          ? "group-hover:text-sky-400/50"
                          : "group-hover:text-[#d4af37]/40"
                      }`}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

