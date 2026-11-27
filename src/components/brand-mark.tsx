import { cn } from '@cbrl/design'

type BrandMarkProps = {
  className?: string
}

/** App symbol. Same artwork as `src/app/icon.svg`; decorative next to the name. */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      aria-hidden="true"
      focusable="false"
      className={cn('size-6 shrink-0', className)}
    >
      <rect width="512" height="512" rx="116" fill="#C8502D" />
      <path
        d="M256 420C256 420 132 300 132 214A124 124 0 0 1 380 214C380 300 256 420 256 420Z"
        fill="#FFF1E0"
      />
      <path
        d="M196 226L256 176L316 226V286H196Z"
        fill="#C8502D"
        stroke="#C8502D"
        strokeWidth="12"
        strokeLinejoin="round"
      />
      <path d="M242 292V254A14 14 0 0 1 270 254V292Z" fill="#FFF1E0" />
    </svg>
  )
}
