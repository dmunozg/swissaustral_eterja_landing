import { Container } from './ui'

export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <Container className="flex items-center justify-between py-6">
        <a href="#top" className="flex flex-col leading-none">
          <img
            src={`${import.meta.env.BASE_URL}logo_header.png`}
            alt="SWISSAUSTRAL®"
            width={1496}
            height={321}
            className="h-10 w-auto"
          />
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
