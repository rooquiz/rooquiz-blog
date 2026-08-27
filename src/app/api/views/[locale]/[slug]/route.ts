import { isLocale } from '@/lib/content'
import { hasSupabaseCredentials } from '@/lib/env'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * 阅读量。页面是静态的，所以计数只能由客户端在挂载时补一次。
 *
 * 走服务端 Route Handler 而不是让浏览器直连 Supabase：
 * 这样客户端不需要 anon key，RPC 也不用对 anon 开放。
 *
 * 没配 Supabase 时返回 count: null 而不是 500 —— 离线开发模式下每打开一篇文章
 * 报一次 500 纯属噪音，客户端拿到非数字本来就会什么都不渲染。
 */
async function resolvePostId(locale: string, slug: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from('posts')
    .select('id')
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle<{ id: string }>()

  return data?.id ?? null
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return Response.json({ error: 'Unknown locale' }, { status: 404 })
  if (!hasSupabaseCredentials()) return Response.json({ count: null })

  const postId = await resolvePostId(locale, slug)
  if (!postId) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data } = await supabaseAdmin()
    .from('post_views')
    .select('count')
    .eq('post_id', postId)
    .maybeSingle<{ count: number }>()

  return Response.json({ count: data?.count ?? 0 })
}

export async function POST(_request: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return Response.json({ error: 'Unknown locale' }, { status: 404 })
  if (!hasSupabaseCredentials()) return Response.json({ count: null })

  const postId = await resolvePostId(locale, slug)
  if (!postId) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin().rpc('increment_post_view', { p_post_id: postId })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ count: Number(data ?? 0) })
}
