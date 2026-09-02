import { Button, Container, Eyebrow } from './ui'

export default function Hero() {
  return (
    <section
      id="top"
      className="hero-background relative isolate min-h-[100svh] overflow-hidden bg-ivory"
    >
      <div
        className="absolute inset-0 -z-20 bg-[url(/hero-section-background.jpg)] bg-cover bg-no-repeat bg-scroll bg-position-[84%_50%] md:bg-fixed md:bg-position-[76%_40%]"
        aria-hidden="true"
      />
      <div className="hero-background__veil absolute inset-0 -z-10" aria-hidden="true" />

      <Container className="flex min-h-[100svh] items-end pb-14 pt-32 sm:pb-16 md:items-center md:py-28">
        <div className="hero-intro max-w-[650px] md:w-[52%]">
          <Eyebrow>For skincare formulation teams</Eyebrow>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-espresso sm:text-5xl md:text-[3.4rem]">
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
            <Button href="#contact" variant="highlightMd">
              Request the Technical Dossier
            </Button>
          </div>

          <div className="mt-12 max-w-xl border-t border-espresso/15 pt-5 md:mt-14">
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
      </Container>
    </section>
  )
}
