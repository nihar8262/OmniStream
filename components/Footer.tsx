"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { BrandIcon } from "./icons/BrandIcon";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const { platform } = useAppStore();
  const isLinkedIn = platform === "linkedin";

  return (
    <footer className="w-full border-t border-white/10 bg-neutral-950 py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand & Rights */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
          <div className="flex items-center gap-2">
            <BrandIcon platform={platform} className="h-4 w-4" />
            <span
              className={`text-sm font-bold transition-colors ${
                isLinkedIn ? "text-sky-300" : "text-white"
              }`}
            >
              OmniStream
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            {t("rights")}
          </p>
          <p className="text-[11px] text-neutral-500">
            Universal Social Media Downloader (Instagram & LinkedIn)
          </p>
        </div>

        {/* Links & Switcher */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto justify-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400">
            <a
              href="#how-it-works"
              className={`transition-colors ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-white"
              }`}
            >
              {tNav("howItWorks")}
            </a>
            <a
              href="#limits"
              className={`transition-colors ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-white"
              }`}
            >
              {tNav("limits")}
            </a>
            <a
              href="#terms"
              className={`transition-colors ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-white"
              }`}
            >
              {tNav("terms")}
            </a>
          </div>

          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}

