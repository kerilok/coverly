"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useI18n, type Locale } from "./I18nProvider";

const languages: Array<{ value: Locale; short: string; label: string }> = [
  { value: "ru", short: "RU", label: "Русский" },
  { value: "en", short: "EN", label: "English" },
  { value: "de", short: "DE", label: "Deutsch" },
  { value: "uk", short: "UA", label: "Українська" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const active = languages.find((language) => language.value === locale) ?? languages[0];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        aria-label="Choose language"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="line flex h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold"
      >
        <Languages size={16} />
        <span>{active.short}</span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-white/15 bg-neutral-950 p-1.5 text-white shadow-2xl">
          {languages.map((language) => {
            const selected = language.value === locale;
            return (
              <button
                key={language.value}
                type="button"
                onClick={() => {
                  setLocale(language.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  selected ? "bg-acid font-bold text-ink" : "text-white hover:bg-white/10"
                }`}
              >
                <span className="w-6 font-bold">{language.short}</span>
                <span className="flex-1">{language.label}</span>
                {selected && <Check size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
