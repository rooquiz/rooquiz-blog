import { isAuthorized, unauthorized } from '@/lib/api/auth'
import { uploadUrlInputSchema } from '@/lib/api/schema'
import { mediaObjectPrefix } from '@/lib/content/paths'
import { publicEnv } from '@/lib/env'
import { BUCKET_MEDIA, supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * 签发一个一次性上传 URL，让调用方把配图直接 PUT 到 blog-media。
 * 图片不经过本服务转发，避免 Vercel 函数的 body 体积与超时限制。
 *
 * key 前缀统一由 mediaObjectPrefix() 生成 —— 签发端与页面引用端共用同一个函数，
 * 免得两侧各拼一遍前缀然后拼歪（沿用 rooquiz-payload 的做法）。
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = uploadUrlInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const { translationKey, filename } = parsed.data
  const objectPath = `${mediaObjectPrefix(translationKey)}/${filename}`

  const { data, error } = await supabaseAdmin()
    .storage.from(BUCKET_MEDIA)
    .createSignedUploadUrl(objectPath, { upsert: true })

  if (error || !data) {
    return Response.json({ error: `Failed to sign upload URL: ${error?.message ?? 'unknown'}` }, { status: 502 })
  }

  return Response.json({
    // 用这个 URL 发 PUT，body 是文件二进制
    uploadUrl: data.signedUrl,
    token: data.token,
    objectPath,
    // 上传成功后在 MDX 里引用这个地址
    publicUrl: publicEnv.mediaBaseUrl ? `${publicEnv.mediaBaseUrl}/${objectPath}` : null,
  })
}
