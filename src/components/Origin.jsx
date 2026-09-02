import glacier from '../assets/section3-glacier.jpg'
import Reveal from './Reveal'
import { Container, Eyebrow, SectionTitle } from './ui'

const enzymes = [
  {
    name: 'SOD',
    fullName: 'Superoxide dismutase',
    line: 'One component of the complementary system.',
  },
  {
    name: 'CATALASE',
    fullName: 'Catalase',
    line: 'The partner component of the system.',
  },
]

export default function Origin() {
  return (
    <section id="origin" className="seam-ivory-deep-to-ivory">
      <Container className="grid grid-cols-1 gap-0 py-24 md:grid-cols-[1.05fr_1fr] md:py-32">
        {/* Copy panel */}
        <Reveal className="flex flex-col justify-center px-6 py-12 md:px-10 md:py-20">
          <Eyebrow>Meet Eterja SC</Eyebrow>
          <SectionTitle className="mt-5">
            A defined enzyme system from the southern ice.
          </SectionTitle>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-taupe md:text-lg">
            SwissAustral® Eterja SC combines two recombinant enzymes —
            superoxide dismutase (SOD) and catalase — in one complementary
            system for skincare formulation development. Working in tandem,
            they help neutralize the reactivity associated with superoxide and
            the oxidative burden it creates.
          </p>

          {/* Provenance statement */}
          <div className="mt-10 border-l-2 border-glacial pl-6">
            <p className="font-display text-xl font-semibold leading-snug tracking-tight text-espresso md:text-2xl">
              Derived from an extremophilic microorganism native to the
              Southern Patagonian Ice Field.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-taupe">
              A recombinant enzyme system rooted in a microorganism adapted to
              one of the planet's most demanding environments.
            </p>
          </div>

          {/* Two-enzyme composition */}
          <Reveal stag className="mt-12 grid grid-cols-2 gap-6">
            {enzymes.map((enzyme) => (
              <div key={enzyme.name} className="border-t border-espresso/15 pt-5">
                <p className="font-display text-lg font-bold tracking-tight text-espresso">
                  {enzyme.name}
                </p>
                <p className="mt-1 text-sm italic text-taupe">
                  {enzyme.fullName}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-taupe">
                  {enzyme.line}
                </p>
              </div>
            ))}
          </Reveal>
          <p className="mt-8 font-display text-sm font-semibold uppercase tracking-[0.18em] text-glacial-deep">
            Two recombinant enzymes. One coordinated system.
          </p>

          {/* Transition to section 4 */}
          <div className="mt-12">
            <p className="text-base leading-relaxed text-espresso">
              Two enzymes. One coordinated response to oxidative reactivity.
            </p>
            <a
              href="#mechanism"
              className="mt-3 inline-flex items-center gap-2 font-display text-sm font-semibold text-glacial-deep transition-colors hover:text-espresso"
            >
              Next: how SOD and catalase work together
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </Reveal>

        {/* Glacier visual */}
        <Reveal media threshold={0.05} className="relative min-h-[50svh] md:min-h-full">
          <img
            src={glacier}
            alt="Glacier of the Southern Patagonian Ice Field between dark granite mountains"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-ivory/40 via-transparent to-transparent md:w-1/4"
            aria-hidden="true"
          />
        </Reveal>
      </Container>
    </section>
  )
}
