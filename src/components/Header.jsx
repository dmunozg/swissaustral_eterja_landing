import { Container } from './ui'

export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <Container className="flex items-center justify-between py-6">
        <a href="#top" className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-[0.14em] text-espresso">
            SWISSAUSTRAL<span className="text-terracotta">®</span>
          </span>
          <span className="mt-1 font-display text-[10px] font-medium uppercase tracking-[0.3em] text-taupe">
            Eterja SC
          </span>
        </a>
        <a
          href="#contact"
          className="hidden rounded-full border border-espresso/30 px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.16em] text-espresso transition-colors hover:border-espresso md:inline-flex"
        >
          Request the Technical Dossier
        </a>
      </Container>
    </header>
  )
}
