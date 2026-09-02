import heroSkin from '../assets/hero-skin.jpg'
import { Button, Container, Eyebrow } from './ui'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-ivory">
      <Container className="grid min-h-[92svh] grid-cols-1 items-stretch gap-0 pt-28 md:grid-cols-[1.05fr_1fr] md:pt-0">
        {/* Copy panel */}
        <div className="flex flex-col justify-center px-6 py-16 md:px-10 md:py-24">
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

        {/* Visual panel */}
        <div className="relative min-h-[42svh] md:min-h-full">
          <img
            src={heroSkin}
            alt="Natural healthy skin texture in warm ivory tones"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-ivory via-transparent to-transparent md:w-1/3"
            aria-hidden="true"
          />
        </div>
      </Container>
    </section>
  )
}
