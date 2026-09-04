"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { BrandIcon } from "./icons/BrandIcon";

export function Header() {
  const t = useTranslations("nav");
  const { platform } = useAppStore();
  const isLinkedIn = platform === "linkedin";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-neutral-950/75 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl p-[1px] transition-all duration-300 group-hover:scale-105 ${
              isLinkedIn
                ? "bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 shadow-lg shadow-blue-500/25"
                : "bg-gradient-to-br from-[#d4af37] via-[#e8a33d] to-[#854d0e] shadow-lg shadow-[#d4af37]/20"
            }`}
          >
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-neutral-950">
              <BrandIcon platform={platform} className="h-5 w-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span
              className={`text-lg font-bold tracking-tight transition-all duration-300 ${
                isLinkedIn ? "linkedin-gradient-text" : "gold-gradient-text"
              }`}
            >
              {t("title")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium -mt-1">
              {t("tagline")}
            </span>
          </div>
        </a>

        {/* Navigation Links & Language Switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-300">
            <a
              href="#how-it-works"
              className={`transition-colors ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-[#d4af37]"
              }`}
            >
              {t("howItWorks")}
            </a>
            <a
              href="#limits"
              className={`transition-colors ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-[#d4af37]"
              }`}
            >
              {t("limits")}
            </a>
            <a
              href="#terms"
              className={`transition-colors ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-[#d4af37]"
              }`}
            >
              {t("terms")}
            </a>
          </nav>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

