/**
 * Roo —— 站点吉祥物。一只坐着的袋鼠，穿黄色连帽衫，尾巴绕过右腿搭在地上。
 *
 * 造型上的几个取舍（它最小会缩到 40px，最大 400px，两端都得成立）：
 *
 * - **小臂露皮毛，不做长袖。** 黄底上再画黄袖子，无论怎么调明度都糊成一团躯干；
 *   棕色小臂横在黄色前襟上，缩到 40px 也还认得出是「抱在胸前的手」。
 * - **尾巴压在后腿之上、脚掌之下。** 全压在后面就只剩一截露在体外，读不出是尾巴；
 *   全压在前面又像一条搭在腿上的绳子。夹在中间才有「从身后绕出来」的层次。
 * - **耳朵是两个旋转的椭圆，不是路径。** 袋鼠的辨识度九成在耳朵和尾巴上，
 *   椭圆的轮廓在任何尺寸下都干净；手写贝塞尔在小尺寸会抖。
 * - **不画描边。** 整套设计没有一处描边，靠色块和渐变分层。
 *
 * 渐变 id 必须全局唯一 —— 同一页可能同时出现英雄区的大图和页脚的小图，
 * id 撞车的话后挂载的那份会把前一份的渐变抢走（SVG 的 id 是文档级的）。
 * 所以 idPrefix 是必填，调用处各给各的。
 */
export function Kangaroo({
  idPrefix,
  className,
  /** 站点头 / 页脚那种小尺寸用：省掉腮红和眼里的高光，它们在 40px 下只是脏点 */
  simplified = false,
}: {
  idPrefix: string
  className?: string
  simplified?: boolean
}) {
  const id = (name: string) => `${idPrefix}-${name}`
  const fill = (name: string) => `url(#${id(name)})`

  return (
    <svg className={className} viewBox="0 0 380 420" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id('fur')} x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#E5B078" />
          <stop offset="1" stopColor="#BC7F45" />
        </linearGradient>
        <linearGradient id={id('tail')} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#D49C5F" />
          <stop offset="1" stopColor="#A87038" />
        </linearGradient>
        <linearGradient id={id('haunch')} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#B27B44" />
          <stop offset="1" stopColor="#8A5A2C" />
        </linearGradient>
        <linearGradient id={id('hoodie')} x1="0.25" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFD860" />
          <stop offset="1" stopColor="#F0A81C" />
        </linearGradient>
        <linearGradient id={id('cream')} x1="0.3" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FCEEDA" />
          <stop offset="1" stopColor="#EBD3B0" />
        </linearGradient>
      </defs>

      {/* 地面投影。压得很扁 —— 光源在正上方偏前 */}
      <ellipse cx="190" cy="390" rx="140" ry="15" fill="#1c3b50" opacity="0.15" />

      {/* 耳朵。外耳皮毛、内耳奶白，都朝外倾 22° */}
      <ellipse cx="140" cy="48" rx="23" ry="44" transform="rotate(-22 140 48)" fill={fill('fur')} />
      <ellipse cx="142" cy="52" rx="12" ry="30" transform="rotate(-22 142 52)" fill={fill('cream')} />
      <ellipse cx="240" cy="48" rx="23" ry="44" transform="rotate(22 240 48)" fill={fill('fur')} />
      <ellipse cx="238" cy="52" rx="12" ry="30" transform="rotate(22 238 52)" fill={fill('cream')} />

      {/* 尾巴：自身后甩出，绕过右腿落到地上，末端回勾 */}
      <path
        fill={fill('tail')}
        d="M228 282 C296 276 354 310 368 352 C376 376 363 397 341 397 C326 397 319 384 328 373 C339 354 326 337 302 325 C280 314 252 312 226 326 Z"
      />

      {/* 后腿。比躯干深一档，坐姿里它们是最背光的一块 */}
      <ellipse cx="118" cy="316" rx="48" ry="36" transform="rotate(-16 118 316)" fill={fill('haunch')} />
      <ellipse cx="262" cy="316" rx="48" ry="36" transform="rotate(16 262 316)" fill={fill('haunch')} />

      {/* 脚掌。袋鼠脚很长，这里两只都朝外岔开 6° */}
      <g fill={fill('fur')}>
        <rect x="38" y="342" width="132" height="48" rx="24" transform="rotate(-6 104 366)" />
        <rect x="210" y="342" width="132" height="48" rx="24" transform="rotate(6 276 366)" />
      </g>

      {/* 连帽衫躯干 */}
      <path
        fill={fill('hoodie')}
        d="M190 182 C230 182 254 200 258 234 C264 272 270 306 268 322 C266 340 240 350 190 350 C140 350 114 340 112 322 C110 306 116 272 122 234 C126 200 150 182 190 182 Z"
      />
      {/* 前袋。袋鼠育儿袋的双关，也是躯干上唯一的分色，缺了它前襟是一整片黄 */}
      <path
        fill="#E09708"
        d="M144 300 C144 293 148 289 155 289 L225 289 C232 289 236 293 236 300 L238 330 C239 339 234 345 225 345 L155 345 C146 345 141 339 142 330 Z"
      />

      {/* 小臂 + 交握的手。起点刻意落在躯干轮廓之内，看起来是从袖口伸出来的 */}
      <g stroke={fill('fur')} strokeWidth="22" strokeLinecap="round">
        <path d="M140 244 Q130 284 172 304" />
        <path d="M240 244 Q250 284 208 304" />
      </g>
      <circle cx="177" cy="306" r="15" fill={fill('fur')} />
      <circle cx="203" cy="306" r="15" fill={fill('fur')} />

      {/* 领口。一道深黄的弧，把下巴和躯干分开 */}
      <path d="M152 198 Q190 218 228 198" stroke="#DE9406" strokeWidth="9" strokeLinecap="round" />

      {/* 头。上半是圆颅，下半收成口鼻 */}
      <path
        fill={fill('fur')}
        d="M190 46 C227 46 254 73 254 108 C254 127 248 142 237 152 C228 161 220 172 216 183 C212 194 202 200 190 200 C178 200 168 194 164 183 C160 172 152 161 143 152 C132 142 126 127 126 108 C126 73 153 46 190 46 Z"
      />
      <ellipse cx="190" cy="170" rx="34" ry="26" fill={fill('cream')} />
      {!simplified && (
        <>
          <ellipse cx="145" cy="147" rx="16" ry="9.5" fill="#F2748F" opacity="0.45" />
          <ellipse cx="235" cy="147" rx="16" ry="9.5" fill="#F2748F" opacity="0.45" />
        </>
      )}
      <ellipse cx="190" cy="152" rx="13.5" ry="10.5" fill="#3B2C28" />
      <ellipse cx="161" cy="118" rx="10.5" ry="12.5" fill="#2A2436" />
      <ellipse cx="219" cy="118" rx="10.5" ry="12.5" fill="#2A2436" />
      {!simplified && (
        <>
          <circle cx="157" cy="112.5" r="3.6" fill="#fff" />
          <circle cx="215" cy="112.5" r="3.6" fill="#fff" />
        </>
      )}
    </svg>
  )
}

/**
 * 只有头的版本 —— 商标里那个夹在 Roo 与 Quiz 之间的小标记，以及无封面时的兜底砖。
 * 不是把整只袋鼠裁一刀：全身图缩到 24px 时耳朵只剩两个像素，得单独排一版把耳朵放大。
 */
export function RooMark({ idPrefix, className }: { idPrefix: string; className?: string }) {
  const id = (name: string) => `${idPrefix}-${name}`
  const fill = (name: string) => `url(#${id(name)})`

  return (
    <svg className={className} viewBox="0 0 140 150" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id('fur')} x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#E5B078" />
          <stop offset="1" stopColor="#BC7F45" />
        </linearGradient>
        <linearGradient id={id('cream')} x1="0.3" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FCEEDA" />
          <stop offset="1" stopColor="#EBD3B0" />
        </linearGradient>
      </defs>

      {/* 耳朵比全身图那版更长更立，小尺寸下靠它们撑起「这是袋鼠」 */}
      <ellipse cx="34" cy="40" rx="17" ry="37" transform="rotate(-20 34 40)" fill={fill('fur')} />
      <ellipse cx="36" cy="44" rx="8.5" ry="24" transform="rotate(-20 36 44)" fill={fill('cream')} />
      <ellipse cx="106" cy="40" rx="17" ry="37" transform="rotate(20 106 40)" fill={fill('fur')} />
      <ellipse cx="104" cy="44" rx="8.5" ry="24" transform="rotate(20 104 44)" fill={fill('cream')} />

      <path
        fill={fill('fur')}
        d="M70 38 C97 38 117 58 117 84 C117 98 112 110 104 117 C97 124 91 132 88 140 C85 148 78 152 70 152 C62 152 55 148 52 140 C49 132 43 124 36 117 C28 110 23 98 23 84 C23 58 43 38 70 38 Z"
      />
      <ellipse cx="70" cy="120" rx="25" ry="19" fill={fill('cream')} />
      <ellipse cx="70" cy="106" rx="10" ry="7.5" fill="#3B2C28" />
      <ellipse cx="48" cy="81" rx="7.5" ry="9" fill="#2A2436" />
      <ellipse cx="92" cy="81" rx="7.5" ry="9" fill="#2A2436" />
    </svg>
  )
}
