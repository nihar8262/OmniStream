"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { SupportedPlatform, useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Clipboard,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  Link2Off,
  Lock,
  SearchX,
  Clock,
  ServerCrash,
  Copy,
  History,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { LinkHistoryModal } from "./LinkHistoryModal";
import { saveLinkToHistory, getLinkHistory } from "@/lib/history";

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export function HeroInput() {
  const t = useTranslations("hero");
  const tErr = useTranslations("errors");

  const {
    platform,
    setPlatform,
    url,
    setUrl,
    isResolving,
    setIsResolving,
    resolveError,
    setResolveError,
    setManifest,
    resetAll,
  } = useAppStore();

  const [inputFocused, setInputFocused] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    setHistoryCount(getLinkHistory().length);
  }, []);

  const detectPlatformFromUrl = (inputUrl: string): SupportedPlatform | null => {
    if (inputUrl.includes("linkedin.com") || inputUrl.includes("lnkd.in")) {
      return "linkedin";
    }
    if (inputUrl.includes("instagram.com")) {
      return "instagram";
    }
    return null;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleanText = text.trim();
        setUrl(cleanText);
        setResolveError(null);

        const detected = detectPlatformFromUrl(cleanText);
        if (detected && detected !== platform) {
          setPlatform(detected);
          toast.success(
            `Switched to ${detected === "linkedin" ? "LinkedIn" : "Instagram"} mode!`
          );
        } else {
          toast.success("Link pasted from clipboard!");
        }
      }
    } catch {
      toast.error(tErr("CLIPBOARD_ERROR"));
    }
  };

  const handleCopyInputUrl = async () => {
    if (!url.trim()) return;
    try {
      await navigator.clipboard.writeText(url.trim());
      setCopiedUrl(true);
      toast.success("Search URL copied to clipboard!");
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleClear = () => {
    resetAll();
  };

  const handleSearch = async (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();
    const targetUrl = customUrl || url;
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    // Detect if platform needs switching
    const detected = detectPlatformFromUrl(cleanUrl);
    const activePlatform = detected || platform;
    if (detected && detected !== platform) {
      setPlatform(detected);
    }

    // Validate URL based on platform
    if (activePlatform === "instagram" && !cleanUrl.includes("instagram.com/")) {
      setResolveError({
        code: "UNSUPPORTED_URL",
        message: tErr("UNSUPPORTED_INSTAGRAM_URL"),
      });
      return;
    }

    if (
      activePlatform === "linkedin" &&
      !cleanUrl.includes("linkedin.com/") &&
      !cleanUrl.includes("lnkd.in/")
    ) {
      setResolveError({
        code: "UNSUPPORTED_URL",
        message: tErr("UNSUPPORTED_LINKEDIN_URL"),
      });
      return;
    }

    setIsResolving(true);
    setResolveError(null);

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, platform: activePlatform }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const code = data?.error?.code || "RESOLVER_FAILED";
        let message = data?.error?.message;
        if (code === "PRIVATE_OR_GATED") message = tErr("PRIVATE_OR_GATED");
        else if (code === "NOT_FOUND") message = tErr("NOT_FOUND");
        else if (code === "UNSUPPORTED_URL") message = tErr("UNSUPPORTED_URL");
        else if (code === "RATE_LIMITED") message = tErr("RATE_LIMITED");

        setResolveError({ code, message: message || tErr("RESOLVER_FAILED") });
        toast.error(message || tErr("RESOLVER_FAILED"));
        return;
      }

      setManifest(data);
      // Save link to client-side localStorage history
      const updatedHistory = saveLinkToHistory({
        url: cleanUrl,
        platform: activePlatform,
        authorUsername: data.author?.username,
        itemCount: data.itemCount,
      });
      setHistoryCount(updatedHistory.length);

      toast.success(`Found ${data.items.length} media item(s)!`);

      setTimeout(() => {
        const el = document.getElementById("results-grid");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: unknown) {
      console.error("Resolve error:", err);
      setResolveError({
        code: "RESOLVER_FAILED",
        message: tErr("RESOLVER_FAILED"),
      });
      toast.error(tErr("RESOLVER_FAILED"));
    } finally {
      setIsResolving(false);
    }
  };

  const handleSelectFromHistory = (histUrl: string, histPlatform: SupportedPlatform) => {
    setUrl(histUrl);
    setPlatform(histPlatform);
    handleSearch(undefined, histUrl);
  };

  const placeholderText =
    platform === "linkedin"
      ? t("inputPlaceholderLinkedin")
      : t("inputPlaceholderInstagram");

  return (
    <section className="relative w-full pt-8 sm:pt-10 pb-8 sm:pb-10 px-3 sm:px-6 overflow-hidden">
      {/* Background ambient radial glow */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-[600px] h-[260px] sm:h-[350px] blur-[100px] sm:blur-[130px] pointer-events-none rounded-full transition-all duration-700 ${
          platform === "linkedin"
            ? "bg-gradient-to-b from-blue-600/20 to-transparent"
            : "bg-gradient-to-b from-[#d4af37]/15 to-transparent"
        }`}
      />

      <div className="container mx-auto max-w-4xl text-center relative z-10">
        {/* Top Feature Badge */}
        <div className="inline-flex items-center justify-center mb-4 sm:mb-5">
          <Badge
            variant="default"
            className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-medium backdrop-blur-md shadow-lg transition-all duration-300 ${
              platform === "linkedin"
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300 shadow-sky-500/15"
                : "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] shadow-[#d4af37]/10"
            }`}
          >
            <Sparkles
              className={`h-3.5 w-3.5 mr-1 ${
                platform === "linkedin" ? "text-sky-400" : "text-[#e8a33d]"
              }`}
            />
            {t("badge")}
          </Badge>
        </div>

        {/* Hero Title */}
        <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-3 sm:mb-4 leading-tight transition-all break-words">
          {platform === "linkedin" ? (
            <>
              Download Public{" "}
              <span className="linkedin-gradient-text">LinkedIn</span> Photos, Slides & Videos
            </>
          ) : (
            <>
              Download Public{" "}
              <span className="gold-gradient-text">Instagram</span> Photos, Reels & Carousels
            </>
          )}
        </h1>

        {/* Hero Subtitle */}
        <p className="text-xs sm:text-base text-neutral-300 max-w-2xl mx-auto mb-6 sm:mb-7 leading-relaxed">
          {platform === "linkedin" ? t("subtitleLinkedin") : t("subtitleInstagram")}
        </p>

        {/* Platform Toggle Tabs & History Button Row */}
        <div className="mx-auto mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <div
            role="tablist"
            aria-label="Select platform"
            className="inline-flex items-center rounded-2xl border border-white/10 bg-neutral-900/80 p-1 sm:p-1.5 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            <button
              type="button"
              role="tab"
              aria-selected={platform === "instagram"}
              onClick={() => {
                setPlatform("instagram");
                setResolveError(null);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:outline-none ${
                platform === "instagram"
                  ? "gold-gradient-bg text-neutral-950 shadow-md shadow-[#d4af37]/20 font-bold"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <InstagramIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("instagramTab")}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={platform === "linkedin"}
              onClick={() => {
                setPlatform("linkedin");
                setResolveError(null);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                platform === "linkedin"
                  ? "bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 text-white shadow-md shadow-blue-500/25 font-bold"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LinkedInIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("linkedinTab")}</span>
            </button>
          </div>

          {/* Dedicated Link History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="Open Link History"
            title="View recent link history"
            className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-neutral-900/80 px-3 sm:px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:border-white/25 hover:bg-white/10 backdrop-blur-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:outline-none"
          >
            <History className="h-3.5 w-3.5 text-[#d4af37]" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 px-1.5 py-0.2 text-[10px] font-bold text-[#fef08a]">
                {historyCount}
              </span>
            )}
          </button>
        </div>

        {/* Main Input Glass Card */}
        <form
          onSubmit={handleSearch}
          className={`relative mx-auto max-w-2xl rounded-2xl p-2 sm:p-2.5 transition-all duration-300 ${
            inputFocused
              ? platform === "linkedin"
                ? "border-blue-500/40 bg-neutral-900/90 ring-2 ring-blue-500/40 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl"
                : "glass-panel-gold ring-2 ring-[#d4af37]/50 shadow-2xl shadow-[#d4af37]/10"
              : "glass-panel"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Input field */}
            <div className="relative flex-1 w-full flex items-center">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  const val = e.target.value;
                  setUrl(val);
                  if (resolveError) setResolveError(null);
                  const detected = detectPlatformFromUrl(val);
                  if (detected && detected !== platform) {
                    setPlatform(detected);
                  }
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={placeholderText}
                aria-label="Post URL"
                className="w-full h-11 sm:h-12 pl-3.5 sm:pl-4 pr-20 sm:pr-24 bg-transparent text-sm sm:text-base text-white placeholder:text-neutral-500 focus:outline-none"
              />

              {/* Action buttons inside input right side */}
              <div className="absolute right-2 flex items-center gap-1">
                {url ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyInputUrl}
                      aria-label="Copy input URL"
                      title="Copy URL to clipboard"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-[#d4af37] hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {copiedUrl ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      aria-label="Clear input"
                      title={t("clear")}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    aria-label="Paste URL from clipboard"
                    className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-white/10 text-neutral-300 hover:text-[#d4af37] hover:bg-white/15 transition-all border border-white/10 cursor-pointer"
                  >
                    <Clipboard className="h-3 w-3" />
                    <span className="hidden sm:inline">{t("pasteButton")}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search Submit Button */}
            <Button
              type="submit"
              disabled={isResolving || !url.trim()}
              className={`w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-xl font-semibold hover:brightness-110 shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
                platform === "linkedin"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-blue-500/20"
                  : "gold-gradient-bg text-neutral-950 shadow-[#d4af37]/20"
              }`}
            >
              {isResolving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("searching")}</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>{t("searchButton")}</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Distinct Contextual Error Feedback Messages */}
        {resolveError && (
          <div
            className={`mt-4 mx-auto max-w-2xl rounded-2xl border p-4 text-left backdrop-blur-xl animate-in fade-in zoom-in-95 transition-all ${
              resolveError.code === "PRIVATE_OR_GATED"
                ? "border-purple-500/40 bg-purple-950/40 text-purple-200 shadow-lg shadow-purple-500/10"
                : resolveError.code === "NOT_FOUND"
                ? "border-sky-500/30 bg-slate-900/80 text-sky-200 shadow-lg shadow-sky-500/10"
                : resolveError.code === "RATE_LIMITED"
                ? "border-orange-500/40 bg-orange-950/40 text-orange-200 shadow-lg shadow-orange-500/10"
                : resolveError.code === "UNSUPPORTED_URL"
                ? "border-amber-500/40 bg-amber-950/40 text-amber-200 shadow-lg shadow-amber-500/10"
                : "border-red-500/40 bg-red-950/40 text-red-200 shadow-lg shadow-red-500/10"
            }`}
          >
            <div className="flex items-start gap-3.5">
              {/* Dynamic Contextual Icon */}
              <div className="shrink-0 mt-0.5">
                {resolveError.code === "PRIVATE_OR_GATED" ? (
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Lock className="h-5 w-5" />
                  </div>
                ) : resolveError.code === "NOT_FOUND" ? (
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    <SearchX className="h-5 w-5" />
                  </div>
                ) : resolveError.code === "RATE_LIMITED" ? (
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    <Clock className="h-5 w-5" />
                  </div>
                ) : resolveError.code === "UNSUPPORTED_URL" ? (
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Link2Off className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30">
                    <ServerCrash className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-tight">
                  {resolveError.code === "PRIVATE_OR_GATED"
                    ? "Private Account or Login-Gated Post"
                    : resolveError.code === "NOT_FOUND"
                    ? "Post Not Found or Removed"
                    : resolveError.code === "RATE_LIMITED"
                    ? "Rate Limit Cooldown"
                    : resolveError.code === "UNSUPPORTED_URL"
                    ? "Invalid Post Link Format"
                    : "Unable to Resolve Media"}
                </p>

                <p className="text-xs opacity-90 mt-1 leading-relaxed">
                  {resolveError.message}
                </p>

                {/* Helpful contextual examples / tips */}
                {resolveError.code === "UNSUPPORTED_URL" && (
                  <div className="mt-2.5 pt-2 border-t border-amber-500/20 text-[11px] space-y-1">
                    <p className="font-semibold text-amber-300">Accepted Link Formats:</p>
                    <p className="font-mono text-[10px] text-amber-200/90">
                      • Instagram: https://www.instagram.com/p/DFxyz... or /reel/...
                    </p>
                    <p className="font-mono text-[10px] text-amber-200/90">
                      • LinkedIn: https://www.linkedin.com/feed/update/... or /posts/...
                    </p>
                  </div>
                )}

                {resolveError.code === "PRIVATE_OR_GATED" && (
                  <div className="mt-2.5 pt-2 border-t border-purple-500/20 text-[11px] text-purple-300/90">
                    🔒 OmniStream operates with strict zero-persistence privacy and cannot bypass login requirements or private profile protections.
                  </div>
                )}

                {resolveError.code === "RESOLVER_FAILED" && (
                  <div className="mt-2.5 pt-2 border-t border-red-500/20 text-[11px] text-red-300/90">
                    Please ensure the link is from a public post, or try refreshing the page.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Link History Modal */}
      <LinkHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryCount(getLinkHistory().length);
        }}
        onSelectUrl={handleSelectFromHistory}
      />
    </section>
  );
}
