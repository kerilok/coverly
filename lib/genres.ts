import type { Locale } from "@/components/I18nProvider";

export const GENRES = ["fantasy","romance","detective","thriller","horror","scifi","nonfiction","children","history","poetry","other"] as const;
export type Genre = typeof GENRES[number];

const labels: Record<Locale, Record<Genre,string>> = {
  ru:{fantasy:"Фэнтези",romance:"Романтика",detective:"Детектив",thriller:"Триллер",horror:"Ужасы",scifi:"Научная фантастика",nonfiction:"Нон-фикшн",children:"Детская литература",history:"История",poetry:"Поэзия",other:"Другое"},
  en:{fantasy:"Fantasy",romance:"Romance",detective:"Detective",thriller:"Thriller",horror:"Horror",scifi:"Science fiction",nonfiction:"Non-fiction",children:"Children's",history:"History",poetry:"Poetry",other:"Other"},
  de:{fantasy:"Fantasy",romance:"Romantik",detective:"Krimi",thriller:"Thriller",horror:"Horror",scifi:"Science-Fiction",nonfiction:"Sachbuch",children:"Kinderbuch",history:"Geschichte",poetry:"Poesie",other:"Andere"},
  uk:{fantasy:"Фентезі",romance:"Романтика",detective:"Детектив",thriller:"Трилер",horror:"Жахи",scifi:"Наукова фантастика",nonfiction:"Нон-фікшн",children:"Дитяча література",history:"Історія",poetry:"Поезія",other:"Інше"}
};

export function genreLabel(genre:string|undefined,locale:Locale){return labels[locale][(GENRES.includes(genre as Genre)?genre:"other") as Genre]}
