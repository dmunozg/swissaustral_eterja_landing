import { Container, Eyebrow, SectionTitle } from './ui'

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
    <section id="combination" className="bg-ivory">
      <Container className="py-24 md:py-32">
        <div className="max-w-3xl">
          <Eyebrow>The combination</Eyebrow>
          <SectionTitle className="mt-5">Two enzymes, one origin.</SectionTitle>
          <p className="mt-6 text-base leading-relaxed text-taupe md:text-lg">
            SwissAustral® Eterja SC is built from two recombinant enzymes,
            expressed as a defined complementary system. Both enzymes trace
            back to an organism identified in the Southern Patagonian Ice
            Field — selected because cold-adapted biology already does the
            chemistry the formulation needs.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
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
        </div>

        <p className="mt-10 text-center font-display text-base font-semibold tracking-tight text-espresso md:text-lg">
          Two recombinant enzymes. One defined complementary system, designed
          for cosmetic formulation.
        </p>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-taupe">
          <span className="font-display font-semibold uppercase tracking-[0.16em] text-espresso">
            Origin
          </span>{' '}
          — both enzymes are derived from a microorganism identified in the
          Southern Patagonian Ice Field.
        </p>

        <p className="mt-10 text-center text-sm leading-relaxed text-taupe">
          See the chemistry work, then{' '}
          <a
            href="#contact"
            className="font-semibold text-glacial-deep underline decoration-glacial/40 underline-offset-4 transition-colors hover:text-espresso"
          >
            start the technical conversation.
          </a>
        </p>
      </Container>
    </section>
  )
}
