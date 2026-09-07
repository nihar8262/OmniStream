"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { BrandIcon } from "./icons/BrandIcon";
import { History } from "lucide-react";

export function Header() {
  const t = useTranslations("nav");
  const { platform, setIsHistoryModalOpen } = useAppStore();
  const isLinkedIn = platform === "linkedin";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 sm:gap-3 group">
          <div
            className={`relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl p-[1px] transition-all duration-300 group-hover:scale-105 ${
              isLinkedIn
                ? "bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 shadow-md shadow-blue-500/20"
                : "bg-gradient-to-br from-[#fef3c7] via-[#e7b92f] to-[#c29017] shadow-md shadow-[#e7b92f]/15"
            }`}
          >
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0d0d0d]">
              <BrandIcon platform={platform} className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span
              className={`text-base sm:text-lg font-bold tracking-tight transition-all duration-300 ${
                isLinkedIn ? "linkedin-gradient-text" : "gold-gradient-text"
              }`}
            >
              {t("title")}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#a5a39c] font-medium -mt-0.5 sm:-mt-1">
              {t("tagline")}
            </span>
          </div>
        </a>

        {/* Navigation Links & Language Switcher */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#a5a39c]">
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-[#e7b92f]"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </button>
            <a
              href="#how-it-works"
              className={`transition-colors ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-[#e7b92f]"
              }`}
            >
              {t("howItWorks")}
            </a>
            <a
              href="#limits"
              className={`transition-colors ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-[#e7b92f]"
              }`}
            >
              {t("limits")}
            </a>
            <a
              href="#terms"
              className={`transition-colors ${
                isLinkedIn ? "hover:text-sky-400" : "hover:text-[#e7b92f]"
              }`}
            >
              {t("terms")}
            </a>
          </nav>

          {/* Mobile History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            aria-label="Recent Links History"
            className="flex md:hidden items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-[#a5a39c] hover:text-[#f5f3ed] hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <History className={`h-3.5 w-3.5 ${isLinkedIn ? "text-sky-400" : "text-[#e7b92f]"}`} />
            <span>History</span>
          </button>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
