import heroMobile from '../assets/hero-mobile.jpg'
import heroDesktop from '../assets/hero-desktop.jpg'
import { Button, Container, Eyebrow } from './ui'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-ivory">
      <Container className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
        {/* Copy panel — below the image on mobile, left on desktop */}
        <div className="order-2 flex flex-col justify-center px-6 pb-12 pt-24 sm:pb-16 md:order-1 md:px-10 md:py-24">
          <Eyebrow>For skincare formulation teams</Eyebrow>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-espresso md:text-[3.4rem]">
            From the Patagonian ice field to your formulation.
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-taupe md:text-lg">
            SwissAustral® Eterja SC pairs recombinant superoxide dismutase and
            catalase in a complementary two-step system, rooted in an
            extremophilic organism from the Southern Patagonian Ice Field — a
            defined approach to managing superoxide and hydrogen peroxide in
            your formulations.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="#mechanism">Follow the Pathway</Button>
            <Button href="#contact" variant="secondary">
              Request the Technical Dossier
            </Button>
          </div>

          <div className="mt-14 border-t border-espresso/10 pt-6">
            <p className="font-display text-sm font-semibold tracking-tight text-espresso">
              SwissAustral® Eterja SC
            </p>
            <p className="mt-1 text-sm italic text-taupe">
              Recombinant SOD + Catalase System
            </p>
            <p className="mt-4 font-display text-[11px] font-medium uppercase tracking-[0.22em] text-glacial-deep">
              Enzyme discovery rooted in the Southern Patagonian Ice Field
            </p>
          </div>
        </div>

        {/* Visual panel — first in the fold on mobile */}
        <div className="order-1 relative md:order-2">
          {/* Mobile: full-bleed, faded into the copy below */}
          <div className="relative min-h-[44svh] md:hidden">
            <img
              src={heroMobile}
              alt="Natural healthy skin texture in warm ivory tones"
              className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
            />
            {/* Veil the top so the header stays legible over the image */}
            <div
              className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ivory/80 via-ivory/25 to-transparent"
              aria-hidden="true"
            />
            {/* Melt the image bottom into the copy panel below */}
            <div
              className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ivory to-transparent"
              aria-hidden="true"
            />
          </div>

          {/* Desktop: the full 3:4 composition, framed — nothing cropped */}
          <div className="hidden h-full flex-col items-center justify-center px-10 py-16 md:flex">
            <img
              src={heroDesktop}
              alt="Natural healthy skin texture in warm ivory tones"
              className="w-full max-w-[420px] rounded-lg border border-espresso/10 shadow-[0_32px_64px_-32px_rgba(46,38,32,0.35)]"
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
