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
}

export default nextConfig
