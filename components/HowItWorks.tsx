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
    <section id="how-it-works" className="w-full py-16 px-4 sm:px-6 relative border-t border-white/[0.04]">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f3ed] mb-2">
            {t("title")}
          </h2>
          <p className="text-xs sm:text-sm text-[#a5a39c] max-w-xl mx-auto">
            {t("subtitle", { platform: platformName })}
          </p>
        </div>

        {/* 3 columns first row, 2 columns second row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.slice(0, 3).map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card
                key={idx}
                className={`group relative overflow-hidden border-white/[0.08] bg-[#101010]/70 transition-all duration-300 p-5 flex flex-col justify-between ${
                  isLinkedIn
                    ? "hover:border-sky-500/30 hover:bg-[#0e1724]"
                    : "hover:border-[#e7b92f]/30 hover:bg-[#14130f]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                        isLinkedIn
                          ? "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                          : "bg-[#e7b92f]/10 border border-[#e7b92f]/20 text-[#e7b92f]"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span
                      className={`text-xl font-bold text-white/15 transition-colors ${
                        isLinkedIn
                          ? "group-hover:text-sky-400/30"
                          : "group-hover:text-[#e7b92f]/30"
                      }`}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#f5f3ed] mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#a5a39c] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-w-3xl mx-auto">
          {steps.slice(3, 5).map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card
                key={idx + 3}
                className={`group relative overflow-hidden border-white/[0.08] bg-[#101010]/70 transition-all duration-300 p-5 flex flex-col justify-between ${
                  isLinkedIn
                    ? "hover:border-sky-500/30 hover:bg-[#0e1724]"
                    : "hover:border-[#e7b92f]/30 hover:bg-[#14130f]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                        isLinkedIn
                          ? "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                          : "bg-[#e7b92f]/10 border border-[#e7b92f]/20 text-[#e7b92f]"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span
                      className={`text-xl font-bold text-white/15 transition-colors ${
                        isLinkedIn
                          ? "group-hover:text-sky-400/30"
                          : "group-hover:text-[#e7b92f]/30"
                      }`}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#f5f3ed] mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#a5a39c] leading-relaxed">
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
