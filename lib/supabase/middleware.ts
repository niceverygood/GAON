import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/manager', '/admin'];
const AUTH_PREFIXES = ['/login', '/signup'];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function updateSession(request: NextRequest) {
  // If Supabase env vars are not configured (e.g. a Vercel preview without
  // variables yet), we must NOT throw — every request would 500 before the
  // landing page renders. Instead: pass through, and push protected routes
  // to /login with a friendly note so deploy ops are debuggable.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const { pathname } = request.nextUrl;
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'supabase_env_missing');
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    // Network / auth-service hiccup should not 500 the entire site.
    console.error('[middleware] supabase.auth.getUser failed', err);
  }

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
