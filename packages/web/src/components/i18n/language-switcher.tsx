"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/request";
import { Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { getSupportedLocales, getLocaleFlag, type Locale } from "@/i18n/config";

/**
 * Language Switcher Component
 *
 * Allows users to switch between supported languages
 */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const supportedLocales = getSupportedLocales();

  function changeLocale(newLocale: Locale) {
    // Set cookie for locale preference
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;

    // Navigate to the new locale
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span className="text-lg">{getLocaleFlag(locale)}</span>
          <span className="hidden sm:inline">
            {locale.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLocales.map((loc) => (
          <DropdownMenuItem
            key={loc.value}
            onClick={() => changeLocale(loc.value)}
            className={locale === loc.value ? "bg-accent" : ""}
          >
            <span className="mr-2">{loc.flag}</span>
            {loc.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
