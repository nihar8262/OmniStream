"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale as any });
    });
  };

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <div className={`relative inline-flex items-center ${className || ""}`}>
      <Select
        value={locale}
        onValueChange={handleLocaleChange}
        disabled={isPending}
      >
        <SelectTrigger aria-label="Select Interface Language" className="h-8.5 sm:h-9 w-[110px] sm:w-[135px] border-white/[0.08] bg-white/[0.04] text-xs font-medium hover:border-white/[0.18] focus:ring-[#e7b92f]/40 px-2.5 sm:px-3 rounded-xl">
          <div className="flex items-center gap-1.5 truncate">
            <Globe className="h-3.5 w-3.5 shrink-0 text-[#e7b92f]" />
            <span className="truncate">{currentLang.flag} {currentLang.label}</span>
          </div>
        </SelectTrigger>
        <SelectContent align="end" className="bg-[#121212]/95 border-white/[0.1] rounded-xl shadow-2xl">
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="text-xs font-medium cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
