import { NextResponse, type NextRequest } from 'next/server'

import { DEFAULT_LOCALE, LOCALES } from '../site.config'

/**
 * 根路径按 Accept-Language 分流到 /en 或 /zh。
 *
 * docs 仓因为 output:'export' 没有 middleware，只能在 Cloudflare Pages Function 里做同一件事；
 * 这边跑在 Vercel 上、也没有静态导出，直接用 middleware 更省事。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = LOCALES.some(locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))
  if (hasLocale) return NextResponse.next()

  const target = preferredLocale(request.headers.get('accept-language'))
  const url = request.nextUrl.clone()
  url.pathname = `/${target}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

/** 只认中文，其余一律落到英文（本站英文为主） */
function preferredLocale(header: string | null): string {
  if (!header) return DEFAULT_LOCALE
  const first = header.split(',')[0]?.trim().toLowerCase() ?? ''
  return first.startsWith('zh') ? 'zh' : DEFAULT_LOCALE
}

export const config = {
  // 放过 Next 内部资源、API、以及所有带扩展名的静态文件（含 sitemap.xml / robots.txt / feed.xml / 搜索索引）
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
