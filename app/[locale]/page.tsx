import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { HeroInput } from "@/components/HeroInput";
import { MediaGrid } from "@/components/MediaGrid";
import { HowItWorks } from "@/components/HowItWorks";
import { LimitsSection } from "@/components/LimitsSection";
import { TermsSection } from "@/components/TermsSection";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col items-center w-full">
      <HeroInput />
      <MediaGrid />
      <HowItWorks />
      <LimitsSection />
      <TermsSection />
    </div>
  );
}
