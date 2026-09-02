// Shared UI primitives for the Eterja SC landing mockup.

export function Container({ children, className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 md:px-10 ${className}`}>
      {children}
    </div>
  )
}

export function Eyebrow({ children, className = '' }) {
  return (
    <p
      className={`font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-terracotta ${className}`}
    >
      {children}
    </p>
  )
}

export function SectionTitle({ children, className = '' }) {
  return (
    <h2
      className={`font-display text-3xl font-semibold leading-[1.12] tracking-tight text-espresso md:text-[2.6rem] ${className}`}
    >
      {children}
    </h2>
  )
}

const buttonBase =
  'inline-flex items-center justify-center rounded-full font-display tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-glacial focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'

const buttonVariants = {
  primary: 'bg-glacial text-ivory hover:bg-glacial-deep text-sm font-semibold px-7 py-3.5 min-h-[48px]',
  secondary:
    'border border-espresso/40 bg-transparent text-espresso hover:border-espresso text-sm font-semibold px-7 py-3.5 min-h-[48px]',
  ghost: 'text-glacial-deep hover:text-espresso text-sm font-semibold px-4 py-3',
  // Highlighted CTA: larger, bolder, glacial-deep fill, with a soft
  // pulsing glow so it visually anchors every section that needs one.
  // Pulse is a CSS keyframe; disabled under prefers-reduced-motion.
  highlight:
    'highlight-cta relative bg-glacial-deep text-ivory hover:bg-espresso text-lg md:text-xl font-bold px-9 md:px-11 py-4 md:py-5 min-h-[58px] shadow-[0_10px_28px_-8px_rgba(82,128,141,0.65)]',
}

export function Button({ variant = 'primary', href = '#', children, className = '', ...rest }) {
  return (
    <a
      href={href}
      className={`${buttonBase} ${buttonVariants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  )
}

export function CiteMark({ n }) {
  return (
    <a
      href={`#references-${n}`}
      className="ml-1 font-display text-[10px] font-semibold text-glacial-deep align-super hover:text-espresso"
      aria-label={`Reference ${n}`}
    >
      [{n}]
    </a>
  )
}