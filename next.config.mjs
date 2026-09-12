/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 刻意不用 output: 'export'。内容页全部 force-static 预渲染走 CDN，
  // 但要保留少量 Route Handler（发布 API / 触发构建 / 阅读量），
  // 这样 service role key 与写入 token 永远留在服务端，客户端零 Supabase 密钥。
  images: {
    // 文章配图来自 Supabase Storage 的 public bucket，域名由环境变量给出。
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  /**
   * `/{slug}.md` → `/md/{slug}`。
   *
   * 那个 `.md` 后缀是给抓取端的（见 src/lib/routes.ts 的 `postMarkdownPath`），
   * 但 App Router 的动态段必须独占一整段 —— `[slug].md` 不是合法目录名，
   * 所以真正的路由建在 `/md/[slug]`，靠这条 rewrite 换个形状对外。
   *
   * 走 next.config 而不是 vercel.json：`next start` 也读这里，本地能验；
   * vercel.json 里那两条 301 只有线上才生效。
   * 模式限成 slug 的字符集，免得把 `/foo.bar.md` 之类也吃进来。
   */
  async rewrites() {
    return [{ source: '/:slug([a-z0-9-]+).md', destination: '/md/:slug' }]
  },
}

export default nextConfig
