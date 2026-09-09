"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogIn, LogOut, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLocalUser, clearLocalUser, type LocalUser } from "@/lib/local-auth";
import { useI18n } from "./I18nProvider";
import type { User } from "@supabase/supabase-js";

export function AuthNav() {
  const { t } = useI18n();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [local, setLocal] = useState<LocalUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncLocal = () => setLocal(getLocalUser());
    const close = (event: MouseEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    syncLocal();
    window.addEventListener("coverly-auth", syncLocal);
    window.addEventListener("storage", syncLocal);
    document.addEventListener("mousedown", close);

    if (!supabase) {
      setChecked(true);
      return () => {
        window.removeEventListener("coverly-auth", syncLocal);
        window.removeEventListener("storage", syncLocal);
        document.removeEventListener("mousedown", close);
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setChecked(true);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("coverly-auth", syncLocal);
      window.removeEventListener("storage", syncLocal);
      document.removeEventListener("mousedown", close);
    };
  }, [supabase]);

  if (!checked) return <div className="h-11 w-11 animate-pulse rounded-full bg-[var(--soft)]" />;
  const active = user || local;
  if (!active) return <Link href="/login" className="flex h-11 items-center gap-2 rounded-xl border line px-3 text-sm font-semibold"><LogIn size={16}/><span className="hidden sm:inline">{t("login")}</span></Link>;

  const name = user?.user_metadata?.username || local?.username || user?.email || "Я";
  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    clearLocalUser();
    setOpen(false);
    location.href = "/";
  };

  return <div ref={menu} className="relative">
    <button onClick={() => setOpen(value => !value)} aria-label="Account menu" aria-expanded={open} className="flex h-11 items-center gap-1 rounded-full pr-1 focus:outline-none focus:ring-2 focus:ring-acid">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-plum to-pink-400 text-xs font-bold text-white">{name.slice(0,2).toUpperCase()}</span>
      <ChevronDown size={14} className={`hidden transition sm:block ${open ? "rotate-180" : ""}`}/>
    </button>
    {open && <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/15 bg-neutral-950 p-2 text-white shadow-2xl">
      <div className="truncate border-b border-white/10 px-3 py-2 text-xs text-white/60">{name}</div>
      <Link href="/account" onClick={() => setOpen(false)} className="mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm hover:bg-white/10"><UserCircle size={18}/>{t("account")}</Link>
      <button onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-300 hover:bg-red-500/10"><LogOut size={18}/>{t("logout")}</button>
    </div>}
  </div>;
}
