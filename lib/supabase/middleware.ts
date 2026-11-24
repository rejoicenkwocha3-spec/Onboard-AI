import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED = ["/dashboard", "/onboarding"];
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];

const matches = (path: string, bases: string[]) =>
  bases.some((b) => path === b || path.startsWith(b + "/"));

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getSupabaseEnv();
  const path = request.nextUrl.pathname;

  if (!env) {
    // No backend configured: keep private routes closed.
    if (matches(path, PROTECTED)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list: CookieToSet[]) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the token with Supabase, unlike getSession().
  const { data: { user } } = await supabase.auth.getUser();

  const redirect = (to: string, withNext = false) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = withNext ? `?next=${encodeURIComponent(path)}` : "";
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!user && matches(path, PROTECTED)) return redirect("/login", true);
  if (user && matches(path, GUEST_ONLY)) return redirect("/dashboard");
  return response;
}
