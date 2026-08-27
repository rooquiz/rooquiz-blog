import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { serverEnv } from '@/lib/env'

/**
 * service role client。绕过 RLS，只能在 Route Handler 与构建脚本里用。
 * 别在任何组件（哪怕是 Server Component）里引它——组件树一旦被标 'use client'，
 * 这个 key 就会被打进浏览器 bundle，`server-only` 会在那一刻直接让构建失败。
 */
let cached: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (!cached) {
    cached = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cached
}

export const BUCKET_CONTENT = 'blog-content'
export const BUCKET_MEDIA = 'blog-media'
