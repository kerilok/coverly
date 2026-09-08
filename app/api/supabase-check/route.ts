import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "missing_environment_variables", hasUrl: Boolean(url), hasKey: Boolean(key) },
      { status: 500 }
    );
  }

  let host = "invalid";
  try {
    host = new URL(url).host;
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    const body = await response.text();
    return NextResponse.json({ ok: response.ok, status: response.status, host, response: body.slice(0, 300) }, { status: response.ok ? 200 : 502 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "connection_failed", host, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 }
    );
  }
}
