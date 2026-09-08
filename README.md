# Coverly

Современная платформа оценки книжных обложек на Next.js, TypeScript, Tailwind, Framer Motion и Supabase.

## Быстрый запуск
```bash
npm install
npm run dev
```
Без переменных Supabase регистрация работает локально в браузере — удобно для демонстрации. Для общих аккаунтов между устройствами выполните `supabase/schema.sql` и добавьте `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` в Vercel.