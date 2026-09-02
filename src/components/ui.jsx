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
  'inline-flex items-center justify-center rounded-full font-display text-sm font-semibold tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-glacial focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'

const buttonVariants = {
  primary: 'bg-glacial text-ivory hover:bg-glacial-deep',
  secondary: 'border border-espresso/40 bg-transparent text-espresso hover:border-espresso',
  ghost: 'text-glacial-deep hover:text-espresso',
}

export function Button({ variant = 'primary', href = '#', children, className = '' }) {
  return (
    <a href={href} className={`${buttonBase} ${buttonVariants[variant]} px-7 py-3.5 min-h-[48px] ${className}`}>
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
