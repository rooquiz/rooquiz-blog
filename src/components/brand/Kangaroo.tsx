/**
 * Roo is drawn as a compact editorial mascot rather than an emoji-like animal.
 * The bent ear, long counter-balancing tail, ink outline, and quiz card give it
 * a recognisable silhouette from the hero down to the small footer signature.
 */
export function Kangaroo({
  idPrefix,
  className,
  simplified = false,
}: {
  idPrefix: string
  className?: string
  simplified?: boolean
}) {
  const fur = `${idPrefix}-fur`

  return (
    <svg className={className} viewBox="0 0 380 430" fill="none" aria-hidden>
      <defs>
        <linearGradient id={fur} x1="116" y1="54" x2="278" y2="366" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3A45E" />
          <stop offset="1" stopColor="#C9693F" />
        </linearGradient>
      </defs>

      <ellipse cx="194" cy="399" rx="143" ry="16" fill="#25213F" opacity="0.13" />

      {/* The tail leads the eye back into the rainbow and keeps the seated pose lively. */}
      <path
        d="M246 277c48 6 88 35 103 69 10 24 2 46-21 51-18 4-35-4-39-18 17 1 30-4 33-15 4-15-18-37-53-47-13-4-26-4-39-2l16-38Z"
        fill="#B95B3A"
        stroke="#2B2845"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M317 362c13 1 25-4 30-14 7 15 3 31-12 39-12 7-28 6-38-2 11-3 18-11 20-23Z" fill="#FFE0B3" />

      <path
        d="M151 309c-34-2-67 18-82 50-8 17 2 31 20 30l79-7 18-67-35-6Z"
        fill="#B95B3A"
        stroke="#2B2845"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d="M226 312c31 0 56 17 66 43 7 18-4 31-23 29l-66-8-12-60 35-4Z"
        fill="#CA7044"
        stroke="#2B2845"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M67 365c-9 16 1 27 20 25l70-7-2-24-88 6Z" fill="#FFE0B3" />
      <path d="M219 358l-6 20 55 7c19 2 29-8 25-25l-74-2Z" fill="#FFE0B3" />

      <path
        d="M190 177c-48 0-80 39-79 101 1 65 27 94 79 94s78-29 79-94c1-62-31-101-79-101Z"
        fill={`url(#${fur})`}
        stroke="#2B2845"
        strokeWidth="7"
      />
      <path
        d="M120 230c10-34 34-53 70-53s60 19 70 53l-8 79H128l-8-79Z"
        fill="#6654D9"
        stroke="#2B2845"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M145 213c22 16 68 16 90 0" stroke="#A99BFF" strokeWidth="8" strokeLinecap="round" />
      <path d="M190 229v62" stroke="#4B3CAE" strokeWidth="5" strokeLinecap="round" />

      <path d="M132 242c-13 19-14 50 12 68" stroke={`url(#${fur})`} strokeWidth="27" strokeLinecap="round" />
      <path d="M248 242c13 19 14 50-12 68" stroke={`url(#${fur})`} strokeWidth="27" strokeLinecap="round" />

      <g transform="rotate(-2 190 318)">
        <rect x="139" y="278" width="102" height="80" rx="10" fill="#FFFDF8" stroke="#2B2845" strokeWidth="7" />
        {!simplified && (
          <>
            <circle cx="161" cy="300" r="6" fill="#FF3D84" />
            <path d="m157 300 3 3 6-7" stroke="#FFFDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M177 300h43M160 321h60M160 340h39" stroke="#CBC6E9" strokeWidth="6" strokeLinecap="round" />
          </>
        )}
      </g>
      <circle cx="148" cy="304" r="14" fill="#E58A51" stroke="#2B2845" strokeWidth="6" />
      <circle cx="232" cy="304" r="14" fill="#D57647" stroke="#2B2845" strokeWidth="6" />

      <path
        d="M149 86c-19-27-26-59-9-69 17-10 34 21 38 55l-29 14Z"
        fill={`url(#${fur})`}
        stroke="#2B2845"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M151 68c-8-17-11-34-5-39 7-4 16 14 20 34l-15 5Z" fill="#FFB1B9" />
      <path
        d="M220 75c7-29 25-50 43-43 11 5 10 21 1 35 13-3 22 5 18 16-6 17-35 20-61 17l-1-25Z"
        fill={`url(#${fur})`}
        stroke="#2B2845"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M238 75c7-17 17-29 24-27 6 3 2 15-9 27 8-2 14 1 13 6-2 7-16 9-30 8l2-14Z" fill="#FFB1B9" />

      <path
        d="M190 57c-44 0-76 31-76 74 0 27 13 48 33 61 10 7 19 17 23 28 4 12 35 12 40 0 4-11 13-21 23-28 20-13 33-34 33-61 0-43-32-74-76-74Z"
        fill={`url(#${fur})`}
        stroke="#2B2845"
        strokeWidth="7"
      />
      <path d="M137 125c11-18 31-27 53-27s42 9 53 27c4 7 5 17 2 26-8 25-28 42-55 42s-47-17-55-42c-3-9-2-19 2-26Z" fill="#F7C890" />

      <path d="M145 113c8-8 19-10 29-5" stroke="#2B2845" strokeWidth="6" strokeLinecap="round" />
      <path d="M206 108c10-5 21-3 29 5" stroke="#2B2845" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="162" cy="128" rx="7" ry="9" fill="#2B2845" />
      <ellipse cx="218" cy="128" rx="7" ry="9" fill="#2B2845" />
      {!simplified && (
        <>
          <circle cx="160" cy="125" r="2" fill="white" />
          <circle cx="216" cy="125" r="2" fill="white" />
          <circle cx="143" cy="153" r="7" fill="#EF7C7E" opacity="0.55" />
          <circle cx="237" cy="153" r="7" fill="#EF7C7E" opacity="0.55" />
        </>
      )}
      <path d="M177 151c2-10 24-10 26 0 1 7-5 14-13 14s-14-7-13-14Z" fill="#2B2845" />
      <path d="M190 165c0 8 7 12 15 9" stroke="#2B2845" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function RooMark({ idPrefix, className }: { idPrefix: string; className?: string }) {
  const fur = `${idPrefix}-fur`

  return (
    <svg className={className} viewBox="0 0 150 158" fill="none" aria-hidden>
      <defs>
        <linearGradient id={fur} x1="35" y1="14" x2="112" y2="144" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3A45E" />
          <stop offset="1" stopColor="#C9693F" />
        </linearGradient>
      </defs>
      <path d="M44 58C28 34 25 10 38 6c13-4 24 20 27 43L44 58Z" fill={`url(#${fur})`} stroke="#2B2845" strokeWidth="6" strokeLinejoin="round" />
      <path d="M49 46c-6-13-7-24-3-26 5-2 10 11 12 23l-9 3Z" fill="#FFB1B9" />
      <path d="M93 48c7-23 21-36 33-29 8 5 4 16-4 25 9-1 15 5 11 13-6 12-24 11-42 8l2-17Z" fill={`url(#${fur})`} stroke="#2B2845" strokeWidth="6" strokeLinejoin="round" />
      <path d="M75 42c-34 0-58 24-58 58 0 22 11 40 28 50 9 5 51 5 60 0 17-10 28-28 28-50 0-34-24-58-58-58Z" fill={`url(#${fur})`} stroke="#2B2845" strokeWidth="6" />
      <path d="M36 96c8-14 23-21 39-21s31 7 39 21c10 18-8 44-39 44S26 114 36 96Z" fill="#F7C890" />
      <ellipse cx="55" cy="96" rx="6" ry="8" fill="#2B2845" />
      <ellipse cx="95" cy="96" rx="6" ry="8" fill="#2B2845" />
      <path d="M65 114c2-9 18-9 20 0 1 6-4 11-10 11s-11-5-10-11Z" fill="#2B2845" />
      <path d="M75 125c0 6 5 9 11 7" stroke="#2B2845" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}
