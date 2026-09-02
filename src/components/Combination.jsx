import vialsBand from '../assets/vials-band.jpg'
import Reveal from './Reveal'
import { Button, Container, Eyebrow, SectionTitle } from './ui'

const cards = [
  {
    name: 'SOD',
    sub: 'Superoxide dismutase, recombinant.',
    body: 'The first step of the tandem. Converts superoxide to hydrogen peroxide as the initial response to oxidative pressure at the skin surface.',
    scheme: 'Superoxide → Hydrogen peroxide',
  },
  {
    name: 'Catalase',
    sub: 'Catalase, recombinant.',
    body: 'The second step of the tandem. Breaks hydrogen peroxide down into water and oxygen, closing the pathway.',
    scheme: 'Hydrogen peroxide → Water + Oxygen',
  },
]

export default function Combination() {
  return (
    <section id="combination" className="seam-glacier-pale-to-ivory">
      <Container className="pt-24 md:pt-32">
        <Reveal className="max-w-3xl">
          <Eyebrow>The combination</Eyebrow>
          <SectionTitle className="mt-5">Two enzymes, one origin.</SectionTitle>
          <p className="mt-6 text-base leading-relaxed text-taupe md:text-lg">
            SwissAustral® Eterja SC is built from two recombinant enzymes,
            expressed as a defined complementary system. Both enzymes trace
            back to an organism identified in the Southern Patagonian Ice
            Field — selected because cold-adapted biology already does the
            chemistry the formulation needs.
          </p>
        </Reveal>
      </Container>

      {/* Editorial band: the system as a quiet laboratory still life */}
      <Reveal media className="mx-auto mt-14 w-full max-w-6xl px-6 md:px-10">
        <img
          src={vialsBand}
          alt="Two minimal amber glass vials with white cap bands on a warm ivory surface"
          className="h-52 w-full rounded-lg object-cover object-center sm:h-64 md:h-72"
        />
      </Reveal>
      <Reveal delay={150} className="mx-auto mt-3 w-full max-w-6xl px-6 md:px-10">
        <figcaption className="text-center font-display text-[11px] font-medium uppercase tracking-[0.2em] text-taupe">
          Two components. One defined system.
        </figcaption>
      </Reveal>

      <Container className="pt-14 pb-24 md:pb-32">
        <Reveal stag className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.name}
              className="flex flex-col rounded-lg border border-espresso/12 bg-ivory-deep p-8 md:p-10"
            >
              <p className="font-display text-2xl font-bold tracking-tight text-espresso">
                {card.name}
              </p>
              <p className="mt-1 text-sm italic text-taupe">{card.sub}</p>
              <p className="mt-5 flex-1 text-sm leading-relaxed text-taupe">
                {card.body}
              </p>
              <p className="mt-8 border-t border-espresso/10 pt-4 font-display text-[11px] font-medium uppercase tracking-[0.2em] text-glacial-deep">
                {card.scheme}
              </p>
            </article>
          ))}
        </Reveal>

        <Reveal className="mt-10">
          <p className="text-center font-display text-base font-semibold tracking-tight text-espresso md:text-lg">
            Two recombinant enzymes. One defined complementary system, designed
            for cosmetic formulation.
          </p>
        </Reveal>

        <Reveal className="mt-8">
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-taupe">
            <span className="font-display font-semibold uppercase tracking-[0.16em] text-espresso">
              Origin
            </span>{' '}
            — both enzymes are derived from a microorganism identified in the
            Southern Patagonian Ice Field.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-taupe">
            Ready to put a defined two-enzyme system into your next
            formulation?
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-8 flex justify-center">
          <Button href="#contact" variant="highlight">
            Request the Technical Dossier
          </Button>
        </Reveal>
      </Container>
    </section>
  )
}
