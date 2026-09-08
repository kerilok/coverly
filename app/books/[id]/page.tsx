"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Users } from "lucide-react";
import { books as demoBooks } from "@/lib/mock";
import type { Book } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { BookCover } from "@/components/BookCover";
import { RatingPicker } from "@/components/RatingPicker";
import { Comments } from "@/components/Comments";
import { useI18n } from "@/components/I18nProvider";

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const supabase = useMemo(() => createClient(), []);
  const demoBook = demoBooks.find((item) => item.id === id);
  const [book, setBook] = useState<Book | undefined>(demoBook);
  const [loading, setLoading] = useState(!demoBook);

  useEffect(() => {
    if (demoBook) return;
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id,title,author,description,cover_url,created_at,users(username),ratings(rating),comments(id)")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;
      if (error || !data) {
        setBook(undefined);
        setLoading(false);
        return;
      }

      const row = data as any;
      const ratingValues: number[] = (row.ratings || []).map((item: any) => Number(item.rating));
      const owner = Array.isArray(row.users) ? row.users[0]?.username : row.users?.username;
      const average = ratingValues.length
        ? Math.round((ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length) * 10) / 10
        : 0;

      setBook({
        id: row.id,
        title: row.title,
        author: row.author,
        description: row.description || "",
        cover: row.title.toUpperCase(),
        coverUrl: row.cover_url,
        palette: "from-[#6d5dfc] to-[#f7a7d5]",
        rating: average,
        ratings: ratingValues.length,
        comments: (row.comments || []).length,
        owner: owner || "coverly",
        createdAt: new Date(row.created_at).toLocaleDateString(),
      });
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [demoBook, id, supabase]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-6xl animate-pulse px-4 py-12 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[430px_1fr]">
            <div className="aspect-[3/4] rounded-3xl bg-[var(--soft)]" />
            <div className="space-y-5 pt-8">
              <div className="h-16 rounded-2xl bg-[var(--soft)]" />
              <div className="h-32 rounded-2xl bg-[var(--soft)]" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">404</h1>
          <p className="muted mt-3">This cover could not be found.</p>
          <button onClick={() => router.push("/")} className="mt-6 rounded-xl bg-acid px-5 py-3 font-semibold text-ink">
            {t("back")}
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-8">
        <button onClick={() => router.back()} className="muted mb-7 flex h-11 items-center gap-2">
          <ArrowLeft size={17} /> {t("back")}
        </button>
        <div className="grid gap-10 md:grid-cols-[minmax(280px,430px)_1fr] lg:gap-16">
          <BookCover text={book.cover} imageUrl={book.coverUrl} palette={book.palette} className="aspect-[3/4] rounded-3xl shadow-2xl" />
          <div className="md:pt-6">
            <span className="rounded-full bg-acid px-3 py-1 text-xs font-bold text-ink">{t("editor")}</span>
            <h1 className="mt-8 font-serif text-5xl tracking-[-.055em] sm:text-6xl">{book.title}</h1>
            <p className="muted mt-3 text-lg">{book.author}</p>
            <p className="muted mt-7 leading-7">{book.description}</p>
            <div className="my-9 grid grid-cols-2 gap-3">
              <div className="card rounded-2xl p-5">
                <strong className="text-4xl">{book.rating || "—"}</strong>
                <span className="muted"> / 10</span>
                <div className="mt-3 h-2 rounded-full bg-[var(--soft)]">
                  <div className="h-full rounded-full bg-acid" style={{ width: `${book.rating * 10}%` }} />
                </div>
              </div>
              <div className="card rounded-2xl p-5">
                <Users className="muted" />
                <strong className="mt-2 block text-2xl">{book.ratings}</strong>
                <span className="muted text-sm">{t("ratings")}</span>
              </div>
            </div>
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Star size={18} /> {t("yourRating")}
            </h2>
            <RatingPicker />
          </div>
        </div>
        <div className="ml-auto max-w-[670px]">
          <Comments />
        </div>
      </main>
    </>
  );
}
